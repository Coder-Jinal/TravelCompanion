const axios = require('axios');
const NodeCache = require('node-cache');

// Cache with TTL of 1 hour
const weatherCache = new NodeCache({ stdTTL: 3600 });

/**
 * Get weather data for a specific city
 * @param {string} city - City name
 * @returns {Promise<Object>} - Weather data object
 */
exports.getWeatherData = async (city) => {
  // Create a cache key
  const cacheKey = `weather-${city.toLowerCase()}`;
  
  // Check if data exists in cache
  const cachedWeather = weatherCache.get(cacheKey);
  if (cachedWeather) {
    console.log('Retrieved weather from cache');
    return cachedWeather;
  }
  
  try {
    const response = await axios.get(`${process.env.OPEN_WEATHER_API_URL}/weather`, {
      params: {
        q: city,
        appid: process.env.OPEN_WEATHER_API_KEY,
        units: 'metric'
      }
    });
    
    const weatherData = {
      city: response.data.name,
      country: response.data.sys.country,
      temperature: Math.round(response.data.main.temp),
      feelsLike: Math.round(response.data.main.feels_like),
      description: response.data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      pressure: response.data.main.pressure,
      sunrise: new Date(response.data.sys.sunrise * 1000).toLocaleTimeString(),
      sunset: new Date(response.data.sys.sunset * 1000).toLocaleTimeString(),
      datetime: new Date().toLocaleString(),
      // Create a 5-day "forecast" (API only gives current data, this is for demo)
      forecast: generateDemoForecast(response.data.main.temp)
    };
    
    // Store in cache
    weatherCache.set(cacheKey, weatherData);
    
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to retrieve weather information');
  }
};

/**
 * Generate a demo 5-day forecast based on current temperature
 * @param {number} currentTemp - Current temperature
 * @returns {Array} - Array of forecast objects
 */
function generateDemoForecast(currentTemp) {
  const forecast = [];
  const weatherConditions = ['clear sky', 'few clouds', 'scattered clouds', 'broken clouds', 'shower rain', 'rain', 'thunderstorm', 'mist'];
  const weatherIcons = ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '50d'];
  
  for (let i = 1; i <= 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Random variation in temperature (+/- 3 degrees)
    const tempMaxVariation = Math.floor(Math.random() * 7) - 3;
    const tempMinVariation = Math.floor(Math.random() * 7) - 3;
    const tempMax = Math.round(currentTemp + tempMaxVariation + 2);
    const tempMin = Math.round(currentTemp + tempMinVariation - 2);
    
    // Random weather condition
    const conditionIndex = Math.floor(Math.random() * weatherConditions.length);
    
    forecast.push({
      date: date.toLocaleDateString(),
      tempMax: tempMax,
      tempMin: tempMin,
      description: weatherConditions[conditionIndex],
      icon: `https://openweathermap.org/img/wn/${weatherIcons[conditionIndex]}@2x.png`
    });
  }
  
  return forecast;
}