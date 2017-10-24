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