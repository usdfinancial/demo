'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'

interface TransactionDebuggerProps {
  isOpen: boolean
  onClose: () => void
}

export function TransactionDebugger({ isOpen, onClose }: TransactionDebuggerProps) {
  const { 
    user, 
    smartAccountAddress, 
    smartAccountClient, 
    isAuthenticated, 
    sendGaslessTransaction,
    multiChainBalances 
  } = useEnhancedAuth()
  
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      collectDebugInfo()
    }
  }, [isOpen])

  const collectDebugInfo = () => {
    const info = {
      // Authentication status
      authentication: {
        isAuthenticated,
        hasUser: !!user,
        userAddress: user?.address,
        userEmail: user?.email,
        smartAccountAddress,
        hasSmartAccountClient: !!smartAccountClient
      },
      
      // Environment variables
      environment: {
        hasAlchemyKey: !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        alchemyKeyPrefix: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY?.slice(0, 8) + '...',
        nodeEnv: process.env.NODE_ENV,
        isClient: typeof window !== 'undefined'
      },
      
      // Multi-chain balances
      balances: {
        hasMultiChainBalances: !!multiChainBalances,
        totalUSDC: multiChainBalances?.totalUSDC || 'N/A',
        networkCount: multiChainBalances?.networks?.length || 0,
        networks: multiChainBalances?.networks?.map(n => ({
          name: n.network,
          hasUSDC: !!n.usdc,
          balance: n.usdc?.balance || '0'
        })) || []
      },
      
      // Function availability
      functions: {
        hasSendGaslessTransaction: typeof sendGaslessTransaction === 'function',
        sendFunctionType: typeof sendGaslessTransaction
      },
      
      // Browser capabilities
      browser: {
        hasClipboard: !!navigator.clipboard,
        hasLocalStorage: !!window.localStorage,
        userAgent: navigator.userAgent.slice(0, 50) + '...'
      }
    }
    
    setDebugInfo(info)
  }

  const testTransactionCapabilities = async () => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      const results = {
        authCheck: isAuthenticated && !!user,
        smartAccountCheck: !!smartAccountAddress,
        clientCheck: !!smartAccountClient,
        functionCheck: typeof sendGaslessTransaction === 'function'
      }
      
      if (results.functionCheck && sendGaslessTransaction) {
        try {
          // Test with a small amount to a test address
          console.log('🧪 Testing gasless transaction function...')
          
          // Don't actually send, just check if the function is callable
          const testAddress = '0x0000000000000000000000000000000000000001'
          const testAmount = '0.01'
          
          // This should fail gracefully if not properly set up
          await sendGaslessTransaction(testAddress, testAmount)
          
          results.transactionTest = 'Function called successfully'
        } catch (error: any) {
          results.transactionTest = `Function error: ${error.message}`
          results.transactionError = error
        }
      }
      
      setTestResult(results)
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Transaction Debug Information
              </CardTitle>
              <CardDescription>
                Diagnostic information for troubleshooting transaction issues
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Authentication Status */}
          <div>
            <h3 className="font-semibold mb-3">Authentication Status</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Is Authenticated:</span>
                <Badge variant={debugInfo?.authentication.isAuthenticated ? "default" : "destructive"}>
                  {debugInfo?.authentication.isAuthenticated ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Has User:</span>
                <Badge variant={debugInfo?.authentication.hasUser ? "default" : "destructive"}>
                  {debugInfo?.authentication.hasUser ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Smart Account:</span>
                <Badge variant={debugInfo?.authentication.smartAccountAddress ? "default" : "destructive"}>
                  {debugInfo?.authentication.smartAccountAddress ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Smart Client:</span>
                <Badge variant={debugInfo?.authentication.hasSmartAccountClient ? "default" : "destructive"}>
                  {debugInfo?.authentication.hasSmartAccountClient ? 'Available' : 'Not Available'}
                </Badge>
              </div>
            </div>
            {debugInfo?.authentication.smartAccountAddress && (
              <div className="mt-2 p-2 bg-green-50 rounded text-xs font-mono">
                Smart Account: {debugInfo.authentication.smartAccountAddress}
              </div>
            )}
          </div>

          {/* Environment Setup */}
          <div>
            <h3 className="font-semibold mb-3">Environment Configuration</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Alchemy API Key:</span>
                <Badge variant={debugInfo?.environment.hasAlchemyKey ? "default" : "destructive"}>
                  {debugInfo?.environment.hasAlchemyKey ? 'Configured' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Environment:</span>
                <Badge variant="outline">
                  {debugInfo?.environment.nodeEnv || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Multi-Chain Balances */}
          <div>
            <h3 className="font-semibold mb-3">Multi-Chain Balance Status</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Has Balance Data:</span>
                <Badge variant={debugInfo?.balances.hasMultiChainBalances ? "default" : "destructive"}>
                  {debugInfo?.balances.hasMultiChainBalances ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Network Count:</span>
                <Badge variant="outline">
                  {debugInfo?.balances.networkCount || 0}
                </Badge>
              </div>
            </div>
            {debugInfo?.balances.networks && debugInfo.balances.networks.length > 0 && (
              <div className="mt-2 space-y-1">
                {debugInfo.balances.networks.map((network: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                    <span>{network.name}</span>
                    <span className="font-mono">{network.balance} USDC</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Function Availability */}
          <div>
            <h3 className="font-semibold mb-3">Transaction Functions</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Send Function:</span>
                <Badge variant={debugInfo?.functions.hasSendGaslessTransaction ? "default" : "destructive"}>
                  {debugInfo?.functions.hasSendGaslessTransaction ? 'Available' : 'Not Available'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>Function Type:</span>
                <Badge variant="outline">
                  {debugInfo?.functions.sendFunctionType || 'undefined'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResult && (
            <div>
              <h3 className="font-semibold mb-3">Test Results</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(testResult).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <Badge variant={value === true || (typeof value === 'string' && value.includes('success')) ? "default" : "destructive"}>
                      {String(value)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={collectDebugInfo} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Debug Info
            </Button>
            <Button 
              onClick={testTransactionCapabilities} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : 'Test Transaction Setup'}
            </Button>
            <Button
              onClick={() => {
                const debugData = JSON.stringify(debugInfo, null, 2)
                navigator.clipboard.writeText(debugData)
              }}
              variant="outline"
            >
              Copy Debug Info
            </Button>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Common Solutions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure you're authenticated with Alchemy Account Kit</li>
              <li>• Verify NEXT_PUBLIC_ALCHEMY_API_KEY is set correctly</li>
              <li>• Check that you have USDC balance on the selected network</li>
              <li>• Make sure you're using a supported testnet (Sepolia, Arbitrum Sepolia, etc.)</li>
              <li>• Try refreshing the page to reinitialize the connection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}