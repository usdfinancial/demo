'use client'

import { useState } from 'react'
import { Shield, Smartphone, Key, CheckCircle, AlertCircle, Globe, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface SecuritySectionProps {
  userPreferences?: {
    twoFactorAuth?: boolean
  }
}

export function SecuritySection({ userPreferences }: SecuritySectionProps) {
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)

  const securityFeatures = [
    {
      id: 'twoFactor',
      icon: Smartphone,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      enabled: userPreferences?.twoFactorAuth || false,
      status: userPreferences?.twoFactorAuth ? 'Active' : 'Not Enabled',
      statusColor: userPreferences?.twoFactorAuth ? 'text-green-600 border-green-300' : 'text-orange-600 border-orange-300',
      action: userPreferences?.twoFactorAuth ? 'Manage' : 'Setup'
    },
    {
      id: 'passkeys',
      icon: Key,
      title: 'Passkeys',
      description: 'Use biometrics or security keys to sign in',
      enabled: true, // Assuming Account Kit provides this
      status: 'Active',
      statusColor: 'text-green-600 border-green-300',
      action: 'Manage'
    },
    {
      id: 'sessions',
      icon: Globe,
      title: 'Active Sessions',
      description: 'Manage your active sessions across devices',
      enabled: true,
      status: '3 Active',
      statusColor: 'text-blue-600 border-blue-300',
      action: 'View All'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {securityFeatures.map((feature) => (
          <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <feature.icon className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="font-medium">{feature.title}</p>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={feature.statusColor}>
                {feature.enabled ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {feature.status}
              </Badge>
              {feature.id === 'twoFactor' && !feature.enabled ? (
                <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
                  <DialogTrigger asChild>
                    <Button size="sm">{feature.action}</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
                      <DialogDescription>
                        Enhance your account security with 2FA using your mobile device
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                          <span className="text-slate-500">QR Code Placeholder</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Scan this QR code with your authenticator app
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1">Continue</Button>
                        <Button variant="outline" onClick={() => setShowTwoFactorSetup(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  {feature.action}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}