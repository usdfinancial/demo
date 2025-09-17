const { Pool } = require('pg');

exports.handler = async (event, context) => {
  try {
    console.log('Health check requested');
    
    // Check environment variables
    const envCheck = {
      hasDBURL: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      netlifyContext: context.clientContext ? 'present' : 'missing'
    };
    
    console.log('Environment check:', envCheck);
    
    if (!process.env.DATABASE_URL) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'error',
          message: 'DATABASE_URL environment variable is missing',
          env: envCheck,
          timestamp: new Date().toISOString()
        })
      };
    }

    // Test database connection
    let sslConfig = false;
    if (process.env.NODE_ENV === 'production' || 
        process.env.DATABASE_URL.includes('.rds.amazonaws.com')) {
      sslConfig = { rejectUnauthorized: false };
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: 1,
      connectionTimeoutMillis: 10000
    });

    console.log('Testing database connection...');
    const start = Date.now();
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test, NOW() as timestamp');
    const latency = Date.now() - start;
    
    client.release();
    await pool.end();
    
    console.log('Database connection successful');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'healthy',
        message: 'All systems operational',
        database: {
          connected: true,
          latency: `${latency}ms`,
          timestamp: result.rows[0].timestamp
        },
        env: envCheck,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'unhealthy',
        message: 'Health check failed',
        error: {
          message: error.message,
          code: error.code,
          name: error.name
        },
        env: {
          hasDBURL: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV
        },
        timestamp: new Date().toISOString()
      })
    };
  }
};