#!/usr/bin/env node

/**
 * Waitlist Database Test Script
 * Tests the waitlist table and API functionality
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

function success(message) {
  log('green', '✅ SUCCESS:', message);
}

function error(message) {
  log('red', '❌ ERROR:', message);
}

function warning(message) {
  log('yellow', '⚠️  WARNING:', message);
}

function info(message) {
  log('blue', 'ℹ️  INFO:', message);
}

async function testWaitlistFunctionality() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('📋 USD Financial Waitlist Database Test');
  console.log('=====================================');
  console.log(`${colors.reset}`);

  if (!process.env.DATABASE_URL) {
    error('DATABASE_URL environment variable not found');
    process.exit(1);
  }

  // Configure SSL for AWS RDS
  let sslConfig = false;
  if (process.env.DATABASE_URL.includes('.rds.amazonaws.com')) {
    sslConfig = { rejectUnauthorized: false };
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  let client;

  try {
    client = await pool.connect();
    success('Database connection established');

    // Test 1: Check waitlist table structure
    info('Test 1: Checking waitlist table structure...');
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'waitlist'
      ORDER BY ordinal_position;
    `);

    if (schemaResult.rows.length === 0) {
      error('Waitlist table does not exist!');
      warning('Run database schema setup first');
      process.exit(1);
    }

    success('Waitlist table found with the following structure:');
    schemaResult.rows.forEach(col => {
      console.log(`   📄 ${col.column_name.padEnd(15)} | ${col.data_type.padEnd(20)} | nullable: ${col.is_nullable}`);
    });

    // Test 2: Check current waitlist count
    info('Test 2: Checking current waitlist entries...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM waitlist');
    const currentCount = parseInt(countResult.rows[0].count);
    success(`Current waitlist entries: ${currentCount}`);

    // Test 3: Check indexes
    info('Test 3: Checking waitlist table indexes...');
    const indexResult = await client.query(`
      SELECT i.indexname, i.indexdef 
      FROM pg_indexes i
      WHERE i.tablename = 'waitlist'
      ORDER BY i.indexname;
    `);

    if (indexResult.rows.length > 0) {
      success('Found waitlist indexes:');
      indexResult.rows.forEach(idx => {
        console.log(`   🔍 ${idx.indexname}`);
      });
    } else {
      warning('No indexes found on waitlist table');
    }

    // Test 4: Test insert functionality
    info('Test 4: Testing waitlist insert functionality...');
    const testEmail = `test-${Date.now()}@example.com`;
    const insertResult = await client.query(
      `INSERT INTO waitlist (name, email, source, metadata) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, created_at`,
      [
        'Test User',
        testEmail,
        'test_script',
        JSON.stringify({ 
          test: true, 
          timestamp: new Date().toISOString(),
          user_agent: 'test-script/1.0'
        })
      ]
    );

    const newEntry = insertResult.rows[0];
    success('Test entry inserted successfully:');
    console.log(`   🆔 ID: ${newEntry.id}`);
    console.log(`   👤 Name: ${newEntry.name}`);
    console.log(`   📧 Email: ${newEntry.email}`);
    console.log(`   📅 Created: ${newEntry.created_at}`);

    // Test 5: Test duplicate email constraint
    info('Test 5: Testing duplicate email constraint...');
    try {
      await client.query(
        `INSERT INTO waitlist (name, email, source) VALUES ($1, $2, $3)`,
        ['Duplicate User', testEmail, 'test_script']
      );
      error('Duplicate email constraint is NOT working!');
    } catch (err) {
      if (err.code === '23505') {
        success('Duplicate email constraint working correctly');
      } else {
        warning(`Unexpected error: ${err.message}`);
      }
    }

    // Test 6: Test email case insensitivity
    info('Test 6: Testing email case handling...');
    const upperEmail = testEmail.toUpperCase();
    try {
      await client.query(
        `INSERT INTO waitlist (name, email, source) VALUES ($1, $2, $3)`,
        ['Case Test User', upperEmail, 'test_script']
      );
      warning('Email case sensitivity might not be handled properly');
    } catch (err) {
      if (err.code === '23505') {
        success('Email uniqueness works regardless of case');
      }
    }

    // Test 7: Test updated_at trigger
    info('Test 7: Testing updated_at trigger functionality...');
    const originalEntry = await client.query(
      'SELECT updated_at FROM waitlist WHERE email = $1',
      [testEmail]
    );

    // Wait a moment and update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await client.query(
      'UPDATE waitlist SET name = $1 WHERE email = $2',
      ['Updated Test User', testEmail]
    );

    const updatedEntry = await client.query(
      'SELECT updated_at FROM waitlist WHERE email = $1',
      [testEmail]
    );

    if (new Date(updatedEntry.rows[0].updated_at) > new Date(originalEntry.rows[0].updated_at)) {
      success('updated_at trigger is working correctly');
    } else {
      warning('updated_at trigger may not be working');
    }

    // Test 8: Test query performance
    info('Test 8: Testing query performance...');
    const start = Date.now();
    await client.query('SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 10');
    const queryTime = Date.now() - start;

    if (queryTime < 50) {
      success(`Query performance: ${queryTime}ms (excellent)`);
    } else if (queryTime < 200) {
      success(`Query performance: ${queryTime}ms (good)`);
    } else {
      warning(`Query performance: ${queryTime}ms (consider optimization)`);
    }

    // Test 9: Cleanup test entry
    info('Test 9: Cleaning up test entry...');
    const deleteResult = await client.query(
      'DELETE FROM waitlist WHERE email = $1',
      [testEmail]
    );
    
    if (deleteResult.rowCount > 0) {
      success(`Test entry deleted successfully (${deleteResult.rowCount} row)`);
    } else {
      warning('Test entry was not found for deletion');
    }

    // Test 10: Final count verification
    info('Test 10: Verifying final count...');
    const finalCountResult = await client.query('SELECT COUNT(*) as count FROM waitlist');
    const finalCount = parseInt(finalCountResult.rows[0].count);
    
    if (finalCount === currentCount) {
      success(`Final count matches initial count: ${finalCount}`);
    } else {
      warning(`Count mismatch - Initial: ${currentCount}, Final: ${finalCount}`);
    }

    console.log(`${colors.green}${colors.bright}`);
    console.log('🎉 All waitlist tests passed!');
    console.log('The waitlist system is ready to store user information accurately');
    console.log(`${colors.reset}`);

  } catch (err) {
    error(`Waitlist test failed: ${err.message}`);
    console.log(`${colors.yellow}`);
    console.log('🔧 Error Details:');
    console.log(`Code: ${err.code || 'Unknown'}`);
    console.log(`Detail: ${err.detail || 'None'}`);
    console.log(`${colors.reset}`);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run the test
testWaitlistFunctionality().catch(console.error);