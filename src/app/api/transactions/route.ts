import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { transactionService } from '@/lib/services/transactionService'
import type { TransactionFilters } from '@/lib/services/transactionService'
import { withErrorHandler } from '@/lib/middleware/errorHandler'
import { authenticateApiRequest, requireResourceAccess } from '@/lib/middleware/auth'
import { applyRateLimit, apiRateLimiter } from '@/lib/middleware/rateLimiting'
import { validateRequest } from '@/lib/validation/middleware'

const TransactionQuerySchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['summary', 'recent', 'analytics', 'export', 'list', 'history']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  period: z.string().optional(),
  format: z.enum(['csv', 'json']).optional(),
  transactionType: z.string().optional(),
  status: z.string().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  stablecoin: z.string().optional(),
  chainId: z.string().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  amountMin: z.string().optional(),
  amountMax: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  // Validate query parameters
  const { query } = await validateRequest(request, {
    query: TransactionQuerySchema
  })

  // Check if user can access this resource (IDOR protection)
  requireResourceAccess(query.userId)(authenticatedUser)

  switch (query.action) {
    case 'summary':
      const summary = await transactionService.getTransactionSummary(query.userId, query.period || '30d')
      return NextResponse.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'recent':
      const recent = await transactionService.getRecentTransactions(query.userId, query.limit || 5)
      return NextResponse.json({
        success: true,
        data: recent,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'analytics':
      const analytics = await transactionService.getTransactionAnalytics(query.userId, query.period || '30d')
      return NextResponse.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'export':
      const exportFilters: TransactionFilters = {}
      
      if (query.transactionType) {
        exportFilters.transactionType = query.transactionType as any
      }
      
      if (query.status) {
        exportFilters.status = query.status as any
      }
      
      const exportData = await transactionService.exportTransactions(query.userId, exportFilters, query.format || 'csv')
      
      if (query.format === 'csv') {
        return new NextResponse(exportData.content, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        data: exportData,
        timestamp: new Date().toISOString(),
        requestId
      })

    case 'list':
    case 'history':
    default:
      const filters: TransactionFilters = {}
      
      if (query.transactionType) filters.transactionType = query.transactionType as any
      if (query.status) filters.status = query.status as any
      if (query.search) filters.search = query.search
      if (query.sortBy) filters.sortBy = query.sortBy as any
      if (query.sortOrder) filters.sortOrder = query.sortOrder as any
      if (query.stablecoin) filters.stablecoin = query.stablecoin.split(',') as any[]
      if (query.chainId) filters.chainId = query.chainId.split(',') as any[]
      if (query.dateFrom) filters.dateFrom = query.dateFrom
      if (query.dateTo) filters.dateTo = query.dateTo
      if (query.amountMin) filters.amountMin = query.amountMin
      if (query.amountMax) filters.amountMax = query.amountMax

      const transactions = await transactionService.getTransactionHistory(
        query.userId,
        filters,
        query.page,
        query.limit
      )
      
      return NextResponse.json({
        success: true,
        data: transactions,
        timestamp: new Date().toISOString(),
        requestId
      })
  }
})

const CreateTransactionSchema = z.object({
  userId: z.string().uuid(),
  txHash: z.string().min(1),
  transactionType: z.enum(['deposit', 'withdrawal', 'yield', 'swap', 'bridge', 'spend', 'transfer', 'reward', 'fee', 'investment', 'loan', 'insurance']),
  amount: z.string().regex(/^\d+\.?\d*$/),
  feeAmount: z.string().regex(/^\d+\.?\d*$/).optional(),
  stablecoin: z.enum(['USDC', 'USDT']),
  chainId: z.string().regex(/^(1|137|42161|10|56)$/),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  fromChain: z.string().regex(/^(1|137|42161|10|56)$/).optional(),
  toChain: z.string().regex(/^(1|137|42161|10|56)$/).optional(),
  protocolName: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
  blockNumber: z.number().int().optional(),
  blockTimestamp: z.string().optional(),
  gasUsed: z.string().optional(),
  gasPrice: z.string().optional()
})

export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user
  const authenticatedUser = await authenticateApiRequest(request)

  // Validate request body
  const { body } = await validateRequest(request, {
    body: CreateTransactionSchema
  })

  // Check if user can access this resource (IDOR protection)
  requireResourceAccess(body.userId)(authenticatedUser)

  // Create new transaction
  const transaction = await transactionService.createTransaction({
    userId: body.userId,
    txHash: body.txHash,
    transactionType: body.transactionType,
    amount: body.amount,
    feeAmount: body.feeAmount,
    stablecoin: body.stablecoin,
    chainId: body.chainId,
    fromAddress: body.fromAddress,
    toAddress: body.toAddress,
    fromChain: body.fromChain,
    toChain: body.toChain,
    protocolName: body.protocolName,
    description: body.description,
    metadata: body.metadata,
    blockNumber: body.blockNumber,
    blockTimestamp: body.blockTimestamp,
    gasUsed: body.gasUsed,
    gasPrice: body.gasPrice
  })

  return NextResponse.json({
    success: true,
    data: transaction,
    timestamp: new Date().toISOString(),
    requestId
  }, { status: 201 })
})

const UpdateTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  blockNumber: z.number().int().optional(),
  blockTimestamp: z.string().optional(),
  gasUsed: z.string().optional()
})

export const PATCH = withErrorHandler(async (request: NextRequest, requestId: string) => {
  // Apply rate limiting
  await applyRateLimit(request, apiRateLimiter)

  // Authenticate user (admin or system only for transaction updates)
  const authenticatedUser = await authenticateApiRequest(request)
  
  // Only admin or system can update transaction status
  if (authenticatedUser.role !== 'admin' && authenticatedUser.role !== 'system') {
    throw new Error('Insufficient permissions to update transaction status')
  }

  // Validate request body
  const { body } = await validateRequest(request, {
    body: UpdateTransactionSchema
  })

  const updated = await transactionService.updateTransactionStatus(
    body.transactionId,
    body.status,
    body.blockNumber,
    body.blockTimestamp,
    body.gasUsed
  )

  if (!updated) {
    throw new Error('Transaction not found')
  }

  return NextResponse.json({
    success: true,
    data: updated,
    timestamp: new Date().toISOString(),
    requestId
  })
})