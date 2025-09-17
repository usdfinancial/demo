'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { Building2, Users, CreditCard, TrendingUp, Shield, Globe, Zap, RefreshCw, Plus, BarChart3, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface BusinessService {
  id: string
  name: string
  description: string
  category: 'payments' | 'treasury' | 'lending' | 'compliance'
  icon: any
  features: string[]
  pricing: string
  status: 'active' | 'coming-soon' | 'beta'
}

interface BusinessMetrics {
  totalRevenue: number
  monthlyTransactions: number
  activeEmployees: number
  complianceScore: number
}

const businessServices: BusinessService[] = [
  {
    id: '1',
    name: 'Business Payments',
    description: 'Accept stablecoin payments from customers worldwide',
    category: 'payments',
    icon: CreditCard,
    features: ['Global payments', 'Instant settlement', 'Low fees', 'Multi-currency'],
    pricing: '0.5% per transaction',
    status: 'active'
  },
  {
    id: '2',
    name: 'Treasury Management',
    description: 'Manage corporate funds with yield optimization',
    category: 'treasury',
    icon: TrendingUp,
    features: ['Yield farming', 'Risk management', 'Automated strategies', 'Real-time reporting'],
    pricing: '0.25% management fee',
    status: 'active'
  },
  {
    id: '3',
    name: 'Business Lending',
    description: 'Access working capital with crypto collateral',
    category: 'lending',
    icon: DollarSign,
    features: ['Flexible terms', 'Instant approval', 'Competitive rates', 'No credit checks'],
    pricing: 'From 6% APR',
    status: 'beta'
  },
  {
    id: '4',
    name: 'Compliance Suite',
    description: 'Automated KYC/AML and regulatory compliance',
    category: 'compliance',
    icon: Shield,
    features: ['KYC automation', 'AML monitoring', 'Regulatory reporting', 'Risk scoring'],
    pricing: '$50/month per user',
    status: 'active'
  }
]

export default function BusinessPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const businessMetrics: BusinessMetrics = {
    totalRevenue: 125000,
    monthlyTransactions: 1250,
    activeEmployees: 15,
    complianceScore: 98
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const categories = ['all', 'payments', 'treasury', 'lending', 'compliance']

  const filteredServices = businessServices.filter(service => 
    selectedCategory === 'all' || service.category === selectedCategory
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'beta':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Beta</Badge>
      case 'coming-soon':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Coming Soon</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>
    }
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to access business features</h3>
            <p className="text-muted-foreground">Connect your account to manage your business financial services</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Business Services
            </h1>
            <p className="text-muted-foreground">Comprehensive financial solutions for your business</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Business Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(businessMetrics.totalRevenue)}
              </div>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {businessMetrics.monthlyTransactions.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Monthly volume</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {businessMetrics.activeEmployees}
              </div>
              <p className="text-sm text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {businessMetrics.complianceScore}%
              </div>
              <p className="text-sm text-muted-foreground">Regulatory compliance</p>
            </CardContent>
          </Card>
        </div>

        {/* Business Services */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Business Solutions
            </CardTitle>
            <CardDescription>
              Explore our comprehensive suite of business financial services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Service Overview</TabsTrigger>
                <TabsTrigger value="analytics">Business Analytics</TabsTrigger>
                <TabsTrigger value="settings">Account Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className={selectedCategory === category ? "bg-emerald-600 text-white" : ""}
                      >
                        {category === 'all' ? 'All Services' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredServices.map((service) => {
                      const Icon = service.icon
                      return (
                        <div key={service.id} className="p-6 border rounded-lg hover:bg-emerald-50 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Icon className="h-6 w-6 text-emerald-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{service.name}</h3>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                              </div>
                            </div>
                            {getStatusBadge(service.status)}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Key Features</h4>
                              <div className="flex flex-wrap gap-1">
                                {service.features.map((feature, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm text-muted-foreground">Pricing: </span>
                                <span className="font-medium">{service.pricing}</span>
                              </div>
                              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                                {service.status === 'active' ? 'Configure' : 'Learn More'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-6">
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                  <h3 className="font-semibold text-emerald-700 mb-4">Business Performance</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-emerald-600">Revenue Growth</div>
                      <div className="text-2xl font-bold text-emerald-700">+24.5%</div>
                      <div className="text-sm text-emerald-600">vs last quarter</div>
                    </div>
                    <div>
                      <div className="text-sm text-emerald-600">Customer Satisfaction</div>
                      <div className="text-2xl font-bold text-emerald-700">4.8/5</div>
                      <div className="text-sm text-emerald-600">Average rating</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Service Utilization</h4>
                  {businessServices.map((service) => (
                    <div key={service.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{service.name}</span>
                        <span>{Math.floor(Math.random() * 40) + 60}%</span>
                      </div>
                      <Progress value={Math.floor(Math.random() * 40) + 60} className="h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Account Information</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Business Name:</span>
                        <span>Demo Corporation</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Type:</span>
                        <span>Enterprise</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registration:</span>
                        <span>Delaware, USA</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Security Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Two-Factor Authentication</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Access</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Compliance Monitoring</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline">Update Settings</Button>
                    <Button variant="outline">Download Reports</Button>
                    <Button variant="outline">Contact Support</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Business Features */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Globe className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Global Reach</h3>
                <p className="text-sm text-muted-foreground">Accept payments worldwide</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Instant Settlement</h3>
                <p className="text-sm text-muted-foreground">Real-time transaction processing</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">Bank-grade security standards</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
