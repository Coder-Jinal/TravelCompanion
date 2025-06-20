const express = require('express');
const hotelController = require('./hotel');
const router = express.Router();

// GET hotel search form
router.get('/', hotelController.getHotelSearchForm);

// POST hotel search
router.post('/search', hotelController.searchHotels);

module.exports = router;