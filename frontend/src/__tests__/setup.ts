import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock pour window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Mock pour localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock pour fetch
vi.stubGlobal('fetch', vi.fn());

// Mock pour scrollTo
window.scrollTo = vi.fn();

// Mock pour print
window.print = vi.fn();

// Mock pour ResizeObserver
class ResizeObserverMock {
  observe() { }
  unobserve() { }
  disconnect() { }
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Cleanup apres chaque test
afterEach(() => {
  vi.clearAllMocks();
});
