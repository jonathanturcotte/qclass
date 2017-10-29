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

router.post('/class/add', function(req, res, next) { 
    // TODO: Add validation of body
    db.addClass(req.body.code, req.body.name, req.body.defLocation, function(err, results, fields) {
        if (err) 
            return routeHelper.sendError(res, err, 'Error adding class');
        res.status(201).send(); 
    });
});

router.post('/class/:classId/enroll', function(req, res, next) {
    var classId = req.params.classId;
    if (!routeHelper.regex.classId.test(classId))
        return routeHelper.sendError(res, null, 'Invalid classId', 404);
    var reqStudents = req.body.students;
    var students = [];
    if (!reqStudents || !Array.isArray(reqStudents) || reqStudents.length < 1)
        return routeHelper.sendError(res, null, 'Student list was either not provided by user or invalid', 422);
    // Validate each entry in the students array
    for (let i = 0; i < reqStudents.length; i++) {
        if (typeof(reqStudents[i]) === 'string' && reqStudents[i].length >= 3 && reqStudents[i].length < 20 /*routeHelper.regex.studentNetId.test(reqStudents[i])*/)
            students.push(reqStudents[i]);
        else 
            return routeHelper.sendError(res, null, `Invalid student netID in list at position ${i}: ${reqStudents[i]}`, 422);
    }
    db.enroll(classId, students, function(err, results, fields) {
        if (err)  
            return routeHelper.sendError(res, err, `Error enrolling students. ${err.errorStudents ? `Students that caused errors: ${helper.printArray(err.errorStudents)}` : ''}`);
        console.log(`Inserted ${results.affectedRows} students`);
        res.status(201).json({ added: results });
    });
});

router.post('/class/start/:classId', function(req, res, next) {
    var classId = req.params.classId;
    if (!classId || !routeHelper.regex.classId.test(classId)) 
        return routeHelper.sendError(res, null, 'Invalid ClassID', 404);
    db.ownsClass(classId, req.cookies.netId, function(err, result) {
        if (err)
            return routeHelper.sendError(res, err, 'Error processing request - Attendance session NOT started');
        var duration = req.body.duration;
        if (!duration || !(typeof(duration) === 'number'))
            duration = null;
        attendanceSessions.start({ classId: classId, duration: duration, callback: function(err, code) {
            if (err) {
                if (err.customStatus) 
                    return routeHelper.sendError(res, null, err.message, err.customStatus);
                else 
                    return routeHelper.sendError(res, err, 'Error starting session');
            }
            res.send(code);
        } });
    });
});

// GET all classes associated with a specific student 
router.get('/classes', function(req, res, next) {
    db.getTeachesClasses(req.cookies.netId, function(err, results, fields) {
        if (err) 
            routeHelper.sendError(res, err, `Error getting classes for professor ${profId}`);
        else            
            res.json(results);
        
    }); 
});

module.exports = router;