var mysql         = require('mysql'),
    uuid          = require('uuid/v4'),
    async         = require('async'),
    EnrollStudent = require('../models/EnrollStudent');

var pool = mysql.createPool({
    host:       "localhost",
    user:       "root",
    password:   "password",
    database:   "SISystem"
});

exports.addClass = function(netID, code, name, callback) {
    var id = uuid();
    var query = 'INSERT INTO course (pNetId, cID, cCode, cName) VALUES (?, ?, ?, ?)';
    runQuery(query, [netID, id, code, name], function(err, results, fields) {
        if (err) callback(err);
        else callback(err, err ? null : id, results, fields);
    });
};

exports.editClassName = function(netID, cID, name, callback) {
    var query = 'UPDATE course SET cName=? WHERE cID=?';
    runQuery(query, [name, cID], callback);
};

exports.editClassCode = function(netID, cID, code, callback) {
    var query = 'UPDATE course SET cCode=? WHERE cID=?';
    runQuery(query, [code, cID], callback);
};

/**
 * Enroll students in a class
 * @param {string} classID
 * @param {EnrollStudent[]} students
 * @param {Function} callback
 */
exports.enroll = function(classID, students, callback) {
    useConnection(callback, function(con) {
        var toEnroll = [];
        var newStudents = [];
        var errorStudents = [];
        async.forEachOf(students, function(student, i, innerCallback) {
            con.query('SELECT 1 FROM student WHERE sNetID = ?', [student.netID], function(err, results, fields) {
                if (err) {
                    errorStudents.push(student);
                    innerCallback(err);
                } else {
                    if (!Array.isArray(results)) { 
                        errorStudents.push(student);
                        innerCallback(new Error('Select query did not return an array'));
                    } else if (results.length > 1) {
                        errorStudents.push(student);
                        innerCallback(new Error('Selct query returned more than 1 row'));
                    } else {
                        if (results.length === 0) { // student does not exist, insert student
                            newStudents.push(student);
                            toEnroll.push(student);
                            innerCallback();
                        } else { // student exists, need to check current enrollment to avoid attempting duplicates
                            alreadyEnrolledQuery = 'SELECT 1 FROM enrolled WHERE sNetID = ? AND cID = ?';
                            runExistenceQuery(alreadyEnrolledQuery, [student.netID, classID], function(err, result) {
                                if (err) innerCallback(err);
                                else {
                                    if (!result) toEnroll.push(student);
                                    innerCallback();
                                }
                            });
                        }
                    }
                }
            });
        }, function (err) { 
            if (err) {
                err.errorStudents = errorStudents;
                if (con) con.release();
                callback(err);
            } else {
                if (newStudents.length > 0) {
                    for (var i = 0; i < newStudents.length; i++) 
                        newStudents[i] = [ newStudents[i].netID, newStudents[i].stdNum, newStudents[i].firstName, newStudents[i].lastName ];
                    con.query('INSERT INTO student (sNetID, stdNum, fName, lName) VALUES ?', [newStudents], function(err, results, fields) {
                        if (err) callback(err);
                        else _runEnrollQuery(con, classID, toEnroll, callback);
                    });
                } else _runEnrollQuery(con, classID, toEnroll, callback);
            }
        });
    });
};

function _runEnrollQuery(con, classID, toEnroll, callback) {
    if (toEnroll.length < 1) callback({ customStatus: 409, message: 'All students already enrolled' });
    else {
        for (var i = 0; i < toEnroll.length; i++)
            toEnroll[i] = [toEnroll[i].netID, classID];
        con.query('INSERT INTO enrolled (sNetID, cID) VALUES ?', [toEnroll], callback);
    }
}

exports.profExists = function(netID, callback) {
    runQuery('SELECT * FROM professor WHERE pNetID = ? LIMIT 1', [netID], callback);
};

exports.studentExists = function(netID, callback) {
    runQuery('SELECT * FROM student WHERE sNetID = ? LIMIT 1', [netID], callback);
};

exports.ownsClass = function(classID, netID, callback) {
    runExistenceQuery('SELECT * FROM course WHERE pNetID = ? AND cID = ? LIMIT 1', [netID, classID], callback);
};

exports.isEnrolled = function(netID, classID, callback) {
    runExistenceQuery('SELECT * FROM  enrolled WHERE sNetID = ? AND cID = ? LIMIT 1', [netID, classID], callback);
};

exports.getEnrolledClasses = function(studentID, callback) {
    var query = 
        `SELECT course.cID, course.cName, course.cCode
        FROM student
            INNER JOIN enrolled ON student.sNetID = enrolled.sNetID AND student.sNetID = ?
            INNER JOIN course ON enrolled.cID = course.cID`;
    runQuery(query, [studentID], callback);
};

exports.getEnrolledStudents = function(classID, callback) {
    runQuery('SELECT sNetID FROM enrolled WHERE enrolled.cID = ?', [classID], callback);
};

exports.startAttendance = function(classID, duration, time, callback) {
    var query = 'INSERT INTO attendanceSession (cID, attTime, attDuration) VALUES ?';
    runQuery(query, [[[classID, time, duration]]], callback);
};

exports.recordAttendance = function(netID, classID, time, callback) {
    var query = 'INSERT INTO attendance (cID, attTime, sNetID) VALUES ?';
    runQuery(query, [[[classID, time, netID]]], callback);
};

exports.getTeachesClasses = function(profID, callback) {
    var query = 
        `SELECT course.cID, course.cName, course.cCode
         FROM course
         WHERE pNetID = ?`;
    runQuery(query, [profID], callback);
};

exports.getAttendanceSessions = function(classID, callback) {
    var query =
        `SELECT cID, attTime, attDuration, COUNT(sNetID) AS numInAttendance
         FROM attendanceSession NATURAL JOIN attendance
         WHERE cID = ? 
         GROUP BY attTime`;
    runQuery(query, [classID], callback);
};

exports.aggregateInfo = function(classID, callback) {
    var query = 
        `SELECT T1.sNetID, s.stdNum, s.fName, s.lName, COUNT(T2.attTime) AS attCount 
         FROM (SELECT *
               FROM enrolled
               WHERE enrolled.cID = ?) AS T1
            LEFT JOIN (SELECT * 
                       FROM attendance 
                           NATURAL JOIN attendanceSession) AS T2
                ON T1.sNetID = T2.sNetID
            LEFT JOIN student s
                ON s.sNetID = T1.sNetID
         GROUP BY sNetID`;
    runQuery(query, [classID], callback);
};

exports.getNumSession = function(classID, callback) {
    var query = 
        `SELECT *
         FROM attendanceSession
         WHERE cID = ?`;
    runQuery(query, [classID], callback);
};

exports.getSessionAttInfo = function(classID, callback) {
    var query =
        `SELECT sess.attTime, sess.attDuration, a.sNetID, s.fName, s.lName, s.stdNum
            FROM (SELECT * FROM attendanceSession WHERE cID = ?) sess 
                LEFT JOIN attendance a 
                    ON sess.cID = a.cID 
                    AND sess.attTime = a.attTime
                LEFT JOIN student s
                    ON a.sNetID = s.sNetID
        ORDER BY sess.attTime`;
    runQuery(query, [classID], callback);
};

/**
 * Runs the given query, checks if the result returned any values and returns its findings as a boolean to the callback
 * @param {string} query 
 * @param {Array} values
 * @param {Function} callback (err, result)
 */
function runExistenceQuery(query, values, callback) {
    runQuery(query, values, function(err, results, fields) {
        if (err) callback(err);
        else if (results.length > 0) 
            callback(undefined, true);
        else callback(undefined, false);
    });
}

/**
 * Run a query
 * @param {string} query
 * @param {function} callback Will call callback(err) if err or callback(undefined, results, fields)
 * @param {Array} values Values for automatic insertion
 */
function runQuery(query, values, callback) {
    useConnection(callback, function(con) {
        if (values) con.query(query, values, callback);
        else con.query(query, callback);
    });
}

function useConnection(callback, queryFunc) {
    pool.getConnection(function(err, con) {
        if (err) {
            console.log('Error getting connection from pool');
            if (con) { // try to release connection if it exists for some reason
                try {
                    con.release();
                } finally { }
            }
            callback(err);
        } else {
            queryFunc(con);
            con.release();
        }
    });
}