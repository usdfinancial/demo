// Database connection for demo mode - always uses mock connection
// This prevents PostgreSQL import errors

console.log('🎭 Demo Mode: Using mock database connection')

// Always use mock connection in demo mode to avoid PostgreSQL imports
export * from './mockConnection'
export { default } from './mockConnection'
