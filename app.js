/*Libraries
1. General libraries
*/
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
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

//i18n

var i18n = require("i18n");

i18n.configure({
  locales:['en', 'es'],
  cookie: 'locale',
  directory: __dirname + '/locales',
  cookie : 'lenguaje',
});

app.use(i18n.init);



let sessionStore;

const MySQLStore = require('express-mysql-session')(session);

sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  expiration: 3600000,
  checkExpirationInterval: 900000
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



passport.use(new LocalStrategy({
    usernameField: 'usuario',
    passwordField: 'clave'
  },
  (usuario, clave, done) => {
  const db = require("./db");
  const params = [usuario];

  db.query('SELECT u_consecutivo,u_clave FROM Usuario WHERE u_usuario = ?', params, (err, results) => {

    if (err) {
      return done(err);
    }

    if (results.length === 0) {
      return done(null, false);
    } else {
      const hash = results[0].u_clave.toString();
      bcrypt.compare(clave, hash, (err, response) => {
        if (response === true)
          return done(null,  results[0].u_consecutivo );
        else
          return done(null, false);
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

hbs.registerHelper('__', function () {
  return i18n.__.apply(this, arguments);
});
hbs.registerHelper('__n', function () {
  return i18n.__n.apply(this, arguments);
});


module.exports = app;
