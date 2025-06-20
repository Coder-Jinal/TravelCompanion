const axios = require('axios');
const NodeCache = require('node-cache');

// Cache with TTL of 1 hour
const flightCache = new NodeCache({ stdTTL: 3600 });

// Comprehensive city and airport data
const AIRPORT_DATA = {
  'NYC': { name: 'John F. Kennedy International Airport', city: 'New York', timezone: -5, majorHub: true },
  'JFK': { name: 'John F. Kennedy International Airport', city: 'New York', timezone: -5, majorHub: true },
  'LGA': { name: 'LaGuardia Airport', city: 'New York', timezone: -5, majorHub: false },
  'EWR': { name: 'Newark Liberty International Airport', city: 'Newark', timezone: -5, majorHub: true },
  'LAX': { name: 'Los Angeles International Airport', city: 'Los Angeles', timezone: -8, majorHub: true },
  'SFO': { name: 'San Francisco International Airport', city: 'San Francisco', timezone: -8, majorHub: true },
  'ORD': { name: 'O\'Hare International Airport', city: 'Chicago', timezone: -6, majorHub: true },
  'MDW': { name: 'Chicago Midway International Airport', city: 'Chicago', timezone: -6, majorHub: false },
  'MIA': { name: 'Miami International Airport', city: 'Miami', timezone: -5, majorHub: true },
  'DFW': { name: 'Dallas/Fort Worth International Airport', city: 'Dallas', timezone: -6, majorHub: true },
  'DEN': { name: 'Denver International Airport', city: 'Denver', timezone: -7, majorHub: true },
  'ATL': { name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', timezone: -5, majorHub: true },
  'BOS': { name: 'Logan International Airport', city: 'Boston', timezone: -5, majorHub: true },
  'SEA': { name: 'Seattle-Tacoma International Airport', city: 'Seattle', timezone: -8, majorHub: true },
  'LAS': { name: 'McCarran International Airport', city: 'Las Vegas', timezone: -8, majorHub: false },
  'PHX': { name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', timezone: -7, majorHub: true },
  'IAH': { name: 'George Bush Intercontinental Airport', city: 'Houston', timezone: -6, majorHub: true },
  'MCO': { name: 'Orlando International Airport', city: 'Orlando', timezone: -5, majorHub: true },
  'MSP': { name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', timezone: -6, majorHub: true },
  'DTW': { name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', timezone: -5, majorHub: true },
  'PHL': { name: 'Philadelphia International Airport', city: 'Philadelphia', timezone: -5, majorHub: true },
  'LHR': { name: 'Heathrow Airport', city: 'London', timezone: 0, majorHub: true },
  'CDG': { name: 'Charles de Gaulle Airport', city: 'Paris', timezone: 1, majorHub: true },
  'FRA': { name: 'Frankfurt Airport', city: 'Frankfurt', timezone: 1, majorHub: true },
  'AMS': { name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', timezone: 1, majorHub: true },
  'DXB': { name: 'Dubai International Airport', city: 'Dubai', timezone: 4, majorHub: true },
  'NRT': { name: 'Narita International Airport', city: 'Tokyo', timezone: 9, majorHub: true },
  'HND': { name: 'Haneda Airport', city: 'Tokyo', timezone: 9, majorHub: true },
  'ICN': { name: 'Incheon International Airport', city: 'Seoul', timezone: 9, majorHub: true },
  'SIN': { name: 'Singapore Changi Airport', city: 'Singapore', timezone: 8, majorHub: true },
  'YYZ': { name: 'Toronto Pearson International Airport', city: 'Toronto', timezone: -5, majorHub: true },
  'YVR': { name: 'Vancouver International Airport', city: 'Vancouver', timezone: -8, majorHub: true }
};

// Route-specific airline preferences and typical flight characteristics
const ROUTE_CHARACTERISTICS = {
  // Domestic US routes
  'domestic_short': {
    airlines: ['Southwest', 'JetBlue', 'Alaska Airlines', 'Spirit', 'Frontier'],
    codes: ['WN', 'B6', 'AS', 'NK', 'F9'],
    duration: { min: 1, max: 3 },
    priceRange: { min: 89, max: 299 },
    frequency: 'high'
  },
  'domestic_medium': {
    airlines: ['American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue'],
    codes: ['AA', 'DL', 'UA', 'WN', 'B6'],
    duration: { min: 3, max: 5 },
    priceRange: { min: 159, max: 459 },
    frequency: 'high'
  },
  'domestic_long': {
    airlines: ['American Airlines', 'Delta', 'United', 'Alaska Airlines'],
    codes: ['AA', 'DL', 'UA', 'AS'],
    duration: { min: 5, max: 7 },
    priceRange: { min: 249, max: 699 },
    frequency: 'medium'
  },
  // International routes
  'transatlantic': {
    airlines: ['British Airways', 'Virgin Atlantic', 'American Airlines', 'Delta', 'United', 'Lufthansa'],
    codes: ['BA', 'VS', 'AA', 'DL', 'UA', 'LH'],
    duration: { min: 6, max: 9 },
    priceRange: { min: 399, max: 1299 },
    frequency: 'medium'
  },
  'transpacific': {
    airlines: ['United', 'American Airlines', 'Delta', 'ANA', 'JAL', 'Singapore Airlines'],
    codes: ['UA', 'AA', 'DL', 'NH', 'JL', 'SQ'],
    duration: { min: 10, max: 16 },
    priceRange: { min: 599, max: 1899 },
    frequency: 'low'
  },
  'international_short': {
    airlines: ['Air Canada', 'American Airlines', 'Delta', 'United', 'WestJet'],
    codes: ['AC', 'AA', 'DL', 'UA', 'WS'],
    duration: { min: 1, max: 4 },
    priceRange: { min: 149, max: 499 },
    frequency: 'medium'
  }
};

// Booking Link Generator Class
class BookingLinkGenerator {
  static generateFlightExpediaLink(origin, destination, date) {
    const baseUrl = 'https://www.expedia.com/Flights-Search';
    const params = new URLSearchParams({
      mode: 'search',
      originPlace: origin.toUpperCase(),
      destinationPlace: destination.toUpperCase(),
      departDate: date,
      adults: '1',
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  static generateFlightSkyscannerLink(origin, destination, date) {
    const formattedOrigin = origin.toUpperCase();
    const formattedDestination = destination.toUpperCase();
    
    return `https://www.skyscanner.com/transport/flights/${formattedOrigin}/${formattedDestination}/${date}`;
  }
}

/**
 * Calculate flight duration between departure and arrival times
 */
function calculateDuration(departure, arrival) {
  const diff = arrival - departure;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * Determine route type based on origin and destination
 */
function getRouteType(origin, destination) {
  const originData = AIRPORT_DATA[origin.toUpperCase()];
  const destData = AIRPORT_DATA[destination.toUpperCase()];
  
  if (!originData || !destData) {
    return 'domestic_medium'; // Default fallback
  }
  
  // Check if international route
  const isInternational = (
    (originData.timezone >= -8 && originData.timezone <= -5) !== 
    (destData.timezone >= -8 && destData.timezone <= -5)
  ) || Math.abs(originData.timezone - destData.timezone) > 5;
  
  if (isInternational) {
    if (Math.abs(originData.timezone - destData.timezone) >= 8) {
      return 'transpacific';
    } else if (Math.abs(originData.timezone - destData.timezone) >= 5) {
      return 'transatlantic';
    } else {
      return 'international_short';
    }
  }
  
  // Domestic route - estimate distance by timezone difference and major hubs
  const timezoneDiff = Math.abs(originData.timezone - destData.timezone);
  if (timezoneDiff >= 3) {
    return 'domestic_long';
  } else if (timezoneDiff >= 1 || (originData.majorHub && destData.majorHub)) {
    return 'domestic_medium';
  } else {
    return 'domestic_short';
  }
}

/**
 * Generate realistic flight times based on route and date
 */
function generateFlightTimes(date, routeType, index) {
  const dateObj = new Date(date);
  const characteristics = ROUTE_CHARACTERISTICS[routeType];
  
  // Different flight time patterns based on route type
  let baseHours = [];
  
  switch (routeType) {
    case 'domestic_short':
      baseHours = [6, 8, 10, 12, 14, 16, 18, 20];
      break;
    case 'domestic_medium':
      baseHours = [6, 8, 11, 13, 15, 17, 19];
      break;
    case 'domestic_long':
      baseHours = [6, 9, 12, 15, 18, 21];
      break;
    case 'transatlantic':
      baseHours = [8, 10, 14, 16, 18, 22];
      break;
    case 'transpacific':
      baseHours = [9, 11, 13, 15, 17];
      break;
    case 'international_short':
      baseHours = [7, 9, 11, 13, 15, 17, 19];
      break;
    default:
      baseHours = [8, 10, 12, 14, 16, 18];
  }
  
  const departureHour = baseHours[index % baseHours.length];
  const departureMinutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  
  const departureTime = new Date(dateObj);
  departureTime.setHours(departureHour, departureMinutes, 0, 0);
  
  // Calculate flight duration
  const minDuration = characteristics.duration.min;
  const maxDuration = characteristics.duration.max;
  const flightHours = minDuration + Math.random() * (maxDuration - minDuration);
  const totalMinutes = Math.floor(flightHours * 60);
  
  const arrivalTime = new Date(departureTime);
  arrivalTime.setMinutes(arrivalTime.getMinutes() + totalMinutes);
  
  return {
    departure: departureTime,
    arrival: arrivalTime,
    durationHours: Math.floor(totalMinutes / 60),
    durationMinutes: totalMinutes % 60
  };
}

/**
 * Generate price based on route characteristics
 */
function generateRoutePrice(routeType, isWeekend) {
  const characteristics = ROUTE_CHARACTERISTICS[routeType];
  const basePrice = characteristics.priceRange.min + 
    Math.random() * (characteristics.priceRange.max - characteristics.priceRange.min);
  
  // Weekend markup
  const weekendMultiplier = isWeekend ? 1.15 : 1.0;
  
  return Math.round(basePrice * weekendMultiplier);
}

/**
 * Generate unique flight data for different cities
 */
function generateDemoFlights(origin, destination, date) {
  const dateObj = new Date(date);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const routeType = getRouteType(origin, destination);
  const characteristics = ROUTE_CHARACTERISTICS[routeType];
  
  // Get airport information
  const originAirport = AIRPORT_DATA[origin.toUpperCase()] || 
    { name: `${origin.toUpperCase()} Airport`, city: origin };
  const destAirport = AIRPORT_DATA[destination.toUpperCase()] || 
    { name: `${destination.toUpperCase()} Airport`, city: destination };
  
  // Determine number of flights based on route popularity
  let numFlights;
  switch (characteristics.frequency) {
    case 'high': numFlights = 6 + Math.floor(Math.random() * 3); break;
    case 'medium': numFlights = 4 + Math.floor(Math.random() * 3); break;
    case 'low': numFlights = 2 + Math.floor(Math.random() * 3); break;
    default: numFlights = 5;
  }
  
  return Array.from({ length: numFlights }, (_, i) => {
    const airlineIndex = i % characteristics.airlines.length;
    const airline = characteristics.airlines[airlineIndex];
    const airlineCode = characteristics.codes[airlineIndex];
    
    const flightTimes = generateFlightTimes(date, routeType, i);
    const price = generateRoutePrice(routeType, isWeekend);
    
    // Generate realistic flight number
    const flightNumber = `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Flight status based on time of day and randomness
    const statuses = ['Scheduled', 'On Time', 'Boarding', 'Delayed'];
    const statusWeights = [0.4, 0.4, 0.1, 0.1];
    let status = 'Scheduled';
    const random = Math.random();
    let cumulative = 0;
    for (let j = 0; j < statuses.length; j++) {
      cumulative += statusWeights[j];
      if (random <= cumulative) {
        status = statuses[j];
        break;
      }
    }
    
    return {
      airline: airline,
      flightNumber: flightNumber,
      departureAirport: originAirport.name,
      departureTime: flightTimes.departure.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      arrivalAirport: destAirport.name,
      arrivalTime: flightTimes.arrival.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      duration: `${flightTimes.durationHours}h ${flightTimes.durationMinutes}m`,
      status: status,
      price: `$${price}`,
      bookingLinks: {
        expedia: BookingLinkGenerator.generateFlightExpediaLink(origin, destination, date),
        skyscanner: BookingLinkGenerator.generateFlightSkyscannerLink(origin, destination, date)
      }
    };
  });
}

/**
 * Get flights based on origin, destination, and date
 */
exports.getFlights = async (origin, destination, date) => {
  const cacheKey = `${origin.toUpperCase()}-${destination.toUpperCase()}-${date}`;
  
  const cachedFlights = flightCache.get(cacheKey);
  if (cachedFlights) {
    console.log('Retrieved flights from cache');
    return cachedFlights;
  }
  
  try {
    console.log(`Fetching flights from API for ${origin} to ${destination} on ${date}`);
    console.log(`API URL: ${process.env.AVIATIONSTACK_API_URL}/flights`);
    
    if (!process.env.AVIATIONSTACK_API_URL) {
      throw new Error('AVIATIONSTACK_API_URL is not defined in environment variables');
    }
    
    if (!process.env.AVIATIONSTACK_API_KEY) {
      throw new Error('AVIATIONSTACK_API_KEY is not defined in environment variables');
    }
    
    const response = await axios.get(`${process.env.AVIATIONSTACK_API_URL}`, {
      params: {
        access_key: process.env.AVIATIONSTACK_API_KEY,
        dep_iata: origin.toUpperCase(),
        arr_iata: destination.toUpperCase(),
        flight_date: date
      }
    });
    
    console.log('API response received:', response.status);
    
    if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
      console.error('Invalid API response structure:', response.data);
      
      const demoFlights = generateDemoFlights(origin, destination, date);
      flightCache.set(cacheKey, demoFlights);
      return demoFlights;
    }
    
    const flights = response.data.data.map(flight => {
      try {
        return {
          airline: flight.airline?.name || 'Unknown Airline',
          flightNumber: flight.airline?.iata ? `${flight.airline.iata}${flight.flight?.number || ''}` : 'Unknown',
          departureAirport: flight.departure?.airport || 'Unknown',
          departureTime: flight.departure?.scheduled ? new Date(flight.departure.scheduled).toLocaleString() : 'Unknown',
          arrivalAirport: flight.arrival?.airport || 'Unknown',
          arrivalTime: flight.arrival?.scheduled ? new Date(flight.arrival.scheduled).toLocaleString() : 'Unknown',
          duration: (flight.departure?.scheduled && flight.arrival?.scheduled) ? 
            calculateDuration(
              new Date(flight.departure.scheduled),
              new Date(flight.arrival.scheduled)
            ) : 'Unknown',
          status: flight.flight_status ? 
            flight.flight_status.charAt(0).toUpperCase() + flight.flight_status.slice(1) : 'Unknown',
          price: `$${generateRoutePrice(getRouteType(origin, destination), false)}`,
          bookingLinks: {
            expedia: BookingLinkGenerator.generateFlightExpediaLink(origin, destination, date),
            skyscanner: BookingLinkGenerator.generateFlightSkyscannerLink(origin, destination, date)
          }
        };
      } catch (err) {
        console.error('Error processing individual flight data:', err);
        return null;
      }
    }).filter(flight => flight !== null);
    
    if (flights.length === 0) {
      console.log('No flights found for the specified route and date');
      const demoFlights = generateDemoFlights(origin, destination, date);
      flightCache.set(cacheKey, demoFlights);
      return demoFlights;
    }
    
    flightCache.set(cacheKey, flights);
    return flights;
  } catch (error) {
    console.error('Error fetching flight data:', error);
    
    if (error.response) {
      if (error.response.status === 403) {
        console.error("AviationStack API returned 403. Possible causes:");
        console.error("- Invalid/expired API key");
        console.error("- Invalid airport codes");
        console.error("- Plan restrictions (free tier limits)");
      }
    }
    
    // Return demo flights in case of any errors
    const demoFlights = generateDemoFlights(origin, destination, date);
    flightCache.set(cacheKey, demoFlights);
    return demoFlights;
  }
};

// Export additional utilities
exports.BookingLinkGenerator = BookingLinkGenerator;
exports.generateDemoFlights = generateDemoFlights;





// const axios = require('axios');
// const NodeCache = require('node-cache');

// // Cache with TTL of 1 hour
// const flightCache = new NodeCache({ stdTTL: 3600 });

// // Booking Link Generator Class
// class BookingLinkGenerator {
//   // Generate Expedia deep link for flights
//   static generateFlightExpediaLink(origin, destination, date) {
//     const baseUrl = 'https://www.expedia.com/Flights-Search';
//     const params = new URLSearchParams({
//       mode: 'search',
//       originPlace: origin.toUpperCase(),
//       destinationPlace: destination.toUpperCase(),
//       departDate: date,
//       adults: '1', // Default to 1 adult
//     });
    
//     return `${baseUrl}?${params.toString()}`;
//   }

//   // Generate Skyscanner deep link for flights
//   static generateFlightSkyscannerLink(origin, destination, date) {
//     const baseUrl = 'https://www.skyscanner.com/transport/flights';
//     const formattedOrigin = origin.toUpperCase();
//     const formattedDestination = destination.toUpperCase();
    
//     return `https://www.skyscanner.com/transport/flights/${formattedOrigin}/${formattedDestination}/${date}`;
//   }
// }

// /**
//  * Calculate flight duration between departure and arrival times
//  * @param {Date} departure - Departure time
//  * @param {Date} arrival - Arrival time
//  * @returns {string} - Formatted duration string
//  */
// function calculateDuration(departure, arrival) {
//   const diff = arrival - departure;
//   const hours = Math.floor(diff / (1000 * 60 * 60));
//   const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//   return `${hours}h ${minutes}m`;
// }

// /**
//  * Generate random price (since the API doesn't provide price information)
//  * @returns {string} - Formatted price string
//  */
// function generateRandomPrice() {
//   const basePrice = Math.floor(Math.random() * 500) + 100;
//   return `$${basePrice}`;
// }

// /**
//  * Generate demo flights when API fails or returns no results
//  * @param {string} origin - Origin airport code
//  * @param {string} destination - Destination airport code
//  * @param {string} date - Flight date
//  * @returns {Array} - Array of demo flight objects
//  */
// function generateDemoFlights(origin, destination, date) {
//   const dateObj = new Date(date);
//   const formattedDate = dateObj.toLocaleDateString();
  
//   const airlines = ['American Airlines', 'Delta', 'United', 'British Airways', 'Emirates', 'Lufthansa'];
//   const flightCodes = ['AA', 'DL', 'UA', 'BA', 'EK', 'LH'];
  
//   return Array.from({ length: 5 }, (_, i) => {
//     const airlineIndex = i % airlines.length;
//     const departureHour = 6 + i * 3; // Flights starting from 6 AM, spaced 3 hours apart
//     const departureTime = new Date(dateObj);
//     departureTime.setHours(departureHour, Math.floor(Math.random() * 60));
    
//     const duration = 2 + Math.floor(Math.random() * 4); // 2-5 hour flights
//     const arrivalTime = new Date(departureTime);
//     arrivalTime.setHours(arrivalTime.getHours() + duration);
    
//     return {
//       airline: airlines[airlineIndex],
//       flightNumber: `${flightCodes[airlineIndex]}${100 + Math.floor(Math.random() * 900)}`,
//       departureAirport: `${origin.toUpperCase()} Airport`,
//       departureTime: departureTime.toLocaleString(),
//       arrivalAirport: `${destination.toUpperCase()} Airport`,
//       arrivalTime: arrivalTime.toLocaleString(),
//       duration: `${duration}h ${Math.floor(Math.random() * 60)}m`,
//       status: ['Scheduled', 'On Time', 'Delayed', 'Boarding'][Math.floor(Math.random() * 3)],
//       price: `$${200 + Math.floor(Math.random() * 600)}`,
//       bookingLinks: {
//         expedia: BookingLinkGenerator.generateFlightExpediaLink(origin, destination, date),
//         skyscanner: BookingLinkGenerator.generateFlightSkyscannerLink(origin, destination, date)
//       }
//     };
//   });
// }

// /**
//  * Get flights based on origin, destination, and date
//  * @param {string} origin - Origin airport/city code
//  * @param {string} destination - Destination airport/city code
//  * @param {string} date - Flight date (YYYY-MM-DD)
//  * @returns {Promise<Array>} - Array of flight objects
//  */
// exports.getFlights = async (origin, destination, date) => {
//   // Create a cache key
//   const cacheKey = `${origin.toUpperCase()}-${destination.toUpperCase()}-${date}`;
  
//   // Check if data exists in cache
//   const cachedFlights = flightCache.get(cacheKey);
//   if (cachedFlights) {
//     console.log('Retrieved flights from cache');
//     return cachedFlights;
//   }
  
//   try {
//     console.log(`Fetching flights from API for ${origin} to ${destination} on ${date}`);
//     console.log(`API URL: ${process.env.AVIATIONSTACK_API_URL}/flights`);
    
//     // Validate environment variables
//     if (!process.env.AVIATIONSTACK_API_URL) {
//       throw new Error('AVIATIONSTACK_API_URL is not defined in environment variables');
//     }
    
//     if (!process.env.AVIATIONSTACK_API_KEY) {
//       throw new Error('AVIATIONSTACK_API_KEY is not defined in environment variables');
//     }
    
//     const response = await axios.get(`${process.env.AVIATIONSTACK_API_URL}`, {
//       params: {
//         access_key: process.env.AVIATIONSTACK_API_KEY,
//         dep_iata: origin.toUpperCase(),
//         arr_iata: destination.toUpperCase(),
//         flight_date: date
//       }
//     });
    
//     console.log('API response received:', response.status);
    
//     // Check if response contains expected data structure
//     if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
//       console.error('Invalid API response structure:', response.data);
      
//       // Generate demo flights as fallback
//       const demoFlights = generateDemoFlights(origin, destination, date);
//       flightCache.set(cacheKey, demoFlights);
//       return demoFlights;
//     }
    
//     // Process the flight data
//     const flights = response.data.data.map(flight => {
//       try {
//         return {
//           airline: flight.airline?.name || 'Unknown Airline',
//           flightNumber: flight.airline?.iata ? `${flight.airline.iata}${flight.flight?.number || ''}` : 'Unknown',
//           departureAirport: flight.departure?.airport || 'Unknown',
//           departureTime: flight.departure?.scheduled ? new Date(flight.departure.scheduled).toLocaleString() : 'Unknown',
//           arrivalAirport: flight.arrival?.airport || 'Unknown',
//           arrivalTime: flight.arrival?.scheduled ? new Date(flight.arrival.scheduled).toLocaleString() : 'Unknown',
//           duration: (flight.departure?.scheduled && flight.arrival?.scheduled) ? 
//             calculateDuration(
//               new Date(flight.departure.scheduled),
//               new Date(flight.arrival.scheduled)
//             ) : 'Unknown',
//           status: flight.flight_status ? 
//             flight.flight_status.charAt(0).toUpperCase() + flight.flight_status.slice(1) : 'Unknown',
//           price: generateRandomPrice(), // Since the API doesn't provide price info
//           bookingLinks: {
//             expedia: BookingLinkGenerator.generateFlightExpediaLink(origin, destination, date),
//             skyscanner: BookingLinkGenerator.generateFlightSkyscannerLink(origin, destination, date)
//           }
//         };
//       } catch (err) {
//         console.error('Error processing individual flight data:', err);
//         return null;
//       }
//     }).filter(flight => flight !== null);
    
//     // If no flights found, return demo flights
//     if (flights.length === 0) {
//       console.log('No flights found for the specified route and date');
//       const demoFlights = generateDemoFlights(origin, destination, date);
//       flightCache.set(cacheKey, demoFlights);
//       return demoFlights;
//     }
    
//     // Store in cache
//     flightCache.set(cacheKey, flights);
    
//     return flights;
//   } catch (error) {
//     // Enhanced error logging
//     console.error('Error fetching flight data:', error);
    
//     // Log more detailed error information
//     // if (error.response) {
//     //   console.error('API Response Error:', {
//     //     status: error.response.status,
//     //     data: error.response.data,
//     //     headers: error.response.headers
//     //   });
//     // } else if (error.request) {
//     //   console.error('No response received:', error.request);
//     // } else {
//     //   console.error('Error setting up request:', error.message);
//     // }

//     if (error.response) {
//     if (error.response.status === 403) {
//       console.error("AviationStack API returned 403. Possible causes:");
//       console.error("- Invalid/expired API key");
//       console.error("- Invalid airport codes");
//       console.error("- Plan restrictions (free tier limits)");
//     }
//   }
    
//     // Return demo flights in case of any errors
//     const demoFlights = generateDemoFlights(origin, destination, date);
//     return demoFlights;
//   }
// };

// // Export additional utilities
// exports.BookingLinkGenerator = BookingLinkGenerator;
// exports.generateDemoFlights = generateDemoFlights;