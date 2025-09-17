import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { withErrorHandler } from '@/lib/middleware/errorHandler'
import { authenticateApiRequest, requireResourceAccess } from '@/lib/middleware/auth'
import { applyRateLimit, apiRateLimiter } from '@/lib/middleware/rateLimiting'
import { validateRequest } from '@/lib/validation/middleware'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
})

const CardDetailsSchema = z.object({
  userId: z.string().uuid(),
  cardId: z.string().min(1)
})

export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting - stricter for sensitive card details
  await applyRateLimit(request, apiRateLimiter, { maxRequests: 20, windowMs: 60000 })

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  // Validate request body
  const { body } = await validateRequest(request, {
    body: CardDetailsSchema
  })

  // Check if user can access this resource
  requireResourceAccess(body.userId)(authenticatedUser)

  try {
    // Get card details
    const card = await stripe.issuing.cards.retrieve(body.cardId)

    // Verify card belongs to user's cardholder
    const cardholder = await stripe.issuing.cardholders.retrieve(card.cardholder as string)
    
    if (cardholder.metadata?.userId !== body.userId) {
      throw new Error('Card not found or access denied')
    }

    return NextResponse.json({
      success: true,
      data: {
        id: card.id,
        number: card.number,
        cvc: card.cvc,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        cardName: card.metadata?.cardName || 'Unnamed Card',
        last4: card.last4,
        brand: card.brand,
        status: card.status
      },
      timestamp: new Date().toISOString(),
      requestId
    })

  } catch (error) {
    console.error('Failed to get card details:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`)
    }
    
    throw new Error('Failed to get card details')
  }
})