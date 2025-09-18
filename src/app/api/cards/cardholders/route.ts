import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { withErrorHandler } from '@/lib/middleware/errorHandler'
import { authenticateApiRequest, requireResourceAccess } from '@/lib/middleware/auth'
import { applyRateLimit, apiRateLimiter } from '@/lib/middleware/rateLimiting'
import { validateRequest } from '@/lib/validation/middleware'

// Lazy Stripe initialization to avoid build-time failures in demo mode
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  // Omit apiVersion to use SDK default and avoid TS literal mismatches
  return new Stripe(key)
}

const CreateCardholderSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['individual', 'company']),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.object({
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(1900).max(new Date().getFullYear() - 13)
  }),
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2).default('US')
  })
})

export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  // Validate request body
  const validation = await validateRequest(request, {
    body: CreateCardholderSchema
  })
  const body = validation.body
  if (!body) {
    throw new Error('Invalid request body')
  }

  // Check if user can access this resource
  requireResourceAccess(body.userId)(authenticatedUser)

  try {
    const stripe = getStripe()

    // Demo mode: generate rich mock cardholder data for elegant demo experience
    if (!stripe) {
      const mockCardholder = {
        id: `demo_ch_${body.userId.slice(0, 8)}_${Date.now()}`,
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        status: 'active' as const,
        type: body.type,
        phoneNumber: body.phoneNumber || `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        individual: body.type === 'individual' ? {
          firstName: body.firstName,
          lastName: body.lastName,
          dateOfBirth: body.dateOfBirth
        } : undefined,
        billing: {
          address: {
            line1: body.address.line1,
            line2: body.address.line2,
            city: body.address.city,
            state: body.address.state,
            postalCode: body.address.postalCode,
            country: body.address.country || 'US'
          }
        },
        requirements: {
          currentDeadline: null,
          currentlyDue: [],
          disabledReason: null,
          errors: [],
          pastDue: [],
          pendingVerification: []
        },
        createdAt: new Date().toISOString(),
        metadata: {
          userId: body.userId,
          createdBy: 'usd-financial-demo',
          demoMode: 'true'
        }
      }
      
      return NextResponse.json({
        success: true,
        data: mockCardholder,
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 201 })
    }

    // Create cardholder in Stripe
    const cardholder = await stripe.issuing.cardholders.create({
      type: body.type,
      name: `${body.firstName} ${body.lastName}`,
      email: body.email,
      phone_number: body.phoneNumber,
      individual: body.type === 'individual' ? {
        first_name: body.firstName,
        last_name: body.lastName,
        dob: body.dateOfBirth
      } : undefined,
      billing: {
        address: {
          line1: body.address.line1,
          line2: body.address.line2,
          city: body.address.city,
          state: body.address.state,
          postal_code: body.address.postalCode,
          country: body.address.country || 'US'
        }
      },
      metadata: {
        userId: body.userId,
        createdBy: 'usd-financial-app'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: cardholder.id,
        name: cardholder.name,
        email: cardholder.email,
        status: cardholder.status,
        type: cardholder.type,
        createdAt: new Date(cardholder.created * 1000).toISOString()
      },
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create Stripe cardholder:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`)
    }
    
    throw new Error('Failed to create cardholder')
  }
})

export const GET = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    throw new Error('User ID is required')
  }

  // Check if user can access this resource
  requireResourceAccess(userId)(authenticatedUser)

  try {
    const stripe = getStripe()

    if (!stripe) {
      // Demo mode: return rich mock cardholders for elegant demo experience
      const mockCardholders = [
        {
          id: `demo_ch_${userId.slice(0, 8)}_primary`,
          name: 'John Doe',
          email: 'john.doe@example.com',
          status: 'active' as const,
          type: 'individual' as const,
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: `demo_ch_${userId.slice(0, 8)}_business`,
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
          status: 'active' as const,
          type: 'company' as const,
          createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      ]
      
      return NextResponse.json({
        success: true,
        data: mockCardholders,
        dataSource: 'demo_mode',
        timestamp: new Date().toISOString(),
        requestId
      })
    }

    // Get cardholders for this user
    const cardholders = await stripe.issuing.cardholders.list({
      limit: 100
    })

    const userCardholders = cardholders.data.filter(
      cardholder => cardholder.metadata?.userId === userId
    )

    return NextResponse.json({
      success: true,
      data: userCardholders.map(cardholder => ({
        id: cardholder.id,
        name: cardholder.name,
        email: cardholder.email,
        status: cardholder.status,
        type: cardholder.type,
        createdAt: new Date(cardholder.created * 1000).toISOString()
      })),
      timestamp: new Date().toISOString(),
      requestId
    })

  } catch (error) {
    console.error('Failed to fetch Stripe cardholders:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`)
    }
    
    throw new Error('Failed to fetch cardholders')
  }
})