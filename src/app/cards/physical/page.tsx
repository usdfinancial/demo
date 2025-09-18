'use client'

import { useState } from 'react'
import { CreditCard, Truck, CheckCircle2, Clock, MapPin, Package, DollarSign, Shield, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

interface CardOrder {
  id: string
  type: 'standard' | 'metal' | 'premium'
  status: 'processing' | 'shipped' | 'delivered'
  estimatedDelivery: string
  trackingNumber?: string
  shippingAddress: string
}

const cardTypes = [
  {
    id: 'standard',
    name: 'Standard Card',
    description: 'Classic plastic card with chip and contactless',
    price: 0,
    features: ['Contactless payments', 'Chip & PIN', 'Global acceptance', '1% cashback'],
    color: 'Emerald Green',
    material: 'Eco-friendly plastic'
  },
  {
    id: 'metal',
    name: 'Metal Card',
    description: 'Premium metal card with enhanced benefits',
    price: 19.99,
    features: ['Metal construction', 'Priority support', 'Enhanced security', '1.5% cashback', 'Airport lounge access'],
    color: 'Titanium Silver',
    material: 'Brushed metal'
  },
  {
    id: 'premium',
    name: 'Premium Black',
    description: 'Exclusive black metal card with VIP benefits',
    price: 49.99,
    features: ['Black metal finish', 'Concierge service', 'Travel insurance', '2% cashback', 'Global ATM fee rebates'],
    color: 'Matte Black',
    material: 'Premium metal'
  }
]

const existingOrders: CardOrder[] = [
  {
    id: '1',
    type: 'standard',
    status: 'shipped',
    estimatedDelivery: '2024-01-25',
    trackingNumber: 'USD1234567890',
    shippingAddress: '123 Main St, San Francisco, CA 94105'
  }
]

export default function PhysicalCardsPage() {
  const [selectedCardType, setSelectedCardType] = useState(cardTypes[0])
  const [orders, setOrders] = useState<CardOrder[]>(existingOrders)
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  })
  const [isOrdering, setIsOrdering] = useState(false)
  const [expressShipping, setExpressShipping] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle2 className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const handleOrderCard = async () => {
    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      return
    }

    setIsOrdering(true)
    try {
      const newOrder: CardOrder = {
        id: (orders.length + 1).toString(),
        type: selectedCardType.id as 'standard' | 'metal' | 'premium',
        status: 'processing',
        estimatedDelivery: new Date(Date.now() + (expressShipping ? 3 : 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        trackingNumber: `USD${Math.random().toString().slice(2, 12)}`,
        shippingAddress: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}`
      }

      setOrders(prev => [...prev, newOrder])
      
      // Reset form
      setShippingInfo({
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      })
      setExpressShipping(false)
      
      // Switch to order status view
      window.scrollTo(0, 0)
      
    } catch (error) {
      console.error('Failed to place order:', error)
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Physical Cards
          </h1>
          <p className="text-muted-foreground mt-1">Order and manage your physical stablecoin debit cards</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={() => document.getElementById('shipping-tab')?.click()}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Order New Card
          </Button>
        </div>
      </div>

      {/* Existing Orders */}
      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-600" />
              Order Status
            </CardTitle>
            <CardDescription>
              Track your physical card orders and delivery status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium capitalize">{order.type} Card</div>
                        <div className="text-sm text-muted-foreground">
                          {order.trackingNumber && `Tracking: ${order.trackingNumber}`}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Shipping to:</span>
                      <span>{order.shippingAddress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Estimated delivery:</span>
                      <span className="font-medium">{order.estimatedDelivery}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Selection */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Card</CardTitle>
              <CardDescription>
                Select the perfect physical card for your spending needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="selection">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="selection">Card Selection</TabsTrigger>
                  <TabsTrigger value="shipping" id="shipping-tab">Shipping Details</TabsTrigger>
                </TabsList>

                <TabsContent value="selection" className="space-y-4 mt-6">
                  {cardTypes.map((cardType) => (
                    <div
                      key={cardType.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCardType.id === cardType.id
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-200'
                      }`}
                      onClick={() => setSelectedCardType(cardType)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{cardType.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{cardType.description}</p>
                            <div className="mt-2 space-y-1">
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Color:</span> {cardType.color}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Material:</span> {cardType.material}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">
                            {cardType.price === 0 ? 'Free' : formatCurrency(cardType.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">One-time fee</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {cardType.features.map((feature, index) => (
                          <span key={index} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="shipping" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Street Address</label>
                      <Input
                        placeholder="123 Main Street"
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">City</label>
                        <Input
                          placeholder="San Francisco"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">State</label>
                        <Input
                          placeholder="CA"
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">ZIP Code</label>
                        <Input
                          placeholder="94105"
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Country</label>
                        <Select value={shippingInfo.country} onValueChange={(value) => setShippingInfo({...shippingInfo, country: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="EU">European Union</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold text-emerald-700 mb-3">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Card type:</span>
                          <span className="font-medium">{selectedCardType.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>One-time fee:</span>
                          <span className="font-medium">
                            {selectedCardType.price === 0 ? 'Free' : formatCurrency(selectedCardType.price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span className="font-medium">Free (5-7 business days)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Express shipping:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">+{formatCurrency(15)} (2-3 business days)</span>
                            <Switch 
                              checked={expressShipping} 
                              onCheckedChange={setExpressShipping}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-emerald-200">
                          <span>Total:</span>
                          <span>
                            {formatCurrency((selectedCardType.price || 0) + (expressShipping ? 15 : 0))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      disabled={!shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode || isOrdering}
                      onClick={handleOrderCard}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {isOrdering ? 'Placing Order...' : `Order ${selectedCardType.name}`}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Card Benefits */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Physical Card Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Global Acceptance</div>
                  <div className="text-xs text-muted-foreground">Use anywhere Visa is accepted</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Secure Payments</div>
                  <div className="text-xs text-muted-foreground">Chip & PIN + contactless</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Real-time Balance</div>
                  <div className="text-xs text-muted-foreground">Always up to date</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">No Monthly Fees</div>
                  <div className="text-xs text-muted-foreground">Free to use forever</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Standard shipping:</span>
                <span className="font-medium">5-7 business days</span>
              </div>
              <div className="flex justify-between">
                <span>Express shipping:</span>
                <span className="font-medium">2-3 business days</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping cost:</span>
                <span className="font-medium">Free worldwide</span>
              </div>
              <div className="flex justify-between">
                <span>Card activation:</span>
                <span className="font-medium">Instant via app</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}