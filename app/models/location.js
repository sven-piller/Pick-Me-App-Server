var mongoose = require('mongoose');

var LocationSchema = new mongoose.Schema({
  level: String,
  letter: String,
  area: String,
  number: String,
  alt: String,
  long: String,
  pickup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pickup'
  },
  ibeacon: String
});

module.exports = mongoose.model('Location', LocationSchema);
