'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { enhancedTransactions, getTransactionTypeIcon, getChainName, type EnhancedTransaction } from '@/lib/data'
import { Activity, Download, RefreshCw, Search, TrendingUp, TrendingDown, DollarSign, FileText, BarChart3, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { NotificationModal } from '@/components/ui/NotificationModal'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Local formatCurrency function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export default function TransactionsPage() {
  const { user } = useEnhancedAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<EnhancedTransaction | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate summary
  const totalTransactions = enhancedTransactions.length
  const totalVolume = enhancedTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
  const totalIncoming = enhancedTransactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0)
  const totalOutgoing = enhancedTransactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  // Filter transactions
  const filteredTransactions = enhancedTransactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.sender?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || tx.type === filterType
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleExport = () => {
    setShowExportModal(true)
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
                {totalTransactions}
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
                {formatCurrency(totalVolume)}
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
                {formatCurrency(totalIncoming)}
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
                {formatCurrency(totalOutgoing)}
              </div>
              <p className="text-sm text-muted-foreground">Sent</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
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
        </div>
      </div>
    ))}
  </div>
</CardContent>
</Card>

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

{/* Export Modal */}
<NotificationModal
  open={showExportModal}
  onOpenChange={setShowExportModal}
  type="transaction"
  title="Transaction Export Started"
  message="Your transaction export has been initiated successfully"
  details={[
    `Total Transactions: ${filteredTransactions.length}`,
    `Export Format: CSV with full transaction details`,
    `Processing Time: 2-3 minutes`,
    `Delivery Method: Email notification when ready`,
    `File Size: Estimated ${Math.ceil(filteredTransactions.length / 100)}MB`
  ]}
  actionLabel="View Export History"
  onAction={() => {
    console.log('Demo: Would show export history')
    setShowExportModal(false)
  }}
  showCopy={true}
  copyText={`Transaction Export: ${filteredTransactions.length} transactions | ${new Date().toISOString()}`}
/>
</AuthGuard>
</AuthGuard>
