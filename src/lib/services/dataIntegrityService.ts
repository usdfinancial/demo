import { BaseService } from './baseService'

export interface DataIntegrityCheck {
  id: string
  checkType: 'foreign_key' | 'orphan_record' | 'data_consistency' | 'balance_reconciliation' | 'duplicate_detection'
  tableName: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  severity: 'low' | 'medium' | 'high' | 'critical'
  issuesFound: number
  issuesResolved: number
  results: Array<{
    recordId: string
    issue: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    recommendation: string
    autoFixable: boolean
    resolved: boolean
  }>
  executionTime: number // milliseconds
  lastRunAt: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface DataConsistencyReport {
  id: string
  reportType: 'daily' | 'weekly' | 'monthly' | 'on_demand'
  status: 'generating' | 'completed' | 'failed'
  totalChecks: number
  checksCompleted: number
  issuesFound: number
  criticalIssues: number
  issuesResolved: number
  summary: {
    userDataConsistency: number // percentage
    financialDataConsistency: number // percentage
    foreignKeyViolations: number
    orphanRecords: number
    duplicateRecords: number
    balanceMismatches: number
  }
  recommendations: string[]
  generatedAt: Date
  metadata?: Record<string, any>
}

/**
 * Data Integrity Service - Comprehensive data consistency and validation for USD Financial
 *
 * Ensures:
 * - Foreign key constraints validation
 * - Orphan record detection and cleanup
 * - Data consistency across related tables
 * - Financial balance reconciliation
 * - Duplicate record detection
 * - Automated data healing where possible
 */
class DataIntegrityService extends BaseService {
  constructor() {
    super('data_integrity_checks')
  }

  /**
   * Run comprehensive data integrity checks
   */
  async runIntegrityChecks(
    checkTypes?: DataIntegrityCheck['checkType'][],
    autoFix: boolean = false
  ): Promise<DataConsistencyReport> {
    try {
      await this.ensureIntegrityTables()

      const reportId = this.generateId()
      const startTime = Date.now()

      // Default to all check types if none specified
      const checksToRun = checkTypes || [
        'foreign_key',
        'orphan_record',
        'data_consistency',
        'balance_reconciliation',
        'duplicate_detection'
      ]

      console.log('🔍 Starting data integrity checks:', {
        reportId,
        checksToRun,
        autoFix
      })

      const checkResults: DataIntegrityCheck[] = []

      // Run each type of check
      for (const checkType of checksToRun) {
        try {
          const result = await this.runSpecificCheck(checkType, autoFix)
          checkResults.push(result)
        } catch (error) {
          console.error(`❌ Failed to run ${checkType} check:`, error)
          // Continue with other checks
        }
      }

      // Generate comprehensive report
      const report = await this.generateConsistencyReport(reportId, checkResults)

      console.log('✅ Data integrity checks completed:', {
        reportId,
        totalChecks: checkResults.length,
        issuesFound: report.issuesFound,
        criticalIssues: report.criticalIssues,
        executionTime: Date.now() - startTime
      })

      return report
    } catch (error) {
      console.error('❌ Error running integrity checks:', error)
      throw error
    }
  }

  /**
   * Check foreign key constraints across all tables
   */
  async checkForeignKeyConstraints(autoFix: boolean = false): Promise<DataIntegrityCheck> {
    const checkId = this.generateId()
    const startTime = Date.now()

    try {
      console.log('🔍 Checking foreign key constraints...')

      const issues: DataIntegrityCheck['results'] = []

      // Check user references
      const userReferences = await this.customQuery(`
        SELECT 'login_history' as table_name, id, user_id
        FROM login_history
        WHERE user_id IS NOT NULL
          AND user_id NOT IN (SELECT id FROM users WHERE is_active = true)

        UNION ALL

        SELECT 'user_cards' as table_name, id, user_id
        FROM user_cards
        WHERE user_id NOT IN (SELECT id FROM users WHERE is_active = true)

        UNION ALL

        SELECT 'loans' as table_name, id, user_id
        FROM loans
        WHERE user_id NOT IN (SELECT id FROM users WHERE is_active = true)

        UNION ALL

        SELECT 'insurance_policies' as table_name, id, user_id
        FROM insurance_policies
        WHERE user_id NOT IN (SELECT id FROM users WHERE is_active = true)
      `, [])

      for (const ref of userReferences) {
        issues.push({
          recordId: ref.id,
          issue: `Invalid user reference: ${ref.user_id} in ${ref.table_name}`,
          severity: 'high',
          recommendation: autoFix ? 'Auto-delete or set user_id to NULL' : 'Review and clean up invalid user references',
          autoFixable: true,
          resolved: false
        })

        if (autoFix) {
          try {
            // Set user_id to NULL for orphaned records (safer than deletion)
            await this.customQuery(`
              UPDATE ${ref.table_name}
              SET user_id = NULL, updated_at = NOW()
              WHERE id = $1
            `, [ref.id])

            issues[issues.length - 1].resolved = true
          } catch (fixError) {
            console.error(`Failed to auto-fix foreign key issue in ${ref.table_name}:`, fixError)
          }
        }
      }

      const check: DataIntegrityCheck = {
        id: checkId,
        checkType: 'foreign_key',
        tableName: 'multiple',
        description: 'Foreign key constraint validation across all tables',
        status: 'completed',
        severity: issues.length > 0 ? 'high' : 'low',
        issuesFound: issues.length,
        issuesResolved: issues.filter(i => i.resolved).length,
        results: issues,
        executionTime: Date.now() - startTime,
        lastRunAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await this.saveIntegrityCheck(check)
      return check
    } catch (error) {
      console.error('❌ Error checking foreign key constraints:', error)
      throw error
    }
  }

  /**
   * Detect orphan records
   */
  async detectOrphanRecords(autoFix: boolean = false): Promise<DataIntegrityCheck> {
    const checkId = this.generateId()
    const startTime = Date.now()

    try {
      console.log('🔍 Detecting orphan records...')

      const issues: DataIntegrityCheck['results'] = []

      // Check for orphaned card transactions
      const orphanedTransactions = await this.customQuery(`
        SELECT ct.id, ct.card_id
        FROM card_transactions ct
        LEFT JOIN user_cards uc ON ct.card_id = uc.id
        WHERE uc.id IS NULL
      `, [])

      for (const transaction of orphanedTransactions) {
        issues.push({
          recordId: transaction.id,
          issue: `Orphaned card transaction - card ${transaction.card_id} no longer exists`,
          severity: 'medium',
          recommendation: autoFix ? 'Auto-delete orphaned transaction' : 'Review and clean up orphaned transactions',
          autoFixable: true,
          resolved: false
        })

        if (autoFix) {
          try {
            await this.customQuery('DELETE FROM card_transactions WHERE id = $1', [transaction.id])
            issues[issues.length - 1].resolved = true
          } catch (fixError) {
            console.error('Failed to auto-fix orphaned transaction:', fixError)
          }
        }
      }

      // Check for orphaned loan payments
      const orphanedPayments = await this.customQuery(`
        SELECT lp.id, lp.loan_id
        FROM loan_payments lp
        LEFT JOIN loans l ON lp.loan_id = l.id
        WHERE l.id IS NULL
      `, [])

      for (const payment of orphanedPayments) {
        issues.push({
          recordId: payment.id,
          issue: `Orphaned loan payment - loan ${payment.loan_id} no longer exists`,
          severity: 'high',
          recommendation: autoFix ? 'Auto-delete orphaned payment' : 'Review and clean up orphaned payments',
          autoFixable: true,
          resolved: false
        })

        if (autoFix) {
          try {
            await this.customQuery('DELETE FROM loan_payments WHERE id = $1', [payment.id])
            issues[issues.length - 1].resolved = true
          } catch (fixError) {
            console.error('Failed to auto-fix orphaned payment:', fixError)
          }
        }
      }

      const check: DataIntegrityCheck = {
        id: checkId,
        checkType: 'orphan_record',
        tableName: 'multiple',
        description: 'Orphan record detection across relational tables',
        status: 'completed',
        severity: issues.length > 0 ? 'medium' : 'low',
        issuesFound: issues.length,
        issuesResolved: issues.filter(i => i.resolved).length,
        results: issues,
        executionTime: Date.now() - startTime,
        lastRunAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await this.saveIntegrityCheck(check)
      return check
    } catch (error) {
      console.error('❌ Error detecting orphan records:', error)
      throw error
    }
  }

  /**
   * Check data consistency across related tables
   */
  async checkDataConsistency(autoFix: boolean = false): Promise<DataIntegrityCheck> {
    const checkId = this.generateId()
    const startTime = Date.now()

    try {
      console.log('🔍 Checking data consistency...')

      const issues: DataIntegrityCheck['results'] = []

      // Check loan balance consistency
      const loanBalanceIssues = await this.customQuery(`
        SELECT l.id, l.current_balance, l.principal_amount,
               COALESCE(SUM(lp.principal_amount), 0) as total_payments
        FROM loans l
        LEFT JOIN loan_payments lp ON l.id = lp.loan_id AND lp.status = 'paid'
        WHERE l.status = 'active'
        GROUP BY l.id, l.current_balance, l.principal_amount
        HAVING l.current_balance != (l.principal_amount - COALESCE(SUM(lp.principal_amount), 0))
      `, [])

      for (const loan of loanBalanceIssues) {
        const correctBalance = loan.principal_amount - loan.total_payments
        issues.push({
          recordId: loan.id,
          issue: `Loan balance mismatch: stored=${loan.current_balance}, calculated=${correctBalance}`,
          severity: 'critical',
          recommendation: autoFix ? `Auto-correct balance to ${correctBalance}` : 'Manually reconcile loan balance',
          autoFixable: true,
          resolved: false
        })

        if (autoFix) {
          try {
            await this.customQuery(`
              UPDATE loans
              SET current_balance = $1, updated_at = NOW()
              WHERE id = $2
            `, [correctBalance, loan.id])

            issues[issues.length - 1].resolved = true
          } catch (fixError) {
            console.error('Failed to auto-fix loan balance:', fixError)
          }
        }
      }

      // Check for users with multiple default cards
      const multipleDefaultCards = await this.customQuery(`
        SELECT user_id, COUNT(*) as default_count
        FROM user_cards
        WHERE is_default = true AND is_active = true
        GROUP BY user_id
        HAVING COUNT(*) > 1
      `, [])

      for (const user of multipleDefaultCards) {
        issues.push({
          recordId: user.user_id,
          issue: `User has ${user.default_count} default cards (should be 0 or 1)`,
          severity: 'medium',
          recommendation: autoFix ? 'Auto-fix: keep most recent card as default' : 'Manually resolve multiple default cards',
          autoFixable: true,
          resolved: false
        })

        if (autoFix) {
          try {
            // Keep the most recently created card as default
            await this.customQuery(`
              UPDATE user_cards
              SET is_default = false, updated_at = NOW()
              WHERE user_id = $1 AND is_default = true
            `, [user.user_id])

            await this.customQuery(`
              UPDATE user_cards
              SET is_default = true, updated_at = NOW()
              WHERE id = (
                SELECT id FROM user_cards
                WHERE user_id = $1 AND is_active = true
                ORDER BY created_at DESC
                LIMIT 1
              )
            `, [user.user_id])

            issues[issues.length - 1].resolved = true
          } catch (fixError) {
            console.error('Failed to auto-fix multiple default cards:', fixError)
          }
        }
      }

      const check: DataIntegrityCheck = {
        id: checkId,
        checkType: 'data_consistency',
        tableName: 'multiple',
        description: 'Data consistency validation across business logic',
        status: 'completed',
        severity: issues.some(i => i.severity === 'critical') ? 'critical' :
                  issues.some(i => i.severity === 'high') ? 'high' : 'medium',
        issuesFound: issues.length,
        issuesResolved: issues.filter(i => i.resolved).length,
        results: issues,
        executionTime: Date.now() - startTime,
        lastRunAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await this.saveIntegrityCheck(check)
      return check
    } catch (error) {
      console.error('❌ Error checking data consistency:', error)
      throw error
    }
  }

  /**
   * Detect duplicate records
   */
  async detectDuplicates(autoFix: boolean = false): Promise<DataIntegrityCheck> {
    const checkId = this.generateId()
    const startTime = Date.now()

    try {
      console.log('🔍 Detecting duplicate records...')

      const issues: DataIntegrityCheck['results'] = []

      // Check for duplicate users by email
      const duplicateUsers = await this.customQuery(`
        SELECT email, COUNT(*) as count, array_agg(id) as user_ids
        FROM users
        WHERE email IS NOT NULL AND is_active = true
        GROUP BY email
        HAVING COUNT(*) > 1
      `, [])

      for (const dup of duplicateUsers) {
        const userIds = dup.user_ids.slice(1) // Keep the first user, mark others as duplicates

        for (const userId of userIds) {
          issues.push({
            recordId: userId,
            issue: `Duplicate user with email: ${dup.email}`,
            severity: 'high',
            recommendation: autoFix ? 'Auto-merge or deactivate duplicate' : 'Manually merge duplicate users',
            autoFixable: false, // User merging requires manual review
            resolved: false
          })
        }
      }

      // Check for duplicate login history entries
      const duplicateLogins = await this.customQuery(`
        SELECT user_id, email, login_method, created_at::date, COUNT(*) as count
        FROM login_history
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY user_id, email, login_method, created_at::date
        HAVING COUNT(*) > 10 -- More than 10 identical logins in one day is suspicious
      `, [])

      for (const login of duplicateLogins) {
        issues.push({
          recordId: `${login.user_id}-${login.created_at}`,
          issue: `Suspicious duplicate login entries: ${login.count} identical logins`,
          severity: 'medium',
          recommendation: 'Review for potential bot activity or system errors',
          autoFixable: false,
          resolved: false
        })
      }

      const check: DataIntegrityCheck = {
        id: checkId,
        checkType: 'duplicate_detection',
        tableName: 'multiple',
        description: 'Duplicate record detection across all tables',
        status: 'completed',
        severity: issues.length > 0 ? 'medium' : 'low',
        issuesFound: issues.length,
        issuesResolved: issues.filter(i => i.resolved).length,
        results: issues,
        executionTime: Date.now() - startTime,
        lastRunAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await this.saveIntegrityCheck(check)
      return check
    } catch (error) {
      console.error('❌ Error detecting duplicates:', error)
      throw error
    }
  }

  /**
   * Run balance reconciliation checks
   */
  async checkBalanceReconciliation(autoFix: boolean = false): Promise<DataIntegrityCheck> {
    const checkId = this.generateId()
    const startTime = Date.now()

    try {
      console.log('🔍 Checking balance reconciliation...')

      const issues: DataIntegrityCheck['results'] = []

      // This would typically reconcile with external systems
      // For now, we'll check internal consistency

      // Check transaction sum consistency
      const transactionSums = await this.customQuery(`
        SELECT
          card_id,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM card_transactions
        WHERE status = 'succeeded'
        GROUP BY card_id
        HAVING COUNT(*) > 0
      `, [])

      // For a real implementation, you'd compare these sums with:
      // - Stripe transaction totals
      // - Bank reconciliation data
      // - External audit trails

      for (const summary of transactionSums) {
        // Example check - in reality, you'd have external data to compare against
        if (summary.total_amount < 0) {
          issues.push({
            recordId: summary.card_id,
            issue: `Negative transaction sum for card: ${summary.total_amount}`,
            severity: 'high',
            recommendation: 'Review transaction records for calculation errors',
            autoFixable: false,
            resolved: false
          })
        }
      }

      const check: DataIntegrityCheck = {
        id: checkId,
        checkType: 'balance_reconciliation',
        tableName: 'card_transactions',
        description: 'Financial balance reconciliation and audit checks',
        status: 'completed',
        severity: issues.length > 0 ? 'high' : 'low',
        issuesFound: issues.length,
        issuesResolved: issues.filter(i => i.resolved).length,
        results: issues,
        executionTime: Date.now() - startTime,
        lastRunAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await this.saveIntegrityCheck(check)
      return check
    } catch (error) {
      console.error('❌ Error checking balance reconciliation:', error)
      throw error
    }
  }

  /**
   * Get integrity check history
   */
  async getIntegrityCheckHistory(
    limit: number = 50,
    checkType?: DataIntegrityCheck['checkType']
  ): Promise<DataIntegrityCheck[]> {
    try {
      let query = `
        SELECT * FROM data_integrity_checks
        WHERE 1=1
      `
      const params: any[] = []

      if (checkType) {
        query += ` AND check_type = $${params.length + 1}`
        params.push(checkType)
      }

      query += ` ORDER BY last_run_at DESC LIMIT $${params.length + 1}`
      params.push(limit)

      const result = await this.customQuery(query, params)
      return result.map(row => this.mapDatabaseRowToIntegrityCheck(row))
    } catch (error) {
      console.error('❌ Error getting integrity check history:', error)
      return []
    }
  }

  /**
   * Run a specific integrity check
   */
  private async runSpecificCheck(
    checkType: DataIntegrityCheck['checkType'],
    autoFix: boolean
  ): Promise<DataIntegrityCheck> {
    switch (checkType) {
      case 'foreign_key':
        return await this.checkForeignKeyConstraints(autoFix)
      case 'orphan_record':
        return await this.detectOrphanRecords(autoFix)
      case 'data_consistency':
        return await this.checkDataConsistency(autoFix)
      case 'balance_reconciliation':
        return await this.checkBalanceReconciliation(autoFix)
      case 'duplicate_detection':
        return await this.detectDuplicates(autoFix)
      default:
        throw new Error(`Unknown check type: ${checkType}`)
    }
  }

  /**
   * Generate comprehensive data consistency report
   */
  private async generateConsistencyReport(
    reportId: string,
    checkResults: DataIntegrityCheck[]
  ): Promise<DataConsistencyReport> {
    const totalIssues = checkResults.reduce((sum, check) => sum + check.issuesFound, 0)
    const criticalIssues = checkResults.reduce((sum, check) =>
      sum + check.results.filter(r => r.severity === 'critical').length, 0)
    const resolvedIssues = checkResults.reduce((sum, check) => sum + check.issuesResolved, 0)

    const summary = {
      userDataConsistency: this.calculateConsistencyPercentage('user', checkResults),
      financialDataConsistency: this.calculateConsistencyPercentage('financial', checkResults),
      foreignKeyViolations: this.countIssuesByType(checkResults, 'foreign_key'),
      orphanRecords: this.countIssuesByType(checkResults, 'orphan_record'),
      duplicateRecords: this.countIssuesByType(checkResults, 'duplicate_detection'),
      balanceMismatches: this.countIssuesByType(checkResults, 'balance_reconciliation')
    }

    const recommendations = this.generateRecommendations(checkResults)

    const report: DataConsistencyReport = {
      id: reportId,
      reportType: 'on_demand',
      status: 'completed',
      totalChecks: checkResults.length,
      checksCompleted: checkResults.filter(c => c.status === 'completed').length,
      issuesFound: totalIssues,
      criticalIssues,
      issuesResolved: resolvedIssues,
      summary,
      recommendations,
      generatedAt: new Date()
    }

    return report
  }

  /**
   * Calculate consistency percentage for a category
   */
  private calculateConsistencyPercentage(
    category: 'user' | 'financial',
    checkResults: DataIntegrityCheck[]
  ): number {
    const relevantChecks = checkResults.filter(check => {
      if (category === 'user') {
        return ['foreign_key', 'orphan_record', 'duplicate_detection'].includes(check.checkType)
      } else {
        return ['data_consistency', 'balance_reconciliation'].includes(check.checkType)
      }
    })

    if (relevantChecks.length === 0) return 100

    const totalIssues = relevantChecks.reduce((sum, check) => sum + check.issuesFound, 0)
    const totalChecks = relevantChecks.length * 100 // Assume 100 records per check for percentage calc

    return Math.max(0, Math.round(((totalChecks - totalIssues) / totalChecks) * 100))
  }

  /**
   * Count issues by check type
   */
  private countIssuesByType(
    checkResults: DataIntegrityCheck[],
    checkType: DataIntegrityCheck['checkType']
  ): number {
    const check = checkResults.find(c => c.checkType === checkType)
    return check ? check.issuesFound : 0
  }

  /**
   * Generate recommendations based on check results
   */
  private generateRecommendations(checkResults: DataIntegrityCheck[]): string[] {
    const recommendations: string[] = []

    const criticalIssues = checkResults.filter(c => c.severity === 'critical')
    const highIssues = checkResults.filter(c => c.severity === 'high')

    if (criticalIssues.length > 0) {
      recommendations.push('🚨 Critical data integrity issues detected - immediate action required')
      recommendations.push('Review and resolve critical issues before processing financial transactions')
    }

    if (highIssues.length > 0) {
      recommendations.push('⚠️ High priority data issues detected - schedule resolution within 24 hours')
    }

    const orphanCheck = checkResults.find(c => c.checkType === 'orphan_record')
    if (orphanCheck && orphanCheck.issuesFound > 0) {
      recommendations.push('Clean up orphaned records to improve database performance')
    }

    const duplicateCheck = checkResults.find(c => c.checkType === 'duplicate_detection')
    if (duplicateCheck && duplicateCheck.issuesFound > 0) {
      recommendations.push('Review duplicate detection results and implement stricter data validation')
    }

    const balanceCheck = checkResults.find(c => c.checkType === 'balance_reconciliation')
    if (balanceCheck && balanceCheck.issuesFound > 0) {
      recommendations.push('Perform manual balance reconciliation with external systems')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No critical data integrity issues detected')
      recommendations.push('Consider running integrity checks daily for ongoing monitoring')
    }

    return recommendations
  }

  /**
   * Save integrity check results to database
   */
  private async saveIntegrityCheck(check: DataIntegrityCheck): Promise<void> {
    const query = `
      INSERT INTO data_integrity_checks (
        id, check_type, table_name, description, status, severity,
        issues_found, issues_resolved, results, execution_time,
        last_run_at, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `

    await this.customQuery(query, [
      check.id,
      check.checkType,
      check.tableName,
      check.description,
      check.status,
      check.severity,
      check.issuesFound,
      check.issuesResolved,
      JSON.stringify(check.results),
      check.executionTime,
      check.lastRunAt,
      check.metadata ? JSON.stringify(check.metadata) : null
    ])
  }

  /**
   * Ensure required tables exist
   */
  async ensureIntegrityTables(): Promise<void> {
    try {
      const createTablesQuery = `
        -- Data Integrity Checks Table
        CREATE TABLE IF NOT EXISTS data_integrity_checks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          check_type VARCHAR(50) NOT NULL,
          table_name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          severity VARCHAR(20) NOT NULL,
          issues_found INTEGER NOT NULL DEFAULT 0,
          issues_resolved INTEGER NOT NULL DEFAULT 0,
          results JSONB NOT NULL DEFAULT '[]',
          execution_time INTEGER NOT NULL, -- milliseconds
          last_run_at TIMESTAMPTZ NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_data_integrity_checks_type ON data_integrity_checks(check_type);
        CREATE INDEX IF NOT EXISTS idx_data_integrity_checks_status ON data_integrity_checks(status);
        CREATE INDEX IF NOT EXISTS idx_data_integrity_checks_severity ON data_integrity_checks(severity);
        CREATE INDEX IF NOT EXISTS idx_data_integrity_checks_last_run ON data_integrity_checks(last_run_at DESC);
      `

      await this.customQuery(createTablesQuery, [])
      console.log('✅ Data integrity tables ensured')
    } catch (error) {
      console.warn('⚠️ Could not ensure data integrity tables exist:', error.message)
    }
  }

  /**
   * Map database row to DataIntegrityCheck object
   */
  private mapDatabaseRowToIntegrityCheck(row: any): DataIntegrityCheck {
    return {
      id: row.id,
      checkType: row.check_type,
      tableName: row.table_name,
      description: row.description,
      status: row.status,
      severity: row.severity,
      issuesFound: row.issues_found,
      issuesResolved: row.issues_resolved,
      results: JSON.parse(row.results),
      executionTime: row.execution_time,
      lastRunAt: new Date(row.last_run_at),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}

// Export singleton instance
export const dataIntegrityService = new DataIntegrityService()
export default dataIntegrityService