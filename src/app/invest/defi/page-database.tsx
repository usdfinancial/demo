'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Zap, Target, DollarSign, Shield, Activity, Layers, ArrowUpDown, Plus, Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/auth/AuthGuard'
import type { DeFiProtocolWithUserData } from '@/lib/services/investmentService'

interface DeFiProtocol {
  id: string
  name: string
  category: 'Lending' | 'DEX' | 'Yield Farming' | 'Liquidity Mining'
  tvl: number
  apy: number
  risk: 'Low' | 'Medium' | 'High'
  description: string
  features: string[]
  token: string
  minDeposit: number
  lockPeriod: number
  userDeposit?: string
  userEarned?: string
  isUserParticipating?: boolean
}

export default function DeFiPageDatabase() {
  const { user } = useAuth()
  const [protocols, setProtocols] = useState<DeFiProtocol[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<DeFiProtocol | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<StablecoinSymbol>('USDC')
  const [depositAmount, setDepositAmount] = useState('')
  const [autoReinvest, setAutoReinvest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [depositing, setDepositing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load DeFi protocols from API
  useEffect(() => {
    const loadProtocols = async () => {
      if (!user?.address) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/investments?userId=${user.address}&action=defi-protocols`)
        if (!response.ok) {
          throw new Error('Failed to load DeFi protocols')
        }
        
        const data: DeFiProtocolWithUserData[] = await response.json()
        
        // Transform API data to component format
        const transformedProtocols: DeFiProtocol[] = data.map(protocol => ({
          id: protocol.id,
          name: protocol.name,
          category: 'Lending' as const, // Defaulting to Lending, could be enhanced
          tvl: parseFloat(protocol.tvlUsd || '0'),
          apy: parseFloat(protocol.currentApy || '0'),
          risk: protocol.risk_level as 'Low' | 'Medium' | 'High',
          description: protocol.description || '',
          features: protocol.supported_chains?.map(chain => `Chain ${chain}`) || [],
          token: protocol.protocol_key.toUpperCase(),
          minDeposit: 100, // Could be enhanced with database field
          lockPeriod: 0, // Could be enhanced with database field
          userDeposit: protocol.userDeposit,
          userEarned: protocol.userEarned,
          isUserParticipating: protocol.isUserParticipating
        }))
        
        setProtocols(transformedProtocols)
        if (transformedProtocols.length > 0) {
          setSelectedProtocol(transformedProtocols[0])
        }
      } catch (err) {
        console.error('Error loading DeFi protocols:', err)
        setError(err instanceof Error ? err.message : 'Failed to load protocols')
      } finally {
        setLoading(false)
      }
    }
    
    loadProtocols()
  }, [user?.address])

  const formatTVL = (tvl: number): string => {
    if (tvl >= 1e9) return `${(tvl / 1e9).toFixed(1)}B`
    if (tvl >= 1e6) return `${(tvl / 1e6).toFixed(1)}M`
    if (tvl >= 1e3) return `${(tvl / 1e3).toFixed(1)}K`
    return tvl.toString()
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleDeposit = async () => {
    if (!selectedProtocol || !depositAmount || !user?.address) {
      setError('Please select a protocol and enter deposit amount')
      return
    }

    const amount = parseFloat(depositAmount)
    if (amount < selectedProtocol.minDeposit) {
      setError(`Minimum deposit is ${formatCurrency(selectedProtocol.minDeposit)}`)
      return
    }

    try {
      setDepositing(true)
      setError(null)
      
      // Create transaction record
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.address,
          transactionType: 'yield',
          amount: depositAmount,
          stablecoin: selectedCurrency,
          chainId: '1', // Default to Ethereum
          protocolName: selectedProtocol.name,
          description: `DeFi deposit to ${selectedProtocol.name}`,
          metadata: {
            protocolId: selectedProtocol.id,
            autoReinvest,
            expectedApy: selectedProtocol.apy
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to record transaction')
      }
      
      // Show success message
      alert(`Successfully initiated deposit of ${formatCurrency(parseFloat(depositAmount))} ${selectedCurrency} to ${selectedProtocol.name}!\n\nTransaction has been recorded and will be processed.`)
      
      setDepositAmount('')
      
      // Reload protocols to update user participation after a delay
      setTimeout(() => {
        const reloadProtocols = async () => {
          try {
            const response = await fetch(`/api/investments?userId=${user.address}&action=defi-protocols`)
            if (response.ok) {
              const data: DeFiProtocolWithUserData[] = await response.json()
              const transformedProtocols: DeFiProtocol[] = data.map(protocol => ({
                id: protocol.id,
                name: protocol.name,
                category: 'Lending' as const,
                tvl: parseFloat(protocol.tvlUsd || '0'),
                apy: parseFloat(protocol.currentApy || '0'),
                risk: protocol.risk_level as 'Low' | 'Medium' | 'High',
                description: protocol.description || '',
                features: protocol.supported_chains?.map(chain => `Chain ${chain}`) || [],
                token: protocol.protocol_key.toUpperCase(),
                minDeposit: 100,
                lockPeriod: 0,
                userDeposit: protocol.userDeposit,
                userEarned: protocol.userEarned,
                isUserParticipating: protocol.isUserParticipating
              }))
              setProtocols(transformedProtocols)
            }
          } catch (error) {
            console.error('Failed to reload protocols:', error)
          }
        }
        reloadProtocols()
      }, 1000)
    } catch (error) {
      console.error('Deposit failed:', error)
      setError(error instanceof Error ? error.message : 'Deposit failed')
    } finally {
      setDepositing(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-slate-600">Loading DeFi protocols...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600 text-lg font-semibold">Error loading protocols</div>
            <p className="text-slate-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
              Try Again
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const totalStaked = protocols.reduce((sum, p) => sum + parseFloat(p.userDeposit || '0'), 0)
  const totalEarned = protocols.reduce((sum, p) => sum + parseFloat(p.userEarned || '0'), 0)

  return (
    <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">DeFi Investment</h1>
            <p className="text-slate-600 mt-2">Earn yield through decentralized finance protocols</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-4 h-4 mr-1" />
              {formatCurrency(totalStaked)} Total Staked
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <Activity className="w-4 h-4 mr-1" />
              {formatCurrency(totalEarned)} Earned
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Protocol Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Available Protocols</span>
                </CardTitle>
                <CardDescription>
                  Choose from {protocols.length} verified DeFi protocols
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {protocols.map((protocol) => (
                  <Card 
                    key={protocol.id} 
                    className={`cursor-pointer transition-all ${selectedProtocol?.id === protocol.id ? 'ring-2 ring-emerald-500' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedProtocol(protocol)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-slate-400" />
                          <span className="font-semibold text-lg">{protocol.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {protocol.isUserParticipating && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Active
                            </Badge>
                          )}
                          <Badge className={getRiskColor(protocol.risk)}>
                            {protocol.risk} Risk
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 text-sm mb-3">{protocol.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">APY</span>
                          <div className="font-bold text-emerald-600">{protocol.apy.toFixed(2)}%</div>
                        </div>
                        <div>
                          <span className="text-slate-500">TVL</span>
                          <div className="font-bold">${formatTVL(protocol.tvl)}</div>
                        </div>
                      </div>
                      
                      {protocol.isUserParticipating && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Your Deposit</span>
                              <div className="font-semibold text-blue-600">{formatCurrency(parseFloat(protocol.userDeposit || '0'))}</div>
                            </div>
                            <div>
                              <span className="text-slate-500">Earned</span>
                              <div className="font-semibold text-green-600">{formatCurrency(parseFloat(protocol.userEarned || '0'))}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Deposit Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Make Deposit</span>
                </CardTitle>
                <CardDescription>
                  {selectedProtocol ? `Deposit to ${selectedProtocol.name}` : 'Select a protocol to continue'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Currency</label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Amount</label>
                  <Input
                    type="number"
                    placeholder={`Min: ${selectedProtocol ? formatCurrency(selectedProtocol.minDeposit) : '0'}`}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={!selectedProtocol}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Auto-reinvest</label>
                  <Switch
                    checked={autoReinvest}
                    onCheckedChange={setAutoReinvest}
                  />
                </div>

                {selectedProtocol && (
                  <div className="bg-slate-50 p-3 rounded-lg text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Expected APY:</span>
                      <span className="font-semibold text-emerald-600">{selectedProtocol.apy.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lock Period:</span>
                      <span>{selectedProtocol.lockPeriod} days</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleDeposit}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                  disabled={depositing || !selectedProtocol}
                >
                  {depositing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {depositing ? 'Processing...' : `Deposit ${selectedCurrency}`}
                </Button>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedProtocol && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Protocol Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-3">Protocol Details</h3>
                  <p className="text-slate-600 mb-4">{selectedProtocol.description || 'No description available'}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900">Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProtocol.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}