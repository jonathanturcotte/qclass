var db = require('../db'),
    randToken = require('rand-token');

var sessions = [],
    alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

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
 * @param {string} classId uuid
 * @param {Function} callback (err, code)
 */
exports.start = function(classId, callback) {
    if (!classId) 
        callback({ error: 1, message: 'Empty classId' });
    else if (isClassRunning(classId)) 
        callback({ error: 409, message: 'Class is already running' });
    else {
        var code, exists = false;
        do {
            code = randToken.generate(5, alphabet);
            exists = sessions.find(function(e) { e.code == code });
        } while (exists);
        // TODO: make db call for starting attendance
        sessions.push({ classId: classId, code: code });
        callback(null, code);
    }
};

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