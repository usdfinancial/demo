'use client'

// Real transaction history service that could integrate with blockchain APIs
export interface WalletTransaction {
  id: string
  type: 'send' | 'receive' | 'gasless' | 'batch'
  description: string
  amount: number
  currency: string
  timestamp: string
  status: 'completed' | 'pending' | 'failed'
  hash: string
  gasUsed?: number
  gasPrice?: number
  isGasless: boolean
  walletType: 'smart' | 'eoa'
  to?: string
  from?: string
  blockNumber?: number
  confirmations?: number
}

class TransactionHistoryService {
  private transactions: WalletTransaction[] = []

  constructor() {
    // Initialize with some sample transactions based on actual wallet data
    this.loadInitialTransactions()
  }

  private loadInitialTransactions() {
    // These would typically come from blockchain APIs or indexing services
    this.transactions = [
      {
        id: `tx_${Date.now()}_1`,
        type: 'receive',
        description: 'Test ETH received',
        amount: 0.1,
        currency: 'ETH',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        status: 'completed',
        hash: '0x' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
        gasUsed: 21000,
        gasPrice: 20,
        isGasless: false,
        walletType: 'eoa',
        from: '0x742d35Cc6639C0532fba96e5B11A7C8CfF7baB5E',
        blockNumber: 18500000 + Math.floor(Math.random() * 1000),
        confirmations: 12
      },
      {
        id: `tx_${Date.now()}_2`,
        type: 'gasless',
        description: 'Smart wallet initialization',
        amount: 0,
        currency: 'ETH',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        status: 'completed',
        hash: '0x' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
        gasUsed: 0,
        gasPrice: 0,
        isGasless: true,
        walletType: 'smart',
        blockNumber: 18500000 + Math.floor(Math.random() * 1000),
        confirmations: 24
      }
    ]
  }

  /**
   * Add a new transaction to the history
   */
  addTransaction(transaction: Omit<WalletTransaction, 'id' | 'timestamp' | 'confirmations'>): WalletTransaction {
    const newTransaction: WalletTransaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      confirmations: transaction.status === 'completed' ? 1 : 0
    }

    this.transactions.unshift(newTransaction) // Add to beginning
    return newTransaction
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): WalletTransaction[] {
    return [...this.transactions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: 'all' | 'gasless' | 'regular'): WalletTransaction[] {
    const allTx = this.getAllTransactions()
    
    if (type === 'gasless') {
      return allTx.filter(tx => tx.isGasless)
    }
    
    if (type === 'regular') {
      return allTx.filter(tx => !tx.isGasless)
    }
    
    return allTx
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats() {
    const all = this.getAllTransactions()
    const gasless = all.filter(tx => tx.isGasless)
    const regular = all.filter(tx => !tx.isGasless)
    
    const gasSaved = regular.reduce((total, tx) => {
      if (tx.gasUsed && tx.gasPrice) {
        return total + (tx.gasUsed * tx.gasPrice) / 1e9 // Convert to ETH
      }
      return total
    }, 0)

    const successRate = all.length > 0 
      ? (all.filter(tx => tx.status === 'completed').length / all.length) * 100 
      : 100

    return {
      total: all.length,
      gasless: gasless.length,
      regular: regular.length,
      gasSaved: gasSaved * 3200, // Convert to USD approximation
      successRate: Math.round(successRate)
    }
  }

  /**
   * Update transaction status (for pending transactions)
   */
  updateTransactionStatus(txId: string, status: 'completed' | 'pending' | 'failed', confirmations = 0) {
    const txIndex = this.transactions.findIndex(tx => tx.id === txId)
    if (txIndex !== -1) {
      this.transactions[txIndex].status = status
      this.transactions[txIndex].confirmations = confirmations
    }
  }

  /**
   * Simulate adding a new transaction (for demo purposes)
   */
  simulateTransaction(type: 'send' | 'receive' | 'gasless', isGasless = false): WalletTransaction {
    const descriptions = {
      send: ['Sent to friend', 'Payment to merchant', 'Transfer to exchange'],
      receive: ['Received from friend', 'Salary payment', 'Exchange withdrawal'],
      gasless: ['Smart contract interaction', 'DeFi operation', 'Token approval']
    }

    const amounts = type === 'send' ? [-0.01, -0.05, -0.1] : [0.01, 0.05, 0.1]
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)]
    const randomDescription = descriptions[type][Math.floor(Math.random() * descriptions[type].length)]

    return this.addTransaction({
      type,
      description: randomDescription,
      amount: type === 'gasless' ? 0 : randomAmount,
      currency: 'ETH',
      status: 'pending',
      hash: '0x' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
      gasUsed: isGasless ? 0 : 21000,
      gasPrice: isGasless ? 0 : 20,
      isGasless,
      walletType: isGasless ? 'smart' : 'eoa',
      to: type === 'send' ? '0x742d35Cc6639C0532fba96e5B11A7C8CfF7baB5E' : undefined,
      from: type === 'receive' ? '0x8ba1f109551bD432803012645Hac136c29912' : undefined,
      blockNumber: 18500000 + Math.floor(Math.random() * 1000)
    })
  }
}

// Singleton instance
export const transactionHistoryService = new TransactionHistoryService()

/**
 * Hook for using transaction history in components
 */
export function useTransactionHistory() {
  const addTransaction = (tx: Omit<WalletTransaction, 'id' | 'timestamp' | 'confirmations'>) => {
    return transactionHistoryService.addTransaction(tx)
  }

  const getTransactions = (type: 'all' | 'gasless' | 'regular' = 'all') => {
    return transactionHistoryService.getTransactionsByType(type)
  }

  const getStats = () => {
    return transactionHistoryService.getTransactionStats()
  }

  const simulateTransaction = (type: 'send' | 'receive' | 'gasless', isGasless = false) => {
    return transactionHistoryService.simulateTransaction(type, isGasless)
  }

  return {
    addTransaction,
    getTransactions,
    getStats,
    simulateTransaction
  }
}