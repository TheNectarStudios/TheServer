const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  propertyId: { 
    type: String, 
    required: true ,
  },
  userId: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
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
