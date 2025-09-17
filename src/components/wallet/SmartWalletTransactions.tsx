'use client'

import { useState, useEffect } from 'react'
import { useTransactionHistory } from '@/lib/transactionHistory'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  ExternalLink, 
  Copy, 
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Fuel
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Transaction {
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
}

interface SmartWalletTransactionsProps {
  isAAReady: boolean
  smartWalletAddress: string | null
  eoaAddress: string | null
}

export function SmartWalletTransactions({ 
  isAAReady, 
  smartWalletAddress, 
  eoaAddress 
}: SmartWalletTransactionsProps) {
  const [filter, setFilter] = useState<'all' | 'gasless' | 'regular'>('all')
  const [copiedTx, setCopiedTx] = useState<string | null>(null)
  const { getTransactions, getStats } = useTransactionHistory()

  // Get real transaction data
  const transactions = getTransactions(filter)
  const stats = getStats()

  // Convert to component format
  const formattedTransactions: Transaction[] = transactions.map(tx => ({
    id: tx.id,
    type: tx.type,
    description: tx.description,
    amount: tx.amount,
    currency: tx.currency,
    timestamp: formatTimestamp(tx.timestamp),
    status: tx.status,
    hash: tx.hash,
    gasUsed: tx.gasUsed,
    gasPrice: tx.gasPrice,
    isGasless: tx.isGasless,
    walletType: tx.walletType,
    to: tx.to,
    from: tx.from
  }))

  function formatTimestamp(timestamp: string): string {
    const now = new Date()
    const txTime = new Date(timestamp)
    const diffMs = now.getTime() - txTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return txTime.toLocaleDateString()
  }

  // Use the real transactions
  const filteredTransactions = formattedTransactions

  const copyToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedTx(hash)
      setTimeout(() => setCopiedTx(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getTransactionIcon = (type: string, isGasless: boolean) => {
    if (isGasless) {
      return <Zap className="w-5 h-5 text-emerald-600" />
    }
    
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />
      case 'receive':
        return <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
      case 'batch':
        return <Zap className="w-5 h-5 text-purple-600" />
      default:
        return <ArrowUpRight className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const formatAmount = (amount: number) => {
    const sign = amount > 0 ? '+' : ''
    return `${sign}${amount.toFixed(4)} ETH`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getGasCost = (gasUsed?: number, gasPrice?: number) => {
    if (!gasUsed || !gasPrice) return 'Free'
    const cost = (gasUsed * gasPrice) / 1e9 // Convert to ETH
    return `$${(cost * 3200).toFixed(2)}` // Approximate USD
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Transaction History</h3>
          <p className="text-gray-600">Smart wallet and backup EOA transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'gasless' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('gasless')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Zap className="w-4 h-4 mr-1" />
            Gasless
          </Button>
          <Button
            variant={filter === 'regular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('regular')}
          >
            <Fuel className="w-4 h-4 mr-1" />
            Regular
          </Button>
        </div>
      </div>

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {stats.gasless}
              </p>
              <p className="text-sm text-gray-600">Gasless Transactions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {stats.regular}
              </p>
              <p className="text-sm text-gray-600">Regular Transactions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${stats.gasSaved.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Gas Saved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Recent Transactions</span>
            <Badge className="bg-gray-100 text-gray-800">
              {filteredTransactions.length} transactions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      {getTransactionIcon(tx.type, tx.isGasless)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{tx.description}</p>
                        {tx.isGasless && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Gasless
                          </Badge>
                        )}
                        <Badge 
                          className={`text-xs ${
                            tx.walletType === 'smart' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tx.walletType === 'smart' ? 'Smart Wallet' : 'EOA'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-600">{tx.timestamp}</p>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(tx.status)}
                          <span className="text-sm text-gray-600 capitalize">{tx.status}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Gas: {getGasCost(tx.gasUsed, tx.gasPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      {formatAmount(tx.amount)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-500 font-mono">
                        {formatAddress(tx.hash)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(tx.hash)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    {copiedTx === tx.hash && (
                      <p className="text-xs text-emerald-600 mt-1">✓ Copied</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}