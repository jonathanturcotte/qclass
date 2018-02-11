var SamlStrategy = require('passport-saml').Strategy,
    fs           = require('fs'),
    db           = require('../api/db'),
    async        = require('async'),
    EnrollStudent = require('../models/enrollStudent');

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
        var fName   = profile['urn:oid:2.5.4.42'],
            lName   = profile['urn:oid:2.5.4.4'],
            shouldContinue = true,
            user = {
                netID        : '',
                studentNum   : genRandomStdNum(),
                fName        : fName,                  // First name
                lName        : lName,                  // Last name
                email        : profile['email'],       // Email
                isProf       : false,                  // isProfessor
                nameID       : profile['nameID'],      // NameID - needed for logout
                nameIDFormat : profile['nameIDFormat'] // NameIDFormat - needed for logout
            };

        if(user.fName === 'Jonathan' && user.lName === 'Turcotte'){
            //user.netID = '12hdm';
            user.netID  = '1pvb69';
            user.isProf = true;
            shouldContinue = false;
        }

        if (user.fName === 'Curtis' && user.lName === 'Demerah'){
            //user.netID = '12hdm';
            user.netID  = '1pvb69';
            user.isProf = true;
            shouldContinue = false;
        }

        async.whilst(
            function () { return shouldContinue; },
            function (callback) {
                // Ensure generated netID isn't jon or curtis
                do {
                    user.netID = genRandomNetID(fName, lName);
                } while (user.netID === '11jlt10' || user.netID === '12cjd2');

                // Check if netID exists
                db.studentExists(user.netID, function (err, results) {
                    if (err) return callback(err);
                    if (results.length === 0) {
                        db.addStudent(user.netID, user.studentNum, user.fName, user.lName, function (err, results) {
                            if (err) return callback(err);

                            db.enroll('boo49eb2-0630-4382-98b5-moofd40627b8', [new EnrollStudent({
                                netID:     user.netID,
                                stdNum:    user.studentNum,
                                firstName: user.fName,
                                lastName:  user.lName
                            })], function (err, results) {
                                if (err) return callback(err);
                                db.getDemoRunningSessions_demo('boo49eb2-0630-4382-98b5-moofd40627b8', function(err, results) {
                                    if (err) return callback(err);
                                    if (results) {
                                        db.addStudentToSession_demo('boo49eb2-0630-4382-98b5-moofd40627b8', results[0].attTime, user.netID, function (err) {
                                            if (err) return callback(err);
                                            shouldContinue = false;
                                            callback();
                                        });
                                    } else {
                                        shouldContinue = false;
                                        callback();
                                    }
                                });
                               
                            });
                        });
                    } else return callback();
                }) 
            },
            function (err) {
                if (err) return done(err);

                // Check user against the database
                validateUser(user, function (err) {
                    if (err) return done(err);
                    return done(null, user);
                });
            }
        );
    }));
};

/** Random digit (0-9) */
function genRandomDigit() {
    return Math.floor(Math.random() * 10); 
}

function genRandomNetID(firstName, lastName) {
    return '' + genRandomDigit() + genRandomDigit() + (firstName || 'a')[0].toLowerCase() + (lastName || 'a')[0].toLowerCase() + genRandomDigit();
}

function genRandomStdNum() {
    var max = 99999999, 
        min = 10000000,
        num = Math.floor(Math.random() * (max - min + 1)) + min;
    return '' + num;
}

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

