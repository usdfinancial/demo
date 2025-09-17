'use client'

import { TokenBalance, NetworkBalance, AggregatedBalance } from './balanceService'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy' | 'fuji'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface BalanceCacheConfig {
  balanceTTL: number // Time to live for individual balances (ms)
  aggregatedTTL: number // Time to live for aggregated balances (ms)
  maxEntries: number // Maximum cache entries per address
  backgroundRefreshThreshold: number // Refresh if cache age > this threshold (ms)
}

const DEFAULT_CONFIG: BalanceCacheConfig = {
  balanceTTL: 30000, // 30 seconds
  aggregatedTTL: 60000, // 1 minute
  maxEntries: 50,
  backgroundRefreshThreshold: 20000 // 20 seconds
}

export class BalanceCache {
  private networkBalanceCache: Map<string, CacheEntry<NetworkBalance>> = new Map()
  private aggregatedBalanceCache: Map<string, CacheEntry<AggregatedBalance>> = new Map()
  private backgroundRefreshQueue: Set<string> = new Set()
  private refreshInProgress: Set<string> = new Set()
  private config: BalanceCacheConfig

  constructor(config: Partial<BalanceCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Start background refresh worker
    this.startBackgroundRefresh()
    
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 300000) // 5 minutes
  }

  /**
   * Generate cache key for network balance
   */
  private getNetworkBalanceKey(address: string, network: SupportedNetwork): string {
    return `${address}:${network}`
  }

  /**
   * Generate cache key for aggregated balance
   */
  private getAggregatedBalanceKey(address: string, networks: SupportedNetwork[]): string {
    const networksHash = networks.sort().join(',')
    return `${address}:aggregated:${networksHash}`
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiry
  }

  /**
   * Check if cache entry should be refreshed in background
   */
  private shouldBackgroundRefresh(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp
    return age > this.config.backgroundRefreshThreshold
  }

  /**
   * Get network balance from cache
   */
  getNetworkBalance(address: string, network: SupportedNetwork): NetworkBalance | null {
    const key = this.getNetworkBalanceKey(address, network)
    const entry = this.networkBalanceCache.get(key)
    
    if (!entry || this.isExpired(entry)) {
      return null
    }

    // Queue for background refresh if needed
    if (this.shouldBackgroundRefresh(entry) && !this.refreshInProgress.has(key)) {
      this.backgroundRefreshQueue.add(key)
    }

    return entry.data
  }

  /**
   * Set network balance in cache
   */
  setNetworkBalance(address: string, network: SupportedNetwork, balance: NetworkBalance): void {
    const key = this.getNetworkBalanceKey(address, network)
    const now = Date.now()
    
    const entry: CacheEntry<NetworkBalance> = {
      data: balance,
      timestamp: now,
      expiry: now + this.config.balanceTTL
    }
    
    this.networkBalanceCache.set(key, entry)
    this.backgroundRefreshQueue.delete(key) // Remove from refresh queue if it was there
    
    // Cleanup if cache is getting too large
    this.enforceMaxEntries(this.networkBalanceCache)
  }

  /**
   * Get aggregated balance from cache
   */
  getAggregatedBalance(address: string, networks: SupportedNetwork[]): AggregatedBalance | null {
    const key = this.getAggregatedBalanceKey(address, networks)
    const entry = this.aggregatedBalanceCache.get(key)
    
    if (!entry || this.isExpired(entry)) {
      return null
    }

    // Queue for background refresh if needed
    if (this.shouldBackgroundRefresh(entry) && !this.refreshInProgress.has(key)) {
      this.backgroundRefreshQueue.add(key)
    }

    return entry.data
  }

  /**
   * Set aggregated balance in cache
   */
  setAggregatedBalance(address: string, networks: SupportedNetwork[], balance: AggregatedBalance): void {
    const key = this.getAggregatedBalanceKey(address, networks)
    const now = Date.now()
    
    const entry: CacheEntry<AggregatedBalance> = {
      data: balance,
      timestamp: now,
      expiry: now + this.config.aggregatedTTL
    }
    
    this.aggregatedBalanceCache.set(key, entry)
    this.backgroundRefreshQueue.delete(key)
    
    // Cleanup if cache is getting too large
    this.enforceMaxEntries(this.aggregatedBalanceCache)
  }

  /**
   * Invalidate cache for specific address and network
   */
  invalidateNetworkBalance(address: string, network: SupportedNetwork): void {
    const key = this.getNetworkBalanceKey(address, network)
    this.networkBalanceCache.delete(key)
    this.backgroundRefreshQueue.delete(key)
  }

  /**
   * Invalidate all cache for specific address
   */
  invalidateAddress(address: string): void {
    // Remove network balances
    for (const key of this.networkBalanceCache.keys()) {
      if (key.startsWith(address + ':')) {
        this.networkBalanceCache.delete(key)
        this.backgroundRefreshQueue.delete(key)
      }
    }
    
    // Remove aggregated balances
    for (const key of this.aggregatedBalanceCache.keys()) {
      if (key.startsWith(address + ':')) {
        this.aggregatedBalanceCache.delete(key)
        this.backgroundRefreshQueue.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.networkBalanceCache.clear()
    this.aggregatedBalanceCache.clear()
    this.backgroundRefreshQueue.clear()
    this.refreshInProgress.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    networkBalanceEntries: number
    aggregatedBalanceEntries: number
    backgroundRefreshQueueSize: number
    refreshInProgressSize: number
  } {
    return {
      networkBalanceEntries: this.networkBalanceCache.size,
      aggregatedBalanceEntries: this.aggregatedBalanceCache.size,
      backgroundRefreshQueueSize: this.backgroundRefreshQueue.size,
      refreshInProgressSize: this.refreshInProgress.size
    }
  }

  /**
   * Get all cached addresses
   */
  getCachedAddresses(): string[] {
    const addresses = new Set<string>()
    
    for (const key of this.networkBalanceCache.keys()) {
      const address = key.split(':')[0]
      addresses.add(address)
    }
    
    for (const key of this.aggregatedBalanceCache.keys()) {
      const address = key.split(':')[0]
      addresses.add(address)
    }
    
    return Array.from(addresses)
  }

  /**
   * Enforce maximum cache entries by removing oldest entries
   */
  private enforceMaxEntries<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size <= this.config.maxEntries) return

    // Sort by timestamp and remove oldest entries
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    const toRemove = entries.slice(0, cache.size - this.config.maxEntries)
    toRemove.forEach(([key]) => cache.delete(key))
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    
    // Clean network balance cache
    for (const [key, entry] of this.networkBalanceCache.entries()) {
      if (now > entry.expiry) {
        this.networkBalanceCache.delete(key)
        this.backgroundRefreshQueue.delete(key)
      }
    }
    
    // Clean aggregated balance cache
    for (const [key, entry] of this.aggregatedBalanceCache.entries()) {
      if (now > entry.expiry) {
        this.aggregatedBalanceCache.delete(key)
        this.backgroundRefreshQueue.delete(key)
      }
    }

    console.log(`🧹 Cache cleanup completed. Network: ${this.networkBalanceCache.size}, Aggregated: ${this.aggregatedBalanceCache.size}`)
  }

  /**
   * Start background refresh worker
   */
  private startBackgroundRefresh(): void {
    // Background refresh would need to be implemented with the balance service
    // This is a placeholder for the actual implementation
    setInterval(() => {
      if (this.backgroundRefreshQueue.size > 0) {
        console.log(`🔄 Background refresh queue has ${this.backgroundRefreshQueue.size} items`)
        // In a real implementation, this would trigger balance refreshes
        // for items in the queue using the balance service
      }
    }, 5000)
  }

  /**
   * Preload balances for common networks
   */
  async preload(address: string, networks: SupportedNetwork[], balanceService: any): Promise<void> {
    try {
      console.log(`🚀 Preloading balances for ${address} across ${networks.length} networks`)
      
      // This would typically be done by the balance service
      const promises = networks.map(async (network) => {
        const key = this.getNetworkBalanceKey(address, network)
        if (!this.networkBalanceCache.has(key) && !this.refreshInProgress.has(key)) {
          this.refreshInProgress.add(key)
          try {
            const balance = await balanceService.getNetworkBalances(address, network)
            this.setNetworkBalance(address, network, balance)
          } catch (error) {
            console.warn(`Failed to preload ${network} balance:`, error)
          } finally {
            this.refreshInProgress.delete(key)
          }
        }
      })
      
      await Promise.all(promises)
      console.log(`✅ Preloading completed for ${address}`)
    } catch (error) {
      console.error('Preload failed:', error)
    }
  }
}

// Global cache instance
export const balanceCache = new BalanceCache()

// Browser console access for debugging
if (typeof window !== 'undefined') {
  (window as any).balanceCache = balanceCache
}