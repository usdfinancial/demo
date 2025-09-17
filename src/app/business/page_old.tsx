'use client'

import React, { useState, useEffect } from 'react'
import { Building2, CreditCard, TrendingUp, Users, DollarSign, Globe, Shield, Zap, ArrowRight, FileText, Calculator, ExternalLink, Brain, Target, BarChart3, RefreshCw, Plus, Settings, Activity } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { MockDataExtensions } from '@/lib/demo/mockDataExtensions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface BusinessService {
  id: string
  name: string
  description: string
  icon: any
  features: string[]
  pricing: string
  category: string
}

interface BusinessAccount {
  companyName: string
  accountType: string
  monthlyVolume: number
  employees: number
  balance: number
  currency: string
}

const businessServices: BusinessService[] = [
  {
    id: '1',
    name: 'Corporate Accounts',
    description: 'Multi-signature business accounts with advanced controls',
    icon: Building2,
    features: ['Multi-sig wallets', 'Role-based access', 'Spending controls', 'Real-time reporting'],
    pricing: 'From $99/month',
    category: 'Banking'
  },
  {
    id: '2',
    name: 'Business Cards',
    description: 'Corporate stablecoin cards for your team',
    icon: CreditCard,
    features: ['Employee cards', 'Expense management', 'Real-time monitoring', 'Automated categorization'],
    pricing: '$5/card/month',
    category: 'Cards'
  },
  {
    id: '3',
    name: 'Treasury Management',
    description: 'Optimize your corporate cash management',
    icon: TrendingUp,
    features: ['Yield optimization', 'Liquidity management', 'Risk assessment', 'Automated strategies'],
    pricing: '0.25% of AUM',
    category: 'Treasury'
  },
  {
    id: '4',
    name: 'Payroll Solutions',
    description: 'Pay employees in stablecoins globally',
    icon: Users,
    features: ['Global payments', 'Instant settlement', 'Tax compliance', 'Employee self-service'],
    pricing: '$2/employee/month',
    category: 'Payments'
  },
  {
    id: '5',
    name: 'API & Integration',
    description: 'White-label stablecoin infrastructure',
    icon: Globe,
    features: ['RESTful APIs', 'Webhooks', 'SDK libraries', '99.9% uptime SLA'],
    pricing: 'Custom pricing',
    category: 'Technology'
  },
  {
    id: '6',
    name: 'Compliance Suite',
    description: 'AML/KYC and regulatory compliance tools',
    icon: Shield,
    features: ['KYC automation', 'Transaction monitoring', 'Regulatory reporting', 'Audit trails'],
    pricing: 'From $299/month',
    category: 'Compliance'
  }
]

const mockBusinessAccount: BusinessAccount = {
  companyName: 'TechCorp Solutions',
  accountType: 'Enterprise',
  monthlyVolume: 2500000,
  employees: 150,
  balance: 450000,
  currency: 'USDC'
}

export default function BusinessPage() {
  const { user } = useEnhancedAuth()
  const [selectedService, setSelectedService] = useState<BusinessService | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user?.email) {
      const demoUser = findUserByEmail(user.email)
      if (demoUser) {
        loadBusinessData(demoUser)
      }
    }
  }, [user?.email])

  const loadBusinessData = async (demoUser: any) => {
    setIsLoading(true)
    try {
      const businessData = MockDataExtensions.generateBusinessProfile(demoUser)
      setBusinessProfile(businessData)
      setTeamMembers(businessData.teamMembers || [])
    } catch (error) {
      console.error('Failed to load business data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleRefresh = () => {
    if (user?.email) {
      const demoUser = findUserByEmail(user.email)
      if (demoUser) {
        loadBusinessData(demoUser)
      }
    }
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to access Business</h3>
            <p className="text-muted-foreground">Connect your account to manage your business finances</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const categories = ['all', 'Banking', 'Cards', 'Treasury', 'Payments', 'Technology', 'Compliance']

  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    volume: '',
    service: ''
  })

  const filteredServices = selectedCategory === 'all' 
    ? businessServices 
    : businessServices.filter(service => service.category === selectedCategory)

  const getIconColor = (category: string) => {
    switch (category) {
      case 'Banking': return 'text-blue-600'
      case 'Cards': return 'text-purple-600'
      case 'Treasury': return 'text-green-600'
      case 'Payments': return 'text-orange-600'
      case 'Technology': return 'text-cyan-600'
      case 'Compliance': return 'text-red-600'
      default: return 'text-emerald-600'
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Business
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
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Business Overview */}
        {businessProfile && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{businessProfile.companyName}</div>
                <p className="text-sm text-muted-foreground">{businessProfile.industry}</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Team Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{businessProfile.employeeCount}</div>
                <p className="text-sm text-muted-foreground">Active employees</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Monthly Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(parseFloat(businessProfile.monthlyVolume))}</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+{businessProfile.growthRate}%</div>
                <p className="text-sm text-muted-foreground">Year over year</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Prominent Business Platform Link */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                USD Financial Business
                <Badge className="bg-blue-100 text-blue-800 text-xs ml-2">
                  <Brain className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Access our comprehensive corporate financial platform with AI-powered treasury management, real-time analytics, and automated compliance monitoring.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span>Smart Treasury</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>Real-time Analytics</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Automated Compliance</span>
                </div>
              </div>
            </div>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              onClick={() => window.open('/business/platform', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Business Platform
            </Button>
          </div>
        </div>

        {/* Business Services */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-600" />
                  Business Services
                </CardTitle>
                <CardDescription>
                  Comprehensive financial solutions designed for modern businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="banking">Banking</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                  </TabsList>
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className={selectedCategory === category ? "bg-emerald-600" : ""}
                      >
                        {category === 'all' ? 'All' : category}
                      </Button>
                    ))}
                  </div>

                  {filteredServices.map((service) => {
                    const Icon = service.icon
                    return (
                      <div key={service.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                              <Icon className={`h-6 w-6 ${getIconColor(service.category)}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{service.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {service.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-600">{service.pricing}</div>
                            <Button size="sm" className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500">
                              Learn More
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-1">
                          {service.features.map((feature, index) => (
                            <span key={index} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          placeholder="John Smith"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input
                          type="email"
                          placeholder="john@company.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company Name</label>
                        <Input
                          placeholder="Acme Corporation"
                          value={contactForm.company}
                          onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Monthly Volume</label>
                        <Select value={contactForm.volume} onValueChange={(value) => setContactForm({...contactForm, volume: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select volume range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-100k">$0 - $100K</SelectItem>
                            <SelectItem value="100k-1m">$100K - $1M</SelectItem>
                            <SelectItem value="1m-10m">$1M - $10M</SelectItem>
                            <SelectItem value="10m+">$10M+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service Interest</label>
                      <Select value={contactForm.service} onValueChange={(value) => setContactForm({...contactForm, service: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service of interest" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessServices.map((service) => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold text-emerald-700 mb-2">What happens next?</h4>
                      <div className="space-y-1 text-sm text-emerald-600">
                        <div>• Our team will contact you within 24 hours</div>
                        <div>• Schedule a personalized demo</div>
                        <div>• Discuss your specific business needs</div>
                        <div>• Receive a custom pricing proposal</div>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      disabled={!contactForm.name || !contactForm.email || !contactForm.company}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Contact Sales Team
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Business Benefits */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Why Choose USD Financial?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Lightning Fast</div>
                  <div className="text-xs text-muted-foreground">Instant global transactions</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Enterprise Security</div>
                  <div className="text-xs text-muted-foreground">Bank-grade protection</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Global Reach</div>
                  <div className="text-xs text-muted-foreground">200+ countries supported</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Cost Effective</div>
                  <div className="text-xs text-muted-foreground">Up to 90% savings on fees</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Volume</label>
                <Input type="number" placeholder="1000000" className="text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Employees</label>
                <Input type="number" placeholder="50" className="text-sm" />
              </div>
              <Button variant="outline" className="w-full text-sm">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Savings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Success</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">"90% reduction in payment processing time"</div>
                  <div className="text-xs text-blue-600">- TechStartup Inc.</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">"$50K annual savings on transaction fees"</div>
                  <div className="text-xs text-green-600">- GlobalCorp Ltd.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Enterprise Grade</h3>
              <p className="text-sm text-muted-foreground">Built for large organizations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Compliance Ready</h3>
              <p className="text-sm text-muted-foreground">Meets all regulatory requirements</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <Globe className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">API First</h3>
              <p className="text-sm text-muted-foreground">Easy integration with existing systems</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}