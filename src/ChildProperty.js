const express = require('express');
const router = express.Router();
const ParentProperty = require('./models/ParentProperty');
const ChildProperty = require('./models/ChildProperty');

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

// Export the router
module.exports = router;
