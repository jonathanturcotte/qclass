var express     = require('express'),
    router      = express.Router(),
    routeHelper = require('./helper'),
    helper      = require('../api/helper'),
    db          = require('../api/db');

// GET user info
router.get('/user-info', function(req, res, next) {
    // As students should make up the majority of the users,
    // check if they're a student first
    db.studentExists(req.user.netID, function(err, results, fields) {
        if (err)
            return routeHelper.sendError(res, err, 'Error checking netID');
        if (results.length !== 0) {
            res.json({
                netID: results[0].NetID,
                firstName: results[0].fName,
                lastName: results[0].lName,
                stdNum: results[0].stdNum,
                isProf: false
             });
        } else {
            // Otherwise check if they're a prof
            db.profExists(req.user.netID, function(err, results, fields) {
                if (err)
                    return routeHelper.sendError(res, err, 'Error checking netID');
                if (results.length !== 0) {
                    res.json({
                        netID: results[0].pNetID,
                        firstName: results[0].fName,
                        lastName: results[0].lName,
                        isProf: true
                     });
                } else {
                    res.status(403).send("NetID not found: " + req.user.netID);
                }
            });
        }
    });
});

module.exports = router;