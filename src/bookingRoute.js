// routes/booking.js

const express = require('express');
const Booking = require('./models/BookingSchema');
const router = express.Router();

router.post('/booking', async (req, res) => {
  try {
    const { propertyId, userId, date } = req.body;

    console.log('Received booking request:', req.body);

    if (!propertyId || !userId || !date) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const booking = new Booking({ propertyId, userId, date });
    await booking.save();
    
    console.log('Booking confirmed:', booking);
    res.status(200).json({ message: 'Booking confirmed' });
  } catch (error) {
    console.error('Error booking property:', error);
    res.status(500).json({ message: 'Failed to book property', error: error.message });
  }
});

module.exports = router;
