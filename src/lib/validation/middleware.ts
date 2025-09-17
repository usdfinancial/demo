import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ServiceError, ErrorCode } from '@/lib/services/baseService'

export class ValidationError extends Error {
  public readonly errors: z.ZodIssue[]

  constructor(errors: z.ZodIssue[]) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export interface ValidationOptions {
  stripUnknown?: boolean
  allowUnknown?: boolean
  abortEarly?: boolean
}

export class RequestValidator {
  static async validateBody<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>,
    options: ValidationOptions = {}
  ): Promise<T> {
    try {
      const body = await request.json()
      return await this.validateData(body, schema, options)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ServiceError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid JSON in request body',
          'validateBody',
          { originalError: error.message }
        )
      }
      throw error
    }
  }

  static validateQuery<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>,
    options: ValidationOptions = {}
  ): T {
    const { searchParams } = new URL(request.url)
    const query: Record<string, any> = {}
    
    for (const [key, value] of searchParams.entries()) {
      query[key] = value
    }

    return this.validateData(query, schema, options)
  }

  static validateHeaders<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>,
    options: ValidationOptions = {}
  ): T {
    const headers: Record<string, any> = {}
    
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    return this.validateData(headers, schema, options)
  }

  static validateData<T>(
    data: any,
    schema: z.ZodSchema<T>,
    options: ValidationOptions = {}
  ): T {
    try {
      const parseOptions: any = {
        path: [],
        errorMap: undefined,
        async: false
      }
      
      if (options.abortEarly === false) {
        parseOptions.async = false
      }

      const result = schema.safeParse(data, parseOptions)
      
      if (!result.success) {
        const formattedErrors = this.formatZodErrors(result.error.issues)
        throw new ServiceError(
          ErrorCode.VALIDATION_ERROR,
          'Request validation failed',
          'validateData',
          { validationErrors: formattedErrors }
        )
      }

      return result.data
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error
      }
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        'Validation error occurred',
        'validateData',
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  private static formatZodErrors(issues: z.ZodIssue[]): Array<{
    field: string
    message: string
    code: string
    received?: any
  }> {
    return issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code,
      received: 'received' in issue ? issue.received : undefined
    }))
  }

  // Sanitization helpers
  static sanitizeString(input: string, options: {
    maxLength?: number
    trim?: boolean
    toLowerCase?: boolean
    removeHtml?: boolean
    removeSpecialChars?: boolean
  } = {}): string {
    let result = input

    if (options.trim !== false) {
      result = result.trim()
    }

    if (options.toLowerCase) {
      result = result.toLowerCase()
    }

    if (options.removeHtml) {
      result = result.replace(/<[^>]*>/g, '')
    }

    if (options.removeSpecialChars) {
      result = result.replace(/[^\w\s-]/g, '')
    }

    if (options.maxLength && result.length > options.maxLength) {
      result = result.substring(0, options.maxLength)
    }

    return result
  }

  static sanitizeEmail(email: string): string {
    return this.sanitizeString(email, {
      trim: true,
      toLowerCase: true,
      maxLength: 254
    })
  }

  static sanitizeNumeric(input: string): string {
    return input.replace(/[^0-9.-]/g, '')
  }

  static sanitizeAlphanumeric(input: string): string {
    return input.replace(/[^a-zA-Z0-9]/g, '')
  }

  static sanitizeSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

// File validation utilities
export class FileValidator {
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  static validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes
  }

  static validateFileName(fileName: string): boolean {
    // Prevent directory traversal and dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1F]/
    const pathTraversal = /\.\./
    
    return !dangerousChars.test(fileName) && !pathTraversal.test(fileName)
  }

  static validateFile(
    file: File,
    options: {
      maxSize?: number
      allowedTypes?: string[]
      allowedExtensions?: string[]
    } = {}
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check file size
    if (options.maxSize && !this.validateFileSize(file, options.maxSize)) {
      errors.push(`File size exceeds maximum of ${options.maxSize} bytes`)
    }

    // Check file type
    if (options.allowedTypes && !this.validateFileType(file, options.allowedTypes)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !options.allowedExtensions.includes(extension)) {
        errors.push(`File extension .${extension} is not allowed`)
      }
    }

    // Check file name
    if (!this.validateFileName(file.name)) {
      errors.push('Invalid file name')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Security validation utilities
export class SecurityValidator {
  private static readonly SUSPICIOUS_PATTERNS = [
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/i,
    // Script injection patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    // Command injection patterns
    /[;&|`$()]/,
    // Path traversal
    /\.\.[\/\\]/,
    // Common attack payloads
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
  ]

  static validateInput(input: string): { isSafe: boolean; threats: string[] } {
    const threats: string[] = []

    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        threats.push(`Suspicious pattern detected: ${pattern.source}`)
      }
    }

    // Check for excessive length (potential DoS)
    if (input.length > 10000) {
      threats.push('Input exceeds maximum allowed length')
    }

    // Check for null bytes
    if (input.includes('\0')) {
      threats.push('Null byte detected')
    }

    return {
      isSafe: threats.length === 0,
      threats
    }
  }

  static validateUrl(url: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      const parsedUrl = new URL(url)
      
      // Only allow HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.push('Only HTTP and HTTPS protocols are allowed')
      }

      // Prevent localhost and internal network access in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsedUrl.hostname.toLowerCase()
        
        if (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')
        ) {
          errors.push('Internal network URLs are not allowed')
        }
      }

    } catch (error) {
      errors.push('Invalid URL format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Helper function to validate request with multiple schemas
export async function validateRequest<
  TBody = any,
  TQuery = any,
  THeaders = any
>(
  request: NextRequest,
  schemas: {
    body?: z.ZodSchema<TBody>
    query?: z.ZodSchema<TQuery>
    headers?: z.ZodSchema<THeaders>
  }
): Promise<{
  body?: TBody
  query?: TQuery
  headers?: THeaders
}> {
  const result: any = {}

  if (schemas.body) {
    result.body = await RequestValidator.validateBody(request, schemas.body)
  }

  if (schemas.query) {
    result.query = RequestValidator.validateQuery(request, schemas.query)
  }

  if (schemas.headers) {
    result.headers = RequestValidator.validateHeaders(request, schemas.headers)
  }

  return result
}

export default RequestValidator