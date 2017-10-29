var express = require('express'),
    router = express.Router(),
    routeHelper = require('./helper'),
    helper = require('../api/helper'),
    db = require('../api/db'),
    attendanceSessions = require('../api/data/attendanceSessions');

// Authenticate every request to the student API against the DB
router.use(function(req, res, next) {
    var netId = req.cookies.netId;
    if (!netId) {
        routeHelper.sendError(res, null, 'Forbidden - No netID provided', 403);
    } else {
        db.studentExists(netId, function(err, result) {
            if (err)
                return routeHelper.sendError(res, err, 'Error checking netID');
            if (!result)
                return routeHelper.sendError(res, null, 'Supplied student netID is not registered', 403);
            next();
        });
    }
});

// Student sign in 
router.post('/sign-in/:code', function(req, res, next) {
    var code = req.params.code;
    if (!code || code.length != 5)
        return routeHelper.sendError(res, null, 'Invalid code', 422);
    var session = attendanceSessions.getEntryByCode(code);
    if (!session)
        return routeHelper.sendError(res, null, 'Class not found for provided code', 404);
    db.isEnrolled(req.params.netId, session.classId, function(err, result) {
        if (err)
            return routeHelper.sendError(res, err, '');
        if (!result) 
            return routeHelper.sendError(res, null, 'Not a member of the requested class', 403);
        db.recordAttendance(req.params.netId, session.classId, session.time, function(err, results, fields) {
            if (err)
                return routeHelper.sendError(res, err, 'Error recording attendance');
            res.status(201).send('Success');
        });
    });
});

// GET all classes associated with a specific student 
router.get('/classes', function(req, res, next) {
    db.getEnrolledClasses(req.params.netId, function(err, results, fields) {
        if (err) 
            return routeHelper.sendError(res, err, `Error getting classes for student ${studentId}`);
        else {
            for (var result in results) {
                result.defLocation = undefined;
            }
            res.json(results);
        }
    }); 
});

router.get('/hello', function(req, res, next) {
    res.status(200).send('hello');
});

router.get('/error', function(req, res, next) {
    routeHelper.sendError(res, null, 'Error lol');
});

module.exports = router;