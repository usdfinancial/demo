'use client'

import React, { useState } from 'react'
import { Check, ChevronDown, Globe, Zap, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getEthereumNetwork } from '@/config/blockchain'

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

interface NetworkInfo {
  id: SupportedNetwork
  name: string
  icon: string
  color: string
  tvl?: string
  gasPrice?: string
  isRecommended?: boolean
}

const networkInfo: NetworkInfo[] = [
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    icon: '🔧',
    color: 'orange',
    tvl: 'Testnet',
    gasPrice: 'Free',
    isRecommended: true
  },
  {
    id: 'arbitrumSepolia',
    name: 'Arbitrum Sepolia',
    icon: '🔵',
    color: 'blue',
    tvl: 'Testnet',
    gasPrice: 'Free',
    isRecommended: true
  },
  {
    id: 'baseSepolia',
    name: 'Base Sepolia',
    icon: '🔷',
    color: 'blue',
    tvl: 'Testnet',
    gasPrice: 'Free',
    isRecommended: true
  },
  {
    id: 'optimismSepolia',
    name: 'OP Sepolia',
    icon: '🔴',
    color: 'red',
    tvl: 'Testnet',
    gasPrice: 'Free'
  },
  {
    id: 'polygonAmoy',
    name: 'Polygon Amoy',
    icon: '🟣',
    color: 'purple',
    tvl: 'Testnet',
    gasPrice: 'Free'
  }
]

interface NetworkSelectorProps {
  selectedNetwork: SupportedNetwork
  onNetworkChange: (network: SupportedNetwork) => void
  showTestnets?: boolean
  disabled?: boolean
  className?: string
}

export function NetworkSelector({
  selectedNetwork,
  onNetworkChange,
  showTestnets = false,
  disabled = false,
  className = ''
}: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const filteredNetworks = networkInfo.filter(network => {
    if (!showTestnets) {
      return !getEthereumNetwork(network.id).isTestnet
    }
    return true
  })

  const selectedNetworkInfo = networkInfo.find(n => n.id === selectedNetwork)
  const selectedConfig = getEthereumNetwork(selectedNetwork)

  return (
    <div className={`relative ${className}`}>
      <Select
        value={selectedNetwork}
        onValueChange={(value) => onNetworkChange(value as SupportedNetwork)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-auto p-0 border-0 bg-transparent">
          <Card className="w-full cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{selectedNetworkInfo?.icon}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {selectedNetworkInfo?.name || selectedConfig.name}
                      </span>
                      {selectedNetworkInfo?.isRecommended && (
                        <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      {selectedConfig.isTestnet && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Testnet
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>Chain ID: {selectedConfig.chainIdDecimal}</span>
                      {selectedNetworkInfo?.tvl && (
                        <span>TVL: {selectedNetworkInfo.tvl}</span>
                      )}
                      {selectedNetworkInfo?.gasPrice && (
                        <span>Gas: {selectedNetworkInfo.gasPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </SelectTrigger>
        
        <SelectContent className="w-full min-w-[400px]">
          <div className="p-2">
            <div className="mb-3 px-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Select Network</h4>
              <p className="text-xs text-gray-600">Choose a network to check USDC balances</p>
            </div>
            
            {filteredNetworks.map((network) => {
              const config = getEthereumNetwork(network.id)
              const isSelected = network.id === selectedNetwork
              
              return (
                <SelectItem key={network.id} value={network.id} className="p-0 mb-2">
                  <Card className={`w-full cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-gray-50'
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">{network.icon}</div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {network.name}
                              </span>
                              {network.isRecommended && (
                                <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Recommended
                                </Badge>
                              )}
                              {config.isTestnet && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  Testnet
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-600">
                              <span>ID: {config.chainIdDecimal}</span>
                              {network.tvl && <span>TVL: {network.tvl}</span>}
                              {network.gasPrice && <span>Gas: {network.gasPrice}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isSelected && (
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(config.blockExplorer, '_blank')
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SelectItem>
              )
            })}
            
            {!showTestnets && (
              <div className="mt-3 px-2 pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-left justify-start text-gray-600"
                  onClick={() => {}}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Show testnets
                </Button>
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}

export default NetworkSelector