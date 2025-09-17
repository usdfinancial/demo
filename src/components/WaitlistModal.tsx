'use client'

import { useState } from 'react'
import { X, Mail, User, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  name: string
  email: string
}

interface FormErrors {
  name?: string
  email?: string
  submit?: string
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      // Try Netlify function first, then fallback to Next.js API route
      let response;
      let result;
      
      const requestBody = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim()
      };

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      };

      try {
        // Try Netlify function first (works in production and with netlify dev)
        response = await fetch('/.netlify/functions/submitWaitlist', requestOptions);
        result = await response.json();
      } catch (netlifyError) {
        console.log('Netlify function not available, trying Next.js API route...');
        // Fallback to Next.js API route (works in development)
        response = await fetch('/api/waitlist', requestOptions);
        result = await response.json();
      }

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to join waitlist')
      }

      setIsSuccess(true)
      
      // Reset form after success
      setTimeout(() => {
        setFormData({ name: '', email: '' })
        setIsSuccess(false)
        onClose()
      }, 10000)

    } catch (error) {
      console.error('Waitlist submission error:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleClose = () => {
    if (isSubmitting) return // Prevent closing during submission
    setFormData({ name: '', email: '' })
    setErrors({})
    setIsSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
            {isSuccess ? (
              <CheckCircle2 className="h-8 w-8 text-white" />
            ) : (
              <Sparkles className="h-8 w-8 text-white" />
            )}
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {isSuccess ? 'Welcome to USD Financial!' : 'Join the USD Financial Waitlist'}
          </DialogTitle>
          <DialogDescription className="text-slate-600 leading-relaxed">
            {isSuccess 
              ? "You're officially on the list! We'll reach out to you personally in the order you signed up."
              : "Be among the first to experience USD Financial - where stablecoin is all you need. Join our exclusive early access program."
            }
          </DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  className={`pl-10 h-12 border-2 rounded-lg transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className={`pl-10 h-12 border-2 rounded-lg transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Joining Waitlist...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Join Waitlist
                </>
              )}
            </Button>

            {/* Benefits */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center">
              Get on our waitlist today, and we'll reach out to you, in the order of registration, to help you get started.
              </p>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="space-y-4">
              <div className="text-emerald-600 font-medium">
                ✨ You're in! Position secured ✨
              </div>
              <p className="text-sm text-slate-600">
                Our team will personally reach out to{' '}
                <span className="font-medium text-slate-900">{formData.email}</span>
                {' '}in the order you joined. The earlier you signed up, the sooner you'll hear from us!
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}