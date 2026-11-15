const { getUserWardrobe } = require('../services/wardrobeService');
const { generateOutfits } = require('../services/outfitService');
const { parseOutfitRequest } = require('../utils/outfitGeneration');

// POST /api/outfits/generate — recommendations only; no database writes.
exports.generateOutfitSuggestions = async (req, res, next) => {
  try {
    const preferences = parseOutfitRequest(req.body);
    // Ownership comes from the verified JWT, never from a request-body userId.
    const wardrobe = await getUserWardrobe(req.userId);
    const result = await generateOutfits(wardrobe, preferences);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
