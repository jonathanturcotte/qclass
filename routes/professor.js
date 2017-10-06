var express = require('express');
var router = express.Router();
var routeHelper = require('./helper');
var helper = require('../api/helper');
var db = require('../api/db');
var prefix = 'professor';

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

router.get('/', authenticate, function(req, res, next) { 
    res.render(routeHelper.getRenderName(prefix, 'index'));
});

router.post('/class/add', authenticate, function(req, res, next) {
    db.addClass(req.body.code, req.body.name, req.body.defLocation, function(err, results, fields) {
        if (err) 
            routeHelper.sendError(res, err, 'Error adding class');
        else
            res.status(201).send('Class added!'); 
    });
});

// get lectures for a prof
router.get('/class/:classId/lectures', authenticate, function(req, res, next) {
    var classId = req.params.classId;
    if (routeHelper.paramRegex(res, classId, routeHelper.regex.classId, 'classId must be a valid token')) {
        var netId = req.cookies.netId; 
        db.ownsClass(classId, netId, function(err, result) {
            if (err) 
                routeHelper.sendError(res, err, 'Permission not granted', 403);
            else {
                if (!result)
                    res.status(403).send();
                else {
                    db.getLectures(classId, function(err, results, fields) {
                        if (err) 
                            routeHelper.sendError(res, err, 'Error fetching lectures');
                        else {
                            for(var i = 0; i < results.length; i++) {
                                results[i].cID = undefined;
                            }
                            console.log(`Found ${results.length} lectures`);
                            res.json(results);
                        }
                    });
                }
            }
        });
    }  else return;
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

module.exports = router;
