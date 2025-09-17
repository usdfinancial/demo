module.exports = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Add your user creation logic here
    // This is a placeholder - replace with actual user registration
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        email: email,
        name: name,
        id: Date.now() // Replace with actual user ID
      }
    });
    
  } catch (error) {
    console.error('Sign up error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};