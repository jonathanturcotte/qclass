var express      = require('express'),
    path         = require('path'),
    http         = require('http'),
    https        = require('https'),
    fs           = require('fs'),
    favicon      = require('serve-favicon'),
    logger       = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser   = require('body-parser'),
    helmet       = require('helmet'),
    csv          = require('express-csv'),
    auth         = require('./api/auth'),
    sessions     = require('./api/data/attendanceSessions'),

    keyPath      = '/etc/letsencrypt/live/qclass.ca/privkey.pem',
    certPath     = '/etc/letsencrypt/live/qclass.ca/fullchain.pem',

    // Setup SSL options, checking to see if the real certs exist
    // before falling back to our unsigned ones. This is so that
    // we can continue developing locally without having to change anything.
    sslOptions = {
        key:  fs.readFileSync(fs.existsSync(keyPath)  ? keyPath  : 'app.key'),
        cert: fs.readFileSync(fs.existsSync(certPath) ? certPath : 'app.cert')
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
                'https://code.jquery.com',              // jQuery
                'https://cdnjs.cloudflare.com',         // Popper (Bootstrap), Toastr, Underscore
                'https://maxcdn.bootstrapcdn.com',      // Bootstrap
                'https://use.fontawesome.com'],         // Font Awesome
            styleSrc: ["'self'",
                "'unsafe-inline'",
                'https://maxcdn.bootstrapcdn.com',      // Bootstrap
                'https://cdnjs.cloudflare.com'],        // Toastr
            imgSrc: ["'self'", 'data:']
        }
    }
}));

// Initialize the socketIO
app.io = io.initialize();

// Ensure that all traffic is being routed through https
app.all('*', function (req, res, next) {
    if (req.secure)
        return next();
    else
        res.redirect('https://' + req.hostname + req.url);
});

// TODO: Add favicon
app.use(favicon(path.join(__dirname, 'public', 'images', 'QC.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(auth.authenticate); // Run authentication first when any route is called
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

// Reset the sessions upon server startup
sessions.sessionRecovery();

module.exports = app;
