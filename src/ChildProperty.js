const express = require('express');
const router = express.Router();
const ParentProperty = require('./models/ParentProperty');
const ChildProperty = require('./models/ChildProperty');
const Organisation = require('./models/Organisation');

// Route to add a new child property name
router.post('/:parentPropertyName/add-child-property', async (req, res) => {
    const { parentPropertyName } = req.params;
    const { childPropertyName } = req.body;

    try {
        // Find the parent property
        const parentProperty = await ParentProperty.findOne({ ParentPropertyName: parentPropertyName });
        if (!parentProperty) {
            return res.status(404).send('Parent property not found');
        }

        // Update parent property's child properties list
        parentProperty.ChildProperties.push(childPropertyName);
        await parentProperty.save();

        // Create or update child property document
        let childProperty = await ChildProperty.findOne({ ParentPropertyName: parentPropertyName });

        if (!childProperty) {
            childProperty = new ChildProperty({
                ParentPropertyName: parentPropertyName,
                Location: parentProperty.Location,
                Description: parentProperty.Description,
                BuilderName: parentProperty.BuilderName,
                ChildProperties: [childPropertyName]
            });

            await childProperty.save();
        } else {
            childProperty.ChildProperties.push(childPropertyName);
            await childProperty.save();
        }

        // Handle response
        res.status(200).send('Child property name added successfully');
    } catch (error) {
        console.error('Error adding child property:', error);
        res.status(500).send(error.message || 'Error adding child property');
    }
});








router.post('/create-property', async (req, res) => {
    try {
      const { organisationName, parentPropertyName, childPropertyName } = req.body;
      console.log(req.body);
      // Validate required fields
      if (!organisationName || !parentPropertyName || !childPropertyName) {
        return res.status(400).send('All fields are required');
      }
      const organisation = await Organisation.findOne({ OrganisationName: organisationName });
      if (!organisation) {
        return res.status(404).send('Organisation not found');
      }
  
      const existingProperty = await ParentProperty.findOne({ ParentPropertyName: parentPropertyName });
  
      const newProperty = new ChildProperty({
        ParentPropertyName: parentPropertyName,
        ChildPropertyName: childPropertyName,
        OrganisationName: organisationName,
      });
            
      await newProperty.save();
      // organisation.Properties.push(childPropertyName);
      existingProperty.ChildProperties.push(childPropertyName);
      await existingProperty.save();
      // await organisation.save();
  
      // Handle response
      res.status(201).send('Property created and added to the organisation successfully');
  
    } catch (error) {
      console.error('Error creating property:', error);
      res.status(500).send(error.message || 'Error creating property');
    }
  });
  router.get('/child-properties', async (req, res) => {
    try {
        const childProperties = await ChildProperty.find();
        res.status(200).json(childProperties);
    } catch (error) {
        console.error('Error fetching parent properties:', error);
        res.status(500).send(error.message || 'Error fetching parent properties');
    }
});

// Export the router
module.exports = router;
