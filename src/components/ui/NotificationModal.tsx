'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Amount Display */}
          {amount && currency && (
            <div className={`relative overflow-hidden bg-gradient-to-br ${config.bgGradient} rounded-2xl p-6 border ${config.borderColor}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full opacity-30 -translate-y-12 translate-x-12"></div>
              <div className="relative text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className={`w-5 h-5 ${config.iconColor}`} />
                  <Badge className={config.badgeColor}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-gray-900">{amount}</p>
                <p className="text-lg text-gray-700">{currency}</p>
              </div>
            </div>
          )}

          {/* Details List */}
          {details && details.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Transaction Details:</h4>
              <div className="space-y-2">
                {details.map((detail, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Demo Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Demo Experience</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  This is a demonstration of USD Financial's {type} functionality. 
                  In production, this would execute real blockchain transactions with your USDC balance.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {showCopy && copyText && (
              <Button 
                onClick={handleCopy}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Details'}
              </Button>
            )}
            
            {onAction && actionLabel && (
              <Button 
                onClick={onAction}
                variant="outline"
                className="flex-1"
              >
                {actionLabel}
              </Button>
            )}
            
            <Button 
              onClick={() => onOpenChange(false)} 
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
