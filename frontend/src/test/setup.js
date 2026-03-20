import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: true,
    VITE_API_URL: 'http://localhost:3001'
  },
  writable: true
});

// jsdom: Element.prototype.scrollIntoView is missing
Element.prototype.scrollIntoView = vi.fn();

