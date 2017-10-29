var express = require('express'),
    router = express.Router(),
    routeHelper = require('./helper'),
    helper = require('../api/helper'),
    db = require('../api/db'),
    attendanceSessions = require('../api/data/attendanceSessions');

// Authenticate every request to the professor API against the DB
router.use(function(req, res, next) {
    var netId = req.cookies.netId;
    if (!netId)
        return routeHelper.sendError(res, null, 'Forbidden - No netID provided', 403);
    db.profExists(netId, function(err, result) {
        if (err)
            return routeHelper.sendError(res, err, 'Error checking netID');
        if (!result)
            return routeHelper.sendError(res, null, 'Supplied professor netID is not registered', 403);
        next();
    });
});

router.post('/class/add', authenticate, function(req, res, next) { 
    // TODO: Add validation of body
    db.addClass(req.body.code, req.body.name, req.body.defLocation, function(err, results, fields) {
        if (err) 
            return routeHelper.sendError(res, err, 'Error adding class');
        res.status(201).send(); 
    });
});

router.post('/class/:classId/enroll', authenticate, function(req, res, next) {
    var classId = req.params.classId;
    if (!routeHelper.regex.classId.test(classId))
        return routeHelper.sendError(res, null, 'Invalid classId', 404);
    var reqStudents = req.body.students;
    var students = [];
    if (!reqStudents || !Array.isArray(reqStudents) || reqStudents.length < 1)
        return res.status(422).send('Student list missing or invalid');
    // Validate each entry in the students array
    for (let i = 0; i < reqStudents.length; i++) {
        if (typeof(reqStudents[i]) === 'string' && reqStudents[i].length >= 3 && reqStudents[i].length < 20 /*routeHelper.regex.studentNetId.test(reqStudents[i])*/)
            students.push(reqStudents[i]);
        else 
            return res.status(422).send(`Invalid student netID in list: ${reqStudents[i]}`);
    }
    db.enroll(classId, students, function(err, results, fields) {
        if (err)  
            return routeHelper.sendError(res, err, `Error enrolling students. ${err.errorStudents ? `Students that caused errors: ${helper.printArray(err.errorStudents)}` : ''}`);
        console.log(`Inserted ${results.affectedRows} students`);
        res.status(201).json({ added: results });
    });
});

router.post('/class/start/:classId', authenticate, function(req, res, next) {
    var classId = req.params.classId;
    if (!classId || classId.length < 36) 
        routeHelper.sendError(res, null, 'Invalid ClassID', 404);
    else {
        db.ownsClass(classId, req.params.netId, function(err, result) {
            if (err)
                return routeHelper.sendError(res, err);
            var start = attendanceSessions.start(classId);
            if (start.error) 
                return routeHelper.sendError(res, null, start.message, start.error);
            res.send('Success');
        })
    }
});

module.exports = router;