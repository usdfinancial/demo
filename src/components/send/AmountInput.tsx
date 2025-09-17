'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, getStablecoinIcon, StablecoinSymbol } from '@/lib/data'

interface AmountInputProps {
  amount: string
  stablecoin: StablecoinSymbol
  onAmountChange: (amount: string) => void
  onStablecoinChange: (stablecoin: StablecoinSymbol) => void
  availableBalances: Record<StablecoinSymbol, number>
  useGasless: boolean
  onGaslessChange: (useGasless: boolean) => void
  className?: string
}

interface PresetAmount {
  value: number
  label: string
}

const PRESET_AMOUNTS: PresetAmount[] = [
  { value: 10, label: '$10' },
  { value: 25, label: '$25' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' }
]

export function AmountInput({
  amount,
  stablecoin,
  onAmountChange,
  onStablecoinChange,
  availableBalances,
  useGasless,
  onGaslessChange,
  className = ''
}: AmountInputProps) {
  const [focused, setFocused] = useState(false)
  const [exchangeRates] = useState({
    USDC: 1.00,
    USDT: 0.9998, // Slightly different rate for realism
    USDC_24h: 0.02,
    USDT_24h: -0.01
  })

  const currentBalance = availableBalances[stablecoin] || 0
  const networkFee = useGasless ? 0 : 0.50
  const numericAmount = parseFloat(amount) || 0
  const totalCost = numericAmount + networkFee
  const remainingBalance = currentBalance - totalCost

  const isInsufficientBalance = totalCost > currentBalance
  const isMaxAmount = numericAmount === (currentBalance - networkFee)

  const handleMaxClick = () => {
    const maxAmount = Math.max(0, currentBalance - networkFee)
    onAmountChange(maxAmount.toString())
  }

  const handlePresetClick = (value: number) => {
    onAmountChange(value.toString())
  }

  const getBalanceStatus = () => {
    if (isInsufficientBalance) {
      return {
        color: 'text-red-600',
        icon: <AlertTriangle className="h-3 w-3" />,
        message: `Insufficient balance. Need ${formatCurrency(totalCost - currentBalance)} more.`
      }
    } else if (remainingBalance < 10) {
      return {
        color: 'text-orange-600',
        icon: <AlertTriangle className="h-3 w-3" />,
        message: `Low balance remaining: ${formatCurrency(remainingBalance)}`
      }
    } else {
      return {
        color: 'text-green-600',
        icon: null,
        message: `Remaining balance: ${formatCurrency(remainingBalance)}`
      }
    }
  }

  const balanceStatus = getBalanceStatus()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Amount Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Amount to Send</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <DollarSign className="h-5 w-5 text-slate-400" />
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`pl-10 pr-20 text-2xl h-16 font-semibold text-center ${
              isInsufficientBalance ? 'border-red-300 bg-red-50' : 
              focused ? 'border-emerald-300' : ''
            }`}
            step="0.01"
            min="0"
            max={currentBalance}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-12 border-emerald-200 text-emerald-600"
            onClick={handleMaxClick}
            disabled={currentBalance <= networkFee}
          >
            MAX
          </Button>
        </div>

        {/* Balance Info */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">
            Available: {formatCurrency(currentBalance)} {stablecoin}
          </span>
          <div className={`flex items-center gap-1 ${balanceStatus.color}`}>
            {balanceStatus.icon}
            <span>{balanceStatus.message}</span>
          </div>
        </div>
      </div>

      {/* Preset Amounts */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quick Amounts</label>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant={amount === preset.value.toString() ? "default" : "outline"}
              size="sm"
              className={amount === preset.value.toString() ? 
                "bg-emerald-600 hover:bg-emerald-700" : 
                "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              }
              onClick={() => handlePresetClick(preset.value)}
              disabled={preset.value + networkFee > currentBalance}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stablecoin Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Currency</label>
        <div className="grid gap-3 md:grid-cols-2">
          <Select value={stablecoin} onValueChange={(value: StablecoinSymbol) => onStablecoinChange(value)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getStablecoinIcon('USDC')} USDC
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-green-600">
                      {exchangeRates.USDC_24h > 0 ? '+' : ''}
                      {exchangeRates.USDC_24h}%
                    </span>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="USDT">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getStablecoinIcon('USDT')} USDT
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-red-600">
                      {exchangeRates.USDT_24h}%
                    </span>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="text-right space-y-1">
            <div className="text-sm text-slate-600">Balance</div>
            <div className="font-semibold">{formatCurrency(currentBalance)}</div>
            <div className="text-xs text-slate-500">{currentBalance.toFixed(2)} {stablecoin}</div>
          </div>
        </div>
      </div>

      {/* Gasless Transaction Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-emerald-600" />
            <div>
              <div className="font-medium text-emerald-700">Gasless Transaction</div>
              <div className="text-xs text-emerald-600">
                Save on network fees with Account Abstraction
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant={useGasless ? "default" : "outline"}
            size="sm"
            onClick={() => onGaslessChange(!useGasless)}
            className={useGasless ? 
              "bg-emerald-600 hover:bg-emerald-700" : 
              "border-emerald-200 text-emerald-600 hover:bg-emerald-100"
            }
          >
            {useGasless ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-slate-900">Transaction Cost</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Send Amount:</span>
            <span className="font-medium">{formatCurrency(numericAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Network Fee:</span>
            <span className="font-medium">
              {useGasless ? (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                  <Zap className="h-2 w-2 mr-1" />
                  FREE
                </Badge>
              ) : (
                formatCurrency(networkFee)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Recipient Receives:</span>
            <span className="font-medium text-emerald-600">
              {formatCurrency(numericAmount)} {stablecoin}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
            <span>Total Cost:</span>
            <span className={isInsufficientBalance ? 'text-red-600' : ''}>
              {formatCurrency(totalCost)}
            </span>
          </div>
        </div>

        {/* Exchange Rate Info */}
        {stablecoin === 'USDT' && (
          <div className="text-xs text-slate-500 border-t border-slate-200 pt-2">
            Exchange rate: 1 USDT ≈ ${exchangeRates.USDT.toFixed(4)} USD
          </div>
        )}
      </div>
    </div>
  )
}