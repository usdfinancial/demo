'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Plus, Filter, Search, Info, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/auth/AuthGuard'

interface TokenizedAsset {
  id: string
  name: string
  symbol: string
  category: string
  price: number
  change24h: number
  marketCap: number
  totalSupply: number
  circulatingSupply: number
  minInvestment: number
  apy: number
  riskLevel: 'Low' | 'Medium' | 'High'
  description: string
  underlying: string
  features: string[]
  provider: string
  launched: string
  userInvestment?: string
  userShares?: string
  isUserInvesting?: boolean
}

export default function TokenizedAssetsPageDatabase() {
  const { user } = useAuth()
  const [assets, setAssets] = useState<TokenizedAsset[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('marketCap')
  const [selectedAsset, setSelectedAsset] = useState<TokenizedAsset | null>(null)
  const [isInvesting, setIsInvesting] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [investmentCurrency, setInvestmentCurrency] = useState<StablecoinSymbol>('USDC')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load tokenized assets from API
  useEffect(() => {
    const loadAssets = async () => {
      if (!user?.address) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/assets?userId=${user.address}`)
        if (!response.ok) {
          throw new Error('Failed to load tokenized assets')
        }
        
        const data = await response.json()
        
        // Transform API data to component format
        const transformedAssets: TokenizedAsset[] = data.map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          symbol: asset.symbol,
          category: asset.category || 'Investment',
          price: parseFloat(asset.currentPrice || asset.price || '100'),
          change24h: parseFloat(asset.priceChange24h || '0'),
          marketCap: parseFloat(asset.marketCapUsd || '1000000'),
          totalSupply: parseInt(asset.totalSupply || '1000000'),
          circulatingSupply: parseInt(asset.circulatingSupply || asset.totalSupply || '1000000'),
          minInvestment: parseFloat(asset.minimumInvestment || '100'),
          apy: parseFloat(asset.expectedReturn || asset.apy || '5'),
          riskLevel: asset.riskLevel as 'Low' | 'Medium' | 'High' || 'Medium',
          description: asset.description || 'Investment opportunity in tokenized assets',
          underlying: asset.underlying || asset.name,
          features: asset.features ? asset.features.split(',').map((f: string) => f.trim()) : ['Tokenized', 'Liquid', 'Transparent'],
          provider: asset.provider || 'Asset Manager',
          launched: asset.createdAt ? new Date(asset.createdAt).toISOString().split('T')[0] : '2023-01-01',
          userInvestment: asset.userInvestment,
          userShares: asset.userShares,
          isUserInvesting: asset.isUserInvesting
        }))
        
        setAssets(transformedAssets)
        if (transformedAssets.length > 0) {
          setSelectedAsset(transformedAssets[0])
        }
      } catch (err) {
        console.error('Error loading assets:', err)
        setError(err instanceof Error ? err.message : 'Failed to load assets')
      } finally {
        setLoading(false)
      }
    }
    
    loadAssets()
  }, [user?.address])

  const categories = ['all', ...Array.from(new Set(assets.map(asset => asset.category)))]
  
  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case 'marketCap': return b.marketCap - a.marketCap
      case 'apy': return b.apy - a.apy
      case 'price': return b.price - a.price
      case 'change24h': return b.change24h - a.change24h
      default: return 0
    }
  })

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toString()
  }

  const totalMarketCap = assets.reduce((sum, asset) => sum + asset.marketCap, 0)
  const averageAPY = assets.length > 0 ? assets.reduce((sum, asset) => sum + asset.apy, 0) / assets.length : 0
  const totalInvested = assets.reduce((sum, asset) => sum + parseFloat(asset.userInvestment || '0'), 0)

  const handleStartInvesting = () => {
    if (selectedAsset) {
      document.getElementById('invest-button')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setError('Please select an asset to start investing')
    }
  }

  const handleInvestInAsset = async (asset: TokenizedAsset) => {
    if (!investmentAmount || parseFloat(investmentAmount) < asset.minInvestment) {
      setError(`Minimum investment is ${formatCurrency(asset.minInvestment)}`)
      return
    }

    if (!user?.address) {
      setError('Please connect your wallet')
      return
    }

    setIsInvesting(true)
    setError(null)
    
    try {
      // Create transaction record
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.address,
          transactionType: 'investment',
          amount: investmentAmount,
          stablecoin: investmentCurrency,
          chainId: '1',
          protocolName: asset.name,
          description: `Investment in ${asset.name}`,
          metadata: {
            assetId: asset.id,
            assetSymbol: asset.symbol,
            expectedApy: asset.apy,
            assetCategory: asset.category
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to record investment')
      }
      
      alert(`Successfully invested ${formatCurrency(parseFloat(investmentAmount))} ${investmentCurrency} in ${asset.name}!\n\nTransaction has been recorded and will be processed.`)
      setInvestmentAmount('')
      
      // Reload assets to update user investment status
      setTimeout(() => {
        const reloadAssets = async () => {
          try {
            const response = await fetch(`/api/assets?userId=${user.address}`)
            if (response.ok) {
              const data = await response.json()
              const transformedAssets: TokenizedAsset[] = data.map((asset: any) => ({
                id: asset.id,
                name: asset.name,
                symbol: asset.symbol,
                category: asset.category || 'Investment',
                price: parseFloat(asset.currentPrice || asset.price || '100'),
                change24h: parseFloat(asset.priceChange24h || '0'),
                marketCap: parseFloat(asset.marketCapUsd || '1000000'),
                totalSupply: parseInt(asset.totalSupply || '1000000'),
                circulatingSupply: parseInt(asset.circulatingSupply || asset.totalSupply || '1000000'),
                minInvestment: parseFloat(asset.minimumInvestment || '100'),
                apy: parseFloat(asset.expectedReturn || asset.apy || '5'),
                riskLevel: asset.riskLevel as 'Low' | 'Medium' | 'High' || 'Medium',
                description: asset.description || 'Investment opportunity in tokenized assets',
                underlying: asset.underlying || asset.name,
                features: asset.features ? asset.features.split(',').map((f: string) => f.trim()) : ['Tokenized', 'Liquid', 'Transparent'],
                provider: asset.provider || 'Asset Manager',
                launched: asset.createdAt ? new Date(asset.createdAt).toISOString().split('T')[0] : '2023-01-01',
                userInvestment: asset.userInvestment,
                userShares: asset.userShares,
                isUserInvesting: asset.isUserInvesting
              }))
              setAssets(transformedAssets)
            }
          } catch (error) {
            console.error('Failed to reload assets:', error)
          }
        }
        reloadAssets()
      }, 1000)
    } catch (error) {
      console.error('Investment failed:', error)
      setError(error instanceof Error ? error.message : 'Investment failed')
    } finally {
      setIsInvesting(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-slate-600">Loading tokenized assets...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error && assets.length === 0) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600 text-lg font-semibold">Error loading assets</div>
            <p className="text-slate-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
              Try Again
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Tokenized Assets
            </h1>
            <p className="text-muted-foreground mt-1">Invest in real-world assets through blockchain technology</p>
          </div>
          <div className="flex items-center space-x-2">
            {totalInvested > 0 && (
              <Badge className="bg-blue-100 text-blue-800">
                <DollarSign className="w-4 h-4 mr-1" />
                {formatCurrency(totalInvested)} Invested
              </Badge>
            )}
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              onClick={handleStartInvesting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Start Investing
            </Button>
          </div>
        </div>

        {/* Market Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Total Market Cap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">${formatLargeNumber(totalMarketCap)}</div>
              <p className="text-sm text-muted-foreground">Across all assets</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Average APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageAPY.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Expected returns</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Asset Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length - 1}</div>
              <p className="text-sm text-muted-foreground">Available categories</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-emerald-600" />
                Min Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assets.length > 0 ? formatCurrency(Math.min(...assets.map(a => a.minInvestment))) : '$0'}
              </div>
              <p className="text-sm text-muted-foreground">Starting from</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketCap">Market Cap</SelectItem>
                <SelectItem value="apy">APY</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="change24h">24h Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Asset List */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Assets</CardTitle>
                <CardDescription>
                  {filteredAssets.length} of {assets.length} assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assets.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No assets available</p>
                    <p className="text-sm">Assets will appear here once loaded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedAsset?.id === asset.id
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                        }`}
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                              <span className="font-bold text-emerald-600">{asset.symbol}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold">{asset.name}</h3>
                              <p className="text-sm text-muted-foreground">{asset.underlying}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {asset.category}
                                </Badge>
                                <Badge className={`${getRiskColor(asset.riskLevel)} text-xs`}>
                                  {asset.riskLevel} Risk
                                </Badge>
                                {asset.isUserInvesting && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    Invested
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">${asset.price.toFixed(2)}</div>
                            <div className={`text-sm flex items-center gap-1 ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {asset.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">{asset.apy}% APY</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Market Cap:</span>
                            <div className="font-medium">${formatLargeNumber(asset.marketCap)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Investment:</span>
                            <div className="font-medium">{formatCurrency(asset.minInvestment)}</div>
                          </div>
                        </div>

                        {asset.isUserInvesting && asset.userInvestment && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Your Investment:</span>
                                <div className="font-semibold text-blue-600">{formatCurrency(parseFloat(asset.userInvestment))}</div>
                              </div>
                              {asset.userShares && (
                                <div>
                                  <span className="text-muted-foreground">Shares:</span>
                                  <div className="font-semibold text-green-600">{asset.userShares}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Asset Details */}
          <div className="space-y-4">
            {selectedAsset ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-600" />
                      Asset Details
                    </CardTitle>
                    <CardDescription>
                      {selectedAsset.name} ({selectedAsset.symbol})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="text-sm font-medium text-emerald-800">Investment Summary</div>
                      <div className="text-xs text-emerald-600 mt-1">{selectedAsset.description}</div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-medium">{selectedAsset.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Launched:</span>
                        <span className="font-medium">{selectedAsset.launched}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Supply:</span>
                        <span className="font-medium">{formatLargeNumber(selectedAsset.totalSupply)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Circulating:</span>
                        <span className="font-medium">{formatLargeNumber(selectedAsset.circulatingSupply)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Supply Utilization:</span>
                        <span>{((selectedAsset.circulatingSupply / selectedAsset.totalSupply) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={(selectedAsset.circulatingSupply / selectedAsset.totalSupply) * 100} 
                        className="h-2" 
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedAsset.features.map((feature, index) => (
                          <span key={index} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Investment Amount</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder={`Min: ${formatCurrency(selectedAsset.minInvestment)}`}
                            value={investmentAmount}
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                            className="flex-1"
                          />
                          <Select value={investmentCurrency} onValueChange={(value: StablecoinSymbol) => setInvestmentCurrency(value)}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USDC">USDC</SelectItem>
                              <SelectItem value="USDT">USDT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        id="invest-button"
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        onClick={() => handleInvestInAsset(selectedAsset)}
                        disabled={isInvesting || !investmentAmount || parseFloat(investmentAmount) < selectedAsset.minInvestment}
                      >
                        {isInvesting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {isInvesting ? 'Investing...' : `Invest in ${selectedAsset.symbol}`}
                      </Button>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="text-sm font-medium">{selectedAsset.apy}% APY</div>
                        <div className="text-xs text-muted-foreground">Expected annual return</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="text-sm font-medium">{formatCurrency(selectedAsset.minInvestment)}</div>
                        <div className="text-xs text-muted-foreground">Minimum investment</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm"
                      onClick={() => setError(`Documentation for ${selectedAsset.name} would be available in production`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select an Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Choose an asset from the list to view detailed information and investment options.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Category Performance */}
        {assets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>
                Performance comparison across different asset categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {categories.slice(1).map((category) => {
                  const categoryAssets = assets.filter(asset => asset.category === category)
                  const avgAPY = categoryAssets.length > 0 ? categoryAssets.reduce((sum, asset) => sum + asset.apy, 0) / categoryAssets.length : 0
                  const totalMarketCap = categoryAssets.reduce((sum, asset) => sum + asset.marketCap, 0)
                  
                  return (
                    <div key={category} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{category}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Assets:</span>
                          <span className="font-medium">{categoryAssets.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg APY:</span>
                          <span className="font-medium text-green-600">{avgAPY.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Market Cap:</span>
                          <span className="font-medium">${formatLargeNumber(totalMarketCap)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}