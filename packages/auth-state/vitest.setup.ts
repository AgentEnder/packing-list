import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock import.meta.env to prevent SSR mode detection
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        SSR: false,
        PUBLIC_ENV__SUPABASE_URL: 'https://test.supabase.co',
      },
    },
  },
  writable: true,
});

// Mock IndexedDB globally
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {},
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
  })),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => undefined);
vi.spyOn(console, 'warn').mockImplementation(() => undefined);
vi.spyOn(console, 'error').mockImplementation(() => undefined);
