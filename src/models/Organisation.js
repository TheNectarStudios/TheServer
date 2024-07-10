const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
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
  phoneNumber:{
    type: String, 
    require: true,
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
  },
  Properties: {
    type: [String], 
  }
});
OrganisationSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model('Organisation', OrganisationSchema);
