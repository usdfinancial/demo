import { TrendingUp, Shield, DollarSign, BarChart3, Target, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { protocolsData, formatCurrency } from '@/lib/data'

export default function EarnPage() {
  const portfolioValue = 12847.62
  const totalReturn = 1247.62
  const returnPercentage = 10.8

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'High':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Invest & Earn</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Portfolio
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
            <p className="text-xs text-muted-foreground">Total investments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalReturn)}</div>
            <p className="text-xs text-muted-foreground">+{returnPercentage}% all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Return</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(127.84)}</div>
            <p className="text-xs text-muted-foreground">+1.2% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73%</div>
            <p className="text-xs text-muted-foreground">Emergency fund</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            Personalized Investment Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered suggestions based on your financial profile and goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Diversify with Technology ETF</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Based on your risk profile, consider allocating 15% to technology sector growth. 
                    Expected return: 12-15% annually.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>
                    <Badge variant="outline">High Growth</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Increase Bond Allocation</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your portfolio could benefit from more stability. Consider bonds for 25% allocation 
                    to balance risk while maintaining growth.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-100 text-green-800">Stability</Badge>
                    <Badge variant="outline">Low Risk</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Options */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Options</CardTitle>
          <CardDescription>
            Curated investment opportunities tailored to your goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {protocolsData.map((protocol) => (
              <div key={protocol.id} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{protocol.name}</h3>
                    <p className="text-sm text-muted-foreground">{protocol.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{protocol.apy}%</div>
                    <div className="text-sm text-muted-foreground">Current APY</div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{protocol.description}</p>
                
                <div className="flex items-center justify-between">
                  <Badge className={getRiskColor(protocol.riskLevel)}>
                    {protocol.riskLevel} Risk
                  </Badge>
                  <Button size="sm">
                    Deposit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Investment Tools */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mr-4">
              <Target className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">Goal Planner</h3>
              <p className="text-sm text-muted-foreground">Plan your financial goals</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mr-4">
              <BarChart3 className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Risk Analyzer</h3>
              <p className="text-sm text-muted-foreground">Assess your risk tolerance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mr-4">
              <Clock className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <h3 className="font-semibold">Auto Invest</h3>
              <p className="text-sm text-muted-foreground">Set up recurring investments</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}