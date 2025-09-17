#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests the database connection and basic functionality
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

async function testDatabaseConnection() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('🗄️  USD Financial Database Connection Test');
  console.log('==========================================');
  console.log(`${colors.reset}`);

  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    error('DATABASE_URL environment variable not found');
    error('Please check your .env.local file');
    process.exit(1);
  }

  // Mask the connection string for security
  const maskedUrl = process.env.DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  info(`Connection string: ${maskedUrl}`);

  // Configure SSL for AWS RDS
  let sslConfig = false;
  if (process.env.DATABASE_URL.includes('.rds.amazonaws.com')) {
    sslConfig = {
      rejectUnauthorized: false, // For development - in production use proper CA
      // In production, download the RDS CA certificate:
      // curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem > rds-ca-2019-root.pem
      // ca: fs.readFileSync('./rds-ca-2019-root.pem').toString(),
    };
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 5, // Keep it small for testing
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  try {
    // Test 1: Basic Connection
    info('Testing basic database connection...');
    const client = await pool.connect();
    success('Database connection established');
    
    // Test 2: Version Check
    info('Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    success(`PostgreSQL version: ${version.split(' ')[1]}`);
    
    // Test 3: Check if schema exists
    info('Checking database schema...');
    const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `);
    const tableCount = parseInt(tablesResult.rows[0].table_count);
    
    if (tableCount > 0) {
      success(`Found ${tableCount} tables in database`);
      
      // List some key tables
      const keyTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name IN ('users', 'user_wallets', 'stablecoin_balances', 'transactions', 'defi_protocols')
        ORDER BY table_name
      `);
      
      if (keyTables.rows.length > 0) {
        success('Key tables found:');
        keyTables.rows.forEach(row => {
          console.log(`  📋 ${row.table_name}`);
        });
      }
    } else {
      warning('No tables found - database schema may not be deployed');
      warning('Run: ./scripts/setup-database.sh to deploy the schema');
    }
    
    // Test 4: Check Extensions
    info('Checking database extensions...');
    const extensionsResult = await client.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    
    if (extensionsResult.rows.length > 0) {
      success('Required extensions found:');
      extensionsResult.rows.forEach(row => {
        console.log(`  🧩 ${row.extname}`);
      });
    } else {
      warning('Required extensions not found (uuid-ossp, pgcrypto)');
    }
    
    // Test 5: Performance Test
    info('Running performance test...');
    const start = Date.now();
    await client.query('SELECT 1');
    const latency = Date.now() - start;
    
    if (latency < 50) {
      success(`Query latency: ${latency}ms (excellent)`);
    } else if (latency < 200) {
      success(`Query latency: ${latency}ms (good)`);
    } else {
      warning(`Query latency: ${latency}ms (high - check network connection)`);
    }
    
    // Test 6: Connection Pool Stats
    info('Connection pool statistics:');
    console.log(`  📊 Total connections: ${pool.totalCount}`);
    console.log(`  💤 Idle connections: ${pool.idleCount}`);
    console.log(`  ⏳ Waiting connections: ${pool.waitingCount}`);
    
    client.release();
    
    console.log(`${colors.green}${colors.bright}`);
    console.log('🎉 All database tests passed!');
    console.log('Your database is ready for USD Financial');
    console.log(`${colors.reset}`);
    
    // Test 7: Sample Data Check (if tables exist)
    if (tableCount > 0) {
      info('Checking for sample data...');
      try {
        const userCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(userCountResult.rows[0].count);
        
        if (userCount > 0) {
          success(`Found ${userCount} users in database`);
        } else {
          info('No users found - database is clean');
        }
      } catch (err) {
        warning('Could not check user data (table may not exist)');
      }
    }
    
  } catch (err) {
    error(`Database test failed: ${err.message}`);
    
    // Provide helpful debugging information
    console.log(`${colors.yellow}`);
    console.log('🔧 Debugging Information:');
    console.log('========================');
    console.log(`Error Code: ${err.code || 'Unknown'}`);
    console.log(`Error Details: ${err.detail || 'None'}`);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - check if:');
      console.log('   - RDS instance is running');
      console.log('   - Security group allows your IP');
      console.log('   - Connection string is correct');
    } else if (err.code === 'ENOTFOUND') {
      console.log('💡 Host not found - check if:');
      console.log('   - RDS endpoint URL is correct');
      console.log('   - You have internet connectivity');
    } else if (err.code === '28P01') {
      console.log('💡 Authentication failed - check if:');
      console.log('   - Username and password are correct');
      console.log('   - User has proper permissions');
    } else if (err.code === '3D000') {
      console.log('💡 Database does not exist - check if:');
      console.log('   - Database name is correct');
      console.log('   - Database was created during RDS setup');
    }
    
    console.log(`${colors.reset}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection().catch(console.error);