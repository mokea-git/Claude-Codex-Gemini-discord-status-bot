const axios = require('axios');

class APIUsageTracker {
  /**
   * Get Claude API usage (including context window usage)
   */
  static async getClaudeUsage() {
    try {
      // Note: This would require Anthropic's usage API endpoint
      // For now, returning mock data structure
      return {
        tokens_used: 150000,
        context_tokens: 75000,
        output_tokens: 25000,
        requests: 450,
        usage_percentage: 15,
      };
    } catch (error) {
      console.error('Error fetching Claude usage:', error);
      return null;
    }
  }

  /**
   * Get Gemini API usage
   */
  static async getGeminiUsage() {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        return null;
      }

      // Note: This would require Google's usage API
      // For now, returning mock data structure
      return {
        tokens_used: 120000,
        requests: 380,
        usage_percentage: 12,
      };
    } catch (error) {
      console.error('Error fetching Gemini usage:', error);
      return null;
    }
  }

  /**
   * Get Codex API usage
   */
  static async getCodexUsage() {
    try {
      if (!process.env.CODEX_API_KEY) {
        return null;
      }

      // Note: This would require Codex's usage API
      // For now, returning mock data structure
      return {
        tokens_used: 80000,
        requests: 220,
        usage_percentage: 8,
      };
    } catch (error) {
      console.error('Error fetching Codex usage:', error);
      return null;
    }
  }

  /**
   * Get all usage data
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
   * Format usage data for Discord embed
   */
  static formatUsageForEmbed(usageData) {
    const fields = [];

    if (usageData.claude) {
      fields.push({
        name: '🤖 Claude',
        value: `Tokens: \`${usageData.claude.tokens_used}\`\nContext: \`${usageData.claude.context_tokens}\`\nRequests: \`${usageData.claude.requests}\`\nUsage: \`${usageData.claude.usage_percentage}%\``,
        inline: true,
      });
    }

    if (usageData.gemini) {
      fields.push({
        name: '✨ Gemini',
        value: `Tokens: \`${usageData.gemini.tokens_used}\`\nRequests: \`${usageData.gemini.requests}\`\nUsage: \`${usageData.gemini.usage_percentage}%\``,
        inline: true,
      });
    }

    if (usageData.codex) {
      fields.push({
        name: '💻 Codex',
        value: `Tokens: \`${usageData.codex.tokens_used}\`\nRequests: \`${usageData.codex.requests}\`\nUsage: \`${usageData.codex.usage_percentage}%\``,
        inline: true,
      });
    }

    return fields;
  }
}

module.exports = APIUsageTracker;
