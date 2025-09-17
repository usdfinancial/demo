'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { mockStablecoinTransactions, formatCurrency, formatDate, getTransactionTypeIcon, getStablecoinIcon, getChainName } from '@/lib/data'

export function TransactionHistory() {
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
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stablecoin Transaction History</CardTitle>
        <CardDescription>
          Complete record of your stablecoin transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            {mockStablecoinTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {getTransactionTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.protocol && `${transaction.protocol} • `}
                        {getChainName(transaction.chainId)}
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
                    {getTypeLabel(transaction.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(transaction.status)}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-foreground'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}