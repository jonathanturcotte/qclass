var express = require('express'),
    router = express.Router(),
    routeHelper = require('./helper'),
    helper = require('../api/helper'),
    db = require('../api/db'),
    attendanceSessions = require('../api/data/attendanceSessions');

var authenticate = function(req, res, next) {
    var netId = req.cookies.netId;
    if (!netId) {
        routeHelper.sendError(res, null, 'Forbidden - No netID provided', 403);
    } else {
        db.profExists(netId, function(err, result) {
            if (err)
                routeHelper.sendError(res, err, 'Error checking netID');
            else if (!result)
                routeHelper.sendError(res, null, 'Supplied professor netID is not registered', 403);
            else 
                next();
        });
    }
};

router.post('/class/add', authenticate, function(req, res, next) { 
    // TODO: Add validation
    db.addClass(req.body.code, req.body.name, req.body.defLocation, function(err, results, fields) {
        if (err) 
            routeHelper.sendError(res, err, 'Error adding class');
        else
            res.status(201).send(); 
    });
});

router.post('/class/:classId/enroll', authenticate, function(req, res, next) {
    var classId = req.params.classId;
    if (routeHelper.paramRegex(res, classId, routeHelper.regex.classId, 'classId must be a valid token')) {
        var reqStudents = req.body.students;
        var students = [];
        if (!reqStudents || !Array.isArray(reqStudents) || reqStudents.length < 1) {
            res.status(422).send('Student list missing or invalid');
            return;
        }
        // Validate each entry in the students array
        for (let i = 0; i < reqStudents.length; i++) {
            if (typeof(reqStudents[i]) === 'string' && reqStudents[i].length >= 3 && reqStudents[i].length < 20 /*routeHelper.regex.studentNetId.test(reqStudents[i])*/) {
                students.push(reqStudents[i]);
            } else {
                res.status(422).send(`Invalid student netID in list: ${reqStudents[i]}`);
                return;
            }
        }
        db.enroll(classId, students, function(err, results, fields) {
            if (err)  {
                console.log(`Error enrolling: ${err.message}`);
                res.status(500).send(`Error enrolling students. ${error.errorStudents ? `Students that caused errors: ${helper.printArray(error.errorStudents)}` : ''}`);
            } else {
                console.log(`Inserted ${results.affectedRows} students`);
                res.status(201).json({ added: results });
            }
        });
    } else return;
});

router.post('/class/start/:classId', authenticate, function(req, res, next) {
    var classId = req.params.classId;
    if (!classId) 
        routeHelper.sendError(res, null, 'Invalid ClassID', 422);
    else {
        db.ownsClass(classId, req.params.netId, function(err, result) {
            if (err)
                routeHelper.sendError(res, err);
            else {
                var start = attendanceSessions.start(classId);
                if (start.error) {
                    routeHelper.sendError(res, null, start.message, start.error);
                } else {
                    res.send('Success');
                }
            }
        })
    }
});

module.exports = router;