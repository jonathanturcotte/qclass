var express     = require('express'),
    router      = express.Router(),
    routeHelper = require('./helper'),
    db          = require('../api/db'),
    passport    = require('passport');

router.post('/login/callback', 
    passport.authenticate('saml', { failureRedirect: '' }), // Set failure redirect to something that makes sense
    function (req, res, next) {
        console.log('Login callback');
        res.redirect('/');
    }
);

router.post('/logout/callback', function (req, res, next) {
    req.logout();
    res.redirect('/'); // Not sure where to redirect to
});

// GET user info
router.get('/user-info', passport.authenticate('saml'), function(req, res, next) {
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
