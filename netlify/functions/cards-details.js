const Stripe = require('stripe')

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
}) : null

exports.handler = async (event, context) => {
  // Handle POST requests only
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'OPTIONS') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    }
  }

  console.log('🚀 Netlify Function: cards-details called:', {
    method: event.httpMethod,
    hasStripe: !!stripe
  })

  if (!stripe) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Stripe not configured - add STRIPE_SECRET_KEY to environment variables'
      })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { userId, cardId } = body

    if (!userId || !cardId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'User ID and Card ID are required'
        })
      }
    }

    // Get card details from Stripe
    const card = await stripe.issuing.cards.retrieve(cardId)

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

    // Verify card belongs to user by checking cardholder
    const cardholder = await stripe.issuing.cardholders.retrieve(cardholderId)

    if (cardholder.metadata?.userId !== userId) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Card not found or access denied'
        })
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
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
        },
        source: 'netlify-function'
      })
    }

  } catch (error) {
    console.error('Failed to get Stripe card details:', error)

    // Handle specific case where card was deleted
    if (error.code === 'resource_missing' || error.message?.includes('No such issuing card')) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'No such issuing card',
          source: 'netlify-function'
        })
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to get card details',
        source: 'netlify-function'
      })
    }
  }
}