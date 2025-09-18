'use client'

import React from 'react'
import { Sparkles, Eye, Play } from 'lucide-react'

export function DemoStripe() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] w-full h-8 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 overflow-hidden shadow-sm">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent animate-pulse" />
      
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 animate-shimmer" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center h-full px-4">
        <div className="flex items-center gap-2 text-white/95">
          <div className="flex items-center gap-1.5">
            <Play className="h-3 w-3 fill-white/90 text-white/90" />
            <span className="text-xs font-semibold tracking-wider">
              DEMO
            </span>
          </div>
          
          <span className="text-xs text-white/70 hidden sm:inline">
            |
          </span>
          
          <span className="text-xs text-white/85 hidden sm:inline font-medium">
            USD Financial
          </span>
          
          <span className="text-xs text-white/70 hidden md:inline">
            •
          </span>
          
          <span className="text-xs text-white/75 hidden md:inline">
            Interactive Demo Experience
          </span>
          
          <Sparkles className="h-3 w-3 ml-1 animate-pulse delay-700 text-white/80" />
        </div>
      </div>
      
      {/* Elegant bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {/* Subtle glow effect */}
      <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent blur-sm" />
    </div>
  )
}
