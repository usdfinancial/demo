// Next.js API route for waitlist submissions (development fallback)
// This provides the same functionality as the Netlify function for local development

const { Pool } = require('pg');

// Database connection function
function getDatabase() {
  let sslConfig = false;
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.rds.amazonaws.com')) {
    sslConfig = { rejectUnauthorized: false };
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  return {
    async initialize() {
      // Test connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
    },
    async query(text, params) {
      const client = await pool.connect();
      try {
        return await client.query(text, params);
      } finally {
        client.release();
      }
    },
    async end() {
      await pool.end();
    }
  };
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Validate name (minimum 2 characters)
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
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
      return res.status(409).json({ 
        error: 'Email already registered',
        message: 'This email is already on our waitlist!' 
      });
    }

    // Get client IP and user agent for metadata
    const userAgent = req.headers['user-agent'] || '';
    const clientIp = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     '127.0.0.1';

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
          user_agent: userAgent,
          ip_address: clientIp,
          timestamp: new Date().toISOString(),
          source: 'nextjs_api'
        })
      ]
    );

    const newEntry = result.rows[0];

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data: {
        id: newEntry.id,
        name: newEntry.name,
        email: newEntry.email,
        joined_at: newEntry.created_at
      }
    });

  } catch (error) {
    console.error('Error submitting waitlist entry:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'Email already registered',
        message: 'This email is already on our waitlist!' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Something went wrong. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}