var mongoose = require('mongoose');

var PickupSchema = new mongoose.Schema({
  name: String,
  carrier: String,
  flightnumber: String,
  namePickuper: String,
  phonePickuper: String,
  emailPickuper: String,
  message: String,
  aiportArrival: String,
  scheduleArrival: String,
  estimatedArrival: String,
  flightStatus: String,
  timeStatus: String
});

module.exports = mongoose.model('Pickup', PickupSchema);
