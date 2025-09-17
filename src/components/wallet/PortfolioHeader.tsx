'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PortfolioHeaderProps {
  totalValue: number
  currency?: string
  isLoading?: boolean
  isAAReady?: boolean
}

export function PortfolioHeader({ totalValue, currency = 'USD', isLoading = false, isAAReady = false }: PortfolioHeaderProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible)
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-3xl p-8 border border-emerald-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h2 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Total Balance</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleBalanceVisibility}
          className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-full transition-all duration-200"
        >
          {isBalanceVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="flex items-baseline gap-3 mb-2">
        {isLoading ? (
          <div className="h-14 w-56 bg-emerald-200 animate-pulse rounded-xl" />
        ) : (
          <>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
              {isBalanceVisible ? formatCurrency(totalValue).split('.')[0] : '••••••'}
            </h1>
            {isBalanceVisible && totalValue % 1 !== 0 && (
              <span className="text-2xl font-semibold text-gray-600">
                .{formatCurrency(totalValue).split('.')[1]}
              </span>
            )}
          </>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-emerald-600">
          Available to spend
        </p>
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
          isAAReady 
            ? 'text-emerald-600 bg-emerald-100' 
            : 'text-orange-600 bg-orange-100'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isAAReady ? 'bg-emerald-500' : 'bg-orange-500'
          }`}></div>
          {isAAReady ? 'Gasless Mode Active' : 'EOA Backup Mode'}
        </div>
      </div>
    </div>
  )
}