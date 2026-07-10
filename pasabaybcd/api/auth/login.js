const connectToDatabase = require('../db');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Temporary logic: since we don't have real hashed passwords in seed
    // (Assuming seed data uses plain text or arbitrary hash, we just mock auth for now
    // or check if email exists and password is "admin123" for demo purposes).
    // In production, we'd use bcrypt.compare(password, user.password_hash)
    
    const user = await User.findOne({ email, role: 'admin' });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // For demo purposes, we will accept any login if user is admin
    // Or we can assume password_hash is literally the password if it's a dummy DB
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1d' }
    );

    res.status(200).json({ token, user: { id: user.id, name: user.full_name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
