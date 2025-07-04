import { describe, it, expect, afterEach } from 'vitest';
import {
  isDemoMode,
  shouldSkipPersistence,
  isDemoTripId,
  isDemoEntityId,
} from './demo-mode-detector.js';

const { sessionStorage } = globalThis as unknown as {
  sessionStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    clear: () => void;
  };
};

describe('demo mode detector', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('detects demo mode from session choice', () => {
    sessionStorage.setItem('session-demo-choice', 'demo');
    expect(isDemoMode()).toBe(true);
  });

  it('skips persistence when demo trip selected', () => {
    sessionStorage.setItem(
      'redux-state',
      JSON.stringify({ trips: { selectedTripId: 'DEMO_TRIP' } })
    );
    expect(shouldSkipPersistence('DEMO_TRIP')).toBe(true);
  });

  it('detects demo ids', () => {
    expect(isDemoTripId('demo-trip')).toBe(true);
    expect(isDemoEntityId('demo-person')).toBe(true);
  });
});