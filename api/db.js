var mysql = require('mysql');
var uuid = require('uuid/v4');
var async = require('async');

var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "password",
    database: "SISystem"
});

exports.addClass = function(code, name, defLocation, callback) {
    var id = uuid();
    var query = 
        `INSERT INTO course (cID, cCode, cName, defLocation)
        VALUES ('${id}', '${code}', '${name}', '${defLocation}')`;
    runQuery({ query: query, callback: callback });
};

exports.enroll = function(classId, students, callback) {
    useConnection(callback, function(con) {
        var values = [];
        var newStudents = [];
        var errorStudents = [];
        async.forEachOf(students, function(student, i, innerCallback) {
            var studentQuery = `SELECT 1 FROM student WHERE sNetID = ${student}`;
            con.query(studentQuery, function(err, result, fields) {
                if (err) {
                    errorStudents.push(student);
                    innerCallback(err);
                } else {
                    if (!Array.isArray(result)) { 
                        errorStudents.push(student);
                        innerCallback(new Error('Select query did not return an array'));
                    } else if (result.length > 1) {
                        errorStudents.push(student);
                        innerCallback(new Error('Selct query returned more than 1 row'));
                    } else if (result.length == 1) { // student does not exist, insert student
                            con.query(`INSERT INTO student (sNetID) VALUES (${student})`, function(err, results, fields) {
                                if (err) {
                                    errorStudents.push(student);
                                    innerCallback(err);
                                } else {
                                    values.push([ student, classId ]);
                                    innerCallback();
                                }
                            });
                    } else { // student already exists
                        values.push([ student, classId ]);
                        innerCallback();
                    }
                }
            });
        }, function (err) { 
                if (err) {
                    err.errorStudents = errorStudents;
                    callback(err);
                } else {
                    var enrollQuery = `INSERT INTO enrolled (sNetID, cID) VALUES ?`;
                    con.query(enrollQuery, [values], callback);
                }
        })
    });
};

exports.profExists = function(netId, callback) {
    var query = 
        `SELECT 1
        FROM professor
        WHERE pNetID = '${netId}'`;
    runExistenceQuery(query, callback);
};

exports.studentExists = function(netId, callback) {
    var query = 
        `SELECT 1
        FROM student
        WHERE sNetID = '${netId}'`;
    runExistenceQuery(query, callback);
};

exports.ownsClass = function(classId, netId, callback) {
    var query =
        `SELECT 1
         FROM  teaches
         WHERE pNetID = '${netId}' AND cID = '${classId}'`;
    runExistenceQuery(query, callback);
};

exports.isEnrolled = function(netId, classId, callback) {
    var query =
        `SELECT 1
        FROM  enrolled
        WHERE sNetID = '${netId}' AND cID = '${classId}'`;
    runExistenceQuery(query, callback);
};

exports.getEnrolledClasses = function(studentId, callback) {
    // TODO: test removal of direct studentId insertion with ? and use of values to prevent SQL injection
    var query = 
        `SELECT course.cID, course.cName, course.cCode
        FROM student
            INNER JOIN enrolled ON student.sNetID = enrolled.sNetID AND student.sNetID = '${studentId}'
            INNER JOIN course ON enrolled.cID = course.cID`;
    runQuery({ query: query, callback: callback });
};


exports.startAttendance = function(classId, duration, time, callback) {
    var query = 'INSERT INTO attendanceSession (cID, attTime, attDuration) VALUES ?';
    runQuery({ query: query, callback: callback, values: [[classId, time, duration]] });
}

exports.recordAttendance = function(netId, classId, time, callback) {
    var query = `INSERT INTO attendance (cID, attTime, sNetID) VALUES ?`;
    runQuery({ query: query, values: [classId, time, netId], callback: callback });
}

exports.getTeachesClasses = function(profId, callback) {
    // TODO: test removal of direct studentId insertion with ? and use of values to prevent SQL injection
    var query = 
        `SELECT course.cID, course.cName, course.cCode
         FROM teaches NATURAL JOIN course
         WHERE pNetID = '${profId}'`;
    runQuery({ query: query, callback: callback });
};

/**
 * Runs the given query, checks if the result returned any values and returns its findings as a boolean to the callback
 * @param {string} query 
 * @param {Function} callback (err, result)
 */

function runExistenceQuery(query, callback) {
    runQuery({ query: query, callback: function(err, results, fields) {
        if (err) 
            callback(err);
        else if (results.length > 0) 
            callback(undefined, true);
        else
            callback(undefined, false);
    } });
}

/**
 * Run a query
 * @param {Object} params 
 * @param {string} params.query
 * @param {function} params.callback - Will call callback(err) if err or callback(undefined, results, fields)
 * @param {Array=} params.values - Optional values for automatic insertion - Must be either falsey or a populated array
 */
function runQuery(params) {
    useConnection(params.callback, function(con) {
        if (params.values) { 
            con.query(params.query, [params.values], params.callback)
        } else {
            con.query(params.query, params.callback);
        }
    });
}

function useConnection(callback, queryFunc) {
    pool.getConnection(function(err, con) {
        if (err) {
            console.log('Error getting connection from pool');
            callback(err);
        } else {
            queryFunc(con);
        }
    });
}; 

// exports.getLectures = function(classId, callback) {
//     var query = 
//         `SELECT *
//          FROM lecture
//          WHERE lecture.cID = '${classId}'`;
//     runQuery({ query: query, callback: callback });
// };

// exports.getActiveLecture = function(classId, callback) {
//     var now = Date.now();
//     var query = 
//         `SELECT *
//         FROM lecture
//         WHERE cID = '${classId}'
//             AND `; //TODO: finish query
//     runQuery({ query: query, callback: function (err, results, fields) {
//         if (err)
//             callback(err);
//         else if (results.length < 1) {
//             callback();
//         } else { 
//             if (results.length > 1) 
//                 console.log(`Warning: db.getActiveLecture query returned more than one result: ${results}`);
//             callback(undefined, results[0], fields);
//         }
//     } });
// }