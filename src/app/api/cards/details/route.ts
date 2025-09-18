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
  // Use SDK default apiVersion to avoid TS literal mismatches
  return new Stripe(key)
}

const CardDetailsSchema = z.object({
  userId: z.string().uuid(),
  cardId: z.string().min(1)
})

export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting - stricter for sensitive card details (use default limiter)
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  // Validate request body
  const validation = await validateRequest(request, {
    body: CardDetailsSchema
  })
  const body = validation.body
  if (!body) {
    throw new Error('Invalid request body')
  }

  // Check if user can access this resource
  requireResourceAccess(body.userId)(authenticatedUser)

  try {
    const stripe = getStripe()

    // Demo mode: return mock card details when Stripe is not configured
    if (!stripe) {
      return NextResponse.json({
        success: true,
        data: {
          id: body.cardId,
          number: '4242 4242 4242 4242',
          cvc: '123',
          expiryMonth: 12,
          expiryYear: 2030,
          cardName: 'Demo Card',
          last4: '4242',
          brand: 'Visa',
          status: 'active'
        },
        timestamp: new Date().toISOString(),
        requestId
      })
    }

    // Get card details
    const card = await stripe.issuing.cards.retrieve(body.cardId)

    // Verify card belongs to user's cardholder
    const cardholderId = typeof card.cardholder === 'string' ? card.cardholder : (card.cardholder as any)?.id
    const cardholder = await stripe.issuing.cardholders.retrieve(cardholderId as string)
    
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