/*Libraries
1. General libraries
*/
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressValidator = require("express-validator");

//1.1 Authentification Libraries

var session = require('express-session');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');

// Routing

var indexRouter = require('./routes/index');

var app = express();

require("dotenv").config();

// Engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


let sessionStore;

const MySQLStore = require('express-mysql-session')(session);

sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
})

app.use('/', indexRouter);



passport.use(new LocalStrategy((username, password, done) => {
  const db = require("./db");
  const params = [username];

  db.all('SELECT id, password FROM users WHERE username = ?', params, (err, results, fields) => {
    if (err) {
      return done(err);
    }

    if (results.length === 0) {
      return done(null, false);
    } else {
      const hash = results[0].password.toString();
      
      bcrypt.compare(password, hash, (err, response) => {
        if (response === true) {
          return done(null, { user_id: results[0].id });
        } else {
          return done(null, false);
        }
      });
    }
  });
}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//Handlebars

var hbs = require('hbs');
hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper("json", function(context) {
  return JSON.stringify(context, null, 2);
});

module.exports = app;
