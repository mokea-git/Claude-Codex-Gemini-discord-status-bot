const APIUsageTracker = require('../src/utils/apiUsage');

describe('APIUsageTracker', () => {
  describe('getClaudeUsage', () => {
    test('should return Claude usage data', async () => {
      const usage = await APIUsageTracker.getClaudeUsage();
      expect(usage).toBeDefined();
      expect(usage).toHaveProperty('tokens_used');
      expect(usage).toHaveProperty('context_tokens');
      expect(usage).toHaveProperty('output_tokens');
      expect(usage).toHaveProperty('requests');
      expect(usage).toHaveProperty('usage_percentage');
    });

    test('Claude usage should have numeric values', async () => {
      const usage = await APIUsageTracker.getClaudeUsage();
      expect(typeof usage.tokens_used).toBe('number');
      expect(typeof usage.requests).toBe('number');
      expect(typeof usage.usage_percentage).toBe('number');
    });
  });

  describe('getGeminiUsage', () => {
    test('should return Gemini usage data or null if no API key', async () => {
      const usage = await APIUsageTracker.getGeminiUsage();
      if (usage !== null) {
        expect(usage).toHaveProperty('tokens_used');
        expect(usage).toHaveProperty('requests');
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
        expect(usage).toHaveProperty('requests');
        expect(usage).toHaveProperty('usage_percentage');
        expect(typeof usage.tokens_used).toBe('number');
      }
    });
  });

  describe('getAllUsage', () => {
    test('should return all usage data', async () => {
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

    test('Claude data should always be available', async () => {
      const allUsage = await APIUsageTracker.getAllUsage();
      expect(allUsage.claude).not.toBeNull();
      expect(allUsage.claude).toHaveProperty('tokens_used');
    });
  });

  describe('formatUsageForEmbed', () => {
    test('should format usage data for Discord embed', async () => {
      const allUsage = await APIUsageTracker.getAllUsage();
      const fields = APIUsageTracker.formatUsageForEmbed(allUsage);

      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      // Check that each field has required properties
      fields.forEach(field => {
        expect(field).toHaveProperty('name');
        expect(field).toHaveProperty('value');
        expect(field).toHaveProperty('inline');
      });
    });

    test('embed fields should contain Claude (always available)', async () => {
      const allUsage = await APIUsageTracker.getAllUsage();
      const fields = APIUsageTracker.formatUsageForEmbed(allUsage);
      const fieldNames = fields.map(f => f.name);

      expect(fieldNames.some(name => name.includes('Claude'))).toBe(true);
    });

    test('fields should have proper formatting', async () => {
      const allUsage = await APIUsageTracker.getAllUsage();
      const fields = APIUsageTracker.formatUsageForEmbed(allUsage);

      fields.forEach(field => {
        expect(field.name).toBeTruthy();
        expect(field.value).toBeTruthy();
        expect(field.value).toContain('`'); // Should contain backticks for formatting
      });
    });
  });
});
