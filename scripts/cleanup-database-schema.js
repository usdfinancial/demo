#!/usr/bin/env node

/**
 * Clean up email consolidation database schema
 * This script removes consolidation tables and simplifies the schema
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { Pool } = require('pg');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function error(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ️ ${message}${colors.reset}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
}

async function cleanupSchema() {
  console.log(`${colors.cyan}🗄️ USD Financial - Database Schema Cleanup${colors.reset}`);
  console.log('===========================================');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('.rds.amazonaws.com') ? { 
      rejectUnauthorized: false
    } : false,
    max: 2,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    
    info('Starting email consolidation cleanup...');
    
    // Check what tables exist before cleanup
    info('Checking existing tables...');
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('user_auth_methods', 'user_wallets', 'user_sessions')
      ORDER BY tablename
    `;
    
    const existingTables = await client.query(tablesQuery);
    
    if (existingTables.rows.length > 0) {
      warning(`Found ${existingTables.rows.length} consolidation tables to remove:`);
      existingTables.rows.forEach(row => {
        console.log(`  📋 ${row.tablename}`);
      });
    } else {
      success('No consolidation tables found - schema is already clean');
    }

    // Begin transaction
    await client.query('BEGIN');
    
    try {
      // Drop email consolidation tables
      info('Removing email consolidation tables...');
      
      const tablesToDrop = ['user_auth_methods', 'user_wallets', 'user_sessions'];
      
      for (const table of tablesToDrop) {
        try {
          await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
          success(`Dropped table: ${table}`);
        } catch (err) {
          warning(`Could not drop table ${table}: ${err.message}`);
        }
      }
      
      // Add missing columns to users table
      info('Updating users table schema...');
      
      try {
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS eoa_address VARCHAR(42)');
        success('Added eoa_address column to users table');
      } catch (err) {
        warning(`Could not add eoa_address column: ${err.message}`);
      }
      
      // Add indexes for performance
      info('Adding performance indexes...');
      
      const indexes = [
        { name: 'idx_users_smart_wallet_address', column: 'smart_wallet_address' },
        { name: 'idx_users_email', column: 'email' },
        { name: 'idx_users_eoa_address', column: 'eoa_address' }
      ];
      
      for (const index of indexes) {
        try {
          await client.query(`CREATE INDEX IF NOT EXISTS ${index.name} ON users(${index.column})`);
          success(`Created index: ${index.name}`);
        } catch (err) {
          warning(`Could not create index ${index.name}: ${err.message}`);
        }
      }
      
      // Clean up existing data
      info('Cleaning up existing user data...');
      
      try {
        const updateResult = await client.query(`
          UPDATE users SET 
            smart_wallet_address = LOWER(smart_wallet_address),
            eoa_address = LOWER(eoa_address)
          WHERE smart_wallet_address IS NOT NULL OR eoa_address IS NOT NULL
        `);
        success(`Cleaned up ${updateResult.rowCount || 0} user records`);
      } catch (err) {
        warning(`Could not clean up user data: ${err.message}`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Final verification
      info('Verifying cleanup...');
      
      const finalCheck = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('user_auth_methods', 'user_wallets', 'user_sessions')
      `);
      
      if (finalCheck.rows.length === 0) {
        success('✅ Email consolidation cleanup completed successfully!');
      } else {
        warning(`Still found ${finalCheck.rows.length} consolidation tables`);
      }
      
      // Check user table structure
      const userTableQuery = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name IN ('smart_wallet_address', 'eoa_address', 'email')
        ORDER BY column_name
      `);
      
      success('Users table structure:');
      userTableQuery.rows.forEach(row => {
        console.log(`  📋 ${row.column_name}: ${row.data_type}`);
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
    
    client.release();
    
  } catch (err) {
    error(`Schema cleanup failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('');
  success('🎉 Database schema cleanup complete!');
  console.log('');
  console.log(`${colors.green}Summary of changes:${colors.reset}`);
  console.log('✅ Removed email consolidation tables');
  console.log('✅ Simplified users table schema');
  console.log('✅ Added performance indexes');
  console.log('✅ Cleaned up existing data');
  console.log('');
  console.log(`${colors.blue}Result:${colors.reset}`);
  console.log('• Each authentication method now creates separate users');
  console.log('• No email consolidation logic');
  console.log('• Standard Alchemy Account Kit behavior restored');
}

// Run the cleanup
cleanupSchema().catch(console.error);