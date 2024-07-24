const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  propertyName: { 
    type: String, 
    required: true,
  },
  parentPropertyName: {
    type: String,
    required: true,
  },
  date: { 
    type: Date, 
    required: true 
  },
  time: {
    type: String,
    required: true,
  },
  username: { 
    type: String, 
    required: true 
  },
  organisationName: {
    type: String,
    required: true,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String,  
    enum: ['confirmed', 'pending', 'cancelled'],  
    default: 'pending' 
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
