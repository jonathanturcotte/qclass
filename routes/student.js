var express = require('express'),
    router = express.Router(),
    routeHelper = require('./helper'),
    helper = require('../api/helper'),
    db = require('../api/db'),
    attendanceSessions = require('../api/data/attendanceSessions');

/**
 * Authenticate every request to the professor API against the DB
 * If successful, req.user will contain an object with the netID, studentNumber, firstName and lastName of the prof
 */ 
router.use(function(req, res, next) {
    var netID = req.cookies.netID;
    if (!netID) return routeHelper.sendError(res, null, 'Forbidden - No netID provided', 403);
    db.studentExists(netID, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error checking netID');
        if (results.length === 0) return routeHelper.sendError(res, null, 'Supplied student netID is not registered', 403);
        req.user = { 
            netID: results[0].sNetID,
            studentNumber: results[0].stdNum,
            firstName: results[0].fName,
            lastName: results[0].lName
        };
        next();
    });
});

// GET user info
router.get('/info', function(req, res, next) {
    res.json(req.user);
});

// Student sign in 
router.post('/sign-in/:code', function(req, res, next) {
    var code = req.params.code;
    if (!code || code.length != 5)
        return routeHelper.sendError(res, null, 'Invalid code format', 400);
    var session = attendanceSessions.getEntryByCode(code);
    if (!session) return routeHelper.sendError(res, null, 'Class not found for provided code', 404);
    db.isEnrolled(req.user.netID, session.classId, function(err, result) {
        if (err) return routeHelper.sendError(res, err, '');
        if (!result) return routeHelper.sendError(res, null, 'User not a member of the requested class', 403);
        db.recordAttendance(req.user.netID, session.classId, session.time, function(err, results, fields) {
            if (err) {
                if (err.errno && err.errno === 1062)
                    return routeHelper.sendError(res, err, 'Already signed in', 409);
                else
                    return routeHelper.sendError(res, err, 'Error recording attendance');
            } 
            res.send('Success');
        });
    });
});

// GET all classes associated with a specific student 
router.get('/classes', function(req, res, next) {
    db.getEnrolledClasses(req.user.netID, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error getting classes');
        res.json(results);
    }); 
});

module.exports = router;