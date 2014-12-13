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

    res.json({
      message: 'Pickup request created!',
      id: pickup._id,
      status: 'OK',
      link: serverUrl + '/show/' + pickup._id
    });
  });

});


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
