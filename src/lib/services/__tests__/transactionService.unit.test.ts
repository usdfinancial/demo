import { TransactionService } from '../transactionService'
import { 
  createMockTransaction,
  createMockDatabaseResult,
  testData,
  MOCK_ADDRESSES,
  MOCK_TX_HASHES,
  mockConsole
} from '../../../__tests__/utils/testHelpers'
import { BaseService, ErrorCode, ServiceError } from '../baseService'

// Mock the base service and database connection
jest.mock('@/lib/database/connection', () => ({
  query: jest.fn(),
  findOne: jest.fn(),
  findMany: jest.fn(),
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  paginate: jest.fn(),
  getDatabase: jest.fn(() => ({
    getClient: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn()
    }))
  }))
}))

describe('TransactionService', () => {
  let service: TransactionService
  let mockQuery: jest.Mock
  let mockInsertOne: jest.Mock
  let mockUpdateOne: jest.Mock
  let mockFindOne: jest.Mock
  let mockFindMany: jest.Mock
  const consoleMocks = mockConsole()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TransactionService()
    
    const dbConnection = require('@/lib/database/connection')
    mockQuery = dbConnection.query
    mockInsertOne = dbConnection.insertOne
    mockUpdateOne = dbConnection.updateOne
    mockFindOne = dbConnection.findOne
    mockFindMany = dbConnection.findMany

    // Mock the protected methods from BaseService
    jest.spyOn(service as any, 'customQuery').mockImplementation((sql, params) => {
      return mockQuery(sql, params).then((result: any) => result.rows || [])
    })
    jest.spyOn(service as any, 'insertOne').mockImplementation((...args) => mockInsertOne(...args))
    jest.spyOn(service as any, 'updateOne').mockImplementation((...args) => mockUpdateOne(...args))
    jest.spyOn(service as any, 'findOne').mockImplementation((...args) => mockFindOne(...args))
    jest.spyOn(service as any, 'findMany').mockImplementation((...args) => mockFindMany(...args))
  })

  describe('getTransactionSummary', () => {
    it('should return comprehensive transaction summary', async () => {
      const mockSummaryData = {
        total_transactions: '150',
        total_volume: '50000.0',
        success_count: '145',
        avg_amount: '333.33',
        top_type: 'transfer',
        volume_change: '15.5',
        transaction_count_change: '8.2'
      }

      mockQuery.mockResolvedValue(createMockDatabaseResult([mockSummaryData]))

      const result = await service.getTransactionSummary(testData.uuid(), '30d')

      expect(result).toEqual({
        totalTransactions: 150,
        totalVolume: '50000.0',
        successRate: (145 / 150 * 100), // 96.67%
        avgTransactionValue: '333.33',
        topTransactionType: 'transfer',
        recentActivity: {
          period: '30d',
          transactionCount: 150,
          volumeChange: 15.5
        }
      })
    })

    it('should handle empty transaction history', async () => {
      const mockEmptyData = {
        total_transactions: '0',
        total_volume: '0',
        success_count: '0',
        avg_amount: '0',
        top_type: 'transfer',
        volume_change: '0',
        transaction_count_change: '0'
      }

      mockQuery.mockResolvedValue(createMockDatabaseResult([mockEmptyData]))

      const result = await service.getTransactionSummary(testData.uuid())

      expect(result.totalTransactions).toBe(0)
      expect(result.successRate).toBe(0)
      expect(result.totalVolume).toBe('0')
    })

    it('should validate UUID format', async () => {
      await expect(service.getTransactionSummary('invalid-uuid'))
        .rejects.toThrow('Invalid UUID format')
    })

    it('should handle different time periods', async () => {
      const periods = ['24h', '7d', '30d']
      
      for (const period of periods) {
        mockQuery.mockResolvedValue(createMockDatabaseResult([{
          total_transactions: '10',
          total_volume: '1000.0',
          success_count: '10',
          avg_amount: '100.0',
          top_type: 'transfer'
        }]))

        const result = await service.getTransactionSummary(testData.uuid(), period as any)
        expect(result.recentActivity.period).toBe(period)
      }
    })

    it('should use caching for repeated requests', async () => {
      const userId = testData.uuid()
      const mockData = { total_transactions: '10' }
      
      mockQuery.mockResolvedValue(createMockDatabaseResult([mockData]))

      // Mock cache methods
      const getCacheSpy = jest.spyOn(service as any, 'getCache').mockReturnValue(null)
      const setCacheSpy = jest.spyOn(service as any, 'setCache').mockImplementation(() => {})

      await service.getTransactionSummary(userId)

      expect(setCacheSpy).toHaveBeenCalledWith(
        expect.stringContaining('transaction_summary'),
        expect.any(Object),
        5 * 60 * 1000 // 5 minutes
      )
    })
  })

  describe('createTransaction', () => {
    it('should create new transaction successfully', async () => {
      const transactionData = {
        userId: testData.uuid(),
        txHash: MOCK_TX_HASHES.SUCCESS,
        transactionType: 'transfer' as const,
        amount: '100.0',
        feeAmount: '0.5',
        stablecoin: 'USDC' as const,
        chainId: '11155111' as const,
        fromAddress: MOCK_ADDRESSES.SMART_WALLET,
        toAddress: MOCK_ADDRESSES.RECIPIENT,
        description: 'Test transaction'
      }

      const mockTransaction = createMockTransaction(transactionData)
      mockInsertOne.mockResolvedValue(mockTransaction)

      const result = await service.createTransaction(transactionData)

      expect(result).toEqual(mockTransaction)
      expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
        user_id: transactionData.userId,
        tx_hash: transactionData.txHash,
        transaction_type: transactionData.transactionType,
        status: 'pending',
        amount: transactionData.amount,
        stablecoin: transactionData.stablecoin
      }))
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        userId: testData.uuid(),
        // Missing required fields
      }

      await expect(service.createTransaction(incompleteData as any))
        .rejects.toThrow(ServiceError)
    })

    it('should validate UUID format for userId', async () => {
      const invalidData = {
        userId: 'invalid-uuid',
        transactionType: 'transfer' as const,
        amount: '100.0',
        stablecoin: 'USDC' as const,
        chainId: '1' as const
      }

      await expect(service.createTransaction(invalidData))
        .rejects.toThrow('Invalid UUID format')
    })

    it('should validate decimal amount format', async () => {
      const invalidData = {
        userId: testData.uuid(),
        transactionType: 'transfer' as const,
        amount: 'invalid-amount',
        stablecoin: 'USDC' as const,
        chainId: '1' as const
      }

      await expect(service.createTransaction(invalidData))
        .rejects.toThrow('must be a valid number')
    })

    it('should clear cache after successful creation', async () => {
      const userId = testData.uuid()
      const transactionData = {
        userId,
        transactionType: 'transfer' as const,
        amount: '100.0',
        stablecoin: 'USDC' as const,
        chainId: '1' as const
      }

      mockInsertOne.mockResolvedValue(createMockTransaction())
      const clearCacheSpy = jest.spyOn(service as any, 'clearCache')

      await service.createTransaction(transactionData)

      expect(clearCacheSpy).toHaveBeenCalledWith(`transaction_summary:${userId}`)
    })
  })

  describe('updateTransactionStatus', () => {
    it('should update transaction status successfully', async () => {
      const transactionId = testData.uuid()
      const updatedTransaction = createMockTransaction({ 
        id: transactionId,
        status: 'completed' 
      })

      mockUpdateOne.mockResolvedValue(updatedTransaction)

      const result = await service.updateTransactionStatus(
        transactionId,
        'completed',
        12345,
        new Date().toISOString(),
        21000
      )

      expect(result).toEqual(updatedTransaction)
      expect(mockUpdateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          block_number: 12345,
          gas_used: 21000,
          confirmed_at: expect.any(String)
        }),
        { id: transactionId }
      )
    })

    it('should handle non-existent transaction', async () => {
      mockUpdateOne.mockResolvedValue(null)

      const result = await service.updateTransactionStatus(
        testData.uuid(),
        'completed'
      )

      expect(result).toBeNull()
    })

    it('should validate transaction ID format', async () => {
      await expect(service.updateTransactionStatus('invalid-id', 'completed'))
        .rejects.toThrow('Invalid UUID format')
    })

    it('should clear cache after update', async () => {
      const mockTransaction = createMockTransaction()
      mockUpdateOne.mockResolvedValue(mockTransaction)
      const clearCacheSpy = jest.spyOn(service as any, 'clearCache')

      await service.updateTransactionStatus(testData.uuid(), 'completed')

      expect(clearCacheSpy).toHaveBeenCalledWith(`transaction_summary:${mockTransaction.user_id}`)
    })
  })

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const mockTransactions = [
        createMockTransaction({ amount: '100.0' }),
        createMockTransaction({ amount: '200.0' }),
        createMockTransaction({ amount: '50.0' })
      ]

      mockQuery
        .mockResolvedValueOnce(createMockDatabaseResult(mockTransactions))
        .mockResolvedValueOnce(createMockDatabaseResult([{ count: '10' }]))

      const result = await service.getTransactionHistory(testData.uuid(), {}, 1, 20)

      expect(result).toEqual({
        data: mockTransactions,
        total: 10,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      })
    })

    it('should apply filters correctly', async () => {
      const userId = testData.uuid()
      const filters = {
        type: ['transfer'],
        status: ['completed'],
        stablecoin: ['USDC'],
        chainId: ['1'],
        dateFrom: '2023-01-01',
        dateTo: '2023-12-31',
        amountMin: '10',
        amountMax: '1000'
      }

      mockQuery
        .mockResolvedValueOnce(createMockDatabaseResult([]))
        .mockResolvedValueOnce(createMockDatabaseResult([{ count: '0' }]))

      await service.getTransactionHistory(userId, filters)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.user_id = $1'),
        expect.arrayContaining([userId])
      )
    })

    it('should include network information and explorer URLs', async () => {
      const mockTransaction = createMockTransaction({
        chain_id: '1',
        tx_hash: MOCK_TX_HASHES.SUCCESS
      })

      mockQuery
        .mockResolvedValueOnce(createMockDatabaseResult([mockTransaction]))
        .mockResolvedValueOnce(createMockDatabaseResult([{ count: '1' }]))

      const result = await service.getTransactionHistory(testData.uuid())

      expect(result.data[0]).toEqual(expect.objectContaining({
        networkName: expect.any(String),
        explorerUrl: expect.stringContaining('etherscan.io')
      }))
    })
  })

  describe('getTransaction', () => {
    it('should return single transaction with details', async () => {
      const transactionId = testData.uuid()
      const mockTransaction = createMockTransaction({ id: transactionId })

      mockQuery.mockResolvedValue(createMockDatabaseResult([mockTransaction]))

      const result = await service.getTransaction(transactionId)

      expect(result).toEqual(mockTransaction)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.id = $1'),
        [transactionId]
      )
    })

    it('should return null for non-existent transaction', async () => {
      mockQuery.mockResolvedValue(createMockDatabaseResult([]))

      const result = await service.getTransaction(testData.uuid())

      expect(result).toBeNull()
    })

    it('should validate transaction ID format', async () => {
      await expect(service.getTransaction('invalid-id'))
        .rejects.toThrow('Invalid UUID format')
    })
  })

  describe('getRecentTransactions', () => {
    it('should return recent transactions with limit', async () => {
      const mockTransactions = Array.from({ length: 5 }, () => createMockTransaction())
      mockQuery.mockResolvedValue(createMockDatabaseResult(mockTransactions))

      const result = await service.getRecentTransactions(testData.uuid(), 5)

      expect(result).toHaveLength(5)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2'),
        expect.arrayContaining([expect.any(String), 5])
      )
    })

    it('should use caching for repeated requests', async () => {
      const userId = testData.uuid()
      mockQuery.mockResolvedValue(createMockDatabaseResult([]))

      const getCacheSpy = jest.spyOn(service as any, 'getCache').mockReturnValue(null)
      const setCacheSpy = jest.spyOn(service as any, 'setCache').mockImplementation(() => {})

      await service.getRecentTransactions(userId)

      expect(setCacheSpy).toHaveBeenCalledWith(
        expect.stringContaining('recent_transactions'),
        expect.any(Array),
        2 * 60 * 1000 // 2 minutes
      )
    })
  })

  describe('getTransactionAnalytics', () => {
    it('should return comprehensive analytics data', async () => {
      const mockChartData = [
        { date: '2023-01-01', volume: '1000', count: '5' },
        { date: '2023-01-02', volume: '2000', count: '8' }
      ]

      const mockTypeBreakdown = [
        { transaction_type: 'transfer', count: '10', volume: '5000' },
        { transaction_type: 'deposit', count: '5', volume: '2500' }
      ]

      const mockChainDistribution = [
        { chain_id: '1', count: '8', volume: '4000' },
        { chain_id: '137', count: '7', volume: '3500' }
      ]

      mockQuery
        .mockResolvedValueOnce(createMockDatabaseResult(mockChartData))
        .mockResolvedValueOnce(createMockDatabaseResult(mockTypeBreakdown))
        .mockResolvedValueOnce(createMockDatabaseResult(mockChainDistribution))

      const result = await service.getTransactionAnalytics(testData.uuid())

      expect(result).toEqual({
        chartData: [
          { date: '2023-01-01', volume: 1000, count: 5 },
          { date: '2023-01-02', volume: 2000, count: 8 }
        ],
        typeBreakdown: expect.arrayContaining([
          expect.objectContaining({
            type: 'transfer',
            count: 10,
            volume: '5000',
            percentage: expect.any(Number)
          })
        ]),
        chainDistribution: expect.arrayContaining([
          expect.objectContaining({
            chainId: '1',
            chainName: 'Ethereum',
            count: 8,
            volume: '4000'
          })
        ])
      })
    })

    it('should handle different time periods', async () => {
      const periods = ['7d', '30d', '90d']
      
      for (const period of periods) {
        mockQuery
          .mockResolvedValueOnce(createMockDatabaseResult([]))
          .mockResolvedValueOnce(createMockDatabaseResult([]))
          .mockResolvedValueOnce(createMockDatabaseResult([]))

        const result = await service.getTransactionAnalytics(testData.uuid(), period as any)
        expect(result.chartData).toBeDefined()
      }
    })

    it('should use caching for analytics data', async () => {
      const userId = testData.uuid()
      
      mockQuery
        .mockResolvedValue(createMockDatabaseResult([]))

      const setCacheSpy = jest.spyOn(service as any, 'setCache').mockImplementation(() => {})

      await service.getTransactionAnalytics(userId)

      expect(setCacheSpy).toHaveBeenCalledWith(
        expect.stringContaining('transaction_analytics'),
        expect.any(Object),
        10 * 60 * 1000 // 10 minutes
      )
    })
  })

  describe('exportTransactions', () => {
    it('should export transactions in CSV format', async () => {
      const mockTransactions = [
        createMockTransaction({ 
          amount: '100.0',
          transaction_type: 'transfer',
          created_at: '2023-01-01T00:00:00Z'
        })
      ]

      jest.spyOn(service, 'getTransactionHistory').mockResolvedValue({
        data: mockTransactions,
        total: 1,
        page: 1,
        limit: 10000,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      })

      const result = await service.exportTransactions(testData.uuid(), {}, 'csv')

      expect(result.content).toContain('Date,Type,Amount,Stablecoin,Network,Status,Description,Transaction Hash')
      expect(result.content).toContain('transfer')
      expect(result.content).toContain('100.0')
      expect(result.filename).toMatch(/^transactions_.*\.csv$/)
    })

    it('should export transactions in JSON format', async () => {
      const mockTransactions = [createMockTransaction()]

      jest.spyOn(service, 'getTransactionHistory').mockResolvedValue({
        data: mockTransactions,
        total: 1,
        page: 1,
        limit: 10000,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      })

      const result = await service.exportTransactions(testData.uuid(), {}, 'json')

      expect(() => JSON.parse(result.content)).not.toThrow()
      expect(result.filename).toMatch(/^transactions_.*\.json$/)
    })

    it('should apply filters during export', async () => {
      const filters = { type: ['transfer'] }
      jest.spyOn(service, 'getTransactionHistory').mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10000,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })

      await service.exportTransactions(testData.uuid(), filters)

      expect(service.getTransactionHistory).toHaveBeenCalledWith(
        expect.any(String),
        filters,
        1,
        10000
      )
    })
  })

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      mockQuery.mockRejectedValue(new Error('Connection refused'))

      await expect(service.getTransactionSummary(testData.uuid()))
        .rejects.toThrow(ServiceError)
    })

    it('should handle validation errors properly', async () => {
      const error = new Error('Validation failed')
      ;(error as any).code = '23502' // Not null violation

      mockInsertOne.mockRejectedValue(error)

      await expect(service.createTransaction({
        userId: testData.uuid(),
        transactionType: 'transfer',
        amount: '100.0',
        stablecoin: 'USDC',
        chainId: '1'
      })).rejects.toThrow(ServiceError)
    })

    it('should handle unique constraint violations', async () => {
      const error = new Error('Duplicate entry')
      ;(error as any).code = '23505' // Unique violation

      mockInsertOne.mockRejectedValue(error)

      await expect(service.createTransaction({
        userId: testData.uuid(),
        transactionType: 'transfer',
        amount: '100.0',
        stablecoin: 'USDC',
        chainId: '1'
      })).rejects.toThrow('Record already exists')
    })
  })
})