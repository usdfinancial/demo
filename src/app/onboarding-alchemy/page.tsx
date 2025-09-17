'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { AlchemyOnboardingFlow } from '@/components/onboarding/AlchemyOnboardingFlow'

export const dynamic = 'force-dynamic'

export default function AlchemyOnboardingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useEnhancedAuth()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // During SSR, just show the onboarding flow
  if (!isMounted) {
    return <AlchemyOnboardingFlow />
  }
  
  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Don't show onboarding if already authenticated
  if (isAuthenticated) {
    return null
  }

  return <AlchemyOnboardingFlow />
}