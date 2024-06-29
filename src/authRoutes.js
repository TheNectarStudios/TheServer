const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Nexmo = require('nexmo');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Initialize Nexmo client
const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
});

// Route to handle user registration and SMS sending
router.post('/register', async (req, res) => {
  try {
    const { username, phoneNumber } = req.body;

    // Generate a unique verification code for the user
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Simulate saving user data or sending verification code
    // In this example, we'll just log the details and send a response
    console.log(`User registered: ${username}, Phone Number: ${phoneNumber}, Verification Code: ${verificationCode}`);
 
    // Send SMS using Nexmo
    nexmo.message.sendSms(
      process.env.NEXMO_PHONE_NUMBER, // Your Nexmo phone number
      phoneNumber,
      `Your verification code is ${verificationCode}`,
      (err, responseData) => {
        if (err) {
          console.error('Failed to send SMS:', err);
          return res.status(500).json({ message: 'Failed to send verification code via SMS.' });
        } else {
          console.log('SMS sent successfully:', responseData);
          return res.status(200).json({ message: 'User registered. Verification code sent to phone number.', verificationCode });
        }
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error. Failed to register user.' });
  }
}); 

// Route to handle phone number verification
router.post('/verify', async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;

    // Simulate verification process
    if (verificationCode === '123456') { // Replace with actual verification logic
      console.log(`Phone number ${phoneNumber} verified successfully.`);
      res.status(200).json({ message: 'Phone number verified successfully.' });
    } else {
      console.log('Invalid verification code.');
      res.status(401).json({ message: 'Invalid verification code.' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error. Failed to verify phone number.' });
  }
});

module.exports = router;
