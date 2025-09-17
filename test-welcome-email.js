// Test script for welcome email system
const fetch = require('node-fetch').default || require('node-fetch')

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function testWelcomeEmailSystem() {
  console.log('🧪 Testing USD Financial Welcome Email System...\n')

  try {
    // Test 1: Initialize user preferences
    console.log('📧 Test 1: Initialize user preferences')
    const prefsInit = await fetch(`${BASE_URL}/api/emails/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'initialize',
        userIdentifier: 'test.user@example.com',
        email: 'test.user@example.com'
      })
    })
    
    if (prefsInit.ok) {
      const result = await prefsInit.json()
      console.log('✅ User preferences initialized:', result.preferences.userId)
    } else {
      console.log('❌ Failed to initialize preferences')
    }

    // Test 2: Check if we can send welcome email
    console.log('\n📧 Test 2: Check welcome email permission')
    const canSend = await fetch(`${BASE_URL}/api/emails/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'canSend',
        userIdentifier: 'test.user@example.com',
        emailType: 'welcome'
      })
    })

    if (canSend.ok) {
      const result = await canSend.json()
      console.log('✅ Can send welcome email:', result.canSend)
    } else {
      console.log('❌ Failed to check email permission')
    }

    // Test 3: Send welcome email
    console.log('\n📧 Test 3: Send welcome email')
    const sendEmail = await fetch(`${BASE_URL}/api/emails/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: {
          email: 'test.user@example.com',
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User'
        },
        data: {
          firstName: 'Test',
          lastName: 'User',
          signupSource: 'email_signup',
          country: 'United States',
          signupTimestamp: new Date().toISOString(),
          referralCode: 'TEST2025',
          estimatedSavings: '$1,200',
          welcomeBonus: '$25'
        }
      })
    })

    if (sendEmail.ok) {
      const result = await sendEmail.json()
      console.log('✅ Welcome email sent:', result.messageId)
    } else {
      const error = await sendEmail.json().catch(() => ({ error: 'Unknown error' }))
      console.log('❌ Failed to send welcome email:', error)
    }

    // Test 4: Preview welcome email
    console.log('\n📧 Test 4: Preview welcome email template')
    const preview = await fetch(`${BASE_URL}/api/emails/welcome?preview=true&firstName=Test`)

    if (preview.ok) {
      console.log('✅ Email preview generated (HTML template)')
    } else {
      console.log('❌ Failed to generate email preview')
    }

    // Test 5: Check email queue stats
    console.log('\n📊 Test 5: Check email queue statistics')
    const stats = await fetch(`${BASE_URL}/api/emails/analytics?stats=true`)

    if (stats.ok) {
      const result = await stats.json()
      console.log('✅ Queue stats:', result.data.queue)
    } else {
      console.log('❌ Failed to get queue stats')
    }

    console.log('\n🎉 Welcome email system test completed!')

  } catch (error) {
    console.error('❌ Test error:', error.message)
    console.log('💡 Make sure your Next.js development server is running on port 3000')
    console.log('   Run: npm run dev')
    console.log('🔧 Ensure AWS SES is configured with environment variables:')
    console.log('   - EMAIL_PROVIDER=aws-ses')
    console.log('   - AWS_ACCESS_KEY_ID=your-key')
    console.log('   - AWS_SECRET_ACCESS_KEY=your-secret')
    console.log('   - FROM_EMAIL=welcome@yourdomain.com')
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWelcomeEmailSystem()
}

module.exports = { testWelcomeEmailSystem }