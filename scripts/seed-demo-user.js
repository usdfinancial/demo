#!/usr/bin/env node

/**
 * Seed script to create a demo user for testing
 * Run with: node scripts/seed-demo-user.js
 */

const bcrypt = require('bcryptjs')
const { Client } = require('pg')

async function seedDemoUser() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Check if demo user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@usdfinancial.com']
    )

    if (existingUser.rows.length > 0) {
      console.log('ℹ️  Demo user already exists')
      return
    }

    // Hash the demo password
    const hashedPassword = await bcrypt.hash('demo123', 12)

    // Create demo user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, is_active, email_verified, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, true, true, NOW(), NOW()) 
       RETURNING id, email, first_name, last_name`,
      ['demo@usdfinancial.com', hashedPassword, 'Demo', 'User']
    )

    const demoUser = result.rows[0]

    // Create user profile
    await client.query(
      `INSERT INTO user_profiles (user_id, created_at, updated_at)
       VALUES ($1, NOW(), NOW())`,
      [demoUser.id]
    )

    console.log('✅ Demo user created successfully:', {
      id: demoUser.id,
      email: demoUser.email,
      name: `${demoUser.first_name} ${demoUser.last_name}`
    })

    console.log('\n🎯 Demo credentials:')
    console.log('   Email: demo@usdfinancial.com')
    console.log('   Password: demo123')

  } catch (error) {
    console.error('❌ Error seeding demo user:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run the seed function
seedDemoUser()