const express = require('express');
const router = express.Router();
const User = require('./models/User');
const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// User registration
router.post('/register', async (req, res) => {
    try {
      const { username, phoneNumber, password } = req.body;
  
      // Check if user with the same phone number already exists
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        return res.status(400).send('User with this phone number already exists');
      }
  
      // Generate a unique verification code for each user
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
      const user = new User({ username, phoneNumber, password, verificationCode });
      await user.save();
  
      await twilioClient.messages.create({
        body: `Your verification code is ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
  
      res.status(200).send({ userId: user.userId, verificationCode }); // Send userId instead of _id
    } catch (error) {
      res.status(500).send(error);
    }
  });

router.post('/verify', async (req, res) => {
    try {
        const { userId, verificationCode } = req.body;

        const user = await User.findOne({ userId }); // Find user by userId
        if (user) {
            if (verificationCode === user.verificationCode) {
                user.isVerified = true;
                await user.save();
                res.status(200).send('Phone number verified successfully');
            } else {
                res.status(401).send('Invalid verification code');
            }
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
