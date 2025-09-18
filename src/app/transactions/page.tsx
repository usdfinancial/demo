'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { enhancedTransactions, getTransactionTypeIcon, getChainName, type EnhancedTransaction } from '@/lib/data'
import { Activity, ArrowUpRight, ArrowDownLeft, Filter, Download, RefreshCw, Search, Calendar, TrendingUp, TrendingDown, DollarSign, CreditCard, Zap, FileText, BarChart3, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface TransactionSummary {
  totalTransactions: number
  totalVolume: number
  totalIncoming: number
  totalOutgoing: number
  monthlyGrowth: number
}

interface TransactionAnalytics {
  byType: { type: string; count: number; volume: number }[]
  byCategory: { category: string; count: number; volume: number }[]
  monthlyTrend: { month: string; volume: number; count: number }[]
}

// Local formatCurrency function to avoid import conflicts
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export default function TransactionsPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<EnhancedTransaction | null>(null)

  // Calculate transaction summary
  const transactionSummary: TransactionSummary = {
    totalTransactions: enhancedTransactions.length,
    totalVolume: enhancedTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    totalIncoming: enhancedTransactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0),
    totalOutgoing: enhancedTransactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    monthlyGrowth: 12.5
  }

  // Calculate analytics
  const analytics: TransactionAnalytics = {
    byType: Object.entries(
      enhancedTransactions.reduce((acc, tx) => {
        acc[tx.type] = acc[tx.type] || { count: 0, volume: 0 }
        acc[tx.type].count++
        acc[tx.type].volume += Math.abs(tx.amount)
        return acc
      }, {} as Record<string, { count: number; volume: number }>)
    ).map(([type, data]) => ({ type, ...data })),
    byCategory: Object.entries(
      enhancedTransactions.reduce((acc, tx) => {
        const category = tx.category || 'other'
        acc[category] = acc[category] || { count: 0, volume: 0 }
        acc[category].count++
        acc[category].volume += Math.abs(tx.amount)
        return acc
      }, {} as Record<string, { count: number; volume: number }>)
    ).map(([category, data]) => ({ category, ...data })),
    monthlyTrend: [
      { month: 'Dec', volume: 45230, count: 28 },
      { month: 'Jan', volume: 52100, count: 35 },
      { month: 'Feb', volume: 48900, count: 31 }
    ]
  }

  // Filter transactions
  const filteredTransactions = enhancedTransactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.sender?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || tx.type === filterType
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleExport = () => {
    // Mock export functionality
    alert('Transaction export started. You will receive an email when ready.')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to view transactions</h3>
            <p className="text-muted-foreground">Connect your account to access transaction history</p>
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
              Transaction History
            </h1>
            <p className="text-muted-foreground">Track and analyze your financial activity</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsLoading(true)}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {transactionSummary.totalTransactions}
              </div>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(transactionSummary.totalVolume)}
              </div>
              <p className="text-sm text-muted-foreground">All transactions</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Incoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(transactionSummary.totalIncoming)}
              </div>
              <p className="text-sm text-muted-foreground">Received</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Outgoing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(transactionSummary.totalOutgoing)}
              </div>
              <p className="text-sm text-muted-foreground">Sent</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="border-emerald-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      Transaction History
                    </CardTitle>
                    <CardDescription>
                      View and filter your transaction history
                    </CardDescription>
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="deposit">Deposits</SelectItem>
                      <SelectItem value="payment">Payments</SelectItem>
                      <SelectItem value="transfer">Transfers</SelectItem>
                      <SelectItem value="yield">Yield</SelectItem>
                      <SelectItem value="loan">Loans</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          {getTransactionTypeIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{transaction.description}</p>
                            {transaction.tags && transaction.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDate(transaction.timestamp)}</span>
                            {transaction.chainId && (
                              <span>• {getChainName(transaction.chainId)}</span>
                            )}
                            {transaction.recipient && (
                              <span>• To: {transaction.recipient}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-slate-900'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                          {transaction.fee && transaction.fee > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Fee: {formatCurrency(transaction.fee)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-4">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  By Transaction Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.byType.slice(0, 5).map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm capitalize">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(item.volume)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.monthlyTrend.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm">{item.month}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(item.volume)}</div>
                      <div className="text-xs text-muted-foreground">{item.count} txns</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction Detail Modal */}
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Complete information about this transaction
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                    <p className="font-mono text-sm">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="capitalize">{selectedTransaction.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className={`font-semibold ${
                      selectedTransaction.amount > 0 ? 'text-green-600' : 'text-slate-900'
                    }`}>
                      {selectedTransaction.amount > 0 ? '+' : ''}
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge variant={selectedTransaction.status === 'completed' ? 'default' : 'secondary'}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p>{formatDate(selectedTransaction.timestamp)}</p>
                  </div>
                  {selectedTransaction.chainId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Network</label>
                      <p>{getChainName(selectedTransaction.chainId)}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p>{selectedTransaction.description}</p>
                </div>
                
                {selectedTransaction.merchantInfo && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Merchant</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedTransaction.merchantInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTransaction.merchantInfo.category}</p>
                      {selectedTransaction.merchantInfo.location && (
                        <p className="text-sm text-muted-foreground">{selectedTransaction.merchantInfo.location}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tags</label>
                    <div className="flex gap-2 mt-1">
                      {selectedTransaction.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
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
