const mongoose = require('mongoose');

const ChildPropertySchema = new mongoose.Schema({
    ParentPropertyName: {
        type: String,
        required: true,
        unique: true,
    },
    Location: {
        type: String,
        required: true,
    },
    Description: {
        type: String,
        required: true,
    },
    BuilderName: {
        type: String,
        required: true,
    },
    ChildProperties: {
        type: [String],
    }
});

module.exports = mongoose.model('ChildProperty', ChildPropertySchema);
