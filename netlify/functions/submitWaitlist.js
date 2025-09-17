const { Pool } = require('pg');

// Database connection function
function getDatabase() {
  // Determine SSL configuration
  let sslConfig = false;
  
  // For production and AWS RDS, enable SSL
  if (process.env.NODE_ENV === 'production' || 
      (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.rds.amazonaws.com'))) {
    sslConfig = { 
      rejectUnauthorized: false // For AWS RDS in production
    };
  }

  console.log('Database configuration:', {
    hasURL: !!process.env.DATABASE_URL,
    isProduction: process.env.NODE_ENV === 'production',
    isAWS: process.env.DATABASE_URL ? process.env.DATABASE_URL.includes('.rds.amazonaws.com') : false,
    sslEnabled: !!sslConfig
  });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 3, // Reduced for Netlify functions
    connectionTimeoutMillis: 15000, // Increased timeout
    idleTimeoutMillis: 10000,
    statement_timeout: 10000, // Query timeout
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  return {
    async initialize() {
      console.log('Initializing database connection...');
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        console.log('Database connection test successful');
      } finally {
        client.release();
      }
    },
    async query(text, params) {
      console.log('Executing query:', text.substring(0, 50) + '...');
      const client = await pool.connect();
      try {
        const result = await client.query(text, params);
        console.log('Query executed successfully, rows:', result.rows ? result.rows.length : 0);
        return result;
      } catch (queryError) {
        console.error('Query execution failed:', queryError.message);
        throw queryError;
      } finally {
        client.release();
      }
    },
    async end() {
      await pool.end();
    }
  };
}

exports.handler = async (event, context) => {
  // Log request info for debugging
  console.log('Waitlist submission request:', {
    method: event.httpMethod,
    hasBody: !!event.body,
    bodyLength: event.body ? event.body.length : 0,
    headers: event.headers ? Object.keys(event.headers) : []
  });

  // Check environment variables first
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is missing');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Configuration error',
        message: 'Database not configured. Please contact support.',
        details: 'DB_URL_MISSING'
      }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    const { name, email } = body;

    // Validate required fields
    if (!name || !email) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Name and email are required' }),
      };
    }

    // Validate name (minimum 2 characters)
    if (name.trim().length < 2) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Name must be at least 2 characters long' }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Please enter a valid email address' }),
      };
    }

    // Initialize database connection
    const db = getDatabase();
    await db.initialize();

    // Check if email already exists
    const existingEntry = await db.query(
      'SELECT id, email FROM waitlist WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingEntry.rows.length > 0) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Email already registered',
          message: 'This email is already on our waitlist!' 
        }),
      };
    }

    // Insert new waitlist entry
    const result = await db.query(
      `INSERT INTO waitlist (name, email, source, metadata) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, created_at`,
      [
        name.trim(),
        email.toLowerCase(),
        'landing_page',
        JSON.stringify({ 
          user_agent: event.headers['user-agent'] || '',
          ip_address: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || '',
          timestamp: new Date().toISOString()
        })
      ]
    );

    const newEntry = result.rows[0];

    // Return success response
    return {
      statusCode: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Successfully joined the waitlist!',
        data: {
          id: newEntry.id,
          name: newEntry.name,
          email: newEntry.email,
          joined_at: newEntry.created_at
        }
      }),
    };

  } catch (error) {
    console.error('Error submitting waitlist entry:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });
    
    // Log environment info for debugging
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasDBURL: !!process.env.DATABASE_URL,
      dbURLPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'missing'
    });
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Email already registered',
          message: 'This email is already on our waitlist!' 
        }),
      };
    }

    // Database connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('Database connection failed:', error.message);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Database connection failed', 
          message: 'Unable to connect to database. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? error.message : 'DB_CONN_ERROR'
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: 'Something went wrong. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : error.code || 'UNKNOWN_ERROR'
      }),
    };
  }
};