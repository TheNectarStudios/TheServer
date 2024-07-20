const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  organisationName: {
    type: String,
  },
  username: {
    type: String,
    unique: true,
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
    // required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User', UserSchema);
