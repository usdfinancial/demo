import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { withErrorHandler } from '@/lib/middleware/errorHandler'
import { authenticateApiRequest, requireResourceAccess } from '@/lib/middleware/auth'
import { applyRateLimit, apiRateLimiter } from '@/lib/middleware/rateLimiting'
import { validateRequest } from '@/lib/validation/middleware'
import { cardService } from '@/lib/services/cardService'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
})

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
  const { body } = await validateRequest(request, {
    body: IssueCardSchema
  })

  // Check if user can access this resource
  requireResourceAccess(body.userId)(authenticatedUser)

  try {
    // Verify cardholder exists and belongs to user
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
        blocked_categories: body.spendingControls.blockedCategories,
        allowed_categories: body.spendingControls.allowedCategories
      }
    }

    // Issue the card
    const card = await stripe.issuing.cards.create({
      cardholder: body.cardholderId,
      currency: body.currency,
      type: body.type,
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

    // Store card in local database for analytics and backup
    try {
      await cardService.createCard({
        userId: body.userId,
        stripeCardId: card.id,
        cardholderName: body.cardName,
        billingAddress: cardholder.billing?.address ? {
          line1: cardholder.billing.address.line1 || undefined,
          line2: cardholder.billing.address.line2 || undefined,
          city: cardholder.billing.address.city || undefined,
          state: cardholder.billing.address.state || undefined,
          postalCode: cardholder.billing.address.postal_code || undefined,
          country: cardholder.billing.address.country || undefined
        } : undefined,
        isDefault: false, // Set first card as default later if needed
        metadata: {
          stripeCardType: card.type,
          spendingControls: card.spending_controls,
          cardholderId: card.cardholder
        }
      })

      console.log('✅ Card stored in local database:', {
        cardId: card.id,
        userId: body.userId,
        last4: card.last4
      })
    } catch (dbError) {
      console.error('⚠️ Failed to store card in local database:', dbError)
      // Don't fail the request - Stripe card was created successfully
    }

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
        localStorageStatus: 'stored'
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
    // Get cards from local database first (faster and includes local metadata)
    let localCards = []
    try {
      localCards = await cardService.getUserCards(userId, true) // with Stripe sync
      console.log(`✅ Found ${localCards.length} cards in local database`)
    } catch (dbError) {
      console.error('⚠️ Failed to get cards from local database:', dbError)
      // Fall back to Stripe-only query
    }

    // If we have local cards, use them as primary source
    if (localCards.length > 0) {
      return NextResponse.json({
        success: true,
        data: localCards.map(card => ({
          id: card.stripeCardId,
          cardName: card.cardholderName || 'Unnamed Card',
          last4: card.last4,
          brand: card.brand,
          expiryMonth: card.expMonth,
          expiryYear: card.expYear,
          status: card.isActive ? 'active' : 'inactive',
          type: card.metadata?.stripeCardType || 'virtual',
          currency: 'usd', // Default for USD Financial
          cardholderId: card.metadata?.cardholderId,
          spendingControls: card.metadata?.spendingControls,
          createdAt: card.createdAt.toISOString(),
          isDefault: card.isDefault,
          billingAddress: card.billingAddress,
          // Local database indicators
          localStorageStatus: 'stored',
          lastSyncedAt: card.updatedAt.toISOString()
        })),
        dataSource: 'local_database',
        timestamp: new Date().toISOString(),
        requestId
      })
    }

    // Fallback: Get all cards from Stripe directly
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
      data: allCards.map(card => ({
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
        // Stripe-only indicators
        localStorageStatus: 'not_stored'
      })),
      dataSource: 'stripe_direct',
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