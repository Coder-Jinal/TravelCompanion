const weatherService = require('./weather_service');

exports.getWeatherForm = (req, res) => {
  res.render('weather/weather', {
    title: 'Weather Forecast',
    forecast: null
  });
};

exports.getWeatherForecast = async (req, res) => {
  try {
    const city = req.query.city;
    
    if (!city) {
      return res.render('weather/weather', {
        title: 'Weather Forecast',
        error: 'Please provide a city name'
      });
    }
    
    const forecast = await weatherService.getWeatherData(city);
    
    res.render('weather/weather', {
      title: `Weather Forecast for ${city}`,
      forecast,
      city
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.render('weather/weather', {
      title: 'Weather Forecast',
      error: `Error fetching weather data: ${error.message || 'Unknown error'}`
    });
  }
};