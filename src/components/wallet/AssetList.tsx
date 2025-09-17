'use client'

import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Asset {
  id: string
  name: string
  symbol: string
  balance: number
  usdValue: number
  icon: string
  change24h?: number
}

interface AssetListProps {
  assets: Asset[]
  onAssetClick?: (asset: Asset) => void
}

export function AssetList({ assets, onAssetClick }: AssetListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatBalance = (balance: number, symbol: string) => {
    return `${balance.toLocaleString()} ${symbol}`
  }

  const formatChange = (change: number) => {
    const isPositive = change > 0
    return (
      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    )
  }

  return (
    <div className="space-y-3">
      {assets.map((asset) => (
        <div
          key={asset.id}
          onClick={() => onAssetClick?.(asset)}
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl shadow-sm">
                {asset.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{asset.symbol}</h3>
                <p className="text-sm text-gray-500 font-medium">
                  {formatBalance(asset.balance, asset.symbol)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-gray-900 text-xl">{formatCurrency(asset.usdValue)}</p>
                {asset.change24h !== undefined && (
                  <div className="flex items-center justify-end gap-1">
                    {formatChange(asset.change24h)}
                    <span className="text-xs text-gray-400">24h</span>
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>
          </div>
        </div>
      ))}
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🚀</span>
        </div>
        <h3 className="font-semibold text-blue-800 mb-1">Smart Wallet Features</h3>
        <p className="text-sm text-blue-600">
          Account Abstraction technology for seamless transactions and enhanced security
        </p>
      </div>
    </div>
  )
}