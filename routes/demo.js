var express = require('express');
var router = express.Router();
var helper = require('./helper');
var prefix = 'demo';

router.get('/', function(req, res, next) {
    res.render(helper.getRenderName(prefix, 'index'));
});

router.get('/time', function(req, res) {
    res.render(helper.getRenderName(prefix, 'time'), { time: Date.now() });
});

router.get('/sockets', function(req, res) {
    res.render(helper.getRenderName(prefix, 'sockets'));
});

module.exports = router;
