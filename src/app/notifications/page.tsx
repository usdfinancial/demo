'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Filter,
  Search,
  Settings,
  AlertTriangle,
  TrendingUp,
  Shield,
  CreditCard,
  Send,
  ArrowUpRight,
  Globe,
  Zap,
  Star,
  Clock,
  Eye,
  Trash2,
  MoreVertical,
  ChevronRight,
  Banknote,
  Users,
  Building2,
  AlertCircle,
  Info,
  Calendar,
  Target,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { formatCurrency } from '@/lib/data'

interface Notification {
  id: string
  title: string
  message: string
  type: 'security' | 'transaction' | 'market' | 'system' | 'promotional' | 'regulatory'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  isRead: boolean
  timestamp: string
  actionUrl?: string
  metadata?: {
    amount?: number
    currency?: string
    location?: string
    transactionId?: string
    complianceLevel?: string
    riskScore?: number
  }
}

// Mock notifications data with global fintech characteristics
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Cross-Border Transaction Completed',
    message: 'Your USDC transfer to Singapore has been successfully processed via CCTP protocol.',
    type: 'transaction',
    priority: 'normal',
    isRead: false,
    timestamp: '2024-01-20T10:30:00Z',
    metadata: {
      amount: 2500,
      currency: 'USDC',
      location: 'Singapore',
      transactionId: 'cctp_sg_001'
    }
  },
  {
    id: '2',
    title: 'Security Alert: New Device Login',
    message: 'New login detected from London, UK. If this wasn\'t you, please secure your account immediately.',
    type: 'security',
    priority: 'high',
    isRead: false,
    timestamp: '2024-01-20T09:15:00Z',
    metadata: {
      location: 'London, UK'
    }
  },
  {
    id: '3',
    title: 'Regulatory Compliance Update',
    message: 'New EU MiCA regulations require additional verification for transactions over €10,000.',
    type: 'regulatory',
    priority: 'high',
    isRead: false,
    timestamp: '2024-01-20T08:45:00Z',
    metadata: {
      complianceLevel: 'EU MiCA'
    }
  },
  {
    id: '4',
    title: 'Global Market Update',
    message: 'USDC yield opportunities increased to 8.5% APY across multiple DeFi protocols.',
    type: 'market',
    priority: 'normal',
    isRead: true,
    timestamp: '2024-01-20T08:00:00Z'
  },
  {
    id: '5',
    title: 'Smart Contract Risk Assessment',
    message: 'Your Compound USDC position risk score improved to 95/100 following recent protocol upgrades.',
    type: 'system',
    priority: 'low',
    isRead: true,
    timestamp: '2024-01-19T16:30:00Z',
    metadata: {
      riskScore: 95
    }
  },
  {
    id: '6',
    title: 'Multi-Chain Bridge Available',
    message: 'New cross-chain bridge now supports Base network. Transfer USDC with 15-second settlement.',
    type: 'promotional',
    priority: 'normal',
    isRead: true,
    timestamp: '2024-01-19T14:20:00Z'
  },
  {
    id: '7',
    title: 'KYC Verification Required',
    message: 'Enhanced due diligence required for continued access to institutional trading features.',
    type: 'regulatory',
    priority: 'urgent',
    isRead: false,
    timestamp: '2024-01-19T12:00:00Z'
  },
  {
    id: '8',
    title: 'Gasless Transaction Savings',
    message: 'You\'ve saved $47.50 in gas fees this month through Account Abstraction technology.',
    type: 'system',
    priority: 'low',
    isRead: true,
    timestamp: '2024-01-19T10:15:00Z',
    metadata: {
      amount: 47.50,
      currency: 'USD'
    }
  }
]

export default function NotificationsPage() {
  const { user } = useEnhancedAuth()
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'security' | 'transaction' | 'market' | 'regulatory'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  // Filter notifications based on current filter and search term
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      (filter !== 'all' && filter !== 'unread' && notification.type === filter)
    
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const urgentCount = notifications.filter(n => n.priority === 'urgent').length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'security':
        return <Shield className={`h-5 w-5 ${priority === 'urgent' || priority === 'high' ? 'text-red-500' : 'text-blue-500'}`} />
      case 'transaction':
        return <Send className="h-5 w-5 text-green-500" />
      case 'market':
        return <TrendingUp className="h-5 w-5 text-purple-500" />
      case 'regulatory':
        return <Building2 className={`h-5 w-5 ${priority === 'urgent' || priority === 'high' ? 'text-orange-500' : 'text-blue-500'}`} />
      case 'promotional':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'system':
        return <Zap className="h-5 w-5 text-emerald-500" />
      default:
        return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'normal': return 'border-l-blue-500 bg-blue-50'
      case 'low': return 'border-l-slate-500 bg-slate-50'
      default: return 'border-l-slate-500 bg-slate-50'
    }
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

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header - Matching Profile/Settings Pattern */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl border border-indigo-100 p-6 mb-8">
          <div className="absolute inset-0 bg-grid-slate-100 opacity-30"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                </div>
                <p className="text-slate-600 text-lg">Stay informed about your financial activities and account security</p>
                <div className="flex items-center gap-6 mt-3 text-sm text-indigo-700">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Multi-region alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Security monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Real-time updates</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/notifications/settings">
                  <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Cards - Improved Proportions */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-indigo-200/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 font-medium">
                  <Bell className="h-4 w-4 text-indigo-600" />
                  Total Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">{notifications.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-200/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 text-indigo-600" />
                  Unread
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-200/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 text-indigo-600" />
                  Urgent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
                <p className="text-xs text-muted-foreground">High priority</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-200/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 font-medium">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">190+</div>
                <p className="text-xs text-muted-foreground">Countries monitored</p>
              </CardContent>
            </Card>
          </div>

          {/* Improved Filters and Search */}
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="p-1.5 bg-indigo-100 rounded-md">
                      <Filter className="h-4 w-4 text-indigo-600" />
                    </div>
                    Filter & Search
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    Organize your notifications by type and priority
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 border-indigo-200 focus:border-indigo-400"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', icon: Bell },
                  { key: 'unread', label: 'Unread', icon: AlertCircle },
                  { key: 'security', label: 'Security', icon: Shield },
                  { key: 'transaction', label: 'Transactions', icon: Send },
                  { key: 'market', label: 'Market', icon: TrendingUp },
                  { key: 'regulatory', label: 'Regulatory', icon: Building2 }
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={filter === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(key as any)}
                    className={filter === key ? 
                      "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm transition-all" : 
                      "border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                    }
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                    {key === 'unread' && unreadCount > 0 && (
                      <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">{unreadCount}</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications List - Improved Layout */}
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="p-1.5 bg-indigo-100 rounded-md">
                      <Bell className="h-4 w-4 text-indigo-600" />
                    </div>
                    Recent Notifications
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} 
                    {filter !== 'all' && ` filtered by ${filter}`}
                  </CardDescription>
                </div>
                {filteredNotifications.length > 0 && (
                  <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                    {filteredNotifications.filter(n => !n.isRead).length} unread
                  </Badge>
                )}
              </div>
            </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-4 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer rounded-lg p-5 border border-slate-200 ${
                      notification.isRead ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white shadow-sm hover:bg-indigo-50/30'
                    } ${getPriorityColor(notification.priority)}`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-semibold ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                          )}
                          <Badge variant={
                            notification.priority === 'urgent' ? 'destructive' :
                            notification.priority === 'high' ? 'default' :
                            'secondary'
                          } className="text-xs">
                            {notification.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700">
                            {notification.type}
                          </Badge>
                        </div>
                        
                        <p className="text-slate-600 text-sm mb-3">
                          {notification.message}
                        </p>
                      
                      {/* Metadata Display */}
                      {notification.metadata && (
                        <div className="flex flex-wrap gap-3 mb-3 text-xs text-slate-500">
                          {notification.metadata.amount && (
                            <div className="flex items-center gap-1">
                              <Banknote className="h-3 w-3" />
                              {formatCurrency(notification.metadata.amount)} {notification.metadata.currency}
                            </div>
                          )}
                          {notification.metadata.location && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {notification.metadata.location}
                            </div>
                          )}
                          {notification.metadata.riskScore && (
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Risk: {notification.metadata.riskScore}/100
                            </div>
                          )}
                          {notification.metadata.complianceLevel && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {notification.metadata.complianceLevel}
                            </div>
                          )}
                        </div>
                      )}
                      
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notification.timestamp)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <Button size="sm" variant="ghost" className="h-6 text-xs hover:bg-indigo-50 hover:text-indigo-600">
                                View Details
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Bell className="h-8 w-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications found</h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'You\'re all caught up!'}
                  </p>
                  <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Notification Settings
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

          {/* Improved Footer - Better Proportions */}
          <Card className="shadow-sm border-slate-200/60 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-500 rounded-md">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Global Financial Intelligence</h3>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                      AI-Powered
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-sm max-w-2xl">
                    Stay ahead with real-time notifications across 190+ countries. Our AI monitors regulatory 
                    changes, market opportunities, and security threats to keep your global portfolio protected.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/notifications/settings">
                    <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <Settings className="h-4 w-4 mr-2" />
                      Customize Alerts
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Globe className="h-4 w-4 mr-2" />
                    Regional Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}