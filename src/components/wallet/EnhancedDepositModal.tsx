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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  AlertTriangle
} from 'lucide-react'

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

interface EnhancedDepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  networks: Network[]
  currentBalance: string
  isAAReady: boolean
}

export function EnhancedDepositModal({
  open,
  onOpenChange,
  networks,
  currentBalance,
  isAAReady
}: EnhancedDepositModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(networks?.[0] || null)
  const [selectedMethod, setSelectedMethod] = useState<'crypto' | 'card' | 'bank'>('crypto')
  const [amount, setAmount] = useState('')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [useSmartWallet, setUseSmartWallet] = useState(true)

  // Update selectedNetwork when networks prop changes
  useEffect(() => {
    if (networks?.length > 0 && !selectedNetwork) {
      setSelectedNetwork(networks[0])
    }
  }, [networks, selectedNetwork])

  // Debug: Log address display issue
  useEffect(() => {
    if (selectedNetwork) {
      console.log('🔍 DepositModal - Selected network:', selectedNetwork)
      console.log('🔍 DepositModal - Smart wallet address:', selectedNetwork.smartWalletAddress)
      console.log('🔍 DepositModal - EOA address:', selectedNetwork.eoaAddress)
      console.log('🔍 DepositModal - Current address (useSmartWallet=' + useSmartWallet + '):', getCurrentAddress())
    }
  }, [selectedNetwork, useSmartWallet])

  // Automatically switch to EOA if Ethereum Mainnet is selected
  useEffect(() => {
    if (selectedNetwork?.id === 'ethereum') {
      setUseSmartWallet(false)
    } else {
      setUseSmartWallet(true)
    }
  }, [selectedNetwork])

  const copyToClipboard = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(type)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getCurrentAddress = () => {
    const address = useSmartWallet ? selectedNetwork?.smartWalletAddress : selectedNetwork?.eoaAddress
    return address || ''
  }

  const getAddressType = () => {
    return useSmartWallet ? 'Smart Wallet' : 'EOA Backup'
  }

  const depositMethods = [
    {
      id: 'crypto',
      name: 'Crypto Transfer',
      description: 'Send from another wallet',
      icon: ArrowDownLeft,
      time: selectedNetwork?.estimatedTime || '30 seconds',
      fee: selectedNetwork?.fee || 0,
      available: true
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Buy crypto instantly',
      icon: CreditCard,
      time: '5 minutes',
      fee: 0.025, // 2.5%
      available: false // Coming soon
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'ACH or wire transfer',
      icon: Building,
      time: '1-3 business days',
      fee: 0.01, // 1%
      available: false // Coming soon
    }
  ]

  const currentMethod = depositMethods.find(m => m.id === selectedMethod)

  // Don't render if no networks are available
  if (!networks || networks.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <p className="text-gray-600">No networks available</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
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
            <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
            <span>Add Money</span>
          </DialogTitle>
          <DialogDescription>
            Add funds to your smart wallet using various payment methods
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700">Current Balance</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {parseFloat(currentBalance || '0').toFixed(4)} ETH
                  </p>
                  <p className="text-sm text-emerald-600">
                    ≈ ${(parseFloat(currentBalance || '0') * 3200).toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl">💎</div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crypto" className="flex items-center space-x-2">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Crypto</span>
              </TabsTrigger>
              <TabsTrigger value="card" disabled className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Card</span>
                <Badge className="ml-1 text-xs bg-orange-100 text-orange-800">Soon</Badge>
              </TabsTrigger>
              <TabsTrigger value="bank" disabled className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Bank</span>
                <Badge className="ml-1 text-xs bg-orange-100 text-orange-800">Soon</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crypto" className="space-y-6">
              {/* Network Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Select Network</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {networks.map((network) => (
                    <Card 
                      key={network.id}
                      className={`cursor-pointer transition-all border-2 ${
                        selectedNetwork?.id === network.id 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                      onClick={() => setSelectedNetwork(network)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{network.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{network.displayName}</p>
                              {network.isTestnet && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">Testnet</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Min: {network.minimumDeposit} ETH • {network.estimatedTime}
                            </p>
                            <p className="text-xs text-emerald-600">
                              {network.fee === 0 ? 'No fees' : `${network.fee} ETH fee`}
                            </p>
                          </div>
                          {selectedNetwork?.id === network.id && (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Wallet Type Selection */}
              {isAAReady && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Deposit To</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card 
                      className={`cursor-pointer transition-all border-2 ${
                        useSmartWallet 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => setUseSmartWallet(true)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Smart Wallet</p>
                            <p className="text-sm text-gray-600">Gasless transactions</p>
                          </div>
                          {useSmartWallet && (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all border-2 ${
                        !useSmartWallet 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => setUseSmartWallet(false)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">EOA Backup</p>
                            <p className="text-sm text-gray-600">Traditional wallet</p>
                          </div>
                          {!useSmartWallet && (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Deposit Address */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Deposit Address</h3>
                  <Badge className={useSmartWallet ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                    {getAddressType()}
                  </Badge>
                </div>
                
                <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-700 mb-2">
                          Send {selectedNetwork?.displayName} to this address:
                        </p>
                        <div className="bg-white rounded-lg p-4 border border-emerald-200">
                          <p className="font-mono text-sm break-all text-gray-900">
                            {getCurrentAddress()}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(getCurrentAddress(), getAddressType())}
                          className="h-10 w-10 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {copiedAddress && (
                      <p className="text-sm text-emerald-600 mb-4">
                        ✓ {copiedAddress} address copied to clipboard
                      </p>
                    )}

                    <div className="flex items-start space-x-2 text-sm text-emerald-700">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Important:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Only send {selectedNetwork?.displayName} tokens to this address</li>
                          <li>Minimum deposit: {selectedNetwork?.minimumDeposit} ETH</li>
                          <li>Transactions typically take {selectedNetwork?.estimatedTime}</li>
                          {(selectedNetwork?.fee || 0) > 0 && (
                            <li>Network fee: {selectedNetwork?.fee} ETH</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Processing Time</p>
                        <p className="text-xs text-gray-600">{selectedNetwork?.estimatedTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium">Security</p>
                        <p className="text-xs text-gray-600">Enterprise Grade</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Mobile Ready</p>
                        <p className="text-xs text-gray-600">Scan QR Code</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="card">
              <Card className="p-8 text-center">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit/Debit Card</h3>
                <p className="text-gray-600 mb-4">
                  Buy crypto instantly with your credit or debit card. Coming soon!
                </p>
                <Badge className="bg-orange-100 text-orange-800">Under Development</Badge>
              </Card>
            </TabsContent>

            <TabsContent value="bank">
              <Card className="p-8 text-center">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Transfer</h3>
                <p className="text-gray-600 mb-4">
                  Transfer funds directly from your bank account. Lower fees, longer processing time.
                </p>
                <Badge className="bg-orange-100 text-orange-800">Under Development</Badge>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}