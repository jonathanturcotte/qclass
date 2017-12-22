var db        = require('../db'),
    _         = require('underscore'),
    randToken = require('rand-token');


const ALPHABET         = '0123456789abcdefghijklmnopqrstuvwxyz',
      DEFAULT_DURATION = 60000,
      MIN_DURATION     = 30000;

// Array of running attendanceSessions, contains objects of the form { classID, code, time }
var sessions = [];

/**
 * Starts a new attendance session and creates a new session entry in the DB
 * @param {Object} params
 * @param {string} params.classID uuid
 * @param {number} [params.duration=60000] Session duration in ms, must be >= 30000
 * @param {Function} params.callback (err, code, endTime) err may contain customStatus, eg. 409 Conflict if class already exists
 */
exports.start = function(params) {
    params.duration = params.duration || DEFAULT_DURATION;

    // Ensure that this duration is valid
    if (params.duration < MIN_DURATION) {
        params.duration = DEFAULT_DURATION;
        console.warn(`attendanceSessions.start(): Duration < ${MIN_DURATION}, changed to default (${DEFAULT_DURATION})`);
    }

    // Check that this class is valid
    if (!params.classID) 
        params.callback({ customStatus: 500, message: 'Internal Server Error' });
    else if (isClassRunning(params.classID)) 
        params.callback({ customStatus: 409, message: 'Class is already running' });
    else {
        var code = generateUniqueCode(),
            time = Date.now();

        db.startAttendance(params.classID, params.duration, time, function(err, results, fields) {
            if (err)
                params.callback(err);
            else {
                var timeout = setTimeout(_stopClass, params.duration, params.classID, false);
                sessions.push({ classID: params.classID, code: code, time: time, timeout: timeout });
                params.callback(null, code, time + params.duration);
            }
        });
    }
};

/**
 * Get the classID associated with a running session code.
 * Returns the attendance session entry object, or undefined if the code does not exist
 * @param {string} code
 * @returns {Object | undefined}
 */
exports.getEntryByCode = function(code) {
    code = code.toLowerCase();

    for (var i = 0; i < sessions.length; i++) {
        if  (sessions[i].code === code)
            return sessions[i];
    }
    return undefined;
};

/**
 * Stop the running attendance session for a class.
 * Returns an object with a success boolean and an err property if success is false
 * err contains status {number} and message {string}
 * @param {string} classID
 */
exports.stopClass = function(classID) {
    return _stopClass(classID, true);
};

///////////////////////
// Private Functions //
///////////////////////

/**
 * Checks if a class is running an attendance session.
 * @param {string} classID Should be a uuid
 */
var isClassRunning = function(classID) {
    for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].classID === classID)
            return true;
    }
    return false;
};

/**
 * Stop the running attendance session for a class.
 * Returns an object with a success boolean and an err property if success is false
 * err contains status {number} and message {string}
 * If manual is truthy the timeout associated with the entry will be cleared
 * @param {string} classID 
 * @param {boolean} manual
 */
var _stopClass = function(classID, manual) {
    var index = sessions.findIndex(function(e) { return e.classID === classID; });

    if (index === -1) {
        console.warn('attendanceSessions._stopClass(): no entry found for classID ' + classID);
        return { success: false, err: { status: 404, message: 'Class not running' } };
    }

    if (manual)
        clearTimeout(sessions[index].timeout);

    // Remove the found session from the array
    sessions.splice(index, 1);

    // Set the completed flag for the session in the database
    db.stopAttendance(classID, function (err, results, fields){
        if (err) {
            console.warn('attendanceSessions._stopClass(): unable to set the completed flag for class ' + classID);
            return { success: false, err: { status: 500, message: 'Could not stop the session' } };
        }
    });

    console.log('Stopped attendance session for ' + classID);
    return { success: true };
};

var generateUniqueCode = function () {
    var exists = false,
        code;

    // Ensure we generate a unique code
    do {
        code = randToken.generate(5, ALPHABET);
        for (var i = 0; i < sessions.length; i++) {
            if (sessions[i].code === code) {
                exists = true;
                break;
            }
        }
    } while (exists);

    return code;
};