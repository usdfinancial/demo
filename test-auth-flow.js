#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

async function testAuthFlow() {
  try {
    console.log('🧪 Testing authentication flow and login history...')
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const testEmail = 'auth-flow-test@example.com'
    const testWallet = '0xF47AC10B58CC4372A567DE02B2C3D479E3D2F1AB'
    
    // Test 1: Create user
    console.log('🔄 Testing user creation with login history...')
    
    const createUserResponse = await fetch(`${baseUrl}/api/auth/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': JSON.stringify({
          userAgent: 'Test Script',
          deviceFingerprint: 'test-device-123'
        })
      },
      body: JSON.stringify({
        action: 'create-user',
        userData: {
          email: testEmail,
          smartWalletAddress: testWallet,
          authMethod: 'email',
          profile: {
            firstName: 'Test',
            lastName: 'User'
          }
        },
        loginMethod: 'email'
      })
    })
    
    const createResult = await createUserResponse.json()
    
    if (createResult.success) {
      console.log('✅ User created successfully:', createResult.data.id)
      console.log('   Session token provided:', createResult.data.sessionToken ? 'Yes' : 'No')
    } else {
      console.error('❌ User creation failed:', createResult.error)
      return
    }
    
    // Test 2: Update last auth (simulating login)
    console.log('🔄 Testing login authentication...')
    
    const authResponse = await fetch(`${baseUrl}/api/auth/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': JSON.stringify({
          userAgent: 'Test Script Login',
          deviceFingerprint: 'test-device-456'
        })
      },
      body: JSON.stringify({
        action: 'update-last-auth',
        email: testEmail,
        loginMethod: 'email',
        loginStatus: 'success'
      })
    })
    
    const authResult = await authResponse.json()
    
    if (authResult.success) {
      console.log('✅ Authentication successful')
      console.log('   Session token provided:', authResult.data.sessionToken ? 'Yes' : 'No')
    } else {
      console.error('❌ Authentication failed:', authResult.error)
    }
    
    // Test 3: Test failed login
    console.log('🔄 Testing failed login scenario...')
    
    const failedAuthResponse = await fetch(`${baseUrl}/api/auth/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'log-failed-signup',
        email: 'failed-login-test@example.com',
        loginMethod: 'google',
        error: 'Authentication failed - test scenario'
      })
    })
    
    const failedResult = await failedAuthResponse.json()
    
    if (failedResult.success) {
      console.log('✅ Failed login logged successfully')
    } else {
      console.error('❌ Failed to log failed login:', failedResult.error)
    }
    
    console.log('')
    console.log('🧪 Authentication flow TEST COMPLETED')
    console.log('   Check the login_history table for recorded attempts')
    
  } catch (error) {
    console.error('❌ Auth flow test failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message
    })
  }
}

testAuthFlow()
