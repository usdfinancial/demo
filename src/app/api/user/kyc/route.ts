import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/middleware/errorHandler'
import { authenticateApiRequest, requireResourceAccess } from '@/lib/middleware/auth'
import { applyRateLimit, apiRateLimiter } from '@/lib/middleware/rateLimiting'
import { validateRequest } from '@/lib/validation/middleware'
import { userService } from '@/lib/services/userService'

const KYCUpdateSchema = z.object({
  inquiryId: z.string().min(1, 'Inquiry ID is required'),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).optional(),
  metadata: z.record(z.any()).optional()
})

const KYCQuerySchema = z.object({
  userId: z.string().uuid().optional()
})

const PersonaWebhookSchema = z.object({
  type: z.string(),
  id: z.string(),
  attributes: z.object({
    name: z.string(),
    status: z.string(),
    'reference-id': z.string().optional(),
    'inquiry-id': z.string(),
    'created-at': z.string(),
    'completed-at': z.string().optional()
  })
})

export const GET = withErrorHandler(async (request: NextRequest, requestId: string) => {
  await applyRateLimit(request, apiRateLimiter)
  
  const authenticatedUser = await authenticateApiRequest(request)
  
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || authenticatedUser.id
  
  if (!userId) {
    throw new Error('User ID is required')
  }
  
  requireResourceAccess(userId)(authenticatedUser)
  
  try {
    const user = await userService.getUserProfile(userId)
    
    if (!user) {
      throw new Error('User not found')
    }
    
    return NextResponse.json({
      success: true,
      data: {
        kycStatus: user.kyc_status || 'unverified',
        userId: user.id,
        lastUpdated: user.updated_at
      },
      timestamp: new Date().toISOString(),
      requestId
    })
  } catch (error) {
    console.error('Error fetching KYC status:', error)
    throw new Error('Failed to fetch KYC status')
  }
})

export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  await applyRateLimit(request, apiRateLimiter)
  
  const body = await request.json()
  
  // Handle Persona webhooks (doesn't require user authentication)
  if (request.headers.get('x-persona-signature')) {
    return handlePersonaWebhook(request, body, requestId)
  }
  
  // Handle user KYC status updates (requires authentication)
  const authenticatedUser = await authenticateApiRequest(request)
  const userId = body.userId || authenticatedUser.id
  
  if (!userId) {
    throw new Error('User ID is required')
  }
  
  requireResourceAccess(userId)(authenticatedUser)
  
  const { body: validatedBody } = await validateRequest(request, {
    body: KYCUpdateSchema
  })
  
  try {
    // Update KYC status based on Persona inquiry
    const kycStatus = validatedBody.status || 'pending'
    
    const updatedUser = await userService.updateUserKycStatus(userId, {
      kycStatus,
      kycInquiryId: validatedBody.inquiryId,
      kycMetadata: validatedBody.metadata || {}
    })
    
    return NextResponse.json({
      success: true,
      data: {
        kycStatus: updatedUser.kyc_status,
        inquiryId: validatedBody.inquiryId,
        userId: updatedUser.id
      },
      timestamp: new Date().toISOString(),
      requestId
    })
  } catch (error) {
    console.error('Error updating KYC status:', error)
    throw new Error('Failed to update KYC status')
  }
})

async function handlePersonaWebhook(request: NextRequest, body: any, requestId: string) {
  const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    throw new Error('Persona webhook secret not configured')
  }
  
  // Verify webhook signature
  const signature = request.headers.get('x-persona-signature')
  if (!signature) {
    throw new Error('Missing webhook signature')
  }
  
  // TODO: Implement signature verification
  // This should verify the webhook signature against the secret
  
  try {
    const { body: validatedBody } = await validateRequest(request, {
      body: PersonaWebhookSchema
    })
    
    const inquiryId = validatedBody.attributes['inquiry-id']
    const referenceId = validatedBody.attributes['reference-id']
    const status = validatedBody.attributes.status
    
    if (!inquiryId) {
      throw new Error('Missing inquiry ID in webhook')
    }
    
    // Map Persona status to our KYC status
    let kycStatus: 'pending' | 'approved' | 'rejected' | 'expired'
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        kycStatus = 'approved'
        break
      case 'declined':
      case 'rejected':
        kycStatus = 'rejected'
        break
      case 'expired':
        kycStatus = 'expired'
        break
      default:
        kycStatus = 'pending'
    }
    
    // Find user by reference ID (if provided) or inquiry ID
    let userId = referenceId
    if (!userId) {
      // If no reference ID, try to find user by inquiry ID in metadata
      // This is a fallback - ideally reference ID should always be provided
      const user = await userService.findUserByKycInquiryId(inquiryId)
      userId = user?.id
    }
    
    if (userId) {
      await userService.updateUserKycStatus(userId, {
        kycStatus,
        kycInquiryId: inquiryId,
        kycMetadata: {
          personaWebhookType: validatedBody.type,
          completedAt: validatedBody.attributes['completed-at'],
          lastWebhookAt: new Date().toISOString()
        }
      })
      
      console.log(`Updated KYC status for user ${userId}: ${kycStatus}`)
    }
    
    return NextResponse.json({
      success: true,
      received: true,
      inquiryId,
      status: kycStatus
    })
  } catch (error) {
    console.error('Error processing Persona webhook:', error)
    throw new Error('Failed to process webhook')
  }
}