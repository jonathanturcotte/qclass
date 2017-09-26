var express = require('express');
var router = express.Router();
var helper = require('./helper');
var prefix = 'professor';

router.get('/', function(req, res, next) {
  res.render(helper.getRenderName(prefix, 'index'));
});

module.exports = router;
