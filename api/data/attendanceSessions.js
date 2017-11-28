var db = require('../db'),
    randToken = require('rand-token');

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz',
    DEFAULT_DURATION = 60000,
    MIN_DURATION = 30000;

var sessions = []; // array of running attendanceSessions, contains objects of the form { classId, code, time }

/**
 * Checks if a class is running an attendance session.
 * @param {string} classId Should be a uuid
 */
var isClassRunning = function(classId) {
    if (sessions.find(function(e) { return e.classId === classId })) {
        return true;
    }
    return false;
}
exports.isClassRunning = isClassRunning;

/**
 * Starts a new attendance session and creates a new session entry in the DB
 * @param {Object} params
 * @param {string} params.classId uuid
 * @param {number} [params.duration=60000] Session duration in ms, must be >= 30000
 * @param {Function} params.callback (err, code, endTime) err may contain customStatus, eg. 409 Conflict if class already exists
 */
exports.start = function(params) {
    if (!params.duration)
        params.duration = DEFAULT_DURATION;
    else if (params.duration < MIN_DURATION) {
        params.duration = DEFAULT_DURATION;
        console.warn(`attendanceSessions.start(): Duration < ${MIN_DURATION}, changed to default (${DEFAULT_DURATION})`);
    }
    if (!params.classId) 
        params.callback({ customStatus: 500, message: 'Internal Server Error' });
    else if (isClassRunning(params.classId)) 
        params.callback({ customStatus: 409, message: 'Class is already running' });
    else {
        var code, exists = false;
        do {
            code = randToken.generate(5, ALPHABET);
            exists = sessions.find(function(e) { return e.code == code });
        } while (exists);
        var time = Date.now();
        db.startAttendance(params.classId, params.duration, time, function(err, results, fields) {
            if (err)
                params.callback(err);
            else {
                var timeout = setTimeout(_stopClass, params.duration, params.classId);
                sessions.push({ classId: params.classId, code: code, time: time, timeout: timeout });
                params.callback(null, code, time + params.duration);
            }
        });
    }
};

/**
 * Get the classId associated with a running session code.
 * Returns the attendance session entry object, or undefined if the code does not exist
 * @param {string} code
 * @returns {Object | undefined}
 */
exports.getEntryByCode = function(code) {
    code = code.toLowerCase();
    var found = sessions.find(function(e) { return e.code === code });
    if (!found) 
        return;
    else {
        return found;
    }
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
    var index = sessions.findIndex(function(e) { return e.classId === classID });
    if (index === -1) {
        console.warn('attendanceSessions.stop(): no entry found for classId ' + classId);
        return { success: false, err: { status: 404, message: 'Class not running' } };
    }
    if (manual) clearTimeout(sessions[index].timeout);
    sessions.splice(index, 1);
    console.log('Stopped attendance session for ' + classID);
    return { success: true };
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