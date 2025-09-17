'use client'

import { ethers } from 'ethers'
import { getEthereumNetwork, getTokenConfig } from '@/config/blockchain'
import { balanceCache } from './balanceCache'
import { networkErrorHandler, type NetworkError } from './errorHandling'
import { networkErrorService } from './networkErrorService'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy' | 'fuji'

// ERC-20 ABI for balanceOf function
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
]

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
  usdc: TokenBalance | null
  error?: string
  errorDetails?: NetworkError
  circuitBreakerState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  lastSuccessTime?: number
}

export interface AggregatedBalance {
  totalUSDC: string
  networks: NetworkBalance[]
  lastUpdated: Date
}

export class MultiChainBalanceService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map()
  private alchemyApiKey: string
  private networkStats: Map<string, { lastSuccess: number; totalRequests: number; failedRequests: number }> = new Map()
  
  constructor() {
    this.alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''
    if (!this.alchemyApiKey) {
      console.warn('⚠️ No Alchemy API key found, some networks may not work')
    }
  }

  private async getProvider(network: SupportedNetwork): Promise<ethers.JsonRpcProvider> {
    if (this.providers.has(network)) {
      return this.providers.get(network)!
    }

    const networkConfig = getEthereumNetwork(network)
    let rpcUrl = networkConfig.rpcUrl
    let endpointType: 'alchemy' | 'public' = 'alchemy'

    if (!this.alchemyApiKey && rpcUrl.includes('alchemy.com')) {
      rpcUrl = this.getFallbackRpc(network)
      endpointType = 'public'
    }

    // Check rate limiting before creating provider
    const rateLimitOk = await networkErrorHandler.checkRateLimit(endpointType)
    if (!rateLimitOk) {
      console.warn(`⚠️ Rate limit exceeded for ${endpointType} endpoint, using fallback`)
      if (endpointType === 'alchemy') {
        rpcUrl = this.getFallbackRpc(network)
        endpointType = 'public'
      }
    }

    // Create provider with timeout configuration
    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      polling: false, // Disable polling to reduce requests
      staticNetwork: true // Use static network detection
    })

    // Set custom timeout for provider
    if (provider.provider && typeof provider.provider === 'object') {
      (provider.provider as any).timeout = 10000 // 10 second timeout
    }

    this.providers.set(network, provider)
    
    console.log(`🔗 Connected to ${networkConfig.name} via ${rpcUrl.includes('alchemy') ? 'Alchemy' : 'public RPC'}`)
    return provider
  }

  private getFallbackRpc(network: SupportedNetwork): string {
    const fallbackRpcs: Record<SupportedNetwork, string> = {
      sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
      arbitrumSepolia: 'https://sepolia-rollup.arbitrum.io/rpc',
      baseSepolia: 'https://sepolia.base.org',
      optimismSepolia: 'https://sepolia.optimism.io',
      polygonAmoy: 'https://rpc-amoy.polygon.technology',
      fuji: 'https://api.avax-test.network/ext/bc/C/rpc'
    }
    return fallbackRpcs[network]
  }

  /**
   * Update network statistics
   */
  private updateNetworkStats(network: string, type: 'request' | 'success' | 'failure') {
    if (!this.networkStats.has(network)) {
      this.networkStats.set(network, {
        lastSuccess: 0,
        totalRequests: 0,
        failedRequests: 0
      })
    }
    
    const stats = this.networkStats.get(network)!
    
    switch (type) {
      case 'request':
        stats.totalRequests++
        break
      case 'success':
        stats.lastSuccess = Date.now()
        break
      case 'failure':
        stats.failedRequests++
        break
    }
  }

  /**
   * Fetch USDC balance for an address on a specific network
   */
  async getUSDCBalance(address: string, network: SupportedNetwork): Promise<TokenBalance | null> {
    return networkErrorHandler.retryWithBackoff(async () => {
      // Check circuit breaker
      if (!networkErrorHandler.isNetworkAvailable(network)) {
        throw new Error(`Circuit breaker OPEN for ${network}`)
      }

      this.updateNetworkStats(network, 'request')

      const networkConfig = getEthereumNetwork(network)
      const tokenConfig = getTokenConfig(network, 'USDC')
      
      console.log(`🔍 Fetching USDC balance for ${address} on ${networkConfig.name}`, {
        tokenContract: tokenConfig.address,
        network,
        address
      })
      
      const provider = await this.getProvider(network)
      const contract = new ethers.Contract(tokenConfig.address, ERC20_ABI, provider)
      
      // Create timeout wrapper for contract calls
      const timeoutPromise = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Contract call timeout after ${ms}ms`)), ms)
          )
        ])
      }
      
      // Get balance, decimals, symbol, and name in parallel with timeout
      const [balance, decimals, symbol, name] = await Promise.all([
        timeoutPromise(contract.balanceOf(address), 15000),
        timeoutPromise(contract.decimals(), 10000),
        timeoutPromise(contract.symbol(), 10000),
        timeoutPromise(contract.name(), 10000)
      ])
      
      const rawBalance = balance.toString()
      const formattedBalance = ethers.formatUnits(balance, decimals)
      
      // Record success
      this.updateNetworkStats(network, 'success')
      networkErrorHandler.recordSuccess(network)
      
      console.log(`💰 ${networkConfig.name} USDC Balance:`, {
        address,
        network,
        rawBalance,
        balance: formattedBalance,
        decimals: decimals.toString(),
        symbol,
        name
      })
      
      return {
        address: tokenConfig.address,
        balance: formattedBalance,
        decimals: Number(decimals),
        symbol,
        name,
        rawBalance,
        network: networkConfig.name,
        chainId: networkConfig.chainIdDecimal
      }
    }, network, {
      maxRetries: 3,
      baseDelay: 2000, // 2 seconds for token calls
      maxDelay: 15000 // 15 seconds max
    }).catch(error => {
      console.error(`❌ Error fetching USDC balance on ${network} after retries:`, error)
      this.updateNetworkStats(network, 'failure')
      return null
    })
  }

  /**
   * Fetch ETH balance for an address on a specific network
   */
  async getETHBalance(address: string, network: SupportedNetwork): Promise<string> {
    return networkErrorHandler.retryWithBackoff(async () => {
      // Check circuit breaker
      if (!networkErrorHandler.isNetworkAvailable(network)) {
        throw new Error(`Circuit breaker OPEN for ${network}`)
      }

      this.updateNetworkStats(network, 'request')

      const networkConfig = getEthereumNetwork(network)
      console.log(`🔍 Fetching ${networkConfig.ticker} balance for ${address} on ${networkConfig.name}`)
      
      // Validate address format
      if (!ethers.isAddress(address)) {
        throw new Error(`Invalid address format: ${address}`)
      }
      
      const provider = await this.getProvider(network)
      
      // Create timeout wrapper for getBalance
      const timeoutPromise = Promise.race([
        provider.getBalance(address),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`ETH balance timeout after 12000ms`)), 12000)
        )
      ])
      
      const balance = await timeoutPromise
      const formattedBalance = ethers.formatEther(balance)
      
      // Record success
      this.updateNetworkStats(network, 'success')
      networkErrorHandler.recordSuccess(network)
      
      console.log(`⚡ ${networkConfig.name} ${networkConfig.ticker} Balance:`, {
        address,
        network,
        balance: formattedBalance,
        rawBalance: balance.toString(),
        isZero: balance === 0n
      })
      
      return formattedBalance
    }, network, {
      maxRetries: 3,
      baseDelay: 1000, // 1 second for ETH calls
      maxDelay: 10000 // 10 seconds max
    }).catch(error => {
      console.error(`❌ Error fetching ${network} ETH balance for ${address} after retries:`, {
        error: error instanceof Error ? error.message : error,
        network,
        address
      })
      this.updateNetworkStats(network, 'failure')
      return '0'
    })
  }

  /**
   * Fetch both ETH and USDC balances for an address on a specific network
   */
  async getNetworkBalances(address: string, network: SupportedNetwork, useCache: boolean = true): Promise<NetworkBalance> {
    // Check cache first
    if (useCache) {
      const cached = balanceCache.getNetworkBalance(address, network)
      if (cached) {
        console.log(`💾 Using cached balance for ${network}:`, cached)
        return cached
      }
    }

    const networkConfig = getEthereumNetwork(network)
    const stats = this.networkStats.get(network)
    
    try {
      console.log(`🔄 Fetching fresh balance for ${address} on ${network}`)
      
      // Check circuit breaker before attempting
      if (!networkErrorHandler.isNetworkAvailable(network)) {
        throw new Error(`Circuit breaker OPEN for ${network}`)
      }
      
      const [ethBalance, usdcBalance] = await Promise.all([
        this.getETHBalance(address, network),
        this.getUSDCBalance(address, network)
      ])

      const result: NetworkBalance = {
        network: networkConfig.name,
        chainId: networkConfig.chainIdDecimal,
        isTestnet: networkConfig.isTestnet,
        eth: ethBalance,
        usdc: usdcBalance,
        circuitBreakerState: 'CLOSED',
        lastSuccessTime: Date.now()
      }

      // Cache the result
      if (useCache) {
        balanceCache.setNetworkBalance(address, network, result)
      }

      return result
    } catch (error) {
      console.error(`❌ Error fetching balances on ${network}:`, error)
      
      // Get circuit breaker state
      const errorStats = networkErrorHandler.getErrorStats(network)
      
      const errorResult: NetworkBalance = {
        network: networkConfig.name,
        chainId: networkConfig.chainIdDecimal,
        isTestnet: networkConfig.isTestnet,
        eth: '0',
        usdc: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: networkErrorHandler.recordFailure(network, error),
        circuitBreakerState: errorStats.circuitBreakerState,
        lastSuccessTime: stats?.lastSuccess || 0
      }

      // Don't cache error results
      return errorResult
    }
  }

  /**
   * Fetch balances across all supported networks
   */
  async getAllNetworkBalances(address: string, networks?: SupportedNetwork[], useCache: boolean = true): Promise<AggregatedBalance> {
    const networksToCheck: SupportedNetwork[] = networks || [
      'sepolia', 'arbitrumSepolia', 'baseSepolia', 'optimismSepolia', 'polygonAmoy', 'fuji'
    ]

    // Check cache first
    if (useCache) {
      const cached = balanceCache.getAggregatedBalance(address, networksToCheck)
      if (cached) {
        console.log(`💾 Using cached aggregated balance:`, cached)
        return cached
      }
    }

    console.log(`🌐 Fetching balances for ${address} across ${networksToCheck.length} networks`)
    
    try {
      // Fetch balances with parallel execution and cache support
      const networkBalances = await Promise.allSettled(
        networksToCheck.map(network => this.getNetworkBalances(address, network, useCache))
      )

      // Process results, including failed requests
      const processedBalances: NetworkBalance[] = await Promise.all(networkBalances.map(async (result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          const network = networksToCheck[index]
          const networkConfig = getEthereumNetwork(network)
          console.warn(`⚠️ Failed to fetch balance for ${network}:`, result.reason)

          // Record network error for monitoring and debugging
          try {
            await networkErrorService.recordNetworkError({
              network: network,
              chainId: networkConfig.chainIdDecimal,
              errorType: this.categorizeError(result.reason),
              errorMessage: result.reason?.message || result.reason?.toString() || 'Unknown error',
              errorDetails: {
                originalError: result.reason,
                networkConfig: networkConfig,
                timestamp: new Date().toISOString()
              },
              endpoint: networkConfig.rpcEndpoint,
              retryCount: 0
            })
          } catch (errorRecordingError) {
            console.error('Failed to record network error:', errorRecordingError)
          }
          
          return {
            network: networkConfig.name,
            chainId: networkConfig.chainIdDecimal,
            isTestnet: networkConfig.isTestnet,
            eth: '0',
            usdc: null,
            error: result.reason?.message || 'Network request failed'
          }
        }
      }))

      // Calculate total USDC across all networks
      const totalUSDC = processedBalances.reduce((total, networkBalance) => {
        if (networkBalance.usdc && !networkBalance.error) {
          return total + parseFloat(networkBalance.usdc.balance)
        }
        return total
      }, 0)

      const result: AggregatedBalance = {
        totalUSDC: totalUSDC.toFixed(6),
        networks: processedBalances,
        lastUpdated: new Date()
      }

      // Cache the result
      if (useCache) {
        balanceCache.setAggregatedBalance(address, networksToCheck, result)
      }

      console.log(`📊 Aggregated Balance Summary:`, {
        address,
        totalUSDC: result.totalUSDC,
        networksWithBalance: processedBalances.filter(n => n.usdc && parseFloat(n.usdc.balance) > 0).length,
        networksChecked: processedBalances.length,
        networkErrors: processedBalances.filter(n => n.error).length
      })

      return result
    } catch (error) {
      console.error('❌ Error fetching multi-network balances:', error)
      return {
        totalUSDC: '0',
        networks: [],
        lastUpdated: new Date()
      }
    }
  }

  /**
   * Preload balances for faster access
   */
  async preloadBalances(address: string, networks: SupportedNetwork[]): Promise<void> {
    await balanceCache.preload(address, networks, this)
  }

  /**
   * Invalidate cache for specific address
   */
  invalidateCache(address: string, network?: SupportedNetwork): void {
    if (network) {
      balanceCache.invalidateNetworkBalance(address, network)
    } else {
      balanceCache.invalidateAddress(address)
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return balanceCache.getStats()
  }

  /**
   * Categorize error for better tracking and monitoring
   */
  private categorizeError(error: any): 'rpc_error' | 'rate_limit' | 'timeout' | 'validation' | 'unknown' {
    if (!error) return 'unknown'

    const errorMessage = error.message || error.toString() || ''
    const errorCode = error.code || error.status || ''

    // Rate limiting errors
    if (errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorCode === 429) {
      return 'rate_limit'
    }

    // Timeout errors
    if (errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT') ||
        error.name === 'AbortError') {
      return 'timeout'
    }

    // Validation errors
    if (errorMessage.includes('invalid') ||
        errorMessage.includes('bad request') ||
        errorCode === 400) {
      return 'validation'
    }

    // RPC errors
    if (errorMessage.includes('rpc') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('network') ||
        errorCode >= 500) {
      return 'rpc_error'
    }

    return 'unknown'
  }

  /**
   * Get network health statistics
   */
  getNetworkHealth() {
    const health: Record<string, any> = {}
    
    for (const [network, stats] of this.networkStats.entries()) {
      const errorStats = networkErrorHandler.getErrorStats(network)
      const successRate = stats.totalRequests > 0 ? 
        ((stats.totalRequests - stats.failedRequests) / stats.totalRequests * 100).toFixed(2) : '100'
      
      health[network] = {
        successRate: `${successRate}%`,
        totalRequests: stats.totalRequests,
        failedRequests: stats.failedRequests,
        lastSuccessTime: stats.lastSuccess,
        timeSinceLastSuccess: stats.lastSuccess > 0 ? Date.now() - stats.lastSuccess : null,
        circuitBreakerState: errorStats.circuitBreakerState,
        recentErrors: errorStats.recentErrors,
        isHealthy: errorStats.circuitBreakerState === 'CLOSED' && 
                  (Date.now() - stats.lastSuccess) < 300000 // 5 minutes
      }
    }
    
    return health
  }

  /**
   * Reset network statistics (for testing or maintenance)
   */
  resetNetworkStats(network?: SupportedNetwork) {
    if (network) {
      this.networkStats.delete(network)
      console.log(`🔄 Reset statistics for ${network}`)
    } else {
      this.networkStats.clear()
      console.log('🔄 Reset all network statistics')
    }
  }

  /**
   * Force circuit breaker reset for a network
   */
  resetCircuitBreaker(network: SupportedNetwork) {
    const stats = networkErrorHandler.getErrorStats(network)
    if (stats.circuitBreakerState !== 'CLOSED') {
      // This is a simple way to reset - in a real implementation,
      // you'd call a method on the networkErrorHandler
      console.log(`🔄 Manually resetting circuit breaker for ${network}`)
      networkErrorHandler.recordSuccess(network)
    }
  }

  /**
   * Test the service with the provided smart wallet address across all networks
   */
  async testWithSmartWallet(): Promise<void> {
    const testAddress = '0x2226bDB4F36fb86698db9340111803577b5a4114'
    console.log(`🧪 Testing multi-chain balance service with smart wallet: ${testAddress}`)
    
    const aggregatedBalance = await this.getAllNetworkBalances(testAddress)
    console.log('🎯 Multi-Chain Test Results:', aggregatedBalance)
  }

  /**
   * Test a specific network
   */
  async testNetwork(network: SupportedNetwork, testAddress?: string): Promise<void> {
    const address = testAddress || '0x2226bDB4F36fb86698db9340111803577b5a4114'
    console.log(`🧪 Testing ${network} with address: ${address}`)
    
    const networkBalance = await this.getNetworkBalances(address, network)
    console.log(`🎯 ${network} Test Results:`, networkBalance)
  }
}

// Create a singleton instance
export const multiChainBalanceService = new MultiChainBalanceService()

// Backward compatibility - legacy single network service
export class BalanceService extends MultiChainBalanceService {
  private defaultNetwork: SupportedNetwork = 'sepolia'

  async getUSDCBalance(address: string): Promise<TokenBalance | null> {
    return super.getUSDCBalance(address, this.defaultNetwork)
  }

  async getETHBalance(address: string): Promise<string> {
    return super.getETHBalance(address, this.defaultNetwork)
  }

  async getAllBalances(address: string): Promise<{ eth: string; usdc: TokenBalance | null }> {
    const networkBalance = await super.getNetworkBalances(address, this.defaultNetwork)
    return {
      eth: networkBalance.eth,
      usdc: networkBalance.usdc
    }
  }

  async getAllBalancesFresh(address: string): Promise<{ eth: string; usdc: TokenBalance | null }> {
    const networkBalance = await super.getNetworkBalances(address, this.defaultNetwork, false) // bypass cache
    return {
      eth: networkBalance.eth,
      usdc: networkBalance.usdc
    }
  }
}

export const balanceService = new BalanceService()

// Test functions that can be called from browser console
if (typeof window !== 'undefined') {
  (window as any).testBalanceService = () => balanceService.testWithSmartWallet()
  ;(window as any).testMultiChainBalanceService = () => multiChainBalanceService.testWithSmartWallet()
  ;(window as any).testNetwork = (network: SupportedNetwork, address?: string) => 
    multiChainBalanceService.testNetwork(network, address)
  ;(window as any).getAllNetworkBalances = (address: string, networks?: SupportedNetwork[]) => 
    multiChainBalanceService.getAllNetworkBalances(address, networks)
    
  // Error handling and monitoring utilities
  ;(window as any).getNetworkHealth = () => multiChainBalanceService.getNetworkHealth()
  ;(window as any).getErrorStats = (network?: string) => networkErrorHandler.getErrorStats(network)
  ;(window as any).resetCircuitBreaker = (network: SupportedNetwork) => 
    multiChainBalanceService.resetCircuitBreaker(network)
  ;(window as any).resetNetworkStats = (network?: SupportedNetwork) => 
    multiChainBalanceService.resetNetworkStats(network)
    
  console.log('🔧 Balance Service Debug Tools Available:')
  console.log('- getNetworkHealth() - View network health statistics')
  console.log('- getErrorStats(network?) - View error statistics')
  console.log('- resetCircuitBreaker(network) - Reset circuit breaker for network')
  console.log('- resetNetworkStats(network?) - Reset network statistics')
}