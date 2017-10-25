var db = require('../db');

var sessions = [];

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
 * Starts the attendance session
 * @param {string} classId uuid
 * @param {Function} callback (err, code)
 */
exports.start = function(classId, callback) {
    if (!classId) 
        throw new Error('Empty classId');
    if (isClassRunning(classId)) 
        return { error: 409, message: 'Class is already running' };
    var code = '12345'; // TODO: Generate unique 5-digit code
    // TODO: make db call for starting attendance
    // sessions.push({ classId: classId, code: code });
};

exports.signIn = function(code) {
    // TODO: Implement
};