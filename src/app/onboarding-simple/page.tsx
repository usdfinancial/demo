'use client'

import { ClientOnly } from '@/components/ui/client-only'
import { SimpleOnboardingFlow } from '@/components/onboarding/SimpleOnboardingFlow'

export const dynamic = 'force-dynamic'

// Loading fallback for SSR
const OnboardingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

export default function SimpleOnboardingPage() {
  return (
    <ClientOnly fallback={<OnboardingFallback />}>
      <SimpleOnboardingFlow />
    </ClientOnly>
  )
}