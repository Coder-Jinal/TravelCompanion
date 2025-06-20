const express = require('express');
const weatherController = require('./weather');
const router = express.Router();

// GET weather page with form
router.get('/', weatherController.getWeatherForm);

// GET weather forecast
router.get('/forecast', weatherController.getWeatherForecast);

module.exports = router;