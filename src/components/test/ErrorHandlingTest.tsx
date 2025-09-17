'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  TestTube, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Activity
} from 'lucide-react'
import { multiChainBalanceService } from '@/lib/services/balanceService'
import { networkErrorHandler } from '@/lib/services/errorHandling'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

interface TestResult {
  testName: string
  network: string
  status: 'pending' | 'running' | 'success' | 'failed'
  duration?: number
  error?: string
  details?: any
}

interface ErrorScenario {
  id: string
  name: string
  description: string
  network: SupportedNetwork
  testFunction: () => Promise<any>
}

export function ErrorHandlingTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  // Test scenarios for different error conditions
  const errorScenarios: ErrorScenario[] = [
    {
      id: 'invalid-address',
      name: 'Invalid Address Format',
      description: 'Test handling of invalid Ethereum address format',
      network: 'sepolia',
      testFunction: async () => {
        return multiChainBalanceService.getETHBalance('invalid-address', 'sepolia')
      }
    },
    {
      id: 'non-existent-address',
      name: 'Non-existent Address',
      description: 'Test handling of valid but non-existent address',
      network: 'sepolia',
      testFunction: async () => {
        return multiChainBalanceService.getETHBalance('0x0000000000000000000000000000000000000001', 'sepolia')
      }
    },
    {
      id: 'network-timeout',
      name: 'Network Timeout Simulation',
      description: 'Test timeout handling by using a slow/unresponsive endpoint',
      network: 'baseSepolia',
      testFunction: async () => {
        // Simulate timeout by using an invalid RPC endpoint
        const originalProvider = (multiChainBalanceService as any).providers.get('baseSepolia')
        
        // Temporarily replace with a slow endpoint for testing
        ;(multiChainBalanceService as any).providers.delete('baseSepolia')
        
        try {
          const result = await multiChainBalanceService.getETHBalance(
            '0x2226bDB4F36fb86698db9340111803577b5a4114', 
            'baseSepolia'
          )
          
          // Restore original provider
          if (originalProvider) {
            ;(multiChainBalanceService as any).providers.set('baseSepolia', originalProvider)
          }
          
          return result
        } catch (error) {
          // Restore original provider
          if (originalProvider) {
            ;(multiChainBalanceService as any).providers.set('baseSepolia', originalProvider)
          }
          throw error
        }
      }
    },
    {
      id: 'rate-limit-simulation',
      name: 'Rate Limit Handling',
      description: 'Test rate limiting protection and fallback mechanisms',
      network: 'arbitrumSepolia',
      testFunction: async () => {
        // Make multiple rapid requests to trigger rate limiting
        const promises = Array(10).fill(null).map(() =>
          multiChainBalanceService.getUSDCBalance('0x2226bDB4F36fb86698db9340111803577b5a4114', 'arbitrumSepolia')
        )
        
        const results = await Promise.allSettled(promises)
        return {
          totalRequests: promises.length,
          successfulRequests: results.filter(r => r.status === 'fulfilled').length,
          failedRequests: results.filter(r => r.status === 'rejected').length
        }
      }
    },
    {
      id: 'circuit-breaker-test',
      name: 'Circuit Breaker Activation',
      description: 'Test circuit breaker pattern by forcing multiple failures',
      network: 'optimismSepolia',
      testFunction: async () => {
        const results = []
        
        // Force multiple failures to trigger circuit breaker
        for (let i = 0; i < 7; i++) {
          try {
            // Use an invalid contract address to force failures
            const result = await multiChainBalanceService.getUSDCBalance('0xInvalidAddress', 'optimismSepolia')
            results.push({ attempt: i + 1, success: true, result })
          } catch (error) {
            results.push({ attempt: i + 1, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
          }
          
          // Small delay between attempts
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // Check if circuit breaker is now open
        const isAvailable = networkErrorHandler.isNetworkAvailable('optimismSepolia')
        const errorStats = networkErrorHandler.getErrorStats('optimismSepolia')
        
        return {
          attempts: results,
          circuitBreakerOpen: !isAvailable,
          circuitBreakerState: errorStats.circuitBreakerState,
          failureCount: errorStats.failureCount
        }
      }
    },
    {
      id: 'multi-network-resilience',
      name: 'Multi-Network Resilience',
      description: 'Test behavior when some networks fail but others succeed',
      network: 'sepolia', // This will test all networks
      testFunction: async () => {
        // Test with a mix of valid and invalid scenarios
        const testAddress = '0x2226bDB4F36fb86698db9340111803577b5a4114'
        const result = await multiChainBalanceService.getAllNetworkBalances(testAddress)
        
        const networkStats = result.networks.map(network => ({
          network: network.network,
          hasError: !!network.error,
          ethBalance: network.eth,
          usdcBalance: network.usdc?.balance || '0',
          circuitBreakerState: network.circuitBreakerState
        }))
        
        return {
          totalUSDC: result.totalUSDC,
          networksCount: result.networks.length,
          healthyNetworks: result.networks.filter(n => !n.error).length,
          failedNetworks: result.networks.filter(n => !!n.error).length,
          networkDetails: networkStats
        }
      }
    }
  ]

  const runSingleTest = async (scenario: ErrorScenario) => {
    const startTime = Date.now()
    
    // Update test status to running
    setTestResults(prev => prev.map(result => 
      result.testName === scenario.name 
        ? { ...result, status: 'running' as const }
        : result
    ))

    try {
      console.log(`🧪 Running test: ${scenario.name}`)
      const result = await scenario.testFunction()
      const duration = Date.now() - startTime

      setTestResults(prev => prev.map(result => 
        result.testName === scenario.name 
          ? { 
              ...result, 
              status: 'success' as const, 
              duration,
              details: result
            }
          : result
      ))

      console.log(`✅ Test passed: ${scenario.name}`, result)
      return { success: true, result }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      setTestResults(prev => prev.map(result => 
        result.testName === scenario.name 
          ? { 
              ...result, 
              status: 'failed' as const, 
              duration,
              error: errorMessage
            }
          : result
      ))

      console.log(`❌ Test failed: ${scenario.name}`, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    
    // Initialize test results
    setTestResults(errorScenarios.map(scenario => ({
      testName: scenario.name,
      network: scenario.network,
      status: 'pending' as const
    })))

    // Run tests sequentially to avoid overwhelming the network
    for (const scenario of errorScenarios) {
      await runSingleTest(scenario)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setIsRunningTests(false)
    
    // Show network health after tests
    console.log('🏥 Network Health After Tests:', multiChainBalanceService.getNetworkHealth())
  }

  const resetAllTests = () => {
    setTestResults([])
    
    // Reset all network statistics
    multiChainBalanceService.resetNetworkStats()
    
    // Reset circuit breakers
    const networks: SupportedNetwork[] = ['sepolia', 'arbitrumSepolia', 'baseSepolia', 'optimismSepolia', 'polygonAmoy']
    networks.forEach(network => {
      multiChainBalanceService.resetCircuitBreaker(network)
    })
    
    console.log('🔄 All tests and network stats reset')
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    }
  }

  const successfulTests = testResults.filter(r => r.status === 'success').length
  const failedTests = testResults.filter(r => r.status === 'failed').length
  const totalTests = testResults.length

  return (
    <div className="space-y-6">
      {/* Test Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5 text-purple-600" />
            <span>Error Handling Test Suite</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={runAllTests}
                disabled={isRunningTests}
                className="flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Run All Tests</span>
              </Button>
              <Button
                variant="outline"
                onClick={resetAllTests}
                disabled={isRunningTests}
              >
                Reset Tests
              </Button>
            </div>
            
            {totalTests > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {successfulTests}/{totalTests} passed
                </span>
                {successfulTests > 0 && <CheckCircle className="w-4 h-4 text-green-500" />}
                {failedTests > 0 && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      <div className="space-y-4">
        {errorScenarios.map((scenario, index) => {
          const result = testResults.find(r => r.testName === scenario.name)
          
          return (
            <Card key={scenario.id} className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {result ? getStatusIcon(result.status) : <Clock className="w-4 h-4 text-gray-400" />}
                    <div>
                      <h3 className="font-semibold">{scenario.name}</h3>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{scenario.network}</Badge>
                    {result && getStatusBadge(result.status)}
                  </div>
                </div>
              </CardHeader>
              
              {result && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {result.duration && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span>{result.duration}ms</span>
                      </div>
                    )}
                    
                    {result.error && (
                      <Alert>
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription className="text-sm">
                          {result.error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runSingleTest(scenario)}
                      disabled={isRunningTests}
                      className="w-full"
                    >
                      <Play className="w-3 h-3 mr-2" />
                      Run Individual Test
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Instructions */}
      <Alert>
        <TestTube className="w-4 h-4" />
        <AlertDescription>
          <strong>Test Instructions:</strong> These tests simulate various error conditions to verify the robustness 
          of the multi-chain balance service. Check the browser console for detailed logs during test execution. 
          Some tests may intentionally fail to demonstrate error handling capabilities.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default ErrorHandlingTest