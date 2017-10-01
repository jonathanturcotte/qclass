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
    var queryString = 
        `INSERT INTO course (cID, cCode, cName, regNum, defLocation)
        VALUES ('${id}', '${code}', '${name}', '${id.substring(0, 5)}', '${defLocation}')`;
    query(queryString, callback, 'addClass');
};

exports.addStudent = function(netId, firstName, lastName, studentNumber, callback) {
    var queryString = 
        `INSERT INTO student (sNetID, fname, lName, stdNum)
        VALUES ('${netId}', '${firstName}', '${lastName}', '${studentNumber}'`;
    query(queryString, callback, 'addStudent');   
};

exports.getClasses = function(studentId, callback) {
    var queryString = 
        `SELECT course.cID, course.cName, course.cCode
        FROM student
            INNER JOIN enrolled ON student.sNetID = enrolled.sNetID AND student.sNetID = '${studentId}'
            INNER JOIN course ON enrolled.cID = course.cID`;
    query(queryString, callback, 'getClasses');
};

function query(queryString, callback, queryName) {
    useConnection(callback, function(con) {
        con.query(queryString, function(err, result, fields) {
            if (err) {
                console.log(`Error running db.${queryName || '\'unnamed\''} query`);
                callback(err, null, null);
            } else {
                callback(null, result, fields);
            }
        });
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