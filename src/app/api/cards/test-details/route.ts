import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
}) : null

const CardDetailsSchema = z.object({
  userId: z.string(),
  cardId: z.string().min(1)
})

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/cards/test-details called:', {
    hasStripe: !!stripe,
    timestamp: new Date().toISOString()
  })

  if (!stripe) {
    return NextResponse.json({
      success: false,
      error: 'Stripe not configured - add STRIPE_SECRET_KEY to .env.local'
    }, { status: 400 })
  }

  try {
    const body = await request.json()
    
    // Basic validation
    const validatedData = CardDetailsSchema.parse(body)

    // Get card details
    const card = await stripe.issuing.cards.retrieve(validatedData.cardId)

    console.log('Card retrieved:', {
      cardId: card.id,
      cardholderType: typeof card.cardholder,
      cardholder: card.cardholder
    })

    // Extract cardholder ID - handle both string and object cases
    const cardholderId = typeof card.cardholder === 'string' ? card.cardholder : card.cardholder?.id

    if (!cardholderId) {
      throw new Error('Invalid cardholder reference in card object')
    }

    console.log('Using cardholder ID:', cardholderId)

    // Verify card belongs to user's cardholder
    const cardholder = await stripe.issuing.cardholders.retrieve(cardholderId)
    
    if (cardholder.metadata?.userId !== validatedData.userId) {
      return NextResponse.json({
        success: false,
        error: 'Card not found or access denied'
      }, { status: 403 })
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
        status: card.status,
        type: card.type,
        currency: card.currency,
        cardholderId: cardholderId,
        spendingControls: card.spending_controls,
        createdAt: new Date(card.created * 1000).toISOString()
      }
    })

  } catch (error) {
    console.error('Failed to get card details:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 })
    }
    
    if (error instanceof Stripe.errors.StripeError) {
      // Handle specific case where card was deleted
      if (error.code === 'resource_missing' || error.message.includes('No such issuing card')) {
        return NextResponse.json({
          success: false,
          error: 'No such issuing card'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: `Stripe error: ${error.message}`
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get card details'
    }, { status: 500 })
  }
}