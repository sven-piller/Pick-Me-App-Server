/**
 * Main Server File
 *
 * JavaScript for Node.js
 *
 * LICENSE: MIT
 *
 * @file
 * @author       Travel Track 1
 * @copyright    Copyright (c) 2014
 * @license      MIT
 */

// npm packets
var mongoose = require('mongoose');
var path = require('path');
var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var _ = require('underscore');
var async = require('async');
// config files
var properties = require('./config/config.json');
// lib files
var logger = require('./lib/libLogger').log;
var helper = require('./lib/libHelper');
// database models
var Flight = require('./app/models/flight');

/**
 * string with version number
 * @constant
 * @type {String}
 * @default
 */
var VERSION = '1.0';
/**
 * string with release tag
 * @constant
 * @type {String}
 * @default
 */
var RELEASE = '1.0.20141212';

/**  Utilities  **/

/**
 * format logging information. prefixes [SERVER] for each message
 *
 * @param {string} message - Log message
 * @param {string} level - Log level [debug, _info_, warn, error]
 *
 * @author Sven Piller <sven.piller@dlh.de>
 */
function log(message, level, indicator) {
  if (!level) {
    level = 'info';
  }
  if (!indicator) {
    indicator = '[SERVER]';
  }
  logger(message, level, indicator);
}

/**
 * string for server URL

 * @type {String}
 */
var serverUrl = null;
/**
 * string for database URL
 * @type {String}
 */
var databaseUrl = null;
/**
 * portnumber
 * @type {Number}
 */
var port = process.env.PORT || properties.server.port || 5000;
log(process.env.NODE_ENV === 'production');
if (process.env.NODE_ENV === 'production') {
  var serverUrl = 'http://' + properties.server.host + ':' + port;
  databaseUrl = 'mongodb://test:test@ds033390.mongolab.com:33390/appatnight';
} else {
  var serverUrl = 'http://localhost:' + port;
  databaseUrl = 'mongodb://' + properties.db.host + ':' + properties.db.port + '/' + properties.db.dbname;
}
log(serverUrl, 'debug');
log(databaseUrl, 'debug');

/**
 * database object
 * @type {object}
 */
var db = mongoose.connection;
db.on('error', function() {
  log('Fehler bei der Anbindung der Datenbank', 'error');
});
db.once('open', function() {
  log('Anbindung der Datenbank ' + databaseUrl + ' in Ordnung');
});
mongoose.connect(databaseUrl);

// API
var app = express();
app.set('port', port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());
app.use(cookieParser());
app.use(express.static(__dirname + '/doc'));

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

router.use(function(req, res, next) {
  log('API-Request at ' + Date.now(), 'debug', '[ROUTER]');
  log(req.body, 'debug', '[ROUTER]');
  next(); // make sure we go to the next routes and don't stop here
});

router.get('/api', function(req, res) {
  res.json({
    message: 'API available'
  });
});

/*
// on routes that end in /flights
// ----------------------------------------------------
router.route('/flights')

// create a flight
.post(function(req, res) {
  var flight = new Flight();
  flight.username = req.body.username;
  flight.origin = req.body.origin;
  flight.destination = req.body.destination;
  flight.departure = req.body.departure;
  flight.arrival = req.body.arrival;
  flight.flightnumber = req.body.flightnumber;
  flight.carrier = req.body.carrier;
  flight.departureDate = new Date(req.body.departure);
  flight.identifier = req.body.carrier + '-' + req.body.flightnumber + '-' + req.body.departure.substr(0, 10);
  var amountOfFriends = _.size(req.body.friends);
  flight.friends = amountOfFriends;
  flight.flightduration = req.body.flightduration;
  flight.points = parseInt(req.body.flightduration, 10) * amountOfFriends;

  flight.save(function(err) {
    if (err) {
      log(err, 'error', '[API]');
      res.send(err);
    } else {
      log(flight, 'debug', '[API]');
      res.send(flight);
      log(req.body.friends);

      async.each(req.body.friends, function(friendName, next) {
          log(friendName, 'debug', '[Calculate Friends Points]');
          var query = Flight.findOne()
            .where('identifier').equals(flight.identifier)
            .where('username').equals(friendName)
            .exec(function(err, friendFlight) {
              if (friendFlight) {
                if (err) {
                  log(err, 'error', '[CFP]');
                } else {
                  log(friendFlight, 'debug', '[CFP]');
                  friendFlight.friends += 1;
                  friendFlight.points = friendFlight.flightduration * friendFlight.friends;
                  friendFlight.save(function(err) {
                    if (err) {
                      log(err, 'error', '[CFP]');
                    }
                  });
                }
              }
            });
          next();
        },
        function(err) {
          if (err) {
            log('A friend could not be updated properly', 'error', '[CFP]');
          } else {
            log('All friends have been processed successfully', 'debug', '[CFP]');
          }
        }
      )
    }
  });
})

// get all the flights
.get(function(req, res) {
  var query = Flight.find();
  if (req.query.destination) {
    query.where({
      destination: req.query.destination
    });
  }
  query.exec(function(err, flights) {
    if (err) {
      log(err, 'error', '[API]');
      return next(err);
    } else {
      log(flights, 'debug', '[API]');
      res.send(flights);
    }
  });
});

// on routes that end in /flights/:flight_id
// ----------------------------------------------------
router.route('/flights/:flight_id')

// get the flight with that id
.get(function(req, res) {
  Flight.findById(req.params.flight_id, function(err, flight) {
    if (err) {
      log(err, 'error', '[API]');
      res.send(err);
    } else {
      log(flights, 'debug', '[API]');
      res.json(flight);
    }
  });
})

// update the flight with this id
.put(function(req, res) {
    // use our bear model to find the bear we want
    Flight.findById(req.params.flight_id, function(err, flight) {
      if (err) {
        log(err, 'error', '[API]');
        res.send(err);
      }

      var username_changed = req.body.username && (req.body.username !== flight.username);
      var origin_changed = req.body.origin && (req.body.origin !== flight.origin);
      var destination_changed = req.body.destination && (req.body.destination !== flight.destination);
      var departure_changed = req.body.departure && (req.body.departure !== flight.departure);
      var arrival_changed = req.body.arrival && (req.body.arrival !== flight.arrival);
      var flightnumber_changed = req.body.flightnumber && (req.body.flightnumber !== flight.flightnumber);
      var carrier_changed = req.body.carrier && (req.body.carrier !== flight.carrier);

      // update the flights info
      if (username_changed) {
        flight.username = req.body.username;
      }
      if (origin_changed) {
        flight.origin = req.body.origin;
      }
      if (destination_changed) {
        flight.destination = req.body.destination;
      }
      if (departure_changed) {
        flight.departure = req.body.departure;
        flight.departureDate = new Date(req.body.departure);
      }
      if (arrival_changed) {
        flight.arrival = req.body.arrival;
      }
      if (flightnumber_changed) {
        flight.flightnumber = req.body.flightnumber;
      }
      if (carrier_changed) {
        flight.carrier = req.body.carrier;
      }
      if (carrier_changed || flightnumber_changed || departure_changed) {
        flight.identifier = (carrier_changed) ? req.body.carrier : flight.carrier;
        flight.identifier += '-';
        flight.identifier += (flightnumber_changed) ? req.body.flightnumber : flight.flightnumber;
        flight.identifier += '-';
        flight.identifier += (departure_changed) ? req.body.departure.substr(0, 10) : flight.departure.substr(
          0,
          10);
      }

      flight.save(function(err) {
        if (err) {
          log(err, 'error', '[API]');
          res.send(err);
        }
        res.json({
          message: 'Flight updated!'
        });
      });

    });
  })
  // delete the flight with this id
  .delete(function(req, res) {
    Flight.remove({
      _id: req.params.flight_id
    }, function(err, flight) {
      if (err) {
        log(err, 'error', '[API]');
        res.send(err);
      }
      res.json({
        message: 'Successfully deleted'
      });
    });
  });

// on routes that end in /searchflights
// ----------------------------------------------------
router.route('/searchflights')

// get all the flights
.post(function(req, res, next) {
  var timerange = (req.body.timerange) ? req.body.timerange : 0;
  var departureDate = new Date(req.body.departure).getTime();
  var upperBound = departureDate + (timerange * 24 * 60 * 60 * 1000);
  log('upperBound: ' + new Date(upperBound).toString(), 'debug');
  var lowerBound = departureDate - (timerange * 24 * 60 * 60 * 1000);
  log('lowerBound: ' + new Date(lowerBound).toString(), 'debug');

  var query = Flight.find()
    .where('destination').equals(req.body.destination)
    .where('departureDate').gt(lowerBound).lt(upperBound)
    .where('username').in(req.body.friends)
    //    .limit(20)
    .sort({
      points: 'desc'
    })
    //.select('username origin destination departure carrier flightnumber')
    .exec(function(err, flights) {
      if (err) {
        log(err, 'error', '[API]');
        return next(err);
      } else {
        log(flights, 'debug', '[API]');
        res.send(flights);
      }
    });
});

// on routes that end in /searchflights
// ----------------------------------------------------
router.route('/highscore')

// get all the points
.get(function(req, res, next) {
  Flight.aggregate([{
      $group: {
        _id: {
          username: "$username",
        },
        total: {
          $sum: "$points"
        },
        count: {
          $sum: 1
        }
      }
    }]).sort({
      total: 'desc'
    })
    .exec(function(err, flights) {
      if (err) {
        log(err, 'error', '[API]');
        return next(err);
      } else {

        log(flights, 'debug', '[API]');
        res.send(flights);
      }
    });
});
*/

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send({
    message: err.message
  });
});

app.listen(app.get('port'), function() {
  logger('Express server listening on ' + serverUrl, 'info', '[EXPRESS]');
});
