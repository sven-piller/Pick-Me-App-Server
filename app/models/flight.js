var mongoose = require('mongoose');

var FlightSchema = new mongoose.Schema({
  username: String,
  origin: String,
  destination: String,
  departure: String,
  departureDate: Date,
  arrival: String,
  carrier: String,
  flightnumber: String,
  identifier: String,
  flightduration: Number,
  friends: Number,
  points: Number
});

module.exports = mongoose.model('Flight', FlightSchema);
