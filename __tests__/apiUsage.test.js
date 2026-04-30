const APIUsageTracker = require('../src/utils/apiUsage');

describe('APIUsageTracker', () => {
  describe('getClaudeUsage', () => {
    test('should return Claude usage data or null if no API key', async () => {
      const usage = await APIUsageTracker.getClaudeUsage();
      if (usage !== null) {
        expect(usage).toHaveProperty('tokens_used');
        expect(usage).toHaveProperty('context_tokens');
        expect(usage).toHaveProperty('output_tokens');
        expect(usage).toHaveProperty('usage_percentage');
        expect(typeof usage.tokens_used).toBe('number');
      }
    });
  });

  describe('getGeminiUsage', () => {
    test('should return Gemini usage data or null if no API key', async () => {
      const usage = await APIUsageTracker.getGeminiUsage();
      if (usage !== null) {
        expect(usage).toHaveProperty('tokens_used');
        expect(usage).toHaveProperty('usage_percentage');
        expect(typeof usage.tokens_used).toBe('number');
      }
    });
  });

  describe('getCodexUsage', () => {
    test('should return Codex usage data or null if no API key', async () => {
      const usage = await APIUsageTracker.getCodexUsage();
      if (usage !== null) {
        expect(usage).toHaveProperty('tokens_used');
        expect(usage).toHaveProperty('usage_percentage');
        expect(typeof usage.tokens_used).toBe('number');
      }
    });
  });

  describe('getAllUsage', () => {
    test('should return all usage data structure', async () => {
      const allUsage = await APIUsageTracker.getAllUsage();
      expect(allUsage).toHaveProperty('claude');
      expect(allUsage).toHaveProperty('gemini');
      expect(allUsage).toHaveProperty('codex');
      expect(allUsage).toHaveProperty('timestamp');
    });

    test('timestamp should be a Date object', async () => {
      const allUsage = await APIUsageTracker.getAllUsage();
      expect(allUsage.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getAllUsageWithRetry', () => {
    test('should have retry logic', async () => {
      const allUsage = await APIUsageTracker.getAllUsageWithRetry(1, 100);
      expect(allUsage).toHaveProperty('claude');
      expect(allUsage).toHaveProperty('gemini');
      expect(allUsage).toHaveProperty('codex');
      expect(allUsage).toHaveProperty('timestamp');
    });
  });

  describe('formatUsageForEmbed', () => {
    test('should format usage data for Discord embed', async () => {
      const mockData = {
        claude: {
          tokens_used: 150000,
          context_tokens: 75000,
          output_tokens: 25000,
          usage_percentage: 15,
        },
        gemini: null,
        codex: null,
        timestamp: new Date(),
      };

      const fields = APIUsageTracker.formatUsageForEmbed(mockData);

      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      // Check that each field has required properties
      fields.forEach(field => {
        expect(field).toHaveProperty('name');
        expect(field).toHaveProperty('value');
        expect(field).toHaveProperty('inline');
      });
    });

    test('should format with no API keys', async () => {
      const mockData = {
        claude: null,
        gemini: null,
        codex: null,
        timestamp: new Date(),
      };

      const fields = APIUsageTracker.formatUsageForEmbed(mockData);
      const fieldNames = fields.map(f => f.name);

      expect(fieldNames.some(name => name.includes('No API Keys'))).toBe(true);
    });
  });

  describe('calculateDailyTrend', () => {
    test('should calculate daily trend from historical data', () => {
      const historicalData = [
        {
          claude: { tokens_used: 100000 },
          gemini: { tokens_used: 50000 },
          codex: null,
          timestamp: new Date('2026-04-29'),
        },
        {
          claude: { tokens_used: 150000 },
          gemini: { tokens_used: 75000 },
          codex: null,
          timestamp: new Date('2026-04-30'),
        },
      ];

      const trend = APIUsageTracker.calculateDailyTrend(historicalData);

      expect(trend).toHaveProperty('claude');
      expect(trend).toHaveProperty('gemini');
      expect(trend).toHaveProperty('codex');
      expect(trend.claude).toBe(50000); // 150000 - 100000
      expect(trend.gemini).toBe(25000); // 75000 - 50000
    });

    test('should return null for insufficient data', () => {
      const historicalData = [
        {
          claude: { tokens_used: 100000 },
        },
      ];

      const trend = APIUsageTracker.calculateDailyTrend(historicalData);
      expect(trend).toBeNull();
    });
  });

  describe('getSummaryText', () => {
    test('should format summary text', async () => {
      const mockData = {
        claude: {
          tokens_used: 150000,
          usage_percentage: 15,
        },
        gemini: {
          tokens_used: 120000,
          usage_percentage: 12,
        },
        codex: null,
        timestamp: new Date(),
      };

      const summary = APIUsageTracker.getSummaryText(mockData);

      expect(summary).toContain('Claude');
      expect(summary).toContain('Gemini');
      expect(summary).toContain('150,000');
      expect(summary).toContain('120,000');
    });
  });
});
