'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface SessionWarning {
  type: 'idle-warning' | 'token-expiry' | 'final-warning'
  timeRemaining: number
  message: string
  canExtend: boolean
}

export interface SessionManagerConfig {
  // Session timeouts in milliseconds
  idleTimeout: number          // Time until session expires due to inactivity (default: 30 minutes)
  warningTime: number          // Time before expiry to show first warning (default: 5 minutes)
  finalWarningTime: number     // Time before expiry to show final warning (default: 1 minute)
  extendSessionTime: number    // Additional time when extending session (default: 30 minutes)
  checkInterval: number        // How often to check session status (default: 30 seconds)
  
  // Callbacks
  onWarning?: (warning: SessionWarning) => void
  onSessionExpired?: () => void
  onSessionExtended?: () => void
  onLogout?: () => Promise<void>
}

const DEFAULT_CONFIG: SessionManagerConfig = {
  idleTimeout: 30 * 60 * 1000,      // 30 minutes
  warningTime: 5 * 60 * 1000,       // 5 minutes before expiry
  finalWarningTime: 60 * 1000,      // 1 minute before expiry
  extendSessionTime: 30 * 60 * 1000, // Extend by 30 minutes
  checkInterval: 30 * 1000,          // Check every 30 seconds
}

export function useSessionManager(
  isAuthenticated: boolean,
  config: Partial<SessionManagerConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const router = useRouter()
  
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [sessionStartTime] = useState<number>(Date.now())
  const [currentWarning, setCurrentWarning] = useState<SessionWarning | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number>(fullConfig.idleTimeout)
  
  const lastActivityRef = useRef(lastActivity)
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const activityListenersSetupRef = useRef(false)

  // Update last activity time
  const updateActivity = useCallback(() => {
    const now = Date.now()
    setLastActivity(now)
    lastActivityRef.current = now
    
    // Clear any existing warnings when user is active
    if (currentWarning) {
      setCurrentWarning(null)
    }
  }, [currentWarning])

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated || activityListenersSetupRef.current) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const throttledUpdateActivity = throttle(updateActivity, 1000) // Throttle to once per second
    
    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, true)
    })
    
    activityListenersSetupRef.current = true

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity, true)
      })
      activityListenersSetupRef.current = false
    }
  }, [isAuthenticated, updateActivity])

  // Session monitoring loop
  useEffect(() => {
    if (!isAuthenticated) {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current)
        sessionCheckIntervalRef.current = null
      }
      return
    }

    const checkSession = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current
      const timeUntilExpiry = fullConfig.idleTimeout - timeSinceLastActivity
      
      setTimeUntilExpiry(timeUntilExpiry)

      // Session has expired
      if (timeSinceLastActivity >= fullConfig.idleTimeout) {
        setIsSessionExpired(true)
        setCurrentWarning(null)
        fullConfig.onSessionExpired?.()
        handleAutoLogout()
        return
      }

      // Final warning (1 minute or less)
      if (timeUntilExpiry <= fullConfig.finalWarningTime && timeUntilExpiry > 0) {
        const warning: SessionWarning = {
          type: 'final-warning',
          timeRemaining: timeUntilExpiry,
          message: `Your session will expire in ${Math.ceil(timeUntilExpiry / 1000)} seconds due to inactivity. All unsaved changes will be lost.`,
          canExtend: true
        }
        setCurrentWarning(warning)
        fullConfig.onWarning?.(warning)
      }
      // Regular warning (5 minutes or less)
      else if (timeUntilExpiry <= fullConfig.warningTime && timeUntilExpiry > fullConfig.finalWarningTime) {
        const warning: SessionWarning = {
          type: 'idle-warning',
          timeRemaining: timeUntilExpiry,
          message: `Your session will expire in ${Math.ceil(timeUntilExpiry / (60 * 1000))} minutes due to inactivity.`,
          canExtend: true
        }
        setCurrentWarning(warning)
        fullConfig.onWarning?.(warning)
      }
    }

    // Initial check
    checkSession()
    
    // Set up interval
    sessionCheckIntervalRef.current = setInterval(checkSession, fullConfig.checkInterval)

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current)
        sessionCheckIntervalRef.current = null
      }
    }
  }, [isAuthenticated, fullConfig])

  // Handle auto-logout
  const handleAutoLogout = useCallback(async () => {
    try {
      console.log('🔒 Auto-logout triggered due to session expiry')
      
      if (fullConfig.onLogout) {
        await fullConfig.onLogout()
      }
      
      // Redirect to landing page instead of logout success page for better UX
      // Use window.location.href for reliable redirect when session is expired
      window.location.href = '/'
    } catch (error) {
      console.error('Auto-logout failed:', error)
      // Fallback: redirect to landing page with full page reload
      window.location.href = '/'
    }
  }, [fullConfig])

  // Extend session
  const extendSession = useCallback(() => {
    updateActivity()
    setCurrentWarning(null)
    setIsSessionExpired(false)
    
    console.log(`✅ Session extended by ${fullConfig.extendSessionTime / (60 * 1000)} minutes`)
    fullConfig.onSessionExtended?.()
  }, [updateActivity, fullConfig])

  // Dismiss warning (user acknowledges but doesn't extend)
  const dismissWarning = useCallback(() => {
    setCurrentWarning(null)
  }, [])

  // Get session stats for display
  const getSessionStats = useCallback(() => {
    const now = Date.now()
    const sessionDuration = now - sessionStartTime
    const timeSinceLastActivity = now - lastActivity
    const remainingTime = Math.max(0, fullConfig.idleTimeout - timeSinceLastActivity)
    
    return {
      sessionDuration,
      timeSinceLastActivity,
      remainingTime,
      isExpired: isSessionExpired,
      hasWarning: !!currentWarning,
      sessionStartTime: new Date(sessionStartTime),
      lastActivity: new Date(lastActivity),
      expiryTime: new Date(lastActivity + fullConfig.idleTimeout)
    }
  }, [sessionStartTime, lastActivity, fullConfig.idleTimeout, isSessionExpired, currentWarning])

  return {
    currentWarning,
    timeUntilExpiry,
    isSessionExpired,
    sessionStats: getSessionStats(),
    extendSession,
    dismissWarning,
    updateActivity,
    handleAutoLogout
  }
}

// Utility function to throttle activity updates
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let previous = 0
  
  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now()
    
    if (!previous || now - previous >= wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func(...args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func(...args)
      }, wait - (now - previous))
    }
  }
}

// Utility to format time remaining
export function formatTimeRemaining(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds !== 1 ? 's' : ''}`
  }
  
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  if (minutes < 60) {
    return seconds > 0 
      ? `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0
    ? `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
    : `${hours} hour${hours !== 1 ? 's' : ''}`
}

export default useSessionManager