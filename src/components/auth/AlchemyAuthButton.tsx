'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAlchemyAuth } from '@/hooks/useAlchemyAuth'
import { LogoutConfirmationDialog } from '@/components/auth/LogoutConfirmationDialog'
import { Sparkles, RefreshCw, LogOut } from 'lucide-react'

interface AlchemyAuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function AlchemyAuthButton({ 
  variant = 'default', 
  size = 'default',
  className = '',
  children 
}: AlchemyAuthButtonProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    user,
    authenticate,
    signOut 
  } = useAlchemyAuth()
  
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true)
  }

  const handleConfirmLogout = async () => {
    await signOut()
  }

  if (isAuthenticated && user) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={handleLogoutClick}
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
        
        <LogoutConfirmationDialog
          isOpen={isLogoutDialogOpen}
          onOpenChange={setIsLogoutDialogOpen}
          onConfirmLogout={handleConfirmLogout}
          userEmail={user.email}
          userName={user.name}
        />
      </>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => authenticate('/dashboard')} // Use unified auth method
      disabled={isLoading}
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      {children || (isLoading ? 'Connecting...' : 'Get Started')}
    </Button>
  )
}