'use client'

import { useState, useEffect } from 'react'
import { 
  User, 
  Shield, 
  Bell, 
  Wallet, 
  Eye,
  EyeOff,
  Camera,
  Edit3,
  CheckCircle,
  AlertCircle,
  Settings,
  Smartphone,
  Key,
  Globe,
  Download,
  FileText,
  Trash2,
  ExternalLink,
  Copy,
  ChevronRight,
  Star,
  Building2,
  Zap,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { formatCurrency } from '@/lib/data'
import { checkSignerConnection } from '@/utils/signerGuards'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const { 
    user, 
    isLoading, 
    isAuthenticated,
    isConnected,
    smartAccountAddress, 
    multiChainBalances,
    signerStatus 
  } = useEnhancedAuth()
  const { toast } = useToast()
  
  const [fullUserData, setFullUserData] = useState<any>(null)
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)
  const [editMode, setEditMode] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [signerError, setSignerError] = useState<string | null>(null)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    countryCode: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Preferences form state
  const [preferencesForm, setPreferencesForm] = useState({
    transactionNotifications: false,
    securityAlerts: true,
    marketUpdates: false,
    primaryCurrency: 'USDC',
    language: 'en'
  })
  const [isSubmittingPreferences, setIsSubmittingPreferences] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user?.email) {
      const userData = findUserByEmail(user.email)
      setFullUserData(userData)
    }
  }, [mounted, user?.email])

  // Check signer connection and handle errors gracefully
  useEffect(() => {
    if (!mounted || isLoading) return

    try {
      const signerCheck = checkSignerConnection(
        { 
          isConnected, 
          isInitializing: isLoading 
        }, 
        user
      )
      
      if (!signerCheck.canProceed) {
        setSignerError(signerCheck.error || 'Authentication required')
      } else {
        setSignerError(null)
      }
    } catch (error) {
      console.warn('Signer check error:', error)
      setSignerError('Authentication verification failed')
    }
  }, [mounted, isLoading, isConnected, user, isAuthenticated])

  // Populate form with existing user data
  useEffect(() => {
    if (fullUserData) {
      setProfileForm({
        firstName: fullUserData.firstName || '',
        lastName: fullUserData.lastName || '',
        phone: fullUserData.phone || '',
        dateOfBirth: fullUserData.dateOfBirth || '',
        countryCode: fullUserData.countryCode || ''
      })
    }
  }, [fullUserData])

  // Populate preferences with existing user data
  useEffect(() => {
    if (fullUserData?.preferences) {
      setPreferencesForm({
        transactionNotifications: fullUserData.preferences.notifications || false,
        securityAlerts: fullUserData.preferences.securityAlerts ?? true,
        marketUpdates: fullUserData.preferences.marketUpdates || false,
        primaryCurrency: fullUserData.preferences.primaryCurrency || 'USDC',
        language: fullUserData.preferences.language || 'en'
      })
    }
  }, [fullUserData])

  // Form handlers
  const handleInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'Please ensure you are logged in',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'update-profile',
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
          dateOfBirth: profileForm.dateOfBirth
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const result = await response.json()
      
      // Update local data
      setFullUserData(prev => ({
        ...prev,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        dateOfBirth: profileForm.dateOfBirth
      }))
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully!'
      })
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preferences form handlers
  const handlePreferencesChange = (field: string, value: string | boolean) => {
    setPreferencesForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSavePreferences = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'Please ensure you are logged in',
        variant: 'destructive'
      })
      return
    }

    setIsSubmittingPreferences(true)
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'update-preferences',
          emailNotifications: preferencesForm.transactionNotifications,
          smsNotifications: preferencesForm.securityAlerts,
          marketingEmails: preferencesForm.marketUpdates,
          currency: preferencesForm.primaryCurrency,
          language: preferencesForm.language
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update preferences')
      }

      const result = await response.json()
      
      // Update local data
      setFullUserData(prev => ({
        ...prev,
        preferences: {
          ...prev?.preferences,
          notifications: preferencesForm.transactionNotifications,
          securityAlerts: preferencesForm.securityAlerts,
          marketUpdates: preferencesForm.marketUpdates,
          primaryCurrency: preferencesForm.primaryCurrency,
          language: preferencesForm.language
        }
      }))
      
      toast({
        title: 'Success',
        description: 'Preferences updated successfully!'
      })
    } catch (error) {
      console.error('Preferences update error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingPreferences(false)
    }
  }

  if (!mounted || isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-slate-200 rounded-lg"></div>
                <div className="h-96 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="h-96 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const handleCopyAddress = (address: string) => {
    try {
      if (!address) {
        console.warn('No address provided to copy')
        return
      }
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address)
        console.log('Address copied to clipboard')
        // TODO: Add toast notification
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = address
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        console.log('Address copied via fallback method')
      }
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Signer Error Alert */}
        {signerError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">Authentication Notice</p>
            </div>
            <p className="text-yellow-700 text-sm mt-1">{signerError}</p>
          </div>
        )}

        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 rounded-2xl border border-emerald-100 p-6 mb-8">
          <div className="absolute inset-0 bg-grid-slate-100 opacity-30"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Profile & Account</h1>
                </div>
                <p className="text-slate-600 text-lg">Manage your USD Financial account settings and preferences</p>
                <div className="flex items-center gap-6 mt-3 text-sm text-emerald-700">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Account security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Personal settings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Wallet management</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {fullUserData?.accountType === 'premium' && (
                  <Badge className="bg-white/80 backdrop-blur-sm border-white/20 px-4 py-2 text-yellow-800">
                    <Star className="h-4 w-4 mr-2" />
                    Premium
                  </Badge>
                )}
                {fullUserData?.accountType === 'business' && (
                  <Badge className="bg-white/80 backdrop-blur-sm border-white/20 px-4 py-2 text-blue-800">
                    <Building2 className="h-4 w-4 mr-2" />
                    Business
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
                <TabsList className="grid w-full grid-cols-6 bg-transparent gap-1">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Overview</TabsTrigger>
                  <TabsTrigger value="personal" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Personal</TabsTrigger>
                  <TabsTrigger value="security" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Security</TabsTrigger>
                  <TabsTrigger value="wallets" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Wallets</TabsTrigger>
                  <TabsTrigger value="preferences" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Settings</TabsTrigger>
                  <TabsTrigger value="privacy" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Privacy</TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Profile Summary */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                            {fullUserData?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                          </div>
                          <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">{fullUserData?.name || user?.email || 'USD Financial User'}</h2>
                          <p className="text-slate-600">{user?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                              <Zap className="h-3 w-3 mr-1" />
                              Smart Wallet
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(fullUserData?.balance || 0)}
                        </p>
                        <p className="text-sm text-slate-600">Total Balance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {multiChainBalances?.networks?.length || 0}
                        </p>
                        <p className="text-sm text-slate-600">Networks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          +{fullUserData?.portfolio?.monthlyGain || 0}%
                        </p>
                        <p className="text-sm text-slate-600">Monthly Gain</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {fullUserData?.portfolio?.riskScore || 0}
                        </p>
                        <p className="text-sm text-slate-600">Risk Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-16 flex flex-col gap-2">
                      <Shield className="h-5 w-5" />
                      <span className="text-sm">2FA Setup</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex flex-col gap-2">
                      <Download className="h-5 w-5" />
                      <span className="text-sm">Export Data</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex flex-col gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm">Statements</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex flex-col gap-2">
                      <Settings className="h-5 w-5" />
                      <span className="text-sm">Preferences</span>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          placeholder="Enter your first name"
                          value={profileForm.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          placeholder="Enter your last name"
                          value={profileForm.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={user?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="+1 (555) 123-4567"
                        value={profileForm.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country/Region</Label>
                      <Input 
                        id="country" 
                        placeholder="United States"
                        value={profileForm.countryCode}
                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardContent>
                </Card>

                {/* KYC Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Identity Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Identity Verified</p>
                          <p className="text-sm text-green-700">Full access to USD Financial services</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Level 2</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>Manage your account security and authentication methods</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Two-Factor Authentication */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Enabled
                        </Badge>
                        <Button size="sm">Setup</Button>
                      </div>
                    </div>

                    {/* Passkeys */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-6 w-6 text-purple-600" />
                        <div>
                          <p className="font-medium">Passkeys</p>
                          <p className="text-sm text-slate-600">Use biometrics or security keys to sign in</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                        <Button size="sm" variant="outline">Manage</Button>
                      </div>
                    </div>

                    {/* Session Management */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-6 w-6 text-emerald-600" />
                        <div>
                          <p className="font-medium">Active Sessions</p>
                          <p className="text-sm text-slate-600">Manage your active sessions across devices</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View All</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wallets Tab */}
              <TabsContent value="wallets" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Connected Wallets
                    </CardTitle>
                    <CardDescription>Manage your wallet addresses and smart account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Smart Wallet */}
                    {smartAccountAddress ? (
                      <div className="p-4 border border-emerald-200 rounded-lg bg-emerald-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500">
                              <Zap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-emerald-900">Smart Wallet (Primary)</p>
                              <p className="text-sm text-emerald-700">Gasless transactions enabled</p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                            className="text-emerald-700 hover:text-emerald-800"
                          >
                            {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <code className="text-sm bg-white px-3 py-1 rounded border">
                            {showSensitiveInfo ? smartAccountAddress : `${smartAccountAddress.slice(0, 6)}...${smartAccountAddress.slice(-4)}`}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAddress(smartAccountAddress)}
                            className="text-emerald-700 hover:text-emerald-800"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-400">
                            <Zap className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Smart Wallet</p>
                            <p className="text-sm text-gray-600">Setting up your gasless wallet...</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* External Wallet */}
                    {user?.address ? (
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-500">
                              <Wallet className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">External Wallet</p>
                              <p className="text-sm text-slate-600">Connected via Account Kit</p>
                            </div>
                          </div>
                          <Badge variant="outline">Connected</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                            className="text-slate-600"
                          >
                            {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <code className="text-sm bg-slate-100 px-3 py-1 rounded border">
                            {showSensitiveInfo ? user.address : `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAddress(user.address)}
                            className="text-slate-600"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-400">
                            <Wallet className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">External Wallet</p>
                            <p className="text-sm text-gray-600">No external wallet connected</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Transaction Notifications</p>
                          <p className="text-sm text-slate-600">Get notified about incoming and outgoing transactions</p>
                        </div>
                        <Switch 
                          checked={preferencesForm.transactionNotifications}
                          onCheckedChange={(checked) => handlePreferencesChange('transactionNotifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Security Alerts</p>
                          <p className="text-sm text-slate-600">Receive alerts about security events and login attempts</p>
                        </div>
                        <Switch 
                          checked={preferencesForm.securityAlerts}
                          onCheckedChange={(checked) => handlePreferencesChange('securityAlerts', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Market Updates</p>
                          <p className="text-sm text-slate-600">Stay informed about stablecoin market changes</p>
                        </div>
                        <Switch 
                          checked={preferencesForm.marketUpdates}
                          onCheckedChange={(checked) => handlePreferencesChange('marketUpdates', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Display Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Primary Currency</Label>
                      <Select 
                        value={preferencesForm.primaryCurrency}
                        onValueChange={(value) => handlePreferencesChange('primaryCurrency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={preferencesForm.language}
                        onValueChange={(value) => handlePreferencesChange('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Preferences Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSavePreferences}
                    disabled={isSubmittingPreferences}
                  >
                    {isSubmittingPreferences ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                    <CardDescription>Control how your data is used and manage privacy settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">Export My Data</p>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                        <p className="text-sm text-slate-600">Download a copy of your personal data and transaction history</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">Privacy Policy</p>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                        <p className="text-sm text-slate-600">Review how we collect and use your information</p>
                      </div>

                      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-red-900">Delete Account</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Account</DialogTitle>
                                <DialogDescription>
                                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline">Cancel</Button>
                                <Button variant="destructive">Delete Account</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-sm text-red-700">Permanently delete your account and all associated data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Verified</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Identity Verified</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Smart Wallet Active</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">2FA Enabled</span>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            {/* Security Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-orange-600">85/100</div>
                  <p className="text-sm text-slate-600">Good Security</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enable 2FA</span>
                    <span className="text-orange-600">+15</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Add Recovery Method</span>
                    <span className="text-orange-600">+10</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Profile updated</span>
                  <span className="text-slate-500 ml-auto">2h ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Smart wallet used</span>
                  <span className="text-slate-500 ml-auto">1d ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Login from new device</span>
                  <span className="text-slate-500 ml-auto">3d ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}