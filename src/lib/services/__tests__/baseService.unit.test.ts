import { BaseService, ServiceError, ErrorCode } from '../baseService'
import { 
  testData,
  createMockDatabaseResult,
  mockConsole
} from '../../../__tests__/utils/testHelpers'

// Mock database connection
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

// Create a concrete test class that extends BaseService
class TestService extends BaseService {
  constructor() {
    super('test_table')
  }

  // Expose protected methods for testing
  public testHandleError(error: any, operation: string) {
    return this.handleError(error, operation)
  }

  public testValidateRequired(data: Record<string, any>, required: string[]) {
    return this.validateRequired(data, required)
  }

  public testValidateUUID(value: string, fieldName?: string) {
    return this.validateUUID(value, fieldName)
  }

  public testValidateDecimal(value: string | number, fieldName: string, options?: { min?: number; max?: number }) {
    return this.validateDecimal(value, fieldName, options)
  }

  public testValidateEnum(value: string, allowedValues: string[], fieldName: string) {
    return this.validateEnum(value, allowedValues, fieldName)
  }

  public testValidateAddress(address: string, fieldName?: string) {
    return this.validateAddress(address, fieldName)
  }

  public testSetCache(key: string, data: any, ttl?: number) {
    return this.setCache(key, data, ttl)
  }

  public testGetCache<T>(key: string): T | null {
    return this.getCache<T>(key)
  }

  public testClearCache(pattern?: string) {
    return this.clearCache(pattern)
  }

  public testGetCacheStats() {
    return this.getCacheStats()
  }

  public testWithTransaction<T>(callback: () => Promise<T>) {
    return this.withTransaction(callback)
  }

  // Expose CRUD methods for testing
  public async testFindOne<T>(where: Record<string, any>) {
    return this.findOne<T>(where)
  }

  public async testFindMany<T>(where: Record<string, any>, orderBy?: string) {
    return this.findMany<T>(where, orderBy)
  }

  public async testInsertOne<T>(data: Record<string, any>) {
    return this.insertOne<T>(data)
  }

  public async testUpdateOne<T>(data: Record<string, any>, where: Record<string, any>) {
    return this.updateOne<T>(data, where)
  }

  public async testDeleteOne(where: Record<string, any>) {
    return this.deleteOne(where)
  }

  public async testPaginate<T>(where: Record<string, any>, page?: number, limit?: number) {
    return this.paginate<T>(where, page, limit)
  }

  public async testCustomQuery<T>(sql: string, params?: any[]) {
    return this.customQuery<T>(sql, params)
  }
}

describe('BaseService', () => {
  let service: TestService
  let mockQuery: jest.Mock
  let mockFindOne: jest.Mock
  let mockFindMany: jest.Mock
  let mockInsertOne: jest.Mock
  let mockUpdateOne: jest.Mock
  let mockDeleteOne: jest.Mock
  let mockPaginate: jest.Mock
  const consoleMocks = mockConsole()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TestService()

    const dbConnection = require('@/lib/database/connection')
    mockQuery = dbConnection.query
    mockFindOne = dbConnection.findOne
    mockFindMany = dbConnection.findMany
    mockInsertOne = dbConnection.insertOne
    mockUpdateOne = dbConnection.updateOne
    mockDeleteOne = dbConnection.deleteOne
    mockPaginate = dbConnection.paginate
  })

  describe('error handling', () => {
    it('should handle generic errors', () => {
      const error = new Error('Generic error')

      expect(() => service.testHandleError(error, 'testOperation'))
        .toThrow(ServiceError)
    })

    it('should map database error codes correctly', () => {
      const uniqueViolationError = new Error('Unique constraint violation')
      ;(uniqueViolationError as any).code = '23505'

      expect(() => service.testHandleError(uniqueViolationError, 'testOperation'))
        .toThrow('Record already exists')
    })

    it('should handle foreign key violations', () => {
      const fkError = new Error('Foreign key violation')
      ;(fkError as any).code = '23503'

      expect(() => service.testHandleError(fkError, 'testOperation'))
        .toThrow('Referenced record not found')
    })

    it('should handle not null violations', () => {
      const notNullError = new Error('Not null violation')
      ;(notNullError as any).code = '23502'

      expect(() => service.testHandleError(notNullError, 'testOperation'))
        .toThrow('Required field missing')
    })

    it('should handle connection errors', () => {
      const connectionError = new Error('Connection error')
      ;(connectionError as any).code = '08001'

      expect(() => service.testHandleError(connectionError, 'testOperation'))
        .toThrow('Database connection error')
    })

    it('should handle schema errors', () => {
      const schemaError = new Error('Table does not exist')
      ;(schemaError as any).code = '42P01'

      expect(() => service.testHandleError(schemaError, 'testOperation'))
        .toThrow('Database schema error')
    })

    it('should identify not found errors from message', () => {
      const notFoundError = new Error('Record not found')

      expect(() => service.testHandleError(notFoundError, 'testOperation'))
        .toThrow(ServiceError)

      try {
        service.testHandleError(notFoundError, 'testOperation')
      } catch (e) {
        expect((e as ServiceError).code).toBe(ErrorCode.NOT_FOUND)
      }
    })

    it('should log errors with proper context', () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'

      expect(() => service.testHandleError(error, 'testOperation')).toThrow()
      
      // Should have logged error details
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('TestService testOperation error:'),
        error
      )
    })
  })

  describe('validation', () => {
    describe('validateRequired', () => {
      it('should pass with all required fields present', () => {
        const data = { name: 'test', email: 'test@example.com', age: 25 }
        const required = ['name', 'email']

        expect(() => service.testValidateRequired(data, required)).not.toThrow()
      })

      it('should fail with missing required fields', () => {
        const data = { name: 'test' }
        const required = ['name', 'email', 'age']

        expect(() => service.testValidateRequired(data, required))
          .toThrow('Required fields missing: email, age')
      })

      it('should fail with null values', () => {
        const data = { name: 'test', email: null }
        const required = ['name', 'email']

        expect(() => service.testValidateRequired(data, required))
          .toThrow('Required fields missing: email')
      })

      it('should fail with empty strings', () => {
        const data = { name: 'test', email: '   ' }
        const required = ['name', 'email']

        expect(() => service.testValidateRequired(data, required))
          .toThrow('Required fields missing: email')
      })
    })

    describe('validateUUID', () => {
      it('should pass with valid UUID', () => {
        const validUUID = testData.uuid()
        expect(() => service.testValidateUUID(validUUID)).not.toThrow()
      })

      it('should fail with invalid UUID format', () => {
        expect(() => service.testValidateUUID('invalid-uuid'))
          .toThrow('Invalid UUID format for id')
      })

      it('should fail with non-string input', () => {
        expect(() => service.testValidateUUID(null as any))
          .toThrow('id must be a valid UUID string')
      })

      it('should use custom field name in error message', () => {
        expect(() => service.testValidateUUID('invalid', 'userId'))
          .toThrow('Invalid UUID format for userId')
      })

      it('should validate different UUID versions', () => {
        const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
        const uuidV4 = '550e8400-e29b-41d4-a716-446655440000'
        const uuidV5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d'

        expect(() => service.testValidateUUID(uuidV1)).not.toThrow()
        expect(() => service.testValidateUUID(uuidV4)).not.toThrow()
        expect(() => service.testValidateUUID(uuidV5)).not.toThrow()
      })
    })

    describe('validateDecimal', () => {
      it('should pass with valid decimal string', () => {
        const result = service.testValidateDecimal('123.45', 'amount')
        expect(result).toBe('123.45')
      })

      it('should pass with valid decimal number', () => {
        const result = service.testValidateDecimal(123.45, 'amount')
        expect(result).toBe('123.45')
      })

      it('should fail with invalid decimal', () => {
        expect(() => service.testValidateDecimal('not-a-number', 'amount'))
          .toThrow('amount must be a valid number')
      })

      it('should enforce minimum value', () => {
        expect(() => service.testValidateDecimal('5', 'amount', { min: 10 }))
          .toThrow('amount must be at least 10')
      })

      it('should enforce maximum value', () => {
        expect(() => service.testValidateDecimal('15', 'amount', { max: 10 }))
          .toThrow('amount must be at most 10')
      })

      it('should handle zero values', () => {
        const result = service.testValidateDecimal('0', 'amount')
        expect(result).toBe('0')
      })

      it('should handle negative values', () => {
        const result = service.testValidateDecimal('-123.45', 'amount')
        expect(result).toBe('-123.45')
      })
    })

    describe('validateEnum', () => {
      it('should pass with valid enum value', () => {
        const allowedValues = ['active', 'inactive', 'pending']
        expect(() => service.testValidateEnum('active', allowedValues, 'status'))
          .not.toThrow()
      })

      it('should fail with invalid enum value', () => {
        const allowedValues = ['active', 'inactive', 'pending']
        expect(() => service.testValidateEnum('invalid', allowedValues, 'status'))
          .toThrow('status must be one of: active, inactive, pending')
      })

      it('should be case sensitive', () => {
        const allowedValues = ['active', 'inactive']
        expect(() => service.testValidateEnum('ACTIVE', allowedValues, 'status'))
          .toThrow()
      })
    })

    describe('validateAddress', () => {
      it('should pass with valid Ethereum address', () => {
        const validAddress = '0x742b5c3f7b0c9c2f8b7c8b7c8b7c8b7c8b7c8b7c'
        expect(() => service.testValidateAddress(validAddress)).not.toThrow()
      })

      it('should fail with invalid address format', () => {
        expect(() => service.testValidateAddress('invalid-address'))
          .toThrow('Invalid address format for address')
      })

      it('should fail with wrong length', () => {
        expect(() => service.testValidateAddress('0x123'))
          .toThrow('Invalid address format')
      })

      it('should fail without 0x prefix', () => {
        expect(() => service.testValidateAddress('742b5c3f7b0c9c2f8b7c8b7c8b7c8b7c8b7c8b7c'))
          .toThrow('Invalid address format')
      })

      it('should use custom field name in error', () => {
        expect(() => service.testValidateAddress('invalid', 'walletAddress'))
          .toThrow('Invalid address format for walletAddress')
      })
    })
  })

  describe('caching', () => {
    beforeEach(() => {
      // Clear cache before each test
      service.testClearCache()
    })

    it('should set and get cache values', () => {
      const testData = { id: 1, name: 'test' }
      service.testSetCache('test-key', testData)

      const cached = service.testGetCache('test-key')
      expect(cached).toEqual(testData)
    })

    it('should return null for non-existent cache keys', () => {
      const cached = service.testGetCache('non-existent-key')
      expect(cached).toBeNull()
    })

    it('should expire cache after TTL', async () => {
      const testData = { id: 1, name: 'test' }
      service.testSetCache('test-key', testData, 50) // 50ms TTL

      // Should be available immediately
      expect(service.testGetCache('test-key')).toEqual(testData)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should be null after expiration
      expect(service.testGetCache('test-key')).toBeNull()
    })

    it('should clear cache by pattern', () => {
      service.testSetCache('user:1:profile', { name: 'user1' })
      service.testSetCache('user:2:profile', { name: 'user2' })
      service.testSetCache('system:config', { theme: 'dark' })

      service.testClearCache('user:')

      expect(service.testGetCache('user:1:profile')).toBeNull()
      expect(service.testGetCache('user:2:profile')).toBeNull()
      expect(service.testGetCache('system:config')).not.toBeNull()
    })

    it('should clear all cache when no pattern provided', () => {
      service.testSetCache('key1', 'value1')
      service.testSetCache('key2', 'value2')

      service.testClearCache()

      expect(service.testGetCache('key1')).toBeNull()
      expect(service.testGetCache('key2')).toBeNull()
    })

    it('should track cache statistics', () => {
      service.testSetCache('key1', 'value1')
      service.testGetCache('key1') // hit
      service.testGetCache('key1') // hit
      service.testGetCache('non-existent') // miss

      const stats = service.testGetCacheStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe('66.67%')
    })

    it('should implement LRU eviction when cache is full', () => {
      // Fill cache beyond MAX_CACHE_SIZE (simulate by setting many items)
      for (let i = 0; i < 1005; i++) {
        service.testSetCache(`key${i}`, `value${i}`)
      }

      const stats = service.testGetCacheStats()
      expect(stats.size).toBeLessThanOrEqual(1000) // MAX_CACHE_SIZE
      expect(stats.evictions).toBeGreaterThan(0)
    })
  })

  describe('CRUD operations', () => {
    describe('findOne', () => {
      it('should find one record', async () => {
        const mockRecord = { id: '1', name: 'test' }
        mockFindOne.mockResolvedValue(mockRecord)

        const result = await service.testFindOne({ id: '1' })

        expect(result).toEqual(mockRecord)
        expect(mockFindOne).toHaveBeenCalledWith('test_table', { id: '1' }, undefined)
      })

      it('should handle errors', async () => {
        mockFindOne.mockRejectedValue(new Error('Database error'))

        await expect(service.testFindOne({ id: '1' }))
          .rejects.toThrow(ServiceError)
      })
    })

    describe('findMany', () => {
      it('should find multiple records', async () => {
        const mockRecords = [{ id: '1' }, { id: '2' }]
        mockFindMany.mockResolvedValue(mockRecords)

        const result = await service.testFindMany({}, 'created_at DESC')

        expect(result).toEqual(mockRecords)
        expect(mockFindMany).toHaveBeenCalledWith('test_table', {}, 'created_at DESC', undefined, undefined, undefined)
      })
    })

    describe('insertOne', () => {
      it('should insert new record', async () => {
        const mockRecord = { id: '1', name: 'test' }
        mockInsertOne.mockResolvedValue(mockRecord)

        const result = await service.testInsertOne({ name: 'test' })

        expect(result).toEqual(mockRecord)
        expect(mockInsertOne).toHaveBeenCalledWith('test_table', { name: 'test' }, '*', undefined)
      })
    })

    describe('updateOne', () => {
      it('should update existing record', async () => {
        const mockRecord = { id: '1', name: 'updated' }
        mockUpdateOne.mockResolvedValue(mockRecord)

        const result = await service.testUpdateOne({ name: 'updated' }, { id: '1' })

        expect(result).toEqual(mockRecord)
        expect(mockUpdateOne).toHaveBeenCalledWith('test_table', { name: 'updated' }, { id: '1' }, '*', undefined)
      })
    })

    describe('deleteOne', () => {
      it('should delete record', async () => {
        mockDeleteOne.mockResolvedValue(true)

        const result = await service.testDeleteOne({ id: '1' })

        expect(result).toBe(true)
        expect(mockDeleteOne).toHaveBeenCalledWith('test_table', { id: '1' }, undefined)
      })
    })

    describe('paginate', () => {
      it('should return paginated results', async () => {
        const mockResult = {
          data: [{ id: '1' }, { id: '2' }],
          total: 10,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
        mockPaginate.mockResolvedValue(mockResult)

        const result = await service.testPaginate({}, 1, 20)

        expect(result).toEqual(mockResult)
        expect(mockPaginate).toHaveBeenCalledWith('test_table', {}, 1, 20, 'created_at DESC', undefined)
      })
    })

    describe('customQuery', () => {
      it('should execute custom SQL query', async () => {
        const mockRows = [{ count: '5' }]
        mockQuery.mockResolvedValue({ rows: mockRows })

        const result = await service.testCustomQuery('SELECT COUNT(*) as count FROM test_table')

        expect(result).toEqual(mockRows)
        expect(mockQuery).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM test_table', undefined, undefined)
      })
    })
  })

  describe('transactions', () => {
    it('should execute transaction successfully', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      }
      const mockDatabase = {
        getClient: jest.fn().mockResolvedValue(mockClient)
      }

      const { getDatabase } = require('@/lib/database/connection')
      getDatabase.mockReturnValue(mockDatabase)

      const callback = jest.fn().mockResolvedValue('success')

      const result = await service.testWithTransaction(callback)

      expect(result).toBe('success')
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(callback).toHaveBeenCalled()
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should rollback on error', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      }
      const mockDatabase = {
        getClient: jest.fn().mockResolvedValue(mockClient)
      }

      const { getDatabase } = require('@/lib/database/connection')
      getDatabase.mockReturnValue(mockDatabase)

      const callback = jest.fn().mockRejectedValue(new Error('Transaction failed'))

      await expect(service.testWithTransaction(callback))
        .rejects.toThrow('Transaction failed')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should retry failed transactions', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      }
      const mockDatabase = {
        getClient: jest.fn().mockResolvedValue(mockClient)
      }

      const { getDatabase } = require('@/lib/database/connection')
      getDatabase.mockReturnValue(mockDatabase)

      const callback = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('success')

      const result = await service.testWithTransaction(callback)

      expect(result).toBe('success')
      expect(callback).toHaveBeenCalledTimes(2)
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK') // First attempt
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT') // Second attempt
    })

    it('should not retry validation errors', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      }
      const mockDatabase = {
        getClient: jest.fn().mockResolvedValue(mockClient)
      }

      const { getDatabase } = require('@/lib/database/connection')
      getDatabase.mockReturnValue(mockDatabase)

      const validationError = new ServiceError(ErrorCode.VALIDATION_ERROR, 'Validation failed')
      const callback = jest.fn().mockRejectedValue(validationError)

      await expect(service.testWithTransaction(callback))
        .rejects.toThrow(validationError)

      expect(callback).toHaveBeenCalledTimes(1) // Should not retry
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockQuery.mockResolvedValue({ rows: [{ test: 1 }] })

      const result = await service.healthCheck()

      expect(result.status).toBe('healthy')
      expect(result.details).toEqual(expect.objectContaining({
        service: 'TestService',
        tableName: 'test_table',
        cacheStats: expect.any(Object),
        timestamp: expect.any(String)
      }))
    })

    it('should return unhealthy status on error', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection failed'))

      const result = await service.healthCheck()

      expect(result.status).toBe('unhealthy')
      expect(result.details).toEqual(expect.objectContaining({
        service: 'TestService',
        error: 'Database connection failed',
        timestamp: expect.any(String)
      }))
    })
  })
})