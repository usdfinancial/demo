import { Pool, Client } from 'pg'
import { testData } from './testHelpers'

export interface TestDatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
}

export class TestDatabaseManager {
  private pool: Pool | null = null
  private client: Client | null = null
  private config: TestDatabaseConfig

  constructor(config?: Partial<TestDatabaseConfig>) {
    this.config = {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: process.env.TEST_DB_NAME || 'usd_financial_test',
      username: process.env.TEST_DB_USER || 'test_user',
      password: process.env.TEST_DB_PASSWORD || 'test_password',
      ssl: process.env.TEST_DB_SSL === 'true',
      ...config
    }
  }

  /**
   * Initialize the test database connection pool
   */
  async initialize(): Promise<void> {
    if (this.pool) {
      return // Already initialized
    }

    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    })

    // Test the connection
    try {
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()
      console.log('✅ Test database connection established')
    } catch (error) {
      console.error('❌ Failed to connect to test database:', error)
      throw error
    }
  }

  /**
   * Create the test database schema
   */
  async createSchema(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized')
    }

    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          wallet_address VARCHAR(42) UNIQUE NOT NULL,
          email VARCHAR(255),
          display_name VARCHAR(100),
          is_verified BOOLEAN DEFAULT false,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      // Create transactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          tx_hash VARCHAR(66),
          transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('transfer', 'deposit', 'withdraw', 'swap', 'investment', 'yield')),
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
          amount DECIMAL(36, 18) NOT NULL,
          fee_amount DECIMAL(36, 18) DEFAULT 0,
          stablecoin VARCHAR(10) NOT NULL CHECK (stablecoin IN ('USDC', 'USDT', 'DAI', 'FRAX', 'TUSD', 'BUSD')),
          chain_id VARCHAR(10) NOT NULL,
          from_address VARCHAR(42),
          to_address VARCHAR(42),
          from_chain VARCHAR(10),
          to_chain VARCHAR(10),
          protocol_name VARCHAR(50),
          description TEXT,
          metadata JSONB DEFAULT '{}',
          block_number BIGINT,
          block_timestamp TIMESTAMP WITH TIME ZONE,
          gas_used BIGINT,
          gas_price DECIMAL(36, 0),
          confirmed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      // Create tokenized_assets table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tokenized_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          symbol VARCHAR(20) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          current_price DECIMAL(36, 18) NOT NULL DEFAULT 0,
          current_apy DECIMAL(8, 4),
          risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
          provider VARCHAR(100),
          contract_address VARCHAR(42),
          chain_id VARCHAR(10),
          market_cap DECIMAL(36, 2),
          features TEXT[],
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      // Create user_investments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_investments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          asset_id UUID NOT NULL REFERENCES tokenized_assets(id) ON DELETE CASCADE,
          quantity DECIMAL(36, 18) NOT NULL,
          average_cost DECIMAL(36, 18) NOT NULL,
          total_invested DECIMAL(36, 18) NOT NULL,
          current_value DECIMAL(36, 18) NOT NULL DEFAULT 0,
          unrealized_pnl DECIMAL(36, 18) NOT NULL DEFAULT 0,
          currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
          first_purchase_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_purchase_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, asset_id)
        )
      `)

      // Create defi_protocols table
      await client.query(`
        CREATE TABLE IF NOT EXISTS defi_protocols (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          protocol_key VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          website_url VARCHAR(255),
          logo_url VARCHAR(255),
          risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
          supported_chains TEXT[] DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      // Create protocol_configurations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS protocol_configurations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          protocol_id UUID NOT NULL REFERENCES defi_protocols(id) ON DELETE CASCADE,
          chain_id VARCHAR(10) NOT NULL,
          contract_address VARCHAR(42),
          current_apy DECIMAL(8, 4),
          tvl_usd DECIMAL(36, 2),
          min_deposit DECIMAL(36, 18),
          max_deposit DECIMAL(36, 18),
          lock_period_days INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      // Create yield_positions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS yield_positions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          protocol_id UUID NOT NULL REFERENCES defi_protocols(id) ON DELETE CASCADE,
          deposit_amount DECIMAL(36, 18) NOT NULL,
          earned_yield DECIMAL(36, 18) DEFAULT 0,
          current_apy DECIMAL(8, 4),
          deposit_tx_hash VARCHAR(66),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      // Create auto_invest_plans table
      await client.query(`
        CREATE TABLE IF NOT EXISTS auto_invest_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          strategy VARCHAR(50) NOT NULL,
          frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
          amount DECIMAL(36, 18) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
          is_active BOOLEAN DEFAULT true,
          next_execution_at TIMESTAMP WITH TIME ZONE,
          total_invested DECIMAL(36, 18) DEFAULT 0,
          execution_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      // Create auto_invest_allocations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS auto_invest_allocations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plan_id UUID NOT NULL REFERENCES auto_invest_plans(id) ON DELETE CASCADE,
          asset_id UUID NOT NULL REFERENCES tokenized_assets(id) ON DELETE CASCADE,
          allocation_percentage DECIMAL(5, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(plan_id, asset_id)
        )
      `)

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
        CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
        CREATE INDEX IF NOT EXISTS idx_user_investments_user_id ON user_investments(user_id);
        CREATE INDEX IF NOT EXISTS idx_yield_positions_user_id ON yield_positions(user_id);
        CREATE INDEX IF NOT EXISTS idx_yield_positions_protocol_id ON yield_positions(protocol_id);
      `)

      await client.query('COMMIT')
      console.log('✅ Test database schema created successfully')

    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to create test database schema:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Seed the test database with initial data
   */
  async seedData(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized')
    }

    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Create test users
      const testUsers = [
        {
          id: testData.uuid(),
          wallet_address: '0x742b5c3f7b0c9c2f8b7c8b7c8b7c8b7c8b7c8b7c',
          email: 'test@example.com',
          display_name: 'Test User',
          is_verified: true
        },
        {
          id: testData.uuid(),
          wallet_address: '0x2226bDB4F36fb86698db9340111803577b5a4114',
          email: 'smartwallet@example.com',
          display_name: 'Smart Wallet User',
          is_verified: true
        }
      ]

      for (const user of testUsers) {
        await client.query(`
          INSERT INTO users (id, wallet_address, email, display_name, is_verified)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (wallet_address) DO NOTHING
        `, [user.id, user.wallet_address, user.email, user.display_name, user.is_verified])
      }

      // Create test tokenized assets
      const testAssets = [
        {
          name: 'Tech Growth ETF',
          symbol: 'TECH',
          description: 'Diversified technology sector ETF',
          category: 'etf',
          current_price: '100.50',
          current_apy: '12.5',
          risk_level: 'Medium',
          provider: 'USD Financial',
          market_cap: '50000000.00'
        },
        {
          name: 'Stable Income Bond Fund',
          symbol: 'BOND',
          description: 'Conservative bond fund for stable returns',
          category: 'bond',
          current_price: '50.25',
          current_apy: '4.2',
          risk_level: 'Low',
          provider: 'USD Financial',
          market_cap: '25000000.00'
        },
        {
          name: 'Crypto Index',
          symbol: 'CRYPTO',
          description: 'Diversified cryptocurrency index fund',
          category: 'crypto',
          current_price: '200.75',
          current_apy: '18.7',
          risk_level: 'High',
          provider: 'USD Financial',
          market_cap: '75000000.00'
        }
      ]

      for (const asset of testAssets) {
        await client.query(`
          INSERT INTO tokenized_assets (name, symbol, description, category, current_price, current_apy, risk_level, provider, market_cap)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
        `, [
          asset.name, asset.symbol, asset.description, asset.category, 
          asset.current_price, asset.current_apy, asset.risk_level, 
          asset.provider, asset.market_cap
        ])
      }

      // Create test DeFi protocols
      const testProtocols = [
        {
          name: 'Aave',
          protocol_key: 'aave',
          description: 'Decentralized lending protocol',
          website_url: 'https://aave.com',
          risk_level: 'Medium',
          supported_chains: ['1', '137', '42161']
        },
        {
          name: 'Compound',
          protocol_key: 'compound',
          description: 'Algorithmic money market protocol',
          website_url: 'https://compound.finance',
          risk_level: 'Medium',
          supported_chains: ['1', '137']
        },
        {
          name: 'Yearn',
          protocol_key: 'yearn',
          description: 'Yield farming aggregator',
          website_url: 'https://yearn.finance',
          risk_level: 'High',
          supported_chains: ['1', '42161']
        }
      ]

      for (const protocol of testProtocols) {
        await client.query(`
          INSERT INTO defi_protocols (name, protocol_key, description, website_url, risk_level, supported_chains)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (protocol_key) DO NOTHING
        `, [
          protocol.name, protocol.protocol_key, protocol.description,
          protocol.website_url, protocol.risk_level, protocol.supported_chains
        ])
      }

      await client.query('COMMIT')
      console.log('✅ Test database seeded successfully')

    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to seed test database:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    if (!this.pool) {
      return
    }

    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Delete data in reverse dependency order
      await client.query('DELETE FROM auto_invest_allocations')
      await client.query('DELETE FROM auto_invest_plans')
      await client.query('DELETE FROM yield_positions')
      await client.query('DELETE FROM protocol_configurations')
      await client.query('DELETE FROM defi_protocols')
      await client.query('DELETE FROM user_investments')
      await client.query('DELETE FROM tokenized_assets')
      await client.query('DELETE FROM transactions')
      await client.query('DELETE FROM users')

      await client.query('COMMIT')
      console.log('✅ Test database cleaned up successfully')

    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to clean up test database:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Drop all test tables
   */
  async dropSchema(): Promise<void> {
    if (!this.pool) {
      return
    }

    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      const tables = [
        'auto_invest_allocations',
        'auto_invest_plans', 
        'yield_positions',
        'protocol_configurations',
        'defi_protocols',
        'user_investments',
        'tokenized_assets',
        'transactions',
        'users'
      ]

      for (const table of tables) {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
      }

      await client.query('COMMIT')
      console.log('✅ Test database schema dropped successfully')

    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to drop test database schema:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Execute a query on the test database
   */
  async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database pool not initialized')
    }

    const client = await this.pool.connect()
    
    try {
      return await client.query(text, params)
    } finally {
      client.release()
    }
  }

  /**
   * Get a database client for transactions
   */
  async getClient(): Promise<any> {
    if (!this.pool) {
      throw new Error('Database pool not initialized')
    }

    return await this.pool.connect()
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      console.log('✅ Test database connections closed')
    }
  }

  /**
   * Reset the database to a clean state
   */
  async reset(): Promise<void> {
    await this.cleanup()
    await this.seedData()
  }

  /**
   * Check if the database is ready
   */
  async isReady(): Promise<boolean> {
    if (!this.pool) {
      return false
    }

    try {
      const client = await this.pool.connect()
      await client.query('SELECT 1')
      client.release()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get database statistics for monitoring
   */
  async getStats(): Promise<{
    totalConnections: number
    idleConnections: number
    waitingCount: number
  }> {
    if (!this.pool) {
      return { totalConnections: 0, idleConnections: 0, waitingCount: 0 }
    }

    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    }
  }
}

// Singleton instance for tests
export const testDatabase = new TestDatabaseManager()

// Helper functions for test setup/teardown
export async function setupTestDatabase(): Promise<void> {
  await testDatabase.initialize()
  await testDatabase.createSchema()
  await testDatabase.seedData()
}

export async function teardownTestDatabase(): Promise<void> {
  await testDatabase.cleanup()
  await testDatabase.close()
}

export async function resetTestDatabase(): Promise<void> {
  await testDatabase.reset()
}

// Mock database connection for services
export function createMockDatabaseConnection() {
  return {
    query: jest.fn(),
    getClient: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn()
    })),
    close: jest.fn()
  }
}

// Database test fixtures
export const testFixtures = {
  users: {
    testUser: {
      id: testData.uuid(),
      wallet_address: '0x742b5c3f7b0c9c2f8b7c8b7c8b7c8b7c8b7c8b7c',
      email: 'test@example.com',
      display_name: 'Test User'
    },
    smartWalletUser: {
      id: testData.uuid(), 
      wallet_address: '0x2226bDB4F36fb86698db9340111803577b5a4114',
      email: 'smartwallet@example.com',
      display_name: 'Smart Wallet User'
    }
  },
  
  assets: {
    techETF: {
      name: 'Tech Growth ETF',
      symbol: 'TECH',
      category: 'etf',
      current_price: '100.50',
      risk_level: 'Medium'
    },
    bondFund: {
      name: 'Stable Income Bond Fund',
      symbol: 'BOND', 
      category: 'bond',
      current_price: '50.25',
      risk_level: 'Low'
    }
  },

  protocols: {
    aave: {
      name: 'Aave',
      protocol_key: 'aave',
      risk_level: 'Medium',
      supported_chains: ['1', '137', '42161']
    },
    compound: {
      name: 'Compound',
      protocol_key: 'compound',
      risk_level: 'Medium',
      supported_chains: ['1', '137']
    }
  }
}

export default TestDatabaseManager