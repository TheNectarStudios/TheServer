// objRoutes.js

const express = require('express');
const router = express.Router();
const Model = require('./models/Model'); // Import your Mongoose model for OBJ models
const bodyParser = require('body-parser');

// Middleware to handle raw data with increased payload size limit
router.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Route for uploading OBJ model
router.post('/upload-obj', (req, res) => {
    const objModelData = req.body; 

    if (!objModelData || !Buffer.isBuffer(objModelData)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    // Example MongoDB save using Mongoose
    const model = new Model({
        data: objModelData // Save the raw model data as Buffer
    });

    model.save()
        .then(savedModel => {
            res.status(200).json({ message: 'OBJ model uploaded successfully'  });
        })
        .catch(err => {
            console.error('Error saving model:', err);
            res.status(500).json({ error: 'Failed to upload OBJ model' });
        });
});

module.exports = router;
