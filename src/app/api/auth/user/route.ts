import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { unifiedUserService } from '@/lib/services/unifiedUserService'
import { loginHistoryService } from '@/lib/services/loginHistoryService'
import { auditService } from '@/lib/services/auditService'
import { sessionService } from '@/lib/services/sessionService'
import { RequestUtils } from '@/lib/utils/requestUtils'
import { withErrorHandler } from '@/lib/middleware/errorHandler'
import { applyRateLimit, apiRateLimiter } from '@/lib/middleware/rateLimiting'
import { validateRequest } from '@/lib/validation/middleware'

// Unauthenticated endpoint for user lookup and creation during auth flow
export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // DEBUGGING: Log all auth API calls
  console.log('🚨 AUTH API CALLED:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    requestId
  })

  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Extract request information for security logging
  const requestInfo = RequestUtils.getRequestInfo(request)
  const clientInfo = request.headers.get('X-Client-Info')
  let parsedClientInfo: any = {}
  
  if (clientInfo) {
    try {
      parsedClientInfo = JSON.parse(clientInfo)
    } catch (e) {
      // Ignore invalid client info
    }
  }

  const body = await request.json()
  const { action } = body

  switch (action) {
    case 'find-user':
      const { body: findData } = await validateRequest(request, {
        body: z.object({
          action: z.literal('find-user'),
          email: z.string().email().optional(),
          smartWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional()
        })
      })

      if (!findData.email && !findData.smartWalletAddress) {
        throw new Error('Either email or smartWalletAddress is required')
      }

      let user = null
      if (findData.email) {
        user = await unifiedUserService.findUserByEmail(findData.email)
      } else if (findData.smartWalletAddress) {
        user = await unifiedUserService.findUserByWalletAddress(findData.smartWalletAddress)
      }

      return NextResponse.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'create-user':
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
          }),
          loginMethod: z.string().optional()
        })
      })

      try {
        const newUser = await unifiedUserService.createUser(createUserData.userData)
        
        // Log successful user creation
        await auditService.logAuth('signup.success', {
          userId: newUser.id,
          email: createUserData.userData.email,
          method: createUserData.loginMethod || createUserData.userData.authMethod,
          success: true,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
          details: {
            walletAddress: createUserData.userData.smartWalletAddress,
            eoaAddress: createUserData.userData.eoaAddress,
            deviceFingerprint: requestInfo.deviceFingerprint || parsedClientInfo.deviceFingerprint
          }
        })

        // Record successful login attempt
        console.log('🚨 RECORDING LOGIN HISTORY - CREATE USER:', {
          userId: newUser.id,
          email: createUserData.userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          loginMethod: createUserData.loginMethod || createUserData.userData.authMethod
        })
        await loginHistoryService.recordLoginAttempt({
          userId: newUser.id,
          email: createUserData.userData.email,
          loginMethod: createUserData.loginMethod || createUserData.userData.authMethod,
          loginStatus: 'success',
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
          deviceFingerprint: requestInfo.deviceFingerprint || parsedClientInfo.deviceFingerprint,
          geolocation: requestInfo.geolocation,
          riskScore: RequestUtils.calculateRiskScore(request)
        })
        console.log('✅ LOGIN HISTORY RECORDED SUCCESSFULLY')

        // Create authentication session
        const sessionInfo = await sessionService.createSession({
          userId: newUser.id,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
          expiresInHours: 24
        })

        console.log('✅ New user signup completed with full audit trail:', {
          userId: newUser.id,
          email: createUserData.userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          method: createUserData.loginMethod,
          sessionToken: sessionInfo.sessionToken.substring(0, 10) + '...'
        })
        
        return NextResponse.json({
          success: true,
          data: {
            ...newUser,
            sessionToken: sessionInfo.sessionToken,
            sessionExpiresAt: sessionInfo.expiresAt
          },
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 201 })
        
      } catch (error) {
        // Log failed user creation
        await auditService.logAuth('signup.failed', {
          email: createUserData.userData.email,
          method: createUserData.loginMethod || createUserData.userData.authMethod,
          success: false,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            walletAddress: createUserData.userData.smartWalletAddress
          }
        })

        // Record failed signup attempt
        await loginHistoryService.recordLoginAttempt({
          email: createUserData.userData.email,
          loginMethod: createUserData.loginMethod || createUserData.userData.authMethod,
          loginStatus: 'failed',
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
          deviceFingerprint: requestInfo.deviceFingerprint || parsedClientInfo.deviceFingerprint,
          geolocation: requestInfo.geolocation,
          riskScore: RequestUtils.calculateRiskScore(request),
          failureReason: error instanceof Error ? error.message : 'Unknown signup error'
        })

        throw error
      }

    case 'update-last-auth':
      const { body: authData } = await validateRequest(request, {
        body: z.object({
          action: z.literal('update-last-auth'),
          userId: z.string().uuid().optional(),
          email: z.string().email().optional(),
          smartWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
          loginMethod: z.string().optional(),
          loginStatus: z.string().optional()
        })
      })

      let userId = authData.userId
      let foundUser = null
      
      if (!userId) {
        // Find user by email or wallet address first
        if (authData.email) {
          foundUser = await unifiedUserService.findUserByEmail(authData.email)
        } else if (authData.smartWalletAddress) {
          foundUser = await unifiedUserService.findUserByWalletAddress(authData.smartWalletAddress)
        }
        
        if (!foundUser) {
          // Log failed login attempt
          await loginHistoryService.recordLoginAttempt({
            email: authData.email,
            loginMethod: authData.loginMethod || 'email',
            loginStatus: 'failed',
            ipAddress: requestInfo.ipAddress,
            userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
            deviceFingerprint: requestInfo.deviceFingerprint || parsedClientInfo.deviceFingerprint,
            geolocation: requestInfo.geolocation,
            riskScore: RequestUtils.calculateRiskScore(request),
            failureReason: 'User not found'
          })
          
          throw new Error('User not found')
        }
        userId = foundUser.id
      } else {
        foundUser = await unifiedUserService.getUserById(userId)
      }
      
      // Update last auth time
      await unifiedUserService.updateLastAuth(userId)
      
      // Log successful authentication
      await auditService.logAuth('login.success', {
        userId,
        email: foundUser?.email,
        method: authData.loginMethod || 'email',
        success: true,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent || parsedClientInfo.userAgent
      })

      // Record successful login attempt
      console.log('🚨 RECORDING LOGIN HISTORY - UPDATE AUTH:', {
        userId,
        email: foundUser?.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        loginMethod: authData.loginMethod || 'email'
      })
      await loginHistoryService.recordLoginAttempt({
        userId,
        email: foundUser?.email,
        loginMethod: authData.loginMethod || 'email',
        loginStatus: 'success',
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
        deviceFingerprint: requestInfo.deviceFingerprint || parsedClientInfo.deviceFingerprint,
        geolocation: requestInfo.geolocation,
        riskScore: RequestUtils.calculateRiskScore(request)
      })
      console.log('✅ LOGIN HISTORY RECORDED SUCCESSFULLY')

      // Create/update authentication session
      const sessionInfo = await sessionService.createSession({
        userId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
        expiresInHours: 24
      })

      console.log('✅ User authentication updated with audit trail:', {
        userId,
        email: foundUser?.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        method: authData.loginMethod
      })
      
      return NextResponse.json({
        success: true,
        data: { 
          updated: true,
          sessionToken: sessionInfo.sessionToken,
          sessionExpiresAt: sessionInfo.expiresAt
        },
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'log-failed-signup':
      const { body: failedSignupData } = await validateRequest(request, {
        body: z.object({
          action: z.literal('log-failed-signup'),
          email: z.string().email().optional(),
          loginMethod: z.string(),
          error: z.string()
        })
      })

      // Log failed signup attempt
      await auditService.logAuth('signup.failed', {
        email: failedSignupData.email,
        method: failedSignupData.loginMethod,
        success: false,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
        details: {
          error: failedSignupData.error
        }
      })

      // Record failed signup attempt
      await loginHistoryService.recordLoginAttempt({
        email: failedSignupData.email,
        loginMethod: failedSignupData.loginMethod,
        loginStatus: 'failed',
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
        deviceFingerprint: requestInfo.deviceFingerprint || parsedClientInfo.deviceFingerprint,
        geolocation: requestInfo.geolocation,
        riskScore: RequestUtils.calculateRiskScore(request),
        failureReason: failedSignupData.error
      })

      return NextResponse.json({
        success: true,
        data: { logged: true },
        timestamp: new Date().toISOString(),
        requestId
      })

    default:
      throw new Error('Invalid action specified')
  }
})