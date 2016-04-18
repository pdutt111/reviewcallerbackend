var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var config= require('config');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var auth=require('./authentication/authentication');
var details=require('./authentication/detailsFetch');
var log = require('tracer').colorConsole(config.get('log'));
var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * middleware to authenticate the jwt and routes
 */

app.use(auth);
app.use(details);

/**
 * routes
 */
app.use('/api/v1/', routes);
app.use('/api/v1/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    //res.status(err.status || 500);
    //res.render('error', {
    //  message: err.message,
    //  error: err
    //});
    log.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message,
        error: err
      });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  //res.status(err.status || 500);
  //res.render('error', {
  //  message: err.message,
  //  error: {}
  //});
  log.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    error: ""
  });
});


module.exports = app;
