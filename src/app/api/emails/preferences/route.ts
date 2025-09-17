import { NextRequest, NextResponse } from 'next/server'
import { emailPreferencesService } from '@/lib/services/emailPreferences'
import { z } from 'zod'

// Validation schemas
const CanSendSchema = z.object({
  action: z.literal('canSend'),
  userIdentifier: z.string(),
  emailType: z.enum(['welcome', 'marketing', 'transactional', 'product', 'security'])
})

const InitializeSchema = z.object({
  action: z.literal('initialize'),
  userIdentifier: z.string(),
  email: z.string().email()
})

const UpdateSchema = z.object({
  action: z.literal('update'),
  userIdentifier: z.string(),
  preferences: z.object({
    welcomeEmails: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    transactionalEmails: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
    frequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional()
  })
})

const GetSchema = z.object({
  action: z.literal('get'),
  userIdentifier: z.string()
})

/**
 * POST /api/emails/preferences
 * Manage user email preferences
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Determine action type and validate accordingly
    switch (body.action) {
      case 'canSend': {
        const { userIdentifier, emailType } = CanSendSchema.parse(body)
        const canSend = await emailPreferencesService.canSendEmail(userIdentifier, emailType)
        
        return NextResponse.json({
          success: true,
          canSend,
          emailType,
          userIdentifier
        })
      }

      case 'initialize': {
        const { userIdentifier, email } = InitializeSchema.parse(body)
        const preferences = await emailPreferencesService.initializeUserPreferences(userIdentifier, email)
        
        return NextResponse.json({
          success: true,
          message: 'Email preferences initialized',
          preferences
        })
      }

      case 'update': {
        const { userIdentifier, preferences: updates } = UpdateSchema.parse(body)
        const updated = await emailPreferencesService.updateUserPreferences(userIdentifier, updates)
        
        if (!updated) {
          return NextResponse.json({
            success: false,
            message: 'User preferences not found'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          message: 'Email preferences updated',
          preferences: updated
        })
      }

      case 'get': {
        const { userIdentifier } = GetSchema.parse(body)
        const preferences = await emailPreferencesService.getUserPreferences(userIdentifier)
        
        if (!preferences) {
          return NextResponse.json({
            success: false,
            message: 'User preferences not found'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          preferences
        })
      }

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Supported actions: canSend, initialize, update, get'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Email preferences API error:', error)
    
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

    return NextResponse.json({
      success: false,
      message: 'Server error processing preferences request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/emails/preferences?user=<userIdentifier>
 * Get user email preferences
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userIdentifier = searchParams.get('user')

    if (!userIdentifier) {
      return NextResponse.json({
        success: false,
        message: 'Missing user identifier'
      }, { status: 400 })
    }

    const preferences = await emailPreferencesService.getUserPreferences(userIdentifier)
    
    if (!preferences) {
      return NextResponse.json({
        success: false,
        message: 'User preferences not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error) {
    console.error('Email preferences GET error:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error retrieving preferences',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}