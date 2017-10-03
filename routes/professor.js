var express = require('express');
var router = express.Router();
var routeHelper = require('./helper');
var helper = require('../api/helper');
var db = require('../api/db');
var prefix = 'professor';

router.get('/', function(req, res, next) { Request
    res.render(routeHelper.getRenderName(prefix, 'index'));
});

router.post('/class/add', function(req, res, next) {
    db.addClass(req.body.code, req.body.name, req.body.defLocation, function(err, results, fields) {
        if (err) routeHelper.sendError(res, err, 'Error adding class');
        res.status(201).send();
    });
});

router.post('/class/:classId/enroll', function(req, res, next) {
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
                res.status(201).send({ added: results });
            }
        });
    } else return;
});

module.exports = router;
