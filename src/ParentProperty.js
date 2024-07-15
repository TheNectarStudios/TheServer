const express = require('express');
const router = express.Router();
const Property = require('./models/ParentProperty');
const Organisation = require('./models/Organisation');
const ChildProperty = require('./models/ChildProperty');

// Route to create a property and add the property name to the organisation
router.post('/create-property', async (req, res) => {
  try {
    const { organisationName, parentPropertyName, location, description, builderName } = req.body;
    console.log('Received data:', req.body);

    // Validate required fields
    if (!organisationName || !parentPropertyName || !location || !description || !builderName) {
      return res.status(400).send('All fields are required');
    }

    const organisation = await Organisation.findOne({ OrganisationName: organisationName });
    if (!organisation) {
      return res.status(404).send('Organisation not found');
    }

    const existingProperty = await Property.findOne({ ParentPropertyName: parentPropertyName });
    if (existingProperty) {
      return res.status(400).send('Property with this name already exists');
    }

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

router.get('/:parentPropertyName/child-properties', async (req, res) => {
  try {
    const { parentPropertyName } = req.params;
    const property = await Property.findOne({ ParentPropertyName: parentPropertyName });

    if (!property) {
      return res.status(404).send('Parent property not found');
    }
    res.status(200).json(property.ChildProperties);
  } catch (error) {
    console.error('Error fetching child properties:', error);
    res.status(500).send(error.message || 'Error fetching child properties');
  }
});

router.delete('/:parentPropertyName/child-properties/:childPropertyName', async (req, res) => {
  try {
    const { parentPropertyName, childPropertyName } = req.params;
    console.log('Delete request received for:', parentPropertyName, childPropertyName);

    // Remove child property from parent property's childProperties list
    const parentProperty = await Property.findOneAndUpdate(
      { ParentPropertyName: parentPropertyName },
      { $pull: { ChildProperties: childPropertyName } },
      { new: true }
    );

    if (!parentProperty) {
      return res.status(404).send('Parent property not found');
    }
    const parentProperyOfchild = await Property.findOne({ ParentPropertyName: parentPropertyName });
    if (!parentProperyOfchild) {
      return res.status(404).send('Parent property not found');
    }
    // delete the child property from the list of the parentproperty
    parentProperyOfchild.ChildProperties.pull(childPropertyName);
    // Remove child property from child property collection
    await parentProperyOfchild.save();
    const deletedChildProperty = await ChildProperty.findOneAndDelete({
      ParentPropertyName: parentPropertyName,
      ChildPropertyName: childPropertyName
    });

    if (!deletedChildProperty) {
      return res.status(404).send('Child property not found');
    }

    res.status(200).send('Child property deleted successfully');
  } catch (error) {
    console.error('Error deleting child property:', error);
    res.status(500).send(error.message || 'Error deleting child property');
  }
});

module.exports = router;
