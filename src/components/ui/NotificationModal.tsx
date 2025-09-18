'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DemoIndicator } from '@/components/ui/DemoIndicator'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Sparkles,
  TrendingUp,
  DollarSign,
  Shield,
  Zap,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Copy
} from 'lucide-react'

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info'
  | 'swap'
  | 'investment'
  | 'defi'
  | 'loan'
  | 'insurance'
  | 'transaction'
  | 'card'

export interface NotificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: NotificationType
  title: string
  message: string
  details?: string[]
  amount?: string
  currency?: string
  actionLabel?: string
  onAction?: () => void
  showCopy?: boolean
  copyText?: string
}

const getNotificationConfig = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        iconColor: 'text-green-600',
        bgGradient: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        badgeColor: 'bg-green-100 text-green-800'
      }
    case 'error':
      return {
        icon: XCircle,
        iconColor: 'text-red-600',
        bgGradient: 'from-red-50 to-pink-50',
        borderColor: 'border-red-200',
        badgeColor: 'bg-red-100 text-red-800'
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-yellow-600',
        bgGradient: 'from-yellow-50 to-orange-50',
        borderColor: 'border-yellow-200',
        badgeColor: 'bg-yellow-100 text-yellow-800'
      }
    case 'swap':
      return {
        icon: ArrowUpRight,
        iconColor: 'text-blue-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800'
      }
    case 'investment':
      return {
        icon: TrendingUp,
        iconColor: 'text-emerald-600',
        bgGradient: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-200',
        badgeColor: 'bg-emerald-100 text-emerald-800'
      }
    case 'defi':
      return {
        icon: Zap,
        iconColor: 'text-purple-600',
        bgGradient: 'from-purple-50 to-indigo-50',
        borderColor: 'border-purple-200',
        badgeColor: 'bg-purple-100 text-purple-800'
      }
    case 'loan':
      return {
        icon: DollarSign,
        iconColor: 'text-green-600',
        bgGradient: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        badgeColor: 'bg-green-100 text-green-800'
      }
    case 'insurance':
      return {
        icon: Shield,
        iconColor: 'text-blue-600',
        bgGradient: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800'
      }
    case 'transaction':
      return {
        icon: Activity,
        iconColor: 'text-indigo-600',
        bgGradient: 'from-indigo-50 to-purple-50',
        borderColor: 'border-indigo-200',
        badgeColor: 'bg-indigo-100 text-indigo-800'
      }
    case 'card':
      return {
        icon: Shield,
        iconColor: 'text-orange-600',
        bgGradient: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-200',
        badgeColor: 'bg-orange-100 text-orange-800'
      }
    default:
      return {
        icon: Info,
        iconColor: 'text-blue-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800'
      }
  }
}

export function NotificationModal({
  open,
  onOpenChange,
  type,
  title,
  message,
  details,
  amount,
  currency,
  actionLabel,
  onAction,
  showCopy,
  copyText
}: NotificationModalProps) {
  const [copied, setCopied] = useState(false)
  const config = getNotificationConfig(type)
  const Icon = config.icon

  const handleCopy = async () => {
    if (copyText) {
      try {
        await navigator.clipboard.writeText(copyText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-lg max-h-[80vh] overflow-hidden"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 200,
          margin: 0
        }}
      >
        <DemoIndicator variant="minimal" />
        <DialogHeader className="text-center pb-4">
          <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${config.bgGradient} rounded-2xl flex items-center justify-center mb-4 border-2 ${config.borderColor} shadow-lg`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 mt-1">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-1">
          {/* Amount Display */}
          {amount && currency && (
            <div className={`relative overflow-hidden bg-gradient-to-br ${config.bgGradient} rounded-xl p-4 border ${config.borderColor}`}>
              <div className="relative text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className={`w-4 h-4 ${config.iconColor}`} />
                  <Badge className={`${config.badgeColor} text-xs`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{amount}</p>
                <p className="text-sm text-gray-700">{currency}</p>
              </div>
            </div>
          )}

          {/* Details List - Compact Version */}
          {details && details.length > 0 && (
            <div className="space-y-3">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {details.slice(0, 8).map((detail, index) => {
                  // Skip empty lines in compact mode
                  if (detail.trim() === '') {
                    return null
                  }
                  
                  // Handle section headers (lines ending with colon)
                  if (detail.endsWith(':')) {
                    return (
                      <div key={index} className="font-semibold text-gray-900 text-sm mt-2 mb-1">
                        {detail}
                      </div>
                    )
                  }
                  
                  // Handle bullet points - more compact
                  if (detail.startsWith('•')) {
                    return (
                      <div key={index} className="flex items-start gap-2 pl-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-xs text-gray-700 leading-relaxed">{detail.substring(1).trim()}</p>
                      </div>
                    )
                  }
                  
                  // Regular details - more compact
                  return (
                    <div key={index} className={`flex items-start gap-2 p-3 bg-gradient-to-r ${config.bgGradient} rounded-lg border ${config.borderColor}`}>
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-800 leading-relaxed font-medium">{detail}</p>
                    </div>
                  )
                })}
                {details.length > 8 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{details.length - 8} more details available
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Demo Notice - Compact */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                Demo: USD Financial {type} functionality showcase
              </p>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 pt-2">
            {showCopy && copyText && (
              <Button 
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-9"
              >
                <Copy className="w-3 h-3 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
            
            {onAction && actionLabel && (
              <Button 
                onClick={onAction}
                variant="outline"
                size="sm"
                className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-9"
              >
                {actionLabel}
              </Button>
            )}
            
            <Button 
              onClick={() => onOpenChange(false)} 
              size="sm"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg h-9 font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
