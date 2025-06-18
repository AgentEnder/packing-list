import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTimeSinceLastBuild } from './buildTime';

describe('buildTime utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all env mocks
    vi.unstubAllEnvs();
  });

  describe('getTimeSinceLastBuild', () => {
    it('returns formatted duration when valid build time is available', () => {
      // Mock a build time 2 minutes ago
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      vi.stubEnv('VITE_BUILD_TIME', twoMinutesAgo);

      const result = getTimeSinceLastBuild();
      expect(result).toMatch(/2m \d+s/);
    });

    it('returns "Unknown" when VITE_BUILD_TIME is not available', () => {
      // Ensure VITE_BUILD_TIME is not set
      vi.stubEnv('VITE_BUILD_TIME', undefined);

      const result = getTimeSinceLastBuild();
      expect(result).toBe('Unknown');
    });

    it('returns "Unknown" when VITE_BUILD_TIME is invalid', () => {
      vi.stubEnv('VITE_BUILD_TIME', 'invalid-date');

      const result = getTimeSinceLastBuild();
      expect(result).toBe('Unknown');
    });

    it('formats different time units correctly', () => {
      // Test seconds
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
      vi.stubEnv('VITE_BUILD_TIME', thirtySecondsAgo);

      let result = getTimeSinceLastBuild();
      expect(result).toBe('30s');

      // Test minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      vi.stubEnv('VITE_BUILD_TIME', fiveMinutesAgo);

      result = getTimeSinceLastBuild();
      expect(result).toBe('5m 0s');

      // Test hours
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toISOString();
      vi.stubEnv('VITE_BUILD_TIME', twoHoursAgo);

      result = getTimeSinceLastBuild();
      expect(result).toBe('2h 0m');

      // Test days
      const twoDaysAgo = new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString();
      vi.stubEnv('VITE_BUILD_TIME', twoDaysAgo);

      result = getTimeSinceLastBuild();
      expect(result).toBe('2d 0h');
    });

    it('returns "Just now" for very recent build times', () => {
      // Test very recent build time (less than 1 second ago)
      const justNow = new Date(Date.now() - 500).toISOString();
      vi.stubEnv('VITE_BUILD_TIME', justNow);

      const result = getTimeSinceLastBuild();
      expect(result).toBe('Just now');
    });
  });
});
