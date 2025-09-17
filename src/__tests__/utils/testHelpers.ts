import { ethers } from 'ethers'
import type { 
  UserInvestment,
  StablecoinSymbol,
  ChainId
} from '@/lib/database/models'

// Define interfaces from the lib/data module
export interface TokenBalance {
  address: string
  balance: string
  decimals: number
  symbol: string
  name: string
  rawBalance: string
  network: string
  chainId: number
}

export interface NetworkBalance {
  network: string
  chainId: number
  isTestnet: boolean
  eth: string
  usdc?: TokenBalance
}

export interface AggregatedBalance {
  totalUSDC: string
  networks: NetworkBalance[]
  lastUpdated: Date
}

export interface TransactionWithDetails {
  id: string
  user_id: string
  tx_hash?: string
  transaction_type: string
  status: string
  amount: string
  fee_amount: string
  stablecoin: StablecoinSymbol
  chain_id: ChainId
  from_address?: string
  to_address?: string
  description?: string
  block_number?: number
  gas_used?: number
  gas_price?: string
  created_at: string
  updated_at: string
  confirmed_at?: string
  networkName?: string
  explorerUrl?: string
  usdValue?: string
}

// Mock addresses for testing
export const MOCK_ADDRESSES = {
  VALID_ADDRESS: '0x742b5c3f7b0c9c2f8b7c8b7c8b7c8b7c8b7c8b7c',
  SMART_WALLET: '0x2226bDB4F36fb86698db9340111803577b5a4114',
  RECIPIENT: '0x1234567890123456789012345678901234567890',
  USDC_SEPOLIA: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  USDC_BASE: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
}

// Mock transaction hashes
export const MOCK_TX_HASHES = {
  SUCCESS: '0xa1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
  PENDING: '0xb2c3d4e5f6789012345678901234567890123456789012345678901234567890a1',
  FAILED: '0xc3d4e5f6789012345678901234567890123456789012345678901234567890a1b2'
}

// Create mock ethers provider
export function createMockProvider(): jest.Mocked<ethers.JsonRpcProvider> {
  return {
    getBalance: jest.fn(),
    getNetwork: jest.fn(),
    getBlockNumber: jest.fn(),
    waitForTransaction: jest.fn(),
    call: jest.fn(),
    resolveName: jest.fn(),
    send: jest.fn(),
    getTransaction: jest.fn(),
    getTransactionReceipt: jest.fn(),
    estimateGas: jest.fn()
  } as any
}

// Create mock ethers contract
export function createMockContract(): jest.Mocked<ethers.Contract> {
  return {
    balanceOf: jest.fn(),
    decimals: jest.fn(),
    symbol: jest.fn(),
    name: jest.fn(),
    transfer: jest.fn(),
    transferFrom: jest.fn(),
    approve: jest.fn(),
    allowance: jest.fn(),
    totalSupply: jest.fn(),
    connect: jest.fn(),
    interface: {
      encodeFunctionData: jest.fn(),
      decodeFunctionResult: jest.fn(),
    },
    getAddress: jest.fn(),
  } as any
}

// Mock token balance
export function createMockTokenBalance(overrides: Partial<TokenBalance> = {}): TokenBalance {
  return {
    address: MOCK_ADDRESSES.USDC_SEPOLIA,
    balance: '1000.0',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    rawBalance: '1000000000',
    network: 'Ethereum Sepolia',
    chainId: 11155111,
    ...overrides
  }
}

// Mock network balance
export function createMockNetworkBalance(overrides: Partial<NetworkBalance> = {}): NetworkBalance {
  return {
    network: 'Ethereum Sepolia',
    chainId: 11155111,
    isTestnet: true,
    eth: '0.5',
    usdc: createMockTokenBalance(),
    ...overrides
  }
}

// Mock aggregated balance
export function createMockAggregatedBalance(overrides: Partial<AggregatedBalance> = {}): AggregatedBalance {
  return {
    totalUSDC: '5000.0',
    networks: [
      createMockNetworkBalance(),
      createMockNetworkBalance({ 
        network: 'Base Sepolia', 
        chainId: 84532,
        usdc: createMockTokenBalance({ balance: '2000.0' })
      }),
      createMockNetworkBalance({ 
        network: 'Arbitrum Sepolia', 
        chainId: 421614,
        usdc: createMockTokenBalance({ balance: '2000.0' })
      })
    ],
    lastUpdated: new Date(),
    ...overrides
  }
}

// Mock user investment
export function createMockUserInvestment(overrides: Partial<UserInvestment> = {}): UserInvestment {
  return {
    id: 'test-investment-id',
    user_id: 'test-user-id',
    asset_id: 'test-asset-id',
    quantity: '100.0',
    average_cost: '1.0',
    total_invested: '100.0',
    current_value: '120.0',
    unrealized_pnl: '20.0',
    currency: 'USDC' as StablecoinSymbol,
    first_purchase_at: new Date().toISOString(),
    last_purchase_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

// Mock transaction
export function createMockTransaction(overrides: Partial<TransactionWithDetails> = {}): TransactionWithDetails {
  return {
    id: 'test-transaction-id',
    user_id: 'test-user-id',
    tx_hash: MOCK_TX_HASHES.SUCCESS,
    transaction_type: 'transfer',
    status: 'completed',
    amount: '100.0',
    fee_amount: '0.5',
    stablecoin: 'USDC' as StablecoinSymbol,
    chain_id: '11155111' as ChainId,
    from_address: MOCK_ADDRESSES.SMART_WALLET,
    to_address: MOCK_ADDRESSES.RECIPIENT,
    description: 'Test transfer',
    block_number: 12345,
    gas_used: 21000,
    gas_price: '20000000000',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    networkName: 'Ethereum Sepolia',
    explorerUrl: `https://sepolia.etherscan.io/tx/${MOCK_TX_HASHES.SUCCESS}`,
    usdValue: '100.0',
    ...overrides
  }
}

// Mock Alchemy Account Kit user based on real API structure
export function createMockAlchemyUser(authMethod: 'email' | 'google' | 'passkey' | 'wallet' = 'email') {
  const baseUser = {
    address: MOCK_ADDRESSES.SMART_WALLET,
    userId: 'test-user-id',
    orgId: 'test-org-id',
    type: 'sca' as const, // Smart Contract Account
  }

  // Return different user objects based on auth method
  switch (authMethod) {
    case 'google':
      return {
        ...baseUser,
        email: 'test@example.com',
        idToken: 'mock-google-id-token', // OAuth indicator
      }
    case 'passkey':
      return {
        ...baseUser,
        email: 'test@example.com',
        credentialId: 'mock-credential-id', // Passkey indicator
      }
    case 'wallet':
      return {
        ...baseUser,
        // No email for wallet-only users
      }
    case 'email':
    default:
      return {
        ...baseUser,
        email: 'test@example.com',
        // No idToken or credentialId for pure email auth
      }
  }
}

// Mock Alchemy signer
export function createMockAlchemySigner() {
  return {
    getAddress: jest.fn().mockResolvedValue(MOCK_ADDRESSES.SMART_WALLET),
    signMessage: jest.fn(),
    sendTransaction: jest.fn().mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS,
      wait: jest.fn().mockResolvedValue({
        hash: MOCK_TX_HASHES.SUCCESS,
        status: 1,
        blockNumber: 12345
      })
    }),
    provider: createMockProvider()
  }
}

// Mock smart account client
export function createMockSmartAccountClient() {
  return {
    sendUserOperation: jest.fn().mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS,
      userOperationHash: '0xabcdef...'
    }),
    buildUserOperation: jest.fn(),
    estimateUserOperationGas: jest.fn(),
    account: {
      address: MOCK_ADDRESSES.SMART_WALLET
    }
  }
}

// Database test helpers
export function createMockDatabaseResult<T>(data: T[]): { rows: T[] } {
  return { rows: data }
}

// Async test helpers
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock fetch responses
export function mockFetchResponse<T>(data: T, status = 200): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status < 400,
    status,
    json: jest.fn().mockResolvedValueOnce(data),
    text: jest.fn().mockResolvedValueOnce(JSON.stringify(data))
  })
}

// Mock ethers utilities
export function mockEthersUtils() {
  jest.mock('ethers', () => ({
    ...jest.requireActual('ethers'),
    JsonRpcProvider: jest.fn().mockImplementation(() => createMockProvider()),
    Contract: jest.fn().mockImplementation(() => createMockContract()),
    formatEther: jest.fn().mockImplementation((value) => {
      // Simple mock implementation
      return (Number(value) / 1e18).toString()
    }),
    formatUnits: jest.fn().mockImplementation((value, decimals = 18) => {
      return (Number(value) / Math.pow(10, decimals)).toString()
    }),
    parseEther: jest.fn().mockImplementation((value) => {
      return BigInt(Math.floor(Number(value) * 1e18))
    }),
    parseUnits: jest.fn().mockImplementation((value, decimals = 18) => {
      return BigInt(Math.floor(Number(value) * Math.pow(10, decimals)))
    }),
    isAddress: jest.fn().mockImplementation((address) => {
      return typeof address === 'string' && address.startsWith('0x') && address.length === 42
    })
  }))
}

// Test data generators
export const testData = {
  // Generate test UUIDs
  uuid: () => crypto.randomUUID(),
  
  // Generate test addresses
  address: () => `0x${Math.random().toString(16).substr(2, 40)}`,
  
  // Generate test amounts
  amount: (min = 1, max = 1000) => (Math.random() * (max - min) + min).toFixed(6),
  
  // Generate test timestamps
  timestamp: () => new Date().toISOString(),
  
  // Generate test transaction hashes
  txHash: () => `0x${Math.random().toString(16).substr(2, 64)}`
}

// Error simulation helpers
export function simulateNetworkError(message = 'Network error') {
  return new Error(`NETWORK_ERROR: ${message}`)
}

export function simulateRateLimitError() {
  const error = new Error('Too Many Requests')
  ;(error as any).status = 429
  return error
}

export function simulateTimeoutError() {
  const error = new Error('Request timeout')
  error.name = 'AbortError'
  return error
}

// Test environment helpers
export function setTestEnvironment(env: 'development' | 'test' | 'production') {
  if (process.env.NODE_ENV !== env) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: env,
      writable: true,
      configurable: true
    })
  }
}

export function mockConsole() {
  const originalConsole = { ...console }
  
  beforeEach(() => {
    console.log = jest.fn()
    console.warn = jest.fn()
    console.error = jest.fn()
    console.info = jest.fn()
    console.debug = jest.fn()
  })
  
  afterEach(() => {
    Object.assign(console, originalConsole)
  })
  
  return {
    expectLog: (message: string) => expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message)),
    expectError: (message: string) => expect(console.error).toHaveBeenCalledWith(expect.stringContaining(message)),
    expectWarn: (message: string) => expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(message))
  }
}