const express = require('express');
const router = express.Router();
const User = require('./models/User');
const twilio = require('twilio');
const dotenv = require('dotenv');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Organisation = require('./models/Organisation');
dotenv.config();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// User registration
router.post('/register', async (req, res) => {
  try {
    const { organisationName, username, phoneNumber, password, role } = req.body;
    
    console.log('Received registration request:', req.body);
 
    // Check if user with the same phone number or username already exists
    // const existingUser = await User.findOne({ $or: [ { username }] });
    // if (existingUser) {
    //   console.log('User with this phone number or username already exists');
    //   return res.status(400).send('User with this phone number or username already exists');
    // }

    // Generate a unique verification code for each user
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique userId
    const userId = crypto.randomBytes(16).toString("hex");

    // Create a new user instance
    const newUser = new User({
      userId,
      username,
      phoneNumber,
      password: hashedPassword,
      verificationCode,
      role,
      organisationName,
    });

    // Save the user to MongoDB
    await newUser.save();

    console.log('User registered successfully:', newUser);

    // Add the username to the Organisation's Usernames array
    const organisation = await Organisation.findOne({ OrganisationName: organisationName });
    if (organisation) {
      organisation.Usernames.push(username);
      await organisation.save();
      console.log('Username added to organisation:', organisation);
    } else {
      console.log('Organisation not found:', organisationName);
    }

    // Send verification code via Twilio SMS
    await twilioClient.messages.create({
      body: `Your verification code is ${verificationCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log('Verification code sent via Twilio to:', phoneNumber);

    // Handle response
    res.status(200).send("Verification code sent to your phone number. Please verify.");

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send(error.message || 'Error during registration');
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;

    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (user) {
      if (verificationCode === user.verificationCode) {
        user.isVerified = true;
        await user.save();
        return res.status(200).json({ message: 'Phone number verified successfully' });
      } else {
        return res.status(401).json({ error: 'Invalid verification code' });
      }
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error during verification:', error);
    res.status(500).send(error);
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('Invalid username or password');
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid username or password');
    }

    // Check if the user's phone number is verified
    if (!user.isVerified) {
      return res.status(400).send('Phone number is not verified');
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Include the organisation name in the response
    const organisationName = user.organisationName; // Assuming user model has organisationName field

    res.status(200).send({ token, organisationName });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send(error.message || 'Error during login');
  }
});
router.post('/getuser', async (req, res) => {
  try {
    const { username } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });
    console.log(user) ;
    
    // Check if the user exists
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Send the user's role
    userRole = user.role ;
    console.log(req.body) ;  
    res.status(200).json({ userRole: user.role });
  } catch (error) {
    console.error('Error during getuser:', error);
    res.status(500).send(error.message || 'Error during getuser');
  }
});

router.delete('/deleteuser', async (req, res) => {
  try {
    const { username, rootUsername, password } = req.body;

    // Find the root user by username
    const rootUser = await User.findOne({ username: rootUsername });
    if (!rootUser) {
      return res.status(400).send('Invalid root username or password');
    }

    // Check if the password is correct for the root user
    const isPasswordValid = await bcrypt.compare(password, rootUser.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid root username or password');
    }

    // Check if the root user has the appropriate role
    if (rootUser.role !== 'admin') {  // Adjust the role check based on your application logic
      return res.status(403).send('You do not have permission to delete users');
    }

    // Find the user to be deleted by username
    const userToDelete = await User.findOne({ username });
    if (!userToDelete) {
      return res.status(404).send('User not found');
    }

    // Delete the user
    await User.deleteOne({ username });

    console.log('User deleted successfully:', username);
 
    res.status(200).send('User deleted successfully');

  } catch (error) {
    console.error('Error during user deletion:', error);
    res.status(500).send(error.message || 'Error during user deletion');
  }
});


module.exports = router;
