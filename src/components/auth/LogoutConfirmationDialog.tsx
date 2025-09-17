'use client'

import React, { useState } from 'react'
import { LogOut, Shield, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
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

interface LogoutConfirmationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirmLogout: () => Promise<void>
  userEmail?: string
  userName?: string
  sessionStartTime?: Date
}

export function LogoutConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirmLogout,
  userEmail,
  userName,
  sessionStartTime
}: LogoutConfirmationDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutStep, setLogoutStep] = useState<'confirm' | 'processing' | 'complete'>('confirm')
  const [progress, setProgress] = useState(0)

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    setLogoutStep('processing')
    setProgress(0)

    try {
      // Simulate secure logout process with progress steps
      const steps = [
        { message: 'Securing your session...', duration: 800 },
        { message: 'Clearing sensitive data...', duration: 600 },
        { message: 'Finalizing logout...', duration: 400 }
      ]

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        setProgress(((i + 1) / steps.length) * 100)
        
        if (i === steps.length - 1) {
          // Perform actual logout on the last step
          await onConfirmLogout()
        }
        
        await new Promise(resolve => setTimeout(resolve, step.duration))
      }

      setLogoutStep('complete')
      
      // Brief completion state before closing
      setTimeout(() => {
        onOpenChange(false)
        // Reset state for next time
        setTimeout(() => {
          setIsLoggingOut(false)
          setLogoutStep('confirm')
          setProgress(0)
        }, 300)
      }, 1000)
      
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
      setLogoutStep('confirm')
      setProgress(0)
    }
  }

  const handleCancel = () => {
    if (!isLoggingOut) {
      onOpenChange(false)
    }
  }

  const getDialogContent = () => {
    switch (logoutStep) {
      case 'processing':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Securing Your Session</span>
              </DialogTitle>
              <DialogDescription>
                Please wait while we safely log you out of USD Financial...
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Logout Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-800">
                    {progress < 33 ? 'Securing your session...' :
                     progress < 66 ? 'Clearing sensitive data...' :
                     'Finalizing logout...'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )

      case 'complete':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Logout Complete</span>
              </DialogTitle>
              <DialogDescription>
                You have been safely logged out of USD Financial.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Session Secured</span>
                </div>
                <p className="text-sm text-green-700">
                  Your account data has been protected and all active sessions have been terminated.
                </p>
              </div>
            </div>
          </>
        )

      default:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <LogOut className="h-5 w-5 text-orange-600" />
                <span>Confirm Logout</span>
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to log out of USD Financial?
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

              {/* Security Notice */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-orange-800">Security Notice</div>
                    <div className="text-xs text-orange-700">
                      Logging out will end your session and clear all sensitive data from this device.
                      Any unsaved changes may be lost.
                    </div>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-blue-800">What happens next?</div>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Your session will be securely terminated</li>
                      <li>• Account data will be cleared from this device</li>
                      <li>• You'll be redirected to the login page</li>
                      <li>• Your account remains fully protected</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {sessionStartTime 
                      ? `Session active for ${Math.round((Date.now() - sessionStartTime.getTime()) / 60000)} minutes`
                      : 'Session will expire automatically in 30 minutes if inactive'
                    }
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoggingOut}
              >
                Stay Logged In
              </Button>
              <Button 
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Yes, Log Out
              </Button>
            </DialogFooter>
          </>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        {getDialogContent()}
      </DialogContent>
    </Dialog>
  )
}

export default LogoutConfirmationDialog