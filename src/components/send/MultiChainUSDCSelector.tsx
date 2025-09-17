'use client'

import React, { useState, useEffect } from 'react'
import { Check, AlertTriangle, Zap, TrendingUp, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/data'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'

interface USDCBalance {
  network: string
  chainId: number
  balance: number
  balanceUSD: number
  gasEstimate: number
  transferTime: string
  isRecommended: boolean
  isAvailable: boolean
  reason?: string
}

interface MultiChainUSDCSelectorProps {
  selectedNetwork?: string
  amount: string
  onNetworkChange: (network: string, balance: USDCBalance) => void
  className?: string
}

export function MultiChainUSDCSelector({
  selectedNetwork,
  amount,
  onNetworkChange,
  className = ''
}: MultiChainUSDCSelectorProps) {
  const { multiChainBalances, isLoading, smartAccountAddress } = useEnhancedAuth()
  
  // Debug: Test balance fetching for current smart wallet
  React.useEffect(() => {
    if (smartAccountAddress && !isLoading) {
      console.log('🧪 Testing balance fetch for smart wallet:', smartAccountAddress)
      
      // Import balance service and test manually
      import('@/lib/services/balanceService').then(({ multiChainBalanceService }) => {
        console.log('📊 Manually testing balance service...')
        
        // Test multiple networks individually
        const networks = ['sepolia', 'arbitrumSepolia', 'baseSepolia', 'polygonAmoy'] as const
        
        networks.forEach(network => {
          multiChainBalanceService.getUSDCBalance(smartAccountAddress, network)
            .then(balance => {
              console.log(`🔍 ${network} USDC balance test result:`, {
                address: smartAccountAddress,
                network: network,
                balance: balance,
                balanceType: typeof balance,
                hasBalance: parseFloat(balance) > 0
              })
            })
            .catch(error => {
              console.error(`❌ ${network} balance test failed:`, error)
            })
        })
      })
    }
  }, [smartAccountAddress, isLoading])
  
  // Debug: Show what multiChainBalances contains
  React.useEffect(() => {
    if (multiChainBalances) {
      console.log('🌐 Current multiChainBalances data:', {
        totalUSDC: multiChainBalances.totalUSDC,
        networksCount: multiChainBalances.networks?.length,
        networks: multiChainBalances.networks?.map(n => ({
          network: n.network,
          usdcBalance: n.usdc?.balance,
          usdcBalanceRaw: n.usdc,
          hasError: !!n.error,
          error: n.error,
          chainId: n.chainId
        }))
      })
    } else if (!isLoading) {
      console.log('⚠️ No multiChainBalances data available - showing zero balances')
    } else {
      console.log('⏳ Balance data is loading...')
    }
  }, [multiChainBalances, isLoading])
  const [recommendedNetwork, setRecommendedNetwork] = useState<string>('')

  // Mock USDC balances from multi-chain data
  const usdcBalances: USDCBalance[] = [
    {
      network: 'Ethereum Sepolia',
      chainId: 11155111,
      balance: 12000,
      balanceUSD: 12000,
      gasEstimate: 5.50,
      transferTime: '2-5 minutes',
      isRecommended: false,
      isAvailable: true
    },
    {
      network: 'Arbitrum Sepolia',
      chainId: 421614,
      balance: 8500,
      balanceUSD: 8500,
      gasEstimate: 0.25,
      transferTime: '30-60 seconds',
      isRecommended: true,
      isAvailable: true
    },
    {
      network: 'Base Sepolia',
      chainId: 84532,
      balance: 5200,
      balanceUSD: 5200,
      gasEstimate: 0.15,
      transferTime: '10-30 seconds',
      isRecommended: false,
      isAvailable: true
    },
    {
      network: 'OP Sepolia',
      chainId: 11155420,
      balance: 3800,
      balanceUSD: 3800,
      gasEstimate: 0.20,
      transferTime: '15-45 seconds',
      isRecommended: false,
      isAvailable: true
    },
    {
      network: 'Polygon Amoy Testnet',
      chainId: 80002,
      balance: 2100,
      balanceUSD: 2100,
      gasEstimate: 0.01,
      transferTime: '5-15 seconds',
      isRecommended: false,
      isAvailable: true
    },
    {
      network: 'Avalanche Fuji',
      chainId: 43113,
      balance: 950,
      balanceUSD: 950,
      gasEstimate: 0.05,
      transferTime: '10-20 seconds',
      isRecommended: false,
      isAvailable: true,
      reason: 'Lower balance available'
    }
  ]

  // Get real blockchain balances only - no mock data fallback
  const getBalanceForNetwork = (networkName: string): number => {
    if (multiChainBalances?.networks) {
      const networkData = multiChainBalances.networks.find(n => n.network === networkName)
      const realBalance = parseFloat(networkData?.usdc?.balance || '0')
      
      // Debug log to show actual blockchain data
      console.log(`🔍 Real balance for ${networkName}:`, {
        hasNetworkData: !!networkData,
        actualBalance: realBalance,
        hasError: !!networkData?.error,
        error: networkData?.error
      })
      
      return realBalance
    }
    
    // No fallback to mock data - return 0 if real data not available
    console.log(`⚠️ No real balance data available for ${networkName} - showing 0`)
    return 0
  }

  // Update balances with real blockchain data only
  const enhancedBalances = usdcBalances.map(balance => {
    const actualBalance = getBalanceForNetwork(balance.network)
    const hasSufficientBalance = actualBalance > parseFloat(amount || '0')
    const isSepoliaNetwork = balance.network === 'Ethereum Sepolia'
    
    // Debug: Log each network's final balance calculation
    console.log(`🏦 Final balance for ${balance.network}:`, {
      mockBalance: balance.balance,
      actualBalance: actualBalance,
      showingBalance: actualBalance,
      hasSufficientBalance,
      isSepoliaNetwork,
      isAvailable: hasSufficientBalance && isSepoliaNetwork
    })
    
    return {
      ...balance,
      balance: actualBalance, // Show only real balance
      balanceUSD: actualBalance, // USD value equals USDC balance
      isAvailable: hasSufficientBalance && isSepoliaNetwork, // Only Sepolia is available for transactions
      isRecommended: balance.isRecommended && isSepoliaNetwork && actualBalance > 0, // Only recommend Sepolia with real balance
      reason: !isSepoliaNetwork 
        ? 'Multi-chain support coming soon! Currently Ethereum Sepolia only.' 
        : actualBalance === 0
          ? 'No USDC balance on this network'
          : !hasSufficientBalance 
            ? 'Insufficient balance'
            : balance.reason
    }
  })

  // Auto-select recommended network (prioritize networks with actual balances)
  useEffect(() => {
    const recommended = enhancedBalances.find(b => b.isRecommended && b.isAvailable && b.balance > 0)
    const bestAvailable = enhancedBalances
      .filter(b => b.isAvailable && b.balance > 0)
      .sort((a, b) => b.balance - a.balance)[0]
    
    // If no networks with balance, default to Sepolia for demo purposes
    const sepoliaNetwork = enhancedBalances.find(b => b.network === 'Ethereum Sepolia')
    const selected = recommended || bestAvailable || sepoliaNetwork
    
    if (selected && !selectedNetwork) {
      setRecommendedNetwork(selected.network)
      onNetworkChange(selected.network, selected)
    }
  }, [amount, enhancedBalances.length])

  const selectedBalance = enhancedBalances.find(b => b.network === (selectedNetwork || recommendedNetwork))
  const requiredAmount = parseFloat(amount || '0')
  const hasInsufficientBalance = selectedBalance && selectedBalance.balance < requiredAmount

  const getNetworkIcon = (network: string): string => {
    const iconMap: Record<string, string> = {
      'Ethereum Sepolia': '⟠',
      'Arbitrum Sepolia': '🔺',
      'Base Sepolia': '🔵',
      'OP Sepolia': '🔴',
      'Polygon Amoy Testnet': '🟣',
      'Avalanche Fuji': '🔺'
    }
    return iconMap[network] || '🔵'
  }

  const getRecommendationReason = (balance: USDCBalance): string => {
    if (balance.isRecommended) return 'Lowest fees & fastest settlement'
    if (balance.gasEstimate < 0.5) return 'Very low gas fees'
    if (balance.transferTime.includes('seconds')) return 'Fast settlement'
    return `${formatCurrency(balance.gasEstimate)} gas fee`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Network Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">USDC Source Network</label>
        </div>
        
        <Select 
          value={selectedNetwork || recommendedNetwork} 
          onValueChange={(network) => {
            const balance = enhancedBalances.find(b => b.network === network)
            if (balance) onNetworkChange(network, balance)
          }}
        >
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {enhancedBalances
              .sort((a, b) => b.balance - a.balance)
              .map((balance) => (
                <SelectItem key={balance.network} value={balance.network} disabled={!balance.isAvailable}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getNetworkIcon(balance.network)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{balance.network}</span>
                          {balance.isRecommended && (
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                              <TrendingUp className="h-2 w-2 mr-1" />
                              Best
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isLoading ? 'Loading...' : formatCurrency(balance.balance)} • {balance.transferTime}
                          {!isLoading && balance.balance === 0 && (
                            <span className="text-orange-600 ml-1">(No USDC)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className={`${balance.gasEstimate < 0.5 ? 'text-green-600' : 'text-slate-600'}`}>
                        {balance.gasEstimate < 0.01 ? 'Free' : formatCurrency(balance.gasEstimate)}
                      </div>
                      <div className="text-slate-400">gas</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Selected Network Info */}
        {selectedBalance && (
          <Card className={`${hasInsufficientBalance ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getNetworkIcon(selectedBalance.network)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedBalance.network}</span>
                      {selectedBalance.isRecommended && (
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      {getRecommendationReason(selectedBalance)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {isLoading ? 'Loading...' : formatCurrency(selectedBalance.balance)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isLoading ? 'Checking balance...' : 'Available USDC'}
                    {!isLoading && selectedBalance.balance === 0 && (
                      <span className="block text-orange-600">Real blockchain balance</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-600">Gas Fee</div>
                  <div className="font-medium">
                    {selectedBalance.gasEstimate < 0.01 ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        <Zap className="h-2 w-2 mr-1" />
                        FREE
                      </Badge>
                    ) : (
                      formatCurrency(selectedBalance.gasEstimate)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Settlement</div>
                  <div className="font-medium">{selectedBalance.transferTime}</div>
                </div>
                <div>
                  <div className="text-slate-600">Network</div>
                  <div className="font-medium">
                    <Badge variant="outline" className="text-xs">
                      {selectedBalance.network.includes('Sepolia') ? 'Testnet' : 'Mainnet'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {hasInsufficientBalance && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Insufficient USDC Balance</span>
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    You need {formatCurrency(requiredAmount - selectedBalance.balance)} more USDC. 
                    Consider using a different network or bridging funds.
                  </div>
                </div>
              )}

              {/* Unsupported Network Warning */}
              {selectedBalance.network !== 'Ethereum Sepolia' && (
                <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Network Not Yet Supported</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {selectedBalance.reason} Please select Ethereum Sepolia for transactions.
                  </div>
                </div>
              )}

              {/* Zero Balance Information */}
              {!isLoading && selectedBalance.balance === 0 && (
                <div className="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Real Blockchain Balance</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Showing actual USDC balance from {selectedBalance.network}. No mock data is displayed.
                  </div>
                </div>
              )}

              {/* Low Balance Warning */}
              {!hasInsufficientBalance && selectedBalance.balance < requiredAmount + 100 && selectedBalance.balance > 0 && selectedBalance.network === 'Ethereum Sepolia' && (
                <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Low Balance Remaining</span>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    After this transaction, you'll have {formatCurrency(selectedBalance.balance - requiredAmount)} USDC remaining.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}