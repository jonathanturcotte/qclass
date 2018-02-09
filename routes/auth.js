module.exports = function (app, config, passport){
    app.get('/login',
        passport.authenticate('saml', {successRedirect: '/', failureRedirect: '/login'})
    );

    app.post('/login/callback',
        passport.authenticate('saml', { successRedirect: '/', failureRedirect: '/login' })
    );

    app.get('/Shibboleth.sso/Metadata', function (req, res) {
        res.type('application/samlmetadata+xml');
        res.send(passport._strategy('saml').generateServiceProviderMetadata(config.ssl.cert));
    });

    // Enforce authentication for the main page
    // We only need to use res.redirect here
    app.all('/', function(req, res, next){
        if (!req.isAuthenticated()){
            //TODO: Use real logging function when implemented
            console.log(req.connection.remoteAddress + ": Not logged in, redirecting to SSO");
            res.redirect('/login');
        } else {
            next();
        }
    });

    // Enforce authentication for all other requests
    // This covers all the AJAX requests, we return 200 but send a JSON
    // object that the client will receive and use to redirect.
    app.all('*', function(req, res, next){
        if (!req.isAuthenticated()){
            //TODO: Use real logging function when implemented
            console.log(req.connection.remoteAddress + ": Not logged in, redirecting to SSO");
            res.json({ redirect: '/login' });
        } else {
            next();
        }
    });

    app.get('/logout', function (req, res) {
        //TODO: Use real logging function when implemented
        console.log(req.connection.remoteAddress + ": Logging out");
        console.log(req.user);
        passport._strategy('saml').logout(req, function (err, request){
            if(!err) {
                req.logout();
                res.redirect(request);
            } else {
                console.log("Error in logout: " + err);
            }
        })
    });

    // Not needed at the moment, unless we find a way to let the idp iframe
    // manually log out of our shibboleth sp.
    app.post('/logout/callback', function (req, res){
        if (req.isAuthenticated()) {
            //TODO: Use real logging function when implemented
            console.log("logout callback");
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    });
};
