var mysql = require('mysql');
var uuid = require('uuid/v4');

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

exports.addStudent = function(netId, firstName, lastName, studentNumber, callback) {
    var query = 
        `INSERT INTO student (sNetID, fname, lName, stdNum)
        VALUES ('${netId}', '${firstName}', '${lastName}', '${studentNumber}'`;
    runQuery(query, callback);   
};

exports.enroll = function(classId, students, callback) {
    var values = [];
    for (let i = 0; i < students.length; i++) {
        values[i] = [ students[i], classId ];
    }
    useConnection(callback, function(con) {
        var query = `INSERT INTO enrolled (sNetID, cID) VALUES ?)`;
        con.query(query, [values], callback);
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
        con.query(query, callback(err, result, fields));
    });
}

function useConnection(callback, queryFunc) {
    pool.getConnection(function(err, con) {
        if (err) {
            console.log('Error getting connection from pool');
            callback(err, null, null);
        } else {
            queryFunc(con);
        }
    });
}; 