var express = require('express');
var router = express.Router();
var routeHelper = require('./helper');
var helper = require('../api/helper');
var db = require('../api/db');
var prefix = 'professor';

router.get('/', function(req, res, next) {
    res.render(routeHelper.getRenderName(prefix, 'index'));
});

router.post('/class/add', function(req, res, next) {
    db.addClass(req.body.code, req.body.name, req.body.defLocation, function(err, results, fields) {
        if (err) routeHelper.sendError(res, err, 'Error adding class');
        if (results && results[0]) {
            res.send(results);
        } else {
            console.log(`Error adding class ${req.body.code}`);
            res.send(500, { message: 'Error adding class', results: results });
        }
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
            if (err) routeHelper.sendError(res, err, 'Error running enroll');
            console.log(`Inserted ${results.affectedRows}, students added: ${helper.printArray(results)}`)
            res.send({ added: results });
        });
    } else return;
});

module.exports = router;
