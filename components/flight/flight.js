const flightService = require('./flight_service');

exports.getFlightSearchForm = (req, res) => {
  res.render('flight/search_form', { title: 'Search Flights' });
};

exports.searchFlights = async (req, res) => {
  try {
    const { origin, destination, date } = req.body;
    
    // Validate inputs
    if (!origin || !destination || !date) {
      return res.render('flight/search_form', {
        title: 'Search Flights',
        error: 'Please provide all required fields: origin, destination, and date.'
      });
    }
    
    try {
      const flights = await flightService.getFlights(origin, destination, date);
      
      // Check if flights is undefined or not an array
      if (!flights || !Array.isArray(flights)) {
        console.error('Invalid flights data received:', flights);
        return res.render('flight/search_form', {
          title: 'Search Flights',
          error: 'Unable to retrieve flight information. Please try again.'
        });
      }
      
      res.render('flight/flight', {
        title: 'Flight Results',
        flights,
        search: { origin, destination, date }
      });
    } catch (apiError) {
      console.error('API Error in searchFlights:', apiError);
      res.render('flight/search_form', {
        title: 'Search Flights',
        error: `Error searching flights: ${apiError.message || 'Unknown API error'}`
      });
    }
  } catch (error) {
    console.error('Unexpected error in searchFlights:', error);
    res.render('flight/search_form', {
      title: 'Search Flights',
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
};