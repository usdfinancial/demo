import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
}) : null

const CreateCardholderSchema = z.object({
  userId: z.string(),
  type: z.enum(['individual', 'company']).default('individual'),
  // Individual fields
  firstName: z.string().min(1).max(24).optional(),
  lastName: z.string().min(1).max(24).optional(),
  dateOfBirth: z.object({
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(1900).max(new Date().getFullYear() - 13)
  }).optional(),
  // Company fields
  companyName: z.string().min(2).max(24).optional(),
  taxId: z.string().optional(),
  // Contact information (required for digital wallets)
  email: z.string().email(),
  phoneNumber: z.string().min(1).optional(),
  // Billing address
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2).default('US')
  })
}).refine((data) => {
  if (data.type === 'individual') {
    return data.firstName && data.lastName && data.dateOfBirth;
  } else if (data.type === 'company') {
    return data.companyName;
  }
  return false;
}, {
  message: "Individual requires firstName, lastName, and dateOfBirth. Company requires companyName.",
  path: ["type"]
})

export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/cards/test-cardholders called:', {
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
      }))
    })

  } catch (error) {
    console.error('Failed to fetch Stripe cardholders:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        success: false,
        error: `Stripe error: ${error.message}`
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cardholders'
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
    const validatedData = CreateCardholderSchema.parse(body)

    // Prepare cardholder data based on type
    const cardholderData: Stripe.Issuing.CardholderCreateParams = {
      type: validatedData.type,
      name: validatedData.type === 'individual'
        ? `${validatedData.firstName} ${validatedData.lastName}`
        : validatedData.companyName!,
      email: validatedData.email,
      phone_number: validatedData.phoneNumber,
      billing: {
        address: {
          line1: validatedData.address.line1,
          line2: validatedData.address.line2,
          city: validatedData.address.city,
          state: validatedData.address.state,
          postal_code: validatedData.address.postalCode,
          country: validatedData.address.country
        }
      },
      metadata: {
        userId: validatedData.userId,
        type: validatedData.type,
        createdBy: 'usd-financial-test'
      }
    }

    // Add type-specific data
    if (validatedData.type === 'individual') {
      cardholderData.individual = {
        first_name: validatedData.firstName!,
        last_name: validatedData.lastName!,
        dob: validatedData.dateOfBirth!
      }
    } else if (validatedData.type === 'company') {
      cardholderData.company = {
        tax_id: validatedData.taxId
      }
    }

    // Create cardholder in Stripe
    const cardholder = await stripe.issuing.cardholders.create(cardholderData)

    return NextResponse.json({
      success: true,
      data: {
        id: cardholder.id,
        name: cardholder.name,
        email: cardholder.email,
        status: cardholder.status,
        type: cardholder.type,
        createdAt: new Date(cardholder.created * 1000).toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create Stripe cardholder:', error)
    
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
      error: 'Failed to create cardholder'
    }, { status: 500 })
  }
}