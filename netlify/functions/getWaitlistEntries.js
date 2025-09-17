const { getDatabase } = require('../../lib/database/connection');

exports.handler = async (event, context) => {
  try {
    const db = getDatabase();
    // Ensure the database connection is initialized
    await db.initialize();

    const result = await db.query('SELECT id, email, created_at FROM waitlist ORDER BY created_at DESC LIMIT 10');
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch waitlist entries', details: error.message }),
    };
  }
};
