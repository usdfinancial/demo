'use client'

import { useState } from 'react'
import { AlertCircle, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Asset {
  id: string
  name: string
  symbol: string
  balance: number
  usdValue: number
  icon: string
  minimumWithdraw: number
}

interface Network {
  id: string
  name: string
  displayName: string
  fee: number
  estimatedTime: string
  icon: string
}

interface WithdrawModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: Asset[]
  networks: Network[]
  onConfirmWithdraw?: (data: {
    assetId: string
    amount: number
    address: string
    networkId: string
  }) => void
}

export function WithdrawModal({ 
  open, 
  onOpenChange, 
  assets, 
  networks, 
  onConfirmWithdraw 
}: WithdrawModalProps) {
  const [selectedAsset, setSelectedAsset] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const currentAsset = assets.find(a => a.id === selectedAsset)
  const currentNetwork = networks.find(n => n.id === selectedNetwork)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const isValidAddress = (addr: string) => {
    return addr.length >= 40 && addr.startsWith('0x')
  }

  const isFormValid = () => {
    const numAmount = parseFloat(amount)
    return (
      selectedAsset &&
      selectedNetwork &&
      amount &&
      address &&
      isValidAddress(address) &&
      numAmount > 0 &&
      currentAsset &&
      numAmount <= currentAsset.balance &&
      numAmount >= currentAsset.minimumWithdraw
    )
  }

  const handleMaxClick = () => {
    if (currentAsset && currentNetwork) {
      const maxAmount = Math.max(0, currentAsset.balance - currentNetwork.fee)
      setAmount(maxAmount.toString())
    }
  }

  const handleContinue = () => {
    if (isFormValid()) {
      setShowConfirmation(true)
    }
  }

  const handleConfirm = () => {
    if (isFormValid() && onConfirmWithdraw) {
      onConfirmWithdraw({
        assetId: selectedAsset,
        amount: parseFloat(amount),
        address,
        networkId: selectedNetwork
      })
      onOpenChange(false)
      setShowConfirmation(false)
      setSelectedAsset('')
      setSelectedNetwork('')
      setAmount('')
      setAddress('')
    }
  }

  const handleBack = () => {
    setShowConfirmation(false)
  }

  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
            <DialogDescription className="text-gray-600">Please review your transaction details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asset</span>
                    <div className="flex items-center gap-2">
                      <span>{currentAsset?.icon}</span>
                      <span className="font-medium">{currentAsset?.symbol}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">{amount} {currentAsset?.symbol}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">To Address</span>
                    <span className="font-mono text-sm">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <div className="flex items-center gap-2">
                      <span>{currentNetwork?.icon}</span>
                      <span className="font-medium">{currentNetwork?.displayName}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network Fee</span>
                    <span className="font-medium">{currentNetwork?.fee} {currentAsset?.symbol}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total Cost</span>
                      <span>{(parseFloat(amount) + (currentNetwork?.fee || 0)).toFixed(6)} {currentAsset?.symbol}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This transaction cannot be reversed. Please verify the address is correct.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Confirm Withdrawal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Send Money</DialogTitle>
          <DialogDescription className="text-gray-600">Transfer your assets to another wallet</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="asset">Select Asset</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    <div className="flex items-center gap-2">
                      <span>{asset.icon}</span>
                      <span>{asset.symbol}</span>
                      <span className="text-gray-500">({formatCurrency(asset.usdValue)})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="network">Network</Label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger>
                <SelectValue placeholder="Choose network" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    <div className="flex items-center gap-2">
                      <span>{network.icon}</span>
                      <span>{network.displayName}</span>
                      <span className="text-gray-500">({network.estimatedTime})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Amount</Label>
              {currentAsset && (
                <button
                  type="button"
                  onClick={handleMaxClick}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Max: {currentAsset.balance} {currentAsset.symbol}
                </button>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {currentAsset && parseFloat(amount) > 0 && (
              <p className="text-sm text-gray-500">
                ≈ {formatCurrency(parseFloat(amount))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Recipient Address</Label>
            <Input
              id="address"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={!isValidAddress(address) && address ? 'border-red-300' : ''}
            />
            {address && !isValidAddress(address) && (
              <p className="text-sm text-red-600">Please enter a valid address</p>
            )}
          </div>

          {currentNetwork && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>Network fee: {currentNetwork.fee} {currentAsset?.symbol || 'tokens'}</p>
              <p>Estimated time: {currentNetwork.estimatedTime}</p>
            </div>
          )}

          <Button
            onClick={handleContinue}
            disabled={!isFormValid()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}