#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

async function testAuthService() {
  try {
    console.log('🧪 Testing userAuthService...')
    
    // We need to import this as an ES module since the service is in TypeScript
    // Let's simulate what would happen in a real authentication flow
    const { userAuthService } = await import('../src/lib/services/userAuthService.ts')
    
    console.log('✅ Successfully imported userAuthService')
    
    // Test basic authentication 
    const testEmail = 'test-user@example.com'
    const testWallet = '0x742D35Cc6635C0532925a3b8d0Df7D3f6E3D2F1A'
    const authMethod = 'google'
    
    console.log('🔐 Testing user authentication...')
    
    const result = await userAuthService.authenticateUser(
      testEmail,
      testWallet,
      authMethod,
      testEmail,
      'google_user_123',
      { provider: 'google', timestamp: new Date().toISOString() }
    )
    
    console.log('✅ Authentication successful:', {
      isNewUser: result.isNewUser,
      userId: result.user.id,
      email: result.user.email,
      smartWallet: result.user.smartWalletAddress,
      authMethod: result.authMethod.authType
    })
    
    // Verify user was created in database
    console.log('🔍 Verifying user in database...')
    const foundUser = await userAuthService.findUserByEmail(testEmail)
    
    if (foundUser) {
      console.log('✅ User found in database:', {
        id: foundUser.id,
        email: foundUser.email,
        smartWallet: foundUser.smartWalletAddress,
        authMethods: foundUser.authMethods.length
      })
    } else {
      console.error('❌ User not found in database after creation')
    }
    
    console.log('✅ Auth service test complete')
    
  } catch (error) {
    console.error('❌ Auth service test failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5)
    })
  } finally {
    process.exit(0)
  }
}

testAuthService()