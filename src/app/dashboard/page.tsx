'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  ArrowUpRight, 
  Plus, 
  Send, 
  ArrowLeftRight, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  CreditCard,
  Shield,
  Building2,
  DollarSign,
  Wallet,
  Star,
  Activity,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Target,
  PieChart,
  Bell,
  Calendar,
  Globe,
  Banknote,
  Coins
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { 
  portfolioChange, 
  formatCurrency, 
  formatDate, 
  getStablecoinIcon, 
  getTransactionTypeIcon,
  mockStablecoinTransactions,
  yieldPositions,
  calculateTotalYield,
  getWeightedAverageAPY
} from '@/lib/data'

// Helper function to get network-specific icons
function getNetworkIcon(networkName: string): string {
  const iconMap: Record<string, string> = {
    'Ethereum': '⟠',
    'Ethereum Sepolia': '⟠',
    'Arbitrum': '🔺',
    'Arbitrum Sepolia': '🔺', 
    'Optimism': '🔴',
    'Optimism Sepolia': '🔴',
    'Base': '🔵',
    'Base Sepolia': '🔵',
    'Polygon': '🟣',
    'Polygon Amoy': '🟣',
    'Avalanche': '🔺',
    'Avalanche Fuji': '🔺'
  }
  return iconMap[networkName] || '🔵'
}

export default function Dashboard() {
  const { user, isLoading, multiChainBalances, totalUSDC, networksWithBalance } = useEnhancedAuth()
  const [fullUserData, setFullUserData] = useState<any>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [activeInsight, setActiveInsight] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Fix hydration mismatch by ensuring client-side only state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only set user data after mounting to prevent hydration issues
  useEffect(() => {
    if (mounted && user?.email) {
      const userData = findUserByEmail(user.email)
      setFullUserData(userData)
    }
  }, [mounted, user?.email])


  // Calculate card spending and rewards from transactions
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const cardTransactions = mockStablecoinTransactions.filter(tx => 
    tx.type === 'spend' && 
    new Date(tx.date).getMonth() === currentMonth &&
    new Date(tx.date).getFullYear() === currentYear
  )
  
  const monthlyCardSpending = Math.abs(cardTransactions.reduce((total, tx) => total + tx.amount, 0))
  const monthlyRewards = monthlyCardSpending * 0.015 // 1.5% rewards rate
  
  const cardMetrics = {
    monthlySpending: monthlyCardSpending,
    monthlyRewards: monthlyRewards
  }

  // Calculate KYC status and tier information
  const kycMetrics = {
    currentTier: fullUserData?.kyc_tier || 0,
    status: fullUserData?.kyc_status || 'unverified',
    transactionLimit: fullUserData?.kyc_tier === 0 ? '$0' : 
                     fullUserData?.kyc_tier === 1 ? '$1,000' :
                     fullUserData?.kyc_tier === 2 ? '$10,000' : 'Unlimited'
  }
  // Don't render dynamic content during SSR/hydration
  if (!mounted || isLoading) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-64 bg-slate-200 rounded-3xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-slate-200 rounded-lg"></div>
              <div className="h-96 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }
  
  const recentTransactions = mockStablecoinTransactions.slice(0, 5)
  const totalYield = calculateTotalYield()
  const averageAPY = getWeightedAverageAPY()

  // Smart Wallet AI-powered insights rotation
  const aiInsights = [
    {
      title: "Gasless Transaction Savings",
      description: "You've saved $47.50 in gas fees this month with Smart Wallet",
      action: "View Report",
      type: "savings",
      icon: Zap
    },
    {
      title: "Smart Wallet Security",
      description: "Your wallet security score is excellent at 95/100",
      action: "View Details",
      type: "security",
      icon: Shield
    },
    {
      title: "Stablecoin Opportunity",
      description: "Enable auto-invest for USDC to earn 8.5% APY with zero gas",
      action: "Enable Now",
      type: "opportunity",
      icon: Coins
    },
    {
      title: "Account Abstraction",
      description: "Upgrade to batch transactions for better efficiency",
      action: "Learn More",
      type: "feature",
      icon: Sparkles
    }
  ]

  // Quick actions for services
  const quickActions = [
    {
      title: "Smart Wallet",
      description: "Gasless transactions & security",
      icon: Wallet,
      href: "/accounts/wallet",
      color: "bg-emerald-500",
      stats: "Zero gas fees",
      featured: true
    },
    {
      title: "Cross-Chain Bridge",
      description: "Move assets across chains",
      icon: Zap,
      href: "/accounts/bridge",
      color: "bg-cyan-500",
      stats: "CCTP Enabled",
      featured: true
    },
    {
      title: "Send Money",
      description: "Instant stablecoin transfers",
      icon: Send,
      href: "/accounts/send",
      color: "bg-blue-500",
      stats: "Fee: $0.10"
    },
    {
      title: "Earn Yield",
      description: "Auto-invest in best rates",
      icon: TrendingUp,
      href: "/invest/auto",
      color: "bg-green-500",
      stats: "Up to 12.5% APY"
    },
    {
      title: "Get Card",
      description: "Stablecoin debit card",
      icon: CreditCard,
      href: "/cards",
      color: "bg-purple-500",
      stats: "2% Cashback"
    },
    {
      title: "Swap Assets",
      description: "Best exchange rates",
      icon: ArrowLeftRight,
      href: "/swap",
      color: "bg-orange-500",
      stats: "0.1% Fee"
    }
  ]

  // Service highlights
  const serviceHighlights = [
    {
      title: "Smart Investing",
      description: "AI-powered portfolio management with tokenized assets",
      icon: BarChart3,
      href: "/invest",
      value: "+18.7%",
      label: "Avg. Returns",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Crypto Loans",
      description: "AI credit scoring with competitive rates",
      icon: DollarSign,
      href: "/loans",
      value: "5.9%",
      label: "Starting APR",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      title: "DeFi Insurance",
      description: "Comprehensive coverage with AI risk assessment",
      icon: Shield,
      href: "/insurance",
      value: "$2M+",
      label: "Protected",
      gradient: "from-purple-500 to-violet-600"
    },
    {
      title: "Business Suite",
      description: "Corporate treasury and cash management",
      icon: Building2,
      href: "/business/platform",
      value: "$17M+",
      label: "Assets",
      gradient: "from-indigo-500 to-blue-600"
    }
  ]

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Welcome Header with Hero Navigation */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-32 -translate-x-32" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold">
                    Welcome back, {user?.name?.split(' ')[0] || 'User'}
                  </h1>
                  {fullUserData?.accountType === 'premium' && (
                    <Badge className="bg-yellow-400/20 text-yellow-100 border-yellow-300/30">
                      <Star className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {fullUserData?.accountType === 'business' && (
                    <Badge className="bg-blue-400/20 text-blue-100 border-blue-300/30">
                      <Building2 className="h-3 w-3 mr-1" />
                      Business
                    </Badge>
                  )}
                </div>
                <p className="text-emerald-100 text-lg">
                  Experience the future of digital finance with USD Financial
                </p>
                <p className="text-emerald-200/80 text-sm mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/notifications">
                  <Button variant="outline" size="sm" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                    <Bell className="h-4 w-4 mr-2" />
                    2 Alerts
                  </Button>
                </Link>
                <Button 
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold"
                  onClick={() => window.location.href = '/accounts/wallet'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
              </div>
            </div>

            {/* Hero Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Smart Wallet Card */}
              <Link href="/accounts/wallet">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all">
                        <Wallet className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Smart Wallet</h3>
                        <p className="text-emerald-100">Gasless transactions & enhanced security</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-white">
                          {showBalance ? formatCurrency(parseFloat(totalUSDC || '0') || fullUserData?.balance || 0) : '••••••'}
                        </p>
                        <p className="text-emerald-200 text-sm">Total Balance • {networksWithBalance || 0} Networks</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Bridge Card */}
              <Link href="/accounts/bridge">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Cross-Chain Bridge</h3>
                        <p className="text-emerald-100">Seamlessly move assets across chains</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">CCTP Enabled</p>
                        <p className="text-emerald-200 text-sm">Circle Cross-Chain Transfer Protocol</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Send Money Card */}
              <Link href="/accounts/send">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all">
                        <Send className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Send Money</h3>
                        <p className="text-emerald-100">Instant stablecoin transfers globally</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">Zero Fees</p>
                        <p className="text-emerald-200 text-sm">Gasless transfers • 12s settlement</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Enhanced Action Cards - Matching Hero Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Cards Performance Card */}
              <Link href="/cards">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all">
                        <CreditCard className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Cards</h3>
                        <p className="text-emerald-100">Stablecoin spending & rewards tracking</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-white">
                          {formatCurrency(cardMetrics.monthlySpending)}
                        </p>
                        <p className="text-emerald-200 text-sm">This Month • +{formatCurrency(cardMetrics.monthlyRewards)} rewards</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* KYC Verification Card */}
              <Link href="/kyc">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">KYC Verification</h3>
                        <p className="text-emerald-100">Identity verification & compliance</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-white">
                          Tier {kycMetrics.currentTier}
                        </p>
                        <p className="text-emerald-200 text-sm">{kycMetrics.status} • {kycMetrics.transactionLimit} limit</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Multi-Chain Networks Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <CardContent className="p-6">
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all relative">
                        <Globe className="h-8 w-8 text-white" />
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-cyan-400 rounded-full animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Networks</h3>
                        <p className="text-emerald-100">Connected multi-chain ecosystems</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-white">
                          {networksWithBalance || multiChainBalances?.networks.length || 0}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-emerald-200 text-sm">Active Networks</p>
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-emerald-300 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="h-2 w-2 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                            <div className="h-2 w-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                            <div className="h-2 w-2 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs text-emerald-200 opacity-70">Real-time</div>
                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Portfolio Overview Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Portfolio Card */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border-emerald-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg font-semibold text-slate-900">Smart Wallet Portfolio</CardTitle>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Gasless
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-600">Stablecoin assets with zero gas fees</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/accounts/wallet">
                    <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50">
                      <Wallet className="h-3 w-3 mr-1" />
                      Wallet
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-slate-900">
                  {showBalance ? formatCurrency(parseFloat(totalUSDC || '0') || fullUserData?.balance || 0) : '••••••'}
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center text-sm font-medium ${portfolioChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +{formatCurrency(portfolioChange.amount)} ({portfolioChange.percentage}%)
                  </div>
                  <span className="text-xs text-slate-500">Last 24h</span>
                </div>
              </div>

              {/* Portfolio Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Multi-Chain Asset Allocation</h4>
                <div className="space-y-2">
                  {multiChainBalances?.networks && multiChainBalances.networks.length > 0 ? (
                    multiChainBalances.networks
                      .filter(network => network.usdc && parseFloat(network.usdc.balance) > 0)
                      .map((network) => (
                        <div key={network.network} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border text-sm">
                              {getNetworkIcon(network.network)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">USDC</p>
                              <p className="text-xs text-slate-500">{network.network}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {formatCurrency(parseFloat(network.usdc?.balance || '0'))}
                            </p>
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${network.isTestnet ? 'bg-orange-400' : 'bg-green-400'}`} />
                              <p className="text-xs text-slate-500">{network.isTestnet ? 'Testnet' : 'Mainnet'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    // Show message when no balances are available
                    <div className="text-center py-8 text-slate-500">
                      <Coins className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-medium">No assets detected</p>
                      <p className="text-xs mt-1">Connect your wallet or deposit stablecoins to get started</p>
                    </div>
                  )}
                </div>
                {multiChainBalances?.networks && multiChainBalances.networks.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Total Networks: {networksWithBalance || 0}</span>
                      <span>Last Updated: {multiChainBalances.lastUpdated.toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights & Quick Stats */}
          <div className="space-y-6">
            {/* AI Insight Card */}
            <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  <CardTitle className="text-lg text-violet-900">Smart Wallet Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {aiInsights.map((insight, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        activeInsight === index 
                          ? 'bg-white border-violet-300 shadow-sm' 
                          : 'bg-violet-50/50 border-violet-200 hover:bg-white'
                      }`}
                      onClick={() => setActiveInsight(index)}
                    >
                      <div className="flex items-start gap-3">
                        <insight.icon className="h-4 w-4 text-violet-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-violet-900">{insight.title}</p>
                          <p className="text-xs text-violet-700 mt-1">{insight.description}</p>
                          {activeInsight === index && (
                            <Button 
                              size="sm" 
                              className="mt-2 bg-violet-600 hover:bg-violet-700 text-xs h-6"
                              onClick={() => {
                                if (insight.type === 'savings') window.location.href = '/accounts/wallet'
                                else if (insight.type === 'security') window.location.href = '/accounts/abstract'
                                else if (insight.type === 'opportunity') window.location.href = '/invest/auto'
                                else if (insight.type === 'feature') window.location.href = '/accounts/abstract'
                              }}
                            >
                              {insight.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-slate-600">Yield Earned</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(totalYield)}</p>
                  <p className="text-xs text-slate-500">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-slate-600">Avg APY</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">Tier {kycMetrics.currentTier}</p>
                  <p className="text-xs text-slate-500">Weighted</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Cross-Chain Bridge Features */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Cross-Chain Bridge</h2>
              <p className="text-slate-600 mt-1">Move your assets seamlessly across different blockchains</p>
            </div>
            <Link href="/accounts/bridge">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                <Zap className="h-4 w-4 mr-2" />
                Launch Bridge
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CCTP Powered */}
            <Card className="border-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">CCTP Enabled</h3>
                    <p className="text-sm text-cyan-600 font-medium">Circle Cross-Chain Transfer Protocol</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Native USDC transfers across chains without wrapping or liquidity pools. Powered by Circle's official protocol.
                </p>
                <Badge className="bg-cyan-100 text-cyan-800 text-xs">Official Circle Protocol</Badge>
              </CardContent>
            </Card>

            {/* Multiple Networks */}
            <Card className="border-0 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500">
                    <ArrowLeftRight className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Multi-Network Support</h3>
                    <p className="text-sm text-purple-600 font-medium">5+ blockchain networks</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Bridge between Ethereum, Arbitrum, Optimism, Base, and Avalanche with more networks coming soon.
                </p>
                <Badge className="bg-purple-100 text-purple-800 text-xs">Growing Network</Badge>
              </CardContent>
            </Card>

            {/* Fast & Secure */}
            <Card className="border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Fast & Secure</h3>
                    <p className="text-sm text-green-600 font-medium">10-15 minute transfers</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Secure attestation-based transfers with typical completion times of 10-15 minutes across all networks.
                </p>
                <Badge className="bg-green-100 text-green-800 text-xs">Battle-Tested</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Smart Wallet Features Highlight */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Smart Wallet Features</h2>
              <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Next-Gen Technology
              </Badge>
            </div>
            <Link href="/accounts/wallet">
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                Explore Wallet <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gasless Transactions Card */}
            <Card className="border-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Gasless Transactions</h3>
                    <p className="text-sm text-emerald-600 font-medium">Zero gas fees</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Send stablecoins without paying gas fees. USD Financial covers transaction costs through Account Abstraction technology.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Powered by Account Kit</span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">Active</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Security Card */}
            <Card className="border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Enhanced Security</h3>
                    <p className="text-sm text-blue-600 font-medium">Smart contract protection</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Advanced security features including social recovery, spending limits, and multi-factor authentication for your peace of mind.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Military-grade encryption</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">Protected</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stablecoin Optimized Card */}
            <Card className="border-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Stablecoin Optimized</h3>
                    <p className="text-sm text-violet-600 font-medium">USD Financial focus</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Purpose-built for stablecoin transactions with optimized fees, instant settlements, and seamless DeFi integration.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">USDC • Multi-Chain</span>
                  <Badge className="bg-violet-100 text-violet-800 text-xs">Optimized</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Quick Actions</h2>
              <p className="text-slate-600 mt-1">Access your most-used features instantly</p>
            </div>
            <Link href="/accounts/wallet">
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Featured Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {quickActions.filter(action => action.featured).map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-slate-50 group overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${action.color.replace('bg-', 'from-')} to-${action.color.replace('bg-', '').replace('500', '600')}`} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-r ${action.color.replace('bg-', 'from-')} to-${action.color.replace('bg-', '').replace('500', '600')} group-hover:shadow-lg transition-all`}>
                        <action.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{action.title}</h3>
                        <p className="text-slate-600">{action.description}</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={`${action.color.replace('bg-', 'bg-').replace('500', '100')} ${action.color.replace('bg-', 'text-').replace('500', '800')} border-0`}>
                        {action.stats}
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">Tap to explore</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Regular Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.filter(action => !action.featured).map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-emerald-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${action.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                        <action.icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{action.title}</h3>
                        <p className="text-xs text-slate-600 truncate">{action.description}</p>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-emerald-600">{action.stats}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Service Highlights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">USD Financial Services</h2>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceHighlights.map((service) => (
              <Link key={service.title} href={service.href}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border-0">
                  <div className={`h-1 bg-gradient-to-r ${service.gradient}`} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${service.gradient} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                        <service.icon className="h-6 w-6 text-white" style={{
                          filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'
                        }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{service.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-lg font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}>
                          {service.value}
                        </p>
                        <p className="text-xs text-slate-500">{service.label}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity & Market Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    {getTransactionTypeIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900">{transaction.description}</p>
                    <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      transaction.type === 'deposit' || transaction.type === 'yield' 
                        ? 'text-green-600' 
                        : 'text-slate-900'
                    }`}>
                      {transaction.type === 'deposit' || transaction.type === 'yield' ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stablecoin Market Data */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Coins className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">USDC Market Cap</p>
                      <p className="text-xs text-blue-700">Circle USD Coin</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-900">$32.8B</p>
                    <p className="text-xs text-green-600">+0.12%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">USDC Trading Volume</p>
                      <p className="text-xs text-green-700">24h Volume</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-900">$4.8B</p>
                    <p className="text-xs text-green-600">+2.1%</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm text-purple-900">Best Yield Opportunities</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-700">Compound USDC</span>
                      <span className="font-semibold text-purple-900">8.5% APY</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-700">Yearn USDC</span>
                      <span className="font-semibold text-purple-900">7.2% APY</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Footer */}
        <Card className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 border-0 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">Experience Next-Generation Finance</h3>
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    USD Financial
                  </Badge>
                </div>
                <p className="text-emerald-100 max-w-2xl">
                  Unlock the power of gasless Smart Wallet transactions and seamless cross-chain bridging. 
                  Experience the future of stablecoin management with AI-powered insights and zero gas fees.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/accounts/wallet">
                  <Button variant="secondary" className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold">
                    <Wallet className="h-4 w-4 mr-2" />
                    Smart Wallet
                  </Button>
                </Link>
                <Link href="/accounts/bridge">
                  <Button variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-emerald-600 font-semibold backdrop-blur-sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Bridge Assets
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}