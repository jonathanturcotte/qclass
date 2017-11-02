var express = require('express'),
    router = express.Router(),
    routeHelper = require('./helper'),
    helper = require('../api/helper'),
    db = require('../api/db'),
    attendanceSessions = require('../api/data/attendanceSessions');

/**
 * Authenticate every request to the professor API against the DB
 * If successful, req.user will contain an object with the netId, firstName and lastName of the prof
 */ 
router.use(function(req, res, next) {
    var netId = req.cookies.netId;
    if (!netId) return routeHelper.sendError(res, null, 'Forbidden - No netID provided', 403);
    db.profExists(netId, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error checking netID');
        if (!(results.length > 0)) return routeHelper.sendError(res, null, 'Supplied professor netID is not registered', 403);
        req.user = { 
            netId: results[0].pNetID,
            firstName: results[0].fName,
            lastName: results[0].lName
        };
        next();
    });
});

router.param('classId', function(req, res, next, classId) {
    if (!classId) return routeHelper.sendError(res, null, 'Empty classId', 400);
    if (!routeHelper.regex.class.id.test(classId))
        return routeHelper.sendError(res, null, 'Invalid classId', 400);
    db.ownsClass(classId, req.user.netId, function(err, result) {
        if (err) return routeHelper.sendError(res, err, 'Error processing request');
        if (!result) return routeHelper.sendError(res, null, 'User does not own the requested class', 403);
        next();
    });
});

router.get('/user', function(req, res, next) {
    res.json(req.user);
});

// GET all classes associated with a specific professor 
router.get('/classes', function(req, res, next) {
    db.getTeachesClasses(req.user.netId, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error getting classes');
        res.json(results);
    }); 
});

// Add a new class
router.post('/class/add', function(req, res, next) { 
    var code = req.body.code,
        name = req.body.name;
    if (!routeHelper.regex.class.code.test(code)) 
        return routeHelper.sendError(res, null, 'Invalid code format', 400);
    if (name.length < 3 || name.length > 100 || !routeHelper.regex.class.name.test(name)) 
        return routeHelper.sendError(res, null, 'Invalid class name', 400);
    db.getTeachesClasses(req.user.netId, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err);
        for (var i = 0; i < results.length; i++) {
            if (results[i].cCode === code)
                return routeHelper.sendError(res, null, `User already teaches a course with the course code ${code}`, 400);
        }
        db.addClass(req.user.netId, code, name, function(err, id, results, fields) {
            if (err) return routeHelper.sendError(res, err, 'Error adding class');
            res.status(201).json({ classId: id }); 
        });
    });
});

// Enroll students in a class
router.post('/class/enroll/:classId', function(req, res, next) {
    var reqStudents = req.body.students,
        students = [];
    if (!reqStudents || !Array.isArray(reqStudents) || reqStudents.length < 1)
        return routeHelper.sendError(res, null, 'Student list was either not provided by user or invalid', 400);
    // Validate each entry in the students array
    for (let i = 0; i < reqStudents.length; i++) {
        if (typeof(reqStudents[i]) === 'string' && reqStudents[i].length >= 3 && reqStudents[i].length <= 20)
            students.push(reqStudents[i]);
        else return routeHelper.sendError(res, null, `Invalid student netID in list at position ${i}: ${reqStudents[i]}`, 400);
    }
    db.enroll(req.params.classId, students, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, `Error enrolling students. ${err.errorStudents ? `Students that caused errors: ${helper.printArray(err.errorStudents)}` : ''}`);
        console.log(`Inserted ${results.affectedRows} students`);
        res.status(201).json({ 
            affectedRows: results.affectedRows 
        });
    });
});

// Start an attendance session for a class, return the code to the professor
router.post('/class/start/:classId', function(req, res, next) {
    var duration = req.body.duration;
    if (!duration || !(typeof(duration) === 'number'))
        duration = null;
    attendanceSessions.start({ classId: req.params.classId, duration: duration, callback: function(err, code) {
        if (err) return routeHelper.sendError(res, err, 'Error starting attendance session');
        res.send(code);
    } });
});

// GET all attendance sessions for a certain class
router.get('/:classId/attendanceSessions', function(req, res, next) {
    db.getAttendanceSessions(req.params.classId, function(err, results, fields) {
        if (err) return routeHelper.senderror(res, err, `Error retrieving attendance sessions for ${req.user.netId}`);
        else res.json(results);
    });
});
 
// Aggregate Info: student | attendance (%)
// Session Info: Total Number of students + Percent Attendance
//               List of students in attendance: name, netId, std#   
router.get('/:classId/exportAttendance', function(req, res, next) {
    var classId = req.params.classId;
    db.aggregateInfo(classId, function(err, attInfo, fields) {
        if (err) return routeHelper.senderror(res, err, `Error retrieving attendance information for ${req.cookies.netId}`);
        if (attInfo.length == 0) res.send(`No Attendance Information for Course`);
        else{
            db.getNumSession(classId, function(err, numSessions, fields) {
                if(err) return routeHelper.senderror(res, err, `Error retrieving number of sessions `);
                if(numSessions.length == 0) res.send(`No Attendance sessions for couse`);
                else {
                    for(let i = 0; i < attInfo.length; i++)
                        attInfo[i].attPercent = (attInfo[i].attCount/numSessions.length)*100; 
                    res.json(attInfo);
                }
            });
        }
    });
    
});

module.exports = router;