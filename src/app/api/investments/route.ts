import { NextRequest, NextResponse } from 'next/server'
import { investmentService } from '@/lib/services/investmentService'
import { withErrorHandler, rateLimiter } from '@/lib/middleware/errorHandler'
import { ServiceError, ErrorCode } from '@/lib/services/baseService'

export const GET = withErrorHandler(async (request: NextRequest, requestId: string) => {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const action = searchParams.get('action')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Rate limiting check
  const clientIdentifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  if (!rateLimiter.checkRateLimit(clientIdentifier)) {
    throw new ServiceError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.'
    )
  }

  if (!userId) {
    throw new ServiceError(
      ErrorCode.VALIDATION_ERROR,
      'User ID is required'
    )
  }

  switch (action) {
    case 'portfolio':
      const portfolioSummary = await investmentService.getPortfolioSummary(userId)
      return portfolioSummary

    case 'investments':
      const investments = await investmentService.getUserInvestments(userId, page, limit)
      return investments

    case 'defi-protocols':
      const protocols = await investmentService.getDeFiProtocols(userId)
      return protocols

    case 'staking-pools':
      const stakingPools = await investmentService.getStakingPools(userId)
      return stakingPools

    case 'auto-invest-plans':
      const plans = await investmentService.getAutoInvestPlans(userId)
      return plans

    default:
      // Default: return user investments
      const userInvestments = await investmentService.getUserInvestments(userId, page, limit)
      return userInvestments
  }
})

export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  const body = await request.json()
  const { action, ...data } = body

  // Rate limiting check
  const clientIdentifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  if (!rateLimiter.checkRateLimit(clientIdentifier)) {
    throw new ServiceError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.'
    )
  }

  if (!data.userId) {
    throw new ServiceError(
      ErrorCode.VALIDATION_ERROR,
      'User ID is required'
    )
  }

  switch (action) {
    case 'create-investment':
      const investment = await investmentService.createInvestment({
        userId: data.userId,
        assetId: data.assetId,
        quantity: data.quantity,
        averageCost: data.averageCost,
        totalInvested: data.totalInvested,
        currency: data.currency
      })
      return investment

    case 'create-auto-invest-plan':
      const plan = await investmentService.createAutoInvestPlan({
        userId: data.userId,
        name: data.name,
        strategy: data.strategy,
        frequency: data.frequency,
        amount: data.amount,
        currency: data.currency,
        allocations: data.allocations
      })
      return plan

    default:
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid action specified'
      )
  }
})