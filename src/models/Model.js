// models/Model.js

const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
    data: {
        type: Buffer, // Ensure 'data' is defined as Buffer type
        required: true
    }
});

const Model = mongoose.model('Model', modelSchema);

module.exports = Model;
