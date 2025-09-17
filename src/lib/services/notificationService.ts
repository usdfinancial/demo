import { BaseService } from './baseService'

export interface Notification {
  id: string
  userId: string
  type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook'
  category: 'security' | 'transaction' | 'payment' | 'insurance' | 'loan' | 'marketing' | 'system' | 'compliance'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read' | 'archived'
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  data?: Record<string, any>
  channels: Array<{
    type: Notification['type']
    address: string // email, phone, device_token, webhook_url
    status: 'pending' | 'sent' | 'delivered' | 'failed'
    sentAt?: Date
    deliveredAt?: Date
    error?: string
  }>
  scheduledFor?: Date
  expiresAt?: Date
  readAt?: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface NotificationTemplate {
  id: string
  name: string
  category: Notification['category']
  type: Notification['type']
  subject?: string
  template: string
  variables: string[] // List of template variables like {user_name}, {amount}
  isActive: boolean
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPreference {
  id: string
  userId: string
  category: Notification['category']
  channels: Array<{
    type: Notification['type']
    enabled: boolean
    address?: string
  }>
  quietHours?: {
    start: string // HH:MM format
    end: string
    timezone: string
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CreateNotificationRequest {
  userId: string
  type?: Notification['type']
  category: Notification['category']
  priority?: Notification['priority']
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  data?: Record<string, any>
  channels?: Array<{
    type: Notification['type']
    address: string
  }>
  scheduledFor?: Date
  expiresAt?: Date
  metadata?: Record<string, any>
}

export interface SendTemplateNotificationRequest {
  userId: string
  templateName: string
  variables: Record<string, string>
  priority?: Notification['priority']
  scheduledFor?: Date
  overrideChannels?: Array<{
    type: Notification['type']
    address: string
  }>
  metadata?: Record<string, any>
}

/**
 * Notification Service - Comprehensive notification management for USD Financial
 *
 * Handles:
 * - Multi-channel notifications (email, SMS, push, in-app, webhook)
 * - Template-based messaging
 * - User preferences and quiet hours
 * - Compliance notifications
 * - Security alerts
 * - Payment reminders
 */
class NotificationService extends BaseService {
  constructor() {
    super('notifications')
  }

  /**
   * Send a notification to user
   */
  async sendNotification(data: CreateNotificationRequest): Promise<Notification> {
    try {
      await this.ensureNotificationTables()

      const notificationId = this.generateId()

      // Get user's notification preferences
      const preferences = await this.getUserPreferences(data.userId, data.category)

      // Determine channels based on preferences or provided channels
      let channels = data.channels || []
      if (channels.length === 0 && preferences) {
        channels = preferences.channels
          .filter(ch => ch.enabled)
          .map(ch => ({ type: ch.type, address: ch.address || '' }))
      }

      // Default to in-app if no channels specified
      if (channels.length === 0) {
        channels = [{ type: 'in_app', address: data.userId }]
      }

      // Check quiet hours for non-urgent notifications
      if (data.priority !== 'urgent' && preferences?.quietHours) {
        const now = new Date()
        if (this.isInQuietHours(now, preferences.quietHours)) {
          // Schedule for after quiet hours
          data.scheduledFor = this.calculateAfterQuietHours(now, preferences.quietHours)
        }
      }

      const query = `
        INSERT INTO notifications (
          id, user_id, type, category, priority, status, title, message,
          action_url, action_text, data, channels, scheduled_for, expires_at,
          metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        notificationId,
        data.userId,
        data.type || channels[0]?.type || 'in_app',
        data.category,
        data.priority || 'medium',
        data.scheduledFor ? 'pending' : 'sent',
        data.title,
        data.message,
        data.actionUrl || null,
        data.actionText || null,
        data.data ? JSON.stringify(data.data) : null,
        JSON.stringify(channels.map(ch => ({ ...ch, status: 'pending' }))),
        data.scheduledFor || null,
        data.expiresAt || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ])

      if (result.length === 0) {
        throw new Error('Failed to create notification')
      }

      const notification = this.mapDatabaseRowToNotification(result[0])

      console.log('✅ Notification created:', {
        notificationId,
        userId: data.userId,
        category: data.category,
        priority: data.priority,
        channelsCount: channels.length,
        scheduled: !!data.scheduledFor
      })

      // Send immediately if not scheduled
      if (!data.scheduledFor) {
        await this.processNotificationChannels(notification)
      }

      return notification
    } catch (error) {
      console.error('❌ Error sending notification:', error)
      throw error
    }
  }

  /**
   * Send notification using template
   */
  async sendTemplateNotification(data: SendTemplateNotificationRequest): Promise<Notification> {
    try {
      const template = await this.getTemplateByName(data.templateName)
      if (!template) {
        throw new Error(`Template not found: ${data.templateName}`)
      }

      // Replace template variables
      let message = template.template
      let title = template.subject || ''

      for (const [key, value] of Object.entries(data.variables)) {
        const placeholder = `{${key}}`
        message = message.replace(new RegExp(placeholder, 'g'), value)
        title = title.replace(new RegExp(placeholder, 'g'), value)
      }

      return await this.sendNotification({
        userId: data.userId,
        type: template.type,
        category: template.category,
        priority: data.priority,
        title,
        message,
        channels: data.overrideChannels,
        scheduledFor: data.scheduledFor,
        metadata: {
          templateName: data.templateName,
          templateId: template.id,
          ...data.metadata
        }
      })
    } catch (error) {
      console.error('❌ Error sending template notification:', error)
      throw error
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      category?: Notification['category']
      status?: Notification['status']
      limit?: number
      offset?: number
      unreadOnly?: boolean
    } = {}
  ): Promise<Notification[]> {
    try {
      let query = `SELECT * FROM notifications WHERE user_id = $1`
      const params: any[] = [userId]
      let paramIndex = 2

      if (options.category) {
        query += ` AND category = $${paramIndex++}`
        params.push(options.category)
      }

      if (options.status) {
        query += ` AND status = $${paramIndex++}`
        params.push(options.status)
      }

      if (options.unreadOnly) {
        query += ` AND read_at IS NULL`
      }

      query += ` ORDER BY created_at DESC`

      if (options.limit) {
        query += ` LIMIT $${paramIndex++}`
        params.push(options.limit)
      }

      if (options.offset) {
        query += ` OFFSET $${paramIndex++}`
        params.push(options.offset)
      }

      const result = await this.customQuery(query, params)
      return result.map(row => this.mapDatabaseRowToNotification(row))
    } catch (error) {
      console.error('❌ Error getting user notifications:', error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const query = `
        UPDATE notifications
        SET read_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND read_at IS NULL
      `

      await this.customQuery(query, [notificationId, userId])

      console.log(`✅ Notification ${notificationId} marked as read`)
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string, category?: Notification['category']): Promise<void> {
    try {
      let query = `
        UPDATE notifications
        SET read_at = NOW(), updated_at = NOW()
        WHERE user_id = $1 AND read_at IS NULL
      `
      const params = [userId]

      if (category) {
        query += ` AND category = $2`
        params.push(category)
      }

      await this.customQuery(query, params)

      console.log(`✅ All notifications marked as read for user ${userId}`)
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error)
      throw error
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, category: Notification['category'], preferences: Partial<NotificationPreference>): Promise<void> {
    try {
      const existingPrefs = await this.getUserPreferences(userId, category)

      if (existingPrefs) {
        // Update existing preferences
        const updateFields: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (preferences.channels) {
          updateFields.push(`channels = $${paramIndex++}`)
          values.push(JSON.stringify(preferences.channels))
        }

        if (preferences.quietHours) {
          updateFields.push(`quiet_hours = $${paramIndex++}`)
          values.push(JSON.stringify(preferences.quietHours))
        }

        if (preferences.frequency) {
          updateFields.push(`frequency = $${paramIndex++}`)
          values.push(preferences.frequency)
        }

        updateFields.push(`updated_at = NOW()`)
        values.push(existingPrefs.id)

        const query = `
          UPDATE notification_preferences
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `

        await this.customQuery(query, values)
      } else {
        // Create new preferences
        const prefId = this.generateId()

        const query = `
          INSERT INTO notification_preferences (
            id, user_id, category, channels, quiet_hours, frequency, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `

        await this.customQuery(query, [
          prefId,
          userId,
          category,
          JSON.stringify(preferences.channels || []),
          preferences.quietHours ? JSON.stringify(preferences.quietHours) : null,
          preferences.frequency || 'immediate',
          preferences.metadata ? JSON.stringify(preferences.metadata) : null
        ])
      }

      console.log(`✅ Notification preferences updated for user ${userId}, category ${category}`)
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error)
      throw error
    }
  }

  /**
   * Get user's notification preferences
   */
  async getUserPreferences(userId: string, category: Notification['category']): Promise<NotificationPreference | null> {
    try {
      const query = `
        SELECT * FROM notification_preferences
        WHERE user_id = $1 AND category = $2
      `

      const result = await this.customQuery(query, [userId, category])

      if (result.length === 0) {
        return null
      }

      return this.mapDatabaseRowToPreference(result[0])
    } catch (error) {
      console.error('❌ Error getting user preferences:', error)
      return null
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const query = `
        SELECT * FROM notifications
        WHERE status = 'pending' AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
        LIMIT 100
      `

      const result = await this.customQuery(query, [])
      const notifications = result.map(row => this.mapDatabaseRowToNotification(row))

      for (const notification of notifications) {
        await this.processNotificationChannels(notification)
      }

      console.log(`✅ Processed ${notifications.length} scheduled notifications`)
    } catch (error) {
      console.error('❌ Error processing scheduled notifications:', error)
    }
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(userId?: string, days: number = 30): Promise<any> {
    try {
      let query = `
        SELECT
          category,
          type,
          status,
          COUNT(*) as count,
          AVG(CASE WHEN read_at IS NOT NULL THEN 1 ELSE 0 END) as read_rate
        FROM notifications
        WHERE created_at > NOW() - INTERVAL '${days} days'
      `
      const params: any[] = []

      if (userId) {
        query += ` AND user_id = $1`
        params.push(userId)
      }

      query += ` GROUP BY category, type, status ORDER BY count DESC`

      const result = await this.customQuery(query, params)
      return result
    } catch (error) {
      console.error('❌ Error getting notification analytics:', error)
      return []
    }
  }

  /**
   * Process notification channels (send via different methods)
   */
  private async processNotificationChannels(notification: Notification): Promise<void> {
    try {
      const updatedChannels = [...notification.channels]

      for (let i = 0; i < updatedChannels.length; i++) {
        const channel = updatedChannels[i]

        try {
          switch (channel.type) {
            case 'email':
              await this.sendEmailNotification(notification, channel.address)
              break
            case 'sms':
              await this.sendSMSNotification(notification, channel.address)
              break
            case 'push':
              await this.sendPushNotification(notification, channel.address)
              break
            case 'webhook':
              await this.sendWebhookNotification(notification, channel.address)
              break
            case 'in_app':
              // In-app notifications are stored in database and don't need external sending
              break
          }

          channel.status = 'sent'
          channel.sentAt = new Date()
        } catch (error) {
          console.error(`❌ Failed to send ${channel.type} notification:`, error)
          channel.status = 'failed'
          channel.error = error.message
        }
      }

      // Update notification status and channels
      const query = `
        UPDATE notifications
        SET status = $1, channels = $2, updated_at = NOW()
        WHERE id = $3
      `

      const allSent = updatedChannels.every(ch => ch.status === 'sent')
      const newStatus = allSent ? 'sent' : 'failed'

      await this.customQuery(query, [newStatus, JSON.stringify(updatedChannels), notification.id])
    } catch (error) {
      console.error('❌ Error processing notification channels:', error)
    }
  }

  /**
   * Send email notification (placeholder - integrate with email service)
   */
  private async sendEmailNotification(notification: Notification, email: string): Promise<void> {
    // Integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Sending email to ${email}: ${notification.title}`)

    // Example integration:
    // await emailService.send({
    //   to: email,
    //   subject: notification.title,
    //   html: notification.message,
    //   actionUrl: notification.actionUrl
    // })
  }

  /**
   * Send SMS notification (placeholder - integrate with SMS service)
   */
  private async sendSMSNotification(notification: Notification, phone: string): Promise<void> {
    // Integrate with your SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 Sending SMS to ${phone}: ${notification.title}`)

    // Example integration:
    // await smsService.send({
    //   to: phone,
    //   message: `${notification.title}: ${notification.message}`
    // })
  }

  /**
   * Send push notification (placeholder - integrate with push service)
   */
  private async sendPushNotification(notification: Notification, deviceToken: string): Promise<void> {
    // Integrate with your push service (Firebase, AWS SNS, etc.)
    console.log(`🔔 Sending push to ${deviceToken}: ${notification.title}`)

    // Example integration:
    // await pushService.send({
    //   to: deviceToken,
    //   title: notification.title,
    //   body: notification.message,
    //   data: notification.data
    // })
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(notification: Notification, webhookUrl: string): Promise<void> {
    console.log(`🎣 Sending webhook to ${webhookUrl}: ${notification.title}`)

    // Example webhook implementation:
    // const response = await fetch(webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     id: notification.id,
    //     title: notification.title,
    //     message: notification.message,
    //     category: notification.category,
    //     priority: notification.priority,
    //     data: notification.data
    //   })
    // })

    // if (!response.ok) {
    //   throw new Error(`Webhook failed: ${response.statusText}`)
    // }
  }

  /**
   * Get template by name
   */
  private async getTemplateByName(name: string): Promise<NotificationTemplate | null> {
    try {
      const query = `
        SELECT * FROM notification_templates
        WHERE name = $1 AND is_active = true
      `

      const result = await this.customQuery(query, [name])

      if (result.length === 0) {
        return null
      }

      return this.mapDatabaseRowToTemplate(result[0])
    } catch (error) {
      console.error('❌ Error getting template by name:', error)
      return null
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(now: Date, quietHours: NotificationPreference['quietHours']): boolean {
    if (!quietHours) return false

    // This is a simplified implementation - you'd want to handle timezones properly
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    return currentTime >= quietHours.start && currentTime <= quietHours.end
  }

  /**
   * Calculate when to send after quiet hours
   */
  private calculateAfterQuietHours(now: Date, quietHours: NotificationPreference['quietHours']): Date {
    if (!quietHours) return now

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [endHour, endMinute] = quietHours.end.split(':').map(Number)
    tomorrow.setHours(endHour, endMinute, 0, 0)

    return tomorrow
  }

  /**
   * Ensure required tables exist
   */
  async ensureNotificationTables(): Promise<void> {
    try {
      const createTablesQuery = `
        -- Notifications Table
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL,
          category VARCHAR(50) NOT NULL,
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          action_url TEXT,
          action_text VARCHAR(100),
          data JSONB,
          channels JSONB NOT NULL,
          scheduled_for TIMESTAMPTZ,
          expires_at TIMESTAMPTZ,
          read_at TIMESTAMPTZ,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Notification Templates Table
        CREATE TABLE IF NOT EXISTS notification_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          category VARCHAR(50) NOT NULL,
          type VARCHAR(20) NOT NULL,
          subject VARCHAR(255),
          template TEXT NOT NULL,
          variables TEXT[] NOT NULL DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Notification Preferences Table
        CREATE TABLE IF NOT EXISTS notification_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          channels JSONB NOT NULL,
          quiet_hours JSONB,
          frequency VARCHAR(20) NOT NULL DEFAULT 'immediate',
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, category)
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
        CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
        CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
        CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
        CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
        CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
      `

      await this.customQuery(createTablesQuery, [])
      console.log('✅ Notification tables ensured')
    } catch (error) {
      console.warn('⚠️ Could not ensure notification tables exist:', error.message)
    }
  }

  /**
   * Map database row to Notification object
   */
  private mapDatabaseRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      category: row.category,
      priority: row.priority,
      status: row.status,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      actionText: row.action_text,
      data: row.data ? JSON.parse(row.data) : undefined,
      channels: JSON.parse(row.channels),
      scheduledFor: row.scheduled_for ? new Date(row.scheduled_for) : undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      readAt: row.read_at ? new Date(row.read_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  /**
   * Map database row to NotificationTemplate object
   */
  private mapDatabaseRowToTemplate(row: any): NotificationTemplate {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      type: row.type,
      subject: row.subject,
      template: row.template,
      variables: row.variables,
      isActive: row.is_active,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  /**
   * Map database row to NotificationPreference object
   */
  private mapDatabaseRowToPreference(row: any): NotificationPreference {
    return {
      id: row.id,
      userId: row.user_id,
      category: row.category,
      channels: JSON.parse(row.channels),
      quietHours: row.quiet_hours ? JSON.parse(row.quiet_hours) : undefined,
      frequency: row.frequency,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService