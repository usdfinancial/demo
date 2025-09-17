const Stripe = require('stripe')

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
}) : null

exports.handler = async (event, context) => {
  // Handle POST and GET requests
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST' && event.httpMethod !== 'OPTIONS') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    }
  }

  console.log('🚀 Netlify Function: cards-issue called:', {
    method: event.httpMethod,
    query: event.queryStringParameters,
    hasStripe: !!stripe
  })

  if (!stripe) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: [],
        message: 'No Stripe key configured - add STRIPE_SECRET_KEY to environment variables',
        source: 'netlify-function-fallback'
      })
    }
  }

  // Handle POST request for card issuance
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}')

      // Basic validation
      if (!body.userId || !body.cardholderId || !body.cardName) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Missing required fields: userId, cardholderId, cardName'
          })
        }
      }

      // Verify cardholder exists and belongs to user
      const cardholder = await stripe.issuing.cardholders.retrieve(body.cardholderId)

      if (cardholder.metadata?.userId !== body.userId) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Cardholder not found or access denied'
          })
        }
      }

      // Create spending controls if provided
      let spendingControls
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

      // Always create card as inactive first to avoid requirements issues
      // Cards can be activated later once requirements are met
      const card = await stripe.issuing.cards.create({
        cardholder: body.cardholderId,
        currency: body.currency || 'usd',
        type: body.type || 'virtual',
        status: 'inactive',
        spending_controls: spendingControls,
        metadata: {
          userId: body.userId,
          cardName: body.cardName,
          createdBy: 'netlify-function',
          activateOnCreation: body.activateOnCreation?.toString() || 'true'
        }
      })

      // Try to activate if requested and cardholder is ready
      let finalCard = card
      if (body.activateOnCreation) {
        try {
          finalCard = await stripe.issuing.cards.update(card.id, {
            status: 'active'
          })
        } catch (activationError) {
          console.log('Card created but activation failed:', activationError.message)
          // Card will remain inactive but still be created successfully
        }
      }

      // Get card details including sensitive info
      const cardDetails = await stripe.issuing.cards.retrieve(finalCard.id)

      // Get cardholder to check requirements
      const cardholderDetails = await stripe.issuing.cardholders.retrieve(body.cardholderId)

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: {
            id: finalCard.id,
            cardName: body.cardName,
            last4: finalCard.last4,
            brand: finalCard.brand,
            expiryMonth: finalCard.exp_month,
            expiryYear: finalCard.exp_year,
            status: finalCard.status,
            type: finalCard.type,
            currency: finalCard.currency,
            cardholderId: finalCard.cardholder,
            spendingControls: finalCard.spending_controls,
            createdAt: new Date(finalCard.created * 1000).toISOString(),
            // Only include sensitive data if available (may be null for inactive cards)
            number: cardDetails.number || null,
            cvc: cardDetails.cvc || null,
            // Include cardholder requirements info
            cardholderStatus: cardholderDetails.status,
            cardholderRequirements: cardholderDetails.requirements
          },
          source: 'netlify-function'
        })
      }

    } catch (error) {
      console.error('Failed to issue Stripe card:', error)
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message || 'Failed to issue card',
          source: 'netlify-function'
        })
      }
    }
  }

  // Handle GET request for fetching cards
  try {
    const userId = event.queryStringParameters?.userId

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'User ID is required'
        })
      }
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
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
        })),
        source: 'netlify-function-fallback'
      })
    }

  } catch (error) {
    console.error('Failed to fetch Stripe cards:', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch cards',
        source: 'netlify-function-fallback'
      })
    }
  }
}