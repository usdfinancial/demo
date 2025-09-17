#!/usr/bin/env node

/**
 * Deploy Waitlist Table Script
 * Creates the waitlist table and related structures
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

function info(message) {
  log('blue', 'ℹ️  INFO:', message);
}

async function deployWaitlistTable() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('🚀 USD Financial Waitlist Table Deployment');
  console.log('==========================================');
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

    // Check if waitlist table already exists
    info('Checking if waitlist table exists...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'waitlist'
      );
    `);

    if (tableExists.rows[0].exists) {
      success('Waitlist table already exists - skipping creation');
      
      // Show current structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'waitlist' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Current waitlist table structure:');
      structure.rows.forEach(col => {
        console.log(`   ${col.column_name.padEnd(15)} | ${col.data_type.padEnd(20)} | nullable: ${col.is_nullable}`);
      });

    } else {
      info('Creating waitlist table...');

      // Create the table
      await client.query(`
        CREATE TABLE waitlist (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(320) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          source VARCHAR(100) DEFAULT 'landing_page',
          metadata JSONB DEFAULT '{}'::jsonb
        );
      `);
      success('Waitlist table created');

      // Create indexes
      info('Creating indexes...');
      await client.query(`
        CREATE INDEX idx_waitlist_email ON waitlist(email);
        CREATE INDEX idx_waitlist_created_at ON waitlist(created_at);
        CREATE INDEX idx_waitlist_source ON waitlist(source);
      `);
      success('Indexes created');

      // Create updated_at trigger function
      info('Creating trigger function...');
      await client.query(`
        CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      // Create trigger
      await client.query(`
        CREATE TRIGGER waitlist_updated_at 
            BEFORE UPDATE ON waitlist
            FOR EACH ROW 
            EXECUTE PROCEDURE update_waitlist_updated_at();
      `);
      success('Trigger created');

      // Add comments
      await client.query(`
        COMMENT ON TABLE waitlist IS 'Stores early access signup information for USD Financial platform';
        COMMENT ON COLUMN waitlist.id IS 'Auto-incrementing primary key';
        COMMENT ON COLUMN waitlist.name IS 'Full name of the user signing up';
        COMMENT ON COLUMN waitlist.email IS 'Unique email address - case insensitive';
        COMMENT ON COLUMN waitlist.source IS 'Source of signup (landing_page, referral, etc.)';
        COMMENT ON COLUMN waitlist.metadata IS 'Additional data like user agent, IP, etc.';
      `);
      success('Table documentation added');
    }

    // Verify everything is working
    info('Running verification tests...');
    
    // Test basic query
    await client.query('SELECT COUNT(*) FROM waitlist');
    success('Table query test passed');

    // Test constraints
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'waitlist' 
      AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    `);
    
    success(`Found ${constraints.rows.length} constraints:`);
    constraints.rows.forEach(c => {
      console.log(`   🔒 ${c.constraint_name} (${c.constraint_type})`);
    });

    // Test indexes
    const indexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'waitlist'
    `);
    
    success(`Found ${indexes.rows.length} indexes:`);
    indexes.rows.forEach(idx => {
      console.log(`   🔍 ${idx.indexname}`);
    });

    console.log(`${colors.green}${colors.bright}`);
    console.log('🎉 Waitlist table deployment completed successfully!');
    console.log('The waitlist system is now ready to accept user signups');
    console.log(`${colors.reset}`);

  } catch (err) {
    error(`Deployment failed: ${err.message}`);
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

// Run the deployment
deployWaitlistTable().catch(console.error);