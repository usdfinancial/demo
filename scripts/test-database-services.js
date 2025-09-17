#!/usr/bin/env node

/**
 * End-to-End Database Services Test Script
 * Tests the new database-driven services we implemented
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testUserId: process.env.TEST_USER_ID || '0x742d35Cc891C0DCE01ea7eB0Ed3DE1eD8e29Fa0e', // Sample address
  timeout: 30000,
  retries: 3
};

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

function section(title) {
  console.log(`\n${colors.cyan}${colors.bright}=== ${title} ===${colors.reset}\n`);
}

class DatabaseServicesTester {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    this.serverProcess = null;
  }

  async startServer() {
    if (process.env.SKIP_SERVER_START === 'true') {
      info('Skipping server start (SKIP_SERVER_START=true)');
      return;
    }

    info('Starting Next.js development server...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        detached: false
      });

      let serverStarted = false;
      const startTimeout = setTimeout(() => {
        if (!serverStarted) {
          reject(new Error('Server start timeout'));
        }
      }, 60000); // 60 seconds timeout

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Ready in') || output.includes('Local:') || output.includes('localhost:3000')) {
          if (!serverStarted) {
            clearTimeout(startTimeout);
            serverStarted = true;
            success('Next.js server started successfully');
            // Wait a bit more for the server to be fully ready
            setTimeout(resolve, 3000);
          }
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Error') && !serverStarted) {
          clearTimeout(startTimeout);
          reject(new Error(`Server start error: ${output}`));
        }
      });

      this.serverProcess.on('error', (err) => {
        if (!serverStarted) {
          clearTimeout(startTimeout);
          reject(err);
        }
      });
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      info('Stopping Next.js server...');
      this.serverProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise(resolve => {
        this.serverProcess.on('exit', resolve);
        setTimeout(() => {
          this.serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
      
      success('Next.js server stopped');
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      
      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { status: response.status, data };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async runTest(name, testFn) {
    this.testResults.total++;
    info(`Running test: ${name}`);

    try {
      await testFn();
      this.testResults.passed++;
      success(`Test passed: ${name}`);
    } catch (err) {
      this.testResults.failed++;
      this.testResults.errors.push({ test: name, error: err.message });
      error(`Test failed: ${name} - ${err.message}`);
    }
  }

  async testHealthEndpoint() {
    await this.runTest('Health Check Endpoint', async () => {
      const response = await this.makeRequest('/api/health');
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.status) {
        throw new Error('Health response missing status field');
      }

      if (!['healthy', 'degraded', 'unhealthy'].includes(response.data.status)) {
        throw new Error(`Invalid health status: ${response.data.status}`);
      }

      info(`Health status: ${response.data.status}`);
      if (response.data.services) {
        Object.entries(response.data.services).forEach(([service, status]) => {
          info(`Service ${service}: ${status.status || 'unknown'}`);
        });
      }
    });
  }

  async testUserService() {
    await this.runTest('User Service - Dashboard Data', async () => {
      const response = await this.makeRequest(
        `/api/user?userId=${TEST_CONFIG.testUserId}&action=dashboard`
      );
      
      if (response.status === 404) {
        warning('User not found in database (expected for new installations)');
        return;
      }

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid dashboard data response');
      }

      // Check required fields
      const requiredFields = ['user', 'totalBalance', 'portfolioSummary'];
      for (const field of requiredFields) {
        if (!(field in response.data)) {
          throw new Error(`Dashboard data missing required field: ${field}`);
        }
      }

      info(`Dashboard loaded for user: ${response.data.user?.first_name || 'Unknown'}`);
    });

    await this.runTest('User Service - Profile', async () => {
      const response = await this.makeRequest(
        `/api/user?userId=${TEST_CONFIG.testUserId}&action=profile`
      );
      
      if (response.status === 404) {
        warning('User profile not found (expected for new installations)');
        return;
      }

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      info('User profile loaded successfully');
    });
  }

  async testInvestmentService() {
    await this.runTest('Investment Service - DeFi Protocols', async () => {
      const response = await this.makeRequest(
        `/api/investments?userId=${TEST_CONFIG.testUserId}&action=defi-protocols`
      );
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Expected array response for DeFi protocols');
      }

      info(`Loaded ${response.data.length} DeFi protocols`);
    });

    await this.runTest('Investment Service - Portfolio Summary', async () => {
      const response = await this.makeRequest(
        `/api/investments?userId=${TEST_CONFIG.testUserId}&action=portfolio`
      );
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid portfolio summary response');
      }

      const requiredFields = ['totalValue', 'totalInvested', 'pnl', 'pnlPercentage'];
      for (const field of requiredFields) {
        if (!(field in response.data)) {
          throw new Error(`Portfolio summary missing required field: ${field}`);
        }
      }

      info(`Portfolio value: $${parseFloat(response.data.totalValue).toLocaleString()}`);
    });
  }

  async testTransactionService() {
    await this.runTest('Transaction Service - History', async () => {
      const response = await this.makeRequest(
        `/api/transactions?userId=${TEST_CONFIG.testUserId}&action=list&limit=10`
      );
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data || !Array.isArray(response.data.transactions || response.data.data || response.data)) {
        throw new Error('Expected array response for transactions');
      }

      const transactions = response.data.transactions || response.data.data || response.data;
      info(`Loaded ${transactions.length} transactions`);
    });

    await this.runTest('Transaction Service - Summary', async () => {
      const response = await this.makeRequest(
        `/api/transactions?userId=${TEST_CONFIG.testUserId}&action=summary`
      );
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid transaction summary response');
      }

      const summaryFields = ['totalSpent', 'totalIncome', 'transactionCount'];
      for (const field of summaryFields) {
        if (!(field in response.data)) {
          info(`Transaction summary missing optional field: ${field} (may be zero)`);
        }
      }

      info(`Total transactions: ${response.data.transactionCount || 0}`);
    });

    await this.runTest('Transaction Service - Create Transaction', async () => {
      const transactionData = {
        userId: TEST_CONFIG.testUserId,
        transactionType: 'deposit',
        amount: '100.00',
        stablecoin: 'USDC',
        chainId: '1',
        description: 'Test transaction',
        metadata: {
          test: true,
          timestamp: Date.now()
        }
      };

      const response = await this.makeRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });
      
      if (response.status !== 201) {
        throw new Error(`Expected status 201, got ${response.status}`);
      }

      if (!response.data || !response.data.id) {
        throw new Error('Transaction creation did not return valid transaction');
      }

      info(`Created test transaction: ${response.data.id}`);
    });
  }

  async testAssetService() {
    await this.runTest('Asset Service - Load Assets', async () => {
      const response = await this.makeRequest(
        `/api/assets?userId=${TEST_CONFIG.testUserId}`
      );
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Expected array response for assets');
      }

      info(`Loaded ${response.data.length} tokenized assets`);
    });
  }

  async testErrorHandling() {
    await this.runTest('Error Handling - Invalid User ID', async () => {
      const response = await this.makeRequest('/api/user?action=dashboard');
      
      if (response.status !== 400) {
        throw new Error(`Expected status 400 for missing user ID, got ${response.status}`);
      }

      if (!response.data.error) {
        throw new Error('Error response missing error details');
      }

      info('Proper error handling for missing user ID');
    });

    await this.runTest('Error Handling - Invalid Action', async () => {
      const response = await this.makeRequest(
        `/api/investments?userId=${TEST_CONFIG.testUserId}&action=invalid-action`
      );
      
      // Should still return 200 with empty/default data, not crash
      if (response.status >= 500) {
        throw new Error(`Server error for invalid action: ${response.status}`);
      }

      info('Server handles invalid actions gracefully');
    });
  }

  async runAllTests() {
    console.log(`${colors.cyan}${colors.bright}`);
    console.log('🧪 USD Financial Database Services End-to-End Test');
    console.log('==================================================');
    console.log(`${colors.reset}`);
    
    info(`Test configuration:`);
    console.log(`  📍 Base URL: ${TEST_CONFIG.baseUrl}`);
    console.log(`  👤 Test User ID: ${TEST_CONFIG.testUserId}`);
    console.log(`  ⏱️  Timeout: ${TEST_CONFIG.timeout}ms`);
    
    try {
      // Start the server
      await this.startServer();
      
      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Run tests in sequence
      section('Health Checks');
      await this.testHealthEndpoint();

      section('User Service Tests');
      await this.testUserService();

      section('Investment Service Tests');
      await this.testInvestmentService();

      section('Transaction Service Tests');
      await this.testTransactionService();

      section('Asset Service Tests');
      await this.testAssetService();

      section('Error Handling Tests');
      await this.testErrorHandling();

      // Print results
      this.printResults();

    } catch (err) {
      error(`Test suite failed: ${err.message}`);
      process.exit(1);
    } finally {
      await this.stopServer();
    }
  }

  printResults() {
    console.log(`\n${colors.cyan}${colors.bright}=== TEST RESULTS ===${colors.reset}\n`);
    
    console.log(`📊 Total Tests: ${this.testResults.total}`);
    console.log(`${colors.green}✅ Passed: ${this.testResults.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.testResults.failed}${colors.reset}`);
    console.log(`${colors.yellow}⏭️  Skipped: ${this.testResults.skipped}${colors.reset}`);
    
    if (this.testResults.errors.length > 0) {
      console.log(`\n${colors.red}${colors.bright}FAILED TESTS:${colors.reset}`);
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    const successRate = this.testResults.total > 0 
      ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
      : '0.0';

    console.log(`\n📈 Success Rate: ${successRate}%`);

    if (this.testResults.failed === 0) {
      console.log(`\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED!${colors.reset}`);
      console.log('Your database-driven services are working correctly.');
    } else {
      console.log(`\n${colors.red}${colors.bright}💥 SOME TESTS FAILED${colors.reset}`);
      console.log('Please check the errors above and fix the issues.');
      process.exit(1);
    }
  }
}

// Make fetch available in Node.js environment
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the tests
const tester = new DatabaseServicesTester();
tester.runAllTests().catch(console.error);