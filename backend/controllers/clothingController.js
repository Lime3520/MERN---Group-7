const { analyzeClothing } = require('../services/clothingService');

// POST /api/clothing/analyze
// Handles HTTP input/output; the service performs analysis without saving it.
exports.analyzeClothingImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'An image file is required in the image field' });
    }

    const analysis = await analyzeClothing(req.file);
    return res.status(200).json({ analysis });
  } catch (error) {
    next(error);
  }
};

