require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require("dotenv");
const MongoStore = require('connect-mongo');

// Import routes
const flightRoutes = require('./components/flight/routes');
const weatherRoutes = require('./components/weather/routes');
const hotelRoutes = require('./components/hotel/routes');
const imageRoutes = require('./components/images/routes');
const tripOverviewRoutes = require('./components/trip_overview/routes');
const userRoutes = require('./components/user/routes');

// Connect to database
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware should come before res.locals
// app.use(session({
//   secret: process.env.SESSIONSECRET,
//   resave: false,
//   saveUninitialized: false,
//   store: MongoStore.create({
//     mongoUrl: `mongodb+srv://${process.env.DBUSER}:${process.env.DBPWD}@${process.env.DBHOST}/${process.env.DBNAME}`,
//     touchAfter: 24 * 3600 // lazy session update
//   }),
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     maxAge: 24 * 60 * 60 * 1000,
//     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
//   }
// }));

app.use(session({
  secret: process.env.SESSIONSECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: `mongodb+srv://${process.env.DBUSER}:${process.env.DBPWD}@${process.env.DBHOST}/${process.env.DBNAME}`
  }),
  cookie: {
    secure: true, // FORCE HTTPS (Render has this)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'none', // REQUIRED for cross-site cookies
  }
}));

app.set('trust proxy', 1);

// Set res.locals
// app.use((req, res, next) => {
//   res.locals.session = req.session;
//   next();
// });

app.use((req, res, next) => {
  // Make session user available to all templates
  res.locals.user = req.session.user || null;
  res.locals.isLoggedIn = !!req.session.user;
  
  // Debug logging
  console.log('=== MIDDLEWARE DEBUG ===');
  console.log('Session user exists:', !!req.session.user);
  console.log('res.locals.user set:', !!res.locals.user);
  console.log('res.locals.isLoggedIn:', res.locals.isLoggedIn);
  console.log('========================');
  
  next();
});


// Home route
app.get('/', (req, res) => {
  res.render('index', { title: 'Travel Explorer - Your Smart Travel Companion' });
});

// Static pages routes
app.get('/help-center', (req, res) => {
  res.render('static/help-center', { title: 'Help Center' });
});

app.get('/faqs', (req, res) => {
  res.render('static/faqs', { title: 'FAQs' });
});

app.get('/contact-us', (req, res) => {
  res.render('static/contact-us', { title: 'Contact Us' });
});

app.get('/privacy-policy', (req, res) => {
  res.render('static/privacy-policy', { title: 'Privacy Policy' });
});

app.get('/terms-of-service', (req, res) => {
  res.render('static/terms-of-service', { title: 'Terms of Service' });
});

// Use component routes
app.use('/flight', flightRoutes);
app.use('/weather', weatherRoutes);
app.use('/hotel', hotelRoutes);
app.use('/images', imageRoutes);
app.use('/trip-overview', tripOverviewRoutes);
app.use('/', tripOverviewRoutes);
app.use('/user', userRoutes);
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});