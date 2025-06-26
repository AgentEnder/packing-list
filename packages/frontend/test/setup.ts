/* eslint-disable */
import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import React from 'react';

declare module 'vitest' {
  interface Assertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

expect.extend(matchers);

// Mock vike-react usePageContext globally
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: vi.fn(() => ({
    urlPathname: '/',
    is404: false,
  })),
}));

// Mock vike router navigate
vi.mock('vike/client/router', () => ({
  navigate: vi.fn(),
}));

// Mock import.meta.hot for HMR testing
Object.defineProperty(import.meta, 'hot', {
  value: {
    on: vi.fn(),
    off: vi.fn(),
  },
  writable: true,
});

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    // Add any missing icons that tests need
    Wifi: (props: any) =>
      React.createElement('svg', { ...props, 'data-testid': 'wifi-icon' }),
    WifiOff: (props: any) =>
      React.createElement('svg', { ...props, 'data-testid': 'wifi-off-icon' }),
  };
});

// Mock environment variables for Supabase
process.env.PUBLIC_ENV__SUPABASE_URL = 'http://localhost:54321';
process.env.PUBLIC_ENV__SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock IndexedDB for Node.js test environment
const mockIndexedDB = {
  open: vi.fn(() => {
    const mockObjectStore = {
      put: vi.fn(),
      get: vi.fn(() => ({ onsuccess: null, onerror: null })),
      getAll: vi.fn(() => ({ onsuccess: null, onerror: null, result: [] })),
      delete: vi.fn(),
      clear: vi.fn(),
    };

    const mockTransaction = {
      objectStore: vi.fn(() => mockObjectStore),
      onsuccess: null as ((event: any) => void) | null,
      onerror: null as ((event: any) => void) | null,
    };

    const request = {
      result: {
        createObjectStore: vi.fn(() => mockObjectStore),
        transaction: vi.fn(() => mockTransaction),
      },
      onsuccess: null as ((event: any) => void) | null,
      onerror: null as ((event: any) => void) | null,
      onupgradeneeded: null as ((event: any) => void) | null,
    };

    // Simulate successful DB opening
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);

    return request;
  }),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock window.open for popup auth
Object.defineProperty(global, 'open', {
  value: vi.fn(() => ({
    closed: false,
    close: vi.fn(),
  })),
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress CSS parsing errors in JSDOM for advanced print CSS features
// JSDOM doesn't support @page rules, position: running(), and other print-specific CSS
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out JSDOM CSS parsing errors for print features
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Could not parse CSS stylesheet') ||
      args[0].includes('Error: Could not parse CSS') ||
      args[0].includes('JSDOM: Could not parse CSS'))
  ) {
    // Suppress these specific CSS parsing errors
    return;
  }
  originalConsoleError(...args);
};

// Clean up after each test
afterEach(() => {
  cleanup();
});
