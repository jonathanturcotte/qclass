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
 * @param {Function} params.callback (err, code, endTime) err may contain httpStatus, eg. 409 Conflict if class already exists
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
        params.callback({ httpStatus: 500 });
    else if (isClassRunning(params.classID)) 
        params.callback({ httpStatus: 409 });
    else {
        var code = generateUniqueCode(),
            time = Date.now();

        db.startAttendance(params.classID, params.duration, time, code, function(err, results, fields) {
            if (err)
                params.callback(err);
            else {
                var timeout = setTimeout(_stopClass, params.duration, params.classID, time, false, function(result) {
                    if (!result.success)
                        console.error('Error timing out session: ' + result.err.message);
                });
                sessions.push({ classID: params.classID, code: code, time: time, timeout: timeout });
                params.callback(null, code, time, time + params.duration);
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
exports.stopClass = function(classID, time, callback) {
    return _stopClass(classID, time, true, callback);
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
var _stopClass = function(classID, time, manual, callback) {
    var index = sessions.findIndex(function(e) { return e.classID === classID; });

    if (index === -1)
        callback({ success: false, err: { status: 404, message: 'Session for class ' + classID + ' not running' }});

    if (manual)
        clearTimeout(sessions[index].timeout);

    // Remove the found session from the array
    sessions.splice(index, 1);

    // Set the completed flag for the session in the database
    db.stopAttendance(classID, time, function (err, results, fields){
        if (err)
            callback({ success: false, err: { status: 500, message: 'Could not stop the session for class ' + classID + ': ' + err } });
        else
            callback({ success: true });
    });
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