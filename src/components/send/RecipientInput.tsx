'use client'

import React, { useState, useEffect } from 'react'
import { Check, X, AlertTriangle, User, Search, QrCode, Copy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface RecipientInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange: (isValid: boolean, recipientInfo?: RecipientInfo) => void
  className?: string
}

interface RecipientInfo {
  address: string
  type: 'address' | 'ens' | 'contact'
  name?: string
  avatar?: string
  isVerified?: boolean
  lastSent?: string
}

export function RecipientInput({ 
  value, 
  onChange, 
  onValidationChange, 
  className = '' 
}: RecipientInputProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null)
  const [suggestions, setSuggestions] = useState<RecipientInfo[]>([])

  // Mock contacts for demonstration
  const mockContacts: RecipientInfo[] = [
    {
      address: '0x742d35Cc6634C0532925a3b8D4C7623fd0C0C9f1',
      type: 'contact',
      name: 'Alice Johnson',
      isVerified: true,
      lastSent: '2024-01-20'
    },
    {
      address: '0x8A4B7C17B8F4C4D6Ea9D4A2F1E2F2E8B9D3A5C7E',
      type: 'contact',
      name: 'Bob Smith',
      isVerified: true,
      lastSent: '2024-01-18'
    }
  ]

  const validateRecipient = async (input: string) => {
    if (!input) {
      setValidationStatus('idle')
      setRecipientInfo(null)
      onValidationChange(false)
      return
    }

    setIsValidating(true)

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      let recipient: RecipientInfo | null = null

      // Check if it's a known contact (by name or partial address)
      const contactMatch = mockContacts.find(contact => 
        contact.name?.toLowerCase().includes(input.toLowerCase()) ||
        contact.address.toLowerCase().includes(input.toLowerCase())
      )

      if (contactMatch) {
        recipient = contactMatch
      }
      // Check if it's an ENS name
      else if (input.endsWith('.eth')) {
        // Simulate ENS resolution
        recipient = {
          address: '0x' + Math.random().toString(16).substr(2, 8).padStart(40, '0'),
          type: 'ens',
          name: input,
          isVerified: Math.random() > 0.3 // 70% chance of being verified
        }
      }
      // Check if it's a valid Ethereum address
      else if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
        recipient = {
          address: input,
          type: 'address',
          isVerified: Math.random() > 0.5 // 50% chance of being verified
        }
      }

      if (recipient) {
        setRecipientInfo(recipient)
        setValidationStatus('valid')
        onValidationChange(true, recipient)
      } else {
        setValidationStatus('invalid')
        onValidationChange(false)
      }
    } catch (error) {
      setValidationStatus('invalid')
      onValidationChange(false)
    } finally {
      setIsValidating(false)
    }
  }

  const generateSuggestions = (input: string) => {
    if (!input || input.length < 2) {
      setSuggestions([])
      return
    }

    const filtered = mockContacts.filter(contact =>
      contact.name?.toLowerCase().includes(input.toLowerCase()) ||
      contact.address.toLowerCase().includes(input.toLowerCase())
    )

    setSuggestions(filtered.slice(0, 3))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      validateRecipient(value)
    }, 500) // Debounce validation

    generateSuggestions(value)

    return () => clearTimeout(timer)
  }, [value])

  const getStatusIcon = () => {
    if (isValidating) {
      return <Search className="h-4 w-4 text-blue-500 animate-pulse" />
    }
    
    switch (validationStatus) {
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />
      case 'invalid':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    if (isValidating) return 'Validating recipient...'
    
    switch (validationStatus) {
      case 'valid':
        if (recipientInfo?.type === 'contact') {
          return `Contact: ${recipientInfo.name}`
        } else if (recipientInfo?.type === 'ens') {
          return `ENS name resolved`
        } else if (recipientInfo?.isVerified) {
          return 'Verified wallet address'
        } else {
          return 'Valid wallet address'
        }
      case 'invalid':
        return 'Invalid address or ENS name'
      default:
        return ''
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Enter wallet address, ENS name, or search contacts"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pr-20 ${validationStatus === 'valid' ? 'border-green-300 bg-green-50' : ''} ${validationStatus === 'invalid' ? 'border-red-300 bg-red-50' : ''} ${className}`}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {getStatusIcon()}
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 border-emerald-200 text-emerald-600"
              onClick={() => {
                // TODO: Implement QR code scanning
                console.log('Open QR scanner')
              }}
            >
              <QrCode className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 border-emerald-200 text-emerald-600"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText()
                  onChange(text)
                } catch (err) {
                  console.log('Failed to read clipboard')
                }
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {getStatusMessage() && (
        <div className={`flex items-center gap-2 text-sm ${
          validationStatus === 'valid' ? 'text-green-600' :
          validationStatus === 'invalid' ? 'text-red-600' :
          'text-blue-600'
        }`}>
          {validationStatus === 'invalid' && <AlertTriangle className="h-3 w-3" />}
          <span>{getStatusMessage()}</span>
          {recipientInfo?.isVerified && (
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
              <Check className="h-2 w-2 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      )}

      {/* Recipient Info Card */}
      {recipientInfo && validationStatus === 'valid' && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                {recipientInfo.name ? (
                  <span className="text-sm font-semibold text-emerald-700">
                    {recipientInfo.name.split(' ').map(n => n[0]).join('')}
                  </span>
                ) : (
                  <User className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {recipientInfo.name || 'Wallet Address'}
                  </span>
                  {recipientInfo.isVerified && (
                    <Check className="h-3 w-3 text-green-500" />
                  )}
                </div>
                <div className="text-sm text-slate-600 font-mono">
                  {recipientInfo.type === 'ens' ? recipientInfo.name : shortenAddress(recipientInfo.address)}
                </div>
                {recipientInfo.lastSent && (
                  <div className="text-xs text-slate-500">
                    Last sent: {recipientInfo.lastSent}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && value && validationStatus !== 'valid' && (
        <Card>
          <CardContent className="p-2">
            <div className="text-xs text-slate-600 mb-2 px-2">Suggestions:</div>
            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.address}
                  className="w-full text-left p-2 rounded hover:bg-emerald-50 flex items-center gap-3"
                  onClick={() => onChange(suggestion.address)}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-emerald-700">
                      {suggestion.name?.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{suggestion.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {shortenAddress(suggestion.address)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}