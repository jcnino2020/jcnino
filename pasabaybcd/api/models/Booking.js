const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: Number },
  truck_id: { type: Number },
  driver_name: { type: String },
  cargo_category: { type: String },
  cargo_weight_kg: { type: Number },
  cargo_quantity: { type: Number },
  description: { type: String },
  estimated_fee: { type: Number },
  cargo_photo_url: { type: String },
  status: { type: String },
  created_at: { type: Date },
  completed_at: { type: Date }
}, { collection: 'bookings' });

module.exports = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
