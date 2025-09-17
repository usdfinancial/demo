'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  ArrowRightLeft, 
  ExternalLink,
  Zap,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { getEthereumNetwork } from '@/config/blockchain'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

interface BridgeRoute {
  id: string
  name: string
  fromNetwork: SupportedNetwork
  toNetwork: SupportedNetwork
  asset: 'USDC' | 'ETH'
  estimatedTime: string
  estimatedCost: string
  protocol: string
  url: string
  isRecommended?: boolean
  isOfficial?: boolean
  description: string
}

interface BridgeDetectorProps {
  fromNetwork: SupportedNetwork
  toNetwork: SupportedNetwork
  asset: 'USDC' | 'ETH'
  amount?: number
  className?: string
}

const bridgeRoutes: BridgeRoute[] = [
  // Testnet Bridge Routes (Sepolia-based)
  {
    id: 'arbitrum-sepolia-testnet',
    name: 'Arbitrum Sepolia Bridge',
    fromNetwork: 'sepolia',
    toNetwork: 'arbitrumSepolia',
    asset: 'USDC',
    estimatedTime: '10-15 minutes',
    estimatedCost: 'Free',
    protocol: 'Official Arbitrum Testnet Bridge',
    url: 'https://bridge.arbitrum.io/?l2ChainId=421614',
    isOfficial: true,
    description: 'Official Arbitrum Sepolia testnet bridge'
  },
  {
    id: 'optimism-sepolia-testnet',
    name: 'OP Sepolia Bridge',
    fromNetwork: 'sepolia',
    toNetwork: 'optimismSepolia',
    asset: 'USDC',
    estimatedTime: '5-10 minutes',
    estimatedCost: 'Free',
    protocol: 'Official OP Sepolia Bridge',
    url: 'https://app.optimism.io/bridge?chainId=11155420',
    isOfficial: true,
    description: 'Official OP Sepolia testnet bridge'
  },
  {
    id: 'base-sepolia-testnet',
    name: 'Base Sepolia Bridge',
    fromNetwork: 'sepolia',
    toNetwork: 'baseSepolia',
    asset: 'USDC',
    estimatedTime: '5-10 minutes',
    estimatedCost: 'Free',
    protocol: 'Official Base Sepolia Bridge',
    url: 'https://bridge.base.org/deposit?chainId=84532',
    isOfficial: true,
    description: 'Official Base Sepolia testnet bridge'
  },
  {
    id: 'polygon-amoy-testnet',
    name: 'Polygon Amoy Bridge',
    fromNetwork: 'sepolia',
    toNetwork: 'polygonAmoy',
    asset: 'USDC',
    estimatedTime: '5-10 minutes',
    estimatedCost: 'Free',
    protocol: 'Official Polygon Amoy Bridge',
    url: 'https://wallet.polygon.technology/polygon/bridge/deposit?token=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    isOfficial: true,
    description: 'Official Polygon Amoy testnet bridge'
  }
]

const networkIcons: Record<SupportedNetwork, string> = {
  sepolia: '🔧',
  arbitrumSepolia: '🔵',
  baseSepolia: '🔷',
  optimismSepolia: '🔴',
  polygonAmoy: '🟣'
}

export function BridgeDetector({
  fromNetwork,
  toNetwork,
  asset,
  amount,
  className = ''
}: BridgeDetectorProps) {
  const [availableRoutes, setAvailableRoutes] = useState<BridgeRoute[]>([])
  const [loading, setLoading] = useState(false)

  const fromConfig = getEthereumNetwork(fromNetwork)
  const toConfig = getEthereumNetwork(toNetwork)

  useEffect(() => {
    detectBridgeRoutes()
  }, [fromNetwork, toNetwork, asset])

  const detectBridgeRoutes = async () => {
    setLoading(true)
    
    // Simulate API call to detect available bridge routes
    await new Promise(resolve => setTimeout(resolve, 1000))

    const routes = bridgeRoutes.filter(route => 
      route.fromNetwork === fromNetwork && 
      route.toNetwork === toNetwork && 
      route.asset === asset
    )

    // Add reverse routes if available
    const reverseRoutes = bridgeRoutes.filter(route => 
      route.fromNetwork === toNetwork && 
      route.toNetwork === fromNetwork && 
      route.asset === asset
    ).map(route => ({
      ...route,
      id: `${route.id}-reverse`,
      fromNetwork: route.toNetwork,
      toNetwork: route.fromNetwork
    }))

    setAvailableRoutes([...routes, ...reverseRoutes])
    setLoading(false)
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  const getBridgeRecommendation = () => {
    if (availableRoutes.length === 0) return null

    const recommended = availableRoutes.find(route => route.isRecommended)
    const official = availableRoutes.find(route => route.isOfficial)
    
    return recommended || official || availableRoutes[0]
  }

  const recommendation = getBridgeRecommendation()

  if (fromNetwork === toNetwork) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Same Network
          </h3>
          <p className="text-gray-600">
            No bridge needed - you're already on {fromConfig.name}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bridge Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Cross-Chain Bridge Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{networkIcons[fromNetwork]}</span>
                <div>
                  <p className="font-semibold">{fromConfig.name}</p>
                  <p className="text-sm text-gray-600">From</p>
                </div>
              </div>
              
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{networkIcons[toNetwork]}</span>
                <div>
                  <p className="font-semibold">{toConfig.name}</p>
                  <p className="text-sm text-gray-600">To</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold">{asset}</p>
              {amount && (
                <p className="text-sm text-gray-600">
                  {formatAmount(amount)} {asset}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Detecting bridge routes...</p>
          </CardContent>
        </Card>
      ) : availableRoutes.length > 0 ? (
        <>
          {/* Recommended Route */}
          {recommendation && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Recommended Route</span>
                  {recommendation.isRecommended && (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Best
                    </Badge>
                  )}
                  {recommendation.isOfficial && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Official
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-emerald-900">
                      {recommendation.name}
                    </h4>
                    <Button
                      onClick={() => window.open(recommendation.url, '_blank')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Use Bridge
                    </Button>
                  </div>
                  
                  <p className="text-sm text-emerald-800">
                    {recommendation.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{recommendation.estimatedTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>{recommendation.estimatedCost}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-emerald-600" />
                      <span>{recommendation.protocol}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Available Routes */}
          {availableRoutes.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>All Available Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableRoutes.map((route) => (
                    <div
                      key={route.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        route.id === recommendation?.id 
                          ? 'border-emerald-200 bg-emerald-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{route.name}</h4>
                            {route.isRecommended && (
                              <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                Recommended
                              </Badge>
                            )}
                            {route.isOfficial && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Official
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{route.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>⏱️ {route.estimatedTime}</span>
                            <span>💰 {route.estimatedCost}</span>
                            <span>🏗️ {route.protocol}</span>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(route.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              No Direct Bridge Found
            </h3>
            <p className="text-orange-700 mb-6">
              No direct bridge route found from {fromConfig.name} to {toConfig.name} for {asset}.
              You may need to bridge through an intermediate network like Ethereum mainnet.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://testnet.jumper.exchange', '_blank')}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Search Testnet Bridges
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BridgeDetector