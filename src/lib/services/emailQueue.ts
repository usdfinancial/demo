import { emailService, EmailRecipient, WelcomeEmailData } from './emailService'

// Email job types
export interface EmailJob {
  id: string
  type: 'welcome' | 'verification' | 'password-reset' | 'marketing'
  recipient: EmailRecipient
  data: any
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  scheduledFor?: string
  attempts: number
  maxAttempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  lastError?: string
  completedAt?: string
}

// Welcome email specific job
export interface WelcomeEmailJob extends Omit<EmailJob, 'data'> {
  type: 'welcome'
  data: WelcomeEmailData
}

class EmailQueue {
  private queue: EmailJob[] = []
  private processing = false
  private processingInterval: NodeJS.Timeout | null = null
  private readonly PROCESSING_INTERVAL = 5000 // 5 seconds
  private readonly MAX_CONCURRENT_EMAILS = 10

  constructor() {
    this.startProcessing()
  }

  /**
   * Add welcome email to queue
   */
  async queueWelcomeEmail(
    recipient: EmailRecipient, 
    data: WelcomeEmailData, 
    options: {
      priority?: 'high' | 'medium' | 'low'
      scheduledFor?: Date
      maxAttempts?: number
    } = {}
  ): Promise<string> {
    const jobId = this.generateJobId('welcome', recipient.email)
    
    const job: WelcomeEmailJob = {
      id: jobId,
      type: 'welcome',
      recipient,
      data,
      priority: options.priority || 'high', // Welcome emails are high priority
      createdAt: new Date().toISOString(),
      scheduledFor: options.scheduledFor?.toISOString(),
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      status: 'pending'
    }

    // Add to queue in priority order
    this.addToQueue(job)
    
    console.log(`📮 Welcome email queued for ${recipient.email} (ID: ${jobId})`)
    return jobId
  }

  /**
   * Add job to queue with priority sorting
   */
  private addToQueue(job: EmailJob): void {
    this.queue.push(job)
    
    // Sort by priority (high -> medium -> low) then by creation time
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  /**
   * Start processing the queue
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }

    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.queue.length > 0) {
        await this.processQueue()
      }
    }, this.PROCESSING_INTERVAL)

    console.log('📬 Email queue processing started')
  }

  /**
   * Process pending emails in the queue
   */
  private async processQueue(): Promise<void> {
    this.processing = true
    
    try {
      // Get pending jobs that are ready to process
      const readyJobs = this.queue.filter(job => 
        job.status === 'pending' && 
        (!job.scheduledFor || new Date(job.scheduledFor) <= new Date()) &&
        job.attempts < job.maxAttempts
      ).slice(0, this.MAX_CONCURRENT_EMAILS)

      if (readyJobs.length === 0) {
        this.processing = false
        return
      }

      console.log(`📤 Processing ${readyJobs.length} email(s) from queue`)

      // Process jobs concurrently
      const processingPromises = readyJobs.map(job => this.processJob(job))
      await Promise.allSettled(processingPromises)

      // Clean up completed/failed jobs older than 24 hours
      this.cleanupOldJobs()

    } catch (error) {
      console.error('Email queue processing error:', error)
    } finally {
      this.processing = false
    }
  }

  /**
   * Process individual email job
   */
  private async processJob(job: EmailJob): Promise<void> {
    const jobIndex = this.queue.findIndex(j => j.id === job.id)
    if (jobIndex === -1) return

    // Update job status
    this.queue[jobIndex].status = 'processing'
    this.queue[jobIndex].attempts += 1

    try {
      let result
      
      // Send email based on job type
      switch (job.type) {
        case 'welcome':
          result = await emailService.sendWelcomeEmail(job.recipient, job.data as WelcomeEmailData)
          break
        default:
          throw new Error(`Unsupported email type: ${job.type}`)
      }

      if (result.success) {
        // Mark as completed
        this.queue[jobIndex].status = 'completed'
        this.queue[jobIndex].completedAt = new Date().toISOString()
        console.log(`✅ Email job ${job.id} completed successfully`)
      } else {
        throw new Error(result.error || 'Email sending failed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.queue[jobIndex].lastError = errorMessage

      // Check if we should retry
      if (this.queue[jobIndex].attempts >= this.queue[jobIndex].maxAttempts) {
        this.queue[jobIndex].status = 'failed'
        console.error(`❌ Email job ${job.id} failed after ${job.maxAttempts} attempts: ${errorMessage}`)
      } else {
        this.queue[jobIndex].status = 'pending'
        console.warn(`⚠️ Email job ${job.id} attempt ${this.queue[jobIndex].attempts} failed, will retry: ${errorMessage}`)
      }
    }
  }

  /**
   * Clean up old completed/failed jobs
   */
  private cleanupOldJobs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const initialLength = this.queue.length
    
    this.queue = this.queue.filter(job => {
      const jobDate = new Date(job.completedAt || job.createdAt)
      return job.status === 'pending' || job.status === 'processing' || jobDate > oneDayAgo
    })

    const removed = initialLength - this.queue.length
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} old email job(s)`)
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): EmailJob | null {
    return this.queue.find(job => job.id === jobId) || null
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    nextScheduled?: string
  } {
    const stats = {
      total: this.queue.length,
      pending: this.queue.filter(j => j.status === 'pending').length,
      processing: this.queue.filter(j => j.status === 'processing').length,
      completed: this.queue.filter(j => j.status === 'completed').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
      nextScheduled: undefined as string | undefined
    }

    // Find next scheduled job
    const nextScheduled = this.queue
      .filter(j => j.scheduledFor && j.status === 'pending')
      .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())[0]
    
    if (nextScheduled) {
      stats.nextScheduled = nextScheduled.scheduledFor
    }

    return stats
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(type: string, email: string): string {
    const timestamp = Date.now()
    const hash = email.split('@')[0].slice(0, 4)
    return `${type}_${hash}_${timestamp}`
  }

  /**
   * Stop queue processing (for cleanup)
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log('📪 Email queue processing stopped')
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const jobIndex = this.queue.findIndex(j => j.id === jobId)
    if (jobIndex === -1 || this.queue[jobIndex].status !== 'failed') {
      return false
    }

    // Reset job for retry
    this.queue[jobIndex].status = 'pending'
    this.queue[jobIndex].attempts = 0
    this.queue[jobIndex].lastError = undefined

    console.log(`🔄 Retrying email job ${jobId}`)
    return true
  }

  /**
   * Cancel pending job
   */
  cancelJob(jobId: string): boolean {
    const jobIndex = this.queue.findIndex(j => j.id === jobId)
    if (jobIndex === -1 || this.queue[jobIndex].status !== 'pending') {
      return false
    }

    this.queue.splice(jobIndex, 1)
    console.log(`❌ Cancelled email job ${jobId}`)
    return true
  }
}

// Export singleton instance
export const emailQueue = new EmailQueue()
export default emailQueue