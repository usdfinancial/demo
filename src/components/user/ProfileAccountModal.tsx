'use client'

import { useState } from 'react'
import { X, User, Mail, Phone, MapPin, Shield, CheckCircle, AlertCircle, Upload, Camera, Star, Building2, Calendar, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail, type DemoUser } from '@/lib/demoUsers'

interface ProfileAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileAccountModal({ isOpen, onClose }: ProfileAccountModalProps) {
  const { user } = useEnhancedAuth()
  const fullUserData = user ? findUserByEmail(user.email) : null
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  
  // Profile form state - initialize from localStorage if available
  const [profileData, setProfileData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`profile-${user?.email}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          return {
            name: user?.name || parsed.name || '',
            email: user?.email || parsed.email || '',
            phone: parsed.phone || '+1 (555) 123-4567',
            address: parsed.address || '123 Financial District, NY 10001',
            dateOfBirth: parsed.dateOfBirth || '1990-01-15',
            occupation: parsed.occupation || 'Software Engineer'
          }
        }
      } catch (error) {
        console.error('Failed to load saved profile data:', error)
      }
    }
    
    return {
      name: user?.name || '',
      email: user?.email || '',
      phone: '+1 (555) 123-4567',
      address: '123 Financial District, NY 10001',
      dateOfBirth: '1990-01-15',
      occupation: 'Software Engineer'
    }
  })

  const handleSave = () => {
    try {
      // Save to localStorage for persistence
      localStorage.setItem(`profile-${user?.email}`, JSON.stringify(profileData))
      setIsEditing(false)
      
      // Show success message - you could add a toast notification here
      console.log('✅ Profile updated successfully:', profileData)
    } catch (error) {
      console.error('❌ Failed to save profile:', error)
      // Handle error - you could show an error message to the user
    }
  }

  if (!user || !fullUserData) return null

  const getVerificationLevel = () => {
    if (fullUserData.preferences.twoFactorAuth && fullUserData.accountType === 'premium') {
      return { level: 'Fully Verified', progress: 100, color: 'text-green-600' }
    } else if (fullUserData.preferences.twoFactorAuth) {
      return { level: 'Verified', progress: 75, color: 'text-emerald-600' }
    } else {
      return { level: 'Basic', progress: 50, color: 'text-yellow-600' }
    }
  }

  const verification = getVerificationLevel()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Profile & Account
          </DialogTitle>
          <DialogDescription>
            Manage your personal information, account details, verification status, and activity
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Manage your personal details and profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-emerald-100">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-2xl font-semibold">
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      size="sm" 
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      {fullUserData.accountType === 'premium' && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {fullUserData.accountType === 'business' && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                          <Building2 className="h-3 w-3 mr-1" />
                          Business
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <p className="text-xs text-slate-500">
                      Member since {new Date(fullUserData.joinDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                    <Input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      disabled={!isEditing}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Address</label>
                    <Input
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!isEditing}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Occupation</label>
                    <Input
                      value={profileData.occupation}
                      onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                      disabled={!isEditing}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Account Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Account Type</span>
                    <div className="flex items-center gap-2">
                      {fullUserData.accountType === 'premium' && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                          Premium
                        </Badge>
                      )}
                      {fullUserData.accountType === 'business' && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                          Business
                        </Badge>
                      )}
                      {fullUserData.accountType === 'personal' && (
                        <Badge variant="secondary">Personal</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Current Balance</span>
                    <span className="font-semibold text-emerald-600">
                      ${fullUserData.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Portfolio Value</span>
                    <span className="font-semibold text-slate-900">
                      ${fullUserData.portfolio.totalValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Monthly Gain</span>
                    <span className="font-semibold text-green-600">
                      +{fullUserData.portfolio.monthlyGain}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Risk Score</span>
                    <span className="font-semibold text-blue-600">
                      {fullUserData.portfolio.riskScore}/100
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Preferred Currency</span>
                    <Badge variant="outline">{fullUserData.preferences.currency}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Notifications</span>
                    <Badge variant={fullUserData.preferences.notifications ? "default" : "secondary"}>
                      {fullUserData.preferences.notifications ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Two-Factor Auth</span>
                    <Badge variant={fullUserData.preferences.twoFactorAuth ? "default" : "secondary"}>
                      {fullUserData.preferences.twoFactorAuth ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Last Login</span>
                    <span className="text-sm font-medium">
                      {new Date(fullUserData.lastLogin).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Verification
                </CardTitle>
                <CardDescription>
                  Complete your verification to unlock all features and higher limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Verification Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Verification Level</span>
                    <span className={`text-sm font-semibold ${verification.color}`}>
                      {verification.level}
                    </span>
                  </div>
                  <Progress value={verification.progress} className="h-2" />
                  <p className="text-xs text-slate-500">
                    {verification.progress}% complete
                  </p>
                </div>

                {/* Verification Steps */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">Email Verified</p>
                      <p className="text-xs text-green-700">Your email address has been confirmed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">Identity Verified</p>
                      <p className="text-xs text-green-700">Government ID verification complete</p>
                    </div>
                  </div>

                  {fullUserData.preferences.twoFactorAuth ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">Two-Factor Authentication</p>
                        <p className="text-xs text-green-700">Additional security layer active</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">Two-Factor Authentication</p>
                        <p className="text-xs text-yellow-700">Recommended for enhanced security</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-yellow-700 border-yellow-300">
                        Enable
                      </Button>
                    </div>
                  )}

                  {fullUserData.accountType !== 'premium' && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <AlertCircle className="h-5 w-5 text-slate-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">Premium Verification</p>
                        <p className="text-xs text-slate-700">Upgrade for enhanced features and limits</p>
                      </div>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        Upgrade
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Track your account activity and important events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Successful Login</p>
                      <p className="text-xs text-slate-500">Today at 2:30 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Portfolio Updated</p>
                      <p className="text-xs text-slate-500">Yesterday at 4:15 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Stablecoin Deposit</p>
                      <p className="text-xs text-slate-500">2 days ago at 10:45 AM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Security Settings Updated</p>
                      <p className="text-xs text-slate-500">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}