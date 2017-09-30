var express = require('express');
var router = express.Router();
var db = require('../api/db');
//TODO: Add authentication for all student methods

// GET all classes associated with a specific student 
router.get('/classes', function(req, res, next) {
    //TODO: SQL query for classes 
    var classes = ['class1', 'class2']; 
    res.json(classes);
});

router.param('classId', function(req, res, next, classId) {
    // parameter logic
});

router.get('/class/:classId', function(req, res, next) {
    
});

module.exports = router;
