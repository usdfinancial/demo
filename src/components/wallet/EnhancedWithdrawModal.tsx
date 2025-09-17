'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Send, 
  ArrowUpRight, 
  Zap, 
  Shield, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
  QrCode
} from 'lucide-react'

interface Asset {
  id: string
  name: string
  symbol: string
  balance: number
  usdValue: number
  icon: string
  minimumWithdraw?: number
  isNative?: boolean
  isBackup?: boolean
}

interface Network {
  id: string
  name: string
  displayName: string
  smartWalletAddress: string
  eoaAddress: string
  minimumDeposit: number
  estimatedTime: string
  fee: number
  icon: string
  isTestnet?: boolean
}

interface EnhancedWithdrawModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: Asset[]
  networks: Network[]
  onConfirmWithdraw: (data: any) => Promise<void>
  isAAReady: boolean
}

export function EnhancedWithdrawModal({
  open,
  onOpenChange,
  assets,
  networks,
  onConfirmWithdraw,
  isAAReady
}: EnhancedWithdrawModalProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(assets?.[0] || null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(networks?.[0] || null)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [useGasless, setUseGasless] = useState(isAAReady)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Update selectedAsset and selectedNetwork when props change
  useEffect(() => {
    if (assets?.length > 0 && !selectedAsset) {
      setSelectedAsset(assets[0])
    }
  }, [assets, selectedAsset])

  useEffect(() => {
    if (networks?.length > 0 && !selectedNetwork) {
      setSelectedNetwork(networks[0])
    }
  }, [networks, selectedNetwork])

  const quickRecipients = [
    { 
      name: 'Alice', 
      address: '0x742d35Cc6639C0532fba96e5B11A7C8CfF7baB5E',
      avatar: '👩‍💼',
      label: 'Friend'
    },
    { 
      name: 'Bob', 
      address: '0x8ba1f109551bD432803012645Hac136c29912',
      avatar: '👨‍💻',
      label: 'Colleague'
    },
    { 
      name: 'Exchange', 
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      avatar: '🏦',
      label: 'Binance'
    }
  ]

  const handleSendTransaction = async () => {
    if (!recipientAddress || !amount || !selectedAsset || !selectedNetwork) return

    setIsLoading(true)
    try {
      await onConfirmWithdraw({
        assetId: selectedAsset.id,
        networkId: selectedNetwork.id,
        address: recipientAddress,
        amount: parseFloat(amount),
        useGasless: useGasless && isAAReady
      })
      setShowConfirmation(true)
      setTimeout(() => {
        onOpenChange(false)
        setShowConfirmation(false)
        setAmount('')
        setRecipientAddress('')
      }, 3000)
    } catch (error) {
      console.error('Transaction failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const calculateGasFee = () => {
    if (useGasless && isAAReady) return 0
    return selectedNetwork?.fee || 0
  }

  const calculateTotal = () => {
    const transferAmount = parseFloat(amount) || 0
    const gasFee = calculateGasFee()
    return transferAmount + gasFee
  }

  const getMaxAmount = () => {
    const gasFee = calculateGasFee()
    return Math.max(0, (selectedAsset?.balance || 0) - gasFee)
  }

  const setMaxAmount = () => {
    setAmount(getMaxAmount().toString())
  }

  const validateTransaction = () => {
    const transferAmount = parseFloat(amount) || 0
    const total = calculateTotal()
    
    if (!recipientAddress) return { valid: false, error: 'Recipient address required' }
    if (!amount) return { valid: false, error: 'Amount required' }
    if (transferAmount <= 0) return { valid: false, error: 'Amount must be greater than 0' }
    if (transferAmount < (selectedAsset?.minimumWithdraw || 0)) {
      return { valid: false, error: `Minimum withdrawal: ${selectedAsset?.minimumWithdraw} ${selectedAsset?.symbol}` }
    }
    if (total > (selectedAsset?.balance || 0)) return { valid: false, error: 'Insufficient balance' }
    
    return { valid: true, error: null }
  }

  const validation = validateTransaction()

  // Don't render if no assets are available
  if (!assets || assets.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <p className="text-gray-600">No assets available for withdrawal</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction Sent!</h3>
            <p className="text-gray-600 mb-4">
              Your {useGasless ? 'gasless' : 'regular'} transaction has been submitted successfully.
            </p>
            <div className="bg-emerald-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald-700">
                <strong>{amount} {selectedAsset?.symbol}</strong> sent to <strong>{formatAddress(recipientAddress)}</strong>
              </p>
              {useGasless && (
                <p className="text-xs text-emerald-600 mt-1">✨ No gas fees charged!</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <Send className="w-6 h-6 text-blue-600" />
            <span>Send Money</span>
          </DialogTitle>
          <DialogDescription>
            Send crypto to any wallet address with optional gasless transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Select Asset</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assets.map((asset) => (
                <Card 
                  key={asset.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedAsset?.id === asset.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{asset.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{asset.name}</p>
                          {asset.isBackup && (
                            <Badge className="bg-gray-100 text-gray-800 text-xs">Backup</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Balance: {asset.balance.toFixed(4)} {asset.symbol}
                        </p>
                        <p className="text-xs text-green-600">
                          ≈ ${asset.usdValue.toLocaleString()}
                        </p>
                      </div>
                      {selectedAsset?.id === asset.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Transaction Type */}
          {isAAReady && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Transaction Type</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    useGasless 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setUseGasless(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Gasless Transaction</p>
                        <p className="text-sm text-gray-600">No fees • Instant</p>
                      </div>
                      {useGasless && (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    !useGasless 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setUseGasless(false)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Regular Transaction</p>
                        <p className="text-sm text-gray-600">
                          {selectedNetwork?.fee} ETH fee
                        </p>
                      </div>
                      {!useGasless && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Quick Recipients */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Quick Send</h3>
            <div className="grid grid-cols-3 gap-3">
              {quickRecipients.map((recipient) => (
                <Card 
                  key={recipient.address}
                  className="cursor-pointer transition-all hover:border-blue-300 border-2"
                  onClick={() => setRecipientAddress(recipient.address)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{recipient.avatar}</div>
                    <p className="font-medium text-sm">{recipient.name}</p>
                    <p className="text-xs text-gray-600">{recipient.label}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {formatAddress(recipient.address)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recipient Address</label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x742d35Cc6639C0532fba96e5B11A7C8CfF7baB5E"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="sm" className="px-3">
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={setMaxAmount}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Max: {getMaxAmount().toFixed(4)} {selectedAsset?.symbol}
              </Button>
            </div>
            <div className="relative">
              <Input
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.001"
                min="0"
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                {selectedAsset?.symbol}
              </div>
            </div>
            {amount && (
              <p className="text-sm text-gray-600">
                ≈ ${(parseFloat(amount) * ((selectedAsset?.usdValue || 0) / (selectedAsset?.balance || 1))).toLocaleString()}
              </p>
            )}
          </div>

          {/* Transaction Summary */}
          {amount && recipientAddress && (
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Transaction Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">To:</span>
                    <span className="font-mono">{formatAddress(recipientAddress)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">{amount} {selectedAsset?.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Network Fee:</span>
                    <span className={useGasless ? 'text-emerald-600 font-semibold' : ''}>
                      {useGasless ? 'FREE 🎉' : `${calculateGasFee()} ETH`}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>{calculateTotal().toFixed(4)} {selectedAsset?.symbol}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-600 pt-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{selectedNetwork?.estimatedTime}</span>
                    </div>
                    {useGasless && (
                      <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Account Abstraction
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Error */}
          {!validation.valid && amount && recipientAddress && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{validation.error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendTransaction}
              disabled={!validation.valid || isLoading}
              className={useGasless ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {useGasless ? 'Gasless' : 'Regular'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}