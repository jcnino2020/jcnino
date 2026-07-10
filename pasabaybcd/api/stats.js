const connectToDatabase = require('../db');
const User = require('../models/User');
const Truck = require('../models/Truck');
const Booking = require('../models/Booking');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const totalUsers = await User.countDocuments();
    const activeTrucks = await Truck.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // Calculate total revenue from delivered bookings
    const deliveredBookings = await Booking.find({ status: 'delivered' });
    const totalRevenue = deliveredBookings.reduce((sum, booking) => sum + (booking.estimated_fee || 0), 0);

    // Get recent bookings
    const recentBookings = await Booking.find().sort({ created_at: -1 }).limit(5);

    res.status(200).json({
      totalUsers,
      activeTrucks,
      totalBookings,
      totalRevenue,
      recentBookings
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
