const mongoose = require('mongoose');
const Organisation = require('./Organisation');

const ChildPropertySchema = new mongoose.Schema({
    ParentPropertyName: {
        type: String,
        required: true,
        unique: true,
    },
    Location: {
        type: String,
        // required: true,
    },
    Description: {
        type: String,
        // required: true,
    },
    BuilderName: {
        type: String,
        // required: true,
    },
    ChildPropertyName: {
        type: String,
        required: true,
    },
    OrganisationName: { 
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('ChildProperty', ChildPropertySchema);
