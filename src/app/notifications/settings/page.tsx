'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Bell, 
  Shield,
  TrendingUp,
  Send,
  Building2,
  Star,
  Zap,
  Globe,
  Smartphone,
  Mail,
  Settings,
  Save,
  AlertTriangle,
  Info,
  Check,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuthGuard } from '@/components/auth/AuthGuard'

interface NotificationSetting {
  id: string
  category: string
  title: string
  description: string
  icon: any
  enabled: boolean
  channels: {
    push: boolean
    email: boolean
    sms: boolean
  }
  priority: 'low' | 'normal' | 'high' | 'urgent'
  frequency: 'instant' | 'daily' | 'weekly'
}

const defaultSettings: NotificationSetting[] = [
  {
    id: 'security_alerts',
    category: 'Security',
    title: 'Security Alerts',
    description: 'New device logins, suspicious activities, and account security updates',
    icon: Shield,
    enabled: true,
    channels: { push: true, email: true, sms: true },
    priority: 'urgent',
    frequency: 'instant'
  },
  {
    id: 'transaction_updates',
    category: 'Transactions',
    title: 'Transaction Updates',
    description: 'Confirmations, failures, and cross-border transfer status updates',
    icon: Send,
    enabled: true,
    channels: { push: true, email: true, sms: false },
    priority: 'high',
    frequency: 'instant'
  },
  {
    id: 'market_insights',
    category: 'Market',
    title: 'Market Insights',
    description: 'Yield opportunities, price movements, and DeFi protocol updates',
    icon: TrendingUp,
    enabled: true,
    channels: { push: true, email: true, sms: false },
    priority: 'normal',
    frequency: 'daily'
  },
  {
    id: 'regulatory_updates',
    category: 'Regulatory',
    title: 'Regulatory Updates',
    description: 'Compliance requirements, KYC reminders, and regulatory changes',
    icon: Building2,
    enabled: true,
    channels: { push: true, email: true, sms: false },
    priority: 'high',
    frequency: 'instant'
  },
  {
    id: 'promotional_offers',
    category: 'Promotional',
    title: 'Promotional Offers',
    description: 'New features, rewards programs, and special opportunities',
    icon: Star,
    enabled: false,
    channels: { push: false, email: true, sms: false },
    priority: 'low',
    frequency: 'weekly'
  },
  {
    id: 'system_maintenance',
    category: 'System',
    title: 'System Maintenance',
    description: 'Planned maintenance, feature updates, and service announcements',
    icon: Zap,
    enabled: true,
    channels: { push: true, email: true, sms: false },
    priority: 'normal',
    frequency: 'instant'
  }
]

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings)
  const [globalEnabled, setGlobalEnabled] = useState(true)
  const [timeZone, setTimeZone] = useState('UTC')
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '07:00' })
  const [saved, setSaved] = useState(false)

  const updateSetting = (id: string, updates: Partial<NotificationSetting>) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, ...updates } : setting
      )
    )
  }

  const updateChannel = (id: string, channel: 'push' | 'email' | 'sms', enabled: boolean) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id 
          ? { 
              ...setting, 
              channels: { 
                ...setting.channels, 
                [channel]: enabled 
              } 
            }
          : setting
      )
    )
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/notifications" 
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Notifications</span>
          </Link>
        </div>

        {/* Enhanced Header - Matching New Pattern */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl border border-indigo-100 p-6 mb-8">
          <div className="absolute inset-0 bg-grid-slate-100 opacity-30"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Notification Settings</h1>
                </div>
                <p className="text-slate-600 text-lg">Customize your global financial alerts and preferences</p>
                <div className="flex items-center gap-6 mt-3 text-sm text-indigo-700">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>24/7 Monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>Multi-Channel</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {saved ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Improved Global Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-slate-200/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="p-1.5 bg-indigo-100 rounded-md">
                    <Bell className="h-4 w-4 text-indigo-600" />
                  </div>
                  Global Controls
                </CardTitle>
                <CardDescription className="text-slate-600">Master settings for all notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div>
                    <p className="font-medium text-slate-900">Enable Notifications</p>
                    <p className="text-sm text-slate-600">Master switch for all alerts</p>
                  </div>
                  <Switch checked={globalEnabled} onCheckedChange={setGlobalEnabled} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Time Zone</label>
                  <Select value={timeZone} onValueChange={setTimeZone}>
                    <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                      <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                      <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                      <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                      <SelectItem value="CET">CET (Central European Time)</SelectItem>
                      <SelectItem value="JST">JST (Japan Standard Time)</SelectItem>
                      <SelectItem value="SGT">SGT (Singapore Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="p-1.5 bg-indigo-100 rounded-md">
                    <Smartphone className="h-4 w-4 text-indigo-600" />
                  </div>
                  Delivery Channels
                </CardTitle>
                <CardDescription className="text-slate-600">How you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Push Notifications</p>
                      <p className="text-sm text-slate-600">In-app and browser alerts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Email</p>
                      <p className="text-sm text-slate-600">Detailed notifications via email</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="p-1.5 bg-indigo-100 rounded-md">
                    <Globe className="h-4 w-4 text-indigo-600" />
                  </div>
                  Regional Settings
                </CardTitle>
                <CardDescription className="text-slate-600">Location-based preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Primary Region</label>
                  <Select defaultValue="global">
                    <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (All Regions)</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="eu">European Union</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="sg">Singapore</SelectItem>
                      <SelectItem value="jp">Japan</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Regional Compliance</p>
                      <p className="text-blue-700">Automatic regulatory updates for your region</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Notification Categories */}
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <div className="p-1.5 bg-indigo-100 rounded-md">
                  <Bell className="h-4 w-4 text-indigo-600" />
                </div>
                Notification Categories
              </CardTitle>
              <CardDescription className="text-slate-600">
                Configure individual notification types and their delivery preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="border-l-4 border-l-indigo-500 bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-50 rounded-md border border-indigo-100">
                          <setting.icon className="h-5 w-5 text-indigo-600" />
                        </div>
                        
                        <div className="space-y-3 flex-1">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-slate-900">{setting.title}</h3>
                              <Badge className={getPriorityColor(setting.priority)} variant="outline">
                                {setting.priority}
                              </Badge>
                              <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                                {setting.frequency}
                              </Badge>
                            </div>
                            <p className="text-slate-600 text-sm">{setting.description}</p>
                          </div>
                          
                          {/* Enhanced Delivery Channels */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">Delivery Channels:</p>
                            <div className="flex gap-6">
                              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                                <Switch 
                                  checked={setting.channels.push} 
                                  onCheckedChange={(checked) => updateChannel(setting.id, 'push', checked)}
                                  disabled={!setting.enabled}
                                />
                                <div className="flex items-center gap-1">
                                  <Smartphone className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium">Push</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                                <Switch 
                                  checked={setting.channels.email} 
                                  onCheckedChange={(checked) => updateChannel(setting.id, 'email', checked)}
                                  disabled={!setting.enabled}
                                />
                                <div className="flex items-center gap-1">
                                  <Mail className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium">Email</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Switch 
                          checked={setting.enabled} 
                          onCheckedChange={(checked) => updateSetting(setting.id, { enabled: checked })}
                        />
                        <span className="text-xs text-slate-500">
                          {setting.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Advanced Settings */}
          <Card className="shadow-sm border-slate-200/60 bg-gradient-to-r from-slate-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <div className="p-1.5 bg-amber-100 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                Advanced Settings
              </CardTitle>
              <CardDescription className="text-slate-600">
                Fine-tune your notification thresholds and sensitivity levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">High-Risk Transaction Threshold</label>
                  <Select defaultValue="10000">
                    <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">$1,000</SelectItem>
                      <SelectItem value="5000">$5,000</SelectItem>
                      <SelectItem value="10000">$10,000</SelectItem>
                      <SelectItem value="25000">$25,000</SelectItem>
                      <SelectItem value="50000">$50,000</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Transactions above this amount trigger security alerts</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Market Alert Sensitivity</label>
                  <Select defaultValue="medium">
                    <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (&gt;5% change)</SelectItem>
                      <SelectItem value="medium">Medium (&gt;2% change)</SelectItem>
                      <SelectItem value="high">High (&gt;1% change)</SelectItem>
                      <SelectItem value="all">All movements</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Minimum price change to trigger market alerts</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Smart Notification Management</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Our AI automatically adjusts notification frequency to prevent alert fatigue while ensuring you never miss critical updates.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}