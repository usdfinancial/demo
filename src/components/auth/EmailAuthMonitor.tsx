'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock,
  User,
  Shield,
  ExternalLink,
  Bug
} from 'lucide-react'
import { useAccountKit } from '@/contexts/AccountKitContext'

interface EmailDeliveryStats {
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  successRate: string
  commonErrors: string[]
  problematicDomains: string[]
}

export function EmailAuthMonitor() {
  const { emailDebugLog, lastEmailAttempt, authenticate } = useAccountKit()
  const [testEmail, setTestEmail] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [stats, setStats] = useState<EmailDeliveryStats>({
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    successRate: '0%',
    commonErrors: [],
    problematicDomains: []
  })

  // Calculate statistics from debug log
  useEffect(() => {
    const total = emailDebugLog.length
    const successful = emailDebugLog.filter(log => log.success).length
    const failed = total - successful
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0'

    // Extract common errors
    const errors = emailDebugLog
      .filter(log => !log.success && log.error)
      .map(log => log.error!)
    const errorCounts = errors.reduce((acc, error) => {
      acc[error] = (acc[error] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const commonErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([error]) => error)

    // Extract problematic domains (domains with high failure rates)
    const domainResults = emailDebugLog.reduce((acc, log) => {
      // Extract domain from debug logs (this would need to be enhanced)
      const domain = 'unknown' // placeholder
      if (!acc[domain]) acc[domain] = { attempts: 0, failures: 0 }
      acc[domain].attempts++
      if (!log.success) acc[domain].failures++
      return acc
    }, {} as Record<string, { attempts: number; failures: number }>)

    const problematicDomains = Object.entries(domainResults)
      .filter(([, stats]) => stats.attempts >= 2 && (stats.failures / stats.attempts) > 0.5)
      .map(([domain]) => domain)
      .filter(domain => domain !== 'unknown')

    setStats({
      totalAttempts: total,
      successfulAttempts: successful,
      failedAttempts: failed,
      successRate: `${successRate}%`,
      commonErrors,
      problematicDomains
    })
  }, [emailDebugLog])

  const testEmailDelivery = async () => {
    if (!testEmail) return
    
    setIsTesting(true)
    try {
      await authenticate(testEmail)
    } catch (error) {
      console.error('Test email failed:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge className="bg-green-100 text-green-800">Success</Badge> : 
      <Badge className="bg-red-100 text-red-800">Failed</Badge>
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span>Email Authentication Monitor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-700">{stats.totalAttempts}</span>
              </div>
              <p className="text-sm text-blue-600">Total Attempts</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700">{stats.successfulAttempts}</span>
              </div>
              <p className="text-sm text-green-600">Successful</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-700">{stats.failedAttempts}</span>
              </div>
              <p className="text-sm text-red-600">Failed</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-700">{stats.successRate}</span>
              </div>
              <p className="text-sm text-purple-600">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Email Delivery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="w-5 h-5 text-orange-600" />
            <span>Test Email Delivery</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="Enter email to test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  disabled={isTesting}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={testEmailDelivery}
                  disabled={isTesting || !testEmail}
                  className="flex items-center space-x-2"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span>Test</span>
                </Button>
              </div>
            </div>

            {/* Last attempt result */}
            {lastEmailAttempt && (
              <Alert>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(lastEmailAttempt.success)}
                  <span className="font-medium">
                    Last Attempt: {lastEmailAttempt.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {lastEmailAttempt.error && (
                  <AlertDescription className="mt-2">
                    Error: {lastEmailAttempt.error}
                  </AlertDescription>
                )}
                {lastEmailAttempt.debugInfo && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <div>Attempt ID: {lastEmailAttempt.debugInfo.attemptId}</div>
                    <div>Timestamp: {formatTimestamp(lastEmailAttempt.debugInfo.timestamp)}</div>
                    <div>Email Format Valid: {lastEmailAttempt.debugInfo.emailFormatValid ? '✅' : '❌'}</div>
                    <div>Alchemy API Key: {lastEmailAttempt.debugInfo.alchemyApiKey ? '✅' : '❌'}</div>
                  </div>
                )}
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Common Issues */}
      {(stats.commonErrors.length > 0 || stats.problematicDomains.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span>Common Issues</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.commonErrors.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Most Common Errors:</h4>
                  <div className="space-y-1">
                    {stats.commonErrors.map((error, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {error}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {stats.problematicDomains.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Problematic Email Domains:</h4>
                  <div className="space-y-1">
                    {stats.problematicDomains.map((domain, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attempts Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span>Recent Authentication Attempts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailDebugLog.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No authentication attempts yet</p>
          ) : (
            <div className="space-y-3">
              {emailDebugLog.slice(-10).reverse().map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(log.success)}
                    <div>
                      <div className="font-medium text-sm">
                        {log.debugInfo ? formatTimestamp(log.debugInfo.timestamp) : 'Unknown time'}
                      </div>
                      {log.error && (
                        <div className="text-xs text-red-600">{log.error}</div>
                      )}
                      {log.debugInfo && (
                        <div className="text-xs text-gray-500">
                          ID: {log.debugInfo.attemptId}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(log.success)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5 text-indigo-600" />
            <span>Email Delivery Troubleshooting</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Common Causes for Email Delivery Issues:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Spam Filters:</strong> Corporate/ISP spam filters may block magic link emails</li>
                <li>• <strong>Domain Reputation:</strong> New domains may have delivery issues</li>
                <li>• <strong>Email Provider Restrictions:</strong> Some providers (Outlook, Yahoo) have strict policies</li>
                <li>• <strong>Rate Limiting:</strong> Alchemy may rate limit email sending</li>
                <li>• <strong>DNS/SPF Issues:</strong> Email authentication records may not be properly configured</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Troubleshooting Steps:</h4>
              <ol className="space-y-1 text-gray-600 list-decimal list-inside">
                <li>Check spam/junk folders</li>
                <li>Try different email domains (Gmail, personal domains)</li>
                <li>Verify Alchemy Account Kit configuration</li>
                <li>Check browser console for authentication errors</li>
                <li>Contact Alchemy support for delivery issues</li>
              </ol>
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Note:</strong> This is a testnet environment. Some email providers may 
                have stricter policies for testnet applications compared to production services.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EmailAuthMonitor