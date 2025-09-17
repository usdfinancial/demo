'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Shield, 
  Zap, 
  Wallet,
  ArrowRight,
  Globe
} from 'lucide-react'

export function AlchemyOnboardingFlow() {
  const router = useRouter()

  // Redirect to working simple onboarding immediately
  useEffect(() => {
    router.push('/onboarding-simple')
  }, [router])

  const handleGetStarted = () => {
    router.push('/onboarding-simple')
  }

  // Show a simple redirect message
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">UF</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
            USD Financial
          </CardTitle>
          <CardDescription className="text-slate-600">
            Redirecting to authentication...
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button
            onClick={handleGetStarted}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-6 text-lg gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Continue to Sign In
            <ArrowRight className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}