var mysql         = require('mysql'),
    uuid          = require('uuid/v4'),
    async         = require('async'),
    EnrollStudent = require('../models/enrollStudent');

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

exports.getRunningSessions = function(netID, callback) {
    var query = `SELECT T1.cID AS cID, cCode, cName, attTime, attDuration, checkInCode
                 FROM administrators RIGHT JOIN (SELECT cID, cCode, cName, attTime, attDuration, completed, pNetID, checkInCode
                                                 FROM attendanceSession NATURAL JOIN course
                                                 WHERE completed = 0) AS T1
                                                 ON T1.cID = administrators.cID
                 WHERE administrators.pNetID=? OR T1.pNetID=?
                 GROUP BY (attTime)`;
    runQuery(query, [netID, netID], callback);
};

exports.editClassName = function(netID, cID, name, callback) {
    var query = 'UPDATE course SET cName=? WHERE cID=?';
    runQuery(query, [name, cID], callback);
};

exports.editClassCode = function(netID, cID, code, callback) {
    var query = 'UPDATE course SET cCode=? WHERE cID=?';
    runQuery(query, [code, cID], callback);
};

exports.addProfessor = function (netID, fName, lName, callback) {
    runQuery('INSERT INTO professor (pNetID, fName, lName) VALUES (?, ?, ?)', [user.netID, user,fName, user.lName], callback);
};

exports.getProfessor = function (netID, callback) {
    runQuery('SELECT * FROM professor WHERE pNetID = ?', [netID], callback);
};

exports.updateProfessor = function (netID, fName, lName, callback) {
    runQuery('UPDATE professor SET fName = ?, lName = ? WHERE pNetID = ?', [fName, lName, netID], callback);
};

exports.addStudent = function (netID, stdNum, fName, lName, callback) {
    runQuery('INSERT INTO student (sNetID, stdNum, fName, lName) VALUES (?, ?, ?, ?)', [user.netID, user.stdNum, user,fName, user.lName], callback);
};

exports.getStudent = function (netID, callback) {
    runQuery('SELECT * FROM student WHERE pNetID = ?', [netID], callback);
};

exports.updateStudent = function (netID, stdNum, fName, lName, callback) {
    runQuery('UPDATE student SET stdNum = ?, fName = ?, lName = ? WHERE pNetID = ?', [stdNum, fName, lName, netID], callback);
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
            con.query('SELECT 1 FROM student WHERE sNetID = ? AND stdNum = ? AND fName = ? AND lName = ?', [student.netID, student.stdNum, student.firstName, student.lastName], function(err, results, fields) {
                if (err) {
                    errorStudents.push(student);
                    innerCallback(err);
                } else {
                    if (results.length === 0) {
                        con.query('SELECT 1 FROM student WHERE sNetID = ?', [student.netID], function (err, results, fields) {
                            if (err) innerCallback(err);
                            else {
                                if (results.length > 0) {
                                    // netID already exists in student but didn't match
                                    errorStudents.push(student);
                                    innerCallback({ httpStatus: 409, body: { customStatus: 2, message: 'Student with that NetID already exists' } });
                                } else {
                                    newStudents.push(student);
                                    toEnroll.push(student);
                                    innerCallback();
                                }
                            }
                        });
                    } else { // student exists, need to check current enrollment to avoid attempting duplicates
                        con.query('SELECT 1 FROM enrolled WHERE sNetID = ? AND cID = ?', [student.netID, classID], function(err, results, fields) {
                            if (err) return innerCallback(err);
                            if (results.length <= 0) toEnroll.push(student);
                            innerCallback();
                        });
                    }
                }
            });
        }, function (err) { 
            if (err) {
                err.errorStudents = errorStudents;
                callback(err);
            } else {
                if (newStudents.length > 0) {
                    for (var i = 0; i < newStudents.length; i++) 
                        newStudents[i] = [ newStudents[i].netID, newStudents[i].stdNum, newStudents[i].firstName, newStudents[i].lastName ];
                    
                    con.beginTransaction(function (err) {
                        if (err) return con.rollback(function() { callback(err); });

                        con.query('INSERT INTO student (sNetID, stdNum, fName, lName) VALUES ?', [newStudents], function(err, results, fields) {
                            if (err) return con.rollback(function() { callback(err); });
                            if (toEnroll.length < 1) {
                                return con.rollback(function() {
                                    callback({ httpStatus: 409, body: { customStatus: 1, message: 'All students already enrolled' } }); 
                                });
                            }
                            
                            for (var i = 0; i < toEnroll.length; i++)
                                toEnroll[i] = [toEnroll[i].netID, classID];
                            
                            con.query('INSERT INTO enrolled (sNetID, cID) VALUES ?', [toEnroll], function(err, results, fields) {
                                if (err) return con.rollback(function() { callback(err); });
                                con.commit(function (err) {
                                    if (err) return con.rollback(function() { callback(err); });
                                    callback(null, results, fields);
                                });
                            });
                        });
                    });
                } else {
                    if (toEnroll.length < 1) callback({ httpStatus: 409, body: { customStatus: 1, message: 'All students already enrolled' } });
                    else {
                        for (var i = 0; i < toEnroll.length; i++)
                            toEnroll[i] = [toEnroll[i].netID, classID];
                        con.query('INSERT INTO enrolled (sNetID, cID) VALUES ?', [toEnroll], callback);
                    }
                }
            }
        });
    });
};

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

exports.getEnrolledStudentsWithInfo = function(classID, callback) {
    var query =
        `SELECT s.sNetID, s.stdNum, s.fName, s.lName
         FROM enrolled e NATURAL JOIN student s
         WHERE e.cID = ?`;
    runQuery(query, [classID], callback);
};

exports.startAttendance = function(classID, duration, time, checkInCode, callback) {
    useConnection(callback, function(con) {
        con.beginTransaction(function (err) {
            if (err) return con.rollback(function() { callback(err); });

            var newSessionQuery = 'INSERT INTO attendanceSession (cID, attTime, attDuration, checkInCode) VALUES ?';
            con.query(newSessionQuery, [[[classID, time, duration, checkInCode]]], function(err, results, fields) {
                if (err) return con.rollback(function() { callback(err); });

                // Get current enrollment list
                exports.getEnrolledStudents(classID, function(err, enrolled, fields) {
                    if (err) return con.rollback(function() { callback(err); });

                    // Create rows for all enrolled students with no recorded attendance to give a snapshot of enrollment at this time
                    if (enrolled.length > 0) {
                        var bulkAttendanceInsert = 'INSERT INTO attendance (cID, attTime, sNetID, attended) VALUES ?',
                            entries = [];

                        for (var i = 0; i < enrolled.length; i++)
                            entries[i] = [classID, time, enrolled[i].sNetID, 0];
                        
                        con.query(bulkAttendanceInsert, [entries], function (err, results, fields) {
                            if (err) return con.rollback(function() { callback(err); });
                            con.commit(function (err) {
                                if (err) return con.rollback(function() { callback(err); });
                                callback(null, results, fields);
                            });
                        });
                    } else {
                        con.commit(function (err) {
                            if (err) return con.rollback(function() { callback(err); });
                            callback(null, [], []);
                        });
                    }
                });
            });
        });
    });
};

exports.stopAttendance = function(classID, time, callback) {
    var query = 'UPDATE attendanceSession SET completed=1 WHERE cID=? AND attTime=?';
    runQuery(query, [classID, time], callback);
};

exports.recordAttendance = function(netID, classID, time, callback) {
    var query = 'UPDATE attendance SET attended = 1 WHERE sNetID = ? AND cID = ? AND attTime = ?';
    runQuery(query, [netID, classID, time], callback);
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
        `SELECT cID, attTime, attDuration, COUNT(sNetID) numInAttendance
         FROM attendanceSession NATURAL JOIN attendance
         WHERE cID = ? AND attendance.attended = 1
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
                       FROM attendance NATURAL JOIN attendanceSession
                       WHERE attendance.attended = 1) AS T2
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
         WHERE cID = ?
         AND completed = 1`;
    runQuery(query, [classID], callback);
};

exports.getSessionAttInfo = function(classID, callback) {
    var query =
        `SELECT sess.attTime, sess.attDuration, a.sNetID, a.attended, s.fName, s.lName, s.stdNum
            FROM (SELECT * FROM attendanceSession WHERE cID = ? AND completed = 1) sess 
                LEFT JOIN attendance a 
                    ON sess.cID = a.cID 
                    AND sess.attTime = a.attTime
                LEFT JOIN student s
                    ON a.sNetID = s.sNetID
        ORDER BY sess.attTime`;
    runQuery(query, [classID], callback);
};

// Uses a transaction to perform multiple queries with rollback upon failure
// Removes: enrollment, admin, session, attendance and course 
exports.removeCourse = function (classID, callback) {
    useConnection(callback, function (con) {
        // begins series of queries
        con.beginTransaction(function (err) {            
            if (err) { return callback(err); }
            
            // First deletes enrollment information
            con.query('DELETE FROM enrolled WHERE cID=?', classID, function (err, result, fields) {
                if (err) return con.rollback(function() { callback(err); });
                
                // Second query deletes admin information
                con.query('DELETE FROM administrators WHERE cID=?', classID, function (err, result, fields) {
                    if (err) return con.rollback(function() { callback(err); });
                    
                    // Third query deletes attendance information
                    con.query('DELETE FROM attendance WHERE cID=?', classID, function (err, result, fields) {
                        if (err) return con.rollback(function() { callback(err); });
                        
                        // Fourth query deletes session information 
                        con.query('DELETE FROM attendanceSession WHERE cID=?', classID, function (err, result, fields) {
                            if (err) return con.rollback(function() { callback(err); });
                            
                            // Fifth query deletes course information
                            con.query('DELETE FROM course WHERE cID=?', classID, function (err, result, fields) {
                                if (err) return con.rollback(function() { callback(err); });
                                
                                // Commit changes
                                con.commit(function (err) {
                                    if (err) return con.rollback(function() { callback(err); });
                                    callback();
                                });
                            });
                        });
                    }); 
                });
            });
        });        
    });
};

exports.removeFromClass = function (netID, classID, callback) {
    var query = 'DELETE FROM enrolled WHERE sNetID = ? AND cID = ?';
    runQuery(query, [netID, classID], callback);
};

exports.removeSession = function (classID, time, callback) {
    useConnection(callback, function (con) {
        con.beginTransaction(function (err) {
            if (err) return con.rollback(function() { callback(err); });

            var removeSession = 'DELETE FROM attendanceSession WHERE cID=? AND attTime=?';
            con.query(removeSession, [classID, time], function (err, results, fields) {
                if (err) return con.rollback(function() { callback(err); });
                
                var removeAttHist = 'DELETE FROM attendance WHERE cID=? AND attTime=?';
                con.query(removeAttHist, [classID, time], function (err, results, fields) {
                    if (err) return con.rollback(function() { callback(err); });
                    con.commit(function (err) {
                        if (err) return con.rollback(function() { callback(err); });
                        callback(null, results, fields);
                    });
                });
            });
        });
    });
};

exports.addAdmin = function (classID, netID, callback) {
    runQuery('INSERT INTO administrators (cID, pNetID) VALUES (?, ?)', [classID, netID], callback);
};

exports.removeAdmin = function (classID, netID, callback) {
    runQuery('DELETE FROM administrators WHERE cID = ? AND pNetID = ?', [classID, netID], callback);
};

exports.getAdministeredClasses = function (netID, callback) {
    var query = `SELECT c.cID, c.cName, c.cCode
                 FROM course c JOIN administrators a ON c.cID = a.cID
                 WHERE a.pNetID = ?`;
    runQuery(query, [netID], callback);
};

exports.getAdminsByClass = function (classID, callback) {
    var query = `SELECT a.pNetID, p.fName, p.lName
                 FROM administrators a LEFT JOIN professor p ON p.pNetID = a.pNetID
                 WHERE a.cID = ?`;
    runQuery(query, [classID], callback);
};

exports.isAdmin = function (netID, classID, callback) {
    runExistenceQuery('SELECT 1 FROM administrators WHERE pNetID = ? AND cID = ?', [netID, classID], callback);
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