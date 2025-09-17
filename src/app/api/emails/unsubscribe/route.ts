import { NextRequest, NextResponse } from 'next/server'
import { emailPreferencesService } from '@/lib/services/emailPreferences'

/**
 * GET /api/emails/unsubscribe?token=<unsubscribe_token>
 * Process email unsubscribe requests
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invalid Unsubscribe Link</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>Invalid Unsubscribe Link</h2>
              <p>The unsubscribe link is missing or invalid. Please contact support if you continue to receive unwanted emails.</p>
            </div>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Process the unsubscribe token
    const result = await emailPreferencesService.processUnsubscribeToken(token)

    if (result.success) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Successfully Unsubscribed - USD Financial</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                line-height: 1.6; background: #f9fafb; 
              }
              .container { max-width: 600px; margin: 50px auto; padding: 20px; }
              .success { 
                background: white; padding: 40px; border-radius: 12px; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; 
              }
              .logo { color: #10b981; font-size: 24px; font-weight: 700; margin-bottom: 20px; }
              .success-icon { font-size: 48px; margin-bottom: 20px; }
              h2 { color: #1f2937; margin-bottom: 16px; }
              p { color: #6b7280; margin-bottom: 16px; }
              .contact { 
                background: #f3f4f6; padding: 20px; border-radius: 8px; 
                margin-top: 20px; text-align: left; 
              }
              .contact h3 { color: #1f2937; font-size: 16px; margin-bottom: 8px; }
              .contact p { font-size: 14px; }
              a { color: #10b981; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">
                <div class="logo">USD Financial</div>
                <div class="success-icon">✅</div>
                <h2>Successfully Unsubscribed</h2>
                <p>${result.message}</p>
                <p>You will no longer receive these types of emails from USD Financial. You may still receive important account and security notifications.</p>
                
                <div class="contact">
                  <h3>Need Help?</h3>
                  <p>If you have questions or want to update your email preferences, contact us at <a href="mailto:support@usdfinancial.com">support@usdfinancial.com</a></p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    } else {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Unsubscribe Error - USD Financial</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center; }
              .logo { color: #10b981; font-size: 24px; font-weight: 700; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="error">
              <div class="logo">USD Financial</div>
              <h2>Unsubscribe Error</h2>
              <p>${result.message}</p>
              <p>Please contact support if you continue to experience issues.</p>
            </div>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

  } catch (error) {
    console.error('Unsubscribe API error:', error)
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Server Error</title>
          <style>
            body { font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Server Error</h2>
            <p>We're sorry, but there was an error processing your unsubscribe request. Please try again later.</p>
          </div>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

/**
 * POST /api/emails/unsubscribe
 * Programmatic unsubscribe API for apps/integrations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userIdentifier, emailType } = body

    if (token) {
      // Process unsubscribe token
      const result = await emailPreferencesService.processUnsubscribeToken(token)
      return NextResponse.json(result)
    }

    if (userIdentifier && emailType) {
      // Direct unsubscribe by user ID and email type
      const preferences = await emailPreferencesService.getUserPreferences(userIdentifier)
      if (!preferences) {
        return NextResponse.json({
          success: false,
          message: 'User preferences not found'
        }, { status: 404 })
      }

      // Update specific email type preference
      const updates: any = {}
      switch (emailType) {
        case 'welcome':
          updates.welcomeEmails = false
          break
        case 'marketing':
          updates.marketingEmails = false
          break
        case 'product':
          updates.productUpdates = false
          break
        case 'all':
          const optOutResult = await emailPreferencesService.optOutUser(userIdentifier)
          return NextResponse.json({
            success: optOutResult,
            message: optOutResult ? 'Successfully opted out of marketing emails' : 'Failed to opt out'
          })
        default:
          return NextResponse.json({
            success: false,
            message: 'Invalid email type'
          }, { status: 400 })
      }

      const updated = await emailPreferencesService.updateUserPreferences(userIdentifier, updates)
      return NextResponse.json({
        success: !!updated,
        message: updated ? `Successfully unsubscribed from ${emailType} emails` : 'Failed to unsubscribe'
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Missing required parameters: token or (userIdentifier + emailType)'
    }, { status: 400 })

  } catch (error) {
    console.error('Unsubscribe POST API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error processing unsubscribe request'
    }, { status: 500 })
  }
}