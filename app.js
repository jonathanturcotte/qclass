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
    checkins      = require('./api/data/attendanceSessions'),

    // Require our configuration options
    config        = require('./config.js'),

    // Setup SSL options, checking to see if the real certs exist
    // before falling back to our unsigned ones. This is so that
    // we can continue developing locally without having to change anything.
    sslOptions = {
        key:  fs.readFileSync(fs.existsSync(config.ssl.key)       ? config.ssl.key       : 'app.key'),
        cert: fs.readFileSync(fs.existsSync(config.ssl.fullchain) ? config.ssl.fullchain : 'app.crt')
    },

    // Require our routes and APIs
    auth         = require('./routes/auth'),
    general      = require('./routes/general'),
    professor    = require('./routes/professor'),
    student      = require('./routes/student'),
    db           = require('./api/db'),

    // Create the app and servers
    app          = express(),
    http         = http.createServer(app).listen(80),
    https        = https.createServer(sslOptions, app).listen(443);

// Setup and configure our authentication strategy
require('./sso/auth.js')(passport, config);

// Use Helmet to help cover some common header security issues
app.use(helmet(config.helmet));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'Whocansaywherethewindblows',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Force browsers not to store our webpage, even on back-button press
app.use(function (req, res, next) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, max-age=0');
    next();
});

// Always use the authentication middleware before considering any other routes
require('./routes/auth.js')(app, passport);

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

// Reset the attendance sessions upon server startup
checkins.sessionRecovery();

module.exports = app;
