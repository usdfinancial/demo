import { z } from 'zod'

// Common validation patterns
export const ValidationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
  walletAddress: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^0x[a-fA-F0-9]{40}$|^[a-zA-Z0-9]{32,44}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  slug: /^[a-z0-9-]+$/
}

// Base schemas
export const IdSchema = z.string().uuid('Invalid ID format')
export const EmailSchema = z.string().email('Invalid email format').max(254)
export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(ValidationPatterns.password, 'Password must contain uppercase, lowercase, number, and special character')
export const PhoneSchema = z.string().regex(ValidationPatterns.phone, 'Invalid phone number format')

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
})

// User-related schemas
export const CreateUserSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  phone: PhoneSchema.optional(),
  dateOfBirth: z.string().date().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'Must agree to terms'),
  referralCode: z.string().max(20).optional()
})

export const UpdateUserProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phone: PhoneSchema.optional(),
  dateOfBirth: z.string().date().optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().max(50).optional()
})

export const UserPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  currency: z.string().length(3).default('USD'),
  language: z.string().length(2).default('en'),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  twoFactorEnabled: z.boolean().default(false)
})

// Wallet-related schemas
export const WalletTypeSchema = z.enum(['custodial', 'external', 'smart_wallet'])
export const ChainIdSchema = z.number().int().positive()

export const AddWalletSchema = z.object({
  chainId: ChainIdSchema,
  address: z.string().regex(ValidationPatterns.walletAddress, 'Invalid wallet address'),
  walletType: WalletTypeSchema,
  label: z.string().min(1).max(50).trim(),
  isPrimary: z.boolean().default(false)
})

// Transaction-related schemas
export const TransactionTypeSchema = z.enum(['send', 'receive', 'swap', 'bridge', 'stake', 'yield'])
export const TransactionStatusSchema = z.enum(['pending', 'confirmed', 'failed', 'cancelled'])

export const CreateTransactionSchema = z.object({
  type: TransactionTypeSchema,
  fromAddress: z.string().regex(ValidationPatterns.walletAddress),
  toAddress: z.string().regex(ValidationPatterns.walletAddress),
  amount: z.string().regex(/^\d+\.?\d*$/, 'Invalid amount format'),
  tokenAddress: z.string().regex(ValidationPatterns.ethereumAddress).optional(),
  chainId: ChainIdSchema,
  gasLimit: z.string().regex(/^\d+$/).optional(),
  gasPrice: z.string().regex(/^\d+$/).optional(),
  metadata: z.record(z.any()).optional()
})

// Investment-related schemas
export const InvestmentTypeSchema = z.enum(['defi', 'staking', 'liquidity_pool', 'yield_farming'])
export const InvestmentStrategySchema = z.enum(['conservative', 'balanced', 'aggressive'])

export const CreateInvestmentSchema = z.object({
  type: InvestmentTypeSchema,
  strategy: InvestmentStrategySchema,
  amount: z.string().regex(/^\d+\.?\d*$/, 'Invalid amount format'),
  tokenAddress: z.string().regex(ValidationPatterns.ethereumAddress),
  chainId: ChainIdSchema,
  targetYield: z.number().min(0).max(100).optional(),
  duration: z.number().int().positive().optional(), // days
  autoReinvest: z.boolean().default(false)
})

// Notification schemas
export const NotificationTypeSchema = z.enum(['info', 'warning', 'error', 'success'])
export const NotificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent'])

export const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  message: z.string().min(1).max(500).trim(),
  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema.default('normal'),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional()
})

// API query parameter schemas
export const UserQuerySchema = z.object({
  userId: IdSchema,
  action: z.enum(['profile', 'dashboard', 'wallets', 'transactions', 'investments']).optional()
})

export const TransactionQuerySchema = z.object({
  userId: IdSchema,
  chainId: ChainIdSchema.optional(),
  type: TransactionTypeSchema.optional(),
  status: TransactionStatusSchema.optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional()
}).merge(PaginationSchema)

// Security-related schemas
export const PasswordResetSchema = z.object({
  email: EmailSchema,
  captchaToken: z.string().min(1, 'Captcha verification required')
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: PasswordSchema,
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const TwoFactorSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Invalid 2FA code format'),
  backupCode: z.string().optional()
})

// File upload schemas
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'application/pdf'])
})

// API rate limiting schemas
export const RateLimitConfigSchema = z.object({
  windowMs: z.number().int().positive().default(60000), // 1 minute
  maxRequests: z.number().int().positive().default(100),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false)
})

// Environment variable validation
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ALGORITHM: z.enum(['HS256', 'RS256']).default('HS256'),
  JWT_ISSUER: z.string().default('USD-Financial'),
  JWT_AUDIENCE: z.string().default('USD-Financial-API'),
  JWT_EXPIRATION: z.string().default('24h'),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100)
})

// Generic validation helpers
export function createArraySchema<T extends z.ZodType>(itemSchema: T, maxItems = 100) {
  return z.array(itemSchema).max(maxItems)
}

export function createPaginatedResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().min(0),
      totalPages: z.number().int().min(0),
      hasNext: z.boolean(),
      hasPrev: z.boolean()
    })
  })
}

// Export commonly used combined schemas
export const UserWithWalletsSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  firstName: z.string(),
  lastName: z.string(),
  wallets: createArraySchema(z.object({
    id: IdSchema,
    address: z.string(),
    chainId: z.number(),
    walletType: WalletTypeSchema,
    label: z.string(),
    isPrimary: z.boolean()
  }))
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>
export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>
export type AddWalletInput = z.infer<typeof AddWalletSchema>
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
export type CreateInvestmentInput = z.infer<typeof CreateInvestmentSchema>
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>
export type UserQueryParams = z.infer<typeof UserQuerySchema>
export type TransactionQueryParams = z.infer<typeof TransactionQuerySchema>
export type PaginationParams = z.infer<typeof PaginationSchema>