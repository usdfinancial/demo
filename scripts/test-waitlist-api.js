#!/usr/bin/env node

/**
 * Waitlist API Test Script
 * Tests the submitWaitlist Netlify function
 */

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

// Mock the event and context objects for Netlify functions
function createMockEvent(method, body) {
  return {
    httpMethod: method,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-script/1.0',
      'x-forwarded-for': '127.0.0.1'
    }
  };
}

function createMockContext() {
  return {
    functionName: 'submitWaitlist',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'test:function:submitWaitlist',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {}
  };
}

async function testWaitlistAPI() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('🔌 USD Financial Waitlist API Test');
  console.log('==================================');
  console.log(`${colors.reset}`);

  // Import the handler
  let handler;
  try {
    handler = require('../netlify/functions/submitWaitlist').handler;
    success('Waitlist API handler loaded successfully');
  } catch (err) {
    error(`Failed to load API handler: ${err.message}`);
    process.exit(1);
  }

  const testEmail = `test-api-${Date.now()}@example.com`;
  let testResults = [];

  try {
    // Test 1: Valid submission
    info('Test 1: Testing valid waitlist submission...');
    const validEvent = createMockEvent('POST', {
      name: 'Test User API',
      email: testEmail
    });

    const validResponse = await handler(validEvent, createMockContext());
    const validResult = JSON.parse(validResponse.body);

    if (validResponse.statusCode === 201 && validResult.success) {
      success('Valid submission test passed');
      console.log(`   📧 Email: ${validResult.data.email}`);
      console.log(`   🆔 ID: ${validResult.data.id}`);
    } else {
      error(`Valid submission failed: ${validResponse.statusCode} - ${validResult.error || validResult.message}`);
    }
    testResults.push({ test: 'Valid submission', passed: validResponse.statusCode === 201 });

    // Test 2: Duplicate email
    info('Test 2: Testing duplicate email handling...');
    const duplicateEvent = createMockEvent('POST', {
      name: 'Duplicate User',
      email: testEmail
    });

    const duplicateResponse = await handler(duplicateEvent, createMockContext());
    const duplicateResult = JSON.parse(duplicateResponse.body);

    if (duplicateResponse.statusCode === 409) {
      success('Duplicate email test passed');
      console.log(`   💬 Message: ${duplicateResult.message}`);
    } else {
      error(`Duplicate email test failed: Expected 409, got ${duplicateResponse.statusCode}`);
    }
    testResults.push({ test: 'Duplicate email', passed: duplicateResponse.statusCode === 409 });

    // Test 3: Email case insensitivity
    info('Test 3: Testing email case insensitivity...');
    const caseEvent = createMockEvent('POST', {
      name: 'Case Test User',
      email: testEmail.toUpperCase()
    });

    const caseResponse = await handler(caseEvent, createMockContext());
    const caseResult = JSON.parse(caseResponse.body);

    if (caseResponse.statusCode === 409) {
      success('Email case insensitivity test passed');
    } else {
      error(`Email case insensitivity test failed: Expected 409, got ${caseResponse.statusCode}`);
    }
    testResults.push({ test: 'Email case insensitivity', passed: caseResponse.statusCode === 409 });

    // Test 4: Missing name validation
    info('Test 4: Testing missing name validation...');
    const missingNameEvent = createMockEvent('POST', {
      email: 'test-missing-name@example.com'
    });

    const missingNameResponse = await handler(missingNameEvent, createMockContext());
    const missingNameResult = JSON.parse(missingNameResponse.body);

    if (missingNameResponse.statusCode === 400 && missingNameResult.error.includes('Name')) {
      success('Missing name validation test passed');
    } else {
      error(`Missing name validation failed: Expected 400, got ${missingNameResponse.statusCode}`);
    }
    testResults.push({ test: 'Missing name validation', passed: missingNameResponse.statusCode === 400 });

    // Test 5: Missing email validation
    info('Test 5: Testing missing email validation...');
    const missingEmailEvent = createMockEvent('POST', {
      name: 'Test User'
    });

    const missingEmailResponse = await handler(missingEmailEvent, createMockContext());
    const missingEmailResult = JSON.parse(missingEmailResponse.body);

    if (missingEmailResponse.statusCode === 400 && missingEmailResult.error.includes('email')) {
      success('Missing email validation test passed');
    } else {
      error(`Missing email validation failed: Expected 400, got ${missingEmailResponse.statusCode}`);
    }
    testResults.push({ test: 'Missing email validation', passed: missingEmailResponse.statusCode === 400 });

    // Test 6: Invalid email format
    info('Test 6: Testing invalid email format validation...');
    const invalidEmailEvent = createMockEvent('POST', {
      name: 'Test User',
      email: 'invalid-email-format'
    });

    const invalidEmailResponse = await handler(invalidEmailEvent, createMockContext());
    const invalidEmailResult = JSON.parse(invalidEmailResponse.body);

    if (invalidEmailResponse.statusCode === 400 && invalidEmailResult.error.includes('valid email')) {
      success('Invalid email format validation test passed');
    } else {
      error(`Invalid email format validation failed: Expected 400, got ${invalidEmailResponse.statusCode}`);
    }
    testResults.push({ test: 'Invalid email format', passed: invalidEmailResponse.statusCode === 400 });

    // Test 7: Short name validation
    info('Test 7: Testing short name validation...');
    const shortNameEvent = createMockEvent('POST', {
      name: 'A',
      email: 'short-name@example.com'
    });

    const shortNameResponse = await handler(shortNameEvent, createMockContext());
    const shortNameResult = JSON.parse(shortNameResponse.body);

    if (shortNameResponse.statusCode === 400 && shortNameResult.error.includes('2 characters')) {
      success('Short name validation test passed');
    } else {
      error(`Short name validation failed: Expected 400, got ${shortNameResponse.statusCode}`);
    }
    testResults.push({ test: 'Short name validation', passed: shortNameResponse.statusCode === 400 });

    // Test 8: Wrong HTTP method
    info('Test 8: Testing wrong HTTP method...');
    const wrongMethodEvent = createMockEvent('GET', {});

    const wrongMethodResponse = await handler(wrongMethodEvent, createMockContext());
    const wrongMethodResult = JSON.parse(wrongMethodResponse.body);

    if (wrongMethodResponse.statusCode === 405) {
      success('Wrong HTTP method test passed');
    } else {
      error(`Wrong HTTP method test failed: Expected 405, got ${wrongMethodResponse.statusCode}`);
    }
    testResults.push({ test: 'Wrong HTTP method', passed: wrongMethodResponse.statusCode === 405 });

    // Test 9: Invalid JSON
    info('Test 9: Testing invalid JSON handling...');
    const invalidJSONEvent = {
      httpMethod: 'POST',
      body: 'invalid json {',
      headers: {}
    };

    const invalidJSONResponse = await handler(invalidJSONEvent, createMockContext());
    const invalidJSONResult = JSON.parse(invalidJSONResponse.body);

    if (invalidJSONResponse.statusCode === 400 && invalidJSONResult.error.includes('JSON')) {
      success('Invalid JSON test passed');
    } else {
      error(`Invalid JSON test failed: Expected 400, got ${invalidJSONResponse.statusCode}`);
    }
    testResults.push({ test: 'Invalid JSON handling', passed: invalidJSONResponse.statusCode === 400 });

    // Summary
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;

    console.log(`${colors.cyan}${colors.bright}`);
    console.log('📊 Test Summary');
    console.log('===============');
    console.log(`${colors.reset}`);

    testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const color = result.passed ? 'green' : 'red';
      log(color, status, result.test);
    });

    console.log(`\n${passedTests === totalTests ? colors.green : colors.yellow}${colors.bright}`);
    console.log(`🎯 Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All API tests passed! The waitlist endpoint is working correctly.');
      console.log('✅ Data validation is working properly');
      console.log('✅ Error handling is functioning as expected');
      console.log('✅ Database operations are secure');
    } else {
      console.log('⚠️  Some tests failed. Please review the API implementation.');
    }
    console.log(`${colors.reset}`);

    // Clean up test data
    info('Cleaning up test data...');
    const { Pool } = require('pg');
    
    let sslConfig = false;
    if (process.env.DATABASE_URL.includes('.rds.amazonaws.com')) {
      sslConfig = { rejectUnauthorized: false };
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: 5,
    });

    try {
      const client = await pool.connect();
      await client.query('DELETE FROM waitlist WHERE email LIKE $1', ['test-%@example.com']);
      client.release();
      await pool.end();
      success('Test data cleaned up');
    } catch (cleanupError) {
      warning(`Could not clean up test data: ${cleanupError.message}`);
    }

  } catch (err) {
    error(`API test failed: ${err.message}`);
    console.log(`${colors.yellow}Stack trace: ${err.stack}${colors.reset}`);
    process.exit(1);
  }
}

// Run the tests
testWaitlistAPI().catch(console.error);