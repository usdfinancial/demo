'use client'

import { useState } from 'react'
import { Settings, Lock, Unlock, CreditCard, Globe, Shield, AlertTriangle, DollarSign, Bell, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { NotificationModal } from '@/components/ui/NotificationModal'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

interface CardControl {
  id: string
  name: string
  last4: string
  type: 'physical' | 'virtual'
  status: 'active' | 'locked' | 'frozen'
  balance: number
  currency: StablecoinSymbol
  limits: {
    daily: number
    monthly: number
    perTransaction: number
    atm: number
  }
  restrictions: {
    onlinePayments: boolean
    contactlessPayments: boolean
    atmWithdrawals: boolean
    internationalTransactions: boolean
    gasStations: boolean
    restaurants: boolean
    ecommerce: boolean
  }
  notifications: {
    transactions: boolean
    limitsExceeded: boolean
    suspiciousActivity: boolean
    monthlyStatement: boolean
  }
}

const userCards: CardControl[] = [
  {
    id: '1',
    name: 'USD Financial Visa',
    last4: '4523',
    type: 'physical',
    status: 'active',
    balance: 2500.00,
    currency: 'USDC',
    limits: {
      daily: 5000,
      monthly: 25000,
      perTransaction: 2500,
      atm: 1000
    },
    restrictions: {
      onlinePayments: true,
      contactlessPayments: true,
      atmWithdrawals: true,
      internationalTransactions: true,
      gasStations: true,
      restaurants: true,
      ecommerce: true
    },
    notifications: {
      transactions: true,
      limitsExceeded: true,
      suspiciousActivity: true,
      monthlyStatement: false
    }
  },
  {
    id: '2',
    name: 'Virtual Card - Online',
    last4: '8901',
    type: 'virtual',
    status: 'active',
    balance: 500.00,
    currency: 'USDC',
    limits: {
      daily: 1000,
      monthly: 5000,
      perTransaction: 500,
      atm: 0
    },
    restrictions: {
      onlinePayments: true,
      contactlessPayments: false,
      atmWithdrawals: false,
      internationalTransactions: true,
      gasStations: false,
      restaurants: false,
      ecommerce: true
    },
    notifications: {
      transactions: true,
      limitsExceeded: true,
      suspiciousActivity: true,
      monthlyStatement: false
    }
  }
]

export default function CardControlsPage() {
  const [cards, setCards] = useState<CardControl[]>(userCards)
  const [selectedCard, setSelectedCard] = useState<CardControl>(userCards[0])
  const [limits, setLimits] = useState(selectedCard.limits)
  const [restrictions, setRestrictions] = useState(selectedCard.restrictions)
  const [notifications, setNotifications] = useState(selectedCard.notifications)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [securityAction, setSecurityAction] = useState<'report' | 'travel' | 'security' | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateType, setUpdateType] = useState<'limits' | 'restrictions' | 'notifications' | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'locked': return 'bg-red-100 text-red-800 border-red-200'
      case 'frozen': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const updateCardLimits = (field: keyof typeof limits, value: number) => {
    setLimits(prev => ({ ...prev, [field]: value }))
  }

  const updateRestrictions = (field: keyof typeof restrictions, value: boolean) => {
    setRestrictions(prev => ({ ...prev, [field]: value }))
  }

  const updateNotifications = (field: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }))
  }

  const lockCard = async (cardId: string) => {
    setIsUpdating(true)
    try {
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, status: 'locked' } : card
      ))
      if (selectedCard.id === cardId) {
        setSelectedCard(prev => ({ ...prev, status: 'locked' }))
      }
    } catch (error) {
      console.error('Failed to lock card:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const unlockCard = async (cardId: string) => {
    setIsUpdating(true)
    try {
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, status: 'active' } : card
      ))
      if (selectedCard.id === cardId) {
        setSelectedCard(prev => ({ ...prev, status: 'active' }))
      }
    } catch (error) {
      console.error('Failed to unlock card:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const updateLimits = async () => {
    setIsUpdating(true)
    try {
      setCards(prev => prev.map(card => 
        card.id === selectedCard.id ? { ...card, limits } : card
      ))
      setSelectedCard(prev => ({ ...prev, limits }))
    } catch (error) {
      console.error('Failed to update limits:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const updateCardRestrictions = async () => {
    setIsUpdating(true)
    try {
      setCards(prev => prev.map(card => 
        card.id === selectedCard.id ? { ...card, restrictions } : card
      ))
      setSelectedCard(prev => ({ ...prev, restrictions }))
    } catch (error) {
      console.error('Failed to update restrictions:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const updateCardNotifications = async () => {
    setIsUpdating(true)
    try {
      setCards(prev => prev.map(card => 
        card.id === selectedCard.id ? { ...card, notifications } : card
      ))
      setSelectedCard(prev => ({ ...prev, notifications }))
    } catch (error) {
      console.error('Failed to update notifications:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdate = async (type: 'limits' | 'restrictions' | 'notifications') => {
    setUpdateType(type)
    setIsUpdating(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update the appropriate data
      if (type === 'limits') {
        await updateLimits()
      } else if (type === 'restrictions') {
        await updateCardRestrictions()
      } else if (type === 'notifications') {
        await updateCardNotifications()
      }
      
      setShowUpdateModal(true)
    } catch (error) {
      console.error(`Failed to update ${type}:`, error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSecuritySettings = () => {
    setSecurityAction('security')
    setShowSecurityModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Card Controls
          </h1>
          <p className="text-muted-foreground mt-1">Manage your card settings, limits, and security preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            onClick={handleSecuritySettings}
          >
            <Shield className="h-4 w-4 mr-2" />
            Security Settings
          </Button>
        </div>
      </div>

      {/* Card Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            Select Card to Manage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedCard.id === card.id
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-200'
                }`}
                onClick={() => {
                  setSelectedCard(card)
                  setLimits(card.limits)
                  setRestrictions(card.restrictions)
                  setNotifications(card.notifications)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{card.name}</div>
                      <div className="text-sm text-muted-foreground">•••• •••• •••• {card.last4}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(card.status)}>
                      {card.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">{card.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Control Panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-600" />
                Card Management
              </CardTitle>
              <CardDescription>
                Configure settings for {selectedCard.name} (•••• {selectedCard.last4})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="limits">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="limits">Spending Limits</TabsTrigger>
                  <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="limits" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Daily Limit</label>
                        <span className="text-sm text-muted-foreground">{formatCurrency(limits.daily)}</span>
                      </div>
                      <Slider
                        value={[limits.daily]}
                        onValueChange={(value) => updateCardLimits('daily', value[0])}
                        max={10000}
                        min={100}
                        step={100}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Monthly Limit</label>
                        <span className="text-sm text-muted-foreground">{formatCurrency(limits.monthly)}</span>
                      </div>
                      <Slider
                        value={[limits.monthly]}
                        onValueChange={(value) => updateCardLimits('monthly', value[0])}
                        max={50000}
                        min={1000}
                        step={500}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Per Transaction Limit</label>
                        <span className="text-sm text-muted-foreground">{formatCurrency(limits.perTransaction)}</span>
                      </div>
                      <Slider
                        value={[limits.perTransaction]}
                        onValueChange={(value) => updateCardLimits('perTransaction', value[0])}
                        max={5000}
                        min={50}
                        step={50}
                        className="w-full"
                      />
                    </div>

                    {selectedCard.type === 'physical' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">ATM Daily Limit</label>
                          <span className="text-sm text-muted-foreground">{formatCurrency(limits.atm)}</span>
                        </div>
                        <Slider
                          value={[limits.atm]}
                          onValueChange={(value) => updateCardLimits('atm', value[0])}
                          max={2000}
                          min={0}
                          step={100}
                          className="w-full"
                        />
                      </div>
                    )}

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-yellow-800">Limit Changes</div>
                          <div className="text-xs text-yellow-600">
                            New limits will take effect immediately and may take up to 24 hours to apply to all transactions.
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      onClick={() => handleUpdate('limits')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Spending Limits'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="restrictions" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Online Payments</div>
                        <div className="text-sm text-muted-foreground">Allow online purchases</div>
                      </div>
                      <Switch
                        checked={restrictions.onlinePayments}
                        onCheckedChange={(checked) => updateRestrictions('onlinePayments', checked)}
                      />
                    </div>

                    {selectedCard.type === 'physical' && (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Contactless Payments</div>
                          <div className="text-sm text-muted-foreground">Tap to pay transactions</div>
                        </div>
                        <Switch
                          checked={restrictions.contactlessPayments}
                          onCheckedChange={(checked) => updateRestrictions('contactlessPayments', checked)}
                        />
                      </div>
                    )}

                    {selectedCard.type === 'physical' && (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">ATM Withdrawals</div>
                          <div className="text-sm text-muted-foreground">Cash withdrawals at ATMs</div>
                        </div>
                        <Switch
                          checked={restrictions.atmWithdrawals}
                          onCheckedChange={(checked) => updateRestrictions('atmWithdrawals', checked)}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">International Transactions</div>
                        <div className="text-sm text-muted-foreground">Purchases outside your country</div>
                      </div>
                      <Switch
                        checked={restrictions.internationalTransactions}
                        onCheckedChange={(checked) => updateRestrictions('internationalTransactions', checked)}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Merchant Categories</h4>
                      <div className="space-y-3">
                        {selectedCard.type === 'physical' && (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Gas Stations</div>
                              <div className="text-sm text-muted-foreground">Fuel and convenience stores</div>
                            </div>
                            <Switch
                              checked={restrictions.gasStations}
                              onCheckedChange={(checked) => updateRestrictions('gasStations', checked)}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Restaurants</div>
                            <div className="text-sm text-muted-foreground">Dining and food delivery</div>
                          </div>
                          <Switch
                            checked={restrictions.restaurants}
                            onCheckedChange={(checked) => updateRestrictions('restaurants', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">E-commerce</div>
                            <div className="text-sm text-muted-foreground">Online shopping platforms</div>
                          </div>
                          <Switch
                            checked={restrictions.ecommerce}
                            onCheckedChange={(checked) => updateRestrictions('ecommerce', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      onClick={() => handleUpdate('restrictions')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Restrictions'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Transaction Alerts</div>
                        <div className="text-sm text-muted-foreground">Get notified for every transaction</div>
                      </div>
                      <Switch
                        checked={notifications.transactions}
                        onCheckedChange={(checked) => updateNotifications('transactions', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Limit Exceeded Alerts</div>
                        <div className="text-sm text-muted-foreground">Notify when spending limits are reached</div>
                      </div>
                      <Switch
                        checked={notifications.limitsExceeded}
                        onCheckedChange={(checked) => updateNotifications('limitsExceeded', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Suspicious Activity</div>
                        <div className="text-sm text-muted-foreground">Alert for unusual transactions</div>
                      </div>
                      <Switch
                        checked={notifications.suspiciousActivity}
                        onCheckedChange={(checked) => updateNotifications('suspiciousActivity', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Monthly Statements</div>
                        <div className="text-sm text-muted-foreground">Email monthly spending summary</div>
                      </div>
                      <Switch
                        checked={notifications.monthlyStatement}
                        onCheckedChange={(checked) => updateNotifications('monthlyStatement', checked)}
                      />
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-blue-800">Notification Preferences</div>
                          <div className="text-xs text-blue-600">
                            We'll send notifications via email and push notifications in the app.
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      onClick={() => handleUpdate('notifications')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Notification Settings'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>
                Instant card controls and security features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedCard.status === 'active' ? (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => lockCard(selectedCard.id)}
                  disabled={isUpdating}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Locking...' : 'Lock Card'}
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  onClick={() => unlockCard(selectedCard.id)}
                  disabled={isUpdating}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Unlocking...' : 'Unlock Card'}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const message = `Report Lost/Stolen Card:\n\n` +
                    `Security Features:\n` +
                    `• Instant card freeze to prevent unauthorized use\n` +
                    `• 24/7 fraud monitoring and alerts\n` +
                    `• Zero liability protection for fraudulent charges\n` +
                    `• Emergency replacement card (1-2 business days)\n` +
                    `• Dispute resolution for unauthorized transactions\n\n` +
                    `USD Financial's stablecoin-native security ensures your USDC remains safe. ` +
                    `All card transactions are backed by your stablecoin balance, providing ` +
                    `transparent, real-time spending control.\n\n` +
                    `Report Process:\n` +
                    `1. Immediate card deactivation\n` +
                    `2. Fraud investigation initiated\n` +
                    `3. Replacement card issued\n` +
                    `4. USDC balance remains secure and accessible`
                  setSecurityAction('report')
                  setShowSecurityModal(true)
                }}
                title="Report lost or stolen card with instant security protection"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Lost/Stolen
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/cards/physical'}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Replace Card
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const message = `Travel Notice Setup:\n\n` +
                    `Prevent Transaction Declines:\n` +
                    `• Notify us of your travel plans to avoid card blocks\n` +
                    `• Set travel dates and destinations\n` +
                    `• Enable international transaction permissions\n` +
                    `• Receive travel-specific security alerts\n\n` +
                    `Stablecoin Travel Benefits:\n` +
                    `• No foreign exchange fees with USDC\n` +
                    `• Real-time spending in local currency\n` +
                    `• Transparent exchange rates\n` +
                    `• Global acceptance at millions of merchants\n\n` +
                    `Travel Setup Process:\n` +
                    `1. Enter travel dates and destinations\n` +
                    `2. Enable international spending permissions\n` +
                    `3. Set travel-specific spending limits\n` +
                    `4. Receive confirmation and travel tips\n\n` +
                    `Your USDC balance travels with you - no currency conversion needed!`
                  setSecurityAction('travel')
                  setShowSecurityModal(true)
                }}
                title="Set up travel notice to prevent transaction declines abroad"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Travel Notice
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Fraud Protection</div>
                  <div className="text-xs text-muted-foreground">24/7 monitoring enabled</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">PIN Protection</div>
                  <div className="text-xs text-muted-foreground">Secure PIN required</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Global Coverage</div>
                  <div className="text-xs text-muted-foreground">Works worldwide</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(selectedCard.balance)}
                </div>
                <div className="text-sm text-muted-foreground">{selectedCard.currency}</div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => window.location.href = '/accounts/wallet'}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Security Action Modal */}
      <NotificationModal
        open={showSecurityModal}
        onOpenChange={setShowSecurityModal}
        type="card"
        title={
          securityAction === 'report' ? 'Card Security Alert' :
          securityAction === 'travel' ? 'Travel Notice Activated' :
          'Security Settings Updated'
        }
        message={
          securityAction === 'report' 
            ? 'Your card has been immediately secured and fraud protection activated'
            : securityAction === 'travel'
            ? 'Travel notice has been set up successfully for international transactions'
            : 'Your card security settings have been successfully configured'
        }
        details={
          securityAction === 'report' ? [
            `Card: ${selectedCard.name} ending in ${selectedCard.last4}`,
            'Status: Immediately locked for security',
            'Fraud Protection: Activated',
            'Replacement Card: 1-2 business days',
            'USDC Balance: Secure and accessible',
            'Zero Liability: Full protection against fraud'
          ] : securityAction === 'travel' ? [
            `Card: ${selectedCard.name} ending in ${selectedCard.last4}`,
            'International Transactions: Enabled',
            'Travel Alerts: Activated',
            'Foreign Exchange: No fees with USDC',
            'Security Monitoring: Enhanced for travel',
            'Support: 24/7 available while traveling'
          ] : [
            `Card: ${selectedCard.name} ending in ${selectedCard.last4}`,
            'Security Features: All systems active',
            'Fraud Monitoring: 24/7 protection enabled',
            'PIN Security: Enhanced encryption',
            'Transaction Alerts: Real-time notifications',
            'Biometric Auth: Fingerprint & face recognition',
            'Zero Liability: Complete fraud protection'
          ]
        }
        actionLabel={
          securityAction === 'report' ? 'Order Replacement' :
          securityAction === 'travel' ? 'View Travel Tips' :
          'View Security Dashboard'
        }
        onAction={() => {
          setShowSecurityModal(false)
          if (securityAction === 'report') {
            window.location.href = '/cards/physical'
          } else if (securityAction === 'travel') {
            window.location.href = '/cards/controls'
          } else {
            window.location.href = '/cards/controls'
          }
        }}
        showCopy={true}
        copyText={`Card Security: ${
          securityAction === 'report' ? 'Lost/Stolen Report' :
          securityAction === 'travel' ? 'Travel Notice' :
          'Security Settings'
        } | Card: ${selectedCard.last4} | Status: ${
          securityAction === 'report' ? 'Secured' :
          securityAction === 'travel' ? 'Travel Ready' :
          'Protected'
        }`}
      />

      {/* Update Confirmation Modal */}
      <NotificationModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        type="success"
        title="Settings Updated Successfully!"
        message={`Your ${updateType} settings have been updated and are now active`}
        details={
          updateType === 'limits' ? [
            `Card: ${selectedCard.name} ending in ${selectedCard.last4}`,
            'Spending Limits Updated:',
            `• Daily Limit: ${formatCurrency(limits.daily)}`,
            `• Monthly Limit: ${formatCurrency(limits.monthly)}`,
            `• Per Transaction: ${formatCurrency(limits.perTransaction)}`,
            ...(selectedCard.type === 'physical' ? [`• ATM Daily: ${formatCurrency(limits.atm)}`] : []),
            '',
            'Changes take effect immediately and may take up to 24 hours to apply to all transactions.'
          ] : updateType === 'restrictions' ? [
            `Card: ${selectedCard.name} ending in ${selectedCard.last4}`,
            'Transaction Restrictions Updated:',
            `• Online Payments: ${restrictions.onlinePayments ? 'Enabled' : 'Disabled'}`,
            ...(selectedCard.type === 'physical' ? [
              `• Contactless Payments: ${restrictions.contactlessPayments ? 'Enabled' : 'Disabled'}`,
              `• ATM Withdrawals: ${restrictions.atmWithdrawals ? 'Enabled' : 'Disabled'}`
            ] : []),
            `• International Transactions: ${restrictions.internationalTransactions ? 'Enabled' : 'Disabled'}`,
            `• Restaurants: ${restrictions.restaurants ? 'Enabled' : 'Disabled'}`,
            `• E-commerce: ${restrictions.ecommerce ? 'Enabled' : 'Disabled'}`,
            '',
            'Restriction changes are active immediately for enhanced security.'
          ] : [
            `Card: ${selectedCard.name} ending in ${selectedCard.last4}`,
            'Notification Settings Updated:',
            `• Transaction Alerts: ${notifications.transactions ? 'Enabled' : 'Disabled'}`,
            `• Limit Exceeded Alerts: ${notifications.limitsExceeded ? 'Enabled' : 'Disabled'}`,
            `• Suspicious Activity: ${notifications.suspiciousActivity ? 'Enabled' : 'Disabled'}`,
            `• Monthly Statements: ${notifications.monthlyStatement ? 'Enabled' : 'Disabled'}`,
            '',
            'Notification preferences updated. You will receive alerts via email and push notifications.'
          ]
        }
        actionLabel="View Card Details"
        onAction={() => {
          setShowUpdateModal(false)
          window.location.href = '/cards'
        }}
        showCopy={true}
        copyText={`Card Update: ${updateType} settings | Card: ${selectedCard.last4} | ${new Date().toISOString()}`}
      />
    </div>
  )
}