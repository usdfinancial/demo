'use client'

import React from 'react'
import { Clock, Shield, AlertTriangle, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTimeRemaining } from '@/hooks/useSessionManager'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'

interface SessionStatusIndicatorProps {
  className?: string
  showExtendButton?: boolean
}

export function SessionStatusIndicator({ 
  className = '',
  showExtendButton = true 
}: SessionStatusIndicatorProps) {
  const { 
    isAuthenticated, 
    currentSessionWarning, 
    timeUntilSessionExpiry, 
    extendSession 
  } = useEnhancedAuth()

  if (!isAuthenticated) return null

  // Don't show if more than 10 minutes remaining and no warning
  if (!currentSessionWarning && timeUntilSessionExpiry > 10 * 60 * 1000) {
    return null
  }

  const getStatusConfig = () => {
    if (currentSessionWarning) {
      switch (currentSessionWarning.type) {
        case 'final-warning':
          return {
            icon: AlertTriangle,
            color: 'bg-red-100 text-red-800 border-red-200',
            textColor: 'text-red-700',
            iconColor: 'text-red-600'
          }
        case 'idle-warning':
          return {
            icon: Clock,
            color: 'bg-orange-100 text-orange-800 border-orange-200', 
            textColor: 'text-orange-700',
            iconColor: 'text-orange-600'
          }
        default:
          return {
            icon: Clock,
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            textColor: 'text-yellow-700',
            iconColor: 'text-yellow-600'
          }
      }
    }

    // Warning when under 10 minutes but no formal warning yet
    if (timeUntilSessionExpiry <= 10 * 60 * 1000) {
      return {
        icon: Clock,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600'
      }
    }

    return {
      icon: Shield,
      color: 'bg-green-100 text-green-800 border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-600'
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const timeRemaining = currentSessionWarning?.timeRemaining || timeUntilSessionExpiry
  const formattedTime = formatTimeRemaining(Math.max(0, timeRemaining))

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge className={`${config.color} border flex items-center space-x-1 px-2 py-1`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        <span className="text-xs font-medium">
          {currentSessionWarning ? 'Session expires in ' : 'Active: '}
          {formattedTime}
        </span>
      </Badge>
      
      {showExtendButton && currentSessionWarning && (
        <Button
          size="sm"
          variant="outline"
          onClick={extendSession}
          className="h-6 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <Zap className="h-3 w-3 mr-1" />
          Extend
        </Button>
      )}
    </div>
  )
}

export default SessionStatusIndicator