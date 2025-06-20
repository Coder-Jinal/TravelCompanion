const imageService = require('./image_service');

exports.getImageForm = (req, res) => {
  res.render('images/image', {
    title: 'Destination Gallery',
    images: null
  });
};

exports.searchImages = async (req, res) => {
  try {
    const destination = req.query.destination;
    
    if (!destination) {
      return res.render('images/image', {
        title: 'Destination Gallery',
        error: 'Please provide a destination to search for images'
      });
    }
    
    const images = await imageService.getDestinationImages(destination);
    
    res.render('images/image', {
      title: `${destination} Images`,
      images,
      destination
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.render('images/image', {
      title: 'Destination Gallery',
      error: `Error fetching images: ${error.message || 'Unknown error'}`
    });
  }
};
