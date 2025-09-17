import { BaseService } from './baseService'

export interface Loan {
  id: string
  userId: string
  loanType: 'personal' | 'crypto_backed' | 'margin' | 'business' | 'mortgage'
  principalAmount: number
  currentBalance: number
  interestRate: number
  termMonths: number
  status: 'pending' | 'approved' | 'active' | 'paid_off' | 'defaulted' | 'refinanced'
  collateralType?: 'crypto' | 'cash' | 'securities' | 'real_estate'
  collateralValue?: number
  collateralSymbol?: string
  ltv?: number // Loan-to-Value ratio
  monthlyPayment: number
  nextPaymentDate?: Date
  originationDate: Date
  maturityDate: Date
  purpose?: string
  creditScore?: number
  documentation?: Record<string, any>
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface LoanPayment {
  id: string
  loanId: string
  userId: string
  amount: number
  principalAmount: number
  interestAmount: number
  paymentDate: Date
  dueDate: Date
  status: 'scheduled' | 'paid' | 'late' | 'missed' | 'partial'
  paymentMethod?: 'card' | 'bank_transfer' | 'crypto' | 'automatic'
  transactionId?: string
  lateFee?: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CreateLoanRequest {
  userId: string
  loanType: Loan['loanType']
  principalAmount: number
  interestRate: number
  termMonths: number
  collateralType?: Loan['collateralType']
  collateralValue?: number
  collateralSymbol?: string
  purpose?: string
  creditScore?: number
  documentation?: Record<string, any>
  metadata?: Record<string, any>
}

export interface CreatePaymentRequest {
  loanId: string
  userId: string
  amount: number
  principalAmount: number
  interestAmount: number
  dueDate: Date
  paymentMethod?: LoanPayment['paymentMethod']
  transactionId?: string
  lateFee?: number
  metadata?: Record<string, any>
}

/**
 * Loan Service - Comprehensive loan management for USD Financial
 *
 * Handles:
 * - Traditional personal loans
 * - Crypto-backed lending
 * - Margin lending
 * - Business loans
 * - Payment tracking and amortization
 */
class LoanService extends BaseService {
  constructor() {
    super('loans')
  }

  /**
   * Create a new loan application
   */
  async createLoan(data: CreateLoanRequest): Promise<Loan> {
    try {
      await this.ensureLoanTables()

      const loanId = this.generateId()
      const monthlyPayment = this.calculateMonthlyPayment(
        data.principalAmount,
        data.interestRate,
        data.termMonths
      )

      const originationDate = new Date()
      const maturityDate = new Date()
      maturityDate.setMonth(maturityDate.getMonth() + data.termMonths)

      // Calculate LTV if collateral is provided
      let ltv: number | null = null
      if (data.collateralValue && data.collateralValue > 0) {
        ltv = (data.principalAmount / data.collateralValue) * 100
      }

      const query = `
        INSERT INTO loans (
          id, user_id, loan_type, principal_amount, current_balance, interest_rate,
          term_months, status, collateral_type, collateral_value, collateral_symbol,
          ltv, monthly_payment, origination_date, maturity_date, purpose,
          credit_score, documentation, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        loanId,
        data.userId,
        data.loanType,
        data.principalAmount,
        data.principalAmount, // current_balance starts as principal
        data.interestRate,
        data.termMonths,
        'pending', // initial status
        data.collateralType || null,
        data.collateralValue || null,
        data.collateralSymbol || null,
        ltv,
        monthlyPayment,
        originationDate,
        maturityDate,
        data.purpose || null,
        data.creditScore || null,
        data.documentation ? JSON.stringify(data.documentation) : null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ])

      if (result.length === 0) {
        throw new Error('Failed to create loan')
      }

      console.log('✅ Loan created:', {
        loanId,
        userId: data.userId,
        type: data.loanType,
        amount: data.principalAmount,
        rate: data.interestRate,
        term: data.termMonths
      })

      return this.mapDatabaseRowToLoan(result[0])
    } catch (error) {
      console.error('❌ Error creating loan:', error)
      throw error
    }
  }

  /**
   * Get user's loans
   */
  async getUserLoans(userId: string, includeInactive: boolean = false): Promise<Loan[]> {
    try {
      let query = `
        SELECT * FROM loans
        WHERE user_id = $1
      `

      const params = [userId]

      if (!includeInactive) {
        query += ` AND status IN ('pending', 'approved', 'active')`
      }

      query += ` ORDER BY created_at DESC`

      const result = await this.customQuery(query, params)
      return result.map(row => this.mapDatabaseRowToLoan(row))
    } catch (error) {
      console.error('❌ Error getting user loans:', error)
      return []
    }
  }

  /**
   * Update loan status
   */
  async updateLoanStatus(loanId: string, status: Loan['status']): Promise<void> {
    try {
      const query = `
        UPDATE loans
        SET status = $1, updated_at = NOW()
        WHERE id = $2
      `

      await this.customQuery(query, [status, loanId])

      console.log(`✅ Loan ${loanId} status updated to: ${status}`)

      // If loan is activated, create payment schedule
      if (status === 'active') {
        await this.createPaymentSchedule(loanId)
      }
    } catch (error) {
      console.error('❌ Error updating loan status:', error)
      throw error
    }
  }

  /**
   * Record a loan payment
   */
  async recordPayment(data: CreatePaymentRequest): Promise<LoanPayment> {
    try {
      const paymentId = this.generateId()

      const query = `
        INSERT INTO loan_payments (
          id, loan_id, user_id, amount, principal_amount, interest_amount,
          payment_date, due_date, status, payment_method, transaction_id,
          late_fee, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, 'paid', $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        paymentId,
        data.loanId,
        data.userId,
        data.amount,
        data.principalAmount,
        data.interestAmount,
        data.dueDate,
        data.paymentMethod || null,
        data.transactionId || null,
        data.lateFee || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ])

      if (result.length === 0) {
        throw new Error('Failed to record payment')
      }

      // Update loan balance
      await this.updateLoanBalance(data.loanId, data.principalAmount)

      console.log('✅ Payment recorded:', {
        paymentId,
        loanId: data.loanId,
        amount: data.amount,
        principal: data.principalAmount,
        interest: data.interestAmount
      })

      return this.mapDatabaseRowToPayment(result[0])
    } catch (error) {
      console.error('❌ Error recording payment:', error)
      throw error
    }
  }

  /**
   * Get loan payment history
   */
  async getLoanPayments(loanId: string): Promise<LoanPayment[]> {
    try {
      const query = `
        SELECT * FROM loan_payments
        WHERE loan_id = $1
        ORDER BY payment_date DESC
      `

      const result = await this.customQuery(query, [loanId])
      return result.map(row => this.mapDatabaseRowToPayment(row))
    } catch (error) {
      console.error('❌ Error getting loan payments:', error)
      return []
    }
  }

  /**
   * Get upcoming payments for user
   */
  async getUpcomingPayments(userId: string, daysAhead: number = 30): Promise<LoanPayment[]> {
    try {
      const query = `
        SELECT lp.*, l.loan_type, l.principal_amount
        FROM loan_payments lp
        JOIN loans l ON lp.loan_id = l.id
        WHERE lp.user_id = $1
          AND lp.status = 'scheduled'
          AND lp.due_date <= NOW() + INTERVAL '${daysAhead} days'
        ORDER BY lp.due_date ASC
      `

      const result = await this.customQuery(query, [userId])
      return result.map(row => this.mapDatabaseRowToPayment(row))
    } catch (error) {
      console.error('❌ Error getting upcoming payments:', error)
      return []
    }
  }

  /**
   * Calculate loan analytics for user
   */
  async getLoanAnalytics(userId: string): Promise<any> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_loans,
          SUM(CASE WHEN status = 'active' THEN principal_amount ELSE 0 END) as active_principal,
          SUM(CASE WHEN status = 'active' THEN current_balance ELSE 0 END) as total_balance,
          AVG(CASE WHEN status = 'active' THEN interest_rate ELSE NULL END) as avg_interest_rate,
          SUM(CASE WHEN status = 'paid_off' THEN 1 ELSE 0 END) as paid_off_count
        FROM loans
        WHERE user_id = $1
      `

      const result = await this.customQuery(query, [userId])
      return result[0] || {}
    } catch (error) {
      console.error('❌ Error getting loan analytics:', error)
      return {}
    }
  }

  /**
   * Update collateral value (for crypto-backed loans)
   */
  async updateCollateralValue(loanId: string, newValue: number): Promise<void> {
    try {
      // Get current loan data
      const loan = await this.getLoanById(loanId)
      if (!loan) {
        throw new Error('Loan not found')
      }

      // Calculate new LTV
      const newLtv = (loan.currentBalance / newValue) * 100

      const query = `
        UPDATE loans
        SET collateral_value = $1, ltv = $2, updated_at = NOW()
        WHERE id = $3
      `

      await this.customQuery(query, [newValue, newLtv, loanId])

      console.log(`✅ Collateral value updated for loan ${loanId}: ${newValue}, LTV: ${newLtv.toFixed(2)}%`)

      // Check for margin call conditions
      await this.checkMarginCall(loanId, newLtv)
    } catch (error) {
      console.error('❌ Error updating collateral value:', error)
      throw error
    }
  }

  /**
   * Get loan by ID
   */
  private async getLoanById(loanId: string): Promise<Loan | null> {
    try {
      const query = `SELECT * FROM loans WHERE id = $1`
      const result = await this.customQuery(query, [loanId])

      if (result.length === 0) {
        return null
      }

      return this.mapDatabaseRowToLoan(result[0])
    } catch (error) {
      console.error('❌ Error getting loan by ID:', error)
      return null
    }
  }

  /**
   * Create payment schedule for an active loan
   */
  private async createPaymentSchedule(loanId: string): Promise<void> {
    try {
      const loan = await this.getLoanById(loanId)
      if (!loan) {
        throw new Error('Loan not found')
      }

      // Generate monthly payment schedule
      const payments: any[] = []
      let currentDate = new Date(loan.originationDate)
      let remainingBalance = loan.principalAmount

      for (let i = 0; i < loan.termMonths; i++) {
        currentDate.setMonth(currentDate.getMonth() + 1)

        const interestPayment = (remainingBalance * loan.interestRate / 100) / 12
        const principalPayment = loan.monthlyPayment - interestPayment

        payments.push([
          this.generateId(),
          loanId,
          loan.userId,
          loan.monthlyPayment,
          principalPayment,
          interestPayment,
          new Date(currentDate),
          'scheduled',
          null, // payment_method
          null, // transaction_id
          null, // late_fee
          null, // metadata
        ])

        remainingBalance -= principalPayment
      }

      // Bulk insert payments
      const placeholders = payments.map((_, index) => {
        const start = index * 12 + 1
        return `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8}, $${start + 9}, $${start + 10}, $${start + 11}, NOW(), NOW())`
      }).join(', ')

      const query = `
        INSERT INTO loan_payments (
          id, loan_id, user_id, amount, principal_amount, interest_amount,
          due_date, status, payment_method, transaction_id, late_fee, metadata,
          created_at, updated_at
        ) VALUES ${placeholders}
      `

      await this.customQuery(query, payments.flat())

      console.log(`✅ Payment schedule created for loan ${loanId}: ${payments.length} payments`)
    } catch (error) {
      console.error('❌ Error creating payment schedule:', error)
    }
  }

  /**
   * Update loan balance after payment
   */
  private async updateLoanBalance(loanId: string, principalPaid: number): Promise<void> {
    const query = `
      UPDATE loans
      SET current_balance = current_balance - $1, updated_at = NOW()
      WHERE id = $2
    `

    await this.customQuery(query, [principalPaid, loanId])
  }

  /**
   * Check for margin call conditions
   */
  private async checkMarginCall(loanId: string, currentLtv: number): Promise<void> {
    // Example margin call threshold at 80% LTV
    const marginCallThreshold = 80

    if (currentLtv > marginCallThreshold) {
      console.warn(`🚨 Margin call triggered for loan ${loanId}: LTV ${currentLtv.toFixed(2)}%`)

      // Here you would typically:
      // 1. Send notification to user
      // 2. Create margin call record
      // 3. Trigger automated collateral liquidation if configured
    }
  }

  /**
   * Calculate monthly payment using amortization formula
   */
  private calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
    const monthlyRate = annualRate / 100 / 12

    if (monthlyRate === 0) {
      return principal / termMonths
    }

    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                   (Math.pow(1 + monthlyRate, termMonths) - 1)

    return Math.round(payment * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Ensure required tables exist
   */
  async ensureLoanTables(): Promise<void> {
    try {
      const createTablesQuery = `
        -- Loans Table
        CREATE TABLE IF NOT EXISTS loans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          loan_type VARCHAR(50) NOT NULL,
          principal_amount DECIMAL(15,2) NOT NULL,
          current_balance DECIMAL(15,2) NOT NULL,
          interest_rate DECIMAL(5,4) NOT NULL,
          term_months INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          collateral_type VARCHAR(50),
          collateral_value DECIMAL(15,2),
          collateral_symbol VARCHAR(10),
          ltv DECIMAL(5,2),
          monthly_payment DECIMAL(10,2) NOT NULL,
          next_payment_date TIMESTAMPTZ,
          origination_date TIMESTAMPTZ NOT NULL,
          maturity_date TIMESTAMPTZ NOT NULL,
          purpose TEXT,
          credit_score INTEGER,
          documentation JSONB,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Loan Payments Table
        CREATE TABLE IF NOT EXISTS loan_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          principal_amount DECIMAL(10,2) NOT NULL,
          interest_amount DECIMAL(10,2) NOT NULL,
          payment_date TIMESTAMPTZ,
          due_date TIMESTAMPTZ NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
          payment_method VARCHAR(50),
          transaction_id VARCHAR(255),
          late_fee DECIMAL(8,2),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
        CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
        CREATE INDEX IF NOT EXISTS idx_loans_loan_type ON loans(loan_type);
        CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
        CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON loan_payments(user_id);
        CREATE INDEX IF NOT EXISTS idx_loan_payments_due_date ON loan_payments(due_date);
        CREATE INDEX IF NOT EXISTS idx_loan_payments_status ON loan_payments(status);
      `

      await this.customQuery(createTablesQuery, [])
      console.log('✅ Loan tables ensured')
    } catch (error) {
      console.warn('⚠️ Could not ensure loan tables exist:', error.message)
    }
  }

  /**
   * Map database row to Loan object
   */
  private mapDatabaseRowToLoan(row: any): Loan {
    return {
      id: row.id,
      userId: row.user_id,
      loanType: row.loan_type,
      principalAmount: parseFloat(row.principal_amount),
      currentBalance: parseFloat(row.current_balance),
      interestRate: parseFloat(row.interest_rate),
      termMonths: row.term_months,
      status: row.status,
      collateralType: row.collateral_type,
      collateralValue: row.collateral_value ? parseFloat(row.collateral_value) : undefined,
      collateralSymbol: row.collateral_symbol,
      ltv: row.ltv ? parseFloat(row.ltv) : undefined,
      monthlyPayment: parseFloat(row.monthly_payment),
      nextPaymentDate: row.next_payment_date ? new Date(row.next_payment_date) : undefined,
      originationDate: new Date(row.origination_date),
      maturityDate: new Date(row.maturity_date),
      purpose: row.purpose,
      creditScore: row.credit_score,
      documentation: row.documentation ? JSON.parse(row.documentation) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  /**
   * Map database row to LoanPayment object
   */
  private mapDatabaseRowToPayment(row: any): LoanPayment {
    return {
      id: row.id,
      loanId: row.loan_id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      principalAmount: parseFloat(row.principal_amount),
      interestAmount: parseFloat(row.interest_amount),
      paymentDate: row.payment_date ? new Date(row.payment_date) : new Date(),
      dueDate: new Date(row.due_date),
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
export const loanService = new LoanService()
export default loanService