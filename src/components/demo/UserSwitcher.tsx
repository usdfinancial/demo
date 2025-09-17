'use client'

import React, { useState } from 'react'
import { User, ChevronDown, LogOut, Users, Building, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { demoUsers } from '@/lib/demoUsers'

export function UserSwitcher() {
  const { user, switchUser } = useEnhancedAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleUserSwitch = (newUser: any) => {
    // Call switchUser with the new user for demo mode
    if (typeof switchUser === 'function') {
      switchUser(newUser)
    }
    setIsOpen(false)
  }

  const getUserTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'business': return <Building className="h-4 w-4" />
      case 'premium': return <Crown className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getUserTypeBadge = (accountType: string) => {
    switch (accountType) {
      case 'business': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          {getUserTypeIcon(user.accountType)}
          <span className="truncate">{user.name}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 w-80 z-50 shadow-lg border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Switch Demo User
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Experience USD Financial from different user perspectives
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoUsers.map((demoUser) => (
              <div
                key={demoUser.email}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-emerald-50 ${
                  user.email === demoUser.email ? 'bg-emerald-50 border-emerald-200' : 'border-gray-200'
                }`}
                onClick={() => handleUserSwitch(demoUser)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getUserTypeIcon(demoUser.accountType)}
                    <span className="font-medium text-sm">{demoUser.name}</span>
                  </div>
                  <Badge className={`text-xs ${getUserTypeBadge(demoUser.accountType)}`}>
                    {demoUser.accountType}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {demoUser.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  {demoUser.description}
                </div>
              </div>
            ))}
            
            <Separator className="my-3" />
            
            <div className="text-center">
              <Badge variant="secondary" className="text-xs">
                🚀 Demo Mode - All data is simulated
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
