const express = require('express');
const router = express.Router();
const Property = require('./models/ParentProperty');
const Organisation = require('./models/Organisation');

// Route to create a property and add the property name to the organisation
router.post('/create-property', async (req, res) => {
  try {
    const { organisationName, parentPropertyName, location, description, builderName, } = req.body;

    // Validate required fields
    if (!organisationName || !parentPropertyName || !location || !description || !builderName) {
      return res.status(400).send('All fields are required');
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ OrganisationName: organisationName });
    if (!organisation) {
      return res.status(404).send('Organisation not found');
    }


    // Check if property already exists
    const existingProperty = await Property.findOne({ ParentPropertyName: parentPropertyName });

    if (existingProperty) {
      return res.status(400).send('Property with this name already exists');
    }

    // Create a new property
    const newProperty = new Property({
      ParentPropertyName: parentPropertyName,
      Location: location,
      Description: description,
      BuilderName: builderName,
    });

    await newProperty.save();
    organisation.Properties.push(parentPropertyName);

    await organisation.save();

    // Handle response
    res.status(201).send('Property created and added to the organisation successfully');

  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).send(error.message || 'Error creating property');
  }
});

module.exports = router;
