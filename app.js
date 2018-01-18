var express       = require('express'),
    path          = require('path'),
    http          = require('http'),
    https         = require('https'),
    fs            = require('fs'),
    favicon       = require('serve-favicon'),
    logger        = require('morgan'),
    cookieParser  = require('cookie-parser'),
    bodyParser    = require('body-parser'),
    helmet        = require('helmet'),
    csv           = require('express-csv'),
    session       = require('express-session'),
    passport      = require('passport'),
    SamlStrategy  = require('passport-saml').Strategy,

    keyPath       = '/etc/letsencrypt/live/qclass.ca/privkey.pem',
    certPath      = '/etc/letsencrypt/live/qclass.ca/cert.pem',
    fullChainPath = '/etc/letsencrypt/live/qclass.ca/fullchain.pem',

    // Setup SSL options, checking to see if the real certs exist
    // before falling back to our unsigned ones. This is so that
    // we can continue developing locally without having to change anything.
    sslOptions = {
        key:  fs.readFileSync(fs.existsSync(keyPath)       ? keyPath       : 'app.key'),
        cert: fs.readFileSync(fs.existsSync(fullChainPath) ? fullChainPath : 'app.crt')
    },

    // Require our routes and APIs
    professor    = require('./routes/professor'),
    student      = require('./routes/student'),
    general      = require('./routes/general'),
    db           = require('./api/db'),
    io           = require('./api/socket'),

    // Create the app and servers
    app          = express(),
    http         = http.createServer(app).listen(80),
    https        = https.createServer(sslOptions, app).listen(443);

// Use Helmet to help cover some common header security issues
app.use(helmet({
    referrerPolicy: { policy: 'no-referrer' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'",
                'data:',
                'https://idptest.queensu.ca',           // IdP for SSO
                'https://code.jquery.com',              // jQuery
                'https://cdnjs.cloudflare.com',         // Popper (Bootstrap), Toastr, Underscore
                'https://maxcdn.bootstrapcdn.com',      // Bootstrap
                'https://use.fontawesome.com'],         // Font Awesome
            styleSrc: ["'self'",
                "'unsafe-inline'",
                'https://maxcdn.bootstrapcdn.com',      // Bootstrap
                'https://cdnjs.cloudflare.com'],        // Toastr
            imgSrc: ["'self'", 'data:']
        },
        frameguard: {
            action: 'allow-from',
            domain: 'https://idptest.queensu.ca'
        }
    }
}));

// TODO: Add favicon
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'Whocansaywherethewindblows',
    resave: true,
    saveUninitialized: true
 }));

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(user, done){
    done(null, user);
});

// TODO: Somehow skip this for localhost testing
// see: https://stackoverflow.com/questions/24419814/passport-saml-and-saml-encryption
var passportStrat = new SamlStrategy({
        callbackUrl      : 'https://qclass.ca/login/callback',                          // The login callback
        logoutCallbackUrl: 'https://qclass.ca/logout/callback',                         // Logout callback
        entryPoint       : 'https://idptest.queensu.ca/idp/profile/SAML2/Redirect/SSO', // location of IDP
        logoutUrl        : 'https://idptest.queensu.ca/idp/profile/Logout',             // URL for logging out on the IDP
        issuer           : 'https://qclass.ca',                                         // The identifier for our SP
        identifierFormat : '',                                                          // The requested format, for ITS we don't need it
        cert             : fs.readFileSync('sso/idp.crt', 'utf8'),                      // X509 cert for the idp, needs to be all on one line
        decryptionPvk    : fs.readFileSync(keyPath, 'utf8')                             // Our private key
    }, function (profile, done) {
        console.log("Logged in as: " + profile['email']);

        // Construct the user from the profile information
        var user = {
            netID      : '1pvb69', //profile['email'].split('@')[0], // NetID
            studentNum : '10048466', //profile[''],                    // Student number
            fName      : profile['urn:oid:2.5.4.42'],    // First name
            lName      : profile['urn:oid:2.5.4.4'],     // Last name
            email      : profile['email'],               // Email
            isProf     : true,                           // isProfessor
            nameID     : profile['nameID'],              // NameID - needed for logout
            nameIDFormat : profile['nameIDFormat']       // NameIDFormat - needed for logout
        };

        // Check user against the database
        validateUser(user, function (err) {
            if (err) return done(err);
            return done(null, user);
        });
    }
);

var cert = fs.readFileSync(certPath, 'utf8');
var res = passportStrat.generateServiceProviderMetadata(cert);
fs.writeFileSync('sso/sp-metadata.xml', res);
passport.use(passportStrat);
app.use(passport.initialize());
app.use(passport.session());

// Handle logging in through SSO
app.get('/login', passport.authenticate('saml', {successRedirect: '/', failureRedirect: '/login/fail'}));
app.post('/login/callback', passport.authenticate('saml', { successRedirect: '/', failureRedirect: '/login/fail' }));
app.get('/login/fail', function(req, res) {
    res.send(401, 'Login failed');
});

// Enforce authentication for all other requests
// Must remain above the other routes/middlewares to force
// authentication for all the subsequent ones
app.all('*', function(req, res, next){
    if (!req.isAuthenticated()){
        console.log("Not logged in, redirecting to SSO");
        res.redirect('/login');
    } else {
        next();
    }
});

// Handle logout
app.post('/logout', function (req, res) {
    console.log("logging out");
    console.log(req.user);
    passportStrat.logout(req, function (err, request){
        if(!err) { res.redirect(request); }
    })
});

app.post('/logout/callback', function (req, res){
    console.log("logout callback");
    req.logout();
    //res.redirect('/');
});

// Serve the static pages
app.use(express.static(path.join(__dirname, 'public')));

// Our routes
app.use('/', general);
app.use('/student', student);
app.use('/professor', professor);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json(err);
});

module.exports = app;

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
