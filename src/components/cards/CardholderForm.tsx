'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, MapPin, Phone, Mail, Calendar } from 'lucide-react'
import { CreateCardholderData } from '@/lib/services/stripeService'

interface CardholderFormProps {
  onSubmit: (data: CreateCardholderData) => Promise<void>
  isLoading?: boolean
}

export function CardholderForm({ onSubmit, isLoading }: CardholderFormProps) {
  const [formData, setFormData] = useState<CreateCardholderData>({
    userId: '', // This should be set by the parent component
    type: 'individual',
    firstName: '',
    lastName: '',
    companyName: '',
    taxId: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: {
      day: 1,
      month: 1,
      year: 2000
    },
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Type-specific validation
    if (formData.type === 'individual') {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      if (formData.firstName.length > 24) newErrors.firstName = 'First name must be 24 characters or less'
      if (formData.lastName.length > 24) newErrors.lastName = 'Last name must be 24 characters or less'
    } else if (formData.type === 'company') {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
      if (formData.companyName.length < 2) newErrors.companyName = 'Company name must be at least 2 characters'
      if (formData.companyName.length > 24) newErrors.companyName = 'Company name must be 24 characters or less'
      if (formData.companyName.split(' ').length < 2) newErrors.companyName = 'Company name must have at least 2 words (e.g., "Stripe Inc")'
    }

    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.address.line1.trim()) newErrors.line1 = 'Address line 1 is required'
    if (!formData.address.city.trim()) newErrors.city = 'City is required'
    if (!formData.address.state.trim()) newErrors.state = 'State is required'
    if (!formData.address.postalCode.trim()) newErrors.postalCode = 'Postal code is required'

    // Validate date of birth (must be at least 13 years old)
    const today = new Date()
    const birthDate = new Date(formData.dateOfBirth.year, formData.dateOfBirth.month - 1, formData.dateOfBirth.day)
    const age = today.getFullYear() - birthDate.getFullYear()
    if (age < 13) newErrors.dateOfBirth = 'Must be at least 13 years old'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error creating cardholder:', error)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof CreateCardholderData],
            [child]: value
          }
        }
      }
      return { ...prev, [field]: value }
    })
  }

  // Generate year options (current year - 100 to current year - 13)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 87 }, (_, i) => currentYear - 100 + i).reverse()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-600" />
          Create Cardholder Profile
        </CardTitle>
        <CardDescription>
          Set up your cardholder profile to start issuing virtual cards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cardholder Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Cardholder Type
            </h3>

            <div className="space-y-2">
              <Label htmlFor="type">Cardholder Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'individual' | 'company') => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose individual for personal cards or company for business cards
              </p>
            </div>
          </div>

          {/* Individual/Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {formData.type === 'individual' ? 'Personal Information' : 'Company Information'}
            </h3>
            
            {formData.type === 'individual' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={errors.firstName ? 'border-red-500' : ''}
                    maxLength={24}
                  />
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-500' : ''}
                    maxLength={24}
                  />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    className={errors.companyName ? 'border-red-500' : ''}
                    placeholder="e.g., Stripe Inc"
                    maxLength={24}
                  />
                  {errors.companyName && <p className="text-sm text-red-500">{errors.companyName}</p>}
                  <p className="text-sm text-muted-foreground">
                    Must be at least 2 words (e.g., "Stripe Inc")
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID (Optional)</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => updateFormData('taxId', e.target.value)}
                    placeholder="EIN or Tax ID number"
                  />
                  <p className="text-sm text-muted-foreground">
                    Federal Tax ID number for the company
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date of Birth *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={formData.dateOfBirth.month.toString()}
                  onValueChange={(value) => updateFormData('dateOfBirth.month', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i, 1).toLocaleString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={formData.dateOfBirth.day.toString()}
                  onValueChange={(value) => updateFormData('dateOfBirth.day', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={formData.dateOfBirth.year.toString()}
                  onValueChange={(value) => updateFormData('dateOfBirth.year', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Billing Address
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="line1">Address Line 1 *</Label>
              <Input
                id="line1"
                value={formData.address.line1}
                onChange={(e) => updateFormData('address.line1', e.target.value)}
                className={errors.line1 ? 'border-red-500' : ''}
                placeholder="123 Main Street"
              />
              {errors.line1 && <p className="text-sm text-red-500">{errors.line1}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="line2">Address Line 2 (Optional)</Label>
              <Input
                id="line2"
                value={formData.address.line2}
                onChange={(e) => updateFormData('address.line2', e.target.value)}
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => updateFormData('address.city', e.target.value)}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => updateFormData('address.state', e.target.value)}
                  className={errors.state ? 'border-red-500' : ''}
                  placeholder="CA"
                />
                {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  value={formData.address.postalCode}
                  onChange={(e) => updateFormData('address.postalCode', e.target.value)}
                  className={errors.postalCode ? 'border-red-500' : ''}
                  placeholder="12345"
                />
                {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.address.country}
                  onValueChange={(value) => updateFormData('address.country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            {isLoading ? 'Creating Profile...' : 'Create Cardholder Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}