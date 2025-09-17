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

  console.log('🚀 Netlify Function: cards-cardholders called:', {
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

  // Handle POST request for cardholder creation
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}')

      // Basic validation
      if (!body.userId || !body.email || !body.address) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Missing required fields: userId, email, address'
          })
        }
      }

      // Validate type-specific fields
      if (body.type === 'individual') {
        if (!body.firstName || !body.lastName || !body.dateOfBirth) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: false,
              error: 'Individual requires firstName, lastName, and dateOfBirth'
            })
          }
        }
      } else if (body.type === 'company') {
        if (!body.companyName) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: false,
              error: 'Company requires companyName'
            })
          }
        }
      }

      // Prepare billing address, only including non-empty optional fields
      const billingAddress = {
        line1: body.address.line1,
        city: body.address.city,
        state: body.address.state,
        postal_code: body.address.postalCode,
        country: body.address.country || 'US'
      }

      // Only add line2 if it's provided and not empty
      if (body.address.line2 && body.address.line2.trim() !== '') {
        billingAddress.line2 = body.address.line2
      }

      // Prepare cardholder data
      const cardholderData = {
        type: body.type || 'individual',
        name: body.type === 'individual'
          ? `${body.firstName} ${body.lastName}`
          : body.companyName,
        email: body.email,
        billing: {
          address: billingAddress
        },
        metadata: {
          userId: body.userId,
          type: body.type || 'individual',
          createdBy: 'netlify-function'
        }
      }

      // Only add phone number if it's provided and not empty
      if (body.phoneNumber && body.phoneNumber.trim() !== '') {
        cardholderData.phone_number = body.phoneNumber
      }

      // Add type-specific data
      if (body.type === 'individual') {
        cardholderData.individual = {
          first_name: body.firstName,
          last_name: body.lastName,
          dob: body.dateOfBirth,
          // Add verification requirements
          verification: {
            document: {
              back: null,
              front: null
            }
          }
        }
      } else if (body.type === 'company') {
        const companyData = {}
        // Only add tax_id if it's provided and not empty
        if (body.taxId && body.taxId.trim() !== '') {
          companyData.tax_id = body.taxId
        }
        cardholderData.company = companyData
      }

      // Create cardholder in Stripe
      const cardholder = await stripe.issuing.cardholders.create(cardholderData)

      console.log('Created cardholder:', {
        id: cardholder.id,
        status: cardholder.status,
        requirements: cardholder.requirements
      })

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: {
            id: cardholder.id,
            name: cardholder.name,
            email: cardholder.email,
            status: cardholder.status,
            type: cardholder.type,
            requirements: cardholder.requirements,
            createdAt: new Date(cardholder.created * 1000).toISOString()
          },
          source: 'netlify-function'
        })
      }

    } catch (error) {
      console.error('Failed to create Stripe cardholder:', error)
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message || 'Failed to create cardholder',
          source: 'netlify-function'
        })
      }
    }
  }

  // Handle GET request for fetching cardholders
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

    // Get cardholders for this user
    const cardholders = await stripe.issuing.cardholders.list({
      limit: 100
    })

    const userCardholders = cardholders.data.filter(
      cardholder => cardholder.metadata?.userId === userId
    )

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: userCardholders.map(cardholder => ({
          id: cardholder.id,
          name: cardholder.name,
          email: cardholder.email,
          status: cardholder.status,
          type: cardholder.type,
          createdAt: new Date(cardholder.created * 1000).toISOString()
        })),
        source: 'netlify-function-fallback'
      })
    }

  } catch (error) {
    console.error('Failed to fetch Stripe cardholders:', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch cardholders',
        source: 'netlify-function-fallback'
      })
    }
  }
}