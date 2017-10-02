var express = require('express');
var router = express.Router();
var helper = require('./helper');
var db = require('../api/db');
var prefix = 'professor';

router.get('/', function(req, res, next) {
  res.render(helper.getRenderName(prefix, 'index'));
});

router.post('/class/add', function(req, res, next) {
    db.addClass(req.body.code, req.body.name, req.body.defLocation, function(err, results, fields) {
        if (err) helper.sendError(res, err, 'Error adding class');
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
    if (helper.paramRegex(res, classId, helper.regex.classId, 'classId must be a valid token')) {
        var students = [];
        if (!req.body.students || !Array.isArray(req.body.students) || req.body.students.length < 1) {
            res.send(422, 'Student list missing or invalid');
            return;
        }
        for (let student in req.body.students) {
            if (helper.paramRegex(student)) {
                students.push(student);
            } else return;
        }
        db.enroll(classId, students, function(err, results, fields) {
                //TODO: Implement
        });
    } else return;
});

module.exports = router;
