import { BaseService } from './baseService'

export interface InsurancePolicy {
  id: string
  userId: string
  policyType: 'crypto_custody' | 'smart_contract' | 'professional_liability' | 'general_liability' | 'cyber_security'
  provider: string
  policyNumber: string
  status: 'active' | 'pending' | 'cancelled' | 'expired' | 'suspended'
  coverageAmount: number
  deductible: number
  premiumAmount: number
  premiumFrequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual'
  effectiveDate: Date
  expirationDate: Date
  nextPremiumDue?: Date
  coveredAssets?: string[] // For crypto/asset-specific coverage
  beneficiaries?: Array<{
    name: string
    relationship: string
    percentage: number
    address?: string
  }>
  terms?: Record<string, any>
  documents?: Array<{
    type: string
    url: string
    uploadedAt: Date
  }>
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface InsuranceClaim {
  id: string
  policyId: string
  userId: string
  claimNumber: string
  claimType: 'theft' | 'smart_contract_failure' | 'custody_loss' | 'professional_error' | 'cyber_attack' | 'other'
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'settled' | 'closed'
  incidentDate: Date
  reportedDate: Date
  claimedAmount: number
  approvedAmount?: number
  settlementAmount?: number
  description: string
  evidence?: Array<{
    type: 'document' | 'photo' | 'video' | 'transaction_hash' | 'other'
    url: string
    description?: string
    uploadedAt: Date
  }>
  adjusterNotes?: string
  settlement?: {
    amount: number
    method: 'check' | 'wire' | 'crypto' | 'credit'
    date: Date
    transactionId?: string
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface PremiumPayment {
  id: string
  policyId: string
  userId: string
  amount: number
  dueDate: Date
  paidDate?: Date
  status: 'scheduled' | 'paid' | 'overdue' | 'partial' | 'failed'
  paymentMethod?: 'card' | 'bank_transfer' | 'crypto' | 'automatic'
  transactionId?: string
  lateFee?: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CreatePolicyRequest {
  userId: string
  policyType: InsurancePolicy['policyType']
  provider: string
  policyNumber: string
  coverageAmount: number
  deductible: number
  premiumAmount: number
  premiumFrequency: InsurancePolicy['premiumFrequency']
  effectiveDate: Date
  expirationDate: Date
  coveredAssets?: string[]
  beneficiaries?: InsurancePolicy['beneficiaries']
  terms?: Record<string, any>
  metadata?: Record<string, any>
}

export interface CreateClaimRequest {
  policyId: string
  userId: string
  claimType: InsuranceClaim['claimType']
  incidentDate: Date
  claimedAmount: number
  description: string
  evidence?: InsuranceClaim['evidence']
  metadata?: Record<string, any>
}

/**
 * Insurance Service - Comprehensive insurance management for USD Financial
 *
 * Handles:
 * - Crypto custody insurance
 * - Smart contract insurance
 * - Professional liability
 * - General business insurance
 * - Cyber security coverage
 * - Claims processing and tracking
 */
class InsuranceService extends BaseService {
  constructor() {
    super('insurance_policies')
  }

  /**
   * Create a new insurance policy
   */
  async createPolicy(data: CreatePolicyRequest): Promise<InsurancePolicy> {
    try {
      await this.ensureInsuranceTables()

      const policyId = this.generateId()

      // Calculate next premium due date
      const nextPremiumDue = this.calculateNextPremiumDate(data.effectiveDate, data.premiumFrequency)

      const query = `
        INSERT INTO insurance_policies (
          id, user_id, policy_type, provider, policy_number, status,
          coverage_amount, deductible, premium_amount, premium_frequency,
          effective_date, expiration_date, next_premium_due, covered_assets,
          beneficiaries, terms, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        policyId,
        data.userId,
        data.policyType,
        data.provider,
        data.policyNumber,
        'pending', // initial status
        data.coverageAmount,
        data.deductible,
        data.premiumAmount,
        data.premiumFrequency,
        data.effectiveDate,
        data.expirationDate,
        nextPremiumDue,
        data.coveredAssets ? JSON.stringify(data.coveredAssets) : null,
        data.beneficiaries ? JSON.stringify(data.beneficiaries) : null,
        data.terms ? JSON.stringify(data.terms) : null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ])

      if (result.length === 0) {
        throw new Error('Failed to create insurance policy')
      }

      console.log('✅ Insurance policy created:', {
        policyId,
        userId: data.userId,
        type: data.policyType,
        provider: data.provider,
        coverage: data.coverageAmount
      })

      // Create initial premium payment schedule
      await this.createPremiumSchedule(policyId, data)

      return this.mapDatabaseRowToPolicy(result[0])
    } catch (error) {
      console.error('❌ Error creating insurance policy:', error)
      throw error
    }
  }

  /**
   * Get user's insurance policies
   */
  async getUserPolicies(userId: string, includeInactive: boolean = false): Promise<InsurancePolicy[]> {
    try {
      let query = `
        SELECT * FROM insurance_policies
        WHERE user_id = $1
      `

      const params = [userId]

      if (!includeInactive) {
        query += ` AND status IN ('active', 'pending')`
      }

      query += ` ORDER BY created_at DESC`

      const result = await this.customQuery(query, params)
      return result.map(row => this.mapDatabaseRowToPolicy(row))
    } catch (error) {
      console.error('❌ Error getting user policies:', error)
      return []
    }
  }

  /**
   * Update policy status
   */
  async updatePolicyStatus(policyId: string, status: InsurancePolicy['status']): Promise<void> {
    try {
      const query = `
        UPDATE insurance_policies
        SET status = $1, updated_at = NOW()
        WHERE id = $2
      `

      await this.customQuery(query, [status, policyId])

      console.log(`✅ Policy ${policyId} status updated to: ${status}`)
    } catch (error) {
      console.error('❌ Error updating policy status:', error)
      throw error
    }
  }

  /**
   * Submit an insurance claim
   */
  async submitClaim(data: CreateClaimRequest): Promise<InsuranceClaim> {
    try {
      const claimId = this.generateId()
      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      const query = `
        INSERT INTO insurance_claims (
          id, policy_id, user_id, claim_number, claim_type, status,
          incident_date, reported_date, claimed_amount, description,
          evidence, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        claimId,
        data.policyId,
        data.userId,
        claimNumber,
        data.claimType,
        'submitted',
        data.incidentDate,
        data.claimedAmount,
        data.description,
        data.evidence ? JSON.stringify(data.evidence) : null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ])

      if (result.length === 0) {
        throw new Error('Failed to submit claim')
      }

      console.log('✅ Insurance claim submitted:', {
        claimId,
        claimNumber,
        policyId: data.policyId,
        type: data.claimType,
        amount: data.claimedAmount
      })

      return this.mapDatabaseRowToClaim(result[0])
    } catch (error) {
      console.error('❌ Error submitting claim:', error)
      throw error
    }
  }

  /**
   * Get policy claims
   */
  async getPolicyClaims(policyId: string): Promise<InsuranceClaim[]> {
    try {
      const query = `
        SELECT * FROM insurance_claims
        WHERE policy_id = $1
        ORDER BY created_at DESC
      `

      const result = await this.customQuery(query, [policyId])
      return result.map(row => this.mapDatabaseRowToClaim(row))
    } catch (error) {
      console.error('❌ Error getting policy claims:', error)
      return []
    }
  }

  /**
   * Get user's claims
   */
  async getUserClaims(userId: string): Promise<InsuranceClaim[]> {
    try {
      const query = `
        SELECT c.*, p.policy_type, p.provider
        FROM insurance_claims c
        JOIN insurance_policies p ON c.policy_id = p.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `

      const result = await this.customQuery(query, [userId])
      return result.map(row => this.mapDatabaseRowToClaim(row))
    } catch (error) {
      console.error('❌ Error getting user claims:', error)
      return []
    }
  }

  /**
   * Update claim status
   */
  async updateClaim(
    claimId: string,
    updates: {
      status?: InsuranceClaim['status']
      approvedAmount?: number
      adjusterNotes?: string
      settlement?: InsuranceClaim['settlement']
    }
  ): Promise<void> {
    try {
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (updates.status) {
        updateFields.push(`status = $${paramIndex++}`)
        values.push(updates.status)
      }

      if (updates.approvedAmount !== undefined) {
        updateFields.push(`approved_amount = $${paramIndex++}`)
        values.push(updates.approvedAmount)
      }

      if (updates.adjusterNotes) {
        updateFields.push(`adjuster_notes = $${paramIndex++}`)
        values.push(updates.adjusterNotes)
      }

      if (updates.settlement) {
        updateFields.push(`settlement = $${paramIndex++}`)
        values.push(JSON.stringify(updates.settlement))

        if (updates.settlement.amount) {
          updateFields.push(`settlement_amount = $${paramIndex++}`)
          values.push(updates.settlement.amount)
        }
      }

      updateFields.push(`updated_at = NOW()`)
      values.push(claimId)

      const query = `
        UPDATE insurance_claims
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `

      await this.customQuery(query, values)

      console.log(`✅ Claim ${claimId} updated`)
    } catch (error) {
      console.error('❌ Error updating claim:', error)
      throw error
    }
  }

  /**
   * Record premium payment
   */
  async recordPremiumPayment(
    policyId: string,
    amount: number,
    paymentMethod: string,
    transactionId?: string
  ): Promise<void> {
    try {
      // Find the next scheduled payment
      const scheduledPayment = await this.getNextScheduledPayment(policyId)

      if (scheduledPayment) {
        // Update the scheduled payment
        const query = `
          UPDATE premium_payments
          SET status = 'paid', paid_date = NOW(), payment_method = $1, transaction_id = $2, updated_at = NOW()
          WHERE id = $3
        `

        await this.customQuery(query, [paymentMethod, transactionId, scheduledPayment.id])

        // Update policy next premium due date
        await this.updateNextPremiumDue(policyId)

        console.log(`✅ Premium payment recorded for policy ${policyId}: ${amount}`)
      } else {
        console.warn(`⚠️ No scheduled payment found for policy ${policyId}`)
      }
    } catch (error) {
      console.error('❌ Error recording premium payment:', error)
      throw error
    }
  }

  /**
   * Get policy premium payments
   */
  async getPremiumPayments(policyId: string): Promise<PremiumPayment[]> {
    try {
      const query = `
        SELECT * FROM premium_payments
        WHERE policy_id = $1
        ORDER BY due_date DESC
      `

      const result = await this.customQuery(query, [policyId])
      return result.map(row => this.mapDatabaseRowToPremiumPayment(row))
    } catch (error) {
      console.error('❌ Error getting premium payments:', error)
      return []
    }
  }

  /**
   * Get upcoming premium payments for user
   */
  async getUpcomingPremiums(userId: string, daysAhead: number = 30): Promise<PremiumPayment[]> {
    try {
      const query = `
        SELECT pp.*, ip.policy_type, ip.provider
        FROM premium_payments pp
        JOIN insurance_policies ip ON pp.policy_id = ip.id
        WHERE pp.user_id = $1
          AND pp.status = 'scheduled'
          AND pp.due_date <= NOW() + INTERVAL '${daysAhead} days'
        ORDER BY pp.due_date ASC
      `

      const result = await this.customQuery(query, [userId])
      return result.map(row => this.mapDatabaseRowToPremiumPayment(row))
    } catch (error) {
      console.error('❌ Error getting upcoming premiums:', error)
      return []
    }
  }

  /**
   * Get insurance analytics for user
   */
  async getInsuranceAnalytics(userId: string): Promise<any> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_policies,
          SUM(CASE WHEN status = 'active' THEN coverage_amount ELSE 0 END) as total_coverage,
          SUM(CASE WHEN status = 'active' THEN premium_amount ELSE 0 END) as annual_premiums,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies,
          (SELECT COUNT(*) FROM insurance_claims WHERE user_id = $1) as total_claims,
          (SELECT COUNT(*) FROM insurance_claims WHERE user_id = $1 AND status IN ('submitted', 'under_review')) as pending_claims
        FROM insurance_policies
        WHERE user_id = $1
      `

      const result = await this.customQuery(query, [userId])
      return result[0] || {}
    } catch (error) {
      console.error('❌ Error getting insurance analytics:', error)
      return {}
    }
  }

  /**
   * Create premium payment schedule
   */
  private async createPremiumSchedule(policyId: string, policyData: CreatePolicyRequest): Promise<void> {
    try {
      const payments: any[] = []
      let currentDate = new Date(policyData.effectiveDate)
      const endDate = new Date(policyData.expirationDate)

      while (currentDate < endDate) {
        currentDate = this.calculateNextPremiumDate(currentDate, policyData.premiumFrequency)

        if (currentDate <= endDate) {
          payments.push([
            this.generateId(),
            policyId,
            policyData.userId,
            policyData.premiumAmount,
            currentDate,
            'scheduled'
          ])
        }
      }

      if (payments.length > 0) {
        const placeholders = payments.map((_, index) => {
          const start = index * 6 + 1
          return `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, NOW(), NOW())`
        }).join(', ')

        const query = `
          INSERT INTO premium_payments (
            id, policy_id, user_id, amount, due_date, status, created_at, updated_at
          ) VALUES ${placeholders}
        `

        await this.customQuery(query, payments.flat())

        console.log(`✅ Premium schedule created for policy ${policyId}: ${payments.length} payments`)
      }
    } catch (error) {
      console.error('❌ Error creating premium schedule:', error)
    }
  }

  /**
   * Calculate next premium due date
   */
  private calculateNextPremiumDate(fromDate: Date, frequency: InsurancePolicy['premiumFrequency']): Date {
    const nextDate = new Date(fromDate)

    switch (frequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case 'semi_annual':
        nextDate.setMonth(nextDate.getMonth() + 6)
        break
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }

    return nextDate
  }

  /**
   * Get next scheduled payment for policy
   */
  private async getNextScheduledPayment(policyId: string): Promise<PremiumPayment | null> {
    try {
      const query = `
        SELECT * FROM premium_payments
        WHERE policy_id = $1 AND status = 'scheduled'
        ORDER BY due_date ASC
        LIMIT 1
      `

      const result = await this.customQuery(query, [policyId])

      if (result.length === 0) {
        return null
      }

      return this.mapDatabaseRowToPremiumPayment(result[0])
    } catch (error) {
      console.error('❌ Error getting next scheduled payment:', error)
      return null
    }
  }

  /**
   * Update next premium due date for policy
   */
  private async updateNextPremiumDue(policyId: string): Promise<void> {
    const nextPayment = await this.getNextScheduledPayment(policyId)

    const query = `
      UPDATE insurance_policies
      SET next_premium_due = $1, updated_at = NOW()
      WHERE id = $2
    `

    await this.customQuery(query, [nextPayment?.dueDate || null, policyId])
  }

  /**
   * Ensure required tables exist
   */
  async ensureInsuranceTables(): Promise<void> {
    try {
      const createTablesQuery = `
        -- Insurance Policies Table
        CREATE TABLE IF NOT EXISTS insurance_policies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          policy_type VARCHAR(50) NOT NULL,
          provider VARCHAR(100) NOT NULL,
          policy_number VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          coverage_amount DECIMAL(15,2) NOT NULL,
          deductible DECIMAL(10,2) NOT NULL,
          premium_amount DECIMAL(10,2) NOT NULL,
          premium_frequency VARCHAR(20) NOT NULL,
          effective_date TIMESTAMPTZ NOT NULL,
          expiration_date TIMESTAMPTZ NOT NULL,
          next_premium_due TIMESTAMPTZ,
          covered_assets JSONB,
          beneficiaries JSONB,
          terms JSONB,
          documents JSONB,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Insurance Claims Table
        CREATE TABLE IF NOT EXISTS insurance_claims (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          claim_number VARCHAR(50) NOT NULL UNIQUE,
          claim_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'submitted',
          incident_date TIMESTAMPTZ NOT NULL,
          reported_date TIMESTAMPTZ NOT NULL,
          claimed_amount DECIMAL(15,2) NOT NULL,
          approved_amount DECIMAL(15,2),
          settlement_amount DECIMAL(15,2),
          description TEXT NOT NULL,
          evidence JSONB,
          adjuster_notes TEXT,
          settlement JSONB,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Premium Payments Table
        CREATE TABLE IF NOT EXISTS premium_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          due_date TIMESTAMPTZ NOT NULL,
          paid_date TIMESTAMPTZ,
          status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
          payment_method VARCHAR(50),
          transaction_id VARCHAR(255),
          late_fee DECIMAL(8,2),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON insurance_policies(user_id);
        CREATE INDEX IF NOT EXISTS idx_insurance_policies_status ON insurance_policies(status);
        CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy_id ON insurance_claims(policy_id);
        CREATE INDEX IF NOT EXISTS idx_insurance_claims_user_id ON insurance_claims(user_id);
        CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
        CREATE INDEX IF NOT EXISTS idx_premium_payments_policy_id ON premium_payments(policy_id);
        CREATE INDEX IF NOT EXISTS idx_premium_payments_due_date ON premium_payments(due_date);
        CREATE INDEX IF NOT EXISTS idx_premium_payments_status ON premium_payments(status);
      `

      await this.customQuery(createTablesQuery, [])
      console.log('✅ Insurance tables ensured')
    } catch (error) {
      console.warn('⚠️ Could not ensure insurance tables exist:', error.message)
    }
  }

  /**
   * Map database row to InsurancePolicy object
   */
  private mapDatabaseRowToPolicy(row: any): InsurancePolicy {
    return {
      id: row.id,
      userId: row.user_id,
      policyType: row.policy_type,
      provider: row.provider,
      policyNumber: row.policy_number,
      status: row.status,
      coverageAmount: parseFloat(row.coverage_amount),
      deductible: parseFloat(row.deductible),
      premiumAmount: parseFloat(row.premium_amount),
      premiumFrequency: row.premium_frequency,
      effectiveDate: new Date(row.effective_date),
      expirationDate: new Date(row.expiration_date),
      nextPremiumDue: row.next_premium_due ? new Date(row.next_premium_due) : undefined,
      coveredAssets: row.covered_assets ? JSON.parse(row.covered_assets) : undefined,
      beneficiaries: row.beneficiaries ? JSON.parse(row.beneficiaries) : undefined,
      terms: row.terms ? JSON.parse(row.terms) : undefined,
      documents: row.documents ? JSON.parse(row.documents) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  /**
   * Map database row to InsuranceClaim object
   */
  private mapDatabaseRowToClaim(row: any): InsuranceClaim {
    return {
      id: row.id,
      policyId: row.policy_id,
      userId: row.user_id,
      claimNumber: row.claim_number,
      claimType: row.claim_type,
      status: row.status,
      incidentDate: new Date(row.incident_date),
      reportedDate: new Date(row.reported_date),
      claimedAmount: parseFloat(row.claimed_amount),
      approvedAmount: row.approved_amount ? parseFloat(row.approved_amount) : undefined,
      settlementAmount: row.settlement_amount ? parseFloat(row.settlement_amount) : undefined,
      description: row.description,
      evidence: row.evidence ? JSON.parse(row.evidence) : undefined,
      adjusterNotes: row.adjuster_notes,
      settlement: row.settlement ? JSON.parse(row.settlement) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  /**
   * Map database row to PremiumPayment object
   */
  private mapDatabaseRowToPremiumPayment(row: any): PremiumPayment {
    return {
      id: row.id,
      policyId: row.policy_id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      dueDate: new Date(row.due_date),
      paidDate: row.paid_date ? new Date(row.paid_date) : undefined,
      status: row.status,
      paymentMethod: row.payment_method,
      transactionId: row.transaction_id,
      lateFee: row.late_fee ? parseFloat(row.late_fee) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}

// Export singleton instance
export const insuranceService = new InsuranceService()
export default insuranceService