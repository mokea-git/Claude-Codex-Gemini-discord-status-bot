const axios = require('axios');

class APIUsageTracker {
  /**
   * Get Claude API usage (including context window usage)
   * Supports both API key and OAuth token authentication
   * - API Key: ANTHROPIC_API_KEY
   * - OAuth Token: CLAUDE_CODE_OAUTH_TOKEN
   */
  static async getClaudeUsage() {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;

      if (!apiKey && !oauthToken) {
        console.warn('Claude credentials not found (API key or OAuth token required)');
        return null;
      }

      const headers = {
        'anthropic-version': '2023-06-01',
      };

      // Use OAuth token if available, otherwise use API key
      if (oauthToken) {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      } else {
        headers['x-api-key'] = apiKey;
      }

      // Claude API usage endpoint
      const response = await axios.get('https://api.anthropic.com/v1/usage', {
        headers,
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
        auth_method: oauthToken ? 'oauth' : 'api_key',
      };
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Claude authentication failed - invalid credentials');
      } else {
        console.error('Error fetching Claude usage:', error.message);
      }
      return null;
    }
  }

  /**
   * Get Gemini API usage
   * Requires GOOGLE_API_KEY in environment variables
   * Note: Gemini doesn't have OAuth token support yet
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
        auth_method: 'api_key',
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
   * Get Codex API usage (OpenAI)
   * Supports both API key and OAuth token authentication
   * - API Key: CODEX_API_KEY
   * - OAuth Token: OPENAI_OAUTH_TOKEN
   */
  static async getCodexUsage() {
    try {
      const apiKey = process.env.CODEX_API_KEY;
      const oauthToken = process.env.OPENAI_OAUTH_TOKEN;

      if (!apiKey && !oauthToken) {
        console.warn('OpenAI credentials not found (API key or OAuth token required)');
        return null;
      }

      const headers = {};

      // Use OAuth token if available, otherwise use API key
      if (oauthToken) {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // OpenAI API usage endpoint
      const response = await axios.get('https://api.openai.com/dashboard/billing/usage', {
        headers,
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
        auth_method: oauthToken ? 'oauth' : 'api_key',
      };
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('OpenAI authentication failed - invalid credentials');
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
      const authBadge = usageData.claude.auth_method === 'oauth' ? '🔐' : '🔑';
      const claudeValue = `${authBadge} Tokens: \`${usageData.claude.tokens_used.toLocaleString()}\`
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
      const geminiValue = `🔑 Tokens: \`${usageData.gemini.tokens_used.toLocaleString()}\`
Usage: \`${usageData.gemini.usage_percentage}%\``;

      fields.push({
        name: '✨ Gemini',
        value: geminiValue,
        inline: true,
      });
    }

    if (usageData.codex) {
      const authBadge = usageData.codex.auth_method === 'oauth' ? '🔐' : '🔑';
      const codexValue = `${authBadge} Tokens: \`${usageData.codex.tokens_used.toLocaleString()}\`
Usage: \`${usageData.codex.usage_percentage}%\``;

      fields.push({
        name: '💻 Codex',
        value: codexValue,
        inline: true,
      });
    }

    if (!usageData.claude && !usageData.gemini && !usageData.codex) {
      fields.push({
        name: '⚠️ No Credentials Configured',
        value: `Please set one of:
Claude: \`ANTHROPIC_API_KEY\` or \`CLAUDE_CODE_OAUTH_TOKEN\`
Gemini: \`GOOGLE_API_KEY\`
Codex: \`CODEX_API_KEY\` or \`OPENAI_OAUTH_TOKEN\``,
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
      const authMethod = usageData.claude.auth_method === 'oauth' ? '(OAuth)' : '(API Key)';
      lines.push(`Claude ${authMethod}: ${usageData.claude.tokens_used.toLocaleString()} tokens (${usageData.claude.usage_percentage}%)`);
    }

    if (usageData.gemini) {
      lines.push(`Gemini (API Key): ${usageData.gemini.tokens_used.toLocaleString()} tokens (${usageData.gemini.usage_percentage}%)`);
    }

    if (usageData.codex) {
      const authMethod = usageData.codex.auth_method === 'oauth' ? '(OAuth)' : '(API Key)';
      lines.push(`Codex ${authMethod}: ${usageData.codex.tokens_used.toLocaleString()} tokens (${usageData.codex.usage_percentage}%)`);
    }

    return lines.join('\n');
  }

  /**
   * Get authentication status
   */
  static getAuthStatus() {
    const status = {
      claude: {
        api_key: !!process.env.ANTHROPIC_API_KEY,
        oauth: !!process.env.CLAUDE_CODE_OAUTH_TOKEN,
      },
      gemini: {
        api_key: !!process.env.GOOGLE_API_KEY,
      },
      codex: {
        api_key: !!process.env.CODEX_API_KEY,
        oauth: !!process.env.OPENAI_OAUTH_TOKEN,
      },
    };

    return status;
  }
}

module.exports = APIUsageTracker;
