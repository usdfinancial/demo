'use client'

import { useState } from 'react'
import { Settings, Shield, Bell, CreditCard, Globe, Moon, Sun, Monitor, Lock, Smartphone, Mail, DollarSign, Eye, EyeOff, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'

interface SettingsPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPreferencesModal({ isOpen, onClose }: SettingsPreferencesModalProps) {
  const { user } = useEnhancedAuth()
  const fullUserData = user ? findUserByEmail(user.email) : null
  const [activeTab, setActiveTab] = useState('general')
  
  // Settings state
  const [settings, setSettings] = useState({
    // General
    language: 'en',
    timezone: 'UTC-5',
    theme: 'system',
    currency: fullUserData?.preferences.currency || 'USDC',
    
    // Security
    twoFactorAuth: fullUserData?.preferences.twoFactorAuth || false,
    biometricAuth: true,
    sessionTimeout: 30,
    loginAlerts: true,
    
    // Notifications
    emailNotifications: fullUserData?.preferences.notifications || false,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    transactionAlerts: true,
    priceAlerts: true,
    portfolioUpdates: true,
    
    // Privacy
    activityTracking: true,
    analyticsSharing: false,
    thirdPartyIntegration: false,
    
    // Trading
    defaultSlippage: 0.5,
    autoApproval: false,
    advancedMode: false,
    riskWarnings: true
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleExportData = () => {
    // Implementation for data export
    console.log('Exporting user data...')
  }

  const handleDeleteAccount = () => {
    // Implementation for account deletion
    console.log('Account deletion requested...')
  }

  if (!user || !fullUserData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Settings & Preferences
          </DialogTitle>
          <DialogDescription>
            Customize your account preferences, security settings, and notification options
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional & Display
                </CardTitle>
                <CardDescription>
                  Customize your regional preferences and display settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Language</label>
                    <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="ko">한국어</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Timezone</label>
                    <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                        <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                        <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="UTC+0">Greenwich Mean Time (UTC+0)</SelectItem>
                        <SelectItem value="UTC+9">Japan Time (UTC+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Theme</label>
                    <div className="flex gap-2">
                      <Button
                        variant={settings.theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSettingChange('theme', 'light')}
                        className="flex-1"
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={settings.theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSettingChange('theme', 'dark')}
                        className="flex-1"
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={settings.theme === 'system' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSettingChange('theme', 'system')}
                        className="flex-1"
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        System
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Default Currency</label>
                    <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Authentication
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-900">Two-Factor Authentication</p>
                      <p className="text-sm text-emerald-700">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {settings.twoFactorAuth && (
                      <Badge className="bg-green-600">Enabled</Badge>
                    )}
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                    />
                  </div>
                </div>

                {/* Biometric Authentication */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="font-medium">Biometric Authentication</p>
                      <p className="text-sm text-slate-600">Use fingerprint or face recognition</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.biometricAuth}
                    onCheckedChange={(checked) => handleSettingChange('biometricAuth', checked)}
                  />
                </div>

                {/* Session Timeout */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">
                    Session Timeout: {settings.sessionTimeout} minutes
                  </label>
                  <Slider
                    value={[settings.sessionTimeout]}
                    onValueChange={(value) => handleSettingChange('sessionTimeout', value[0])}
                    max={120}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>5 min</span>
                    <span>2 hours</span>
                  </div>
                </div>

                {/* Login Alerts */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="font-medium">Login Alerts</p>
                      <p className="text-sm text-slate-600">Get notified of new login attempts</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.loginAlerts}
                    onCheckedChange={(checked) => handleSettingChange('loginAlerts', checked)}
                  />
                </div>

                {/* Password Change */}
                <div className="p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Lock className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-slate-600">Change your account password</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Email Notifications</h4>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium">Transaction Alerts</p>
                        <p className="text-xs text-slate-600">Deposits, withdrawals, and transfers</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.transactionAlerts}
                      onCheckedChange={(checked) => handleSettingChange('transactionAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium">Price Alerts</p>
                        <p className="text-xs text-slate-600">Stablecoin price movements</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.priceAlerts}
                      onCheckedChange={(checked) => handleSettingChange('priceAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium">Portfolio Updates</p>
                        <p className="text-xs text-slate-600">Weekly portfolio summaries</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.portfolioUpdates}
                      onCheckedChange={(checked) => handleSettingChange('portfolioUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium">Marketing Emails</p>
                        <p className="text-xs text-slate-600">Product updates and promotions</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                    />
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Push Notifications</h4>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-slate-600">Real-time notifications on your device</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-sm font-medium">SMS Notifications</p>
                      <p className="text-xs text-slate-600">Critical alerts via text message</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5" />
                  Privacy & Data
                </CardTitle>
                <CardDescription>
                  Control your privacy settings and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium">Activity Tracking</p>
                    <p className="text-sm text-slate-600">Allow us to track your activity for better experience</p>
                  </div>
                  <Switch
                    checked={settings.activityTracking}
                    onCheckedChange={(checked) => handleSettingChange('activityTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium">Analytics Sharing</p>
                    <p className="text-sm text-slate-600">Share anonymized data for product improvement</p>
                  </div>
                  <Switch
                    checked={settings.analyticsSharing}
                    onCheckedChange={(checked) => handleSettingChange('analyticsSharing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium">Third-Party Integration</p>
                    <p className="text-sm text-slate-600">Allow third-party services to access your data</p>
                  </div>
                  <Switch
                    checked={settings.thirdPartyIntegration}
                    onCheckedChange={(checked) => handleSettingChange('thirdPartyIntegration', checked)}
                  />
                </div>

                {/* Data Management */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Data Management</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                    <div>
                      <p className="font-medium">Export Data</p>
                      <p className="text-sm text-slate-600">Download a copy of your account data</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                    <div>
                      <p className="font-medium text-red-900">Delete Account</p>
                      <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-300" onClick={handleDeleteAccount}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Settings */}
          <TabsContent value="trading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Trading Preferences
                </CardTitle>
                <CardDescription>
                  Customize your trading and transaction settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Slippage */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">
                    Default Slippage Tolerance: {settings.defaultSlippage}%
                  </label>
                  <Slider
                    value={[settings.defaultSlippage]}
                    onValueChange={(value) => handleSettingChange('defaultSlippage', value[0])}
                    max={5}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0.1%</span>
                    <span>5.0%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium">Auto-Approval for Small Transactions</p>
                    <p className="text-sm text-slate-600">Skip confirmation for transactions under $100</p>
                  </div>
                  <Switch
                    checked={settings.autoApproval}
                    onCheckedChange={(checked) => handleSettingChange('autoApproval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium">Advanced Trading Mode</p>
                    <p className="text-sm text-slate-600">Enable advanced trading features and charts</p>
                  </div>
                  <Switch
                    checked={settings.advancedMode}
                    onCheckedChange={(checked) => handleSettingChange('advancedMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium">Risk Warnings</p>
                    <p className="text-sm text-slate-600">Show risk warnings before high-risk transactions</p>
                  </div>
                  <Switch
                    checked={settings.riskWarnings}
                    onCheckedChange={(checked) => handleSettingChange('riskWarnings', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}