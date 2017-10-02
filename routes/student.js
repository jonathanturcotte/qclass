var express = require('express');
var router = express.Router();
var helper = require('./helper');
var db = require('../api/db');
//TODO: Add authentication for all student methods

// GET all classes associated with a specific student 
router.get('/classes', function(req, res, next) {
    var netId = req.cookies.netId; 
    if (!netId) res.send(403, 'Net ID required');
    db.getClasses(netId, function(err, results, fields) {
        if (err) helper.sendError(res, err, `Error getting classes for student ${studentId}`);
        for (var result in results) {
            result.regNum = undefined;
            result.defLocation = undefined;
        }
        res.json(results);
    }); 
});

router.get('/class/:classId', function(req, res, next, id) {
    if (helper.paramRegex(res, req.params.classId, helper.regex.classId, 'classId must be a valid token')) {
        //TODO: Implement
    } else return;
});

module.exports = router;