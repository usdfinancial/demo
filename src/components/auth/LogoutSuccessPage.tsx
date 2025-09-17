'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Shield, Clock, ArrowRight, Smartphone, Lock, Eye, Mail, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function LogoutSuccessPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const isSessionExpired = reason === 'session-expired'
  
  const getLogoutInfo = () => {
    if (isSessionExpired) {
      return {
        icon: AlertTriangle,
        iconColor: 'text-orange-600',
        title: 'Session Expired - Logged Out',
        description: 'You were automatically logged out due to inactivity',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        message: 'Your session expired automatically after 30 minutes of inactivity to protect your account security.'
      }
    }
    
    return {
      icon: CheckCircle2,
      iconColor: 'text-green-600', 
      title: 'Successfully Logged Out',
      description: 'You have been safely logged out of USD Financial',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      message: 'You have manually logged out and your session has been terminated securely.'
    }
  }

  const logoutInfo = getLogoutInfo()

  const securityTips = [
    {
      icon: Lock,
      title: "Use Strong Passwords",
      description: "Always use unique, complex passwords for your USD Financial account"
    },
    {
      icon: Smartphone,
      title: "Enable Two-Factor Authentication",
      description: "Add an extra layer of security to protect your account"
    },
    {
      icon: Eye,
      title: "Monitor Your Account",
      description: "Regularly check your account statements and transaction history"
    },
    {
      icon: Mail,
      title: "Verify Communications",
      description: "USD Financial will never ask for passwords or sensitive info via email"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Success Card */}
        <Card className={`text-center ${logoutInfo.borderColor} shadow-lg border`}>
          <CardHeader className="pb-4">
            <div className={`mx-auto w-16 h-16 ${logoutInfo.bgColor} rounded-full flex items-center justify-center mb-4`}>
              <logoutInfo.icon className={`h-8 w-8 ${logoutInfo.iconColor}`} />
            </div>
            <CardTitle className="text-2xl text-gray-900">{logoutInfo.title}</CardTitle>
            <CardDescription className="text-lg">
              {logoutInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Summary */}
            <div className={`${logoutInfo.bgColor} border ${logoutInfo.borderColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className={`h-4 w-4 ${logoutInfo.iconColor}`} />
                  <span className={`font-medium ${logoutInfo.textColor}`}>Session Secured</span>
                </div>
                <Badge className={`${logoutInfo.bgColor} ${logoutInfo.textColor}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {currentTime.toLocaleTimeString()}
                </Badge>
              </div>
              <div className={`mt-2 text-sm ${logoutInfo.textColor}`}>
                {logoutInfo.message}
              </div>
            </div>

            {/* What We've Done */}
            <div className="text-left space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">What we've secured:</h3>
              <div className="grid gap-2">
                {[
                  'Cleared all session data from this browser',
                  'Invalidated authentication tokens',
                  'Removed cached balance and transaction data',
                  'Protected your account from unauthorized access'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1">
                <Link href="/">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Return to Homepage
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">
                  Log In Again
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Keep Your Account Secure</span>
            </CardTitle>
            <CardDescription>
              Follow these best practices to protect your USD Financial account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {securityTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <tip.icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm text-gray-900">{tip.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{tip.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            For support or security concerns, contact us at{' '}
            <a href="mailto:info@usdfinancial.com" className="text-blue-600 hover:underline">
              security@usdfinancial.com
            </a>
          </p>
          <p className="mt-1">
            © 2025 USD Financial. Your financial security is our priority.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LogoutSuccessPage