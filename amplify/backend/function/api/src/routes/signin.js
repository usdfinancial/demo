module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Add your authentication logic here
    // This is a placeholder - replace with actual authentication
    
    return res.status(200).json({
      success: true,
      message: 'Sign in successful',
      user: {
        email: email,
        id: Date.now() // Replace with actual user ID
      }
    });
    
  } catch (error) {
    console.error('Sign in error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};