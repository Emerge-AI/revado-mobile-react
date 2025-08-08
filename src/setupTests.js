import '@testing-library/jest-dom';

// Mock modules that are not available in test environment
global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () {},
  };
};

// Mock HTML5 canvas
global.HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock URL.createObjectURL for file testing
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader for base64 conversion
global.FileReader = class FileReader {
  readAsDataURL() {
    this.onload({ target: { result: 'data:image/png;base64,mock-base64-data' } });
  }
  readAsText() {
    this.onload({ target: { result: 'mock-text-content' } });
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only log actual errors, not React warnings in tests
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleError.apply(console, args);
};