/**
 * Logging functions
 *
 * Module for initialising Windsor-Logging. With this Module it is possible to save informations in the log-file. To use it in other modules
 *
 * <pre>
 * var logger = require('./libLogger').log;
 * </pre>
 *
 * JavaScript for Node.js
 *
 * LICENSE: MIT
 *
 * @module
 * @author       Sven Piller <sven.piller@dlh.de>
 * @copyright    Copyright (c) 2014
 * @license      MIT
 * @since        1.0.0
 */

// npm packets
var async = require('async');
var fs = require('fs');
var path = require('path');
var winston = require('winston');
// lib files
var helper = require('./libHelper');
// settings
var logFolder = path.normalize(path.join(__dirname, '/../logs'));
var archivFolder = path.normalize(path.join(logFolder, '/archiv'));
var infoFilename = path.normalize(path.join(logFolder, '/info.log'));
var exceptionFilename = path.normalize(path.join(logFolder, '/exceptions.log'));
var errorFilename = path.normalize(path.join(logFolder, '/error.log'));

/**
 * max file size of each log file. MB * 1000 * 1000
 * @constant
 * @type {Number}
 * @default
 */
var MAX_FILESIZE = 20000000;

/**
 * checks if folder for logfiles exists. If not, will be created.
 */
function ensureLogFolderExists() {
  fs.exists(logFolder, function(exists) {
    if (!exists) {
      fs.mkdir(logFolder, function(err) {});
    }
  });
  fs.exists(archivFolder, function(exists) {
    if (!exists) {
      fs.mkdir(archivFolder, function(err) {});
    }
  });
}

/**
 * Erstellt eine Instanz von einem Infologger. Alles ab der klasse info wird in
 * eine rollierende Datei geloggt.
 *
 * @author Sven Piller <sven.piller@dlh.de>
 * @since 0.1
 * @version 1
 */
var infoLogger = new(winston.Logger)({
  level: 'debug',
  transports: [new(winston.transports.Console)({
    level: 'info', // Nur info oder höher in der Console loggen
    colorize: true,
    silent: true
  }), new(winston.transports.DailyRotateFile)({
    filename: infoFilename,
    level: 'debug',
    datePattern: '.yyyy-MM-dd',
    maxsize: MAX_FILESIZE
  })]
});

/**
 * Erstellt eine Instanz von einem Infologger. Alles ab der klasse info wird in
 * eine rollierende Datei geloggt.
 *
 * @author Sven Piller <sven.piller@dlh.de>
 * @since 0.1
 * @version 1
 */
var errorLogger = new(winston.Logger)({
  level: 'debug',
  transports: [new(winston.transports.Console)({
    level: 'info', // Nur info oder höher in der Console loggen
    colorize: true,
    silent: true
  }), new(winston.transports.DailyRotateFile)({
    filename: errorFilename,
    level: 'debug',
    datePattern: '.yyyy-MM-dd',
    maxsize: MAX_FILESIZE
  })]
});

winston.handleExceptions(new(winston.transports.DailyRotateFile)({
  filename: exceptionFilename,
  datePattern: '.yyyy-MM-dd',
  maxsize: MAX_FILESIZE
}));

/**
 * @constructor
 * @author Sven Piller <sven.piller@dlh.de>
 * @since 0.1
 * @version 1
 */
var Logging = function() {
  var loggers = {};
  ensureLogFolderExists();

  // Wenn Singleton bereits existiert, dann benutze diesen
  if (Logging.prototype._singletonInstance) {
    return Logging.prototype._singletonInstance;
  }

  /**
   * returns the desired logger singleton
   * @author Sven Piller <sven.piller@dlh.de>
   * @since 0.1
   * @version 1
   * @param {String} name - Name des Loggers
   * @returns {object}
   */
  this.getLogger = function(name) {
    return loggers[name];
  };

  this.get = this.getLogger;

  loggers.infoLogger = infoLogger;
  loggers.errorLogger = errorLogger;

  Logging.prototype._singletonInstance = this;
  infoLogger.info('[LOGGER] ' + 'Logging set up OK!');
};
new Logging();

/**
 * parses an obj to an formatted string
 *
 * @author Sven Piller <sven.piller@dlh.de>
 * @since 0.1
 * @version 1
 * @param {Object} obj
 * @returns {String}
 */
function parseToString(obj) {
  if (typeof obj === 'string') {
    return obj;
  }
  var str = '';
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      if (typeof obj[p] === 'string') {
        str += p + ':' + obj[p] + ' ';
      } else {
        str += p + ':{' + parseToString(obj[p]) + '} ';
      }
    }
  }
  return str;
}

/**
 * Farbedefinitionen; 3* normal, 9* bright
 */
var colorList = {
  'red': 91,
  'green': 32,
  'yellow': 33,
  'blue': 94,
  'magenta': 35,
  'cyan': 36,
  'white': 37,
  'grey': 90
};

/**
 * to log messages to the console with colored output for faster reading
 *
 * @author Sven Piller <sven.piller@dlh.de>
 * @since 0.1
 * @version 1
 * @param {String} message - log message text
 * @param {String} [level] - log level (error|warn|info|debug), default = info
 * @param {String} [indicator] - string prefix, default = [LOGGER]
 */
function log(message, level, indicator) {
  var infoLogger = Logging().get('infoLogger');
  var errorLogger = Logging().get('errorLogger');
  // Initiale Zuordnung
  var levelColor = colorList.grey;
  var indicatorColor = colorList.yellow;
  var messageColor = colorList.cyan;
  // Unbestimmte Variablen defaulten
  if (!level) {
    level = 'info ';
  }
  if (!indicator) {
    indicator = '[LOGGER] ';
  }

  message = parseToString(message);

  // Farbliche Sonderbehandlung
  switch (level) {
    case 'error':
      levelColor = colorList.red;
      indicatorColor = colorList.yellow;
      messageColor = colorList.red;
      infoLogger.log(level, indicator + ' ' + message);
      errorLogger.log(level, indicator + ' ' + message);
      break;
    case 'debug':
      indicatorColor = levelColor;
      messageColor = levelColor;
      infoLogger.log(level, indicator + ' ' + message);
      break;
    default:
      infoLogger.log(level, indicator + ' ' + message);
      break;
  }

  if (indicator === '[API]') {
    indicatorColor = colorList.green;
  }

  // Ausgabe
  if (process.env.NODE_ENV === 'production') {
    require('util').log(level + ' ' + indicator + ' ' + message);
  } else {
    require('util').log('\u001b[' + levelColor + 'm' + level + ' \u001b[' + indicatorColor + 'm' + indicator +
      ' \u001b[' + messageColor + 'm' + message + '\u001b[0m');
  }
}
exports.log = log;
