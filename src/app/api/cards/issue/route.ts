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
  return new Stripe(key)
}

// Rich mock data generator for demo mode
const generateMockCard = (userId: string, cardholderId: string, cardName: string, type: 'virtual' | 'physical' = 'virtual') => {
  const cardNumbers = ['4242', '5555', '4000', '3782', '6011']
  const brands = ['Visa', 'Mastercard', 'Visa', 'American Express', 'Discover']
  const randomIndex = Math.floor(Math.random() * cardNumbers.length)
  const last4 = cardNumbers[randomIndex]
  const brand = brands[randomIndex]
  const fullNumber = `${last4} ${last4} ${last4} ${last4}`
  
  return {
    id: `demo_card_${userId.slice(0, 8)}_${Date.now()}`,
    cardName,
    last4,
    brand,
    expiryMonth: Math.floor(Math.random() * 12) + 1,
    expiryYear: new Date().getFullYear() + Math.floor(Math.random() * 5) + 1,
    status: 'active' as const,
    type,
    currency: 'usd' as const,
    cardholderId,
    spendingControls: {
      spending_limits: [
        { amount: 500000, interval: 'daily' as const },
        { amount: 2000000, interval: 'monthly' as const }
      ]
    },
    createdAt: new Date().toISOString(),
    number: fullNumber,
    cvc: Math.floor(Math.random() * 900 + 100).toString(),
    localStorageStatus: 'demo_mode'
  }
}

// Generate mock user cards for GET endpoint
const generateMockUserCards = (userId: string) => {
  const cardTypes = ['virtual', 'virtual', 'physical'] as const
  const cardNames = ['Primary Card', 'Shopping Card', 'Business Card']
  
  return cardTypes.map((type, index) => ({
    id: `demo_card_${userId.slice(0, 8)}_${index}`,
    cardName: cardNames[index],
    last4: ['4242', '5555', '4000'][index],
    brand: ['Visa', 'Mastercard', 'Visa'][index],
    expiryMonth: [12, 8, 6][index],
    expiryYear: new Date().getFullYear() + [2, 3, 1][index],
    status: 'active' as const,
    type,
    currency: 'usd' as const,
    cardholderId: `demo_ch_${userId.slice(0, 8)}`,
    spendingControls: {
      spending_limits: [
        { amount: [500000, 300000, 1000000][index], interval: 'daily' as const }
      ]
    },
    createdAt: new Date(Date.now() - (index * 86400000)).toISOString(),
    isDefault: index === 0,
    billingAddress: {
      line1: '123 Demo Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US'
    },
    localStorageStatus: 'demo_mode',
    lastSyncedAt: new Date().toISOString()
  }))
}

const IssueCardSchema = z.object({
  userId: z.string().uuid(),
  cardholderId: z.string().min(1),
  cardName: z.string().min(1).max(100),
  currency: z.enum(['usd']).default('usd'),
  type: z.enum(['virtual']).default('virtual'),
  spendingControls: z.object({
    spendingLimits: z.array(z.object({
      amount: z.number().int().positive(),
      interval: z.enum(['per_authorization', 'daily', 'weekly', 'monthly', 'yearly'])
    })).optional(),
    blockedCategories: z.array(z.string()).optional(),
    allowedCategories: z.array(z.string()).optional()
  }).optional()
})

export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  // Validate request body
  const validation = await validateRequest(request, {
    body: IssueCardSchema
  })
  const body = validation.body
  if (!body) {
    throw new Error('Invalid request body')
  }

  // Check if user can access this resource
  requireResourceAccess(body.userId)(authenticatedUser)

  try {
    const stripe = getStripe()
    
    // Demo mode: always use rich mock data for elegant demo experience
    if (!stripe) {
      const mockCard = generateMockCard(body.userId, body.cardholderId, body.cardName, body.type || 'virtual')
      
      return NextResponse.json({
        success: true,
        data: mockCard,
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 201 })
    }

    // Production Stripe flow (when STRIPE_SECRET_KEY is available)
    const cardholder = await stripe.issuing.cardholders.retrieve(body.cardholderId)

    if (cardholder.metadata?.userId !== body.userId) {
      throw new Error('Cardholder not found or access denied')
    }

    // Create spending controls if provided
    let spendingControls: Stripe.Issuing.CardCreateParams.SpendingControls | undefined

    if (body.spendingControls) {
      spendingControls = {
        spending_limits: body.spendingControls.spendingLimits?.map(limit => ({
          amount: limit.amount * 100, // Convert to cents
          interval: limit.interval
        })),
        blocked_categories: body.spendingControls.blockedCategories as any,
        allowed_categories: body.spendingControls.allowedCategories as any
      }
    }

    // Issue the card
    const card = await stripe.issuing.cards.create({
      cardholder: body.cardholderId,
      currency: body.currency || 'usd',
      type: body.type || 'virtual',
      status: 'active',
      spending_controls: spendingControls,
      metadata: {
        userId: body.userId,
        cardName: body.cardName,
        createdBy: 'usd-financial-app'
      }
    })

    // Get card details including sensitive info
    const cardDetails = await stripe.issuing.cards.retrieve(card.id)

    return NextResponse.json({
      success: true,
      data: {
        id: card.id,
        cardName: body.cardName,
        last4: card.last4,
        brand: card.brand,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        status: card.status,
        type: card.type,
        currency: card.currency,
        cardholderId: card.cardholder,
        spendingControls: card.spending_controls,
        createdAt: new Date(card.created * 1000).toISOString(),
        // Include full card details for initial display
        number: cardDetails.number,
        cvc: cardDetails.cvc,
        // Indicate local storage status
        localStorageStatus: 'stripe_production'
      },
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to issue Stripe card:', error)

    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`)
    }

    throw new Error('Failed to issue card')
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
    
    // Demo mode: always return rich mock cards for elegant demo experience
    if (!stripe) {
      const mockCards = generateMockUserCards(userId)
      
      return NextResponse.json({
        success: true,
        data: mockCards,
        dataSource: 'demo_mode',
        timestamp: new Date().toISOString(),
        requestId
      })
    }

    // Production Stripe flow (when STRIPE_SECRET_KEY is available)
    const cardholders = await stripe.issuing.cardholders.list({
      limit: 100
    })

    const userCardholders = cardholders.data.filter(
      cardholder => cardholder.metadata?.userId === userId
    )

    const allCards = []

    for (const cardholder of userCardholders) {
      const cards = await stripe.issuing.cards.list({
        cardholder: cardholder.id,
        limit: 100
      })

      allCards.push(...cards.data)
    }

    return NextResponse.json({
      success: true,
      data: allCards.map((card: any) => ({
        id: card.id,
        cardName: card.metadata?.cardName || 'Unnamed Card',
        last4: card.last4,
        brand: card.brand,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        status: card.status,
        type: card.type,
        currency: card.currency,
        cardholderId: card.cardholder,
        spendingControls: card.spending_controls,
        createdAt: new Date(card.created * 1000).toISOString(),
        localStorageStatus: 'stripe_production'
      })),
      dataSource: 'stripe_production',
      timestamp: new Date().toISOString(),
      requestId
    })

  } catch (error) {
    console.error('Failed to fetch Stripe cards:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`)
    }
    
    throw new Error('Failed to fetch cards')
  }
})