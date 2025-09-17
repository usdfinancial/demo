#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function verifyUsers() {
  let client
  try {
    console.log('🔍 Connecting to database...')
    
    // Parse connection string for AWS RDS
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
    
    // Check total user count
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users')
    const userCount = parseInt(userCountResult.rows[0].count)
    console.log(`📊 Total users: ${userCount}`)
    
    if (userCount > 0) {
      // Get recent users
      const usersResult = await client.query(`
        SELECT 
          id, 
          email, 
          smart_wallet_address, 
          primary_auth_method, 
          created_at,
          last_auth_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      console.log('\n👥 Recent users:')
      usersResult.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   Wallet: ${user.smart_wallet_address}`)
        console.log(`   Auth Method: ${user.primary_auth_method}`)
        console.log(`   Created: ${user.created_at}`)
        console.log(`   Last Auth: ${user.last_auth_at || 'Never'}`)
        console.log('')
      })
      
      // Check auth methods
      const authMethodsResult = await client.query(`
        SELECT 
          am.auth_type,
          am.auth_identifier,
          u.email,
          am.created_at
        FROM user_auth_methods am
        JOIN users u ON u.id = am.user_id
        ORDER BY am.created_at DESC
        LIMIT 10
      `)
      
      if (authMethodsResult.rows.length > 0) {
        console.log('🔐 Auth Methods:')
        authMethodsResult.rows.forEach((method, index) => {
          console.log(`${index + 1}. ${method.email} - ${method.auth_type} (${method.auth_identifier})`)
          console.log(`   Created: ${method.created_at}`)
          console.log('')
        })
      } else {
        console.log('🔐 No auth methods found')
      }
    }
    
    console.log('✅ Database verification complete')
  } catch (error) {
    console.error('❌ Database verification failed:', error)
  } finally {
    if (client) {
      client.release()
    }
    process.exit(0)
  }
}

verifyUsers()