import { describe, expect, it } from 'vitest';
import { applyBaseUrl } from '../apply-base-url.js';

describe('apply-base-url', () => {
  it('should apply base url to url', () => {
    expect(applyBaseUrl('https://example.com', '/test')).toBe(
      'https://example.com/test'
    );
  });

  it('should avoid double slashes', () => {
    expect(applyBaseUrl('https://example.com/', '/test')).toBe(
      'https://example.com/test'
    );
  });

  it('should avoid no slash', () => {
    expect(applyBaseUrl('https://example.com', 'test')).toBe(
      'https://example.com/test'
    );
  });

  it('should not mutate external urls', () => {
    expect(applyBaseUrl('https://example.com/', 'https://other.com/test')).toBe(
      'https://other.com/test'
    );
  });

  it('should handle null or undefined base url', () => {
    expect(applyBaseUrl(null, '/test')).toBe('/test');
    expect(applyBaseUrl(undefined, '/test')).toBe('/test');
  });

  it('should handle empty base url', () => {
    expect(applyBaseUrl('', '/test')).toBe('/test');
  });

  it('should handle navigation to root', () => {
    expect(applyBaseUrl('/packing-list/', '/')).toBe('/packing-list/');
  });
});
