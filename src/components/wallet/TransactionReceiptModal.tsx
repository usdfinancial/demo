'use client'

import { Check, ExternalLink, Copy, Share } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TransactionReceiptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    type: 'deposit' | 'withdrawal' | 'buy' | 'swap'
    asset: {
      name: string
      symbol: string
      icon: string
    }
    amount: number
    usdValue: number
    fee?: number
    fromAddress?: string
    toAddress?: string
    network: {
      name: string
      displayName: string
      icon: string
    }
    hash: string
    status: 'completed' | 'pending' | 'failed'
    timestamp: string
    confirmations?: number
    requiredConfirmations?: number
  }
}

export function TransactionReceiptModal({ open, onOpenChange, transaction }: TransactionReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const copyTransactionHash = () => {
    navigator.clipboard.writeText(transaction.hash)
  }

  const openExplorer = () => {
    window.open(`https://etherscan.io/tx/${transaction.hash}`, '_blank')
  }

  const shareTransaction = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Transaction Receipt',
        text: `Transaction ${transaction.hash}`,
        url: `https://etherscan.io/tx/${transaction.hash}`
      })
    }
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <Check className="h-8 w-8 text-green-600" />
      case 'pending':
        return <div className="h-8 w-8 rounded-full border-2 border-yellow-600 border-t-transparent animate-spin" />
      case 'failed':
        return <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">!</div>
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (transaction.status) {
      case 'completed':
        return 'Transaction completed successfully'
      case 'pending':
        return `Waiting for confirmations (${transaction.confirmations}/${transaction.requiredConfirmations})`
      case 'failed':
        return 'Transaction failed'
      default:
        return ''
    }
  }

  const getTransactionTitle = () => {
    switch (transaction.type) {
      case 'deposit':
        return 'Money Added'
      case 'withdrawal':
        return 'Money Sent'
      case 'buy':
        return 'Purchase Complete'
      case 'swap':
        return 'Swap Complete'
      default:
        return 'Transaction'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold">{getTransactionTitle()}</DialogTitle>
            <DialogDescription className="text-gray-600">{getStatusMessage()}</DialogDescription>
          </DialogHeader>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <span>{transaction.asset.icon}</span>
              {transaction.amount} {transaction.asset.symbol}
            </div>
            <p className="text-gray-500">{formatCurrency(transaction.usdValue)}</p>
          </div>
        </div>

        <Card className="mt-6">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">{formatDate(transaction.timestamp)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network</span>
              <div className="flex items-center gap-2">
                <span>{transaction.network.icon}</span>
                <span className="font-medium">{transaction.network.displayName}</span>
              </div>
            </div>

            {transaction.fee && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Network Fee</span>
                <span className="font-medium">{transaction.fee} {transaction.asset.symbol}</span>
              </div>
            )}

            {transaction.fromAddress && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">From</span>
                <span className="font-mono text-xs">
                  {transaction.fromAddress.slice(0, 6)}...{transaction.fromAddress.slice(-4)}
                </span>
              </div>
            )}

            {transaction.toAddress && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">To</span>
                <span className="font-mono text-xs">
                  {transaction.toAddress.slice(0, 6)}...{transaction.toAddress.slice(-4)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <Badge 
                variant={transaction.status === 'completed' ? 'default' : 
                        transaction.status === 'pending' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {transaction.status}
              </Badge>
            </div>

            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction ID</span>
                <button
                  onClick={copyTransactionHash}
                  className="font-mono text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  {transaction.hash.slice(0, 6)}...{transaction.hash.slice(-4)}
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={shareTransaction} className="flex-1">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={openExplorer} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Explorer
          </Button>
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full mt-3">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  )
}