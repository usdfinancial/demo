'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CreditCard, DollarSign, Shield, Settings } from 'lucide-react'
import { CreateCardData } from '@/lib/services/stripeService'

interface CardIssueFormProps {
  cardholderId: string
  onSubmit: (data: CreateCardData) => Promise<void>
  isLoading?: boolean
}

export function CardIssueForm({ cardholderId, onSubmit, isLoading }: CardIssueFormProps) {
  const [formData, setFormData] = useState<CreateCardData>({
    userId: '', // This should be set by the parent component
    cardholderId,
    cardName: '',
    currency: 'usd',
    type: 'virtual',
    activateOnCreation: true,
    spendingControls: {
      spendingLimits: [
        { amount: 1000, interval: 'per_authorization' },
        { amount: 5000, interval: 'daily' },
        { amount: 20000, interval: 'monthly' }
      ],
      blockedCategories: [],
      allowedCategories: []
    }
  })

  const [enableSpendingLimits, setEnableSpendingLimits] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Card name is required'
    }

    if (enableSpendingLimits && formData.spendingControls?.spendingLimits) {
      formData.spendingControls.spendingLimits.forEach((limit, index) => {
        if (limit.amount <= 0) {
          newErrors[`limit_${index}`] = 'Spending limit must be greater than 0'
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const submitData = {
        ...formData,
        spendingControls: enableSpendingLimits ? formData.spendingControls : undefined
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error issuing card:', error)
    }
  }

  const updateSpendingLimit = (index: number, field: 'amount' | 'interval', value: any) => {
    setFormData(prev => ({
      ...prev,
      spendingControls: {
        ...prev.spendingControls!,
        spendingLimits: prev.spendingControls?.spendingLimits?.map((limit, i) =>
          i === index ? { ...limit, [field]: value } : limit
        )
      }
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-600" />
          Issue Virtual Card
        </CardTitle>
        <CardDescription>
          Create a new virtual card with customizable spending controls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card Details
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="cardName">Card Name *</Label>
              <Input
                id="cardName"
                value={formData.cardName}
                onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                placeholder="e.g., Online Shopping, Netflix Subscription"
                className={errors.cardName ? 'border-red-500' : ''}
              />
              {errors.cardName && <p className="text-sm text-red-500">{errors.cardName}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value: 'usd') => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD - US Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Card Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'virtual') => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">Virtual Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Card Activation */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Card Activation
            </h3>

            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="activate-on-creation" className="font-medium">
                    Activate card immediately
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.activateOnCreation
                      ? 'Card will be active and ready to use immediately after creation'
                      : 'Card will be created in inactive state and can be activated later'
                    }
                  </p>
                </div>
                <Switch
                  id="activate-on-creation"
                  checked={formData.activateOnCreation}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activateOnCreation: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Spending Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Spending Controls
              </h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-limits"
                  checked={enableSpendingLimits}
                  onCheckedChange={setEnableSpendingLimits}
                />
                <Label htmlFor="enable-limits">Enable spending limits</Label>
              </div>
            </div>

            {enableSpendingLimits && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">Set Spending Limits</span>
                  </div>
                  
                  {formData.spendingControls?.spendingLimits?.map((limit, index) => (
                    <div key={index} className="grid gap-3 md:grid-cols-2 mb-3">
                      <div className="space-y-1">
                        <Label className="text-sm">
                          {limit.interval === 'per_authorization' ? 'Per Transaction' : 
                           limit.interval === 'daily' ? 'Daily Limit' : 
                           limit.interval === 'monthly' ? 'Monthly Limit' : 
                           'Limit'}
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={limit.amount}
                            onChange={(e) => updateSpendingLimit(index, 'amount', parseInt(e.target.value) || 0)}
                            className={`pl-10 ${errors[`limit_${index}`] ? 'border-red-500' : ''}`}
                            min="1"
                          />
                        </div>
                        {errors[`limit_${index}`] && (
                          <p className="text-sm text-red-500">{errors[`limit_${index}`]}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-sm">Interval</Label>
                        <Select
                          value={limit.interval}
                          onValueChange={(value: any) => updateSpendingLimit(index, 'interval', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_authorization">Per Transaction</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-sm text-emerald-700 font-medium mb-1">Security Summary</div>
                  <div className="text-xs text-emerald-600">
                    {formData.spendingControls?.spendingLimits?.map((limit, index) => (
                      <div key={index}>
                        {formatCurrency(limit.amount)} {limit.interval.replace('_', ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Card Preview</h3>
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Card Name:</span>
                  <span className="font-medium">{formData.cardName || 'Untitled Card'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="font-medium">Virtual Card</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Currency:</span>
                  <span className="font-medium">USD</span>
                </div>
                {enableSpendingLimits && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Limit:</span>
                    <span className="font-medium">
                      {formatCurrency(formData.spendingControls?.spendingLimits?.find(l => l.interval === 'daily')?.amount || 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            {isLoading ? 'Issuing Card...' : 'Issue Virtual Card'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}