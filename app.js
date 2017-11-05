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

    // Setup SSL options
    sslOptions = {
        key: fs.readFileSync('app.key'),
        cert: fs.readFileSync('app.cert')
    },

    // Require our routes and APIs
    professor    = require('./routes/professor'),
    student      = require('./routes/student'),
    db           = require('./api/db'),
    io           = require('./api/socket'),

    // Create the app and server
    app          = express();
    server       = https.createServer(sslOptions, app).listen(8443);

// Initialize the socketIO
app.io = io.initialize();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/professor', professor);
app.use('/student', student);

// Use Helmet to help cover any common security vulnerabilities
app.use(helmet());

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
