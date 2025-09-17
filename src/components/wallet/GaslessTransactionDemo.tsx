'use client'

import { useState } from 'react'
import { 
  Zap, 
  Send, 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  Users, 
  DollarSign,
  Clock,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'

interface GaslessTransactionDemoProps {
  isAAReady: boolean
  smartWalletAddress: string | null
}

export function GaslessTransactionDemo({ 
  isAAReady, 
  smartWalletAddress 
}: GaslessTransactionDemoProps) {
  const { sendGaslessTransaction, sendRegularTransaction } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionType, setTransactionType] = useState<'gasless' | 'regular'>('gasless')

  const demoRecipients = [
    { 
      name: 'Alice', 
      address: '0x742d35Cc6639C0532fba96e5B11A7C8CfF7baB5E',
      avatar: '👩‍💼'
    },
    { 
      name: 'Bob', 
      address: '0x8ba1f109551bD432803012645Hac136c29912',
      avatar: '👨‍💻'
    },
    { 
      name: 'Contract', 
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      avatar: '📄'
    }
  ]

  const handleDemoTransaction = async () => {
    if (!recipientAddress || !amount) return

    setIsLoading(true)
    setTxHash(null)

    try {
      let hash: string
      if (transactionType === 'gasless' && isAAReady) {
        hash = await sendGaslessTransaction(recipientAddress, amount)
      } else {
        hash = await sendRegularTransaction(recipientAddress, amount)
      }
      setTxHash(hash)
    } catch (error) {
      console.error('Transaction failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectRecipient = (address: string) => {
    setRecipientAddress(address)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Try Gasless Transactions</h3>
        <p className="text-gray-600">
          Experience the future of blockchain transactions - no gas fees required
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transaction Demo Form */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-emerald-600" />
              <span>Demo Transaction</span>
            </CardTitle>
            <CardDescription>
              Send a transaction using Account Abstraction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transaction Type Selection */}
            <div className="flex space-x-2">
              <Button
                variant={transactionType === 'gasless' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTransactionType('gasless')}
                disabled={!isAAReady}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Zap className="w-4 h-4 mr-1" />
                Gasless
                {!isAAReady && <span className="ml-2 text-xs">(Coming Soon)</span>}
              </Button>
              <Button
                variant={transactionType === 'regular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTransactionType('regular')}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-1" />
                Regular
              </Button>
            </div>

            {/* Quick Select Recipients */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Quick Select</label>
              <div className="grid grid-cols-3 gap-2">
                {demoRecipients.map((recipient) => (
                  <Button
                    key={recipient.address}
                    variant="outline"
                    size="sm"
                    onClick={() => selectRecipient(recipient.address)}
                    className="flex flex-col h-auto p-3 space-y-1"
                  >
                    <span className="text-lg">{recipient.avatar}</span>
                    <span className="text-xs">{recipient.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Recipient Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Recipient Address</label>
              <Input
                placeholder="0x742d35Cc6639C0532fba96e5B11A7C8CfF7baB5E"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount (ETH)</label>
              <Input
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.001"
                min="0"
              />
            </div>

            {/* Transaction Summary */}
            {recipientAddress && amount && (
              <div className="bg-white/80 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Transaction Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-mono">{formatAddress(recipientAddress)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">{amount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gas Fee:</span>
                    <span className={transactionType === 'gasless' && isAAReady ? 'text-emerald-600 font-semibold' : ''}>
                      {transactionType === 'gasless' && isAAReady ? 'FREE 🎉' : '~$2.50'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <Badge className={transactionType === 'gasless' && isAAReady ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                      {transactionType === 'gasless' && isAAReady ? 'Account Abstraction' : 'Traditional EOA'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleDemoTransaction}
              disabled={!recipientAddress || !amount || isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {transactionType === 'gasless' && isAAReady ? 'Gasless' : 'Regular'} Transaction
                </>
              )}
            </Button>

            {/* Transaction Result */}
            {txHash && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-900">Transaction Successful!</span>
                </div>
                <p className="text-sm text-emerald-700 mb-2">
                  Your {transactionType === 'gasless' ? 'gasless' : 'regular'} transaction has been submitted.
                </p>
                <p className="text-xs text-emerald-600 font-mono break-all">
                  Transaction Hash: {txHash}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits Showcase */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why Gasless Transactions?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mt-0.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Zero Cost</h4>
                  <p className="text-sm text-gray-600">
                    No gas fees means more money in your pocket. Perfect for small transactions and micro-payments.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Better UX</h4>
                  <p className="text-sm text-gray-600">
                    No need to hold ETH for gas. New users can start transacting immediately without complex setup.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-0.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Instant Execution</h4>
                  <p className="text-sm text-gray-600">
                    Fast transaction processing without waiting for gas price optimization.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mt-0.5">
                  <Shield className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Enhanced Security</h4>
                  <p className="text-sm text-gray-600">
                    Smart contract wallets provide additional security features and programmable logic.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm text-gray-700">User signs transaction intent</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="text-sm text-gray-700">Smart contract wallet validates request</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-sm text-gray-700">Paymaster sponsors gas fees</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <span className="text-sm text-gray-700">Transaction executes on-chain</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}