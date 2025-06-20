const express = require('express');
const flightController = require('./flight');
const router = express.Router();

// GET flight search form
router.get('/', flightController.getFlightSearchForm);

// POST flight search
router.post('/search', flightController.searchFlights);

module.exports = router;