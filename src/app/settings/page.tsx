'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Palette,
  Shield,
  Zap,
  Monitor,
  Moon,
  Sun,
  Globe,
  DollarSign,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  TrendingUp,
  Lock,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'

export default function SettingsPage() {
  const { user, isLoading } = useEnhancedAuth()
  const [fullUserData, setFullUserData] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    transactionAlerts: true,
    securityNotifications: true,
    marketUpdates: false,
    promotionalEmails: false,
    pushNotifications: true,
    smsNotifications: false,
    emailDigest: 'weekly' // daily, weekly, monthly, never
  })

  const [displaySettings, setDisplaySettings] = useState({
    language: 'en',
    currency: 'USDC',
    theme: 'system', // light, dark, system
    timezone: 'America/New_York',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: 'US'
  })

  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: false,
    marketingEmails: false,
    analyticsOptOut: false,
    thirdPartyIntegrations: true,
    publicProfile: false,
    showBalances: true
  })

  const [featureSettings, setFeatureSettings] = useState({
    autoInvestEnabled: false,
    autoInvestAmount: '100',
    defaultNetwork: 'sepolia',
    bridgeSlippage: '0.5',
    confirmAllTransactions: true,
    enableGaslessTransactions: true,
    showAdvancedFeatures: false
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user?.email) {
      const userData = findUserByEmail(user.email)
      setFullUserData(userData)
      
      // Load user's existing preferences if available
      if (userData?.preferences) {
        setNotificationSettings(prev => ({ ...prev, ...userData.preferences.notifications }))
        setDisplaySettings(prev => ({ ...prev, ...userData.preferences.display }))
        setPrivacySettings(prev => ({ ...prev, ...userData.preferences.privacy }))
        setFeatureSettings(prev => ({ ...prev, ...userData.preferences.features }))
      }
    }
  }, [mounted, user?.email])

  if (!mounted || isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-64 bg-slate-200 rounded-lg"></div>
              <div className="lg:col-span-3 h-96 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const handleSaveSettings = () => {
    // Here you would save to your backend
    setHasChanges(false)
    console.log('Settings saved:', {
      notifications: notificationSettings,
      display: displaySettings,
      privacy: privacySettings,
      features: featureSettings
    })
    // TODO: Show success toast
  }

  const handleResetSettings = () => {
    // Reset to default values
    setHasChanges(false)
    // TODO: Show confirmation dialog and reset to defaults
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 rounded-2xl border border-emerald-100 p-8 mb-8">
          <div className="absolute inset-0 bg-grid-slate-100 opacity-30"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <SettingsIcon className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Settings & Preferences</h1>
                </div>
                <p className="text-slate-600 text-lg">Customize your USD Financial experience to match your needs</p>
              </div>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleResetSettings} className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button onClick={handleSaveSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="notifications" className="space-y-8">
              <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
                <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1">
                  <TabsTrigger value="notifications" className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all hover:bg-emerald-50">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="display" className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all hover:bg-emerald-50">
                    <Palette className="h-4 w-4" />
                    Display
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all hover:bg-emerald-50">
                    <Shield className="h-4 w-4" />
                    Privacy
                  </TabsTrigger>
                  <TabsTrigger value="features" className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all hover:bg-emerald-50">
                    <Zap className="h-4 w-4" />
                    Features
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-8">
                <Card className="shadow-sm border-slate-200/60">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-semibold text-slate-900">Notification Preferences</CardTitle>
                    <CardDescription className="text-slate-600">Choose how and when you want to be notified about account activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Transaction Notifications */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Transaction Alerts</h4>
                      </div>
                      <div className="space-y-5 pl-2">
                        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                            <p className="font-medium text-slate-900">Transaction Notifications</p>
                            <p className="text-sm text-slate-600 mt-1">Get notified about incoming and outgoing transactions</p>
                          </div>
                          <Switch 
                            checked={notificationSettings.transactionAlerts}
                            onCheckedChange={(checked) => {
                              setNotificationSettings(prev => ({ ...prev, transactionAlerts: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                            <p className="font-medium text-slate-900">Large Transaction Alerts</p>
                            <p className="text-sm text-slate-600 mt-1">Special alerts for transactions over $1,000</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    {/* Security Notifications */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Lock className="h-5 w-5 text-orange-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Security Alerts</h4>
                      </div>
                      <div className="space-y-5 pl-2">
                        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                            <p className="font-medium text-slate-900">Security Notifications</p>
                            <p className="text-sm text-slate-600 mt-1">Login attempts, password changes, and security events</p>
                          </div>
                          <Switch 
                            checked={notificationSettings.securityNotifications}
                            onCheckedChange={(checked) => {
                              setNotificationSettings(prev => ({ ...prev, securityNotifications: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                            <p className="font-medium text-slate-900">New Device Login</p>
                            <p className="text-sm text-slate-600 mt-1">Alert when your account is accessed from a new device</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    {/* Communication Channels */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Communication Channels</h4>
                      </div>
                      <div className="space-y-5 pl-2">
                        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-slate-600" />
                            <div>
                              <p className="font-medium text-slate-900">Push Notifications</p>
                              <p className="text-sm text-slate-600 mt-1">Notifications on your devices</p>
                            </div>
                          </div>
                          <Switch 
                            checked={notificationSettings.pushNotifications}
                            onCheckedChange={(checked) => {
                              setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-slate-600" />
                            <div>
                              <p className="font-medium text-slate-900">Email Notifications</p>
                              <p className="text-sm text-slate-600 mt-1">Important updates via email</p>
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    {/* Email Digest */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Mail className="h-5 w-5 text-purple-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Email Digest Frequency</h4>
                      </div>
                      <div className="pl-2">
                        <Select 
                          value={notificationSettings.emailDigest} 
                          onValueChange={(value) => {
                            setNotificationSettings(prev => ({ ...prev, emailDigest: value }))
                            setHasChanges(true)
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Display Tab */}
              <TabsContent value="display" className="space-y-8">
                <Card className="shadow-sm border-slate-200/60">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-semibold text-slate-900">Display & Interface</CardTitle>
                    <CardDescription className="text-slate-600">Customize how USD Financial looks and feels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Theme */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Palette className="h-5 w-5 text-pink-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Appearance</h4>
                      </div>
                      <div className="pl-2 space-y-4">
                        <div className="space-y-3">
                          <Label>Theme</Label>
                          <div className="flex gap-4">
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${displaySettings.theme === 'light' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                              onClick={() => {
                                setDisplaySettings(prev => ({ ...prev, theme: 'light' }))
                                setHasChanges(true)
                              }}
                            >
                              <Sun className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                              <p className="text-sm text-center">Light</p>
                            </div>
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${displaySettings.theme === 'dark' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                              onClick={() => {
                                setDisplaySettings(prev => ({ ...prev, theme: 'dark' }))
                                setHasChanges(true)
                              }}
                            >
                              <Moon className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                              <p className="text-sm text-center">Dark</p>
                            </div>
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${displaySettings.theme === 'system' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                              onClick={() => {
                                setDisplaySettings(prev => ({ ...prev, theme: 'system' }))
                                setHasChanges(true)
                              }}
                            >
                              <Monitor className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                              <p className="text-sm text-center">System</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Language & Region */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Globe className="h-5 w-5 text-indigo-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Language & Region</h4>
                      </div>
                      <div className="pl-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Language</Label>
                          <Select value={displaySettings.language} onValueChange={(value) => {
                            setDisplaySettings(prev => ({ ...prev, language: value }))
                            setHasChanges(true)
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="de">Deutsch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <Select value={displaySettings.timezone} onValueChange={(value) => {
                            setDisplaySettings(prev => ({ ...prev, timezone: value }))
                            setHasChanges(true)
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                              <SelectItem value="Europe/London">London (GMT)</SelectItem>
                              <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Currency & Formatting */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Currency & Formatting</h4>
                      </div>
                      <div className="pl-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Primary Currency</Label>
                          <Select value={displaySettings.currency} onValueChange={(value) => {
                            setDisplaySettings(prev => ({ ...prev, currency: value }))
                            setHasChanges(true)
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USDC">USDC</SelectItem>
                              <SelectItem value="USDT">USDT</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date Format</Label>
                          <Select value={displaySettings.dateFormat} onValueChange={(value) => {
                            setDisplaySettings(prev => ({ ...prev, dateFormat: value }))
                            setHasChanges(true)
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (US)</SelectItem>
                              <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (EU)</SelectItem>
                              <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (ISO)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-8">
                <Card className="shadow-sm border-slate-200/60">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-semibold text-slate-900">Privacy Controls</CardTitle>
                    <CardDescription className="text-slate-600">Manage your data privacy and sharing preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Data Sharing */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Shield className="h-5 w-5 text-red-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Data Sharing</h4>
                      </div>
                      <div className="space-y-5 pl-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Analytics Data</p>
                            <p className="text-sm text-slate-600">Help improve USD Financial by sharing usage data</p>
                          </div>
                          <Switch 
                            checked={!privacySettings.analyticsOptOut}
                            onCheckedChange={(checked) => {
                              setPrivacySettings(prev => ({ ...prev, analyticsOptOut: !checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Third-party Integrations</p>
                            <p className="text-sm text-slate-600">Allow connected services to access your data</p>
                          </div>
                          <Switch 
                            checked={privacySettings.thirdPartyIntegrations}
                            onCheckedChange={(checked) => {
                              setPrivacySettings(prev => ({ ...prev, thirdPartyIntegrations: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Marketing */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Marketing Communications
                      </h4>
                      <div className="space-y-4 ml-7">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Promotional Emails</p>
                            <p className="text-sm text-slate-600">Receive emails about new features and offers</p>
                          </div>
                          <Switch 
                            checked={privacySettings.marketingEmails}
                            onCheckedChange={(checked) => {
                              setPrivacySettings(prev => ({ ...prev, marketingEmails: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Product Updates</p>
                            <p className="text-sm text-slate-600">Get notified about important product changes</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    {/* Profile Visibility */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Profile Visibility
                      </h4>
                      <div className="space-y-4 ml-7">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Show Balance Information</p>
                            <p className="text-sm text-slate-600">Display balance info in shared screens</p>
                          </div>
                          <Switch 
                            checked={privacySettings.showBalances}
                            onCheckedChange={(checked) => {
                              setPrivacySettings(prev => ({ ...prev, showBalances: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Public Profile</p>
                            <p className="text-sm text-slate-600">Allow others to find your profile</p>
                          </div>
                          <Switch 
                            checked={privacySettings.publicProfile}
                            onCheckedChange={(checked) => {
                              setPrivacySettings(prev => ({ ...prev, publicProfile: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-8">
                <Card className="shadow-sm border-slate-200/60">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-semibold text-slate-900">Feature Settings</CardTitle>
                    <CardDescription className="text-slate-600">Configure how USD Financial features work for you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Auto-Invest */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Auto-Invest
                      </h4>
                      <div className="space-y-4 ml-7">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Enable Auto-Invest</p>
                            <p className="text-sm text-slate-600">Automatically invest spare change and scheduled amounts</p>
                          </div>
                          <Switch 
                            checked={featureSettings.autoInvestEnabled}
                            onCheckedChange={(checked) => {
                              setFeatureSettings(prev => ({ ...prev, autoInvestEnabled: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        {featureSettings.autoInvestEnabled && (
                          <div className="space-y-2">
                            <Label>Default Investment Amount (USDC)</Label>
                            <Input 
                              type="number" 
                              value={featureSettings.autoInvestAmount}
                              onChange={(e) => {
                                setFeatureSettings(prev => ({ ...prev, autoInvestAmount: e.target.value }))
                                setHasChanges(true)
                              }}
                              className="w-32"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transaction Settings */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Transaction Preferences
                      </h4>
                      <div className="space-y-4 ml-7">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Enable Gasless Transactions</p>
                            <p className="text-sm text-slate-600">Use smart wallet for fee-free transactions when possible</p>
                          </div>
                          <Switch 
                            checked={featureSettings.enableGaslessTransactions}
                            onCheckedChange={(checked) => {
                              setFeatureSettings(prev => ({ ...prev, enableGaslessTransactions: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Confirm All Transactions</p>
                            <p className="text-sm text-slate-600">Require confirmation for every transaction</p>
                          </div>
                          <Switch 
                            checked={featureSettings.confirmAllTransactions}
                            onCheckedChange={(checked) => {
                              setFeatureSettings(prev => ({ ...prev, confirmAllTransactions: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Network Settings */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Network Preferences
                      </h4>
                      <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Default Network</Label>
                          <Select value={featureSettings.defaultNetwork} onValueChange={(value) => {
                            setFeatureSettings(prev => ({ ...prev, defaultNetwork: value }))
                            setHasChanges(true)
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sepolia">Sepolia (Testnet)</SelectItem>
                              <SelectItem value="ethereum">Ethereum</SelectItem>
                              <SelectItem value="arbitrum">Arbitrum</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="optimism">Optimism</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Bridge Slippage (%)</Label>
                          <Select value={featureSettings.bridgeSlippage} onValueChange={(value) => {
                            setFeatureSettings(prev => ({ ...prev, bridgeSlippage: value }))
                            setHasChanges(true)
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.1">0.1%</SelectItem>
                              <SelectItem value="0.5">0.5%</SelectItem>
                              <SelectItem value="1.0">1.0%</SelectItem>
                              <SelectItem value="2.0">2.0%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Features */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        Advanced
                      </h4>
                      <div className="space-y-4 ml-7">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Show Advanced Features</p>
                            <p className="text-sm text-slate-600">Enable developer and advanced user features</p>
                          </div>
                          <Switch 
                            checked={featureSettings.showAdvancedFeatures}
                            onCheckedChange={(checked) => {
                              setFeatureSettings(prev => ({ ...prev, showAdvancedFeatures: checked }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}