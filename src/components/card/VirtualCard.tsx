'use client'

import { Wifi, DollarSign, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getStablecoinIcon } from '@/lib/data'

interface VirtualCardProps {
  cardNumber?: string
  cardHolder?: string
  expiryDate?: string
  className?: string
  balance?: number
  primaryStablecoin?: string
}

export function VirtualCard({ 
  cardNumber = "•••• •••• •••• 1234",
  cardHolder = "Alex Johnson",
  expiryDate = "12/28",
  className = "",
  balance = 0,
  primaryStablecoin = "USDC"
}: VirtualCardProps) {
  return (
    <Card className={`overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 border-0 shadow-2xl ${className}`}>
      <CardContent className="p-8 text-white relative h-64 flex flex-col justify-between">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="absolute top-4 right-4 opacity-10">
          <div className="text-6xl">{getStablecoinIcon(primaryStablecoin as any)}</div>
        </div>
        
        {/* Top Row */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="space-y-1">
            <div className="text-xs text-white/60 font-medium tracking-wider">USD FINANCIAL</div>
            <div className="text-sm text-emerald-200 font-medium flex items-center gap-1">
              <Shield className="h-3 w-3" />
              STABLECOIN CARD
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-white/60" />
            <div className="text-xs text-emerald-200 font-medium">STABLE</div>
          </div>
        </div>
        
        {/* Balance Display */}
        <div className="relative z-10">
          <div className="text-xs text-white/60 mb-1 font-medium tracking-wider">AVAILABLE BALANCE</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-lg">{getStablecoinIcon(primaryStablecoin as any)}</span>
            <span className="text-sm text-emerald-200 font-medium">{primaryStablecoin}</span>
          </div>
        </div>
        
        {/* Card Number */}
        <div className="relative z-10">
          <div className="text-xl font-mono tracking-widest text-white/90 mb-2">
            {cardNumber}
          </div>
          <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
        </div>
        
        {/* Bottom Row */}
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <div className="text-xs text-white/60 mb-1 font-medium tracking-wider">CARD HOLDER</div>
            <div className="font-medium text-white/90">{cardHolder}</div>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1 font-medium tracking-wider">EXPIRES</div>
            <div className="font-medium text-white/90">{expiryDate}</div>
          </div>
        </div>
        
        {/* Chip */}
        <div className="absolute top-28 left-8 w-12 h-8 rounded-md bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
          <DollarSign className="h-4 w-4 text-emerald-900" />
        </div>
        
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000" />
      </CardContent>
    </Card>
  )
}