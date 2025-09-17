'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Building2, DollarSign, TrendingUp, Users, Brain, Target, BarChart3, Shield, Zap, Clock, Activity, PieChart, ArrowUpDown, Settings, Bell, ChevronDown, Plus, Eye, FileText, Calculator, Globe, CreditCard, AlertTriangle, CheckCircle2, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

interface CorporateAccount {
  id: string
  name: string
  type: 'operating' | 'treasury' | 'payroll' | 'reserve'
  balance: number
  currency: StablecoinSymbol
  yield: number
  lastActivity: string
  riskScore: number
}

interface AIInsight {
  id: string
  type: 'optimization' | 'risk' | 'opportunity' | 'alert'
  title: string
  description: string
  impact: number
  confidence: number
  actionable: boolean
  category: string
}

interface CashFlowPrediction {
  date: string
  inflow: number
  outflow: number
  netFlow: number
  balance: number
  confidence: number
}

interface ExpenseCategory {
  category: string
  amount: number
  budget: number
  variance: number
  transactions: number
  avgTransaction: number
}

const corporateAccounts: CorporateAccount[] = [
  {
    id: '1',
    name: 'Operating Account',
    type: 'operating',
    balance: 2500000,
    currency: 'USDC',
    yield: 4.2,
    lastActivity: '2024-01-20T10:30:00Z',
    riskScore: 95
  },
  {
    id: '2',
    name: 'Treasury Reserve',
    type: 'treasury',
    balance: 8750000,
    currency: 'USDC',
    yield: 5.8,
    lastActivity: '2024-01-20T09:15:00Z',
    riskScore: 98
  },
  {
    id: '3',
    name: 'Payroll Account',
    type: 'payroll',
    balance: 850000,
    currency: 'USDC',
    yield: 3.5,
    lastActivity: '2024-01-20T08:00:00Z',
    riskScore: 92
  },
  {
    id: '4',
    name: 'Emergency Reserve',
    type: 'reserve',
    balance: 5000000,
    currency: 'USDT',
    yield: 4.8,
    lastActivity: '2024-01-19T16:45:00Z',
    riskScore: 97
  }
]

const aiInsights: AIInsight[] = [
  {
    id: '1',
    type: 'optimization',
    title: 'Treasury Yield Optimization',
    description: 'AI suggests reallocating $2M from operating to high-yield treasury for +1.2% APY',
    impact: 24000,
    confidence: 94,
    actionable: true,
    category: 'Treasury Management'
  },
  {
    id: '2',
    type: 'alert',
    title: 'Unusual Expense Pattern',
    description: 'Marketing spend increased 45% this month - potential budget overrun detected',
    impact: -85000,
    confidence: 87,
    actionable: true,
    category: 'Expense Management'
  },
  {
    id: '3',
    type: 'opportunity',
    title: 'Vendor Payment Optimization',
    description: 'Switch to early payment discounts could save $15K monthly',
    impact: 180000,
    confidence: 91,
    actionable: true,
    category: 'Cash Flow'
  }
]

const expenseCategories: ExpenseCategory[] = [
  { category: 'Payroll', amount: 450000, budget: 440000, variance: 2.3, transactions: 156, avgTransaction: 2885 },
  { category: 'Marketing', amount: 125000, budget: 100000, variance: 25.0, transactions: 45, avgTransaction: 2778 },
  { category: 'Operations', amount: 89000, budget: 95000, variance: -6.3, transactions: 234, avgTransaction: 380 },
  { category: 'Technology', amount: 78000, budget: 75000, variance: 4.0, transactions: 28, avgTransaction: 2786 },
  { category: 'Travel', amount: 32000, budget: 40000, variance: -20.0, transactions: 67, avgTransaction: 478 }
]

export default function BusinessPlatformPage() {
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount>(corporateAccounts[0])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<AIInsight[]>(aiInsights)
  const [cashFlowPeriod, setCashFlowPeriod] = useState('30')
  const [autoRebalancing, setAutoRebalancing] = useState(true)
  const [expenseFilter, setExpenseFilter] = useState('all')

  const totalBalance = corporateAccounts.reduce((sum, account) => sum + account.balance, 0)
  const weightedYield = corporateAccounts.reduce((sum, account) => sum + (account.balance * account.yield), 0) / totalBalance
  const avgRiskScore = corporateAccounts.reduce((sum, account) => sum + account.riskScore, 0) / corporateAccounts.length

  const generateCashFlowPrediction = (): CashFlowPrediction[] => {
    const predictions: CashFlowPrediction[] = []
    let currentBalance = totalBalance
    
    for (let i = 0; i < parseInt(cashFlowPeriod); i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      const baseInflow = 150000 + Math.random() * 50000
      const baseOutflow = 120000 + Math.random() * 40000
      const netFlow = baseInflow - baseOutflow
      currentBalance += netFlow
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        inflow: baseInflow,
        outflow: baseOutflow,
        netFlow,
        balance: currentBalance,
        confidence: 85 + Math.random() * 10
      })
    }
    
    return predictions
  }

  const performAIAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newInsight: AIInsight = {
        id: Date.now().toString(),
        type: 'optimization',
        title: 'AI Cash Flow Optimization',
        description: `Based on current patterns, we recommend adjusting ${selectedAccount.name} allocation for optimal yield`,
        impact: Math.floor(Math.random() * 50000) + 10000,
        confidence: Math.floor(Math.random() * 20) + 80,
        actionable: true,
        category: 'AI Recommendation'
      }
      
      setAiRecommendations(prev => [newInsight, ...prev])
      alert('AI analysis complete! New recommendations available.')
    } catch (error) {
      console.error('AI Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleQuickAction = (action: string, id?: string) => {
    switch (action) {
      case 'rebalance':
        alert('Initiating AI-powered portfolio rebalancing...')
        break
      case 'optimize-yield':
        alert('Optimizing yield allocation across accounts...')
        break
      case 'generate-report':
        alert('Generating comprehensive financial report...')
        break
      case 'setup-alert':
        alert('Setting up AI-powered financial alerts...')
        break
      case 'view-insight':
        alert(`Viewing detailed insight: ${id}`)
        break
      case 'implement-suggestion':
        alert(`Implementing AI suggestion: ${id}`)
        break
      default:
        break
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'operating': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'treasury': return 'bg-green-100 text-green-800 border-green-200'
      case 'payroll': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'reserve': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'bg-green-100 text-green-800 border-green-200'
      case 'alert': return 'bg-red-100 text-red-800 border-red-200'
      case 'opportunity': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'risk': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Business Platform Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">USD Financial Business</h1>
                  <p className="text-blue-200 mt-1">AI-Powered Corporate Treasury Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-blue-300 text-blue-100 hover:bg-blue-800">
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <Button variant="outline" className="border-blue-300 text-blue-100 hover:bg-blue-800">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-semibold">TC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics Dashboard */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Total Corporate Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalBalance)}</div>
              <p className="text-sm text-muted-foreground">Across all accounts</p>
              <div className="mt-2">
                <Progress value={85} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">85% of target liquidity</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-white to-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Weighted Yield
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{weightedYield.toFixed(2)}%</div>
              <p className="text-sm text-muted-foreground">Average APY</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+0.3% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                AI Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{Math.floor(avgRiskScore)}/100</div>
              <p className="text-sm text-muted-foreground">Portfolio health</p>
              <Badge className="bg-green-100 text-green-800 text-xs mt-2">
                Excellent
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" />
                Monthly Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{formatCurrency(127500)}</div>
              <p className="text-sm text-muted-foreground">AI optimization</p>
              <div className="flex items-center gap-1 mt-2">
                <Target className="h-3 w-3 text-indigo-600" />
                <span className="text-xs text-indigo-600">Target: {formatCurrency(150000)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Business Platform Interface */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Corporate Treasury Command Center
                </CardTitle>
                <CardDescription>
                  AI-powered financial management and real-time business intelligence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-7 text-xs">
                    <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
                    <TabsTrigger value="accounts" className="text-xs">Accounts</TabsTrigger>
                    <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
                    <TabsTrigger value="expenses" className="text-xs">Expenses</TabsTrigger>
                    <TabsTrigger value="cashflow" className="text-xs">Cash Flow</TabsTrigger>
                    <TabsTrigger value="payroll" className="text-xs">Payroll</TabsTrigger>
                    <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dashboard" className="space-y-6 mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="p-4">
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Account Distribution
                        </h4>
                        <div className="space-y-3">
                          {corporateAccounts.map((account) => (
                            <div key={account.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded ${
                                  account.type === 'operating' ? 'bg-blue-500' :
                                  account.type === 'treasury' ? 'bg-green-500' :
                                  account.type === 'payroll' ? 'bg-purple-500' : 'bg-orange-500'
                                }`} />
                                <span className="text-sm font-medium">{account.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">{formatCurrency(account.balance)}</div>
                                <div className="text-xs text-muted-foreground">{account.yield}% APY</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-green-600" />
                          Recent Activities
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-2 bg-green-50 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Yield optimization executed</p>
                              <p className="text-xs text-muted-foreground">+$12,500 monthly improvement</p>
                            </div>
                            <span className="text-xs text-muted-foreground">2m ago</span>
                          </div>
                          <div className="flex items-start gap-3 p-2 bg-blue-50 rounded-lg">
                            <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Payroll batch processed</p>
                              <p className="text-xs text-muted-foreground">156 employees paid</p>
                            </div>
                            <span className="text-xs text-muted-foreground">1h ago</span>
                          </div>
                          <div className="flex items-start gap-3 p-2 bg-purple-50 rounded-lg">
                            <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">AI risk assessment updated</p>
                              <p className="text-xs text-muted-foreground">Portfolio score: 95/100</p>
                            </div>
                            <span className="text-xs text-muted-foreground">3h ago</span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">Quick Actions</h4>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={autoRebalancing} 
                          onCheckedChange={setAutoRebalancing}
                          id="auto-rebalancing"
                        />
                        <label htmlFor="auto-rebalancing" className="text-sm font-medium">
                          Auto-Rebalancing
                        </label>
                      </div>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <Button 
                        className="h-16 flex-col gap-1 bg-gradient-to-r from-blue-500 to-blue-600"
                        onClick={() => handleQuickAction('rebalance')}
                      >
                        <Target className="h-5 w-5" />
                        <span className="text-sm">Rebalance Portfolio</span>
                      </Button>
                      <Button 
                        variant="outline"
                        className="h-16 flex-col gap-1 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleQuickAction('optimize-yield')}
                      >
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-sm">Optimize Yield</span>
                      </Button>
                      <Button 
                        variant="outline"
                        className="h-16 flex-col gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => handleQuickAction('generate-report')}
                      >
                        <FileText className="h-5 w-5" />
                        <span className="text-sm">Generate Report</span>
                      </Button>
                      <Button 
                        variant="outline"
                        className="h-16 flex-col gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                        onClick={() => handleQuickAction('setup-alert')}
                      >
                        <Bell className="h-5 w-5" />
                        <span className="text-sm">Setup Alerts</span>
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="accounts" className="space-y-4 mt-6">
                    {corporateAccounts.map((account) => (
                      <div 
                        key={account.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedAccount.id === account.id 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                        onClick={() => setSelectedAccount(account)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                              <DollarSign className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{account.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {account.currency} • Last activity: {new Date(account.lastActivity).toLocaleDateString()}
                              </p>
                              <Badge className={getAccountTypeColor(account.type)}>
                                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(account.balance)}</div>
                            <div className="text-sm text-green-600 font-medium">{account.yield}% APY</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Shield className="h-3 w-3 text-emerald-600" />
                              <span className="text-xs text-emerald-600">Risk Score: {account.riskScore}/100</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Monthly Yield:</span>
                            <div className="font-medium text-green-600">
                              +{formatCurrency(account.balance * account.yield / 100 / 12)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Utilization:</span>
                            <div className="font-medium">
                              {account.type === 'operating' ? '78%' : 
                               account.type === 'treasury' ? '45%' : 
                               account.type === 'payroll' ? '92%' : '25%'}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="font-medium text-green-600">Active</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-6 mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">Financial Analytics</h4>
                      <Button 
                        onClick={performAIAnalysis}
                        disabled={isAnalyzing}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="p-4">
                        <h5 className="font-medium mb-3">Yield Performance</h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Current Month</span>
                            <span className="font-semibold text-green-600">+{formatCurrency(45780)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Previous Month</span>
                            <span className="font-semibold">+{formatCurrency(42150)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">YTD Total</span>
                            <span className="font-semibold text-blue-600">+{formatCurrency(487230)}</span>
                          </div>
                          <Progress value={78} className="mt-2" />
                          <p className="text-xs text-muted-foreground">78% of annual target</p>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h5 className="font-medium mb-3">Risk Analysis</h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Portfolio Risk</span>
                            <Badge className="bg-green-100 text-green-800">Low</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Diversification</span>
                            <Badge className="bg-blue-100 text-blue-800">Optimal</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Liquidity Ratio</span>
                            <span className="font-semibold">2.4x</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Coverage Ratio</span>
                            <span className="font-semibold text-green-600">8.2x</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="expenses" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">Expense Management</h4>
                      <div className="flex items-center gap-2">
                        <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="over-budget">Over Budget</SelectItem>
                            <SelectItem value="under-budget">Under Budget</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-1" />
                          Filter
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {expenseCategories.map((expense, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium">{expense.category}</h5>
                              <p className="text-sm text-muted-foreground">
                                {expense.transactions} transactions • Avg: {formatCurrency(expense.avgTransaction)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{formatCurrency(expense.amount)}</div>
                              <div className={`text-sm font-medium ${
                                expense.variance > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {expense.variance > 0 ? '+' : ''}{expense.variance.toFixed(1)}% vs budget
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Budget: {formatCurrency(expense.budget)}</span>
                              <span>Remaining: {formatCurrency(expense.budget - expense.amount)}</span>
                            </div>
                            <Progress 
                              value={(expense.amount / expense.budget) * 100} 
                              className={`h-2 ${expense.variance > 0 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="cashflow" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">Cash Flow Forecasting</h4>
                      <Select value={cashFlowPeriod} onValueChange={setCashFlowPeriod}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Card className="p-4">
                      <h5 className="font-medium mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        Projected Cash Flow ({cashFlowPeriod} days)
                      </h5>
                      <div className="space-y-2">
                        {generateCashFlowPrediction().slice(0, 5).map((prediction, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-sm font-medium">{prediction.date}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">+{formatCurrency(prediction.inflow)}</span>
                              <span className="text-red-600">-{formatCurrency(prediction.outflow)}</span>
                              <span className={`font-medium ${prediction.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {prediction.netFlow >= 0 ? '+' : ''}{formatCurrency(prediction.netFlow)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {prediction.confidence.toFixed(0)}% confidence
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="payroll" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">Payroll Management</h4>
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500">
                        <Plus className="h-4 w-4 mr-2" />
                        Run Payroll
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center gap-3 mb-3">
                          <Users className="h-8 w-8 text-green-600" />
                          <div>
                            <h5 className="font-semibold text-green-900">Active Employees</h5>
                            <p className="text-2xl font-bold text-green-600">156</p>
                          </div>
                        </div>
                        <div className="text-sm text-green-700">
                          <div className="flex justify-between mb-1">
                            <span>Full-time:</span>
                            <span className="font-medium">142</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Contractors:</span>
                            <span className="font-medium">14</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <div className="flex items-center gap-3 mb-3">
                          <DollarSign className="h-8 w-8 text-blue-600" />
                          <div>
                            <h5 className="font-semibold text-blue-900">Monthly Payroll</h5>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(847500)}</p>
                          </div>
                        </div>
                        <div className="text-sm text-blue-700">
                          <div className="flex justify-between mb-1">
                            <span>Base Salaries:</span>
                            <span className="font-medium">{formatCurrency(685000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Benefits:</span>
                            <span className="font-medium">{formatCurrency(162500)}</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-center gap-3 mb-3">
                          <Clock className="h-8 w-8 text-purple-600" />
                          <div>
                            <h5 className="font-semibold text-purple-900">Next Payroll</h5>
                            <p className="text-xl font-bold text-purple-600">Jan 31</p>
                          </div>
                        </div>
                        <div className="text-sm text-purple-700">
                          <div className="flex justify-between mb-1">
                            <span>Status:</span>
                            <span className="font-medium">Scheduled</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing:</span>
                            <span className="font-medium">Auto</span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className="p-4">
                      <h5 className="font-medium mb-4 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        AI Payroll Insights
                      </h5>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h6 className="font-medium text-green-800 mb-1">Cost Optimization</h6>
                          <p className="text-sm text-green-700">
                            AI suggests switching 12 contractors to full-time could save $23K monthly in benefits optimization.
                          </p>
                          <Button size="sm" variant="outline" className="mt-2 border-green-300 text-green-700">
                            View Analysis
                          </Button>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h6 className="font-medium text-blue-800 mb-1">Compliance Check</h6>
                          <p className="text-sm text-blue-700">
                            All payroll taxes and filings are up to date. Next quarterly filing due March 15.
                          </p>
                          <Button size="sm" variant="outline" className="mt-2 border-blue-300 text-blue-700">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <div className="space-y-3">
                      <h5 className="font-medium">Recent Payroll Runs</h5>
                      {[
                        { date: '2024-01-15', amount: 847500, employees: 156, status: 'completed' },
                        { date: '2023-12-31', amount: 892300, employees: 158, status: 'completed' },
                        { date: '2023-12-15', amount: 847500, employees: 158, status: 'completed' }
                      ].map((payroll, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">Payroll - {payroll.date}</p>
                                <p className="text-sm text-muted-foreground">{payroll.employees} employees processed</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(payroll.amount)}</p>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="compliance" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">Compliance & Regulatory</h4>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="p-4">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          Compliance Status
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">AML/KYC Status</span>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Compliant</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">SOX Compliance</span>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Current</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Tax Filings</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm text-yellow-600">Due March 15</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Audit Trail</span>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Complete</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-600" />
                          AI Compliance Monitoring
                        </h5>
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800 text-sm">Transaction Monitoring</span>
                            </div>
                            <p className="text-xs text-green-700">All transactions within normal patterns. No suspicious activity detected.</p>
                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-800 text-sm">Regulatory Updates</span>
                            </div>
                            <p className="text-xs text-blue-700">3 new regulations monitored. No action required for current operations.</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className="p-4">
                      <h5 className="font-medium mb-4">Upcoming Compliance Tasks</h5>
                      <div className="space-y-2">
                        {[
                          { task: 'Quarterly Tax Filing', due: '2024-03-15', priority: 'high', status: 'pending' },
                          { task: 'AML Review Update', due: '2024-02-01', priority: 'medium', status: 'in-progress' },
                          { task: 'SOX Documentation', due: '2024-04-30', priority: 'low', status: 'scheduled' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                item.priority === 'high' ? 'bg-red-500' :
                                item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <div>
                                <p className="font-medium text-sm">{item.task}</p>
                                <p className="text-xs text-muted-foreground">Due: {item.due}</p>
                              </div>
                            </div>
                            <Badge className={`text-xs ${
                              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  AI Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiRecommendations.slice(0, 4).map((insight) => (
                  <div key={insight.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getInsightTypeColor(insight.type)}>
                        {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{insight.confidence}% confidence</span>
                    </div>
                    <h6 className="font-medium text-sm mb-1">{insight.title}</h6>
                    <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${
                        insight.impact > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insight.impact > 0 ? '+' : ''}{formatCurrency(Math.abs(insight.impact))} impact
                      </span>
                      {insight.actionable && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-xs"
                          onClick={() => handleQuickAction('implement-suggestion', insight.id)}
                        >
                          Implement
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleQuickAction('view-insight', 'all')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View All Insights
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Engine</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Treasury Sync</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Risk Monitoring</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">Monitoring</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Compliance</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">Compliant</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  )
}