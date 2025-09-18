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
import { DemoIndicator } from '@/components/ui/DemoIndicator'
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
  Activity,
  Sparkles
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
  minimumWithdrawal: number
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
  const [showExplorerModal, setShowExplorerModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [explorerUrl, setExplorerUrl] = useState('')
  const [qrAddress, setQrAddress] = useState('')

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
      console.log(`✅ Demo: Copied ${type} address to clipboard: ${address}`)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Demo function for viewing on blockchain explorer
  const handleViewOnExplorer = (address: string) => {
    const networkId = selectedNetwork?.id || 'sepolia'
    const explorerUrls = {
      sepolia: 'https://sepolia.etherscan.io/address/',
      ethereum: 'https://etherscan.io/address/',
      polygon: 'https://polygonscan.com/address/',
      arbitrum: 'https://arbiscan.io/address/',
      optimism: 'https://optimistic.etherscan.io/address/'
    }
    
    const baseUrl = explorerUrls[networkId as keyof typeof explorerUrls] || explorerUrls.sepolia
    const url = `${baseUrl}${address}`
    
    console.log(`🔍 Demo: Opening explorer for ${address} on ${networkId}`)
    console.log(`🌐 Explorer URL: ${url}`)
    
    setExplorerUrl(url)
    setShowExplorerModal(true)
  }

  // Demo function for showing QR code
  const handleShowQRCode = (address: string) => {
    const type = getAddressType()
    console.log(`📱 Demo: Showing QR code for ${type} address: ${address}`)
    
    setQrAddress(address)
    setShowQRModal(true)
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <DemoIndicator variant="floating" />
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
                          <Copy className={`h-4 w-4 ${copiedAddress === getAddressType() ? 'text-emerald-600' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowQRCode(getCurrentAddress())}
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
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleViewOnExplorer(getCurrentAddress())}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Enhanced Explorer Modal */}
      <Dialog open={showExplorerModal} onOpenChange={setShowExplorerModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
              <ExternalLink className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Blockchain Explorer
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              View your wallet on the {selectedNetwork?.displayName || 'Sepolia'} blockchain
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Network Info Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-2xl p-6 border border-emerald-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-2xl">{selectedNetwork?.icon || '🔗'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">{selectedNetwork?.displayName || 'Sepolia Testnet'}</h3>
                    <p className="text-sm text-emerald-700">Ethereum Blockchain Network</p>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Copy className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Wallet Address</span>
                  </div>
                  <p className="font-mono text-sm text-gray-900 break-all leading-relaxed">
                    {getCurrentAddress()}
                  </p>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Transaction History</h4>
                <p className="text-xs text-gray-600">View all wallet transactions</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Smart Contracts</h4>
                <p className="text-xs text-gray-600">Interact with DeFi protocols</p>
              </div>
            </div>
            
            {/* Demo Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Demo Experience</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    In production, clicking "Open Explorer" would launch {selectedNetwork?.displayName || 'Sepolia'} blockchain explorer 
                    in a new tab, showing real-time transaction data and smart contract interactions.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline"
                onClick={() => setShowExplorerModal(false)} 
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  console.log(`🌐 Demo: Would open ${explorerUrl}`)
                  // Show a brief success animation
                  setShowExplorerModal(false)
                }} 
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Explorer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              QR Code - {getAddressType()}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Scan with your mobile wallet to send funds instantly
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* QR Code Display */}
            <div className="text-center">
              <div className="relative mx-auto w-56 h-56 bg-gradient-to-br from-white via-emerald-50 to-teal-50 rounded-3xl flex items-center justify-center border-4 border-emerald-200 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-teal-100/20 rounded-3xl"></div>
                <div className="relative text-center">
                  <QrCode className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-emerald-800">QR Code</p>
                    <p className="text-sm text-emerald-600">Demo Preview</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-2xl p-6 border border-emerald-200">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-100 rounded-full opacity-30 -translate-y-12 translate-x-12"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-2xl">{selectedNetwork?.icon || '🔗'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">{getAddressType()}</h3>
                    <p className="text-sm text-emerald-700">{selectedNetwork?.displayName || 'Sepolia Testnet'}</p>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Wallet Address</span>
                  </div>
                  <p className="font-mono text-sm text-gray-900 break-all leading-relaxed">
                    {qrAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Mobile Scan</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Open wallet app</li>
                  <li>• Scan QR code</li>
                  <li>• Enter amount</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Fast Transfer</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Instant confirmation</li>
                  <li>• Secure transaction</li>
                  <li>• {selectedNetwork?.estimatedTime || '30 seconds'} arrival</li>
                </ul>
              </div>
            </div>
            
            {/* Demo Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Demo QR Code</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    In production, this would display a scannable QR code containing your wallet address. 
                    Mobile wallets can scan this for quick and secure fund transfers.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => copyToClipboard(qrAddress, getAddressType())}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
              <Button 
                onClick={() => setShowQRModal(false)} 
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}