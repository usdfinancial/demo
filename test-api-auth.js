#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

async function testAuthAPI() {
  try {
    console.log('🧪 Testing actual authentication API...')
    
    // Clear existing test data
    const { Pool } = require('pg')
    const connStr = process.env.DATABASE_URL
    let poolConfig
    if (connStr.includes('rds.amazonaws.com')) {
      const url = new URL(connStr)
      poolConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        ssl: { rejectUnauthorized: false, require: true }
      }
    } else {
      poolConfig = { connectionString: connStr }
    }
    
    const pool = new Pool(poolConfig)
    const client = await pool.connect()
    
    const testEmail = 'api-test@example.com'
    
    // Clean up any existing test data
    await client.query('DELETE FROM user_auth_methods WHERE auth_identifier = $1', [testEmail])
    await client.query('DELETE FROM users WHERE email = $1', [testEmail])
    
    console.log('🔄 Creating user via API call...')
    
    // Test the actual API endpoint
    const response = await fetch('http://localhost:3000/api/auth/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': JSON.stringify({
          userAgent: 'API Test Agent',
          deviceFingerprint: 'api-test-fingerprint'
        }),
        'X-Forwarded-For': '203.0.113.1', // Test IP
        'User-Agent': 'Node.js Test Client'
      },
      body: JSON.stringify({
        action: 'create-user',
        userData: {
          email: testEmail,
          smartWalletAddress: '0x742D35Cc6635C0532925a3b8d0Df7D3f6E3D2F1A',
          authMethod: 'email',
          profile: {
            firstName: 'API',
            lastName: 'Test'
          }
        },
        loginMethod: 'email'
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ API call successful')
      console.log('   User ID:', result.data.id)
      console.log('   Email:', result.data.email)
      
      // Check if login history was recorded
      const historyResult = await client.query(`
        SELECT COUNT(*) as count FROM login_history 
        WHERE email = $1 AND created_at > NOW() - INTERVAL '1 minute'
      `, [testEmail])
      
      console.log('📊 Login history records for this email:', historyResult.rows[0].count)
      
      if (historyResult.rows[0].count > 0) {
        console.log('✅ Login history was recorded successfully!')
        
        const detailResult = await client.query(`
          SELECT login_method, login_status, ip_address, user_agent, created_at
          FROM login_history 
          WHERE email = $1 AND created_at > NOW() - INTERVAL '1 minute'
          ORDER BY created_at DESC
        `, [testEmail])
        
        detailResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. Method: ${row.login_method}, Status: ${row.login_status}`)
          console.log(`      IP: ${row.ip_address}, Agent: ${row.user_agent}`)
          console.log(`      Time: ${row.created_at}`)
        })
      } else {
        console.error('❌ No login history was recorded! This is the issue.')
      }
      
    } else {
      console.error('❌ API call failed:', result.error)
    }
    
    client.release()
    await pool.end()
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('')
      console.log('💡 The development server is not running.')
      console.log('   Start it with: npm run dev')
      console.log('   Then run this test again.')
    }
  }
}

testAuthAPI()
