const { Pool } = require('pg');

// Database connection configuration
let pool;
function getPool() {
  if (!pool) {
    const connStr = process.env.DATABASE_URL;
    if (connStr && connStr.includes('rds.amazonaws.com')) {
      const url = new URL(connStr);
      pool = new Pool({
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        ssl: { 
          rejectUnauthorized: false,
          require: true
        }
      });
    } else {
      pool = new Pool({ connectionString: connStr });
    }
  }
  return pool;
}

// Generate UUID
function generateId() {
  return require('crypto').randomUUID();
}

// Enhanced validation functions for data consistency with TypeScript service
function validateWalletAddress(address, fieldName = 'address') {
  if (!address || typeof address !== 'string') {
    throw new Error(`${fieldName} must be a valid address string`);
  }

  // Ethereum address validation (42 characters, starts with 0x)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(address)) {
    throw new Error(`Invalid address format for ${fieldName}: ${address}`);
  }

  return address.toLowerCase();
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return null; // Email is optional
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Email length validation
  if (email.length > 255) {
    throw new Error('Email address too long (max 255 characters)');
  }

  return email.toLowerCase();
}

function validateAuthMethod(method) {
  const allowedMethods = ['email', 'google', 'passkey', 'wallet'];
  if (!allowedMethods.includes(method)) {
    throw new Error(`Invalid auth method: ${method}. Must be one of: ${allowedMethods.join(', ')}`);
  }
  return method;
}

function validateCreateUserData(userData) {
  const errors = [];

  // Validate required fields
  if (!userData.smartWalletAddress) {
    errors.push('Smart wallet address is required');
  }

  try {
    if (userData.smartWalletAddress) {
      userData.smartWalletAddress = validateWalletAddress(userData.smartWalletAddress, 'smartWalletAddress');
    }

    if (userData.eoaAddress) {
      userData.eoaAddress = validateWalletAddress(userData.eoaAddress, 'eoaAddress');
    }

    if (userData.email) {
      userData.email = validateEmail(userData.email);
    }

    if (userData.authMethod) {
      userData.authMethod = validateAuthMethod(userData.authMethod);
    } else {
      userData.authMethod = 'email'; // Default
    }

    // Business rule validation
    if (userData.authMethod === 'email' && !userData.email) {
      errors.push('Email is required when authMethod is "email"');
    }

  } catch (error) {
    errors.push(error.message);
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return userData;
}

// Request utilities
function getRequestInfo(event) {
  return {
    ipAddress: event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               event.headers['x-real-ip'] || 
               event.headers['client-ip'] || 
               'unknown',
    userAgent: event.headers['user-agent'] || 'unknown',
    deviceFingerprint: event.headers['x-device-fingerprint'] || 'unknown',
    geolocation: {}
  };
}

function calculateRiskScore(event) {
  // Simple risk scoring based on available headers
  let score = 0;
  if (!event.headers['user-agent']) score += 10;
  if (!event.headers['x-forwarded-for']) score += 5;
  return Math.min(score, 100);
}

// Normalize login method based on reported value, user agent, and email presence
function normalizeLoginMethod(reportedMethod, userAgent = '', email) {
  const allowed = ['email', 'google', 'passkey', 'wallet'];
  if (allowed.includes(reportedMethod)) return reportedMethod;

  const ua = (userAgent || '').toLowerCase();

  // Heuristics similar to server service
  if (ua.includes('google') || ua.includes('gapi') || ua.includes('oauth')) return 'google';
  if (ua.includes('webauthn') || ua.includes('passkey')) return 'passkey';
  if (ua.includes('alchemy') || ua.includes('account-kit') || ua.includes('smart-account') || !email) return 'wallet';

  return email ? 'email' : 'wallet';
}

// User service functions
async function createUser(userData) {
  // Validate user data for consistency with TypeScript service
  const validatedData = validateCreateUserData(userData);

  const client = await getPool().connect();
  try {
    const userId = generateId();

    console.log('✅ Creating user with validated data:', {
      email: validatedData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
      smartWalletAddress: validatedData.smartWalletAddress?.substring(0, 6) + '...',
      authMethod: validatedData.authMethod
    });

    const query = `
      INSERT INTO users (
        id, email, smart_wallet_address, eoa_address, primary_auth_method,
        first_name, last_name, email_verified, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
      RETURNING *
    `;

    const result = await client.query(query, [
      userId,
      validatedData.email || null,
      validatedData.smartWalletAddress || null,
      validatedData.eoaAddress || null,
      validatedData.authMethod,
      validatedData.profile?.firstName || null,
      validatedData.profile?.lastName || null,
      false
    ]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create user');
    }
    
    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      smartWalletAddress: result.rows[0].smart_wallet_address,
      eoaAddress: result.rows[0].eoa_address,
      authMethod: result.rows[0].primary_auth_method,
      isEmailVerified: result.rows[0].email_verified,
      createdAt: result.rows[0].created_at,
      profile: {
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name
      }
    };
  } finally {
    client.release();
  }
}

async function findUserByEmail(email) {
  const client = await getPool().connect();
  try {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 AND is_active = true
      ORDER BY created_at ASC
      LIMIT 1
    `;
    
    const result = await client.query(query, [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      smartWalletAddress: result.rows[0].smart_wallet_address,
      eoaAddress: result.rows[0].eoa_address,
      authMethod: result.rows[0].primary_auth_method,
      isEmailVerified: result.rows[0].email_verified,
      createdAt: result.rows[0].created_at,
      lastAuthAt: result.rows[0].last_auth_at,
      profile: {
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name
      }
    };
  } finally {
    client.release();
  }
}

async function findUserByWalletAddress(walletAddress) {
  const client = await getPool().connect();
  try {
    const query = `
      SELECT * FROM users 
      WHERE smart_wallet_address = $1 AND is_active = true
      LIMIT 1
    `;
    
    const result = await client.query(query, [walletAddress.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      smartWalletAddress: result.rows[0].smart_wallet_address,
      eoaAddress: result.rows[0].eoa_address,
      authMethod: result.rows[0].primary_auth_method,
      isEmailVerified: result.rows[0].email_verified,
      createdAt: result.rows[0].created_at,
      lastAuthAt: result.rows[0].last_auth_at,
      profile: {
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name
      }
    };
  } finally {
    client.release();
  }
}

async function updateLastAuth(userId) {
  const client = await getPool().connect();
  try {
    const query = `
      UPDATE users 
      SET last_auth_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;
    
    await client.query(query, [userId]);
  } finally {
    client.release();
  }
}

async function recordLoginAttempt(data) {
  const client = await getPool().connect();
  try {
    // Check for recent duplicate successful login attempts to prevent double recording
    if (data.loginStatus === 'success') {
      const duplicateCheckQuery = `
        SELECT id FROM login_history
        WHERE login_status = 'success'
          AND created_at > NOW() - INTERVAL '2 minutes'
          AND (
            (user_id = $1 AND user_id IS NOT NULL) OR
            (email = $2 AND ip_address = $3 AND email IS NOT NULL AND ip_address IS NOT NULL)
          )
        LIMIT 1
      `;

      const duplicateResult = await client.query(duplicateCheckQuery, [
        data.userId || null,
        data.email?.toLowerCase() || null,
        data.ipAddress || null
      ]);

      if (duplicateResult.rows.length > 0) {
        console.log('🚫 Duplicate successful login attempt detected (Netlify), skipping:', {
          userId: data.userId,
          email: data.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          existingId: duplicateResult.rows[0].id
        });

        // Return existing record ID to indicate success without creating duplicate
        return { id: duplicateResult.rows[0].id, duplicate: true };
      }
    }

    // Backfill email from users table if missing but we have userId
    let email = data.email;
    if ((!email || email === 'unknown') && data.userId) {
      try {
        const userRes = await client.query('SELECT email FROM users WHERE id = $1', [data.userId]);
        const dbEmail = userRes.rows[0]?.email;
        if (dbEmail) email = dbEmail;
      } catch (e) {
        console.warn('⚠️ Could not backfill email from users table:', e.message);
      }
    }

    // Normalize login method to allowed set
    const normalizedMethod = normalizeLoginMethod(
      data.loginMethod,
      data.userAgent || '',
      email
    );

    const loginId = generateId();

    const query = `
      INSERT INTO login_history (
        id, user_id, email, login_method, login_status,
        ip_address, user_agent, device_fingerprint, geolocation,
        risk_score, failure_reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const result = await client.query(query, [
      loginId,
      data.userId || null,
      email ? email.toLowerCase() : null,
      normalizedMethod,
      data.loginStatus,
      data.ipAddress || null,
      data.userAgent || null,
      data.deviceFingerprint || null,
      data.geolocation ? JSON.stringify(data.geolocation) : null,
      data.riskScore || null,
      data.failureReason || null
    ]);

    console.log(`${data.loginStatus === 'success' ? '✅' : '❌'} Login attempt recorded:`, {
      originalMethod: data.loginMethod,
      normalizedMethod,
      methodCorrected: data.loginMethod !== normalizedMethod,
      status: data.loginStatus,
      email: (email || '')?.replace(/(.{2}).*(@.*)/, '$1***$2'),
      ipAddress: data.ipAddress?.replace(/(\d+\.\d+).*/, '$1.x.x'),
      riskScore: data.riskScore,
      timestamp: new Date().toISOString()
    });

    return result.rows[0];
  } finally {
    client.release();
  }
}

// Main handler function
exports.handler = async (event, context) => {
  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Info',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Info',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    console.log('🚨 AUTH API CALLED:', {
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      headers: event.headers,
      path: event.path
    });

    const body = JSON.parse(event.body || '{}');
    const { action } = body;
    const requestInfo = getRequestInfo(event);

    let clientInfo = {};
    if (event.headers['x-client-info']) {
      try {
        clientInfo = JSON.parse(event.headers['x-client-info']);
      } catch (e) {
        // Ignore invalid client info
      }
    }

    switch (action) {
      case 'find-user':
        const { email: findEmail, smartWalletAddress: findWallet } = body;
        
        if (!findEmail && !findWallet) {
          throw new Error('Either email or smartWalletAddress is required');
        }

        let user = null;
        if (findEmail) {
          user = await findUserByEmail(findEmail);
        } else if (findWallet) {
          user = await findUserByWalletAddress(findWallet);
        }

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            data: user,
            timestamp: new Date().toISOString()
          })
        };

      case 'create-user':
        const { userData, loginMethod } = body;
        
        try {
          const newUser = await createUser(userData);
          
          // Record successful login attempt
          console.log('🚨 RECORDING LOGIN HISTORY - CREATE USER:', {
            userId: newUser.id,
            email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
            loginMethod: loginMethod || userData.authMethod
          });
          
          await recordLoginAttempt({
            userId: newUser.id,
            email: userData.email,
            loginMethod: loginMethod || userData.authMethod,
            loginStatus: 'success',
            ipAddress: requestInfo.ipAddress,
            userAgent: requestInfo.userAgent || clientInfo.userAgent,
            deviceFingerprint: requestInfo.deviceFingerprint || clientInfo.deviceFingerprint,
            geolocation: requestInfo.geolocation,
            riskScore: calculateRiskScore(event)
          });
          
          console.log('✅ LOGIN HISTORY RECORDED SUCCESSFULLY');
          
          console.log('✅ New user signup completed with full audit trail:', {
            userId: newUser.id,
            email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
            method: loginMethod
          });
          
          return {
            statusCode: 201,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: true,
              data: {
                ...newUser,
                sessionToken: 'netlify-session-' + generateId(),
                sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              },
              timestamp: new Date().toISOString()
            })
          };
          
        } catch (error) {
          // Record failed signup attempt
          await recordLoginAttempt({
            email: userData.email,
            loginMethod: loginMethod || userData.authMethod,
            loginStatus: 'failed',
            ipAddress: requestInfo.ipAddress,
            userAgent: requestInfo.userAgent || clientInfo.userAgent,
            deviceFingerprint: requestInfo.deviceFingerprint || clientInfo.deviceFingerprint,
            geolocation: requestInfo.geolocation,
            riskScore: calculateRiskScore(event),
            failureReason: error.message || 'Unknown signup error'
          });
          
          throw error;
        }

      case 'update-last-auth':
        const { userId: authUserId, email: authEmail, smartWalletAddress: authWallet, loginMethod: authLoginMethod } = body;
        
        let targetUserId = authUserId;
        let foundUser = null;
        
        if (!targetUserId) {
          if (authEmail) {
            foundUser = await findUserByEmail(authEmail);
          } else if (authWallet) {
            foundUser = await findUserByWalletAddress(authWallet);
          }
          
          if (!foundUser) {
            await recordLoginAttempt({
              email: authEmail,
              loginMethod: authLoginMethod || 'email',
              loginStatus: 'failed',
              ipAddress: requestInfo.ipAddress,
              userAgent: requestInfo.userAgent || clientInfo.userAgent,
              deviceFingerprint: requestInfo.deviceFingerprint || clientInfo.deviceFingerprint,
              geolocation: requestInfo.geolocation,
              riskScore: calculateRiskScore(event),
              failureReason: 'User not found'
            });
            
            throw new Error('User not found');
          }
          targetUserId = foundUser.id;
        }
        
        // Update last auth time
        await updateLastAuth(targetUserId);
        
        // Record successful login attempt
        console.log('🚨 RECORDING LOGIN HISTORY - UPDATE AUTH:', {
          userId: targetUserId,
          email: foundUser?.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          loginMethod: authLoginMethod || 'email'
        });
        
        await recordLoginAttempt({
          userId: targetUserId,
          email: foundUser?.email,
          loginMethod: authLoginMethod || 'email',
          loginStatus: 'success',
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent || clientInfo.userAgent,
          deviceFingerprint: requestInfo.deviceFingerprint || clientInfo.deviceFingerprint,
          geolocation: requestInfo.geolocation,
          riskScore: calculateRiskScore(event)
        });
        
        console.log('✅ LOGIN HISTORY RECORDED SUCCESSFULLY');
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            data: { 
              updated: true,
              sessionToken: 'netlify-session-' + generateId(),
              sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            },
            timestamp: new Date().toISOString()
          })
        };

      case 'log-failed-signup':
        const { email: failedEmail, loginMethod: failedMethod, error: failedError } = body;
        
        await recordLoginAttempt({
          email: failedEmail,
          loginMethod: failedMethod,
          loginStatus: 'failed',
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent || clientInfo.userAgent,
          deviceFingerprint: requestInfo.deviceFingerprint || clientInfo.deviceFingerprint,
          geolocation: requestInfo.geolocation,
          riskScore: calculateRiskScore(event),
          failureReason: failedError
        });

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            data: { logged: true },
            timestamp: new Date().toISOString()
          })
        };

      default:
        throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('❌ Auth API error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};