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
        `INSERT INTO course (cID, cCode, cName, regNum, defLocation)
        VALUES ('${id}', '${code}', '${name}', '${id.substring(0, 5)}', '${defLocation}')`;
    runQuery(query, callback);
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
                    console.log(err.message);
                    callback(err);
                } else {
                    var enrollQuery = `INSERT INTO enrolled (sNetID, cID) VALUES ?`;
                    con.query(enrollQuery, [values], callback);
                }
        })
    });
};

exports.getClasses = function(studentId, callback) {
    var query = 
        `SELECT course.cID, course.cName, course.cCode
        FROM student
            INNER JOIN enrolled ON student.sNetID = enrolled.sNetID AND student.sNetID = '${studentId}'
            INNER JOIN course ON enrolled.cID = course.cID`;
    runQuery(query, callback);
};

function runQuery(query, callback) {
    useConnection(callback, function(con) {
        con.query(query, callback);
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