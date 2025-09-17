import { BaseService } from './baseService'

export interface SystemConfig {
  id: string
  category: 'security' | 'financial' | 'notification' | 'integration' | 'feature' | 'compliance' | 'ui'
  key: string
  value: any
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'encrypted'
  description: string
  isPublic: boolean // Whether this config can be accessed by frontend
  isRequired: boolean
  validationRules?: {
    min?: number
    max?: number
    pattern?: string
    allowedValues?: any[]
    customValidator?: string
  }
  environment?: 'development' | 'staging' | 'production' | 'all'
  lastModifiedBy?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ConfigUpdate {
  key: string
  value: any
  modifiedBy?: string
  reason?: string
}

export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * System Configuration Service - Centralized configuration management for USD Financial
 *
 * Manages:
 * - Application settings and feature flags
 * - Security configuration
 * - Financial service parameters
 * - Integration settings
 * - Compliance settings
 * - UI customization
 * - Environment-specific configurations
 */
class SystemConfigService extends BaseService {
  private configCache: Map<string, SystemConfig> = new Map()
  private cacheExpiry: number = 5 * 60 * 1000 // 5 minutes
  private lastCacheUpdate: number = 0

  constructor() {
    super('system_configs')
  }

  /**
   * Get configuration value by key
   */
  async getConfig(key: string, useCache: boolean = true): Promise<any> {
    try {
      // Check cache first
      if (useCache && this.isCacheValid() && this.configCache.has(key)) {
        return this.configCache.get(key)?.value
      }

      // Fetch from database
      const config = await this.getConfigByKey(key)
      if (!config) {
        throw new Error(`Configuration not found: ${key}`)
      }

      // Update cache
      if (useCache) {
        this.configCache.set(key, config)
      }

      return config.value
    } catch (error) {
      console.error(`❌ Error getting config ${key}:`, error)
      throw error
    }
  }

  /**
   * Get multiple configuration values by category
   */
  async getConfigsByCategory(
    category: SystemConfig['category'],
    includeNonPublic: boolean = false
  ): Promise<Record<string, any>> {
    try {
      let query = `
        SELECT * FROM system_configs
        WHERE category = $1
      `
      const params = [category]

      if (!includeNonPublic) {
        query += ` AND is_public = true`
      }

      const currentEnv = process.env.NODE_ENV || 'development'
      query += ` AND (environment = $2 OR environment = 'all')`
      params.push(currentEnv)

      const result = await this.customQuery(query, params)
      const configs = result.map(row => this.mapDatabaseRowToConfig(row))

      const configMap: Record<string, any> = {}
      configs.forEach(config => {
        configMap[config.key] = config.value
      })

      return configMap
    } catch (error) {
      console.error(`❌ Error getting configs for category ${category}:`, error)
      return {}
    }
  }

  /**
   * Set configuration value
   */
  async setConfig(
    key: string,
    value: any,
    modifiedBy?: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.ensureConfigTables()

      const existingConfig = await this.getConfigByKey(key)
      if (!existingConfig) {
        throw new Error(`Configuration not found: ${key}. Use createConfig to create new configurations.`)
      }

      // Validate the new value
      const validation = this.validateConfigValue(existingConfig, value)
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
      }

      // Convert value based on data type
      const convertedValue = this.convertValueToType(value, existingConfig.dataType)

      const query = `
        UPDATE system_configs
        SET value = $1, last_modified_by = $2, updated_at = NOW(),
            metadata = COALESCE(metadata, '{}') || $3
        WHERE key = $4
      `

      const metadata = {
        lastChangeReason: reason,
        previousValue: existingConfig.value,
        changedAt: new Date().toISOString()
      }

      await this.customQuery(query, [
        this.serializeValue(convertedValue, existingConfig.dataType),
        modifiedBy || 'system',
        JSON.stringify(metadata),
        key
      ])

      // Clear cache for this config
      this.configCache.delete(key)

      console.log('✅ Configuration updated:', {
        key,
        newValue: this.maskSensitiveValue(key, convertedValue),
        modifiedBy: modifiedBy || 'system',
        reason
      })

      // Log configuration change for audit
      await this.logConfigChange(key, existingConfig.value, convertedValue, modifiedBy, reason)
    } catch (error) {
      console.error(`❌ Error setting config ${key}:`, error)
      throw error
    }
  }

  /**
   * Create new configuration
   */
  async createConfig(configData: Omit<SystemConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<SystemConfig> {
    try {
      await this.ensureConfigTables()

      // Check if config already exists
      const existing = await this.getConfigByKey(configData.key)
      if (existing) {
        throw new Error(`Configuration already exists: ${configData.key}`)
      }

      // Validate the value
      const validation = this.validateConfigValue(configData as SystemConfig, configData.value)
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
      }

      const configId = this.generateId()
      const convertedValue = this.convertValueToType(configData.value, configData.dataType)

      const query = `
        INSERT INTO system_configs (
          id, category, key, value, data_type, description, is_public,
          is_required, validation_rules, environment, last_modified_by,
          metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        configId,
        configData.category,
        configData.key,
        this.serializeValue(convertedValue, configData.dataType),
        configData.dataType,
        configData.description,
        configData.isPublic,
        configData.isRequired,
        configData.validationRules ? JSON.stringify(configData.validationRules) : null,
        configData.environment || 'all',
        configData.lastModifiedBy || 'system',
        configData.metadata ? JSON.stringify(configData.metadata) : null
      ])

      if (result.length === 0) {
        throw new Error('Failed to create configuration')
      }

      const config = this.mapDatabaseRowToConfig(result[0])

      console.log('✅ Configuration created:', {
        key: config.key,
        category: config.category,
        isPublic: config.isPublic
      })

      return config
    } catch (error) {
      console.error('❌ Error creating configuration:', error)
      throw error
    }
  }

  /**
   * Delete configuration
   */
  async deleteConfig(key: string, modifiedBy?: string, reason?: string): Promise<void> {
    try {
      const existingConfig = await this.getConfigByKey(key)
      if (!existingConfig) {
        throw new Error(`Configuration not found: ${key}`)
      }

      if (existingConfig.isRequired) {
        throw new Error(`Cannot delete required configuration: ${key}`)
      }

      const query = `DELETE FROM system_configs WHERE key = $1`
      await this.customQuery(query, [key])

      // Clear cache
      this.configCache.delete(key)

      console.log('✅ Configuration deleted:', {
        key,
        deletedBy: modifiedBy || 'system',
        reason
      })

      // Log configuration deletion
      await this.logConfigChange(key, existingConfig.value, null, modifiedBy, reason || 'Configuration deleted')
    } catch (error) {
      console.error(`❌ Error deleting config ${key}:`, error)
      throw error
    }
  }

  /**
   * Get all configurations (admin only)
   */
  async getAllConfigs(includeValues: boolean = false): Promise<Partial<SystemConfig>[]> {
    try {
      const query = `
        SELECT id, category, key, data_type, description, is_public,
               is_required, environment, last_modified_by, created_at, updated_at
               ${includeValues ? ', value' : ''}
        FROM system_configs
        ORDER BY category, key
      `

      const result = await this.customQuery(query, [])
      return result.map(row => {
        const config: Partial<SystemConfig> = {
          id: row.id,
          category: row.category,
          key: row.key,
          dataType: row.data_type,
          description: row.description,
          isPublic: row.is_public,
          isRequired: row.is_required,
          environment: row.environment,
          lastModifiedBy: row.last_modified_by,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        }

        if (includeValues) {
          config.value = this.deserializeValue(row.value, row.data_type)
        }

        return config
      })
    } catch (error) {
      console.error('❌ Error getting all configurations:', error)
      return []
    }
  }

  /**
   * Initialize default configurations
   */
  async initializeDefaultConfigs(): Promise<void> {
    try {
      console.log('🔄 Initializing default system configurations...')

      const defaultConfigs: Array<Omit<SystemConfig, 'id' | 'createdAt' | 'updatedAt'>> = [
        // Security configurations
        {
          category: 'security',
          key: 'auth.session_timeout_minutes',
          value: 60,
          dataType: 'number',
          description: 'User session timeout in minutes',
          isPublic: false,
          isRequired: true,
          validationRules: { min: 5, max: 1440 },
          environment: 'all'
        },
        {
          category: 'security',
          key: 'auth.max_login_attempts',
          value: 5,
          dataType: 'number',
          description: 'Maximum failed login attempts before account lockout',
          isPublic: false,
          isRequired: true,
          validationRules: { min: 3, max: 10 },
          environment: 'all'
        },
        {
          category: 'security',
          key: 'auth.enable_2fa',
          value: true,
          dataType: 'boolean',
          description: 'Enable two-factor authentication requirement',
          isPublic: true,
          isRequired: true,
          environment: 'all'
        },

        // Financial configurations
        {
          category: 'financial',
          key: 'transactions.daily_limit_usd',
          value: 10000,
          dataType: 'number',
          description: 'Daily transaction limit in USD',
          isPublic: true,
          isRequired: true,
          validationRules: { min: 100, max: 100000 },
          environment: 'all'
        },
        {
          category: 'financial',
          key: 'loans.max_ltv_percentage',
          value: 75,
          dataType: 'number',
          description: 'Maximum loan-to-value ratio percentage for crypto-backed loans',
          isPublic: true,
          isRequired: true,
          validationRules: { min: 50, max: 90 },
          environment: 'all'
        },
        {
          category: 'financial',
          key: 'cards.enable_virtual_cards',
          value: true,
          dataType: 'boolean',
          description: 'Enable virtual card issuance',
          isPublic: true,
          isRequired: true,
          environment: 'all'
        },

        // Feature flags
        {
          category: 'feature',
          key: 'features.enable_crypto_lending',
          value: true,
          dataType: 'boolean',
          description: 'Enable crypto-backed lending feature',
          isPublic: true,
          isRequired: false,
          environment: 'all'
        },
        {
          category: 'feature',
          key: 'features.enable_insurance',
          value: true,
          dataType: 'boolean',
          description: 'Enable insurance products',
          isPublic: true,
          isRequired: false,
          environment: 'all'
        },
        {
          category: 'feature',
          key: 'features.enable_defi_yields',
          value: false,
          dataType: 'boolean',
          description: 'Enable DeFi yield farming features',
          isPublic: true,
          isRequired: false,
          environment: 'production'
        },

        // Notification configurations
        {
          category: 'notification',
          key: 'notifications.enable_email',
          value: true,
          dataType: 'boolean',
          description: 'Enable email notifications',
          isPublic: true,
          isRequired: true,
          environment: 'all'
        },
        {
          category: 'notification',
          key: 'notifications.enable_sms',
          value: false,
          dataType: 'boolean',
          description: 'Enable SMS notifications',
          isPublic: true,
          isRequired: false,
          environment: 'all'
        },

        // Integration configurations
        {
          category: 'integration',
          key: 'stripe.webhook_tolerance_seconds',
          value: 300,
          dataType: 'number',
          description: 'Stripe webhook timestamp tolerance in seconds',
          isPublic: false,
          isRequired: true,
          validationRules: { min: 60, max: 600 },
          environment: 'all'
        },

        // UI configurations
        {
          category: 'ui',
          key: 'ui.theme',
          value: 'light',
          dataType: 'string',
          description: 'Default UI theme',
          isPublic: true,
          isRequired: true,
          validationRules: { allowedValues: ['light', 'dark', 'auto'] },
          environment: 'all'
        },
        {
          category: 'ui',
          key: 'ui.currency_display',
          value: 'USD',
          dataType: 'string',
          description: 'Default currency display format',
          isPublic: true,
          isRequired: true,
          validationRules: { allowedValues: ['USD', 'EUR', 'GBP'] },
          environment: 'all'
        },

        // Compliance configurations
        {
          category: 'compliance',
          key: 'kyc.required_verification_level',
          value: 'standard',
          dataType: 'string',
          description: 'Required KYC verification level for new users',
          isPublic: false,
          isRequired: true,
          validationRules: { allowedValues: ['basic', 'standard', 'enhanced'] },
          environment: 'all'
        }
      ]

      let created = 0
      let skipped = 0

      for (const config of defaultConfigs) {
        try {
          const existing = await this.getConfigByKey(config.key)
          if (!existing) {
            await this.createConfig(config)
            created++
          } else {
            skipped++
          }
        } catch (error) {
          console.error(`❌ Failed to create default config ${config.key}:`, error)
        }
      }

      console.log(`✅ Default configurations initialized: ${created} created, ${skipped} skipped`)
    } catch (error) {
      console.error('❌ Error initializing default configurations:', error)
    }
  }

  /**
   * Validate configuration value against rules
   */
  private validateConfigValue(config: SystemConfig, value: any): ConfigValidationResult {
    const result: ConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (!config.validationRules) {
      return result
    }

    const rules = config.validationRules

    // Check data type
    const expectedType = config.dataType === 'json' ? 'object' : config.dataType
    const actualType = typeof value

    if (actualType !== expectedType && !(expectedType === 'number' && !isNaN(Number(value)))) {
      result.errors.push(`Expected ${expectedType}, got ${actualType}`)
    }

    // Check numeric constraints
    if (config.dataType === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        result.errors.push(`Value ${value} is below minimum ${rules.min}`)
      }
      if (rules.max !== undefined && value > rules.max) {
        result.errors.push(`Value ${value} is above maximum ${rules.max}`)
      }
    }

    // Check string pattern
    if (config.dataType === 'string' && rules.pattern && typeof value === 'string') {
      const regex = new RegExp(rules.pattern)
      if (!regex.test(value)) {
        result.errors.push(`Value does not match required pattern: ${rules.pattern}`)
      }
    }

    // Check allowed values
    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
      result.errors.push(`Value must be one of: ${rules.allowedValues.join(', ')}`)
    }

    result.isValid = result.errors.length === 0

    return result
  }

  /**
   * Convert value to appropriate type
   */
  private convertValueToType(value: any, dataType: SystemConfig['dataType']): any {
    switch (dataType) {
      case 'string':
        return String(value)
      case 'number':
        return Number(value)
      case 'boolean':
        return Boolean(value)
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value
      case 'encrypted':
        // In a real implementation, you would encrypt the value here
        return String(value)
      default:
        return value
    }
  }

  /**
   * Serialize value for database storage
   */
  private serializeValue(value: any, dataType: SystemConfig['dataType']): string {
    switch (dataType) {
      case 'json':
        return JSON.stringify(value)
      case 'boolean':
        return value ? 'true' : 'false'
      default:
        return String(value)
    }
  }

  /**
   * Deserialize value from database
   */
  private deserializeValue(value: string, dataType: SystemConfig['dataType']): any {
    switch (dataType) {
      case 'number':
        return Number(value)
      case 'boolean':
        return value === 'true'
      case 'json':
        return JSON.parse(value)
      default:
        return value
    }
  }

  /**
   * Mask sensitive configuration values for logging
   */
  private maskSensitiveValue(key: string, value: any): any {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'api_key']
    const isSensitive = sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))

    if (isSensitive && typeof value === 'string') {
      return '***' + value.slice(-4)
    }

    return value
  }

  /**
   * Get configuration by key
   */
  private async getConfigByKey(key: string): Promise<SystemConfig | null> {
    try {
      const query = `SELECT * FROM system_configs WHERE key = $1`
      const result = await this.customQuery(query, [key])

      if (result.length === 0) {
        return null
      }

      return this.mapDatabaseRowToConfig(result[0])
    } catch (error) {
      console.error(`❌ Error getting config by key ${key}:`, error)
      return null
    }
  }

  /**
   * Log configuration changes for audit
   */
  private async logConfigChange(
    key: string,
    oldValue: any,
    newValue: any,
    modifiedBy?: string,
    reason?: string
  ): Promise<void> {
    try {
      // This would typically integrate with your audit logging system
      console.log('📝 Configuration change logged:', {
        key,
        oldValue: this.maskSensitiveValue(key, oldValue),
        newValue: this.maskSensitiveValue(key, newValue),
        modifiedBy: modifiedBy || 'system',
        reason: reason || 'No reason provided',
        timestamp: new Date().toISOString()
      })

      // In a real implementation, you might save this to an audit_logs table
    } catch (error) {
      console.error('❌ Error logging configuration change:', error)
      // Don't throw - logging failures shouldn't break config updates
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry
  }

  /**
   * Ensure required tables exist
   */
  async ensureConfigTables(): Promise<void> {
    try {
      const createTablesQuery = `
        -- System Configurations Table
        CREATE TABLE IF NOT EXISTS system_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category VARCHAR(50) NOT NULL,
          key VARCHAR(255) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          data_type VARCHAR(20) NOT NULL,
          description TEXT NOT NULL,
          is_public BOOLEAN NOT NULL DEFAULT false,
          is_required BOOLEAN NOT NULL DEFAULT false,
          validation_rules JSONB,
          environment VARCHAR(20) NOT NULL DEFAULT 'all',
          last_modified_by VARCHAR(255),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs(category);
        CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);
        CREATE INDEX IF NOT EXISTS idx_system_configs_environment ON system_configs(environment);
        CREATE INDEX IF NOT EXISTS idx_system_configs_is_public ON system_configs(is_public);
      `

      await this.customQuery(createTablesQuery, [])
      console.log('✅ System configuration tables ensured')
    } catch (error) {
      console.warn('⚠️ Could not ensure system configuration tables exist:', error.message)
    }
  }

  /**
   * Map database row to SystemConfig object
   */
  private mapDatabaseRowToConfig(row: any): SystemConfig {
    return {
      id: row.id,
      category: row.category,
      key: row.key,
      value: this.deserializeValue(row.value, row.data_type),
      dataType: row.data_type,
      description: row.description,
      isPublic: row.is_public,
      isRequired: row.is_required,
      validationRules: row.validation_rules ? JSON.parse(row.validation_rules) : undefined,
      environment: row.environment,
      lastModifiedBy: row.last_modified_by,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}

// Export singleton instance
export const systemConfigService = new SystemConfigService()
export default systemConfigService