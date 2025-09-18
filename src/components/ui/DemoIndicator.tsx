'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemoIndicatorProps {
  className?: string
  variant?: 'default' | 'minimal' | 'floating'
  showTooltip?: boolean
}

export function DemoIndicator({ 
  className, 
  variant = 'default',
  showTooltip = true 
}: DemoIndicatorProps) {
  const baseClasses = "absolute top-3 right-3 z-50 select-none"
  
  if (variant === 'minimal') {
    return (
      <div className={cn(baseClasses, className)}>
        <Badge 
          variant="secondary" 
          className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200 text-xs font-medium px-2 py-1 shadow-sm"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Demo
        </Badge>
      </div>
    )
  }

  if (variant === 'floating') {
    return (
      <div className={cn(baseClasses, className)}>
        <div className="group relative">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/20 backdrop-blur-sm flex items-center gap-1.5 hover:shadow-xl transition-all duration-200">
            <Sparkles className="h-3 w-3" />
            <span>Demo Mode</span>
          </div>
          {showTooltip && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Demo Environment</p>
                  <p className="text-slate-300">This is a demonstration. No real transactions are processed.</p>
                </div>
              </div>
              <div className="absolute -top-1 right-3 w-2 h-2 bg-slate-900 rotate-45"></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn(baseClasses, className)}>
      <div className="group relative">
        <Badge 
          variant="secondary" 
          className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200 text-xs font-medium px-2.5 py-1 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-help"
        >
          <Sparkles className="h-3 w-3 mr-1.5" />
          Demo
        </Badge>
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 w-44 bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Demo Mode</p>
                <p className="text-slate-300">Simulated environment for demonstration purposes</p>
              </div>
            </div>
            <div className="absolute -top-1 right-3 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        )}
      </div>
    </div>
  )
}

// Convenience component for modal containers
export function DemoModal({ 
  children, 
  className,
  demoVariant = 'default',
  showDemoTooltip = true,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  demoVariant?: 'default' | 'minimal' | 'floating'
  showDemoTooltip?: boolean
}) {
  return (
    <div className={cn("relative", className)} {...props}>
      <DemoIndicator 
        variant={demoVariant} 
        showTooltip={showDemoTooltip}
      />
      {children}
    </div>
  )
}
