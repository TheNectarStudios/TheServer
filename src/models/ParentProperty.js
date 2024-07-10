const mongoose = require('mongoose');

const ParentPropertySchema = new mongoose.Schema({
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

module.exports = mongoose.model('Property', ParentPropertySchema);
