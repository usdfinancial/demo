import { NextRequest, NextResponse } from 'next/server'
import { emailService, WelcomeEmailData, EmailRecipient } from '@/lib/services/emailService'
import { z } from 'zod'

// Validation schema for welcome email request
const WelcomeEmailRequestSchema = z.object({
  recipient: z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    name: z.string().optional()
  }),
  data: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    signupSource: z.string().optional(),
    country: z.string().optional(),
    signupTimestamp: z.string(),
    referralCode: z.string().optional(),
    estimatedSavings: z.string().optional(),
    welcomeBonus: z.string().optional()
  }),
  // Optional override URLs
  urls: z.object({
    dashboardUrl: z.string().url().optional(),
    helpCenterUrl: z.string().url().optional(),
    unsubscribeUrl: z.string().url().optional(),
    privacyUrl: z.string().url().optional()
  }).optional()
})

type WelcomeEmailRequest = z.infer<typeof WelcomeEmailRequestSchema>

// Default URLs for the application
const DEFAULT_URLS = {
  dashboardUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ref=welcome` : 'https://app.usdfinancial.com/dashboard?ref=welcome',
  helpCenterUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/help` : 'https://help.usdfinancial.com',
  unsubscribeUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe` : 'https://usdfinancial.com/unsubscribe',
  privacyUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/privacy` : 'https://usdfinancial.com/privacy'
}

/**
 * POST /api/emails/welcome
 * Send welcome email to a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = WelcomeEmailRequestSchema.parse(body)

    // Prepare recipient data
    const recipient: EmailRecipient = {
      email: validatedData.recipient.email,
      firstName: validatedData.recipient.firstName,
      lastName: validatedData.recipient.lastName,
      name: validatedData.recipient.name || `${validatedData.recipient.firstName} ${validatedData.recipient.lastName || ''}`.trim()
    }

    // Prepare email data with defaults
    const emailData: WelcomeEmailData = {
      firstName: validatedData.data.firstName,
      lastName: validatedData.data.lastName,
      signupSource: validatedData.data.signupSource || 'website',
      country: validatedData.data.country || 'United States',
      signupTimestamp: validatedData.data.signupTimestamp,
      referralCode: validatedData.data.referralCode,
      estimatedSavings: validatedData.data.estimatedSavings || '$840',
      welcomeBonus: validatedData.data.welcomeBonus || '$25',
      // Use provided URLs or defaults
      dashboardUrl: validatedData.urls?.dashboardUrl || DEFAULT_URLS.dashboardUrl,
      helpCenterUrl: validatedData.urls?.helpCenterUrl || DEFAULT_URLS.helpCenterUrl,
      unsubscribeUrl: validatedData.urls?.unsubscribeUrl || DEFAULT_URLS.unsubscribeUrl,
      privacyUrl: validatedData.urls?.privacyUrl || DEFAULT_URLS.privacyUrl
    }

    // Send the welcome email
    const result = await emailService.sendWelcomeEmail(recipient, emailData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: result.messageId,
        timestamp: result.timestamp
      }, { status: 200 })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send welcome email',
        error: result.error,
        timestamp: result.timestamp
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Welcome email API error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }

    // Handle other errors
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/emails/welcome
 * Get welcome email template preview (for development/testing)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const preview = searchParams.get('preview')
    const firstName = searchParams.get('firstName') || 'John'

    if (preview === 'true') {
      // Return a preview of the welcome email template
      const mockData: WelcomeEmailData = {
        firstName,
        lastName: 'Doe',
        signupSource: 'website',
        country: 'United States',
        signupTimestamp: new Date().toISOString(),
        referralCode: 'PREVIEW2025',
        estimatedSavings: '$1,200',
        welcomeBonus: '$25',
        dashboardUrl: DEFAULT_URLS.dashboardUrl,
        helpCenterUrl: DEFAULT_URLS.helpCenterUrl,
        unsubscribeUrl: DEFAULT_URLS.unsubscribeUrl,
        privacyUrl: DEFAULT_URLS.privacyUrl
      }

      // Access the private method through a helper method
      const emailContent = (emailService as any).generateWelcomeEmailContent(mockData)

      return new NextResponse(emailContent, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Return API documentation
    return NextResponse.json({
      endpoint: '/api/emails/welcome',
      methods: ['POST', 'GET'],
      description: 'Send welcome emails to new USD Financial users',
      documentation: {
        POST: {
          description: 'Send welcome email to a new user',
          requiredFields: [
            'recipient.email',
            'recipient.firstName', 
            'data.firstName',
            'data.signupTimestamp'
          ],
          optionalFields: [
            'recipient.lastName',
            'data.signupSource',
            'data.country',
            'data.referralCode',
            'data.estimatedSavings',
            'data.welcomeBonus',
            'urls.dashboardUrl',
            'urls.helpCenterUrl',
            'urls.unsubscribeUrl',
            'urls.privacyUrl'
          ]
        },
        GET: {
          description: 'Preview welcome email template',
          parameters: {
            preview: 'Set to "true" to view email template',
            firstName: 'Optional name for preview (default: John)'
          },
          example: '/api/emails/welcome?preview=true&firstName=Sarah'
        }
      }
    })

  } catch (error) {
    console.error('Welcome email GET error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}