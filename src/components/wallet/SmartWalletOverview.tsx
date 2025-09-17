'use client'

import { useState } from 'react'
import { Copy, ExternalLink, Shield, Zap, Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SmartWalletOverviewProps {
  smartWalletAddress: string | null
  eoaAddress: string | null
  smartWalletBalance: string | null
  eoaBalance: string | null
  isAAReady: boolean
  currentChain: string
}

export function SmartWalletOverview({
  smartWalletAddress,
  eoaAddress,
  smartWalletBalance,
  eoaBalance,
  isAAReady,
  currentChain
}: SmartWalletOverviewProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [showFullAddresses, setShowFullAddresses] = useState<boolean>(true)

  const copyToClipboard = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(type)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatAddress = (address: string) => {
    if (showFullAddresses) {
      return address
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string | null) => {
    if (!balance || balance === '0') return '0.0000'
    return parseFloat(balance).toFixed(4)
  }

  const getChainInfo = (chain: string) => {
    const chains = {
      sepolia: { name: 'Sepolia Testnet', icon: '🔧', color: 'bg-blue-100 text-blue-800' },
      polygon: { name: 'Polygon', icon: '🟣', color: 'bg-purple-100 text-purple-800' },
      mainnet: { name: 'Ethereum Mainnet', icon: '💎', color: 'bg-emerald-100 text-emerald-800' }
    }
    return chains[chain as keyof typeof chains] || { name: chain, icon: '⚡', color: 'bg-gray-100 text-gray-800' }
  }

  const chainInfo = getChainInfo(currentChain)

  return (
    <div className="space-y-6">
      {/* Enhanced Main Smart Wallet Card */}
      <Card className="relative overflow-hidden border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full -translate-y-20 translate-x-20 opacity-30" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full translate-y-16 -translate-x-16 opacity-30" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full -translate-x-12 -translate-y-12 opacity-20" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Smart Wallet</CardTitle>
                <CardDescription className="text-gray-600">
                  {isAAReady ? 'Account Abstraction Active' : 'EOA Backup Mode'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullAddresses(!showFullAddresses)}
                className="text-xs"
              >
                {showFullAddresses ? 'Compact' : 'Full'} Address
              </Button>
              <Badge className={chainInfo.color}>
                <span className="mr-1">{chainInfo.icon}</span>
                {chainInfo.name}
              </Badge>
              <Badge className={isAAReady ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}>
                {isAAReady ? (
                  <>
                    <Zap className="w-3 h-3 mr-1" />
                    Gasless
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Secured
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6">
          {/* Enhanced Smart Wallet Address */}
          {smartWalletAddress && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Smart Contract Wallet</p>
                    <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                      Primary
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                    <p className="text-xs text-gray-500 mb-1">SMART WALLET ADDRESS</p>
                    <div className={`${showFullAddresses ? 'text-sm' : 'text-lg'} font-mono font-bold text-gray-900 tracking-wider ${showFullAddresses ? 'break-all' : ''}`}>
                      {formatAddress(smartWalletAddress)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-xs text-gray-500">BALANCE</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatBalance(smartWalletBalance)} ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">STATUS</p>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-sm font-semibold text-emerald-600">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(smartWalletAddress, 'smart')}
                    className="h-10 w-10 p-0 border-2 hover:border-emerald-500 hover:bg-emerald-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 border-2 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {copiedAddress === 'smart' && (
                <div className="mt-3 p-2 bg-emerald-100 rounded-lg animate-fade-in">
                  <p className="text-sm text-emerald-700 font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Address copied to clipboard
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Enhanced EOA Address */}
          {eoaAddress && (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/40 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Backup EOA Wallet</p>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      Backup
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                    <p className="text-xs text-gray-500 mb-1">BACKUP EOA ADDRESS</p>
                    <div className={`${showFullAddresses ? 'text-sm' : 'text-lg'} font-mono font-bold text-gray-900 tracking-wider ${showFullAddresses ? 'break-all' : ''}`}>
                      {formatAddress(eoaAddress)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-xs text-gray-500">BALANCE</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatBalance(eoaBalance)} ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">STATUS</p>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <p className="text-sm font-semibold text-blue-600">Standby</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(eoaAddress, 'eoa')}
                    className="h-10 w-10 p-0 border-2 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 border-2 hover:border-gray-500 hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {copiedAddress === 'eoa' && (
                <div className="mt-3 p-2 bg-blue-100 rounded-lg animate-fade-in">
                  <p className="text-sm text-blue-700 font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Backup address copied to clipboard
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-900">
                  {isAAReady ? '∞' : '0'}
                </p>
                <p className="text-sm text-emerald-700">Gasless Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">100%</p>
                <p className="text-sm text-blue-700">Security Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">~2s</p>
                <p className="text-sm text-purple-700">Avg. Speed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}