const { getGeminiClient } = require('../config/gemini');
const { saveClothingItem, getUserClothingItems, getUserClothingImage } = require('../services/clothingService');
const { clothingAnalysisSchema, validateClothingAnalysis } = require('../utils/clothingAnalysis');

// POST /api/clothing/analyze
// Analyzes and stores one garment image in the authenticated user's wardrobe.
exports.analyzeClothingImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'An image file is required in the image field' });
    }

    const ai = await getGeminiClient();
    let response;
    try {
      response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: req.file.buffer.toString('base64')
            }
          },
          {
            text: [
              'Analyze the single clothing item that is the main subject of this image.',
              'Describe only attributes supported by visible evidence.',
              'Use "unknown" where the schema permits it instead of guessing.',
              'If a person is visible, analyze the clothing only and do not identify or describe the person.'
            ].join(' ')
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: clothingAnalysisSchema,
          temperature: 0.2
        }
      });
    } catch (cause) {
      const error = new Error('Gemini could not analyze the image');
      error.statusCode = 502;
      error.cause = cause;
      throw error;
    }

    let analysis;
    try {
      analysis = JSON.parse(response.text);
    } catch {
      const error = new Error('Gemini returned malformed JSON');
      error.statusCode = 502;
      throw error;
    }

    if (!validateClothingAnalysis(analysis)) {
      const error = new Error('Gemini returned clothing data that failed validation');
      error.statusCode = 502;
      throw error;
    }

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
