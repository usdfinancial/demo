import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
}) : null

const UpdateCardStatusSchema = z.object({
  userId: z.string(),
  cardId: z.string().min(1),
  status: z.enum(['active', 'inactive', 'canceled']),
  reason: z.string().optional()
})

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({
      success: false,
      error: 'Stripe not configured - add STRIPE_SECRET_KEY to .env.local'
    }, { status: 400 })
  }

  try {
    const body = await request.json()

    // Basic validation
    const validatedData = UpdateCardStatusSchema.parse(body)

    // Retrieve card and verify ownership
    const card = await stripe.issuing.cards.retrieve(validatedData.cardId)

    // Get cardholder to verify user ownership
    const cardholder = await stripe.issuing.cardholders.retrieve(card.cardholder as string)

    if (cardholder.metadata?.userId !== validatedData.userId) {
      return NextResponse.json({
        success: false,
        error: 'Card not found or access denied'
      }, { status: 403 })
    }

    // Update card status following Stripe best practices
    const updatedCard = await stripe.issuing.cards.update(validatedData.cardId, {
      status: validatedData.status,
      metadata: {
        ...card.metadata,
        lastStatusChange: new Date().toISOString(),
        statusChangeReason: validatedData.reason || `Status changed to ${validatedData.status}`
      }
    })

    console.log(`📋 Card status updated:`, {
      cardId: updatedCard.id,
      last4: updatedCard.last4,
      oldStatus: card.status,
      newStatus: updatedCard.status,
      reason: validatedData.reason
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCard.id,
        cardName: updatedCard.metadata?.cardName || 'Unnamed Card',
        last4: updatedCard.last4,
        brand: updatedCard.brand,
        status: updatedCard.status,
        previousStatus: card.status,
        updatedAt: new Date().toISOString(),
        reason: validatedData.reason
      }
    })

  } catch (error) {
    console.error('Failed to update card status:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 })
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        success: false,
        error: `Stripe error: ${error.message}`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update card status'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({
      success: true,
      data: [],
      message: 'No Stripe key configured - add STRIPE_SECRET_KEY to .env.local'
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const cardId = searchParams.get('cardId')

    if (!userId || !cardId) {
      return NextResponse.json({
        success: false,
        error: 'User ID and Card ID are required'
      }, { status: 400 })
    }

    // Retrieve card and verify ownership
    const card = await stripe.issuing.cards.retrieve(cardId)

    // Get cardholder to verify user ownership
    const cardholder = await stripe.issuing.cardholders.retrieve(card.cardholder as string)

    if (cardholder.metadata?.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Card not found or access denied'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: card.id,
        cardName: card.metadata?.cardName || 'Unnamed Card',
        last4: card.last4,
        brand: card.brand,
        status: card.status,
        type: card.type,
        currency: card.currency,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        spendingControls: card.spending_controls,
        createdAt: new Date(card.created * 1000).toISOString(),
        metadata: card.metadata
      }
    })

  } catch (error) {
    console.error('Failed to fetch card status:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        success: false,
        error: `Stripe error: ${error.message}`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch card status'
    }, { status: 500 })
  }
}