const hotelService = require('./hotel_service');

exports.getHotelSearchForm = (req, res) => {
  res.render('hotel/search_form', { title: 'Find Accommodations' });
};

exports.searchHotels = async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests } = req.body;
    
    // Validate inputs
    if (!city || !checkIn || !checkOut || !guests) {
      return res.render('hotel/search_form', {
        title: 'Find Accommodations',
        error: 'Please provide all required fields: city, check-in date, check-out date, and number of guests.'
      });
    }
    
    // Ensure session exists and initialize if not
    if (!req.session) {
      req.session = {};
    }
    
    // Store search context in session
    req.session.lastSearchCity = city;
    req.session.lastSearchCheckIn = checkIn;
    req.session.lastSearchCheckOut = checkOut;
    req.session.lastSearchGuests = guests;
    
    const hotels = await hotelService.getHotels(city, checkIn, checkOut, guests);
    
    res.render('hotel/hotel', {
      title: 'Accommodation Results',
      hotels,
      search: { city, checkIn, checkOut, guests }
    });
  } catch (error) {
    console.error('Error searching hotels:', error);
    res.render('hotel/search_form', {
      title: 'Find Accommodations',
      error: `Error searching accommodations: ${error.message || 'Unknown error'}`
    });
  }
};