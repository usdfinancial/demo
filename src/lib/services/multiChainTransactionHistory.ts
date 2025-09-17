'use client'

import { getEthereumNetwork } from '@/config/blockchain'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy' | 'fuji'

interface MultiChainTransaction {
  id: string
  hash: string
  network: SupportedNetwork
  chainId: number
  blockNumber?: number
  timestamp: Date
  from: string
  to: string
  value: string
  asset: 'ETH' | 'USDC'
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'bridge' | 'swap'
  status: 'pending' | 'confirmed' | 'failed'
  gasUsed?: number
  gasPrice?: number
  gasLimit?: number
  isGasless: boolean
  confirmations: number
  requiredConfirmations: number
  bridgeInfo?: {
    sourceNetwork: SupportedNetwork
    targetNetwork: SupportedNetwork
    bridgeProtocol: string
  }
  metadata?: {
    description?: string
    contractAddress?: string
    tokenSymbol?: string
    tokenDecimals?: number
    usdValue?: number
    exchangeRate?: number
    error?: string
  }
}

interface TransactionHistoryConfig {
  maxTransactions: number
  refreshInterval: number
  blockConfirmations: Record<SupportedNetwork, number>
}

const DEFAULT_CONFIG: TransactionHistoryConfig = {
  maxTransactions: 1000,
  refreshInterval: 30000, // 30 seconds
  blockConfirmations: {
    sepolia: 12,
    arbitrumSepolia: 1,
    baseSepolia: 1,
    optimismSepolia: 1,
    polygonAmoy: 20,
    fuji: 1
  }
}

export class MultiChainTransactionHistoryService {
  private transactions: Map<string, MultiChainTransaction> = new Map()
  private networkTransactions: Map<SupportedNetwork, Set<string>> = new Map()
  private addressTransactions: Map<string, Set<string>> = new Map()
  private config: TransactionHistoryConfig
  private refreshInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<TransactionHistoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startAutoRefresh()
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage()
    }
  }

  /**
   * Add a new transaction
   */
  addTransaction(tx: Omit<MultiChainTransaction, 'id' | 'timestamp' | 'confirmations' | 'requiredConfirmations'>): MultiChainTransaction {
    const transaction: MultiChainTransaction = {
      ...tx,
      id: `${tx.network}_${tx.hash}_${Date.now()}`,
      timestamp: new Date(),
      confirmations: 0,
      requiredConfirmations: this.config.blockConfirmations[tx.network]
    }

    this.transactions.set(transaction.id, transaction)
    this.indexTransaction(transaction)
    this.saveToLocalStorage()
    
    console.log(`📝 Added transaction ${transaction.id} on ${tx.network}:`, transaction)
    return transaction
  }

  /**
   * Update transaction status
   */
  updateTransaction(id: string, updates: Partial<MultiChainTransaction>): boolean {
    const transaction = this.transactions.get(id)
    if (!transaction) return false

    const updatedTransaction = { ...transaction, ...updates }
    this.transactions.set(id, updatedTransaction)
    this.saveToLocalStorage()
    
    console.log(`📝 Updated transaction ${id}:`, updates)
    return true
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): MultiChainTransaction | null {
    return this.transactions.get(id) || null
  }

  /**
   * Get transactions by network
   */
  getTransactionsByNetwork(network: SupportedNetwork, limit?: number): MultiChainTransaction[] {
    const networkTxIds = this.networkTransactions.get(network) || new Set()
    const transactions = Array.from(networkTxIds)
      .map(id => this.transactions.get(id))
      .filter((tx): tx is MultiChainTransaction => tx !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return limit ? transactions.slice(0, limit) : transactions
  }

  /**
   * Get transactions by address
   */
  getTransactionsByAddress(address: string, limit?: number): MultiChainTransaction[] {
    const addressTxIds = this.addressTransactions.get(address.toLowerCase()) || new Set()
    const transactions = Array.from(addressTxIds)
      .map(id => this.transactions.get(id))
      .filter((tx): tx is MultiChainTransaction => tx !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return limit ? transactions.slice(0, limit) : transactions
  }

  /**
   * Get all transactions across all networks
   */
  getAllTransactions(limit?: number): MultiChainTransaction[] {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return limit ? transactions.slice(0, limit) : transactions
  }

  /**
   * Get transactions by status
   */
  getTransactionsByStatus(status: MultiChainTransaction['status'], limit?: number): MultiChainTransaction[] {
    const transactions = Array.from(this.transactions.values())
      .filter(tx => tx.status === status)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return limit ? transactions.slice(0, limit) : transactions
  }

  /**
   * Get pending transactions that need status updates
   */
  getPendingTransactions(): MultiChainTransaction[] {
    return this.getTransactionsByStatus('pending')
  }

  /**
   * Mark transaction as confirmed
   */
  confirmTransaction(id: string, blockNumber: number, confirmations: number): boolean {
    const tx = this.transactions.get(id)
    if (!tx) return false
    
    return this.updateTransaction(id, {
      status: confirmations >= tx.requiredConfirmations ? 'confirmed' : 'pending',
      blockNumber,
      confirmations
    })
  }

  /**
   * Mark transaction as failed
   */
  failTransaction(id: string, error?: string): boolean {
    const tx = this.transactions.get(id)
    return this.updateTransaction(id, {
      status: 'failed',
      metadata: {
        ...tx?.metadata,
        error
      }
    })
  }

  /**
   * Get transaction statistics
   */
  getStatistics(): {
    total: number
    byNetwork: Record<SupportedNetwork, number>
    byStatus: Record<string, number>
    byAsset: Record<string, number>
    totalValue: { ETH: number; USDC: number }
  } {
    const transactions = Array.from(this.transactions.values())
    
    const byNetwork = {} as Record<SupportedNetwork, number>
    const byStatus = {} as Record<string, number>
    const byAsset = {} as Record<string, number>
    const totalValue = { ETH: 0, USDC: 0 }

    transactions.forEach(tx => {
      // By network
      byNetwork[tx.network] = (byNetwork[tx.network] || 0) + 1
      
      // By status
      byStatus[tx.status] = (byStatus[tx.status] || 0) + 1
      
      // By asset
      byAsset[tx.asset] = (byAsset[tx.asset] || 0) + 1
      
      // Total value (only for confirmed transactions)
      if (tx.status === 'confirmed') {
        const value = parseFloat(tx.value)
        if (tx.asset === 'ETH') {
          totalValue.ETH += value
        } else if (tx.asset === 'USDC') {
          totalValue.USDC += value
        }
      }
    })

    return {
      total: transactions.length,
      byNetwork,
      byStatus,
      byAsset,
      totalValue
    }
  }

  /**
   * Clear all transactions
   */
  clear(): void {
    this.transactions.clear()
    this.networkTransactions.clear()
    this.addressTransactions.clear()
    this.saveToLocalStorage()
  }

  /**
   * Clear transactions for specific network
   */
  clearNetwork(network: SupportedNetwork): void {
    const networkTxIds = this.networkTransactions.get(network) || new Set()
    
    networkTxIds.forEach(id => {
      const tx = this.transactions.get(id)
      if (tx) {
        this.unindexTransaction(tx)
        this.transactions.delete(id)
      }
    })
    
    this.saveToLocalStorage()
  }

  /**
   * Index transaction for quick lookups
   */
  private indexTransaction(tx: MultiChainTransaction): void {
    // Index by network
    if (!this.networkTransactions.has(tx.network)) {
      this.networkTransactions.set(tx.network, new Set())
    }
    this.networkTransactions.get(tx.network)!.add(tx.id)

    // Index by addresses
    const fromAddress = tx.from.toLowerCase()
    const toAddress = tx.to.toLowerCase()
    
    if (!this.addressTransactions.has(fromAddress)) {
      this.addressTransactions.set(fromAddress, new Set())
    }
    if (!this.addressTransactions.has(toAddress)) {
      this.addressTransactions.set(toAddress, new Set())
    }
    
    this.addressTransactions.get(fromAddress)!.add(tx.id)
    this.addressTransactions.get(toAddress)!.add(tx.id)
  }

  /**
   * Remove transaction from indexes
   */
  private unindexTransaction(tx: MultiChainTransaction): void {
    // Remove from network index
    this.networkTransactions.get(tx.network)?.delete(tx.id)
    
    // Remove from address indexes
    const fromAddress = tx.from.toLowerCase()
    const toAddress = tx.to.toLowerCase()
    
    this.addressTransactions.get(fromAddress)?.delete(tx.id)
    this.addressTransactions.get(toAddress)?.delete(tx.id)
  }

  /**
   * Save to localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          transactions: Array.from(this.transactions.entries()),
          timestamp: Date.now()
        }
        localStorage.setItem('multiChainTransactionHistory', JSON.stringify(data))
      } catch (error) {
        console.warn('Failed to save transaction history to localStorage:', error)
      }
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('multiChainTransactionHistory')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Convert back to Map and rebuild indexes
        data.transactions.forEach(([id, tx]: [string, any]) => {
          // Convert timestamp back to Date
          tx.timestamp = new Date(tx.timestamp)
          this.transactions.set(id, tx)
          this.indexTransaction(tx)
        })
        
        console.log(`📂 Loaded ${this.transactions.size} transactions from localStorage`)
      }
    } catch (error) {
      console.warn('Failed to load transaction history from localStorage:', error)
    }
  }

  /**
   * Auto-refresh pending transactions
   */
  private startAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    this.refreshInterval = setInterval(() => {
      const pendingTx = this.getPendingTransactions()
      if (pendingTx.length > 0) {
        console.log(`🔄 Auto-refresh: ${pendingTx.length} pending transactions`)
        // In a real implementation, this would query block explorers for updates
      }
    }, this.config.refreshInterval)
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  /**
   * Export transactions to CSV
   */
  exportToCSV(): string {
    const transactions = this.getAllTransactions()
    const headers = [
      'ID', 'Hash', 'Network', 'Chain ID', 'Timestamp', 'From', 'To', 
      'Value', 'Asset', 'Type', 'Status', 'Gas Used', 'Gas Price', 'Confirmations'
    ]
    
    const csvRows = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.id,
        tx.hash,
        tx.network,
        tx.chainId,
        tx.timestamp.toISOString(),
        tx.from,
        tx.to,
        tx.value,
        tx.asset,
        tx.type,
        tx.status,
        tx.gasUsed || '',
        tx.gasPrice || '',
        tx.confirmations
      ].map(field => `"${field}"`).join(','))
    ]
    
    return csvRows.join('\n')
  }

  /**
   * Cleanup old transactions
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): number { // Default 7 days
    const cutoff = Date.now() - maxAge
    let removed = 0
    
    for (const [id, tx] of this.transactions.entries()) {
      if (tx.timestamp.getTime() < cutoff) {
        this.unindexTransaction(tx)
        this.transactions.delete(id)
        removed++
      }
    }
    
    if (removed > 0) {
      this.saveToLocalStorage()
      console.log(`🧹 Cleaned up ${removed} old transactions`)
    }
    
    return removed
  }
}

// Global service instance
export const multiChainTransactionHistory = new MultiChainTransactionHistoryService()

// Browser console access for debugging
if (typeof window !== 'undefined') {
  (window as any).multiChainTransactionHistory = multiChainTransactionHistory
}