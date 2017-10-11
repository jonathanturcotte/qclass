var express = require('express');
var router = express.Router();
var routeHelper = require('./helper');
var helper = require('../api/helper');
var db = require('../api/db');

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

// GET all classes associated with a specific student 
router.get('/classes', authenticate, function(req, res, next) {
    var netId = req.cookies.netId; 
    if (!netId) 
        res.status(403).send('Net ID required');
    else {
        db.getEnrolledClasses(netId, function(err, results, fields) {
            if (err) 
                routeHelper.sendError(res, err, `Error getting classes for student ${studentId}`);
            else {
                for (var result in results) {
                    result.regNum = undefined;
                    result.defLocation = undefined;
                }
                res.json(results);
            }
        }); 
    }
});

router.get('/class/:classId', authenticate, function(req, res, next, id) {
    if (routeHelper.paramRegex(res, req.params.classId, routeHelper.regex.classId, 'classId must be a valid token')) {
        var netId = req.cookies.netId;
        db.isEnrolled(netId, classId, function(err, result) {
            if (err) 
                routeHelper.sendError(res, err, `Error checking enrollment`);
            else {
                // TODO: Check class and lecture state, notify app of activity state
                var results;
                if (Math.random() < 0.2) {
                    results = { 
                        isActive: true, 
                        lecture: {
                            lecNum: helper.randomInt(0, 10),
                            eTime: Date.now(),
                            location: 'here'
                        }
                     }
                } else {                
                    results = { isActive: false };
                }
                res.json(results);
            }
        });
    } else return;
});

module.exports = router;