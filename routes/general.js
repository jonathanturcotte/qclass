var express           = require('express'),
    router            = express.Router(),
    routeHelper       = require('./helper'),
    db                = require('../api/db'),
    passport          = require('passport'),
    ProfessorResponse = require('../models/professorResponse'),
    StudentResponse   = require('../models/studentResponse');

// GET user info
router.get('/user-info', passport.authenticate('saml'), function(req, res, next) {
    if (req.user.isProf) {
        db.getProfessor(req.user.netID, function(err, results, fields) {
            if (err)
                return routeHelper.sendError(res, err, 'Error checking netID');
            
            // Return professor if found
            if (results.length !== 0) 
                res.json(new ProfessorResponse(results[0].pNetID, results[0].fName, results[0].lName));            
            else { // No professor found - need to add new entry before responding
                db.addProfessor(req.user.netID, req.user.fName, req.user.lName, function (err, results, fields) {
                    if (err) return routeHelper.sendError(res, err, 'Error adding new professor');
                    res.json(new ProfessorResponse(req.user.netID, req.user.fName, req.user.lName));
                });
            }
        });
    } else { // user is student
        db.getStudent(req.user.netID, function(err, results, fields) {
            if (err)
                return routeHelper.sendError(res, err, 'Error checking netID');
            
            // Return student if found
            if (results.length !== 0)
                res.json(new StudentResponse(results[0].NetID, results[0].stdNum, results[0].fName, results[0].lName));
            else { // No student found - need to add new entry before responding
                db.addStudent(req.user.netID, req.user.stdNum, req.user.fName, req.user.lName, function (err, results, fields) {
                    if (err) return routeHelper.sendError(res, err, 'Error adding new student');
                    res.json(new StudentResponse(req.user.netID, req.user.stdNum, req.user.fName, req.user.lName));
                });
            }
        });
    } 
});

module.exports = router;
