var express = require('express');
var router = express.Router();
var helper = require('./helper');
var db = require('../api/db');
var prefix = 'professor';

router.get('/', function(req, res, next) {
  res.render(helper.getRenderName(prefix, 'index'));
});

router.post('/class/add', function(req, res, next) {
    db.addClass(req.body.code, req.body.name, req.body.defLocation, function(err, results, fields) {
        if (err) {
            console.log('Error adding class');
            throw err;
        } else {
            if (results || results[0]) {
                res.send(results);
            } else {
                console.log(`Error adding class ${req.body.code}`);
                res.send(500, { message: 'Error adding class', results: results });
            }
        }
    });
});

module.exports = router;
