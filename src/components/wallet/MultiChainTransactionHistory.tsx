'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Zap,
  Globe
} from 'lucide-react'
import { multiChainTransactionHistory, type MultiChainTransaction } from '@/lib/services/multiChainTransactionHistory'
import { getEthereumNetwork } from '@/config/blockchain'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

interface MultiChainTransactionHistoryProps {
  walletAddress: string
  showTestnets?: boolean
  className?: string
}

const networkIcons: Record<SupportedNetwork, string> = {
  sepolia: '🔧',
  arbitrumSepolia: '🔵',
  baseSepolia: '🔷',
  optimismSepolia: '🔴',
  polygonAmoy: '🟣'
}

const typeIcons = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  deposit: ArrowDownLeft,
  withdraw: ArrowUpRight,
  bridge: Building,
  swap: RefreshCw
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
}

export function MultiChainTransactionHistory({
  walletAddress,
  showTestnets = false,
  className = ''
}: MultiChainTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<MultiChainTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<MultiChainTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all')
  const [selectedType, setSelectedType] = useState<'all' | MultiChainTransaction['type']>('all')
  const [statistics, setStatistics] = useState<any>(null)

  useEffect(() => {
    loadTransactions()
    const interval = setInterval(loadTransactions, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [walletAddress])

  useEffect(() => {
    applyFilters()
  }, [transactions, searchTerm, selectedNetwork, selectedStatus, selectedType])

  const loadTransactions = () => {
    setLoading(true)
    try {
      const allTransactions = multiChainTransactionHistory.getTransactionsByAddress(walletAddress, 100)
      const stats = multiChainTransactionHistory.getStatistics()
      
      setTransactions(allTransactions)
      setStatistics(stats)
    } catch (error) {
      console.error('Failed to load transaction history:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = transactions

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(term) ||
        tx.to.toLowerCase().includes(term) ||
        tx.from.toLowerCase().includes(term) ||
        tx.metadata?.description?.toLowerCase().includes(term)
      )
    }

    // Network filter
    if (selectedNetwork !== 'all') {
      filtered = filtered.filter(tx => tx.network === selectedNetwork)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === selectedStatus)
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(tx => tx.type === selectedType)
    }

    // Testnet filter
    if (!showTestnets) {
      filtered = filtered.filter(tx => !getEthereumNetwork(tx.network).isTestnet)
    }

    setFilteredTransactions(filtered)
  }

  const formatAmount = (amount: string, asset: string) => {
    const num = parseFloat(amount)
    if (num === 0) return `0 ${asset}`
    if (num < 0.000001) return `< 0.000001 ${asset}`
    return `${num.toFixed(6)} ${asset}`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getTransactionDirection = (tx: MultiChainTransaction) => {
    const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase()
    return isOutgoing ? 'Sent' : 'Received'
  }

  const exportToCSV = () => {
    const csv = multiChainTransactionHistory.exportToCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const StatusIcon = ({ status }: { status: MultiChainTransaction['status'] }) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{statistics.byStatus.confirmed || 0}</p>
              <p className="text-sm text-gray-600">Confirmed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{statistics.byStatus.pending || 0}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {statistics.totalValue.USDC.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total USDC</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Multi-Chain Transaction History</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadTransactions}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Network Filter */}
            <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Networks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                <SelectItem value="sepolia">Sepolia</SelectItem>
                <SelectItem value="arbitrumSepolia">Arbitrum Sepolia</SelectItem>
                <SelectItem value="baseSepolia">Base Sepolia</SelectItem>
                <SelectItem value="optimismSepolia">OP Sepolia</SelectItem>
                <SelectItem value="polygonAmoy">Polygon Amoy</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="send">Send</SelectItem>
                <SelectItem value="receive">Receive</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdraw">Withdraw</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
                <SelectItem value="swap">Swap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => {
                const TypeIcon = typeIcons[tx.type]
                const networkConfig = getEthereumNetwork(tx.network)
                const direction = getTransactionDirection(tx)
                
                return (
                  <Card key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Transaction Type Icon */}
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {direction} {tx.asset}
                              </h4>
                              <span className="text-xl">{networkIcons[tx.network]}</span>
                              <span className="text-sm text-gray-600">{networkConfig.name}</span>
                              {tx.isGasless && (
                                <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                  <Zap className="w-2 h-2 mr-1" />
                                  Gasless
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{formatAddress(direction === 'Sent' ? tx.to : tx.from)}</span>
                              <span>•</span>
                              <span>{tx.timestamp.toLocaleString()}</span>
                              {tx.bridgeInfo && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center space-x-1">
                                    <Building className="w-3 h-3" />
                                    <span>{tx.bridgeInfo.bridgeProtocol}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {direction === 'Sent' ? '-' : '+'}{formatAmount(tx.value, tx.asset)}
                            </p>
                            {tx.metadata?.usdValue && (
                              <p className="text-sm text-gray-600">
                                ${tx.metadata.usdValue.toFixed(2)}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={statusColors[tx.status]}>
                              <StatusIcon status={tx.status} />
                              <span className="ml-1 capitalize">{tx.status}</span>
                            </Badge>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const explorerUrl = `${networkConfig.blockExplorer}/tx/${tx.hash}`
                                window.open(explorerUrl, '_blank')
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedNetwork !== 'all' || selectedStatus !== 'all' || selectedType !== 'all'
                    ? 'Try adjusting your filters to see more transactions.'
                    : 'Your transaction history will appear here once you make some transactions.'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MultiChainTransactionHistory