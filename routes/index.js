var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/time', function(req, res) {
    res.render('time', { time: Date.now() });
});

router.get('/sockets', function(req, res) {
    res.render('sockets');
});

module.exports = router;
