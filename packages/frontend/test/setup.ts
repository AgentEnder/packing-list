/* eslint-disable */
import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

declare module 'vitest' {
  interface Assertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

expect.extend(matchers);

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
