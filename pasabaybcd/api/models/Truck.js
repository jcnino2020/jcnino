const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  driver_id: { type: Number },
  plate_number: { type: String },
  type: { type: String },
  capacity_kg: { type: Number },
  status: { type: String },
  current_route: { type: String },
  created_at: { type: Date }
}, { collection: 'trucks' });

module.exports = mongoose.models.Truck || mongoose.model('Truck', TruckSchema);
