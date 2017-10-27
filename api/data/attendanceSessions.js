var db = require('../db'),
    randToken = require('rand-token');

var sessions = [], // array of running attendanceSessions, contains objects of the form { classId, code }
    ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz',
    DEFAULT_DURATION = 60000;

/**
 * Checks if a class is running an attendance session.
 * @param {string} classId Should be a uuid
 */
var isClassRunning = function(classId) {
    if (sessions.find(function(e) { e.classId === classId })) {
        return true;
    }
    return false;
}
exports.isClassRunning = isClassRunning;

/**
 * Starts a new attendance session and creates a new session entry in the DB
 * @param {Object} params
 * @param {string} params.classId uuid
 * @param {number} [params.duration=60000] Session duration in ms
 * @param {Function} params.callback (err, code)
 */
exports.start = function(params) {
    if (!params.duration)
        params.duration = DEFAULT_DURATION;
    else if (params.duration < 1) {
        params.duration = DEFAULT_DURATION;
        console.warn(`attendanceSessions.start(): Duration < 1, changed to default (${DEFAULT_DURATION})`);
    }
    if (!params.classId) 
        params.callback({ error: 1, message: 'Empty classId' });
    else if (isClassRunning(params.classId)) 
        callback({ error: 409, message: 'Class is already running' });
    else {
        var code, exists = false;
        do {
            code = randToken.generate(5, ALPHABET);
            exists = sessions.find(function(e) { e.code == code });
        } while (exists);
        db.startAttendance(params.classId, params.duration, function(err, results, fields) {
            if (err)
                params.callback(err);
            else {
                sessions.push({ classId: params.classId, code: code });
                setTimeout(stop, params.duration, params.classId);
                callback(null, code);
            }
        });
    }
};

/**
 * Stop the running attendance session for a class.
 * Returns true on success, false if the classId is not found
 * @param {string} classId 
 */
var stop = function(classId) {
    var index = sessions.findIndex(function(e) { e.classId === classId });
    if (index === -1) {
        console.warn(`attendanceSessions.stop(): no entry found for classId '${classId}'`);
        return false;
    } else {
        sessions.splice(index, 1);
        return true;
    }
}
exports.stop = stop;

/**
 * Get the classId associated with a running session code.
 * Returns the classId as a string, or undefined if the code does not exist
 * @param {string} code
 * @returns {string | undefined}
 */
exports.getClassFromCode = function(code) {
    var found = sessions.find(function(e) { e.code === code });
    if (!found) 
        return;
    else {
        return found.classId;
    }
};