const axios = require('axios');
const NodeCache = require('node-cache');

// Cache with TTL of 1 hour
const hotelCache = new NodeCache({ stdTTL: 3600 });

/**
 * Get hotels based on city, check-in/out dates, and number of guests
 * @param {string} city - City name
 * @param {string} checkIn - Check-in date (YYYY-MM-DD)
 * @param {string} checkOut - Check-out date (YYYY-MM-DD)
 * @param {number} guests - Number of guests
 * @returns {Promise<Array>} - Array of hotel objects
 */
exports.getHotels = async (city, checkIn, checkOut, guests) => {
  // Create a cache key
  const cacheKey = `${city.toLowerCase()}-${checkIn}-${checkOut}-${guests}`;
  
  // Check if data exists in cache
  const cachedHotels = hotelCache.get(cacheKey);
  if (cachedHotels) {
    console.log('Retrieved hotels from cache');
    return cachedHotels;
  }
  
  try {
    // For demo purposes, we'll generate mock hotel data
    // In a real application, this would make an API call to Amadeus
    const hotels = generateMockHotels(city, 8, checkIn, checkOut, guests);
    
    // Store in cache
    hotelCache.set(cacheKey, hotels);
    
    return hotels;
  } catch (error) {
    console.error('Error fetching hotel data:', error);
    throw new Error('Failed to retrieve accommodation information');
  }
};

/**
 * Generate mock hotel data for demonstration purposes
 * @param {string} city - City name
 * @param {number} count - Number of hotels to generate
 * @param {string} checkIn - Check-in date
 * @param {string} checkOut - Check-out date
 * @param {number} guests - Number of guests
 * @returns {Array} - Array of hotel objects
 */

function generateMockHotels(city, count, checkIn, checkOut, guests) {
  const hotels = [];
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

  // Random hotel name components (more variety)
  const prefixes = [
    "Grand", "Royal", "Luxury", "Emerald", "Golden", "Silver", "Platinum", "Crystal", 
    "Days", "Sunrise", "Paradise", "Horizon", "Majestic", "Prestige", "Elite"
  ];
  const suffixes = [
    "Hotel", "Resort", "Suites", "Inn", "Lodge", "Retreat", "Palace", "Manor",
    "Towers", "View", "Haven", "Oasis", "Plaza", "Gardens", "Club"
  ];
  const locationTypes = [
    "Downtown", "Uptown", "Riverside", "Hillside", "Lakeside", "Mountain", "Valley", "Park", 
    "Central", "Historic", "Business District", "Waterfront", "Urban", "Metropolitan"
  ];

  // More varied placeholder images
  const placeholders = [
    'https://t3.ftcdn.net/jpg/00/29/13/38/360_F_29133877_bfA2n7cWV53fto2BomyZ6pyRujJTBwjd.jpg',
    'https://t4.ftcdn.net/jpg/11/03/07/75/360_F_1103077586_SBKrv88uNzlYjvHFgbLvhZshM4dBIBUr.jpg',
    'https://3.imimg.com/data3/FM/MD/MY-1906485/hotel-booking.jpg',
    'https://img.freepik.com/free-photo/beautiful-luxury-outdoor-swimming-pool-hotel-resort_74190-7433.jpg',
    'https://www.ghmhotels.com/wp-content/uploads/CAM-Dining-The-Courtyard-Night021-865x780.jpg',
    'https://images.wsj.net/im-65599456?size=1.5',
    "https://media.cnn.com/api/v1/images/stellar/prod/171109145517-06-cozy-hotels-redefining-luxury.jpg?q=w_3000,h_1688,x_0,y_0,c_fill",
    "https://images.unsplash.com/photo-1711743266323-5badf42d4797?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aG90ZWwlMjBleHRlcmlvcnxlbnwwfHwwfHx8MA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1661964071015-d97428970584?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aG90ZWx8ZW58MHx8MHx8fDA%3D",
    'https://www.magnoliahotels.com/site/assets/files/20224/dallas_best_hotel.600x450.jpg?70z6fu',
    'https://allears.net/wp-content/uploads/2023/02/2023-Disneyland-Hotel-Room-Tour-117.jpg',
    'https://thepointsguy.global.ssl.fastly.net/us/originals/2023/09/20230928_Disneyland-Villas-First-Look_SHull_33.jpg',
    'https://z.cdrst.com/foto/hotel-sf/1024c/granderesp/disney-s-grand-californian-hotel-and-spa-general-13402287.jpg',
    'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2e/86/8d/a4/caption.jpg?w=900&h=-1&s=1'
  ];

  // More diverse amenities
  const allAmenities = [
    "Free WiFi", "Swimming Pool", "Gym", "Spa", "Restaurant", "Bar", "Room Service",
    "Airport Shuttle", "Parking", "Pet-Friendly", "Business Center", "Laundry",
    "Concierge", "Hot Tub", "Rooftop Terrace", "Bike Rentals", "EV Charging",
    "Minibar", "24/7 Front Desk", "Meeting Rooms"
  ];

  const shuffledImages = [...placeholders].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    // Generate a random hotel name
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const location = locationTypes[Math.floor(Math.random() * locationTypes.length)];
    const name = `${prefix} ${location} ${suffix}`;

    // Random rating (3.0 to 5.0)
    const rating = (Math.random() * 2 + 3).toFixed(1);

    // Random price per night ($50 - $500)
    const pricePerNight = Math.floor(Math.random() * 451) + 50;

    // Adjust price based on guests
    const guestSurcharge = Math.max(0, (parseInt(guests) - 1) * 20);
    // const totalPrice = (pricePerNight + guestSurcharge) * nights;

    const subtotal = (pricePerNight + guestSurcharge) * nights;
    // Calculate tax (13%)
    const tax = subtotal * 0.13;
    // Calculate total (subtotal + tax)
    const totalPrice = subtotal + tax;

    // Random amenities (3-8)
    const amenityCount = Math.floor(Math.random() * 6) + 3;
    const shuffledAmenities = [...allAmenities].sort(() => 0.5 - Math.random());
    const amenities = shuffledAmenities.slice(0, amenityCount);

    // Random image
    const thumbnail = shuffledImages[i % shuffledImages.length];
    // const thumbnail = `https://source.unsplash.com/random/800x600/?hotel-${city}-${i}`;
    // const thumbnail = `https://source.unsplash.com/random/800x600/?hotel,${city},${i}&${Math.random()}`;

    hotels.push({
      id: `hotel-${city.toLowerCase()}-${i}-${Date.now()}`, // Ensures uniqueness
      name,
      id: `hotel-${city.toLowerCase()}-${i}-${Date.now()}`,
      thumbnail,
      address: `${Math.floor(Math.random() * 1000) + 1} ${["Main", "Oak", "Elm", "Pine", "Maple"][Math.floor(Math.random() * 5)]} St, ${city}`,
      rating: parseFloat(rating),
      pricePerNight,
      totalPrice,
      nights,
      currency: "USD",
      amenities,
      thumbnail,
      description: `A beautifully located hotel in ${city}, offering premium services and a comfortable stay. Perfect for ${["business travelers", "families", "couples", "solo adventurers"][Math.floor(Math.random() * 4)]}.`,
      expediaBookingLink: `https://www.expedia.com/Hotels?destination=${encodeURIComponent(name + ', ' + city)}&startDate=${checkIn}&endDate=${checkOut}&adults=${guests}`
    });
  }

  return hotels;
}

