import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Mock environment variables
process.env.NEXT_PUBLIC_ALCHEMY_API_KEY = 'test-alchemy-key'
process.env.NEXT_PUBLIC_ALCHEMY_APP_ID = 'test-alchemy-app-id'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
// NODE_ENV is readonly, so we need to mock it differently
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true
})

// Add TextEncoder/TextDecoder to global scope for Node.js compatibility
global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

// Mock crypto.getRandomValues for testing environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Suppress console warnings in tests unless explicitly testing them
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeEach(() => {
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})

// Global test timeout
jest.setTimeout(30000)

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

// Reset all mocks after each test
afterEach(() => {
  jest.resetAllMocks()
  jest.clearAllTimers()
})