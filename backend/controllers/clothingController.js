const { getGeminiClient } = require('../config/gemini');
const { clothingAnalysisSchema, validateClothingAnalysis } = require('../utils/clothingAnalysis');

// POST /api/clothing/analyze
// Analyzes one uploaded garment image and returns metadata without saving it.
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

    return res.status(200).json({ analysis });
  } catch (error) {
    next(error);
  }
};

