const mongoose = require('mongoose');

const OrganisationSchema = new mongoose.Schema({
  OrganisationName: {
    type: String,
    unique: true,
    required: true,
  },
  RootUserName: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  verificationCode: {
    type: String,
    required: true,
  },
  isRootVerified: {
    type: Boolean,
    default: false,
  },
  Usernames: {
    type: [String],
    default: [], // Ensure it defaults to an empty array
  },
  Properties: {
    type: [String],
    default: [], // Ensure it defaults to an empty array
  },
});

module.exports = mongoose.model('Organisation', OrganisationSchema);
