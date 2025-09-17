#!/usr/bin/env node
/**
 * Security Audit Script for USD Financial Application
 * 
 * This script performs automated security checks on the codebase
 * to identify potential vulnerabilities and misconfigurations.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class SecurityAuditor {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      info: []
    }
    this.rootDir = path.resolve(__dirname, '..')
  }

  log(level, message, details = null) {
    const entry = { message, details, timestamp: new Date().toISOString() }
    this.results[level].push(entry)
    
    const colors = {
      passed: '\x1b[32m✓\x1b[0m',
      failed: '\x1b[31m✗\x1b[0m',
      warnings: '\x1b[33m⚠\x1b[0m',
      info: '\x1b[34mℹ\x1b[0m'
    }
    
    console.log(`${colors[level]} ${message}`)
    if (details && process.env.VERBOSE) {
      console.log(`   ${details}`)
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n=== Environment Variables Security Check ===')
    
    // Check if .env.local exists
    const envPath = path.join(this.rootDir, '.env.local')
    if (!fs.existsSync(envPath)) {
      this.log('warnings', 'No .env.local file found', 'Copy .env.security.template to .env.local')
      return
    }

    const envContent = fs.readFileSync(envPath, 'utf8')
    
    // Critical environment variables that must be present
    const criticalVars = [
      'JWT_SECRET',
      'DATABASE_URL',
      'CORS_ORIGIN'
    ]

    criticalVars.forEach(varName => {
      if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)) {
        this.log('failed', `Missing or default value for ${varName}`, 'Set a secure value in .env.local')
      } else {
        this.log('passed', `${varName} is configured`)
      }
    })

    // Check JWT secret strength
    const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/)
    if (jwtSecretMatch) {
      const jwtSecret = jwtSecretMatch[1].trim()
      if (jwtSecret.length < 32) {
        this.log('failed', 'JWT_SECRET is too short', 'Use at least 32 characters')
      } else if (jwtSecret.includes('your-') || jwtSecret === 'changeme') {
        this.log('failed', 'JWT_SECRET uses default/example value', 'Generate a secure random secret')
      } else {
        this.log('passed', 'JWT_SECRET appears to be properly configured')
      }
    }

    // Check for SSL configuration
    if (envContent.includes('sslmode=require') || envContent.includes('ssl=true')) {
      this.log('passed', 'Database SSL appears to be enabled')
    } else {
      this.log('warnings', 'Database SSL may not be properly configured', 'Ensure SSL is enabled in production')
    }
  }

  async checkDependencyVulnerabilities() {
    console.log('\n=== Dependency Vulnerability Check ===')
    
    try {
      // Check if package-lock.json exists
      const lockPath = path.join(this.rootDir, 'package-lock.json')
      if (!fs.existsSync(lockPath)) {
        this.log('warnings', 'package-lock.json not found', 'Run npm install to generate lock file')
        return
      }

      // Run npm audit
      const auditResult = execSync('npm audit --json', { cwd: this.rootDir, encoding: 'utf8' })
      const audit = JSON.parse(auditResult)
      
      if (audit.metadata.vulnerabilities.total === 0) {
        this.log('passed', 'No known vulnerabilities in dependencies')
      } else {
        const { high, critical, moderate, low } = audit.metadata.vulnerabilities
        if (critical > 0 || high > 0) {
          this.log('failed', `Found ${critical} critical and ${high} high severity vulnerabilities`, 'Run npm audit fix')
        } else if (moderate > 0) {
          this.log('warnings', `Found ${moderate} moderate severity vulnerabilities`, 'Consider running npm audit fix')
        } else if (low > 0) {
          this.log('info', `Found ${low} low severity vulnerabilities`)
        }
      }
    } catch (error) {
      this.log('info', 'Could not run npm audit', error.message)
    }
  }

  async checkFilePermissions() {
    console.log('\n=== File Permissions Check ===')
    
    const sensitiveFiles = [
      '.env.local',
      '.env',
      'database/migrations/',
      'scripts/'
    ]

    sensitiveFiles.forEach(filePath => {
      const fullPath = path.join(this.rootDir, filePath)
      if (fs.existsSync(fullPath)) {
        try {
          const stats = fs.statSync(fullPath)
          const mode = stats.mode & parseInt('777', 8)
          
          if (filePath.includes('.env')) {
            // Environment files should not be world-readable
            if (mode & parseInt('044', 8)) {
              this.log('warnings', `${filePath} may be world-readable`, `chmod 600 ${filePath}`)
            } else {
              this.log('passed', `${filePath} has secure permissions`)
            }
          } else {
            this.log('info', `${filePath} permissions: ${mode.toString(8)}`)
          }
        } catch (error) {
          this.log('info', `Could not check permissions for ${filePath}`, error.message)
        }
      }
    })
  }

  async checkCodePatterns() {
    console.log('\n=== Code Security Patterns Check ===')
    
    const securityPatterns = [
      {
        pattern: /rejectUnauthorized:\s*false/g,
        file: 'database connection files',
        message: 'Found rejectUnauthorized: false - potential MITM vulnerability',
        severity: 'failed'
      },
      {
        pattern: /process\.env\.[A-Z_]+.*console\.log/g,
        file: '*.js, *.ts files',
        message: 'Potential environment variable logging',
        severity: 'warnings'
      },
      {
        pattern: /password.*=.*req\.(body|query)/g,
        file: '*.js, *.ts files',
        message: 'Password directly from request parameters',
        severity: 'failed'
      },
      {
        pattern: /eval\s*\(/g,
        file: '*.js, *.ts files',
        message: 'Use of eval() detected - potential code injection',
        severity: 'failed'
      }
    ]

    // Search for security anti-patterns in code files
    this.searchPatterns(this.rootDir, securityPatterns)
  }

  searchPatterns(dir, patterns, exclude = ['node_modules', '.git', 'dist', 'build']) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory() && !exclude.includes(file)) {
        this.searchPatterns(filePath, patterns, exclude)
      } else if (stat.isFile() && /\.(js|ts|jsx|tsx)$/.test(file)) {
        const content = fs.readFileSync(filePath, 'utf8')
        
        patterns.forEach(({ pattern, message, severity }) => {
          const matches = content.match(pattern)
          if (matches) {
            const relativePath = path.relative(this.rootDir, filePath)
            this.log(severity, `${relativePath}: ${message}`, `Found ${matches.length} occurrence(s)`)
          }
        })
      }
    })
  }

  async checkDatabaseSecurity() {
    console.log('\n=== Database Security Check ===')
    
    // Check database connection files for security patterns
    const dbFiles = [
      'lib/database/connection.ts',
      'src/lib/database/connection.ts'
    ]

    let foundSecureConfig = false
    
    dbFiles.forEach(filePath => {
      const fullPath = path.join(this.rootDir, filePath)
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8')
        
        // Check for parameterized queries
        if (content.includes('query(') && content.includes('params')) {
          this.log('passed', 'Parameterized queries detected in database layer')
        }
        
        // Check for SSL configuration
        if (content.includes('rejectUnauthorized: true')) {
          this.log('passed', 'SSL certificate validation enabled')
          foundSecureConfig = true
        } else if (content.includes('rejectUnauthorized: false')) {
          this.log('failed', 'SSL certificate validation disabled', 'This allows MITM attacks')
        }
        
        // Check for connection pooling
        if (content.includes('Pool') || content.includes('pool')) {
          this.log('passed', 'Database connection pooling implemented')
        }
      }
    })
    
    if (!foundSecureConfig) {
      this.log('warnings', 'Could not verify SSL configuration in database files')
    }
  }

  async checkAPIRoutes() {
    console.log('\n=== API Routes Security Check ===')
    
    const apiDir = path.join(this.rootDir, 'src/app/api')
    if (!fs.existsSync(apiDir)) {
      this.log('info', 'No API routes directory found')
      return
    }

    this.checkAPIDirectory(apiDir)
  }

  checkAPIDirectory(dir) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        this.checkAPIDirectory(filePath)
      } else if (file === 'route.ts' || file === 'route.js') {
        const content = fs.readFileSync(filePath, 'utf8')
        const relativePath = path.relative(this.rootDir, filePath)
        
        // Check for authentication
        if (content.includes('authenticateApiRequest') || content.includes('withAuth')) {
          this.log('passed', `${relativePath}: Authentication middleware detected`)
        } else {
          this.log('warnings', `${relativePath}: No authentication middleware detected`, 'Consider adding authentication if needed')
        }
        
        // Check for rate limiting
        if (content.includes('rateLimit') || content.includes('applyRateLimit')) {
          this.log('passed', `${relativePath}: Rate limiting detected`)
        } else {
          this.log('warnings', `${relativePath}: No rate limiting detected`)
        }
        
        // Check for input validation
        if (content.includes('validate') || content.includes('schema') || content.includes('zod')) {
          this.log('passed', `${relativePath}: Input validation detected`)
        } else {
          this.log('warnings', `${relativePath}: No input validation detected`)
        }
        
        // Check for IDOR protection
        if (content.includes('requireResourceAccess') || content.includes('checkOwnership')) {
          this.log('passed', `${relativePath}: Resource access control detected`)
        } else if (content.includes('userId') && !content.includes('requireResourceAccess')) {
          this.log('failed', `${relativePath}: Potential IDOR vulnerability`, 'User ID accessed without ownership verification')
        }
      }
    })
  }

  async checkSecurityHeaders() {
    console.log('\n=== Security Headers Check ===')
    
    const middlewarePath = path.join(this.rootDir, 'middleware.ts')
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf8')
      
      const securityHeaders = [
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection'
      ]
      
      securityHeaders.forEach(header => {
        if (content.includes(header)) {
          this.log('passed', `${header} security header configured`)
        } else {
          this.log('warnings', `${header} security header not found`)
        }
      })
      
      // Check for CORS configuration
      if (content.includes('cors') || content.includes('Access-Control-Allow-Origin')) {
        this.log('passed', 'CORS configuration detected')
      } else {
        this.log('warnings', 'No CORS configuration detected')
      }
    } else {
      this.log('failed', 'No middleware.ts found', 'Security headers middleware not implemented')
    }
  }

  generateReport() {
    console.log('\n=== SECURITY AUDIT REPORT ===')
    console.log(`Generated: ${new Date().toISOString()}`)
    console.log(`Total Checks: ${this.results.passed.length + this.results.failed.length + this.results.warnings.length + this.results.info.length}`)
    console.log(`✓ Passed: ${this.results.passed.length}`)
    console.log(`✗ Failed: ${this.results.failed.length}`)
    console.log(`⚠ Warnings: ${this.results.warnings.length}`)
    console.log(`ℹ Info: ${this.results.info.length}`)
    
    if (this.results.failed.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO FIX:')
      this.results.failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.message}`)
        if (result.details) console.log(`   ${result.details}`)
      })
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS TO REVIEW:')
      this.results.warnings.forEach((result, index) => {
        console.log(`${index + 1}. ${result.message}`)
        if (result.details) console.log(`   ${result.details}`)
      })
    }
    
    // Save detailed report
    const reportPath = path.join(this.rootDir, 'security-audit-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    console.log(`\nDetailed report saved to: ${reportPath}`)
    
    // Exit with error code if critical issues found
    if (this.results.failed.length > 0) {
      console.log('\n❌ Security audit failed. Please fix critical issues before deploying.')
      process.exit(1)
    } else {
      console.log('\n✅ Security audit passed!')
    }
  }

  async runAudit() {
    console.log('🔒 Starting Security Audit...')
    
    try {
      await this.checkEnvironmentVariables()
      await this.checkDependencyVulnerabilities()
      await this.checkFilePermissions()
      await this.checkCodePatterns()
      await this.checkDatabaseSecurity()
      await this.checkAPIRoutes()
      await this.checkSecurityHeaders()
    } catch (error) {
      this.log('failed', 'Security audit encountered an error', error.message)
    }
    
    this.generateReport()
  }
}

// Run the audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor()
  auditor.runAudit().catch(console.error)
}

module.exports = SecurityAuditor