'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MultiChainBalanceView } from '@/components/wallet/MultiChainBalanceView'
import { multiChainBalanceService } from '@/lib/services/balanceService'
import { Play, Zap, TestTube, CheckCircle } from 'lucide-react'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

export function MultiChainBalanceTest() {
  const [testAddress, setTestAddress] = useState('0x2226bDB4F36fb86698db9340111803577b5a4114')
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState<'single' | 'multi' | 'view'>('view')

  const runSingleNetworkTest = async (network: SupportedNetwork) => {
    setLoading(true)
    try {
      console.log(`🧪 Testing ${network} network...`)
      const result = await multiChainBalanceService.getNetworkBalances(testAddress, network)
      
      setTestResults({
        type: 'single',
        network,
        result,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('❌ Single network test failed:', error)
      setTestResults({
        type: 'single',
        network,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    } finally {
      setLoading(false)
    }
  }

  const runMultiNetworkTest = async () => {
    setLoading(true)
    try {
      console.log('🌐 Testing all testnet networks...')
      const testNetworks: SupportedNetwork[] = ['sepolia', 'arbitrumSepolia', 'baseSepolia', 'optimismSepolia', 'polygonAmoy']
      const result = await multiChainBalanceService.getAllNetworkBalances(testAddress, testNetworks)
      
      setTestResults({
        type: 'multi',
        result,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('❌ Multi-network test failed:', error)
      setTestResults({
        type: 'multi',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    } finally {
      setLoading(false)
    }
  }

  const runBrowserConsoleTest = async () => {
    console.log('🧪 Running browser console tests...')
    
    // Test individual network
    if ((window as any).testNetwork) {
      console.log('🔍 Testing Sepolia network...')
      await (window as any).testNetwork('sepolia', testAddress)
    }
    
    // Test multi-chain
    if ((window as any).getAllNetworkBalances) {
      console.log('🌐 Testing all networks...')
      await (window as any).getAllNetworkBalances(testAddress)
    }
    
    // Test legacy service
    if ((window as any).testMultiChainBalanceService) {
      console.log('⚡ Testing multi-chain service...')
      await (window as any).testMultiChainBalanceService()
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Multi-Chain Balance Service Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Address Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Wallet Address
            </label>
            <Input
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="0x..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: Smart wallet test address with known USDC balance
            </p>
          </div>

          {/* Test Controls */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setSelectedTest('view')}
              variant={selectedTest === 'view' ? 'default' : 'outline'}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Live View Test</span>
            </Button>
            <Button
              onClick={() => runMultiNetworkTest()}
              variant={selectedTest === 'multi' ? 'default' : 'outline'}
              disabled={loading}
            >
              <Zap className="w-4 h-4 mr-2" />
              Multi-Network Test
            </Button>
            <Button
              onClick={() => runSingleNetworkTest('sepolia')}
              variant="outline"
              disabled={loading}
            >
              Test Sepolia
            </Button>
            <Button
              onClick={() => runSingleNetworkTest('arbitrumSepolia')}
              variant="outline"
              disabled={loading}
            >
              Test Arbitrum Sepolia
            </Button>
            <Button
              onClick={() => runSingleNetworkTest('baseSepolia')}
              variant="outline"
              disabled={loading}
            >
              Test Base Sepolia
            </Button>
            <Button
              onClick={() => runSingleNetworkTest('optimismSepolia')}
              variant="outline"
              disabled={loading}
            >
              Test OP Sepolia
            </Button>
            <Button
              onClick={() => runSingleNetworkTest('polygonAmoy')}
              variant="outline"
              disabled={loading}
            >
              Test Polygon Amoy
            </Button>
            <Button
              onClick={() => runBrowserConsoleTest()}
              variant="outline"
            >
              Console Tests
            </Button>
          </div>

          {/* Test Results */}
          {testResults && (
            <Card className="bg-gray-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Test Results</CardTitle>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {testResults.timestamp.toLocaleTimeString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-white p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Testing multi-chain balance service...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Multi-Chain View */}
      {selectedTest === 'view' && testAddress && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Live Multi-Chain Balance View</h3>
          <MultiChainBalanceView
            walletAddress={testAddress}
            showTestnets={true}
            autoRefresh={true}
            refreshInterval={30000}
          />
        </div>
      )}
    </div>
  )
}

export default MultiChainBalanceTest