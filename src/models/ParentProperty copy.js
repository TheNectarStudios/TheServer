const mongoose = require('mongoose');

const ParentProperty = new mongoose.Schema({
  ParentPropertyName :{
    type: String,
    require: true,
  },
  Location:{
    type: String, 
    require: true,
  }
  
});

module.exports = mongoose.model('Properties', ParentProperty);
