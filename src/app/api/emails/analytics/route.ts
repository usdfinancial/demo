import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/services/emailService'
import { emailQueue } from '@/lib/services/emailQueue'
import { z } from 'zod'

// Validation schemas
const TrackingEventSchema = z.object({
  emailId: z.string(),
  event: z.enum(['delivered', 'opened', 'clicked', 'bounced', 'unsubscribed']),
  timestamp: z.string().optional(),
  metadata: z.record(z.string()).optional()
})

/**
 * GET /api/emails/analytics
 * Get email analytics and queue statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const emailId = searchParams.get('emailId')
    const stats = searchParams.get('stats') === 'true'

    // Get specific email analytics
    if (emailId) {
      const analytics = await emailService.getEmailAnalytics(emailId)
      const jobStatus = emailQueue.getJobStatus(emailId)

      if (!analytics && !jobStatus) {
        return NextResponse.json({
          success: false,
          message: 'Email not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          analytics,
          jobStatus
        }
      })
    }

    // Get queue statistics
    if (stats) {
      const queueStats = emailQueue.getQueueStats()
      
      return NextResponse.json({
        success: true,
        data: {
          queue: queueStats,
          timestamp: new Date().toISOString()
        }
      })
    }

    // Return general analytics endpoint information
    return NextResponse.json({
      endpoint: '/api/emails/analytics',
      methods: ['GET', 'POST'],
      description: 'Email analytics and tracking API',
      usage: {
        'GET ?emailId=<id>': 'Get analytics for specific email',
        'GET ?stats=true': 'Get queue statistics',
        'POST': 'Track email events (delivered, opened, clicked, etc.)'
      },
      examples: {
        getEmailAnalytics: '/api/emails/analytics?emailId=welcome_john_1234567890',
        getStats: '/api/emails/analytics?stats=true'
      }
    })

  } catch (error) {
    console.error('Email analytics GET error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/emails/analytics
 * Track email events (webhooks from email providers)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const events = Array.isArray(body) ? body : [body]

    const results = []

    for (const eventData of events) {
      try {
        const validatedEvent = TrackingEventSchema.parse(eventData)
        
        // Process the tracking event
        const result = await processTrackingEvent(validatedEvent)
        results.push({
          emailId: validatedEvent.emailId,
          event: validatedEvent.event,
          success: result.success,
          message: result.message
        })

      } catch (validationError) {
        results.push({
          event: eventData,
          success: false,
          message: validationError instanceof z.ZodError 
            ? `Validation error: ${validationError.errors[0].message}`
            : 'Invalid event data'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} event(s)`,
      results
    })

  } catch (error) {
    console.error('Email analytics POST error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process tracking events',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Process individual tracking event
 */
async function processTrackingEvent(event: z.infer<typeof TrackingEventSchema>): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📊 Processing ${event.event} event for email ${event.emailId}`)
    
    // In a real implementation, you would:
    // 1. Update the email analytics in your database
    // 2. Trigger any necessary follow-up actions
    // 3. Update user engagement scores
    // 4. Fire webhooks to other systems

    // For now, we'll log the event
    const timestamp = event.timestamp || new Date().toISOString()
    
    switch (event.event) {
      case 'delivered':
        console.log(`✅ Email ${event.emailId} delivered at ${timestamp}`)
        break
        
      case 'opened':
        console.log(`👁️ Email ${event.emailId} opened at ${timestamp}`)
        // Track user engagement
        break
        
      case 'clicked':
        console.log(`🖱️ Email ${event.emailId} clicked at ${timestamp}`)
        // Track conversion
        if (event.metadata?.url) {
          console.log(`   Clicked URL: ${event.metadata.url}`)
        }
        break
        
      case 'bounced':
        console.log(`⚠️ Email ${event.emailId} bounced at ${timestamp}`)
        // Handle bounce - maybe mark email as invalid
        if (event.metadata?.reason) {
          console.log(`   Bounce reason: ${event.metadata.reason}`)
        }
        break
        
      case 'unsubscribed':
        console.log(`🚫 Email ${event.emailId} recipient unsubscribed at ${timestamp}`)
        // Update user preferences
        break
    }

    return {
      success: true,
      message: `${event.event} event processed successfully`
    }

  } catch (error) {
    console.error(`Failed to process ${event.event} event:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}