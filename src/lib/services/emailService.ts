import { BaseService } from './baseService'

// Email service configuration
interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'smtp' | 'aws-ses'
  apiKey?: string
  aws?: {
    region: string
    accessKeyId?: string
    secretAccessKey?: string
  }
  from: {
    name: string
    email: string
  }
  templates: {
    welcome: string
    verification: string
    passwordReset: string
  }
}

// Email recipient information
export interface EmailRecipient {
  email: string
  name?: string
  firstName?: string
  lastName?: string
}

// Email template data for personalization
export interface WelcomeEmailData {
  firstName: string
  lastName?: string
  signupSource?: string
  country?: string
  signupTimestamp: string
  referralCode?: string
  estimatedSavings?: string
  dashboardUrl: string
  helpCenterUrl: string
  unsubscribeUrl: string
  privacyUrl: string
  welcomeBonus?: string
}

// Email sending result
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: string
}

// Email analytics data
export interface EmailAnalytics {
  emailId: string
  recipient: string
  type: 'welcome' | 'verification' | 'marketing'
  sentAt: string
  deliveredAt?: string
  openedAt?: string
  clickedAt?: string
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed'
}

class EmailService extends BaseService {
  private config: EmailConfig
  private analytics: EmailAnalytics[] = []

  constructor() {
    super('emails')
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as any) || 'aws-ses', // Default to AWS SES
      apiKey: process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY,
      aws: {
        region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      from: {
        name: 'USD Financial',
        email: process.env.FROM_EMAIL || 'welcome@usdfinancial.com'
      },
      templates: {
        welcome: 'welcome-v1',
        verification: 'verification-v1', 
        passwordReset: 'password-reset-v1'
      }
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(recipient: EmailRecipient, data: WelcomeEmailData): Promise<EmailResult> {
    try {
      // Generate tracking ID for analytics
      const emailId = this.generateEmailId('welcome', recipient.email)
      
      // Prepare email content
      const emailContent = this.generateWelcomeEmailContent(data)
      
      // Send email via configured provider
      const result = await this.sendEmail({
        to: recipient,
        subject: `🎉 Welcome to USD Financial, ${data.firstName}! Your stablecoin journey begins`,
        html: emailContent,
        trackingId: emailId
      })

      // Track analytics
      await this.trackEmailSent(emailId, recipient.email, 'welcome')

      return result
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Send email via configured provider
   */
  private async sendEmail(emailData: {
    to: EmailRecipient
    subject: string
    html: string
    trackingId: string
  }): Promise<EmailResult> {
    switch (this.config.provider) {
      case 'aws-ses':
        return this.sendViaAwsSes(emailData)
      case 'sendgrid':
        return this.sendViaSendGrid(emailData)
      case 'smtp':
        return this.sendViaSmtp(emailData)
      default:
        return this.mockEmailSend(emailData)
    }
  }

  /**
   * AWS SES implementation
   */
  private async sendViaAwsSes(emailData: {
    to: EmailRecipient
    subject: string
    html: string
    trackingId: string
  }): Promise<EmailResult> {
    try {
      // Import AWS SES client dynamically
      const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2').catch(() => ({ SESv2Client: null, SendEmailCommand: null }))
      
      if (!SESv2Client || !SendEmailCommand) {
        console.warn('AWS SES SDK not available, falling back to mock email')
        return this.mockEmailSend(emailData)
      }

      // Configure AWS SES client
      const sesClient = new SESv2Client({
        region: this.config.aws?.region || 'us-east-1',
        credentials: this.config.aws?.accessKeyId && this.config.aws?.secretAccessKey ? {
          accessKeyId: this.config.aws.accessKeyId,
          secretAccessKey: this.config.aws.secretAccessKey
        } : undefined // Use default credential chain if not provided
      })

      // Prepare email parameters
      const emailParams = {
        FromEmailAddress: `${this.config.from.name} <${this.config.from.email}>`,
        Destination: {
          ToAddresses: [
            emailData.to.name 
              ? `${emailData.to.name} <${emailData.to.email}>`
              : emailData.to.email
          ]
        },
        Content: {
          Simple: {
            Subject: {
              Data: emailData.subject,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: emailData.html,
                Charset: 'UTF-8'
              },
              Text: {
                Data: this.extractTextFromHtml(emailData.html),
                Charset: 'UTF-8'
              }
            }
          }
        },
        EmailTags: [
          {
            Name: 'tracking_id',
            Value: emailData.trackingId
          },
          {
            Name: 'email_type',
            Value: 'welcome'
          },
          {
            Name: 'source',
            Value: 'usd_financial_app'
          }
        ]
      }

      // Send email via SES
      const command = new SendEmailCommand(emailParams)
      const response = await sesClient.send(command)

      return {
        success: true,
        messageId: response.MessageId || emailData.trackingId,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('AWS SES error:', error)
      
      // If it's a credentials issue, provide helpful message
      if (error instanceof Error && error.message.includes('credentials')) {
        console.error('AWS SES credentials not configured properly. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.')
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS SES error',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * SendGrid implementation
   */
  private async sendViaSendGrid(emailData: {
    to: EmailRecipient
    subject: string
    html: string
    trackingId: string
  }): Promise<EmailResult> {
    try {
      // In a real implementation, you would use @sendgrid/mail
      const sgMail = await import('@sendgrid/mail').catch(() => null)
      
      if (!sgMail || !this.config.apiKey) {
        console.warn('SendGrid not configured, using mock email')
        return this.mockEmailSend(emailData)
      }

      sgMail.setApiKey(this.config.apiKey)

      const msg = {
        to: {
          email: emailData.to.email,
          name: emailData.to.name || emailData.to.firstName
        },
        from: {
          email: this.config.from.email,
          name: this.config.from.name
        },
        subject: emailData.subject,
        html: emailData.html,
        customArgs: {
          tracking_id: emailData.trackingId,
          email_type: 'welcome'
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      }

      const response = await sgMail.send(msg)
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || emailData.trackingId,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('SendGrid error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SendGrid error',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * SMTP fallback implementation
   */
  private async sendViaSmtp(emailData: {
    to: EmailRecipient
    subject: string
    html: string
    trackingId: string
  }): Promise<EmailResult> {
    try {
      // In a real implementation, you would use nodemailer
      const nodemailer = await import('nodemailer').catch(() => null)
      
      if (!nodemailer) {
        console.warn('Nodemailer not available, using mock email')
        return this.mockEmailSend(emailData)
      }

      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })

      const info = await transporter.sendMail({
        from: `"${this.config.from.name}" <${this.config.from.email}>`,
        to: emailData.to.email,
        subject: emailData.subject,
        html: emailData.html,
        headers: {
          'X-Tracking-ID': emailData.trackingId
        }
      })

      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('SMTP error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMTP error',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Mock email implementation for development/testing
   */
  private async mockEmailSend(emailData: {
    to: EmailRecipient
    subject: string
    html: string
    trackingId: string
  }): Promise<EmailResult> {
    console.log('📧 Mock Email Sent:')
    console.log('To:', emailData.to.email)
    console.log('Subject:', emailData.subject)
    console.log('Tracking ID:', emailData.trackingId)
    console.log('---')
    
    return {
      success: true,
      messageId: `mock_${emailData.trackingId}`,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Extract plain text from HTML content for email text version
   */
  private extractTextFromHtml(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim()
  }

  /**
   * Generate unique email ID for tracking
   */
  private generateEmailId(type: string, email: string): string {
    const timestamp = Date.now()
    const hash = email.split('@')[0].slice(0, 4)
    return `${type}_${hash}_${timestamp}`
  }

  /**
   * Track email analytics
   */
  private async trackEmailSent(emailId: string, recipient: string, type: 'welcome' | 'verification' | 'marketing'): Promise<void> {
    const analyticsData: EmailAnalytics = {
      emailId,
      recipient,
      type,
      sentAt: new Date().toISOString(),
      status: 'sent'
    }

    this.analytics.push(analyticsData)
    
    // In a real implementation, save to database
    console.log('📊 Email analytics tracked:', emailId)
  }

  /**
   * Get email analytics for a specific email
   */
  async getEmailAnalytics(emailId: string): Promise<EmailAnalytics | null> {
    return this.analytics.find(a => a.emailId === emailId) || null
  }

  /**
   * Generate the welcome email HTML content
   */
  private generateWelcomeEmailContent(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to USD Financial - Your Stablecoin Journey Begins</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .tagline { color: #d1fae5; font-size: 14px; }
        .hero { background: rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; margin-top: 30px; }
        .hero-emoji { font-size: 48px; margin-bottom: 16px; }
        .hero-title { color: white; font-size: 32px; font-weight: 700; margin-bottom: 12px; }
        .hero-text { color: #d1fae5; font-size: 18px; }
        .content { padding: 40px 20px; }
        .section { margin-bottom: 40px; }
        .section-title { color: #1f2937; font-size: 24px; font-weight: 600; margin-bottom: 16px; }
        .feature-grid { display: table; width: 100%; margin-bottom: 16px; }
        .feature-row { display: table-row; }
        .feature-cell { display: table-cell; width: 48%; vertical-align: top; padding: 24px; }
        .feature-cell:nth-child(2) { width: 4%; }
        .feature { border-radius: 12px; border-left: 4px solid; }
        .feature-1 { background: #f0f9ff; border-color: #0ea5e9; }
        .feature-2 { background: #f0fdf4; border-color: #22c55e; }
        .feature-3 { background: #fef3c7; border-color: #f59e0b; }
        .feature-4 { background: #fdf2f8; border-color: #ec4899; }
        .feature-emoji { font-size: 32px; margin-bottom: 12px; }
        .feature-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .feature-desc { font-size: 14px; line-height: 1.5; }
        .cta-section { text-align: center; padding: 40px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; font-weight: 600; font-size: 18px; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
        .cta-subtext { color: #6b7280; font-size: 14px; margin-top: 16px; }
        .footer { background: #1f2937; color: white; padding: 40px 20px; text-align: center; }
        .footer-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
        .footer-text { color: #9ca3af; font-size: 14px; }
        .footer-links { color: #10b981; text-decoration: none; }
        .footer-legal { color: #6b7280; font-size: 12px; border-top: 1px solid #374151; padding-top: 24px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">USD Financial</div>
            <div class="tagline">The Future of Stablecoin Financial Services</div>
            
            <div class="hero">
                <div class="hero-emoji">🎉</div>
                <div class="hero-title">Welcome to the Future!</div>
                <div class="hero-text">${data.firstName}, you're now part of a financial revolution. Get ready to experience stablecoin financial services like never before.</div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="content">
            <div class="section">
                <div class="section-title">Here's what makes you special, ${data.firstName}:</div>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.7;">You're joining over <strong>50,000+ forward-thinking individuals</strong> who've already discovered the power of stablecoin-first financial services. You're not just getting an account—you're getting access to the future of finance.</p>
            </div>

            <div class="section">
                <div class="section-title">Your USD Financial superpowers:</div>
                
                <div class="feature-grid">
                    <div class="feature-row">
                        <div class="feature-cell">
                            <div class="feature feature-1">
                                <div class="feature-emoji">⚡</div>
                                <div class="feature-title" style="color: #0c4a6e;">Gasless Transactions</div>
                                <div class="feature-desc" style="color: #075985;">Send USDC across 12+ blockchains with zero gas fees using our Smart Wallet.</div>
                            </div>
                        </div>
                        <div class="feature-cell"></div>
                        <div class="feature-cell">
                            <div class="feature feature-2">
                                <div class="feature-emoji">🌍</div>
                                <div class="feature-title" style="color: #14532d;">Global Access</div>
                                <div class="feature-desc" style="color: #166534;">Your USD Financial card works everywhere. Spend stablecoins like traditional currency.</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="feature-grid">
                    <div class="feature-row">
                        <div class="feature-cell">
                            <div class="feature feature-3">
                                <div class="feature-emoji">📈</div>
                                <div class="feature-title" style="color: #92400e;">Earn Up to 8.5% APY</div>
                                <div class="feature-desc" style="color: #a16207;">Put your USDC to work with institutional-grade DeFi yield strategies.</div>
                            </div>
                        </div>
                        <div class="feature-cell"></div>
                        <div class="feature-cell">
                            <div class="feature feature-4">
                                <div class="feature-emoji">🔒</div>
                                <div class="feature-title" style="color: #831843;">Bank-Grade Security</div>
                                <div class="feature-desc" style="color: #be185d;">Multi-signature wallets, insurance coverage, and Circle CCTP integration.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CTA -->
            <div class="cta-section">
                <a href="${data.dashboardUrl}" class="cta-button">Complete Your Setup →</a>
                <div class="cta-subtext">Takes less than 2 minutes • Get ${data.welcomeBonus || '$25'} welcome bonus</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-title">Questions? We're here to help!</div>
            <div class="footer-text">Email us at <a href="mailto:support@usdfinancial.com" class="footer-links">support@usdfinancial.com</a> or visit our <a href="${data.helpCenterUrl}" class="footer-links">Help Center</a></div>
            
            <div class="footer-legal">
                USD Financial, Inc. • 548 Market St, San Francisco, CA 94104<br>
                © 2025 USD Financial. All rights reserved.<br>
                <a href="${data.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> | <a href="${data.privacyUrl}" style="color: #9ca3af;">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>`
  }
}

// Export singleton instance
export const emailService = new EmailService()
export default emailService