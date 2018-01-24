module.exports = function (app, passport){
    app.get('/login',
        passport.authenticate('saml', {successRedirect: '/', failureRedirect: '/login'})
    );

    app.post('/login/callback',
        passport.authenticate('saml', { successRedirect: '/', failureRedirect: '/login' })
    );

    // Enforce authentication for all other requests
    // Every request from this point on will require authentication
    app.all('*', function(req, res, next){
        if (!req.isAuthenticated()){
            //TODO: Make this work for AJAX requests that don't
            //respect res.redirect
            //TODO: Use real logging function when implemented
            console.log(req.connection.remoteAddress + ": Not logged in, redirecting to SSO");
            res.redirect('/login');
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

    app.post('/logout/callback', function (req, res){
        //TODO: Use real logging function when implemented
        console.log("logout callback");
        //req.logout();
        res.redirect('/');
    });
};
