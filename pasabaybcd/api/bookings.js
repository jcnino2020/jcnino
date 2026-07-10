const connectToDatabase = require('../db');
const Booking = require('../models/Booking');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    // In a real app we might handle pagination, filtering here.
    const bookings = await Booking.find().sort({ created_at: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Bookings API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
