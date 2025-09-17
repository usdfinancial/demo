// Email preferences and opt-out management
interface EmailPreferences {
  userId: string
  email: string
  welcomeEmails: boolean
  marketingEmails: boolean
  transactionalEmails: boolean
  productUpdates: boolean
  securityAlerts: boolean
  optedOutAt?: string
  preferences: {
    frequency: 'immediate' | 'daily' | 'weekly' | 'never'
    categories: string[]
  }
}

class EmailPreferencesService {
  private preferences: Map<string, EmailPreferences> = new Map()

  /**
   * Get user email preferences
   */
  async getUserPreferences(userIdentifier: string): Promise<EmailPreferences | null> {
    // In a real app, this would query the database
    return this.preferences.get(userIdentifier) || null
  }

  /**
   * Initialize default preferences for new user
   */
  async initializeUserPreferences(userIdentifier: string, email: string): Promise<EmailPreferences> {
    const defaultPreferences: EmailPreferences = {
      userId: userIdentifier,
      email,
      welcomeEmails: true, // Default to enabled for new users
      marketingEmails: true,
      transactionalEmails: true, // Always enabled - required for security
      productUpdates: true,
      securityAlerts: true, // Always enabled - required for security
      preferences: {
        frequency: 'immediate',
        categories: ['welcome', 'transactional', 'product']
      }
    }

    this.preferences.set(userIdentifier, defaultPreferences)
    console.log('📧 Initialized email preferences for user:', userIdentifier)
    return defaultPreferences
  }

  /**
   * Update user email preferences
   */
  async updateUserPreferences(userIdentifier: string, updates: Partial<EmailPreferences>): Promise<EmailPreferences | null> {
    const existing = this.preferences.get(userIdentifier)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.preferences.set(userIdentifier, updated)
    
    console.log('📧 Updated email preferences for user:', userIdentifier, updates)
    return updated
  }

  /**
   * Check if user can receive specific email type (enhanced for email consolidation)
   */
  async canSendEmail(userIdentifier: string, emailType: 'welcome' | 'marketing' | 'transactional' | 'product' | 'security'): Promise<boolean> {
    // For email consolidation: check preferences by email (primary identifier)
    const emailIdentifier = this.extractEmailFromIdentifier(userIdentifier)
    const preferences = await this.getUserPreferences(emailIdentifier)
    
    // If no preferences found, allow welcome, transactional and security emails for new users
    if (!preferences) {
      return emailType === 'welcome' || emailType === 'transactional' || emailType === 'security'
    }

    switch (emailType) {
      case 'welcome':
        return preferences.welcomeEmails
      case 'marketing':
        return preferences.marketingEmails
      case 'transactional':
        return preferences.transactionalEmails // Should always be true
      case 'product':
        return preferences.productUpdates
      case 'security':
        return preferences.securityAlerts // Should always be true
      default:
        return false
    }
  }

  /**
   * Opt user out of all non-essential emails
   */
  async optOutUser(userIdentifier: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userIdentifier)
    if (!preferences) return false

    const updated = await this.updateUserPreferences(userIdentifier, {
      welcomeEmails: false,
      marketingEmails: false,
      productUpdates: false,
      // Keep transactional and security emails enabled for safety
      optedOutAt: new Date().toISOString(),
      preferences: {
        ...preferences.preferences,
        frequency: 'never',
        categories: ['transactional', 'security'] // Only essential emails
      }
    })

    console.log('🚫 User opted out of marketing emails:', userIdentifier)
    return !!updated
  }

  /**
   * Generate unsubscribe token for email links
   */
  generateUnsubscribeToken(userIdentifier: string, emailType: string): string {
    // In production, use a proper JWT or secure token
    return Buffer.from(`${userIdentifier}:${emailType}:${Date.now()}`).toString('base64')
  }

  /**
   * Extract email from user identifier (supports email consolidation)
   * If userIdentifier is an email, return it. If it's a wallet address, return as-is.
   */
  private extractEmailFromIdentifier(userIdentifier: string): string {
    // Check if identifier is an email (contains @)
    if (userIdentifier.includes('@')) {
      return userIdentifier.toLowerCase()
    }
    
    // For wallet addresses, use as-is (fallback for wallet-only users)
    return userIdentifier
  }

  /**
   * Initialize preferences using email as primary identifier
   */
  async initializeUserPreferencesByEmail(email: string): Promise<EmailPreferences> {
    return this.initializeUserPreferences(email.toLowerCase(), email.toLowerCase())
  }

  /**
   * Verify and process unsubscribe token
   */
  async processUnsubscribeToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const decoded = Buffer.from(token, 'base64').toString()
      const [userIdentifier, emailType] = decoded.split(':')

      if (!userIdentifier || !emailType) {
        return { success: false, message: 'Invalid unsubscribe token' }
      }

      // Update specific email type preference
      const preferences = await this.getUserPreferences(userIdentifier)
      if (!preferences) {
        return { success: false, message: 'User preferences not found' }
      }

      const updates: Partial<EmailPreferences> = {}
      
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
        default:
          // For 'all', opt out of non-essential emails
          return this.optOutUser(userIdentifier)
            .then(success => ({ 
              success, 
              message: success ? 'Successfully unsubscribed from marketing emails' : 'Failed to unsubscribe' 
            }))
      }

      const updated = await this.updateUserPreferences(userIdentifier, updates)
      return {
        success: !!updated,
        message: updated ? `Successfully unsubscribed from ${emailType} emails` : 'Failed to unsubscribe'
      }

    } catch (error) {
      console.error('❌ Unsubscribe token processing error:', error)
      return { success: false, message: 'Invalid unsubscribe request' }
    }
  }
}

// Export singleton instance
export const emailPreferencesService = new EmailPreferencesService()
export default emailPreferencesService