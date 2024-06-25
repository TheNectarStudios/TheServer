const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  phoneNumber: String,
  password: String,
  verificationCode: String, // Store the verification code here
  isVerified: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Generate and store the user ID
});

module.exports = mongoose.model('User', UserSchema);
