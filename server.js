// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var app = express();
var port = process.env.PORT || 8091;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var expressValidator = require('express-validator');
var morgan = require('morgan');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var expresslayouts = require('express-ejs-layouts');
var mws = require('amazon-mws-node');
var roles = require('passport-local-roles');
var csv1 = require('csv');

//var env = require('./env');


var configDB = require('./config/database.js');

// configuration ===============================================================

mongoose.connect(configDB.url, { useMongoClient: true }); // connect to our database

require('./config/passport')(passport); // pass passport for configuration
app.set('view engine', 'ejs');
// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser());
//app.use(passport-local-roles());// get information from html forms
app.set('views', path.join(__dirname, 'views'));
app.use(expresslayouts);
app.use(express.static('public'));
app.use('/static', express.static(path.join(__dirname, 'public')));
// set up ejs for templating

// uncomment after placing your favicon in /public

//app.use(favicon(path.join(__dirname, 'public/', 'favicon.ico')));



// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session





// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
app.use('/products', require('./app/routes/products.js'));

app.use('/products', require('./app/routes/ebay_products.js'));




//var AuthController = require('../app/models/auth_controller.js')(app);
//app.use('/auth', AuthController);



// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);