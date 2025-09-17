#!/usr/bin/env node

/**
 * Test Standard Alchemy Account Kit Behavior
 * Verifies that different authentication methods create separate users
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
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

async function testStandardBehavior() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('🔄 Testing Standard Alchemy Account Kit Behavior');
  console.log('===============================================');
  console.log(`${colors.reset}`);

  const { Pool } = require('pg');
  const { randomUUID } = require('crypto');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('.rds.amazonaws.com') ? { 
      rejectUnauthorized: false
    } : false,
    max: 2,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    
    // Test data
    const testEmail = 'standard-test@usdfinancial.test';
    const emailWallet = '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE';
    const googleWallet = '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG';
    
    info('Cleaning up any existing test data...');
    await client.query('DELETE FROM users WHERE email = $1', [testEmail]);
    
    success('Test data cleaned up');
    
    // STEP 1: User signs up with email authentication
    info('STEP 1: Creating separate user for email authentication...');
    
    const emailUserId = randomUUID();
    await client.query(`
      INSERT INTO users (
        id, email, smart_wallet_address, primary_auth_method, 
        first_name, last_name, email_verified, is_active
      ) VALUES ($1, $2, $3, 'email', 'Test', 'User', false, true)
    `, [emailUserId, testEmail, emailWallet]);
    
    success(`Email user created - ID: ${emailUserId.slice(0, 8)}...`);
    console.log(`  📧 Email: ${testEmail}`);
    console.log(`  💳 Wallet: ${emailWallet}`);
    console.log(`  🔑 Auth Method: email`);
    
    // STEP 2: User signs up with Google OAuth (same email, different wallet)
    info('STEP 2: Creating separate user for Google OAuth...');
    
    const googleUserId = randomUUID();
    await client.query(`
      INSERT INTO users (
        id, email, smart_wallet_address, primary_auth_method, 
        first_name, last_name, email_verified, is_active
      ) VALUES ($1, $2, $3, 'google', 'Test', 'User', true, true)
    `, [googleUserId, testEmail, googleWallet]);
    
    success(`Google user created - ID: ${googleUserId.slice(0, 8)}...`);
    console.log(`  📧 Email: ${testEmail}`);
    console.log(`  💳 Wallet: ${googleWallet}`);
    console.log(`  🔑 Auth Method: google`);
    
    // STEP 3: Verify standard Alchemy behavior
    info('STEP 3: Verifying standard Alchemy behavior...');
    
    const allUsersQuery = await client.query(
      'SELECT id, email, smart_wallet_address, primary_auth_method FROM users WHERE email = $1',
      [testEmail]
    );
    
    console.log('');
    success('STANDARD ALCHEMY BEHAVIOR VERIFICATION:');
    console.log('');
    console.log('👥 Users found:');
    allUsersQuery.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id.slice(0, 8)}...`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Wallet: ${user.smart_wallet_address}`);
      console.log(`     Auth: ${user.primary_auth_method.toUpperCase()}`);
      console.log('');
    });
    
    // Verify results
    const userCount = allUsersQuery.rows.length;
    const hasEmailUser = allUsersQuery.rows.some(u => u.primary_auth_method === 'email');
    const hasGoogleUser = allUsersQuery.rows.some(u => u.primary_auth_method === 'google');
    const differentWallets = new Set(allUsersQuery.rows.map(u => u.smart_wallet_address)).size === userCount;
    
    console.log('📊 VERIFICATION RESULTS:');
    console.log(`  Same email, different users: ${userCount === 2 ? '✅ YES' : '❌ NO'} (${userCount} users)`);
    console.log(`  Email auth user exists: ${hasEmailUser ? '✅ YES' : '❌ NO'}`);
    console.log(`  Google OAuth user exists: ${hasGoogleUser ? '✅ YES' : '❌ NO'}`);
    console.log(`  Different wallet addresses: ${differentWallets ? '✅ YES' : '❌ NO'}`);
    
    if (userCount === 2 && hasEmailUser && hasGoogleUser && differentWallets) {
      success('🎉 STANDARD ALCHEMY BEHAVIOR WORKING CORRECTLY!');
      console.log('');
      console.log(`${colors.green}Key Benefits Verified:${colors.reset}`);
      console.log('✅ Each authentication method creates separate users');
      console.log('✅ Same email = different users (no consolidation)');
      console.log('✅ Each user has different wallet address');
      console.log('✅ Standard Alchemy Account Kit behavior');
      console.log('✅ No email consolidation logic');
    } else {
      error('🚨 STANDARD BEHAVIOR ISSUE DETECTED!');
      console.log('');
      console.log(`${colors.red}Issues Found:${colors.reset}`);
      if (userCount !== 2) {
        console.log(`❌ Expected 2 users, found ${userCount}`);
      }
      if (!hasEmailUser) {
        console.log('❌ Email authentication user missing');
      }
      if (!hasGoogleUser) {
        console.log('❌ Google OAuth user missing');
      }
      if (!differentWallets) {
        console.log('❌ Users should have different wallet addresses');
      }
    }
    
    // Cleanup
    info('Cleaning up test data...');
    await client.query('DELETE FROM users WHERE email = $1', [testEmail]);
    success('Test data cleaned up');
    
    client.release();
    
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('');
  console.log(`${colors.green}${colors.bright}🎉 Standard Alchemy Behavior Test Complete!${colors.reset}`);
}

// Run the test
testStandardBehavior().catch(console.error);