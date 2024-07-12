const express = require('express');
const router = express.Router();
const Organisation = require('./models/Organisation');
const twilio = require('twilio');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware for parsing JSON bodies
router.use(express.json());

// Organisation creation
router.post('/create-organisation', async (req, res) => {
  try {
    const { organisationName, rootUsername, password, phoneNumber } = req.body;

    // Debugging: Log received data
    console.log("Received Data:", { organisationName, rootUsername, password, phoneNumber });

    // Check if organisation with the same name or root username already exists
    const existingOrganisation = await Organisation.findOne({ OrganisationName: organisationName });
    if (existingOrganisation) {
      return res.status(400).send('Organisation with this name already exists');
    }

    // Generate a unique verification code for the root user
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Debugging: Log password before hashing
    console.log("Password Before Hashing:", password);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Debugging: Log hashed password
    console.log("Hashed Password:", hashedPassword);

    // Create a new organisation instance
    const newOrganisation = new Organisation({
      OrganisationName: organisationName,
      RootUserName: rootUsername,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      verificationCode,
      Usernames: [],
      Properties: [],
    });

    // Save the organisation to MongoDB
    await newOrganisation.save();

    // Send verification code via Twilio SMS
    await twilioClient.messages.create({
      body: `Your verification code is ${verificationCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber, // Assuming rootUsername is a phone number
    }); 

    // Handle response
    res.status(200).send("Verification Code sent to your phone number. Please verify.");

  } catch (error) {
    console.error('Error during organisation creation:', error);
    res.status(500).send(error.message || 'Error during organisation creation');
  }
});

// Verify root user
router.post('/verify-root', async (req, res) => {
  console.log("Request received at /verify-root");
  try {
    const { phoneNumber, verificationCode } = req.body;
    console.log("Request data:", req.body);

    const organisation = await Organisation.findOne({ phoneNumber: phoneNumber });
    if (organisation) {
      if (verificationCode === organisation.verificationCode) {
        organisation.isRootVerified = true;
        await organisation.save();
        return res.status(200).json({ message: 'Root user verified successfully' });
      } else {
        return res.status(401).json({ error: 'Invalid verification code' });
      }
    } else {
      return res.status(404).json({ error: 'Organisation not found' });
    }
  } catch (error) {
    console.error('Error during root verification:', error);
    res.status(500).send(error);
  }
});


// Root user login
router.post('/login-root', async (req, res) => {
  try {
    const { rootUsername, password } = req.body;

    // Find the organisation by root username
    const organisation = await Organisation.findOne({ RootUserName: rootUsername });
    if (!organisation) {
      return res.status(400).send('Invalid username or password');
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, organisation.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid username or password');
    }

    // Check if the root user's phone number is verified
    if (!organisation.isRootVerified) {
      return res.status(400).send('Phone number is not verified');
    }

    // Generate a JWT token
    const token = jwt.sign({ organisationId: organisation._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).send({ token, organisationId: organisation._id });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send(error.message || 'Error during login');
  }
});

// Get organisation details by name
router.get('/organisation/:organisationName', async (req, res) => {
  try {
    const organisationName = req.params.organisationName;

    // Find the organisation by its name
    const organisation = await Organisation.findOne({ OrganisationName: organisationName });

    // Check if the organisation exists
    if (!organisation) {
      return res.status(404).send('Organisation not found');
    }

    // Send the organisation details
    res.status(200).json(organisation);

  } catch (error) {
    console.error('Error fetching organisation details:', error);
    res.status(500).send('Error fetching organisation details');
  }
});

module.exports = router;
