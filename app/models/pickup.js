var mongoose = require('mongoose');

var PickupSchema = new mongoose.Schema({
  name: String,
  carrier: String,
  flightnumber: String,
  namePickuper: String,
  phonePickuper: String,
  emailPickuper: String,
  message: String,
  airportArrival: String,
  scheduleArrival: String,
  estimatedArrival: String,
  flightStatus: String,
  timeStatus: String,
  uid: String,
  confirm: String
});

module.exports = mongoose.model('Pickup', PickupSchema);
