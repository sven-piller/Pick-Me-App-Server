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
var Pickup = require('./app/models/pickup');

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
  databaseUrl = 'mongodb://test:test@ds063180.mongolab.com:63180/pickmeapp';
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



// Abfrage an LH_API

var querystring = require('querystring');
var https = require('https');

function performRequest(endpoint, method, data, success) {
  var dataString = JSON.stringify(data);
  var headers = {};

  if (method == 'GET') {
    endpoint += '?' + querystring.stringify(data);
  } else {
    headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };
  }
  logger(endpoint, 'debug', '[API Call]');

  var options = {
    host: properties.api.host,
    path: endpoint,
    method: method,
    headers: headers
  };

  logger(options, 'debug', '[API Call]');

  var req = https.request(options, function(res) {
    res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      logger(JSON.stringify(responseString), 'debug', '[API Call]');
      var responseObject = JSON.parse(responseString);
      success(responseObject);
    });
  });

  req.write(dataString);
  req.end();
}


// Emailversand
var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'pick0me0app@gmail.com',
    pass: '123456Ab!'
  }
});

// NB! No need to recreate the transporter object. You can use
// the same transporter object for all e-mails

// setup e-mail data with unicode symbols
var defaultMailOptions = {
  from: 'Pick-Me-App ✔ <donotreply@example.com>', // sender address
  to: null, // list of receivers
  subject: 'New Pick-Me-App request', // Subject line
  text: 'Hello world ✔', // plaintext body
  html: '<b>Hello world ✔</b>' // html body
};

function sendMessage(receiver, subject, text, html, callback) {
  // send mail with defined transport object
  mailOptions = defaultMailOptions;
  mailOptions.to = receiver;
  mailOptions.subject = subject;
  mailOptions.text = text;
  mailOptions.html = html;
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
      if (callback) callback();
    } else {
      console.log('Message sent: ' + info.response);
      if (callback) callback();
    }
  });
}


// API
var app = express();
app.set('port', port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());
app.use(cookieParser());
//app.use(express.static(__dirname + '/'));
//app.use(express.static(__dirname + '/doc'));

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

router.use(function(req, res, next) {
  log('API-Request at ' + Date.now(), 'debug', '[ROUTER]');
  next(); // make sure we go to the next routes and don't stop here
});

router.get('/', function(req, res) {
  res.json({
    message: 'API available'
  });
});

// on routes that end in /pickup
// ----------------------------------------------------
router.route('/pickup')

.post(function(req, res) {
  log(JSON.stringify(req.body));
  var pickup = new Pickup();
  pickup.name = req.body.name;
  pickup.carrier = req.body.flight.substring(0, 2);
  pickup.flightnumber = req.body.flight.substring(2).trim();
  pickup.namePickuper = req.body.name_pickuper;
  pickup.phonePickuper = req.body.phone_pickuper;
  pickup.emailPickuper = req.body.email_pickuper;
  pickup.message = req.body.message;

  // save the bear and check for errors
  pickup.save(function(err) {
    if (err)
      res.send(err);

    fetchFlightInformation(pickup, function getFlightInformation(infos) {
      var arrival = infos.FlightStatusResource.FlightGroup.Flight.Arrival;
      var aiportArrival = arrival.AirportCode.$;
      var scheduleArrival = arrival.ScheduledTimeUTC.DateTime.$;
      var estimatedArrival = arrival.RevisedTimeUTC.DateTime.$;
      var flightStatus = infos.FlightStatusResource.FlightGroup.Flight.FlightStatus[0].Definition.$;
      var timeStatus = infos.FlightStatusResource.FlightGroup.Flight.TimeStatus[0].Definition.$;

      pickup.airportArrival = airportArrival;
      pickup.scheduleArrival = scheduleArrival;
      pickup.estimatedArrival = estimatedArrival;
      pickup.flightStatus = flightStatus;
      pickup.timeStatus = timeStatus;
      pickup.save();

      res.json({
        message: 'Pickup request created!',
        id: pickup._id,
        status: 'OK',
        link: serverUrl + '/show/' + pickup._id,
        airportArrival: airportArrival,
        scheduleArrival: scheduleArrival,
        estimatedArrival: estimatedArrival,
        flightStatus: flightStatus,
        timeStatus: timeStatus
      });
      messagePickupRequest(pickup);
    });
  });
});

function messagePickupRequest(pickup) {
  var traveller = pickup.name;
  var pickuper = pickup.namePickuper;
  var email = pickup.emailPickuper;
  text = "Hey " + pickuper + ",/n" + traveller + " would love to be picked up by you from " + pickup.airportArrival +
    " at " + pickup.estimatedArrival + " (" + pickup.timeStatus + "). Don't worry we will inform you if " + traveller +
    "s flight is delayed. Please confirm that you will pick " +
    traveller + " up! /n http://pickmeapp.herokuapp.com/confirm/" + pickup._id +
    "  http://pickmeapp.herokuapp.com/cancel/" + pickup._id + "";
  html = "<p>Hey " + pickuper + ",<br /><br />" + traveller + " would love to be picked up by you from " + pickup.airportArrival +
    " at " + pickup.estimatedArrival + " (" + pickup.timeStatus + "). Don't worry we will inform you if " + traveller +
    "s flight is delayed. Please confirm that you will pick " +
    traveller + " up! </p> <p> <a href='http://pickmeapp.herokuapp.com/confirm/" + pickup._id +
    "'>Yes, I will Pick-Him-App</a><br /> <a href='http://pickmeapp.herokuapp.com/cancel/" + pickup._id +
    "'>No, I won't Pick-Him-App</a></p>";


  sendMessage(email, 'New Pick-Me-App request', text, html);

}

function fetchFlightInformation(pickup, cb) {
  // https://api.lufthansa.com/v1/operations/flightstatus/LH400/2014-12-13?api_key=jqxbqfdtamqay85qddzp98m6
  var dateString = helper.getDateString();
  var url = '/v1/operations/flightstatus/' + pickup.carrier + pickup.flightnumber + '/' + dateString;
  logger(url);
  performRequest(url, 'GET', {
    api_key: properties.api.key
  }, function(data) {
    //logger(data);
    cb(data);
  });
}

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
