'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSimpleAccountKit } from '@/contexts/SimpleAccountKitProvider'
import { RefreshCw } from 'lucide-react'

export default function OnboardingDemoPage() {
  const { isAuthenticated, isLoading } = useSimpleAccountKit()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding-simple')
      }
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-600" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">USD Financial</h1>
        <p className="text-gray-600">Loading your account...</p>
      </div>
    </div>
  )
}