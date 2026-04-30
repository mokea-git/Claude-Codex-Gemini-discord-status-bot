const axios = require('axios');

class APIUsageTracker {
  /**
   * Get Claude API usage (including context window usage)
   * Requires ANTHROPIC_API_KEY in environment variables
   */
  static async getClaudeUsage() {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('Claude API key not found, returning null');
        return null;
      }

      // Claude API usage endpoint
      const response = await axios.get('https://api.anthropic.com/v1/usage', {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      });

      const data = response.data;

      // Calculate usage percentage (assuming 1M tokens per month limit)
      const monthlyLimit = 1000000;
      const usage_percentage = Math.round((data.input_tokens + data.output_tokens) / monthlyLimit * 100);

      return {
        tokens_used: data.input_tokens + data.output_tokens,
        context_tokens: data.input_tokens,
        output_tokens: data.output_tokens,
        requests: data.requests || 0,
        usage_percentage: Math.min(usage_percentage, 100),
        reset_date: data.reset_date || null,
      };
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Claude API authentication failed - invalid key');
      } else {
        console.error('Error fetching Claude usage:', error.message);
      }
      return null;
    }
  }

  /**
   * Get Gemini API usage
   * Requires GOOGLE_API_KEY in environment variables
   */
  static async getGeminiUsage() {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        console.warn('Google API key not found, returning null');
        return null;
      }

      // Google Generative AI quota endpoint
      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/info/google?key=${process.env.GOOGLE_API_KEY}`
      );

      const quotaData = response.data.quota || {};
      const usedTokens = quotaData.usedTokens || 0;
      const monthlyLimit = quotaData.monthlyLimitTokens || 1000000;
      const usage_percentage = Math.round((usedTokens / monthlyLimit) * 100);

      return {
        tokens_used: usedTokens,
        requests: quotaData.requestsPerMinute || 0,
        usage_percentage: Math.min(usage_percentage, 100),
        monthly_limit: monthlyLimit,
      };
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Google API authentication failed - invalid key');
      } else if (error.response?.status === 429) {
        console.error('Google API rate limit exceeded');
      } else {
        console.error('Error fetching Gemini usage:', error.message);
      }
      return null;
    }
  }

  /**
   * Get Codex API usage
   * Requires CODEX_API_KEY in environment variables
   */
  static async getCodexUsage() {
    try {
      if (!process.env.CODEX_API_KEY) {
        console.warn('Codex API key not found, returning null');
        return null;
      }

      // Codex/OpenAI API usage endpoint
      const response = await axios.get('https://api.openai.com/dashboard/billing/usage', {
        headers: {
          'Authorization': `Bearer ${process.env.CODEX_API_KEY}`,
        },
      });

      const data = response.data;
      const totalUsage = data.total_usage || 0;
      const monthlyLimit = 1000000; // Default monthly limit
      const usage_percentage = Math.round((totalUsage / monthlyLimit) * 100);

      return {
        tokens_used: totalUsage,
        requests: data.requests || 0,
        usage_percentage: Math.min(usage_percentage, 100),
        daily_costs: data.daily_costs || [],
      };
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Codex API authentication failed - invalid key');
      } else {
        console.error('Error fetching Codex usage:', error.message);
      }
      return null;
    }
  }

  /**
   * Get all usage data in parallel
   */
  static async getAllUsage() {
    const [claude, gemini, codex] = await Promise.all([
      this.getClaudeUsage(),
      this.getGeminiUsage(),
      this.getCodexUsage(),
    ]);

    return {
      claude,
      gemini,
      codex,
      timestamp: new Date(),
    };
  }

  /**
   * Get usage data with retry logic
   * @param {number} retries - Number of retries (default: 3)
   * @param {number} delay - Delay between retries in ms (default: 1000)
   */
  static async getAllUsageWithRetry(retries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        const data = await this.getAllUsage();
        // If at least one service has data, consider it successful
        if (data.claude || data.gemini || data.codex) {
          return data;
        }
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('Failed to fetch usage data after retries:', lastError);
    return {
      claude: null,
      gemini: null,
      codex: null,
      timestamp: new Date(),
      error: lastError?.message,
    };
  }

  /**
   * Format usage data for Discord embed
   */
  static formatUsageForEmbed(usageData) {
    const fields = [];

    if (usageData.claude) {
      const claudeValue = `Tokens: \`${usageData.claude.tokens_used.toLocaleString()}\`
Context: \`${usageData.claude.context_tokens.toLocaleString()}\`
Output: \`${usageData.claude.output_tokens.toLocaleString()}\`
Usage: \`${usageData.claude.usage_percentage}%\``;

      fields.push({
        name: '🤖 Claude',
        value: claudeValue,
        inline: true,
      });
    }

    if (usageData.gemini) {
      const geminiValue = `Tokens: \`${usageData.gemini.tokens_used.toLocaleString()}\`
Usage: \`${usageData.gemini.usage_percentage}%\``;

      fields.push({
        name: '✨ Gemini',
        value: geminiValue,
        inline: true,
      });
    }

    if (usageData.codex) {
      const codexValue = `Tokens: \`${usageData.codex.tokens_used.toLocaleString()}\`
Usage: \`${usageData.codex.usage_percentage}%\``;

      fields.push({
        name: '💻 Codex',
        value: codexValue,
        inline: true,
      });
    }

    if (!usageData.claude && !usageData.gemini && !usageData.codex) {
      fields.push({
        name: '⚠️ No API Keys Configured',
        value: 'Please set API keys in `.env` file to track usage',
        inline: false,
      });
    }

    return fields;
  }

  /**
   * Calculate daily usage trend
   */
  static calculateDailyTrend(historicalData) {
    if (!historicalData || historicalData.length < 2) {
      return null;
    }

    const today = historicalData[historicalData.length - 1];
    const yesterday = historicalData[historicalData.length - 2];

    const claudeTrend = today.claude?.tokens_used - yesterday.claude?.tokens_used;
    const geminiTrend = today.gemini?.tokens_used - yesterday.gemini?.tokens_used;
    const codexTrend = today.codex?.tokens_used - yesterday.codex?.tokens_used;

    return {
      claude: claudeTrend,
      gemini: geminiTrend,
      codex: codexTrend,
    };
  }

  /**
   * Get usage summary as text
   */
  static getSummaryText(usageData) {
    const lines = [];

    if (usageData.claude) {
      lines.push(`Claude: ${usageData.claude.tokens_used.toLocaleString()} tokens (${usageData.claude.usage_percentage}%)`);
    }

    if (usageData.gemini) {
      lines.push(`Gemini: ${usageData.gemini.tokens_used.toLocaleString()} tokens (${usageData.gemini.usage_percentage}%)`);
    }

    if (usageData.codex) {
      lines.push(`Codex: ${usageData.codex.tokens_used.toLocaleString()} tokens (${usageData.codex.usage_percentage}%)`);
    }

    return lines.join('\n');
  }
}

module.exports = APIUsageTracker;
