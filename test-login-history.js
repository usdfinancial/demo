#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function testLoginHistory() {
  let client
  try {
    console.log('🧪 Testing login history service...')
    
    // Setup database connection
    const connStr = process.env.DATABASE_URL
    if (!connStr) {
      throw new Error('DATABASE_URL not found in environment')
    }
    
    let poolConfig
    if (connStr.includes('rds.amazonaws.com')) {
      const url = new URL(connStr)
      poolConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        ssl: { 
          rejectUnauthorized: false,
          require: true
        }
      }
    } else {
      poolConfig = { connectionString: connStr }
    }
    
    const pool = new Pool(poolConfig)
    client = await pool.connect()
    
    console.log('✅ Connected to database')
    
    // Test 1: Insert a login attempt directly
    const testEmail = 'test-login@example.com'
    const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // UUID format
    
    console.log('🔄 Testing direct login history insertion...')
    
    const insertResult = await client.query(`
      INSERT INTO login_history (
        user_id, email, login_method, login_status,
        ip_address, user_agent, device_fingerprint, geolocation,
        risk_score, failure_reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `, [
      testUserId,
      testEmail,
      'email',
      'success',
      '192.168.1.100',
      'Test User Agent',
      'test-fingerprint-123',
      JSON.stringify({ country: 'US', city: 'New York' }),
      10,
      null
    ])
    
    if (insertResult.rows.length > 0) {
      console.log('✅ Login history record created:')
      console.log('   ID:', insertResult.rows[0].id)
      console.log('   Email:', insertResult.rows[0].email)
      console.log('   Method:', insertResult.rows[0].login_method)
      console.log('   Status:', insertResult.rows[0].login_status)
      console.log('   Created:', insertResult.rows[0].created_at)
    }
    
    // Test 2: Query the data back
    const queryResult = await client.query('SELECT COUNT(*) as total FROM login_history')
    console.log('✅ Total login history records:', queryResult.rows[0].total)
    
    // Test 3: Test failed login attempt
    console.log('🔄 Testing failed login attempt...')
    
    const failedResult = await client.query(`
      INSERT INTO login_history (
        email, login_method, login_status,
        ip_address, failure_reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [
      'failed-test@example.com',
      'google',
      'failed',
      '192.168.1.200',
      'Invalid credentials'
    ])
    
    console.log('✅ Failed login attempt recorded with ID:', failedResult.rows[0].id)
    
    // Test 4: Query recent activity
    const recentResult = await client.query(`
      SELECT 
        email, login_method, login_status, 
        ip_address, created_at, failure_reason
      FROM login_history 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    
    console.log('📊 Recent login attempts:')
    recentResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.email} via ${row.login_method} - ${row.login_status}`)
      console.log(`      IP: ${row.ip_address}, Time: ${row.created_at}`)
      if (row.failure_reason) {
        console.log(`      Reason: ${row.failure_reason}`)
      }
    })
    
    console.log('')
    console.log('🧪 Login history system TEST PASSED')
    
  } catch (error) {
    console.error('❌ Login history test failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
  } finally {
    if (client) {
      client.release()
    }
    process.exit(0)
  }
}

testLoginHistory()
