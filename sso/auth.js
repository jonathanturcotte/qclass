var SamlStrategy = require('passport-saml').Strategy,
    fs           = require('fs'),
    db           = require('../api/db');

module.exports = function (passport, config) {
    passport.serializeUser(function(user, done){
        done(null, user);
    });

    passport.deserializeUser(function(user, done){
        done(null, user);
    });

    passport.use(new SamlStrategy({
        entryPoint        : config.sso.loginURL,                         // The location of IDP
        callbackUrl       : config.sso.loginCallback,                    // The login callback
        logoutUrl         : config.sso.logoutURL,                        // URL for logging out on the IDP
        logoutCallbackUrl : config.sso.logoutCallback,                   // Logout callback
        issuer            : config.sso.issuer,                           // The identifier for our SP
        identifierFormat  : '',                                          // The requested format, for ITS we don't need it
        cert              : config.sso.idpCert,                          // X509 cert for the idp, needs to be all on one line
        decryptionPvk     : config.ssl.key                               // Our SSL private key
    }, function (profile, done){
        //TODO: Use actual logging functionality when it's available
        console.log("Logged in as: " + profile['email']);

        // Construct the user from the profile information
        var user = {
            // Stubbed for testing
            netID        : '1pvb69',
            studentNum   : '10048466',
            //netID      : profile['email'].split('@')[0], // NetID
            //studentNum : profile[''],                    // Student number
            fName        : profile['urn:oid:2.5.4.42'],    // First name
            lName        : profile['urn:oid:2.5.4.4'],     // Last name
            email        : profile['email'],               // Email
            isProf       : true,                           // isProfessor
            nameID       : profile['nameID'],              // NameID - needed for logout
            nameIDFormat : profile['nameIDFormat']         // NameIDFormat - needed for logout
        };

        // Check user against the database
        validateUser(user, function (err) {
            if (err) return done(err);
            return done(null, user);
        });
    }));
};

function validateUser(user, callback) {
    if (user.isProf) {
        db.getProfessor(user.netID, function(err, results, fields) {
            if (err) return callback(new Error('Error checking netID'));

            // Return professor if found
            if (results.length !== 0) {
                var result = results[0];

                // Respond with professor info if no difference is found between the authenticated user and the stored user, else update first
                if (user.fName === result.fName && user.lName === result.lName)
                    callback();
                else {
                    db.updateProfessor(user.netID, user.fName, user.lName, function (err, results, fields) {
                        if (err) return callback(new Error('Error updating user'));
                        callback();
                    });
                }
            } else { // No professor found - need to add new entry before responding
                db.addProfessor(user.netID, user.fName, user.lName, function (err, results, fields) {
                    if (err) return callback(new Error('Error adding new professor'));
                    callback();
                });
            }
        });
    } else { // user is student
        db.getStudent(user.netID, function(err, results, fields) {
            if (err) return callback(new Error('Error checking netID'));

            // Return student if found
            if (results.length !== 0) {
                var result = results[0];

                // Respond with student info if no difference is found between the authenticated user and the stored user, else update first
                if (user.studentNum === result.studentNum && user.fName === result.fName && user.lName === result.lName)
                    callback();
                else {
                    db.updateStudent(user.netID, user.studentNum, user.fName, user.lName, function (err, results, fields) {
                        if (err) return callback(new Error('Error updating user'));
                        callback();
                    });
                }
            } else { // No student found - need to add new entry before responding
                db.addStudent(user.netID, user.studentNum, user.fName, user.lName, function (err, results, fields) {
                    if (err) return callback(new Error('Error adding new student'));
                    callback();
                });
            }
        });
    }
}

