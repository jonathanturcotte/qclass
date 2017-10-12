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

router.get('/class/:classId', authenticate, function(req, res, next) {
    if (routeHelper.paramRegex(res, req.params.classId, routeHelper.regex.classId, 'classId must be a valid token')) {
        var netId = req.cookies.netId;
        db.isEnrolled(netId, req.params.classId, function(err, result) {
            if (err) 
                routeHelper.sendError(res, err, `Error checking enrollment`);
            else {
                db.getActiveLecture(req.params.classId, function(err, lecture, fields) {
                    if (err)
                        routeHelper.sendError(res, err, `Error getting active lecture for student ${studentId}`);
                    else {
                        var json;
                        if (lecture) {
                            json = { 
                                isActive: true, 
                                lecture: {
                                    number: lecture.lecNum,
                                    endTime: lecture.eTime,
                                    location: lecture.location
                                } 
                            };
                        } else {
                            json = { isActive: false };
                        }
                        res.json(json);
                    }
                });
            }
        });
    } else return;
});

module.exports = router;