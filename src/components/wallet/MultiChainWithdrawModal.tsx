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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { NetworkSelector } from './NetworkSelector'
import { 
  ArrowUpRight, 
  Wallet, 
  AlertTriangle,
  Zap,
  Shield,
  Clock,
  DollarSign,
  ExternalLink,
  CheckCircle,
  Globe
} from 'lucide-react'
import { getEthereumNetwork, getTokenConfig } from '@/config/blockchain'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

interface MultiChainWithdrawModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletAddress: string
  onConfirmWithdraw: (data: WithdrawData) => Promise<void>
  isAAReady: boolean
  showTestnets?: boolean
}

interface WithdrawData {
  network: SupportedNetwork
  asset: 'ETH' | 'USDC'
  amount: number
  address: string
  useGasless: boolean
  priority: 'standard' | 'fast' | 'instant'
}

interface NetworkBalance {
  eth: string
  usdc: string | null
}

const networkGasEstimates: Record<SupportedNetwork, { standard: string; fast: string; instant: string }> = {
  sepolia: { standard: 'Free', fast: 'Free', instant: 'Free' },
  arbitrumSepolia: { standard: 'Free', fast: 'Free', instant: 'Free' },
  baseSepolia: { standard: 'Free', fast: 'Free', instant: 'Free' },
  optimismSepolia: { standard: 'Free', fast: 'Free', instant: 'Free' },
  polygonAmoy: { standard: 'Free', fast: 'Free', instant: 'Free' }
}

const priorityTimes = {
  standard: '3-5 minutes',
  fast: '1-2 minutes',
  instant: '< 30 seconds'
}

export function MultiChainWithdrawModal({
  open,
  onOpenChange,
  walletAddress,
  onConfirmWithdraw,
  isAAReady,
  showTestnets = false
}: MultiChainWithdrawModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork>('sepolia')
  const [selectedAsset, setSelectedAsset] = useState<'ETH' | 'USDC'>('ETH')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [useGasless, setUseGasless] = useState(true)
  const [priority, setPriority] = useState<'standard' | 'fast' | 'instant'>('standard')
  const [balances, setBalances] = useState<NetworkBalance>({ eth: '0', usdc: null })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const networkConfig = getEthereumNetwork(selectedNetwork)
  const tokenConfig = selectedAsset === 'USDC' ? getTokenConfig(selectedNetwork, 'USDC') : null
  const gasEstimate = networkGasEstimates[selectedNetwork]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!recipientAddress || !recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      newErrors.address = 'Invalid Ethereum address'
    }

    const balance = selectedAsset === 'ETH' ? parseFloat(balances.eth) : parseFloat(balances.usdc || '0')
    if (parseFloat(withdrawAmount) > balance) {
      newErrors.amount = 'Insufficient balance'
    }

    // Minimum amounts
    const minAmount = selectedAsset === 'ETH' 
      ? (networkConfig.isTestnet ? 0.001 : 0.01)
      : (networkConfig.isTestnet ? 1 : 10)
    
    if (parseFloat(withdrawAmount) < minAmount) {
      newErrors.amount = `Minimum amount is ${minAmount} ${selectedAsset}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleWithdraw = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const withdrawData: WithdrawData = {
        network: selectedNetwork,
        asset: selectedAsset,
        amount: parseFloat(withdrawAmount),
        address: recipientAddress,
        useGasless: useGasless && isAAReady,
        priority
      }

      await onConfirmWithdraw(withdrawData)
      
      // Reset form
      setWithdrawAmount('')
      setRecipientAddress('')
      onOpenChange(false)
    } catch (error) {
      console.error('Withdraw failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNetworkIcon = (network: SupportedNetwork) => {
    const icons = {
      sepolia: '🔧',
      arbitrumSepolia: '🔵',
      baseSepolia: '🔷',
      optimismSepolia: '🔴',
      polygonAmoy: '🟣'
    }
    return icons[network] || '🌐'
  }

  const formatBalance = (balance: string, symbol: string) => {
    const num = parseFloat(balance)
    if (num === 0) return `0 ${symbol}`
    if (num < 0.000001) return `< 0.000001 ${symbol}`
    return `${num.toFixed(6)} ${symbol}`
  }

  const setMaxAmount = () => {
    const balance = selectedAsset === 'ETH' ? balances.eth : (balances.usdc || '0')
    const maxAmount = parseFloat(balance)
    
    // Reserve some ETH for gas if not using gasless
    if (selectedAsset === 'ETH' && !useGasless && maxAmount > 0.005) {
      setWithdrawAmount((maxAmount - 0.005).toString())
    } else {
      setWithdrawAmount(balance)
    }
  }

  // Mock balance fetching - in reality this would use the balance service
  useEffect(() => {
    // Simulate fetching balances for the selected network
    setBalances({
      eth: '0.5',
      usdc: '1000.0'
    })
  }, [selectedNetwork])

  useEffect(() => {
    validateForm()
  }, [withdrawAmount, recipientAddress, selectedAsset, balances])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
            <span>Multi-Chain Withdraw</span>
          </DialogTitle>
          <DialogDescription>
            Send cryptocurrency from your smart wallet to any address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Network Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Globe className="w-4 h-4" />
                <span>Select Network</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NetworkSelector
                selectedNetwork={selectedNetwork}
                onNetworkChange={setSelectedNetwork}
                showTestnets={showTestnets}
              />
            </CardContent>
          </Card>

          {/* Asset & Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <DollarSign className="w-4 h-4" />
                <span>Asset & Amount</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Asset Selection */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedAsset === 'ETH' ? 'default' : 'outline'}
                  onClick={() => setSelectedAsset('ETH')}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">💎</span>
                    <span className="font-semibold">{networkConfig.ticker}</span>
                  </div>
                  <div className="text-xs opacity-70">
                    Balance: {formatBalance(balances.eth, networkConfig.ticker)}
                  </div>
                </Button>
                
                <Button
                  variant={selectedAsset === 'USDC' ? 'default' : 'outline'}
                  onClick={() => setSelectedAsset('USDC')}
                  className="h-auto p-4 flex-col items-start"
                  disabled={!balances.usdc || parseFloat(balances.usdc) === 0}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">💵</span>
                    <span className="font-semibold">USDC</span>
                  </div>
                  <div className="text-xs opacity-70">
                    Balance: {formatBalance(balances.usdc || '0', 'USDC')}
                  </div>
                </Button>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={setMaxAmount}
                    className="h-auto p-1 text-xs"
                  >
                    Max
                  </Button>
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder={`0.0 ${selectedAsset}`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recipient Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Wallet className="w-4 h-4" />
                <span>Recipient Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className={`font-mono ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter the {networkConfig.name} address where you want to send {selectedAsset}
              </p>
            </CardContent>
          </Card>

          {/* Transaction Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Shield className="w-4 h-4" />
                <span>Transaction Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gasless Option */}
              {isAAReady && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-900">Gasless Transaction</p>
                      <p className="text-xs text-emerald-700">No gas fees required</p>
                    </div>
                  </div>
                  <Switch
                    checked={useGasless}
                    onCheckedChange={setUseGasless}
                  />
                </div>
              )}

              {/* Priority Selection */}
              {!useGasless && (
                <div>
                  <Label className="text-sm font-medium">Transaction Priority</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['standard', 'fast', 'instant'] as const).map((p) => (
                      <Button
                        key={p}
                        variant={priority === p ? 'default' : 'outline'}
                        onClick={() => setPriority(p)}
                        className="h-auto p-3 flex-col"
                        size="sm"
                      >
                        <span className="font-medium capitalize">{p}</span>
                        <div className="text-xs opacity-70 mt-1">
                          <div>{priorityTimes[p]}</div>
                          <div>{gasEstimate[p]}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold text-orange-900">Important:</h4>
                  <ul className="space-y-1 text-orange-800 list-disc list-inside">
                    <li>Double-check the recipient address - transactions cannot be reversed</li>
                    <li>Ensure the recipient supports {networkConfig.name} network</li>
                    <li>Minimum amount: {selectedAsset === 'ETH' ? '0.001' : '1'} {selectedAsset}</li>
                    {!useGasless && <li>Gas fees will be deducted from your ETH balance</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.open(`${networkConfig.blockExplorer}/address/${walletAddress}`, '_blank')
                }}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Wallet</span>
              </Button>
              
              <Button
                onClick={handleWithdraw}
                disabled={loading || Object.keys(errors).length > 0 || !withdrawAmount || !recipientAddress}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Send {selectedAsset}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MultiChainWithdrawModal