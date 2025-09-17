import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userService } from '@/lib/services/userService'
import { userAuthService } from '@/lib/services/userAuthService'
import { withErrorHandler } from '@/lib/middleware/errorHandler'
import { authenticateApiRequest, requireResourceAccess } from '@/lib/middleware/auth'
import { applyRateLimit, apiRateLimiter } from '@/lib/middleware/rateLimiting'
import { securityMiddleware } from '@/lib/middleware/security'
import { validateRequest } from '@/lib/validation/middleware'
import { UserQuerySchema } from '@/lib/validation/schemas'

export const GET = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  // Validate query parameters
  const { query } = await validateRequest(request, {
    query: UserQuerySchema
  })

  // Check if user can access this resource (IDOR protection)
  requireResourceAccess(query.userId)(authenticatedUser)

  switch (query.action) {
    case 'profile':
      const profile = await userService.getUserProfile(query.userId)
      return NextResponse.json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'dashboard':
      const dashboardData = await userService.getDashboardData(query.userId)
      return NextResponse.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'wallets':
      const wallets = await userService.getUserWallets(query.userId)
      return NextResponse.json({
        success: true,
        data: wallets,
        timestamp: new Date().toISOString(),
        requestId
      })

    default:
      // Default: return dashboard data
      const defaultData = await userService.getDashboardData(query.userId)
      return NextResponse.json({
        success: true,
        data: defaultData,
        timestamp: new Date().toISOString(),
        requestId
      })
  }
})

export const PATCH = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  // Validate request body based on action
  const body = await request.json()
  const { userId, action, ...updates } = body

  if (!userId) {
    throw new Error('User ID is required')
  }

  // Check if user can access this resource (IDOR protection)
  requireResourceAccess(userId)(authenticatedUser)

  switch (action) {
    case 'update-profile':
      // Validate profile updates
      const { body: profileData } = await validateRequest(request, {
        body: z.object({
          userId: z.string().uuid(),
          action: z.literal('update-profile'),
          firstName: z.string().min(1).max(50).optional(),
          lastName: z.string().min(1).max(50).optional(),
          phone: z.string().optional(),
          dateOfBirth: z.string().date().optional()
        })
      })
      
      const updatedProfile = await userService.updateUserProfile(userId, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth
      })
      
      return NextResponse.json({
        success: true,
        data: updatedProfile,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'update-preferences':
      const { body: prefsData } = await validateRequest(request, {
        body: z.object({
          userId: z.string().uuid(),
          action: z.literal('update-preferences'),
          emailNotifications: z.boolean().optional(),
          smsNotifications: z.boolean().optional(),
          marketingEmails: z.boolean().optional(),
          currency: z.string().length(3).optional(),
          language: z.string().length(2).optional()
        })
      })
      
      const updatedPrefs = await userService.updatePreferences(userId, prefsData)
      return NextResponse.json({
        success: true,
        data: updatedPrefs,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'mark-notification-read':
      const { body: notificationData } = await validateRequest(request, {
        body: z.object({
          userId: z.string().uuid(),
          action: z.literal('mark-notification-read'),
          notificationId: z.string().uuid()
        })
      })
      
      await userService.markNotificationRead(userId, notificationData.notificationId)
      return NextResponse.json({
        success: true,
        data: { marked: true },
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'update-last-auth':
      const { body: authData } = await validateRequest(request, {
        body: z.object({
          userId: z.string().uuid(),
          action: z.literal('update-last-auth')
        })
      })
      
      await userAuthService.updateLastAuth(authData.userId)
      return NextResponse.json({
        success: true,
        data: { updated: true },
        timestamp: new Date().toISOString(),
        requestId
      })

    default:
      throw new Error('Invalid action specified')
  }
})

export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Get action from request body first
  const body = await request.json()
  const { action } = body

  // Handle user creation (doesn't require authentication)
  if (action === 'create-user') {
    const { body: createUserData } = await validateRequest(request, {
      body: z.object({
        action: z.literal('create-user'),
        userData: z.object({
          email: z.string().email().optional(),
          smartWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
          eoaAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
          authMethod: z.enum(['email', 'google', 'passkey', 'wallet']),
          profile: z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional()
          }).optional()
        })
      })
    })

    const newUser = await userAuthService.createUser(createUserData.userData)
    
    return NextResponse.json({
      success: true,
      data: newUser,
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 201 })
  }

  // All other actions require authentication
  const authenticatedUser = await authenticateApiRequest(request)
  const { userId } = body

  if (!userId) {
    throw new Error('User ID is required')
  }

  // Check if user can access this resource (IDOR protection)
  requireResourceAccess(userId)(authenticatedUser)

  switch (action) {
    case 'add-wallet':
      const { body: walletData } = await validateRequest(request, {
        body: z.object({
          userId: z.string().uuid(),
          action: z.literal('add-wallet'),
          chainId: z.number().int().positive(),
          address: z.string().regex(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^0x[a-fA-F0-9]{40}$|^[a-zA-Z0-9]{32,44}$/),
          walletType: z.enum(['custodial', 'external', 'smart_wallet']),
          label: z.string().min(1).max(50),
          isPrimary: z.boolean().default(false)
        })
      })
      
      const wallet = await userService.addWallet({
        userId: walletData.userId,
        chainId: walletData.chainId,
        address: walletData.address,
        walletType: walletData.walletType,
        label: walletData.label,
        isPrimary: walletData.isPrimary
      })
      
      return NextResponse.json({
        success: true,
        data: wallet,
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 201 })

    case 'create-notification':
      const { body: notifData } = await validateRequest(request, {
        body: z.object({
          userId: z.string().uuid(),
          action: z.literal('create-notification'),
          title: z.string().min(1).max(100),
          message: z.string().min(1).max(500),
          type: z.enum(['info', 'warning', 'error', 'success']),
          priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
          actionUrl: z.string().url().optional(),
          metadata: z.record(z.any()).optional(),
          expiresAt: z.string().datetime().optional()
        })
      })
      
      await userService.createNotification({
        userId: notifData.userId,
        title: notifData.title,
        message: notifData.message,
        type: notifData.type,
        priority: notifData.priority,
        actionUrl: notifData.actionUrl,
        metadata: notifData.metadata,
        expiresAt: notifData.expiresAt
      })
      
      return NextResponse.json({
        success: true,
        data: { created: true },
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 201 })

    default:
      throw new Error('Invalid action specified')
  }
})