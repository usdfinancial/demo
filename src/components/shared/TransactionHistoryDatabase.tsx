'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Filter, Download } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, getTransactionTypeIcon, getStablecoinIcon, getChainName } from '@/lib/data'
import type { TransactionWithDetails, TransactionFilters } from '@/lib/services/transactionService'

interface TransactionHistoryDatabaseProps {
  showFilters?: boolean
  showExport?: boolean
  limit?: number
  className?: string
}

export function TransactionHistoryDatabase({ 
  showFilters = true, 
  showExport = true, 
  limit,
  className = '' 
}: TransactionHistoryDatabaseProps) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Load transactions from API
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.address) return
      
      try {
        setLoading(true)
        setError(null)
        
        const filters: TransactionFilters = {
          page,
          limit: limit || 20,
          status: statusFilter === 'all' ? undefined : statusFilter as any,
          transactionType: typeFilter === 'all' ? undefined : typeFilter as any,
          search: searchTerm || undefined,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
        
        const queryParams = new URLSearchParams({
          userId: user.address,
          action: 'list',
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== undefined)
          )
        })
        
        const response = await fetch(`/api/transactions?${queryParams}`)
        if (!response.ok) {
          throw new Error('Failed to load transaction history')
        }
        
        const data = await response.json()
        
        setTransactions(data.transactions || data.data || data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setHasMore(data.pagination?.hasMore || false)
      } catch (err) {
        console.error('Error loading transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transaction history')
      } finally {
        setLoading(false)
      }
    }
    
    loadTransactions()
  }, [user?.address, page, statusFilter, typeFilter, searchTerm, limit])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit'
      case 'withdrawal':
        return 'Withdrawal'
      case 'yield':
        return 'Yield'
      case 'swap':
        return 'Swap'
      case 'bridge':
        return 'Bridge'
      case 'spend':
        return 'Spend'
      case 'investment':
        return 'Investment'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const handleExport = async () => {
    if (!user?.address) return
    
    try {
      const response = await fetch(`/api/transactions?userId=${user.address}&action=export&format=csv`)
      if (!response.ok) {
        throw new Error('Failed to export transactions')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      setError('Failed to export transactions')
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading && page === 1) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Loading your transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-slate-600">Loading transactions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Error loading transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-red-600 text-lg font-semibold">Error loading transactions</div>
            <p className="text-slate-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {transactions.length > 0 
                ? `${transactions.length} recent transactions` 
                : 'Complete record of your transactions'
              }
            </CardDescription>
          </div>
          {showExport && transactions.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="yield">Yield</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="swap">Swap</SelectItem>
                  <SelectItem value="bridge">Bridge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
      
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6 text-slate-400" />
            </div>
            <p>No transactions found</p>
            <p className="text-sm">Your transaction history will appear here</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Stablecoin</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                          {getTransactionTypeIcon(transaction.transaction_type)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {transaction.description || `${getTypeLabel(transaction.transaction_type)} transaction`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.protocol_name && `${transaction.protocol_name} • `}
                            {transaction.networkName || getChainName(transaction.chain_id)}
                            {' • '}
                            {formatTimeAgo(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{getStablecoinIcon(transaction.stablecoin)}</span>
                        <span className="font-medium">{transaction.stablecoin}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeLabel(transaction.transaction_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(transaction.status)}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      parseFloat(transaction.amount) > 0 ? 'text-green-600' : 'text-foreground'
                    }`}>
                      {parseFloat(transaction.amount) > 0 ? '+' : ''}
                      {formatCurrency(parseFloat(transaction.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {!limit && totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1 || loading}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages || loading}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
            
            {loading && page > 1 && (
              <div className="flex justify-center mt-4">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              </div>
            )}
          </>
        )}
        
        {error && transactions.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}