const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  verificationCode: {
    type: String,
    required: true,
  }, 
  isVerified: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('User', UserSchema);
