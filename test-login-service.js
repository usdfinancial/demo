#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

// Import the database connection directly to test the service
const { Pool } = require('pg')

// Simulate the loginHistoryService
class TestLoginHistoryService {
  constructor() {
    this.pool = this.createPool()
  }

  createPool() {
    const connStr = process.env.DATABASE_URL
    if (connStr.includes('rds.amazonaws.com')) {
      const url = new URL(connStr)
      return new Pool({
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        ssl: { 
          rejectUnauthorized: false,
          require: true
        }
      })
    } else {
      return new Pool({ connectionString: connStr })
    }
  }

  generateId() {
    return require('crypto').randomUUID()
  }

  async customQuery(query, params) {
    const client = await this.pool.connect()
    try {
      const result = await client.query(query, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  async recordLoginAttempt(data) {
    try {
      const loginId = this.generateId()
      
      const query = `
        INSERT INTO login_history (
          id, user_id, email, login_method, login_status, 
          ip_address, user_agent, device_fingerprint, geolocation, 
          risk_score, failure_reason, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        loginId,
        data.userId || null,
        data.email?.toLowerCase() || null,
        data.loginMethod,
        data.loginStatus,
        data.ipAddress || null,
        data.userAgent || null,
        data.deviceFingerprint || null,
        data.geolocation ? JSON.stringify(data.geolocation) : null,
        data.riskScore || null,
        data.failureReason || null
      ])

      if (result.length === 0) {
        throw new Error('Failed to record login attempt')
      }

      console.log(`${data.loginStatus === 'success' ? '✅' : '❌'} Login attempt recorded:`, {
        id: result[0].id,
        loginMethod: data.loginMethod,
        status: data.loginStatus,
        email: data.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        ipAddress: data.ipAddress?.replace(/(\d+\.\d+).*/, '$1.x.x'),
        timestamp: result[0].created_at
      })

      return result[0]
    } catch (error) {
      console.error('❌ Error recording login attempt:', error)
      throw error
    }
  }
}

async function testLoginService() {
  const service = new TestLoginHistoryService()
  
  try {
    console.log('🧪 Testing login history service directly...')
    
    // Test 1: Successful signup
    console.log('🔄 Testing successful signup recording...')
    await service.recordLoginAttempt({
      userId: 'test-user-123',
      email: 'service-test@example.com',
      loginMethod: 'email',
      loginStatus: 'success',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      deviceFingerprint: 'test-fingerprint',
      riskScore: 5
    })
    
    // Test 2: Failed login
    console.log('🔄 Testing failed login recording...')
    await service.recordLoginAttempt({
      email: 'failed-service-test@example.com',
      loginMethod: 'google',
      loginStatus: 'failed',
      ipAddress: '192.168.1.1',
      userAgent: 'Test Agent',
      failureReason: 'Invalid credentials'
    })
    
    // Test 3: Authentication success
    console.log('🔄 Testing authentication success recording...')
    await service.recordLoginAttempt({
      userId: 'test-user-456',
      email: 'auth-test@example.com',
      loginMethod: 'passkey',
      loginStatus: 'success',
      ipAddress: '10.0.0.1',
      userAgent: 'Browser Agent',
      riskScore: 2
    })
    
    console.log('')
    console.log('✅ All login history service tests passed!')
    
    // Verify data was inserted
    const client = await service.pool.connect()
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count, 
               COUNT(CASE WHEN login_status = 'success' THEN 1 END) as success_count,
               COUNT(CASE WHEN login_status = 'failed' THEN 1 END) as failed_count
        FROM login_history 
        WHERE created_at > NOW() - INTERVAL '1 minute'
      `)
      
      console.log('📊 Recent login history summary:')
      console.log(`   Total attempts: ${result.rows[0].count}`)
      console.log(`   Successful: ${result.rows[0].success_count}`)
      console.log(`   Failed: ${result.rows[0].failed_count}`)
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Service test failed:', error)
  } finally {
    await service.pool.end()
  }
}

testLoginService()
