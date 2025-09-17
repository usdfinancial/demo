'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Eye, EyeOff, Copy, Settings, Globe, Shield, Zap, Clock, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/data'
import { CardholderForm } from '@/components/cards/CardholderForm'
import { CardIssueForm } from '@/components/cards/CardIssueForm'
import { CreateCardholderData, CreateCardData, StripeCard, StripeCardDetails } from '@/lib/services/stripeService'


interface Cardholder {
  id: string
  name: string
  email: string
  status: string
  type: string
  createdAt: string
}


export default function VirtualCardsPage() {
  // State for Stripe integration
  const [showCardDetails, setShowCardDetails] = useState<Record<string, boolean>>({})
  const [stripeCards, setStripeCards] = useState<StripeCard[]>([])
  const [cardholders, setCardholders] = useState<Cardholder[]>([])
  const [selectedCardholder, setSelectedCardholder] = useState<string>('')
  const [isLoadingStripeCards, setIsLoadingStripeCards] = useState(false)
  const [isLoadingCardholders, setIsLoadingCardholders] = useState(false)
  const [isCreatingCardholder, setIsCreatingCardholder] = useState(false)
  const [isIssuingCard, setIsIssuingCard] = useState(false)
  const [error, setError] = useState<string>('')
  const [showCardholderDialog, setShowCardholderDialog] = useState(false)
  const [showIssueCardDialog, setShowIssueCardDialog] = useState(false)
  const [cardDetails, setCardDetails] = useState<Record<string, StripeCardDetails>>({})
  const [copiedField, setCopiedField] = useState<string>('')

  // Mock user ID - in real app this would come from auth context
  const userId = 'user-123'

  // Load cardholders and cards on component mount
  useEffect(() => {
    loadCardholders()
    loadStripeCards()
  }, [])

  const loadCardholders = async () => {
    setIsLoadingCardholders(true)
    setError('')

    try {
      const response = await fetch(`/api/cards/test-cardholders?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setCardholders(data.data)
        if (data.data.length > 0) {
          setSelectedCardholder(data.data[0].id)
        }
        console.log(`✅ Loaded ${data.data.length} cardholder profiles`)
      } else {
        throw new Error(data.error || 'Failed to load cardholders')
      }
    } catch (error) {
      console.error('Error loading cardholders:', error)
      setError('Failed to load cardholder profiles. Please check your connection and try again.')
    } finally {
      setIsLoadingCardholders(false)
    }
  }

  const loadStripeCards = async () => {
    setIsLoadingStripeCards(true)
    setError('')

    try {
      const response = await fetch(`/api/cards/test-issue?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setStripeCards(data.data)
        console.log(`✅ Loaded ${data.data.length} virtual cards from Stripe`)

        // Clear any stale card details for cards that no longer exist
        const existingCardIds = data.data.map((card: any) => card.id)
        setCardDetails(prev => {
          const filtered = Object.fromEntries(
            Object.entries(prev).filter(([cardId]) => existingCardIds.includes(cardId))
          )
          return filtered
        })

        // Clear show details state for non-existent cards
        setShowCardDetails(prev => {
          const filtered = Object.fromEntries(
            Object.entries(prev).filter(([cardId]) => existingCardIds.includes(cardId))
          )
          return filtered
        })
      } else {
        throw new Error(data.error || 'Failed to load cards')
      }
    } catch (error) {
      console.error('Error loading cards:', error)
      setError('Failed to load virtual cards. Please check your connection and try again.')
    } finally {
      setIsLoadingStripeCards(false)
    }
  }

  const handleCreateCardholder = async (data: CreateCardholderData) => {
    setIsCreatingCardholder(true)
    setError('')
    
    try {
      const response = await fetch('/api/cards/test-cardholders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, userId })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadCardholders()
        setShowCardholderDialog(false)
        setSelectedCardholder(result.data.id)
      } else {
        throw new Error(result.error || 'Failed to create cardholder')
      }
    } catch (error) {
      console.error('Error creating cardholder:', error)
      setError(error instanceof Error ? error.message : 'Failed to create cardholder')
    } finally {
      setIsCreatingCardholder(false)
    }
  }

  const handleIssueCard = async (data: CreateCardData) => {
    setIsIssuingCard(true)
    setError('')
    
    try {
      const response = await fetch('/api/cards/test-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, userId })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadStripeCards()
        setShowIssueCardDialog(false)
        // Store card details for initial display
        setCardDetails(prev => ({
          ...prev,
          [result.data.id]: result.data
        }))
      } else {
        throw new Error(result.error || 'Failed to issue card')
      }
    } catch (error) {
      console.error('Error issuing card:', error)
      setError(error instanceof Error ? error.message : 'Failed to issue card')
    } finally {
      setIsIssuingCard(false)
    }
  }

  const getCardDetails = async (cardId: string) => {
    if (cardDetails[cardId]) return cardDetails[cardId]

    try {
      const response = await fetch('/api/cards/test-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, cardId })
      })

      const result = await response.json()

      if (result.success) {
        setCardDetails(prev => ({
          ...prev,
          [cardId]: result.data
        }))
        return result.data
      } else {
        // If card not found, remove it from local state and refresh
        if (result.error?.includes('No such issuing card') || result.error?.includes('not found')) {
          console.log(`Card ${cardId} no longer exists in Stripe, refreshing card list...`)
          await loadStripeCards() // Refresh the card list
          return null
        }
        throw new Error(result.error || 'Failed to get card details')
      }
    } catch (error) {
      console.error('Error getting card details:', error)

      // Check if it's a 404 or card not found error
      if (error instanceof Error && (
        error.message.includes('No such issuing card') ||
        error.message.includes('not found') ||
        error.message.includes('404')
      )) {
        console.log(`Card ${cardId} no longer exists, refreshing card list...`)
        await loadStripeCards() // Refresh the card list
        return null
      }

      setError('Failed to get card details. The card may have been deleted.')
      return null
    }
  }

  const toggleStripeCardDetails = async (cardId: string) => {
    if (showCardDetails[cardId]) {
      setShowCardDetails(prev => ({ ...prev, [cardId]: false }))
      return
    }

    const details = await getCardDetails(cardId)
    if (details) {
      setShowCardDetails(prev => ({ ...prev, [cardId]: true }))
    } else {
      // Card doesn't exist anymore, don't show details
      console.log(`Cannot show details for card ${cardId} - card no longer exists`)
    }
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(''), 2000) // Clear after 2 seconds
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedField(fieldName)
        setTimeout(() => setCopiedField(''), 2000)
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
      }
      document.body.removeChild(textArea)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'locked': return 'bg-red-100 text-red-800 border-red-200'
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }


  const formatStripeCardNumber = (card: StripeCard, details?: StripeCardDetails, masked: boolean = true) => {
    if (details && !masked && details.number) {
      return details.number.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4')
    }
    return `**** **** **** ${card.last4}`
  }

  // Calculate totals from Stripe cards (placeholder - would need real balance/spending data)
  const totalBalance = 0 // This would be calculated from actual card balances
  const totalSpent = 0 // This would be calculated from transaction history

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Virtual Cards
          </h1>
          <p className="text-muted-foreground mt-1">Issue real virtual cards through Stripe for secure online payments</p>
        </div>
        <div className="flex items-center space-x-2">
          {cardholders.length === 0 ? (
            <Dialog open={showCardholderDialog} onOpenChange={setShowCardholderDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  <User className="h-4 w-4 mr-2" />
                  {isLoadingCardholders ? 'Loading...' : 'Create Cardholder'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Cardholder Profile</DialogTitle>
                  <DialogDescription>
                    First, create a cardholder profile to start issuing virtual cards through Stripe
                  </DialogDescription>
                </DialogHeader>
                <CardholderForm
                  onSubmit={handleCreateCardholder}
                  isLoading={isCreatingCardholder}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={showIssueCardDialog} onOpenChange={setShowIssueCardDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Virtual Card
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Issue New Virtual Card</DialogTitle>
                  <DialogDescription>
                    Create a new virtual card with custom spending controls through Stripe
                  </DialogDescription>
                </DialogHeader>
                <CardIssueForm
                  cardholderId={selectedCardholder}
                  onSubmit={handleIssueCard}
                  isLoading={isIssuingCard}
                />
              </DialogContent>
            </Dialog>
          )}

          <Button
            variant="outline"
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            onClick={() => {
              loadCardholders()
              loadStripeCards()
            }}
            disabled={isLoadingStripeCards || isLoadingCardholders}
          >
            <Settings className="h-4 w-4 mr-2" />
            {(isLoadingStripeCards || isLoadingCardholders) ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stripeCards.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Virtual cards issued
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-600" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-sm text-muted-foreground">
              Across all virtual cards
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              Monthly Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              100%
            </div>
            <p className="text-sm text-muted-foreground">
              Stripe security compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Virtual Cards Management */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Virtual Cards
                {isLoadingStripeCards && <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />}
              </CardTitle>
              <CardDescription>
                Real virtual cards issued through Stripe for secure online payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
{stripeCards.length === 0 ? (
                  <div className="text-center py-12">
                    {/* Premium Empty State */}
                    <div className="relative w-80 h-48 mx-auto mb-8 rounded-2xl shadow-xl"
                         style={{
                           aspectRatio: '1.586/1',
                           background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
                         }}>
                      <div className="absolute inset-0 rounded-2xl opacity-40"
                           style={{
                             background: 'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.1) 0%, transparent 60%)',
                           }} />

                      <div className="relative h-full flex items-center justify-center">
                        <div className="text-center">
                          <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                          <div className="text-2xl font-mono text-gray-400 tracking-wider">
                            **** **** **** ****
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 right-6 text-right">
                        <div className="text-xs font-bold text-emerald-400 tracking-wider">
                          USD FINANCIAL
                        </div>
                        <div className="text-xs text-gray-400 font-light">
                          Virtual Card
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Issue Your First Virtual Card?</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {cardholders.length === 0
                        ? 'Create a cardholder profile first, then issue your premium virtual card for secure online payments.'
                        : 'Issue your first premium virtual card to start making secure online payments with USD Financial.'
                      }
                    </p>

                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                      <Shield className="h-4 w-4" />
                      <span>Bank-level security and instant issuance</span>
                    </div>
                  </div>
                ) : (
                  stripeCards.map((card) => (
                    <div key={card.id} className="group">
                      {/* Premium Credit Card Design */}
                      <div className="relative w-full max-w-md mx-auto mb-6">
                        {/* Main Card */}
                        <div
                          className="relative w-full h-48 rounded-2xl shadow-2xl transform transition-all duration-700 hover:scale-105 cursor-pointer"
                          style={{
                            aspectRatio: '1.586/1',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #000000 100%)',
                            backgroundSize: '200% 200%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 35px 60px -12px rgba(0, 0, 0, 0.6), 0 15px 35px -5px rgba(0, 0, 0, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 25px -5px rgba(0, 0, 0, 0.3)';
                          }}
                        >
                          {/* Subtle Pattern Overlay */}
                          <div className="absolute inset-0 rounded-2xl opacity-20"
                               style={{
                                 background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                               }}
                          />

                          {/* Card Content */}
                          <div className="relative h-full p-6 flex flex-col justify-between text-white">
                            {/* Top Section - Card Type & Status */}
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col">
                                <div className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                                  {card.type} Card
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    card.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                                    card.status === 'inactive' ? 'bg-gray-500/20 text-gray-300' :
                                    'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {card.status}
                                  </div>
                                </div>
                              </div>

                              {/* Chip Design */}
                              <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
                                <div className="w-full h-full rounded bg-gradient-to-br from-amber-300 to-amber-500 m-0.5">
                                  <div className="w-full h-full rounded bg-gradient-to-br from-amber-400/50 to-transparent"></div>
                                </div>
                              </div>
                            </div>

                            {/* Middle Section - Card Number */}
                            <div className="flex-1 flex items-center">
                              <div className="w-full">
                                <div className="text-xl font-mono tracking-wider text-white/90 mb-1 transition-all duration-300">
                                  {formatStripeCardNumber(card, cardDetails[card.id], !showCardDetails[card.id])}
                                </div>
                                <div className="text-xs text-gray-400 uppercase tracking-widest">
                                  Card Number
                                </div>
                              </div>
                            </div>

                            {/* Bottom Section - Cardholder & Expiry */}
                            <div className="flex items-end justify-between">
                              <div>
                                <div className="text-sm font-medium text-white/90 uppercase tracking-wide">
                                  {card.cardName}
                                </div>
                                <div className="text-xs text-gray-400 uppercase tracking-widest">
                                  Cardholder Name
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-mono text-white/90">
                                  {card.expiryMonth?.toString().padStart(2, '0')}/{card.expiryYear?.toString().slice(-2)}
                                </div>
                                <div className="text-xs text-gray-400 uppercase tracking-widest">
                                  Expires
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* USD Financial Branding */}
                          <div className="absolute bottom-4 right-6">
                            <div className="text-right">
                              <div className="text-xs font-bold text-emerald-400 tracking-wider">
                                USD FINANCIAL
                              </div>
                              <div className="text-xs text-gray-400 font-light">
                                Virtual Card
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Controls & Actions */}
                      <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleStripeCardDetails(card.id)}
                              className="flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                            >
                              {showCardDetails[card.id] ? (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Show Details
                                </>
                              )}
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = '/cards/controls'}
                              className="flex items-center gap-2 hover:bg-gray-50"
                            >
                              <Settings className="h-4 w-4" />
                              Manage
                            </Button>
                          </div>
                        </div>

                        {/* Premium Card Details Panel */}
                        {showCardDetails[card.id] && cardDetails[card.id] && (
                          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-200 p-6 shadow-lg mb-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Shield className="h-5 w-5 text-emerald-600" />
                              <h3 className="font-semibold text-gray-900">Secure Card Information</h3>
                            </div>

                            <div className="grid gap-4">
                              {/* Card Number */}
                              <div className="group p-4 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 transition-all duration-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                      Card Number
                                    </div>
                                    <div className="font-mono text-lg text-gray-900 tracking-wider">
                                      {cardDetails[card.id]?.number || '**** **** **** ****'}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(cardDetails[card.id]?.number?.replaceAll(' ', '') || '', `${card.id}-number`)}
                                    className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                  >
                                    {copiedField === `${card.id}-number` ? (
                                      <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <div className="h-2 w-2 bg-white rounded-full" />
                                      </div>
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Expiry and CVC */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="group p-4 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 transition-all duration-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Expiry Date
                                      </div>
                                      <div className="font-mono text-lg text-gray-900">
                                        {card.expiryMonth?.toString().padStart(2, '0')}/{card.expiryYear?.toString().slice(-2)}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(`${card.expiryMonth?.toString().padStart(2, '0')}/${card.expiryYear?.toString().slice(-2)}`, `${card.id}-expiry`)}
                                      className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                    >
                                      {copiedField === `${card.id}-expiry` ? (
                                        <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                          <div className="h-2 w-2 bg-white rounded-full" />
                                        </div>
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                <div className="group p-4 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 transition-all duration-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Security Code
                                      </div>
                                      <div className="font-mono text-lg text-gray-900">
                                        {cardDetails[card.id]?.cvc || '***'}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(cardDetails[card.id]?.cvc || '', `${card.id}-cvc`)}
                                      className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                    >
                                      {copiedField === `${card.id}-cvc` ? (
                                        <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                          <div className="h-2 w-2 bg-white rounded-full" />
                                        </div>
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Security Notice */}
                              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                <p className="text-sm text-emerald-800">
                                  Your card details are encrypted and secured. Only use this information on trusted websites.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Additional Card Information */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-sm font-medium text-gray-700">
                                  {card.currency.toUpperCase()} Currency
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                Issued: {new Date(card.createdAt).toLocaleDateString()}
                              </div>
                            </div>

                            {card.spendingControls?.spending_limits?.length > 0 && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                                <Shield className="h-3 w-3 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">
                                  Spending Limits Active
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Spending Limits Detail */}
                          {card.spendingControls?.spending_limits?.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs font-medium text-gray-600 mb-2">Active Spending Limits:</div>
                              <div className="flex flex-wrap gap-2">
                                {card.spendingControls.spending_limits.slice(0, 3).map((limit: any, idx: number) => (
                                  <div key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                    ${(limit.amount / 100).toLocaleString()} / {limit.interval.replace('_', ' ')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Virtual Card Benefits */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Virtual Card Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Real Card Numbers</div>
                  <div className="text-xs text-muted-foreground">
                    Real Visa cards issued through Stripe
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Enterprise Security</div>
                  <div className="text-xs text-muted-foreground">
                    PCI DSS compliant with Stripe infrastructure
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Real-time Controls</div>
                  <div className="text-xs text-muted-foreground">
                    Instant spending limits and merchant restrictions
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Transaction History</div>
                  <div className="text-xs text-muted-foreground">
                    Complete transaction tracking and reporting
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {cardholders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cardholder Profiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cardholders.map((cardholder) => (
                  <div key={cardholder.id} className="p-3 border rounded-lg">
                    <div className="text-sm font-medium">{cardholder.name}</div>
                    <div className="text-xs text-muted-foreground">{cardholder.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Status: <span className="capitalize">{cardholder.status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cardholders.length === 0 ? (
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => setShowCardholderDialog(true)}
                  disabled={isLoadingCardholders}
                >
                  <User className="h-4 w-4 mr-2" />
                  {isLoadingCardholders ? 'Loading...' : 'Create Cardholder Profile'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => setShowIssueCardDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Issue New Virtual Card
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => {
                  loadCardholders()
                  loadStripeCards()
                }}
                disabled={isLoadingStripeCards || isLoadingCardholders}
              >
                <Settings className="h-4 w-4 mr-2" />
                {(isLoadingStripeCards || isLoadingCardholders) ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => window.location.href = '/cards/controls'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Card Settings & Controls
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => window.location.href = '/cards'}
              >
                <Globe className="h-4 w-4 mr-2" />
                View All Cards & History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}