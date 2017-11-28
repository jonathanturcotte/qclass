var express     = require('express'),
    router      = express.Router(),
    routeHelper = require('./helper'),
    helper      = require('../api/helper'),
    db          = require('../api/db');

// GET user info
router.get('/info', function(req, res, next) {
    netID = req.cookies.netID;

    // As students should make up the majority of the users,
    // check if they're a student first
    db.studentExists(netID, function(err, results, fields) {
        if (err)
            return routeHelper.sendError(res, err, 'Error checking netID');
        if (results.length !== 0) {
            res.status(200).json({
                netID: results[0].NetID,
                firstName: results[0].fName,
                lastName: results[0].lName,
                isProf: false
             });
        } else {
            // Otherwise check if they're a prof
            db.profExists(netID, function(err, results, fields) {
                if (err)
                    return routeHelper.sendError(res, err, 'Error checking netID');
                if (results.length !== 0) {
                    res.status(200).json({
                        netID: results[0].pNetID,
                        firstName: results[0].fName,
                        lastName: results[0].lName,
                        isProf: true
                     });
                } else {
                    res.status(403).send("NetID not found: " + netID);
                }
            });
        }
    });
});

module.exports = router;