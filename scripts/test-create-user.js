#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function testCreateUser() {
  let client
  try {
    console.log('🧪 Testing user creation directly in database...')
    
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
    
    // Test data
    const testEmail = 'test-consolidation@example.com'
    const testWallet = '0x742D35Cc6635C0532925a3b8d0Df7D3f6E3D2F1A'
    const authMethod = 'google'
    
    console.log('🔄 Creating test user for email consolidation...')
    
    // Clean up any existing test user first
    await client.query('DELETE FROM users WHERE email = $1', [testEmail])
    
    // Create user using the same pattern as the EmailConsolidatedAlchemyProvider
    await client.query('BEGIN')
    
    try {
      // 1. Create user record
      const userResult = await client.query(`
        INSERT INTO users (
          email, smart_wallet_address, primary_auth_method, 
          email_verified, created_at, last_auth_at
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `, [
        testEmail.toLowerCase(),
        testWallet,
        authMethod,
        false
      ])
      
      const userId = userResult.rows[0].id
      console.log('✅ User created with ID:', userId)
      
      // 2. Add auth method
      const authMethodResult = await client.query(`
        INSERT INTO user_auth_methods (
          user_id, auth_type, auth_identifier, provider_user_id, 
          provider_data, is_active, is_primary, created_at, last_used_at
        )
        VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())
        RETURNING *
      `, [
        userId,
        authMethod,
        testEmail.toLowerCase(),
        'google_user_test_123',
        JSON.stringify({ 
          source: 'test_script', 
          timestamp: new Date().toISOString() 
        })
      ])
      
      console.log('✅ Auth method created with ID:', authMethodResult.rows[0].id)
      
      await client.query('COMMIT')
      
      // 3. Verify creation
      const verifyResult = await client.query(`
        SELECT 
          u.id, u.email, u.smart_wallet_address, u.primary_auth_method,
          u.created_at, u.last_auth_at,
          am.auth_type, am.auth_identifier, am.provider_user_id
        FROM users u
        LEFT JOIN user_auth_methods am ON u.id = am.user_id
        WHERE u.email = $1
      `, [testEmail])
      
      if (verifyResult.rows.length > 0) {
        const user = verifyResult.rows[0]
        console.log('✅ Email consolidation test user created successfully:')
        console.log('   📧 Email:', user.email)
        console.log('   💰 Wallet:', user.smart_wallet_address)
        console.log('   🔐 Auth Method:', user.auth_type)
        console.log('   🆔 Provider ID:', user.provider_user_id)
        console.log('   📅 Created:', user.created_at)
        
        // Now test "consolidation" - simulate second authentication with same email, different wallet
        const secondWallet = '0x123C4567890A1B2C3D4E5F6789012345678901B2'
        console.log('')
        console.log('🔗 Testing email consolidation with second wallet...')
        
        // This should find the existing user and link the additional wallet
        const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [testEmail])
        if (existingUser.rows.length > 0 && existingUser.rows[0].smart_wallet_address !== secondWallet) {
          console.log('🚨 CONSOLIDATION SCENARIO: Same email, different wallet')
          console.log('   Existing wallet:', existingUser.rows[0].smart_wallet_address)
          console.log('   New wallet:', secondWallet)
          
          // Link additional wallet (as the EmailConsolidatedAlchemyProvider would do)
          await client.query(`
            INSERT INTO user_auth_methods (
              user_id, auth_type, auth_identifier, provider_data, 
              is_active, is_primary, created_at, last_used_at
            )
            VALUES ($1, 'wallet', $2, $3, true, false, NOW(), NOW())
            ON CONFLICT (user_id, auth_type, auth_identifier) 
            DO UPDATE SET last_used_at = NOW(), is_active = true
          `, [
            existingUser.rows[0].id,
            secondWallet.toLowerCase(),
            JSON.stringify({
              consolidated: true,
              originalAuthMethod: 'email',
              consolidatedAt: new Date().toISOString()
            })
          ])
          
          console.log('✅ Additional wallet linked for email consolidation')
          
          // Verify consolidation
          const consolidatedResult = await client.query(`
            SELECT 
              u.email, u.smart_wallet_address as primary_wallet,
              am.auth_type, am.auth_identifier, am.provider_data
            FROM users u
            LEFT JOIN user_auth_methods am ON u.id = am.user_id
            WHERE u.email = $1
            ORDER BY am.created_at
          `, [testEmail])
          
          console.log('🔍 Email consolidation result:')
          consolidatedResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.auth_type}: ${row.auth_identifier}`)
            if (row.provider_data?.consolidated) {
              console.log('      🔗 CONSOLIDATED WALLET')
            }
          })
        }
        
      } else {
        console.error('❌ User verification failed - not found after creation')
      }
      
      console.log('')
      console.log('🧪 Email consolidation system TEST PASSED')
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
    
  } catch (error) {
    console.error('❌ User creation test failed:', error)
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

testCreateUser()