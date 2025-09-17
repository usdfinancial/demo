'use client'

import { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, ShoppingCart, Repeat } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'buy' | 'swap'
  description: string
  amount: number
  currency: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  hash?: string
}

interface ActivityHistoryProps {
  transactions: Transaction[]
  onTransactionClick?: (transaction: Transaction) => void
}

export function ActivityHistory({ transactions, onTransactionClick }: ActivityHistoryProps) {
  const [activeTab, setActiveTab] = useState('all')

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(Math.abs(amount))
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      case 'buy':
        return <ShoppingCart className="h-4 w-4 text-purple-600" />
      case 'swap':
        return <Repeat className="h-4 w-4 text-orange-600" />
      default:
        return <ArrowUpRight className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-700 text-xs">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  const filterTransactions = (type: string) => {
    if (type === 'all') return transactions
    return transactions.filter(tx => tx.type === type)
  }

  const renderTransactionList = (filteredTransactions: Transaction[]) => {
    if (filteredTransactions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No transactions found</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            onClick={() => onTransactionClick?.(transaction)}
            className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-sm">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-base">{transaction.description}</p>
                  <p className="text-sm text-gray-500 font-medium">{transaction.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    transaction.type === 'deposit' ? 'text-emerald-600' : 
                    transaction.type === 'withdrawal' ? 'text-gray-900' : 
                    'text-gray-900'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <div className="flex justify-end">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg font-semibold">All</TabsTrigger>
            <TabsTrigger value="deposit" className="rounded-lg font-semibold">Money Added</TabsTrigger>
            <TabsTrigger value="withdrawal" className="rounded-lg font-semibold">Money Sent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderTransactionList(filterTransactions('all'))}
          </TabsContent>
          
          <TabsContent value="deposit">
            {renderTransactionList(filterTransactions('deposit'))}
          </TabsContent>
          
          <TabsContent value="withdrawal">
            {renderTransactionList(filterTransactions('withdrawal'))}
          </TabsContent>
          
        </Tabs>
      </CardContent>
    </Card>
  )
}