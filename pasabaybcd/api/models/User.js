const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  full_name: { type: String, required: true },
  phone_number: { type: String },
  role: { type: String, enum: ['admin', 'driver', 'customer'], default: 'customer' },
  is_verified: { type: Number, default: 0 },
  wallet_balance: { type: Number, default: 0.00 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
