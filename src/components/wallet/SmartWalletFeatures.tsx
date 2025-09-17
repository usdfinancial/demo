'use client'

import { useState } from 'react'
import { 
  Zap, 
  Shield, 
  Users, 
  CreditCard, 
  ArrowUpDown, 
  Lock, 
  Smartphone, 
  Globe,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SmartWalletFeaturesProps {
  isAAReady: boolean
}

export function SmartWalletFeatures({ isAAReady }: SmartWalletFeaturesProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const features = [
    {
      id: 'gasless',
      icon: Zap,
      title: 'Gasless Transactions',
      description: 'Send transactions without paying gas fees',
      status: isAAReady ? 'active' : 'coming-soon',
      details: 'Smart contracts handle gas payments automatically through Account Abstraction, making transactions seamless for users.',
      benefits: ['Zero gas fees', 'Instant transactions', 'No ETH required', 'Simplified UX']
    },
    {
      id: 'social-recovery',
      icon: Users,
      title: 'Social Recovery',
      description: 'Recover wallet access through trusted contacts',
      status: 'coming-soon',
      details: 'Set trusted friends or family as guardians who can help recover your wallet if you lose access.',
      benefits: ['No seed phrase needed', 'Trusted guardian network', 'Secure recovery process', 'Peace of mind']
    },
    {
      id: 'session-keys',
      icon: CreditCard,
      title: 'Session Keys',
      description: 'Temporary permissions for apps and services',
      status: 'coming-soon',
      details: 'Grant limited-time permissions to dApps without exposing your main private key.',
      benefits: ['Enhanced security', 'Granular permissions', 'Time-limited access', 'Revocable anytime']
    },
    {
      id: 'batch-transactions',
      icon: ArrowUpDown,
      title: 'Batch Operations',
      description: 'Execute multiple transactions in one go',
      status: isAAReady ? 'active' : 'coming-soon',
      details: 'Combine multiple operations into a single transaction, saving time and reducing complexity.',
      benefits: ['Atomic operations', 'Reduced complexity', 'Cost efficient', 'Better UX']
    },
    {
      id: 'enhanced-security',
      icon: Shield,
      title: 'Enhanced Security',
      description: 'Advanced smart contract security features',
      status: 'active',
      details: 'Built-in security features including spending limits, transaction delays, and fraud protection.',
      benefits: ['Spending limits', 'Fraud detection', 'Emergency pause', 'Multi-sig support']
    },
    {
      id: 'cross-platform',
      icon: Globe,
      title: 'Cross-Platform Access',
      description: 'Access your wallet from any device',
      status: 'active',
      details: 'Your smart wallet works seamlessly across web, mobile, and desktop platforms.',
      benefits: ['Universal access', 'Sync across devices', 'No downloads needed', 'Cloud backup']
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'coming-soon':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Lock className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Unavailable
          </Badge>
        )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'from-emerald-50 to-emerald-100 border-emerald-200'
      case 'coming-soon':
        return 'from-orange-50 to-orange-100 border-orange-200'
      default:
        return 'from-gray-50 to-gray-100 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Status Overview */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-3xl p-8 border border-emerald-100">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-bold text-gray-900">Smart Wallet Features</h2>
              <p className="text-gray-600 text-lg">
                Account Abstraction Technology
              </p>
            </div>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
            Experience the next generation of digital wallets with cutting-edge Account Abstraction technology. 
            Enjoy gasless transactions, enhanced security, and seamless user experience.
          </p>
          
          {/* Feature Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">3</p>
              <p className="text-sm text-gray-600">Active Features</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Lock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">3</p>
              <p className="text-sm text-gray-600">Coming Soon</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">100%</p>
              <p className="text-sm text-gray-600">Security Score</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Globe className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">24/7</p>
              <p className="text-sm text-gray-600">Availability</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Feature Overview</TabsTrigger>
          <TabsTrigger value="comparison">AA vs Traditional</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              const isExpanded = activeFeature === feature.id
              return (
                <Card 
                  key={feature.id}
                  className={`relative overflow-hidden border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${getStatusColor(feature.status)} ${isExpanded ? 'ring-2 ring-emerald-500 shadow-xl' : ''}`}
                  onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Icon className="w-7 h-7 text-gray-700" />
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mt-3">{feature.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-sm font-medium ${isExpanded ? 'text-emerald-700' : 'text-gray-600'}`}>
                        {isExpanded ? 'Hide details' : 'Learn more'}
                      </span>
                      <div className={`p-2 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-emerald-600' : 'text-gray-400'
                        }`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 p-5 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 space-y-4 animate-fade-in">
                        <p className="text-sm text-gray-700 leading-relaxed">{feature.details}</p>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <p className="text-sm font-semibold text-gray-900">Key Benefits</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {feature.benefits.map((benefit, index) => (
                              <div key={index} className="flex items-center space-x-2 bg-emerald-50 rounded-lg p-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                                <span className="text-xs text-gray-700 font-medium">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {feature.status === 'active' && (
                          <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm font-semibold text-emerald-800">Ready to use!</span>
                            </div>
                            <p className="text-xs text-emerald-700 mt-1">This feature is active and available in your wallet</p>
                          </div>
                        )}
                        
                        {feature.status === 'coming-soon' && (
                          <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-semibold text-orange-800">Coming Soon</span>
                            </div>
                            <p className="text-xs text-orange-700 mt-1">This feature will be available in future updates</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Abstraction */}
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-emerald-900">Account Abstraction</CardTitle>
                    <CardDescription className="text-emerald-700">Smart Contract Wallet</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    'No gas fees for users',
                    'Social login (Google, Email)',
                    'Batch transactions',
                    'Session keys & permissions',
                    'Social recovery options',
                    'Enhanced security features',
                    'Cross-platform compatibility',
                    'Programmable wallet logic'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm text-emerald-800">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Traditional Wallet */}
            <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Traditional Wallet</CardTitle>
                    <CardDescription className="text-gray-700">Externally Owned Account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { text: 'Users pay gas fees', available: false },
                    { text: 'Seed phrase required', available: false },
                    { text: 'One transaction at a time', available: false },
                    { text: 'Full key management', available: true },
                    { text: 'Seed phrase recovery only', available: false },
                    { text: 'Basic security model', available: false },
                    { text: 'Platform dependent', available: false },
                    { text: 'Limited programmability', available: false }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {feature.available ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={`text-sm ${feature.available ? 'text-gray-800' : 'text-gray-500'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}