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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NetworkSelector } from './NetworkSelector'
import { 
  Copy, 
  ExternalLink, 
  ArrowDownLeft, 
  CreditCard, 
  Building, 
  Smartphone,
  Shield,
  Clock,
  CheckCircle,
  QrCode,
  AlertTriangle,
  Globe,
  Zap,
  DollarSign
} from 'lucide-react'
import { getEthereumNetwork, getTokenConfig } from '@/config/blockchain'
import { BridgeDetector } from '@/components/bridge/BridgeDetector'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

interface MultiChainDepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletAddress: string
  currentBalance: string
  isAAReady: boolean
  showTestnets?: boolean
}

const networkGasEstimates: Record<SupportedNetwork, { eth: string; usdc: string }> = {
  sepolia: { eth: 'Free', usdc: 'Free' },
  arbitrumSepolia: { eth: 'Free', usdc: 'Free' },
  baseSepolia: { eth: 'Free', usdc: 'Free' },
  optimismSepolia: { eth: 'Free', usdc: 'Free' },
  polygonAmoy: { eth: 'Free', usdc: 'Free' }
}

export function MultiChainDepositModal({
  open,
  onOpenChange,
  walletAddress,
  currentBalance,
  isAAReady,
  showTestnets = false
}: MultiChainDepositModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork>('sepolia')
  const [selectedAsset, setSelectedAsset] = useState<'ETH' | 'USDC'>('ETH')
  const [depositMethod, setDepositMethod] = useState<'crypto' | 'fiat' | 'bridge'>('crypto')
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [amount, setAmount] = useState<number | undefined>(undefined)

  const networkConfig = getEthereumNetwork(selectedNetwork)
  const tokenConfig = selectedAsset === 'USDC' ? getTokenConfig(selectedNetwork, 'USDC') : null
  const gasEstimate = networkGasEstimates[selectedNetwork]

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getDepositAddress = () => {
    return walletAddress
  }

  const getMinimumDeposit = () => {
    if (selectedAsset === 'ETH') {
      return networkConfig.isTestnet ? '0.001 ETH' : '0.01 ETH'
    } else {
      return networkConfig.isTestnet ? '1 USDC' : '10 USDC'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            <span>Multi-Chain Deposit</span>
          </DialogTitle>
          <DialogDescription>
            Deposit cryptocurrency to your smart wallet across multiple networks
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

          {/* Asset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <DollarSign className="w-4 h-4" />
                <span>Select Asset</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    Gas: {gasEstimate.eth}
                  </div>
                </Button>
                
                <Button
                  variant={selectedAsset === 'USDC' ? 'default' : 'outline'}
                  onClick={() => setSelectedAsset('USDC')}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">💵</span>
                    <span className="font-semibold">USDC</span>
                  </div>
                  <div className="text-xs opacity-70">
                    Gas: {gasEstimate.usdc}
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Methods */}
          <Tabs value={depositMethod} onValueChange={(v) => setDepositMethod(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crypto" className="flex items-center space-x-1">
                <Smartphone className="w-3 h-3" />
                <span>Crypto</span>
              </TabsTrigger>
              <TabsTrigger value="fiat" className="flex items-center space-x-1">
                <CreditCard className="w-3 h-3" />
                <span>Fiat</span>
              </TabsTrigger>
              <TabsTrigger value="bridge" className="flex items-center space-x-1">
                <Building className="w-3 h-3" />
                <span>Bridge</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crypto" className="space-y-4">
              {/* Deposit Address */}
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-emerald-900">
                        {selectedAsset} Deposit Address
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getNetworkIcon(selectedNetwork)}</span>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          {networkConfig.name}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border-2 border-emerald-200">
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-sm text-gray-900 break-all">
                          {getDepositAddress()}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(getDepositAddress())}
                          className="ml-2 h-8 w-8 p-0"
                        >
                          {copiedAddress ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Minimum: {getMinimumDeposit()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>
                          {networkConfig.isTestnet ? '~30 seconds' : '2-5 minutes'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <h4 className="font-semibold text-orange-900">Important Notes:</h4>
                      <ul className="space-y-1 text-orange-800 list-disc list-inside">
                        <li>Only send {selectedAsset} on {networkConfig.name}</li>
                        <li>Sending from other networks will result in loss of funds</li>
                        <li>Minimum deposit: {getMinimumDeposit()}</li>
                        <li>Gas fees paid by sender</li>
                        {selectedAsset === 'USDC' && (
                          <li>Contract: {formatAddress(tokenConfig?.address || '')}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`${networkConfig.blockExplorer}/address/${getDepositAddress()}`, '_blank')
                  }}
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on Explorer</span>
                </Button>
                
                <Button
                  onClick={() => copyToClipboard(getDepositAddress())}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Address</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="fiat" className="space-y-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fiat On-Ramp</h3>
                  <p className="text-gray-600 mb-6">
                    Buy cryptocurrency directly with your credit card or bank account.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full" disabled>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy with Card (Coming Soon)
                    </Button>
                    <p className="text-xs text-gray-500">
                      Fiat on-ramp integration coming soon. Use crypto deposit for now.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bridge" className="space-y-4">
              <BridgeDetector
                fromNetwork="sepolia"
                toNetwork={selectedNetwork}
                asset={selectedAsset}
                amount={amount}
                className="w-full"
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MultiChainDepositModal