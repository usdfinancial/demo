'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Activity, Users, ArrowUpRight, ArrowDownRight, Loader2, Bell, Shield, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/data'
import { useAuth } from '@/hooks/useAuth'
import type { UserDashboardData } from '@/lib/services/userService'
import type { TransactionWithDetails } from '@/lib/services/transactionService'

interface DashboardProps {
  className?: string
}

export function DatabaseDashboard({ className = '' }: DashboardProps) {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.address) return

      try {
        setLoading(true)
        setError(null)

        // Load dashboard data
        const [dashboardResponse, transactionsResponse] = await Promise.all([
          fetch(`/api/user?userId=${user.address}&action=dashboard`),
          fetch(`/api/transactions?userId=${user.address}&action=recent&limit=5`)
        ])

        if (!dashboardResponse.ok || !transactionsResponse.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const [dashboard, transactions] = await Promise.all([
          dashboardResponse.json(),
          transactionsResponse.json()
        ])

        setDashboardData(dashboard)
        setRecentTransactions(transactions)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.address])

  if (loading) {
    return (
      <div className={`min-h-96 flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className={`min-h-96 flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-semibold">Error loading dashboard</div>
          <p className="text-slate-600">{error || 'No data available'}</p>
          <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
            Reload Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-green-600" />
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'yield':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />
      case 'bridge':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />
      default:
        return <Activity className="w-4 h-4 text-slate-600" />
    }
  }

  const getBalancePercentage = (chainBalance: string, total: string) => {
    const balance = parseFloat(chainBalance)
    const totalBalance = parseFloat(total)
    return totalBalance > 0 ? (balance / totalBalance) * 100 : 0
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Welcome back, {dashboardData.user.first_name || 'User'}!
            </h2>
            <p className="text-slate-600 mt-1">
              Here's what's happening with your portfolio today
            </p>
          </div>
          {dashboardData.notifications.filter(n => !n.isRead).length > 0 && (
            <Badge className="bg-red-100 text-red-800">
              <Bell className="w-4 h-4 mr-1" />
              {dashboardData.notifications.filter(n => !n.isRead).length} new
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(dashboardData.totalBalance))}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {dashboardData.balanceByChain.length} networks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(dashboardData.portfolioSummary.totalValue))}
            </div>
            <p className={`text-xs ${
              dashboardData.portfolioSummary.pnlPercentage >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {dashboardData.portfolioSummary.pnlPercentage >= 0 ? '+' : ''}
              {dashboardData.portfolioSummary.pnlPercentage.toFixed(2)}% PnL
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(dashboardData.portfolioSummary.totalInvested))}
            </div>
            <p className="text-xs text-muted-foreground">
              Active investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              parseFloat(dashboardData.portfolioSummary.pnl) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {parseFloat(dashboardData.portfolioSummary.pnl) >= 0 ? '+' : ''}
              {formatCurrency(parseFloat(dashboardData.portfolioSummary.pnl))}
            </div>
            <p className="text-xs text-muted-foreground">
              Unrealized gains/losses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Balance by Network</CardTitle>
            <CardDescription>Your stablecoin distribution across chains</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.balanceByChain.map((item) => (
              <div key={`${item.chainId}-${item.stablecoin}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium">{item.chainName}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.stablecoin}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(parseFloat(item.balance))}
                  </span>
                </div>
                <Progress 
                  value={getBalancePercentage(item.balance, dashboardData.totalBalance)} 
                  className="h-2"
                />
              </div>
            ))}
            {dashboardData.balanceByChain.length === 0 && (
              <div className="text-center py-6 text-slate-500">
                <p>No balances found</p>
                <p className="text-sm">Start by depositing some stablecoins</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest transactions and investments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  {getTransactionIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  {activity.amount && (
                    <div className="text-sm font-semibold text-right">
                      {formatCurrency(parseFloat(activity.amount))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p>No recent activity</p>
                <p className="text-sm">Start investing to see your activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Transactions</CardTitle>
            <CardDescription>Your most recent blockchain transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <p className="text-sm font-medium">
                        {tx.description || `${tx.transaction_type} transaction`}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>{tx.networkName}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(tx.created_at)}</span>
                        <Badge 
                          className={`text-xs ${
                            tx.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(parseFloat(tx.amount))} {tx.stablecoin}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {dashboardData.notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Important updates and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.notifications.slice(0, 5).map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 rounded-lg border ${
                  notification.isRead 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      notification.isRead ? 'text-slate-700' : 'text-blue-900'
                    }`}>
                      {notification.title}
                    </p>
                    <p className={`text-sm mt-1 ${
                      notification.isRead ? 'text-slate-600' : 'text-blue-700'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full ml-3 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}