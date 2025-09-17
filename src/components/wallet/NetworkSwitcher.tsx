'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  ChevronDown, 
  Globe, 
  Zap, 
  CheckCircle, 
  ExternalLink,
  AlertTriangle,
  Clock,
  DollarSign
} from 'lucide-react'
import { getEthereumNetwork } from '@/config/blockchain'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

interface NetworkInfo {
  id: SupportedNetwork
  name: string
  icon: string
  color: string
  tvl?: string
  avgGas?: string
  status: 'healthy' | 'slow' | 'congested'
  isRecommended?: boolean
}

const networkInfo: NetworkInfo[] = [
  {
    id: 'sepolia',
    name: 'Sepolia',
    icon: '🔧',
    color: 'orange',
    tvl: 'Testnet',
    avgGas: 'Free',
    status: 'healthy',
    isRecommended: true
  },
  {
    id: 'arbitrumSepolia',
    name: 'Arbitrum Sepolia',
    icon: '🔵',
    color: 'blue',
    tvl: 'Testnet',
    avgGas: 'Free',
    status: 'healthy',
    isRecommended: true
  },
  {
    id: 'baseSepolia',
    name: 'Base Sepolia',
    icon: '🔷',
    color: 'blue',
    tvl: 'Testnet',
    avgGas: 'Free',
    status: 'healthy',
    isRecommended: true
  },
  {
    id: 'optimismSepolia',
    name: 'OP Sepolia',
    icon: '🔴',
    color: 'red',
    tvl: 'Testnet',
    avgGas: 'Free',
    status: 'healthy'
  },
  {
    id: 'polygonAmoy',
    name: 'Polygon Amoy',
    icon: '🟣',
    color: 'purple',
    tvl: 'Testnet',
    avgGas: 'Free',
    status: 'healthy'
  }
]

interface NetworkSwitcherProps {
  currentNetwork: SupportedNetwork
  onNetworkSwitch: (network: SupportedNetwork) => void
  showTestnets?: boolean
  disabled?: boolean
  balances?: Record<SupportedNetwork, { usdc: string; eth: string }>
  className?: string
}

export function NetworkSwitcher({
  currentNetwork,
  onNetworkSwitch,
  showTestnets = false,
  disabled = false,
  balances,
  className = ''
}: NetworkSwitcherProps) {
  const [switching, setSwitching] = useState(false)

  const currentNetworkInfo = networkInfo.find(n => n.id === currentNetwork)
  const currentConfig = getEthereumNetwork(currentNetwork)

  const filteredNetworks = networkInfo.filter(network => {
    if (!showTestnets && getEthereumNetwork(network.id).isTestnet) {
      return false
    }
    return true
  })

  const handleNetworkSwitch = async (newNetwork: SupportedNetwork) => {
    if (newNetwork === currentNetwork || switching) return

    setSwitching(true)
    
    try {
      // Simulate network switching delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      onNetworkSwitch(newNetwork)
    } catch (error) {
      console.error('Network switch failed:', error)
    } finally {
      setSwitching(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'slow': return 'text-yellow-600'  
      case 'congested': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-3 h-3" />
      case 'slow': return <Clock className="w-3 h-3" />
      case 'congested': return <AlertTriangle className="w-3 h-3" />
      default: return <Globe className="w-3 h-3" />
    }
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || switching}
            className="h-auto p-3 w-full justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{currentNetworkInfo?.icon || '🌐'}</span>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">
                    {currentNetworkInfo?.name || currentConfig.name}
                  </span>
                  {currentNetworkInfo?.isRecommended && (
                    <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                      <Zap className="w-2 h-2 mr-1" />
                      Rec
                    </Badge>
                  )}
                  {currentConfig.isTestnet && (
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      Test
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 mt-0.5">
                  <span className={getStatusColor(currentNetworkInfo?.status || 'healthy')}>
                    {getStatusIcon(currentNetworkInfo?.status || 'healthy')}
                  </span>
                  <span>Chain {currentConfig.chainIdDecimal}</span>
                  {currentNetworkInfo?.avgGas && (
                    <span>Gas: {currentNetworkInfo.avgGas}</span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${switching ? 'animate-spin' : ''}`} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="start">
          <DropdownMenuLabel className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Switch Network</span>
          </DropdownMenuLabel>
          
          {/* Recommended Networks */}
          <DropdownMenuLabel className="text-xs text-gray-500 px-2 py-1">
            Recommended
          </DropdownMenuLabel>
          {filteredNetworks
            .filter(network => network.isRecommended)
            .map((network) => {
              const config = getEthereumNetwork(network.id)
              const networkBalance = balances?.[network.id]
              const isActive = network.id === currentNetwork
              
              return (
                <DropdownMenuItem
                  key={network.id}
                  onClick={() => handleNetworkSwitch(network.id)}
                  className="p-0 mb-1"
                  disabled={isActive}
                >
                  <Card className={`w-full border-0 ${isActive ? 'bg-emerald-50 ring-2 ring-emerald-500' : 'hover:bg-gray-50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{network.icon}</span>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{network.name}</span>
                              <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                <Zap className="w-2 h-2 mr-1" />
                                Recommended
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <span className={getStatusColor(network.status)}>
                                {getStatusIcon(network.status)}
                              </span>
                              <span>ID: {config.chainIdDecimal}</span>
                              {network.tvl && <span>TVL: {network.tvl}</span>}
                              <span>Gas: {network.avgGas}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {isActive && (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                          {networkBalance && !isActive && (
                            <div className="text-xs">
                              <div>{parseFloat(networkBalance.usdc) > 0 ? `${networkBalance.usdc} USDC` : ''}</div>
                              <div>{parseFloat(networkBalance.eth) > 0 ? `${parseFloat(networkBalance.eth).toFixed(4)} ETH` : ''}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DropdownMenuItem>
              )
            })}

          <DropdownMenuSeparator />

          {/* Other Networks */}
          <DropdownMenuLabel className="text-xs text-gray-500 px-2 py-1">
            Other Networks
          </DropdownMenuLabel>
          {filteredNetworks
            .filter(network => !network.isRecommended)
            .map((network) => {
              const config = getEthereumNetwork(network.id)
              const networkBalance = balances?.[network.id]
              const isActive = network.id === currentNetwork
              
              return (
                <DropdownMenuItem
                  key={network.id}
                  onClick={() => handleNetworkSwitch(network.id)}
                  className="p-0 mb-1"
                  disabled={isActive}
                >
                  <Card className={`w-full border-0 ${isActive ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{network.icon}</span>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{network.name}</span>
                              {config.isTestnet && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  Testnet
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <span className={getStatusColor(network.status)}>
                                {getStatusIcon(network.status)}
                              </span>
                              <span>ID: {config.chainIdDecimal}</span>
                              {network.tvl && <span>TVL: {network.tvl}</span>}
                              <span>Gas: {network.avgGas}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {isActive && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                          {networkBalance && !isActive && (
                            <div className="text-xs">
                              <div>{parseFloat(networkBalance.usdc) > 0 ? `${networkBalance.usdc} USDC` : ''}</div>
                              <div>{parseFloat(networkBalance.eth) > 0 ? `${parseFloat(networkBalance.eth).toFixed(4)} ETH` : ''}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DropdownMenuItem>
              )
            })}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => window.open(currentConfig.blockExplorer, '_blank')}
            className="text-xs text-gray-600"
          >
            <ExternalLink className="w-3 h-3 mr-2" />
            View on {currentConfig.name} Explorer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Network Switch Status */}
      {switching && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Switching networks...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default NetworkSwitcher