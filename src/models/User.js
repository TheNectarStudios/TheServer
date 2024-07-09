const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  phoneNumber: {
    type: String,
    unique: true,
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
  role:{
    type: String, 
    require: true,
  }
});

module.exports = mongoose.model('User', UserSchema);
