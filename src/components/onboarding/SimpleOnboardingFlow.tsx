'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSimpleAccountKit } from '@/contexts/SimpleAccountKitProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Wallet,
  Globe,
  RefreshCw
} from 'lucide-react'
import { AlchemyAuthButton } from '@/components/auth/AlchemyAuthButton'

export function SimpleOnboardingFlow() {
  const router = useRouter()
  const { 
    isLoading,
    user,
    isAuthenticated,
    smartAccountAddress,
    smartAccountBalance
  } = useSimpleAccountKit()

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])


  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string | null) => {
    if (!balance || balance === '0') return '0.0000'
    return parseFloat(balance).toFixed(4)
  }

  // If authenticated and has user, show success state
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome to USD Financial!</CardTitle>
            <CardDescription>
              Your smart account is ready. Enjoy gasless transactions and enhanced security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account</span>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {user.authType === 'email' && '📧'}
                    {user.authType === 'social' && '🔗'}
                    {user.authType === 'passkey' && '🔑'}
                    {user.authType?.charAt(0).toUpperCase() + user.authType?.slice(1)}
                  </Badge>
                </div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            {/* Smart Account Info */}
            {smartAccountAddress && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Smart Account
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Address</span>
                    <span className="text-sm font-mono">{formatAddress(smartAccountAddress)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Balance</span>
                    <span className="text-sm font-medium">{formatBalance(smartAccountBalance)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Network</span>
                    <span className="text-sm">Sepolia Testnet</span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white gap-2"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Default welcome screen with Alchemy authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome to USD Financial</CardTitle>
            <CardDescription className="text-lg mt-2">
              Experience the future of financial services with smart accounts
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <Zap className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-900">Gasless Transactions</p>
                <p className="text-sm text-emerald-700">No more gas fees or complex wallet management</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Enhanced Security</p>
                <p className="text-sm text-blue-700">Smart contract protection with social recovery</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Web2 Experience</p>
                <p className="text-sm text-purple-700">Familiar login methods, blockchain benefits</p>
              </div>
            </div>
          </div>
          
          <AlchemyAuthButton 
            className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white gap-2"
            size="lg"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </AlchemyAuthButton>
        </CardContent>
      </Card>
    </div>
  )
}