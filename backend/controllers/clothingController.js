const { analyzeClothing, saveClothingItem, getUserClothingItems, getUserClothingImage } = require('../services/clothingService');
const { saveWardrobeItem } = require('../services/wardrobeService');

// POST /api/clothing/analyze
// Analyzes and stores one garment image in the authenticated user's wardrobe.
exports.analyzeClothingImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'An image file is required in the image field' });
    }

    const analysis = await analyzeClothing(req.file);

    const clothing = await saveClothingItem({
      userId: req.userId,
      image: req.file.buffer,
      mimeType: req.file.mimetype,
      analysis
    });

    return res.status(201).json({ analysis, clothing });
  } catch (error) {
    next(error);
  }
};

exports.listClothingItems = async (req, res, next) => {
  try {
    const items = await getUserClothingItems(req.userId);
    return res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
};

exports.getClothingImage = async (req, res, next) => {
  try {
    const { image, mimeType } = await getUserClothingImage(req.userId, req.params.id);
    return res
      .set('Cache-Control', 'private, no-store')
      .set('X-Content-Type-Options', 'nosniff')
      .type(mimeType)
      .send(image);
  } catch (error) {
    next(error);
  }
};

// Retain the existing metadata-only save endpoint for older API clients.
exports.saveClothingMetadata = async (req, res, next) => {
  try {
    const item = await saveWardrobeItem(req.userId, req.body);
    return res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};
