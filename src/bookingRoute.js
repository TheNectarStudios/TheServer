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


router.get('/bookings/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const bookings = await Booking.find({ username });

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this username' });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error });
  }
});



router.get('/bookings/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const booking = await Booking.findOne({ key });

    if (!booking) {
      return res.status(404).json({ message: 'No booking found with this key' });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error('Error fetching booking by key:', error);
    res.status(500).json({ message: 'Failed to fetch booking', error });
  }
});

module.exports = router;
