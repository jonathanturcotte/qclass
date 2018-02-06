var express            = require('express'),
    router             = express.Router(),
    db                 = require('../api/db'),
    routeHelper        = require('./helper'),
    attendanceSessions = require('../api/data/attendanceSessions');

// Authenticate every request to the professor API against the DB
router.use(function(req, res, next) {
    db.studentExists(req.user.netID, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error checking netID');
        if (results.length === 0) return routeHelper.sendError(res, null, 'Supplied student netID is not registered', 403);
        next();
    });
});

// GET user info
router.get('/info', function(req, res, next) {
    res.json(req.user);
});

// Student sign in
router.post('/sign-in/:code', function(req, res, next) {
    var code = req.params.code,
        session;

    if (!code || code.length != 5)
        return routeHelper.sendError(res, null, 'Invalid code format', 400);

    session = attendanceSessions.getEntryByCode(code);

    if (!session)
        return routeHelper.sendError(res, null, 'Class not found for provided code', 404);

    db.isEnrolled(req.user.netID, session.classID, function(err, result) {
        if (err) return routeHelper.sendError(res, err, '');
        if (!result) return routeHelper.sendError(res, null, 'User not a member of the requested class', 403);

        db.recordAttendance(req.user.netID, session.classID, session.time, function(err, results, fields) {
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
