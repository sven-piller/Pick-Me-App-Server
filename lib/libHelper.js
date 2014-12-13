/**
 * Helper functions
 *
 * Diese Datei stellt wiederkehrende Funktionen für verschiedene Klassen zur Verfügung. Als Beispiel seien
 * Datumsberechnungen o.ä. genannt.
 *
 * JavaScript for Node.js
 *
 * LICENSE: MIT
 *
 * @module
 * @author Sven Piller <sven.piller@dlh.de>
 * @copyright Copyright (c) 2014
 * @license MIT
 * @since 1.0.0
 */

/**
 * variable for temporary date object
 * @type {Date}
 */
var d = null;
/**
 * variable for timestamp
 * @type {Number}
 */
var ts = null;

/**
 * Berechnet einen String aus dem aktuellen Datum. Dabei sind Tag und Monat
 * immer zweistellig
 *
 * @author Sven Piller <sven.piller@dlh.de>
 * @since 0.1
 * @version 1
 * @param {Date} [date] - if not given, actual date is taken
 * @return {String} date 'yyyy-mm-dd'
 */
function getDateString(date) {
  d = null;
  if (!date) {
    d = new Date();
  } else {
    d = new Date(date);
  }
  return (d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2));
}
exports.getDateString = getDateString;

/**
 * Errechnet das für den RTC-Com Server notwendige Datum aus
 *
 * @author Sven Piller <sven.piller@dlh.de>
 * @since 0.1
 * @version 1
 * @param {Date} [date] - if not given, actual date is taken
 * @return {String} date 'MM/dd/yyyy hh:mm:ss'
 */
function getTimestampRtcFormat(date) {
  d = null;
  if (!date) {
    d = new Date();
  } else {
    d = new Date(date);
  }
  return (('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2) + '/' + d.getFullYear() + ' ' +
    ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2)
  );
}
exports.getTimestampRtcFormat = getTimestampRtcFormat;

/**
 * Berechnet die Millisekunden bis zum nächsten Tag
 *
 * @author Sven Piller <sven.piller@dlh.de>
 * @since 0.1
 * @version 1
 * @return {Number} Millisekunden bis zum nächsten Tag
 */
function timeUntilMidnight() {
  d = new Date();
  ts = d.getTime();
  d.setHours(24, 0, 0, 0);
  return (Math.floor((d - ts)) + 1);
}
exports.timeUntilMidnight = timeUntilMidnight;
