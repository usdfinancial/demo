'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAlchemyAuth } from '@/hooks/useAlchemyAuth'
import { Loader2, Shield, User, LogIn } from 'lucide-react'

interface UnifiedAuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
  redirectTo?: string
  showIcon?: boolean
  fullWidth?: boolean
}

export function UnifiedAuthButton({ 
  variant = 'default',
  size = 'md',
  className = '',
  children,
  redirectTo = '/dashboard',
  showIcon = true,
  fullWidth = false
}: UnifiedAuthButtonProps) {
  const { authenticate, isAuthenticated, isLoading, user } = useAlchemyAuth()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Already authenticated, redirect to dashboard or specified route
      window.location.href = redirectTo
      return
    }

    setIsAuthenticating(true)
    try {
      await authenticate(redirectTo)
    } catch (error) {
      console.error('Authentication error:', error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-6',
    lg: 'h-12 px-8 text-lg'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }

  if (isAuthenticated && user) {
    return (
      <Button
        variant={variant}
        onClick={handleAuth}
        className={`${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        {showIcon && <User className={`${iconSizes[size]} mr-2`} />}
        {children || `Continue as ${user.name || 'User'}`}
      </Button>
    )
  }

  const isLoadingState = isLoading || isAuthenticating

  return (
    <Button
      variant={variant}
      onClick={handleAuth}
      disabled={isLoadingState}
      className={`
        ${sizeClasses[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${variant === 'default' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200' : ''}
        ${className}
      `}
    >
      {isLoadingState ? (
        <>
          <Loader2 className={`${iconSizes[size]} mr-2 animate-spin`} />
          {children || 'Connecting...'}
        </>
      ) : (
        <>
          {showIcon && <LogIn className={`${iconSizes[size]} mr-2`} />}
          {children || 'Sign In to USD Financial'}
        </>
      )}
    </Button>
  )
}

// Preset button variations for common use cases
export function PrimaryAuthButton(props: Omit<UnifiedAuthButtonProps, 'variant'>) {
  return <UnifiedAuthButton variant="default" {...props} />
}

export function SecondaryAuthButton(props: Omit<UnifiedAuthButtonProps, 'variant'>) {
  return <UnifiedAuthButton variant="outline" {...props} />
}

export function FullWidthAuthButton(props: Omit<UnifiedAuthButtonProps, 'fullWidth'>) {
  return <UnifiedAuthButton fullWidth={true} {...props} />
}