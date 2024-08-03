// server.js or your routes file
const express = require('express');
const router = express.Router();
const Booking = require('./models/BookingSchema'); // Assuming you have a Booking model
const generateUniqueKey = require('./utils/generateKey'); // Import the utility function

// POST /api/bookings
router.post('/bookings', async (req, res) => {
  try {
    const { username, watchlist } = req.body;
    const key = await generateUniqueKey(); // Generate a unique key
    const newBooking = new Booking({
      username,
      watchlist,
      key,
      date: new Date(),
    });
    await newBooking.save();
    res.status(201).json({ message: 'Booking successful', booking: newBooking });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ message: 'Failed to book', error });
  }
});

module.exports = router;
