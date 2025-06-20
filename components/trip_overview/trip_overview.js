const express = require('express');

// In-memory storage for saved trips
let savedTrips = [];

exports.renderTripOverview = (req, res) => {
  try {
    // Ensure all hotel properties are formatted correctly
    const formattedTrips = savedTrips.map(trip => {
      // Calculate nights, defaulting to 1 if not present
      const nights = trip.nights || 1;
      
      // Calculate price per night, ensuring a valid number
      const pricePerNight = trip.pricePerNight || 
        (trip.totalPrice ? trip.totalPrice / nights : 0);

      // Calculate total price, considering number of people
      const totalPrice = parseFloat(
        (pricePerNight * nights).toFixed(2)
      );

      return {
        ...trip,
        rating: trip.rating || (Math.floor(Math.random() * 21) + 30) / 10,
        pricePerNight: parseFloat(pricePerNight.toFixed(2)),
        totalPrice: totalPrice,
        nights: nights,
        amenities: trip.amenities || [], 
        currency: trip.currency || 'USD',
        thumbnail: trip.thumbnail || trip.hotelThumbnail,
        address: trip.address || 'No address provided'
      };
    });

    res.render('trip_overview/trip_overview', { 
      title: 'Trip Overview',
      savedTrips: formattedTrips
    });
  } catch (error) {
    console.error('Error in renderTripOverview:', error);
    res.status(500).render('error', { 
      message: 'Error rendering trip overview',
      error: error 
    });
  }
};

exports.saveHotel = (req, res) => {
  console.log('Received save hotel request:', req.body);

  try {
    const { 
      hotelId, 
      hotelName, 
      hotelCity, 
      hotelPrice, 
      hotelThumbnail,
      address,
      amenities
    } = req.body;

    // Validate input
    if (!hotelId || !hotelName) {
      return res.status(400).json({ 
        message: 'Missing required hotel details',
        receivedData: req.body 
      });
    }

    // Check if hotel is already saved
    const isDuplicate = savedTrips.some(trip => 
      trip.hotelId === hotelId
    );

    if (isDuplicate) {
      return res.status(400).json({ message: 'Hotel already saved in trip' });
    }

    // Generate random rating similar to hotel search
    const rating = (Math.floor(Math.random() * 21) + 30) / 10;

    // Default to 1 night if not specified
    const nights = 1;
    const pricePerNight = parseFloat(hotelPrice);
    const totalPrice = pricePerNight * nights;

    // Create hotel trip object with all details
    const hotelTrip = {
      type: 'hotel',
      id: hotelId,
      hotelId,
      name: hotelName,
      hotelName,
      city: hotelCity,
      hotelCity,
      address,
      rating,
      pricePerNight,
      totalPrice,
      nights,
      currency: 'USD',
      amenities: amenities || [],
      thumbnail: hotelThumbnail,
      hotelThumbnail,
      description: `Experience luxury and comfort at ${hotelName}. Located in the heart of ${hotelCity}.`,
      expediaBookingLink: `https://www.expedia.com/Hotels?destination=${encodeURIComponent(hotelName + ', ' + hotelCity)}`
    };

    // Save to in-memory trips
    savedTrips.push(hotelTrip);

    res.status(200).json({ 
      message: 'Hotel saved successfully', 
      savedTrips: savedTrips 
    });
  } catch (error) {
    console.error('Full error in saveHotel:', error);
    res.status(500).json({ 
      message: 'Error saving hotel',
      error: error.toString(),
      stack: error.stack 
    });
  }
};

//add flights
exports.saveFlight = (req, res) => {
  try {
    const { 
      flightId, 
      airline, 
      flightNumber, 
      origin, 
      destination, 
      departureTime, 
      arrivalTime, 
      price,
      duration,
      status
    } = req.body;

    // Comprehensive input validation
    const requiredFields = [
      'flightId', 'airline', 'flightNumber', 
      'origin', 'destination', 'departureTime', 
      'arrivalTime', 'price', 'duration', 'status'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required flight details',
        missingFields: missingFields,
        receivedData: req.body 
      });
    }

    // Sanitize price - remove '$' and ensure it's a number
    const sanitizedPrice = typeof price === 'string' 
      ? parseFloat(price.replace('$', '')) 
      : parseFloat(price);

    // Check if flight is already saved
    const isDuplicate = savedTrips.some(trip => 
      trip.flightId === flightId
    );

    if (isDuplicate) {
      return res.status(400).json({ 
        message: 'Flight already saved in trip',
        flightId: flightId 
      });
    }

    // Create flight trip object with all details
    const flightTrip = {
      type: 'flight',
      id: flightId,
      flightId,
      name: `${airline} - ${flightNumber}`,
      airline,
      flightNumber,
      origin,
      destination,
      departureTime,
      arrivalTime,
      pricePerNight: sanitizedPrice,
      totalPrice: sanitizedPrice,
      nights: 1,
      currency: 'USD',
      duration,
      status,
      description: `Flight from ${origin} to ${destination} on ${airline} flight ${flightNumber}`,
      thumbnail: `https://placehold.co/600x400?text=${encodeURIComponent(airline)}`,
      amenities: [], 
      bookingLink: `https://www.skyscanner.com/transport/flights/${origin.toUpperCase()}/${destination.toUpperCase()}`
    };

    // Save to in-memory trips
    savedTrips.push(flightTrip);

    res.status(200).json({ 
      message: 'Flight saved successfully', 
      savedTrips: savedTrips,
      savedFlight: flightTrip
    });
  } catch (error) {
    console.error('Full error in saveFlight:', error);
    res.status(500).json({ 
      message: 'Error saving flight',
      error: error.toString(),
      stack: error.stack 
    });
  }
};

exports.removeTrip = (req, res) => {
  try {
    const { tripId } = req.body;

    console.log('Attempting to remove trip:', tripId);
    console.log('Current saved trips:', savedTrips.length);

    // Remove trip by finding its index - now checks both hotelId and flightId
    const index = savedTrips.findIndex(trip => 
      trip.hotelId === tripId || trip.flightId === tripId
    );

    console.log('Found trip index:', index);

    if (index !== -1) {
      savedTrips.splice(index, 1);
      console.log('Trip removed. Remaining trips:', savedTrips.length);
      
      return res.status(200).json({ 
        message: 'Trip removed successfully', 
        savedTrips: savedTrips 
      });
    }

    console.log('Trip not found for ID:', tripId);
    res.status(404).json({ message: 'Trip not found' });
  } catch (error) {
    console.error('Error removing trip:', error);
    res.status(500).json({ message: 'Error removing trip' });
  }
};


// Add this to your trip_overview.js
exports.viewSharedTrip = (req, res) => {
  try {
    const { tripType, tripId } = req.params;
    
    // Find the trip in savedTrips
    const trip = savedTrips.find(t => 
      (t.type === tripType && (t.hotelId === tripId || t.flightId === tripId))
    );
    
    if (!trip) {
      return res.status(404).render('error', {
        message: 'Trip not found or may have been removed',
        error: { status: 404 }
      });
    }
    
    res.render('trip_overview/shared_trip', {
      title: `Shared ${tripType}`,
      trip: trip,
      isSharedView: true
    });
  } catch (error) {
    console.error('Error in viewSharedTrip:', error);
    res.status(500).render('error', {
      message: 'Error loading shared trip',
      error: error
    });
  }
};