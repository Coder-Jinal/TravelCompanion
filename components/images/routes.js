const express = require('express');
const imageController = require('./image');
const router = express.Router();

// GET image gallery page with form
router.get('/', imageController.getImageForm);

// GET image search
router.get('/search', imageController.searchImages);

module.exports = router;