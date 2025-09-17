import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
}) : null

const IssueCardSchema = z.object({
  userId: z.string(),
  cardholderId: z.string().min(1),
  cardName: z.string().min(1).max(100),
  currency: z.enum(['usd']).default('usd'),
  type: z.enum(['virtual']).default('virtual'),
  activateOnCreation: z.boolean().default(true),
  spendingControls: z.object({
    spendingLimits: z.array(z.object({
      amount: z.number().int().positive(),
      interval: z.enum(['per_authorization', 'daily', 'weekly', 'monthly', 'yearly'])
    })).optional(),
    blockedCategories: z.array(z.enum([
      'gas_stations', 'grocery_stores', 'restaurants', 'fast_food_restaurants',
      'bars_and_nightclubs', 'gambling', 'adult_entertainment', 'digital_goods',
      'online_gaming', 'government_services', 'professional_services'
    ])).optional(),
    allowedCategories: z.array(z.enum([
      'gas_stations', 'grocery_stores', 'restaurants', 'fast_food_restaurants',
      'retail', 'hotels_and_motels', 'transportation', 'utilities', 'healthcare',
      'education', 'charity', 'professional_services'
    ])).optional(),
    allowedMerchants: z.array(z.string()).optional(),
    blockedMerchants: z.array(z.string()).optional()
  }).optional()
})

export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/cards/test-issue called:', {
    url: request.url,
    hasStripe: !!stripe,
    timestamp: new Date().toISOString()
  })

  if (!stripe) {
    console.log('⚠️ No Stripe configuration found')
    return NextResponse.json({
      success: true,
      data: [],
      message: 'No Stripe key configured - add STRIPE_SECRET_KEY to .env.local'
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Get all cards for user's cardholders
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
        createdAt: new Date(card.created * 1000).toISOString()
      }))
    })

  } catch (error) {
    console.error('Failed to fetch Stripe cards:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        success: false,
        error: `Stripe error: ${error.message}`
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cards'
    }, { status: 500 })
  }
}

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
    const validatedData = IssueCardSchema.parse(body)

    // Verify cardholder exists and belongs to user
    const cardholder = await stripe.issuing.cardholders.retrieve(validatedData.cardholderId)
    
    if (cardholder.metadata?.userId !== validatedData.userId) {
      return NextResponse.json({
        success: false,
        error: 'Cardholder not found or access denied'
      }, { status: 403 })
    }

    // Create spending controls if provided
    let spendingControls: Stripe.Issuing.CardCreateParams.SpendingControls | undefined

    if (validatedData.spendingControls) {
      spendingControls = {
        spending_limits: validatedData.spendingControls.spendingLimits?.map(limit => ({
          amount: limit.amount * 100, // Convert to cents
          interval: limit.interval
        })),
        blocked_categories: validatedData.spendingControls.blockedCategories,
        allowed_categories: validatedData.spendingControls.allowedCategories,
        allowed_merchant_countries: undefined, // Can be added if needed
        blocked_merchant_countries: undefined   // Can be added if needed
      }
    }

    // Determine card status based on activation preference
    const cardStatus = validatedData.activateOnCreation ? 'active' : 'inactive'

    // Issue the card following Stripe best practices
    const card = await stripe.issuing.cards.create({
      cardholder: validatedData.cardholderId,
      currency: validatedData.currency,
      type: validatedData.type,
      status: cardStatus,
      spending_controls: spendingControls,
      metadata: {
        userId: validatedData.userId,
        cardName: validatedData.cardName,
        createdBy: 'usd-financial-test',
        activateOnCreation: validatedData.activateOnCreation.toString()
      }
    })

    console.log(`✅ Virtual card ${cardStatus === 'active' ? 'issued and activated' : 'issued (inactive)'}:`, {
      cardId: card.id,
      last4: card.last4,
      status: card.status,
      cardholder: card.cardholder
    })

    // Get card details including sensitive info
    const cardDetails = await stripe.issuing.cards.retrieve(card.id)

    return NextResponse.json({
      success: true,
      data: {
        id: card.id,
        cardName: validatedData.cardName,
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
        cvc: cardDetails.cvc
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to issue Stripe card:', error)
    
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
      error: 'Failed to issue card'
    }, { status: 500 })
  }
}