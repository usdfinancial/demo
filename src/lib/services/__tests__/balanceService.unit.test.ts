import { MultiChainBalanceService, BalanceService } from '../balanceService'
import { 
  createMockProvider, 
  createMockContract, 
  createMockTokenBalance,
  createMockNetworkBalance,
  MOCK_ADDRESSES,
  mockConsole,
  simulateNetworkError,
  simulateTimeoutError,
  testData
} from '../../../__tests__/utils/testHelpers'

// Mock ethers
jest.mock('ethers', () => require('../../__tests__/__mocks__/ethers'))

// Mock blockchain config
jest.mock('@/config/blockchain', () => ({
  getEthereumNetwork: jest.fn((network) => ({
    name: `${network} Network`,
    chainIdDecimal: 11155111,
    ticker: 'ETH',
    isTestnet: true,
    rpcUrl: `https://${network}.example.com`
  })),
  getTokenConfig: jest.fn(() => ({
    address: MOCK_ADDRESSES.USDC_SEPOLIA,
    decimals: 6,
    symbol: 'USDC'
  }))
}))

// Mock error handling
jest.mock('../errorHandling', () => ({
  networkErrorHandler: {
    retryWithBackoff: jest.fn(),
    isNetworkAvailable: jest.fn().mockReturnValue(true),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn().mockReturnValue({}),
    getErrorStats: jest.fn().mockReturnValue({ circuitBreakerState: 'CLOSED' })
  }
}))

// Mock balance cache
jest.mock('../balanceCache', () => ({
  balanceCache: {
    getNetworkBalance: jest.fn(),
    setNetworkBalance: jest.fn(),
    getAggregatedBalance: jest.fn(),
    setAggregatedBalance: jest.fn(),
    invalidateNetworkBalance: jest.fn(),
    invalidateAddress: jest.fn(),
    getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
    preload: jest.fn()
  }
}))

describe('MultiChainBalanceService', () => {
  let service: MultiChainBalanceService
  let mockProvider: jest.Mocked<any>
  let mockContract: jest.Mocked<any>
  const consoleMocks = mockConsole()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new MultiChainBalanceService()
    mockProvider = createMockProvider()
    mockContract = createMockContract()
    
    // Mock ethers constructors to return our mocks
    const ethers = require('ethers')
    ethers.JsonRpcProvider.mockReturnValue(mockProvider)
    ethers.Contract.mockReturnValue(mockContract)
  })

  describe('getUSDCBalance', () => {
    it('should fetch USDC balance successfully', async () => {
      const expectedBalance = createMockTokenBalance()
      
      // Mock contract responses
      mockContract.balanceOf.mockResolvedValue(BigInt('1000000000')) // 1000 USDC
      mockContract.decimals.mockResolvedValue(6)
      mockContract.symbol.mockResolvedValue('USDC')
      mockContract.name.mockResolvedValue('USD Coin')

      // Mock network error handler
      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.retryWithBackoff.mockImplementation(async (fn) => await fn())

      const result = await service.getUSDCBalance(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')

      expect(result).toEqual(expect.objectContaining({
        balance: '1000.0',
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin',
        network: 'sepolia Network'
      }))

      expect(mockContract.balanceOf).toHaveBeenCalledWith(MOCK_ADDRESSES.SMART_WALLET)
      expect(networkErrorHandler.recordSuccess).toHaveBeenCalledWith('sepolia')
    })

    it('should handle contract call failures', async () => {
      const error = simulateNetworkError('Contract call failed')
      mockContract.balanceOf.mockRejectedValue(error)

      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.retryWithBackoff.mockImplementation(async (fn) => {
        try {
          await fn()
        } catch (e) {
          throw e
        }
      })

      const result = await service.getUSDCBalance(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')

      expect(result).toBeNull()
      expect(networkErrorHandler.recordFailure).toHaveBeenCalled()
    })

    it('should handle timeout errors', async () => {
      const timeoutError = simulateTimeoutError()
      mockContract.balanceOf.mockRejectedValue(timeoutError)

      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.retryWithBackoff.mockRejectedValue(timeoutError)

      const result = await service.getUSDCBalance(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')

      expect(result).toBeNull()
    })

    it('should validate address format', async () => {
      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.retryWithBackoff.mockImplementation(async (fn) => await fn())

      // Test invalid address
      const result = await service.getUSDCBalance('invalid-address', 'sepolia')
      
      // Should handle gracefully and return null
      expect(result).toBeNull()
    })
  })

  describe('getETHBalance', () => {
    it('should fetch ETH balance successfully', async () => {
      mockProvider.getBalance.mockResolvedValue(BigInt('500000000000000000')) // 0.5 ETH

      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.retryWithBackoff.mockImplementation(async (fn) => await fn())

      const result = await service.getETHBalance(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')

      expect(result).toBe('0.5')
      expect(mockProvider.getBalance).toHaveBeenCalledWith(MOCK_ADDRESSES.SMART_WALLET)
      expect(networkErrorHandler.recordSuccess).toHaveBeenCalledWith('sepolia')
    })

    it('should handle network failures', async () => {
      const error = simulateNetworkError('Network is down')
      mockProvider.getBalance.mockRejectedValue(error)

      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.retryWithBackoff.mockRejectedValue(error)

      const result = await service.getETHBalance(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')

      expect(result).toBe('0')
    })

    it('should validate address format', async () => {
      const ethers = require('ethers')
      ethers.isAddress.mockReturnValue(false)

      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.retryWithBackoff.mockImplementation(async (fn) => await fn())

      const result = await service.getETHBalance('invalid', 'sepolia')

      expect(result).toBe('0')
    })
  })

  describe('getNetworkBalances', () => {
    it('should fetch both ETH and USDC balances', async () => {
      const mockNetworkBalance = createMockNetworkBalance()
      
      // Mock successful balance fetches
      jest.spyOn(service, 'getETHBalance').mockResolvedValue('0.5')
      jest.spyOn(service, 'getUSDCBalance').mockResolvedValue(createMockTokenBalance())

      const result = await service.getNetworkBalances(MOCK_ADDRESSES.SMART_WALLET, 'sepolia', false)

      expect(result).toEqual(expect.objectContaining({
        network: 'sepolia Network',
        chainId: 11155111,
        isTestnet: true,
        eth: '0.5',
        usdc: expect.objectContaining({
          balance: '1000.0',
          symbol: 'USDC'
        })
      }))
    })

    it('should use cache when available', async () => {
      const mockCachedBalance = createMockNetworkBalance()
      const { balanceCache } = require('../balanceCache')
      balanceCache.getNetworkBalance.mockReturnValue(mockCachedBalance)

      const result = await service.getNetworkBalances(MOCK_ADDRESSES.SMART_WALLET, 'sepolia', true)

      expect(result).toEqual(mockCachedBalance)
      expect(balanceCache.getNetworkBalance).toHaveBeenCalledWith(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')
    })

    it('should handle circuit breaker open state', async () => {
      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.isNetworkAvailable.mockReturnValue(false)

      const result = await service.getNetworkBalances(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')

      expect(result).toEqual(expect.objectContaining({
        error: expect.stringContaining('Circuit breaker OPEN')
      }))
    })
  })

  describe('getAllNetworkBalances', () => {
    it('should fetch balances from all networks', async () => {
      const mockNetworkBalances = [
        createMockNetworkBalance({ network: 'Sepolia' }),
        createMockNetworkBalance({ network: 'Base Sepolia' }),
        createMockNetworkBalance({ network: 'Arbitrum Sepolia' })
      ]

      jest.spyOn(service, 'getNetworkBalances')
        .mockResolvedValueOnce(mockNetworkBalances[0])
        .mockResolvedValueOnce(mockNetworkBalances[1])
        .mockResolvedValueOnce(mockNetworkBalances[2])

      const result = await service.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET, 
        ['sepolia', 'baseSepolia', 'arbitrumSepolia'],
        false
      )

      expect(result.totalUSDC).toBe('3000.000000')
      expect(result.networks).toHaveLength(3)
      expect(result.lastUpdated).toBeInstanceOf(Date)
    })

    it('should handle partial network failures gracefully', async () => {
      jest.spyOn(service, 'getNetworkBalances')
        .mockResolvedValueOnce(createMockNetworkBalance())
        .mockRejectedValueOnce(simulateNetworkError('Network down'))
        .mockResolvedValueOnce(createMockNetworkBalance())

      const result = await service.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET,
        ['sepolia', 'baseSepolia', 'arbitrumSepolia'],
        false
      )

      expect(result.networks).toHaveLength(3)
      expect(result.networks[1]).toEqual(expect.objectContaining({
        error: expect.stringContaining('Network request failed')
      }))
    })

    it('should use cached aggregated balance', async () => {
      const mockAggregatedBalance = {
        totalUSDC: '5000.0',
        networks: [createMockNetworkBalance()],
        lastUpdated: new Date()
      }

      const { balanceCache } = require('../balanceCache')
      balanceCache.getAggregatedBalance.mockReturnValue(mockAggregatedBalance)

      const result = await service.getAllNetworkBalances(MOCK_ADDRESSES.SMART_WALLET)

      expect(result).toEqual(mockAggregatedBalance)
      expect(balanceCache.getAggregatedBalance).toHaveBeenCalled()
    })
  })

  describe('cache management', () => {
    it('should invalidate cache for specific address and network', () => {
      const { balanceCache } = require('../balanceCache')
      
      service.invalidateCache(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')

      expect(balanceCache.invalidateNetworkBalance).toHaveBeenCalledWith(MOCK_ADDRESSES.SMART_WALLET, 'sepolia')
    })

    it('should invalidate all cache for address', () => {
      const { balanceCache } = require('../balanceCache')
      
      service.invalidateCache(MOCK_ADDRESSES.SMART_WALLET)

      expect(balanceCache.invalidateAddress).toHaveBeenCalledWith(MOCK_ADDRESSES.SMART_WALLET)
    })

    it('should return cache statistics', () => {
      const mockStats = { hits: 100, misses: 20, hitRate: '83.33%' }
      const { balanceCache } = require('../balanceCache')
      balanceCache.getStats.mockReturnValue(mockStats)

      const stats = service.getCacheStats()

      expect(stats).toEqual(mockStats)
    })
  })

  describe('network health monitoring', () => {
    it('should return network health statistics', () => {
      // Mock internal network stats
      ;(service as any).networkStats.set('sepolia', {
        totalRequests: 100,
        failedRequests: 5,
        lastSuccess: Date.now() - 60000 // 1 minute ago
      })

      const health = service.getNetworkHealth()

      expect(health.sepolia).toEqual(expect.objectContaining({
        successRate: '95.00%',
        totalRequests: 100,
        failedRequests: 5,
        isHealthy: true
      }))
    })

    it('should identify unhealthy networks', () => {
      ;(service as any).networkStats.set('sepolia', {
        totalRequests: 100,
        failedRequests: 50,
        lastSuccess: Date.now() - 600000 // 10 minutes ago
      })

      const { networkErrorHandler } = require('../errorHandling')
      networkErrorHandler.getErrorStats.mockReturnValue({
        circuitBreakerState: 'OPEN'
      })

      const health = service.getNetworkHealth()

      expect(health.sepolia.isHealthy).toBe(false)
      expect(health.sepolia.circuitBreakerState).toBe('OPEN')
    })
  })

  describe('preloadBalances', () => {
    it('should preload balances for multiple networks', async () => {
      const { balanceCache } = require('../balanceCache')
      
      await service.preloadBalances(MOCK_ADDRESSES.SMART_WALLET, ['sepolia', 'baseSepolia'])

      expect(balanceCache.preload).toHaveBeenCalledWith(
        MOCK_ADDRESSES.SMART_WALLET, 
        ['sepolia', 'baseSepolia'],
        service
      )
    })
  })
})

describe('BalanceService (Legacy)', () => {
  let legacyService: BalanceService

  beforeEach(() => {
    jest.clearAllMocks()
    legacyService = new BalanceService()
  })

  describe('backward compatibility', () => {
    it('should use default network for USDC balance', async () => {
      const mockBalance = createMockTokenBalance()
      jest.spyOn(MultiChainBalanceService.prototype, 'getUSDCBalance').mockResolvedValue(mockBalance)

      const result = await legacyService.getUSDCBalance(MOCK_ADDRESSES.SMART_WALLET)

      expect(result).toEqual(mockBalance)
      expect(MultiChainBalanceService.prototype.getUSDCBalance).toHaveBeenCalledWith(
        MOCK_ADDRESSES.SMART_WALLET, 
        'sepolia'
      )
    })

    it('should use default network for ETH balance', async () => {
      jest.spyOn(MultiChainBalanceService.prototype, 'getETHBalance').mockResolvedValue('0.5')

      const result = await legacyService.getETHBalance(MOCK_ADDRESSES.SMART_WALLET)

      expect(result).toBe('0.5')
      expect(MultiChainBalanceService.prototype.getETHBalance).toHaveBeenCalledWith(
        MOCK_ADDRESSES.SMART_WALLET,
        'sepolia'
      )
    })

    it('should get all balances on default network', async () => {
      const mockNetworkBalance = createMockNetworkBalance()
      jest.spyOn(MultiChainBalanceService.prototype, 'getNetworkBalances').mockResolvedValue(mockNetworkBalance)

      const result = await legacyService.getAllBalances(MOCK_ADDRESSES.SMART_WALLET)

      expect(result).toEqual({
        eth: mockNetworkBalance.eth,
        usdc: mockNetworkBalance.usdc
      })
    })

    it('should get fresh balances bypassing cache', async () => {
      const mockNetworkBalance = createMockNetworkBalance()
      jest.spyOn(MultiChainBalanceService.prototype, 'getNetworkBalances').mockResolvedValue(mockNetworkBalance)

      const result = await legacyService.getAllBalancesFresh(MOCK_ADDRESSES.SMART_WALLET)

      expect(result).toEqual({
        eth: mockNetworkBalance.eth,
        usdc: mockNetworkBalance.usdc
      })
      expect(MultiChainBalanceService.prototype.getNetworkBalances).toHaveBeenCalledWith(
        MOCK_ADDRESSES.SMART_WALLET,
        'sepolia',
        false // bypass cache
      )
    })
  })
})