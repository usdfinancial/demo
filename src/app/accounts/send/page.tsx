'use client'

import { useState } from 'react'
import { Send, ArrowRight, Users, Clock, Shield, Zap, QrCode, Copy, UserPlus, TrendingUp, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency, getStablecoinIcon, StablecoinSymbol } from '@/lib/data'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { NotificationModal } from '@/components/ui/NotificationModal'
import { SendTransactionFlow, SendTransactionData } from '@/components/send/SendTransactionFlow'
import { RecipientInput } from '@/components/send/RecipientInput'
import { AmountInput } from '@/components/send/AmountInput'
import { MultiChainUSDCSelector } from '@/components/send/MultiChainUSDCSelector'

interface Contact {
  id: string
  name: string
  address: string
  avatar?: string
  lastUsed: string
  totalSent: number
  preferredCoin: StablecoinSymbol
}

const recentContacts: Contact[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    address: '0x742d35Cc6634C0532925a3b8D4C7623fd0C0C9f1',
    lastUsed: '2024-01-20',
    totalSent: 2500,
    preferredCoin: 'USDC'
  },
  {
    id: '2',
    name: 'Bob Smith',
    address: '0x8A4B7C17B8F4C4D6Ea9D4A2F1E2F2E8B9D3A5C7E',
    lastUsed: '2024-01-18',
    totalSent: 800,
    preferredCoin: 'USDC'
  },
  {
    id: '3',
    name: 'Carol Williams',
    address: '0x1B2C8D5F4E3A9C2D8F7B1A3E5C9F2A8D4B7E6F1C',
    lastUsed: '2024-01-15',
    totalSent: 1200,
    preferredCoin: 'USDC'
  }
]

export default function SendMoneyPage() {
  const { user, multiChainBalances, totalUSDC } = useEnhancedAuth()
  
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [stablecoin, setStablecoin] = useState<StablecoinSymbol>('USDC')
  const [message, setMessage] = useState('')
  const [useGasless, setUseGasless] = useState(true) // Default to gasless for better UX
  const [isRecipientValid, setIsRecipientValid] = useState(false)
  const [recipientInfo, setRecipientInfo] = useState<any>(null)
  const [showTransactionFlow, setShowTransactionFlow] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<string>('')
  const [selectedNetworkBalance, setSelectedNetworkBalance] = useState<any>(null)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [featureModalData, setFeatureModalData] = useState({ title: '', message: '', details: [] as string[] })
  
  // Get real balances from multi-chain data
  const availableBalances: Record<StablecoinSymbol, number> = {
    'USDC': parseFloat(totalUSDC || '0')
  }
  
  const currentBalance = availableBalances[stablecoin]
  const networkFee = useGasless ? 0 : 0.50
  const totalAmount = amount ? parseFloat(amount) + networkFee : 0
  
  // Calculate realistic usage stats based on actual balance
  const monthlyLimit = Math.max(currentBalance * 0.5, 1000) // 50% of balance or $1000 min
  const usedToday = Math.min(currentBalance * 0.1, 500) // 10% of balance or $500 max
  const dailyLimit = Math.max(currentBalance * 0.2, 1000) // 20% of balance or $1000 min
  const remainingToday = Math.max(dailyLimit - usedToday, 0)

  const selectContact = (contact: Contact) => {
    setRecipient(contact.address)
    setStablecoin(contact.preferredCoin)
    setIsRecipientValid(true)
    setRecipientInfo({ 
      name: contact.name, 
      address: contact.address,
      type: 'contact',
      isVerified: true 
    })
  }

  const handleSendClick = () => {
    if (!isRecipientValid || !amount || parseFloat(amount) <= 0) return
    
    // Check if selected network is supported
    if (selectedNetwork && selectedNetwork !== 'Ethereum Sepolia') {
      console.warn('⚠️ Attempted transaction on unsupported network:', selectedNetwork)
      return
    }
    
    const transactionData: SendTransactionData = {
      recipient,
      amount,
      stablecoin,
      message: message || undefined,
      recipientName: recipientInfo?.name,
      useGasless,
      selectedNetwork
    }
    
    setShowTransactionFlow(true)
  }

  const handleTransactionComplete = () => {
    setShowTransactionFlow(false)
    // Reset form
    setRecipient('')
    setAmount('')
    setMessage('')
    setIsRecipientValid(false)
    setRecipientInfo(null)
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleScanQR = () => {
    setFeatureModalData({
      title: 'QR Code Scanner',
      message: 'Scan recipient wallet address or payment request',
      details: [
        'Point your camera at a QR code to scan',
        'Supports wallet addresses and payment requests',
        'Automatically fills recipient and amount fields',
        'Works with all major wallet QR formats',
        'Demo: QR scanner would open camera interface'
      ]
    })
    setShowFeatureModal(true)
  }

  const handleAddContact = () => {
    setFeatureModalData({
      title: 'Add New Contact',
      message: 'Save frequently used wallet addresses',
      details: [
        'Add wallet address and contact name',
        'Set preferred stablecoin for quick sends',
        'View transaction history with each contact',
        'Organize contacts by groups or tags',
        'Demo: Contact form would open for new entry'
      ]
    })
    setShowFeatureModal(true)
  }

  const handleQRGenerate = () => {
    setFeatureModalData({
      title: 'Generate Payment QR',
      message: 'Create QR code for receiving payments',
      details: [
        'Generate QR code with your wallet address',
        'Include specific amount and message',
        'Share with others for easy payments',
        'Compatible with all major wallets',
        'Demo: QR generator would create shareable code'
      ]
    })
    setShowFeatureModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 rounded-2xl border border-emerald-100 p-8 mb-8">
        <div className="absolute inset-0 bg-grid-slate-100 opacity-30"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <Send className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900">Send Money</h1>
                  <p className="text-slate-600 text-lg">Fast, secure, gasless stablecoin transfers</p>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Zero gas fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Bank-grade security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Global reach</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white"
                onClick={handleScanQR}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white"
                onClick={handleAddContact}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white"
                onClick={handleQRGenerate}
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-600" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(usedToday)}</div>
            <p className="text-sm text-muted-foreground">Sent today</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Avg. Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12s</div>
            <p className="text-sm text-muted-foreground">Settlement time</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-sm text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Send Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Send className="h-5 w-5 text-emerald-600" />
                </div>
                Send USDC
              </CardTitle>
              <CardDescription className="text-slate-600">
                Transfer USDC to any wallet address instantly with zero gas fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Recipient Input with Enhanced Validation */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient</label>
                <RecipientInput
                  value={recipient}
                  onChange={setRecipient}
                  onValidationChange={(isValid, info) => {
                    setIsRecipientValid(isValid)
                    setRecipientInfo(info)
                  }}
                />
              </div>

              {/* Multi-Chain USDC Network Selection */}
              <MultiChainUSDCSelector
                selectedNetwork={selectedNetwork}
                amount={amount}
                onNetworkChange={(network, balance) => {
                  setSelectedNetwork(network)
                  setSelectedNetworkBalance(balance)
                }}
              />

              {/* Enhanced Amount Input */}
              <AmountInput
                amount={amount}
                stablecoin="USDC" // Fixed to USDC for multi-chain focus
                onAmountChange={setAmount}
                onStablecoinChange={setStablecoin}
                availableBalances={{
                  'USDC': selectedNetworkBalance?.balance || parseFloat(totalUSDC || '0')
                }}
                useGasless={useGasless}
                onGaslessChange={setUseGasless}
              />

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Message (Optional)</label>
                <Input
                  placeholder="Add a note for the recipient"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={100}
                  className="h-12"
                />
                <div className="text-xs text-slate-500 text-right">
                  {message.length}/100 characters
                </div>
              </div>

              {/* Send Button */}
              <Button 
                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg font-semibold" 
                disabled={
                  !isRecipientValid || 
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  totalAmount > currentBalance ||
                  (selectedNetwork && selectedNetwork !== 'Ethereum Sepolia')
                }
                onClick={handleSendClick}
              >
                <Send className="h-5 w-5 mr-3" />
                {selectedNetwork && selectedNetwork !== 'Ethereum Sepolia' 
                  ? 'Network Not Supported' 
                  : `Send ${amount ? `${amount} ${stablecoin}` : 'Stablecoins'}`
                }
                <ArrowRight className="h-5 w-5 ml-3" />
              </Button>

              {/* Quick Contact Selection */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Send to Contacts</h4>
                <div className="grid grid-cols-3 gap-3">
                  {recentContacts.slice(0, 3).map((contact) => (
                    <button
                      key={contact.id}
                      className="p-3 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-center"
                      onClick={() => selectContact(contact)}
                    >
                      <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-emerald-700">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="text-xs font-medium">{contact.name}</div>
                      <div className="text-xs text-slate-500">{getStablecoinIcon(contact.preferredCoin)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Contacts & Features */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Recent Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentContacts.slice(0, 3).map((contact) => (
                <div key={contact.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{contact.name}</div>
                      <div className="text-xs text-muted-foreground">{contact.lastUsed}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectContact(contact)}
                    className="text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  >
                    Select
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">USD Financial Advantages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Zap className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Zero Gas Fees</div>
                  <div className="text-xs text-slate-600">Account Abstraction eliminates network costs</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Smart Contract Security</div>
                  <div className="text-xs text-slate-600">Multi-signature wallet protection</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Instant Settlement</div>
                  <div className="text-xs text-slate-600">Transactions complete in 10-15 seconds</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Globe className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Global Coverage</div>
                  <div className="text-xs text-slate-600">Send to 190+ countries instantly</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Limits */}
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Daily Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Used today:</span>
                  <span className="font-medium">{formatCurrency(usedToday)} / {formatCurrency(dailyLimit)}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '18%' }} />
                </div>
                <div className="text-xs text-slate-500">
                  {formatCurrency(remainingToday)} remaining today
                </div>
              </div>
              <div className="text-xs text-slate-600">
                Limits reset daily at midnight UTC
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Flow Modal */}
      <SendTransactionFlow
        key={`${recipient}-${amount}-${Date.now()}`} // Force remount for each new transaction
        transactionData={{
          recipient,
          amount,
          stablecoin,
          message,
          recipientName: recipientInfo?.name,
          useGasless,
          selectedNetwork
        }}
        onConfirm={handleTransactionComplete}
        onCancel={() => setShowTransactionFlow(false)}
        isOpen={showTransactionFlow}
      />

      {/* Feature Modal */}
      <NotificationModal
        open={showFeatureModal}
        onOpenChange={setShowFeatureModal}
        type="info"
        title={featureModalData.title}
        message={featureModalData.message}
        details={featureModalData.details}
      />
    </div>
  )
}