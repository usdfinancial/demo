'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, Shield, Zap, LogOut, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatTimeRemaining, type SessionWarning } from '@/hooks/useSessionManager'

interface SessionWarningDialogProps {
  warning: SessionWarning | null
  isOpen: boolean
  onExtendSession: () => void
  onDismiss: () => void
  onLogoutNow: () => void
  userName?: string
  userEmail?: string
}

export function SessionWarningDialog({
  warning,
  isOpen,
  onExtendSession,
  onDismiss,
  onLogoutNow,
  userName,
  userEmail
}: SessionWarningDialogProps) {
  const [countdownTime, setCountdownTime] = useState(warning?.timeRemaining || 0)

  // Update countdown every second
  useEffect(() => {
    if (!warning || !isOpen) return

    setCountdownTime(warning.timeRemaining)

    const interval = setInterval(() => {
      setCountdownTime(prev => {
        const newTime = Math.max(0, prev - 1000)
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [warning, isOpen])

  if (!warning || !isOpen) return null

  const isFinalWarning = warning.type === 'final-warning'
  const progress = warning.timeRemaining > 0 ? Math.max(0, 100 - ((warning.timeRemaining / (isFinalWarning ? 60000 : 300000)) * 100)) : 100

  const getWarningConfig = () => {
    switch (warning.type) {
      case 'final-warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          title: 'Session Expiring Soon!',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          urgency: 'high' as const
        }
      case 'idle-warning':
        return {
          icon: Clock,
          iconColor: 'text-orange-600',
          title: 'Session Timeout Warning',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200', 
          textColor: 'text-orange-800',
          urgency: 'medium' as const
        }
      default:
        return {
          icon: Clock,
          iconColor: 'text-yellow-600',
          title: 'Session Notice',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          urgency: 'low' as const
        }
    }
  }

  const config = getWarningConfig()
  const Icon = config.icon

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
            <span>{config.title}</span>
            <Badge className={`${config.bgColor} ${config.textColor}`}>
              {config.urgency.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Your USD Financial session will expire due to inactivity
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* User Info */}
          {(userName || userEmail) && (
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userName ? userName[0].toUpperCase() : userEmail?.[0].toUpperCase()}
                </div>
                <div>
                  {userName && <div className="text-sm font-medium">{userName}</div>}
                  {userEmail && <div className="text-xs text-gray-600">{userEmail}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className={`h-4 w-4 ${config.iconColor}`} />
                <span className={`text-sm font-medium ${config.textColor}`}>Time Remaining</span>
              </div>
              <div className={`text-lg font-bold ${config.textColor}`}>
                {formatTimeRemaining(countdownTime)}
              </div>
            </div>
            
            <Progress 
              value={progress} 
              className={`w-full h-2 ${isFinalWarning ? 'bg-red-100' : 'bg-orange-100'}`}
            />
            
            <div className={`text-xs ${config.textColor} mt-2`}>
              {isFinalWarning 
                ? 'Your session will expire automatically. All unsaved changes will be lost.'
                : 'Click "Stay Logged In" to extend your session.'
              }
            </div>
          </div>

          {/* Security Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium text-blue-800">Security Notice</div>
                <div className="text-xs text-blue-700">
                  USD Financial automatically logs you out after periods of inactivity to protect your account and sensitive financial data.
                </div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-gray-50 border rounded-lg p-3">
            <div className="text-sm font-medium text-gray-800 mb-2">What happens when your session expires:</div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• You'll be automatically logged out</li>
              <li>• All sensitive data will be cleared from this device</li>
              <li>• Any unsaved changes will be lost</li>
              <li>• Your account will remain secure</li>
              <li>• You can log back in anytime</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          {warning.canExtend && (
            <Button 
              onClick={onExtendSession}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Stay Logged In
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onLogoutNow}
            className="flex-1"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Now
          </Button>
          
          {!isFinalWarning && (
            <Button 
              variant="ghost" 
              onClick={onDismiss}
              className="text-xs px-3"
            >
              Dismiss
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SessionWarningDialog