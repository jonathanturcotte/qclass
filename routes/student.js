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
        db.studentExists(netId, function(err, result) {
            if (err)
                routeHelper.sendError(res, err, 'Error checking netID');
            else if (!result)
                routeHelper.sendError(res, null, 'Supplied student netID is not registered', 403);
            else 
                next();
        });
    }
};

// Studnet sign in 
router.post('/sign-in/:code', authenticate, function(req, res, next) {
    var code = req.params.code;
    if (!code || code.length != 5) 
        routeHelper.sendError(res, null, 'Invalid code', 422);
    var signInResult = attendanceSessions.signIn(code);
    if (signInResult.error) 
        routeHelper.sendError(res, null, signInResult.message, signInResult.error);
    res.send('Success');
});

// GET all classes associated with a specific student 
router.get('/classes', authenticate, function(req, res, next) {
    db.getEnrolledClasses(req.params.netId, function(err, results, fields) {
        if (err) 
            routeHelper.sendError(res, err, `Error getting classes for student ${studentId}`);
        else {
            for (var result in results) {
                result.defLocation = undefined;
            }
            res.json(results);
        }
    }); 
});

module.exports = router;