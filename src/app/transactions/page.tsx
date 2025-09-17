'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { Activity, ArrowUpRight, ArrowDownLeft, Filter, Download, RefreshCw, Search, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'exchange'
  amount: number
  currency: string
  description: string
  status: 'completed' | 'pending' | 'failed'
  timestamp: string
  recipient?: string
  sender?: string
  fee?: number
}

interface TransactionSummary {
  totalTransactions: number
  totalVolume: number
  totalIncoming: number
  totalOutgoing: number
  monthlyGrowth: number
}

export default function TransactionsPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Mock transaction data
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'deposit',
      amount: 5000,
      currency: 'USDC',
      description: 'Deposit from Coinbase',
      status: 'completed',
      timestamp: '2024-01-15T10:30:00Z',
      sender: 'Coinbase',
      fee: 2.50
    },
    {
      id: '2',
      type: 'payment',
      amount: -150,
      currency: 'USDC',
      description: 'Coffee Shop Payment',
      status: 'completed',
      timestamp: '2024-01-15T14:22:00Z',
      recipient: 'Starbucks',
      fee: 0.50
    },
    {
      id: '3',
      type: 'transfer',
      amount: -1000,
      currency: 'USDT',
      description: 'Transfer to Investment Account',
      status: 'completed',
      timestamp: '2024-01-14T16:45:00Z',
      recipient: 'Investment Portfolio',
      fee: 1.00
    },
    {
      id: '4',
      type: 'exchange',
      amount: 2500,
      currency: 'USDC',
      description: 'USDT → USDC Exchange',
      status: 'completed',
      timestamp: '2024-01-14T09:15:00Z',
      fee: 5.00
    },
    {
      id: '5',
      type: 'withdrawal',
      amount: -500,
      currency: 'USDC',
      description: 'ATM Withdrawal',
      status: 'pending',
      timestamp: '2024-01-13T18:30:00Z',
      fee: 3.00
    }
  ]

  const summary: TransactionSummary = {
    totalTransactions: transactions.length,
    totalVolume: transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    totalIncoming: transactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0),
    totalOutgoing: Math.abs(transactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0)),
    monthlyGrowth: 12.5
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'exchange':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'withdrawal':
      case 'payment':
      case 'transfer':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.sender?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || tx.type === filterType
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'incoming' && tx.amount > 0) ||
                      (selectedTab === 'outgoing' && tx.amount < 0)
    
    return matchesSearch && matchesFilter && matchesTab
  })

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleExport = () => {
    // Simulate export functionality
    alert('Transaction export started. You will receive an email when ready.')
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to view transactions</h3>
            <p className="text-muted-foreground">Connect your account to access your transaction history</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-muted-foreground">Track your stablecoin transactions and spending</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline"
              onClick={handleExport}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{summary.totalTransactions}</div>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-green-600" />
                Total Incoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncoming)}</div>
              <p className="text-sm text-muted-foreground">Deposits & receipts</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-red-600" />
                Total Outgoing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOutgoing)}</div>
              <p className="text-sm text-muted-foreground">Payments & transfers</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Monthly Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">+{summary.monthlyGrowth}%</div>
              <p className="text-sm text-muted-foreground">vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="exchange">Exchanges</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction List */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Transaction History
            </CardTitle>
            <CardDescription>
              Your recent stablecoin transactions and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="incoming">Incoming</TabsTrigger>
                <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="mt-6">
                <div className="space-y-4">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <h3 className="font-medium">{transaction.description}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatDate(transaction.timestamp)}</span>
                              <span>•</span>
                              <span className="capitalize">{transaction.type}</span>
                              {transaction.recipient && (
                                <>
                                  <span>•</span>
                                  <span>To: {transaction.recipient}</span>
                                </>
                              )}
                              {transaction.sender && (
                                <>
                                  <span>•</span>
                                  <span>From: {transaction.sender}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(transaction.status)}
                            <span className="text-sm text-muted-foreground">{transaction.currency}</span>
                          </div>
                          {transaction.fee && (
                            <div className="text-xs text-muted-foreground">
                              Fee: {formatCurrency(transaction.fee)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || filterType !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'Your transactions will appear here once you start using the platform'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
