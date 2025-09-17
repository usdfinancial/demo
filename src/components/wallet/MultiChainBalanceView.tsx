'use client'

import React, { useState, useEffect } from 'react'
import { 
  Wallet, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Globe,
  ExternalLink,
  Zap,
  Clock,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { NetworkSelector } from './NetworkSelector'
import { NetworkSwitcher } from './NetworkSwitcher'
import { multiChainBalanceService, type NetworkBalance, type AggregatedBalance } from '@/lib/services/balanceService'
import { getEthereumNetwork } from '@/config/blockchain'
import { getEthPriceInUsd } from '@/lib/services/priceService';

type SupportedNetwork = 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy'

interface MultiChainBalanceViewProps {
  walletAddress: string
  className?: string
  showTestnets?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

const networkIcons: Record<string, string> = {
  'Ethereum Sepolia': '🔧',
  'Arbitrum Sepolia': '🔵',
  'Base Sepolia': '🔷',
  'OP Sepolia': '🔴',
  'Polygon Amoy Testnet': '🟣'
}

export function MultiChainBalanceView({
  walletAddress,
  className = '',
  showTestnets = false,
  autoRefresh = false,
  refreshInterval = 30000
}: MultiChainBalanceViewProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork>('sepolia')
  const [aggregatedBalance, setAggregatedBalance] = useState<AggregatedBalance | null>(null)
  const [selectedNetworkBalance, setSelectedNetworkBalance] = useState<NetworkBalance | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsPriceLoading(true);
        const price = await getEthPriceInUsd();
        setEthPrice(price);
      } catch (error) {
        setPriceError('Failed to fetch ETH price.');
        console.error(error);
      } finally {
        setIsPriceLoading(false);
      }
    };

    fetchPrice();
  }, []);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num)
  }

  const formatBalance = (balance: string, symbol: string) => {
    const num = parseFloat(balance)
    if (num === 0) return '0'
    if (num < 0.000001) return '< 0.000001'
    return `${num.toFixed(6)} ${symbol}`
  }

  const fetchAggregatedBalances = async () => {
    if (!walletAddress) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Fetching multi-chain balances for:', walletAddress)
      
      const networks: SupportedNetwork[] = [
        'sepolia', 'arbitrumSepolia', 'baseSepolia', 'optimismSepolia', 'polygonAmoy'
      ]

      const result = await multiChainBalanceService.getAllNetworkBalances(walletAddress, networks)
      setAggregatedBalance(result)
      setLastUpdated(result.lastUpdated)

      // Update selected network balance
      const networkBalance = result.networks.find(n => 
        getEthereumNetwork(selectedNetwork).name === n.network
      )
      setSelectedNetworkBalance(networkBalance || null)

    } catch (err) {
      console.error('❌ Error fetching multi-chain balances:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch balances')
    } finally {
      setLoading(false)
    }
  }

  const fetchSingleNetworkBalance = async (network: SupportedNetwork) => {
    if (!walletAddress) return

    setLoading(true)
    setError(null)

    try {
      const result = await multiChainBalanceService.getNetworkBalances(walletAddress, network)
      setSelectedNetworkBalance(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error(`❌ Error fetching ${network} balance:`, err)
      setError(err instanceof Error ? err.message : `Failed to fetch ${network} balance`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSingleNetworkBalance(selectedNetwork)
  }, [selectedNetwork, walletAddress])

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (!loading) {
          fetchSingleNetworkBalance(selectedNetwork)
        }
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, selectedNetwork, loading])

  const handleRefreshAll = () => {
    fetchAggregatedBalances()
  }

  const handleRefreshNetwork = () => {
    fetchSingleNetworkBalance(selectedNetwork)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Network Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Network Selection</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Scan All Networks
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <NetworkSwitcher
            currentNetwork={selectedNetwork}
            onNetworkSwitch={setSelectedNetwork}
            showTestnets={showTestnets}
            disabled={loading}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Aggregated Balance Summary */}
      {aggregatedBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Multi-Chain Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <p className="text-3xl font-bold text-emerald-700">
                  {formatCurrency(aggregatedBalance.totalUSDC)}
                </p>
                <p className="text-sm text-emerald-600">Total USDC</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-700">
                  {aggregatedBalance.networks.length}
                </p>
                <p className="text-sm text-blue-600">Networks Scanned</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-700">
                  {aggregatedBalance.networks.filter(n => n.usdc && parseFloat(n.usdc.balance) > 0).length}
                </p>
                <p className="text-sm text-purple-600">Networks with Balance</p>
              </div>
            </div>

            {/* Network Breakdown */}
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-gray-900">Network Breakdown</h4>
              {aggregatedBalance.networks.map((network) => (
                <div
                  key={network.chainId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{networkIcons[network.network] || '🌐'}</span>
                    <div>
                      <p className="font-medium">{network.network}</p>
                      {network.isTestnet && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">Testnet</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {network.usdc ? (
                      <div>
                        <p className="font-semibold">
                          {formatBalance(network.usdc.balance, 'USDC')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(network.usdc.balance)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No balance</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Last updated: {aggregatedBalance.lastUpdated.toLocaleTimeString()}</span>
              <Button variant="ghost" size="sm" onClick={handleRefreshAll} disabled={loading}>
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Network Balance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <span>Current Network Balance</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshNetwork}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !selectedNetworkBalance ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          ) : selectedNetworkBalance ? (
            <div className="space-y-4">
              {/* Network Info */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{networkIcons[selectedNetworkBalance.network] || '🌐'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedNetworkBalance.network}</h3>
                    <p className="text-sm text-gray-600">Chain ID: {selectedNetworkBalance.chainId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedNetworkBalance.isTestnet && (
                    <Badge className="bg-orange-100 text-orange-800">Testnet</Badge>
                  )}
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ETH Balance */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        {getEthereumNetwork(selectedNetwork).ticker}
                      </span>
                      <span className="text-2xl">💎</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatBalance(selectedNetworkBalance.eth, getEthereumNetwork(selectedNetwork).ticker)}
                    </p>
                    <p className="text-sm text-blue-700">
                      ≈ {isPriceLoading ? 'Loading price...' : formatCurrency(parseFloat(selectedNetworkBalance.eth) * (ethPrice || 0))}
                    </p>
                  </CardContent>
                </Card>

                {/* USDC Balance */}
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-emerald-800">USDC</span>
                      <span className="text-2xl">💵</span>
                    </div>
                    {selectedNetworkBalance.usdc ? (
                      <>
                        <p className="text-2xl font-bold text-emerald-900">
                          {formatBalance(selectedNetworkBalance.usdc.balance, 'USDC')}
                        </p>
                        <p className="text-sm text-emerald-700">
                          ≈ {formatCurrency(selectedNetworkBalance.usdc.balance)}
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              const config = getEthereumNetwork(selectedNetwork)
                              window.open(`${config.blockExplorer}/token/${selectedNetworkBalance.usdc!.address}`, '_blank')
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Contract
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-400">0 USDC</p>
                        <p className="text-sm text-gray-500">No USDC balance found</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedNetworkBalance.error && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Error
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const config = getEthereumNetwork(selectedNetwork)
                      window.open(`${config.blockExplorer}/address/${walletAddress}`, '_blank')
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View on Explorer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a network to view balance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MultiChainBalanceView