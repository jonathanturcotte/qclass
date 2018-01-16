var express           = require('express'),
    router            = express.Router(),
    routeHelper       = require('./helper'),
    db                = require('../api/db'),
    ProfessorResponse = require('../models/professorResponse'),
    StudentResponse   = require('../models/studentResponse');

// GET user info
router.get('/user-info', function(req, res, next) {
    if (req.user.isProf) {
        db.getProfessor(req.user.netID, function(err, results, fields) {
            if (err)
                return routeHelper.sendError(res, err, 'Error checking netID');

            // Return professor if found
            if (results.length !== 0) {
                var result = results[0];

                // Respond with professor info if no difference is found between the authenticated user and the stored user, else update first
                if (req.user.fName === result.fName && req.user.lName === result.lName)
                    res.json(new ProfessorResponse(result.pNetID, result.fName, result.lName));
                else {
                    db.updateProfessor(req.user.netID, req.user.fName, req.user.lName, function (err, results, fields) {
                        if (err) return routeHelper.sendError(res, err, 'Error updating user');
                        res.json(new ProfessorResponse(rqe.user.netID, req.user.fName, req.user.lName));
                    });
                }
            } else { // No professor found - need to add new entry before responding
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
            if (results.length !== 0) {
                var result = results[0];

                // Respond with student info if no difference is found between the authenticated user and the stored user, else update first
                if (req.user.stdNum === result.stdNum && req.user.fName === result.fName && req.user.lName === result.lName)
                    res.json(new StudentResponse(result.sNetID, result.stdNum, result.fName, result.lName));
                else {
                    db.updateStudent(req.user.netID, req.user.stdNum, req.user.fName, req.user.lName, function (err, results, fields) {
                        if (err) return routeHelper.sendError(res, err, 'Error updating user');
                        res.json(new StudentResponse(req.user.netID, req.user.stdNum, req.user.fName, req.user.lName));
                    });
                }
            } else { // No student found - need to add new entry before responding
                db.addStudent(req.user.netID, req.user.stdNum, req.user.fName, req.user.lName, function (err, results, fields) {
                    if (err) return routeHelper.sendError(res, err, 'Error adding new student');
                    res.json(new StudentResponse(req.user.netID, req.user.stdNum, req.user.fName, req.user.lName));
                });
            }
        });
    }
});

module.exports = router;
