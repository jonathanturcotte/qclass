var express           = require('express'),
    router            = express.Router(),
    routeHelper       = require('./helper'),
    db                = require('../api/db'),
    ProfessorResponse = require('../models/professorResponse'),
    StudentResponse   = require('../models/studentResponse');

// GET user info
router.get('/user-info', function(req, res, next) {
    if (req.user.isProf)
        res.json(new ProfessorResponse(req.user.netID, req.user.fName, req.user.lName));
    else
        res.json(new StudentResponse(req.user.sNetID, req.user.stdNum, req.user.fName, req.user.lName));
});

module.exports = router;
