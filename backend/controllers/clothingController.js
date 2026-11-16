const { analyzeClothing } = require('../services/clothingService');
const { saveWardrobeItem, getUserWardrobe } = require('../services/wardrobeService');

exports.saveClothingItem = async (req, res, next) => {
  try {
    const item = await saveWardrobeItem(req.userId, req.body);
    return res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};

exports.listClothingItems = async (req, res, next) => {
  try {
    const items = await getUserWardrobe(req.userId);
    return res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
};

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

