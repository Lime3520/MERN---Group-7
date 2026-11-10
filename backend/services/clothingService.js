const { getGeminiClient, generateWithFallback } = require('../config/gemini');
const { clothingAnalysisSchema, validateClothingAnalysis } = require('../utils/clothingAnalysis');

// Image analysis independent of HTTP; optional client injection supports offline tests.
exports.analyzeClothing = async (file, client) => {
  const ai = client || await getGeminiClient();
  let response;
  try {
    response = await generateWithFallback(ai, {
      contents: [
        {
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString('base64')
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
    if (cause.statusCode === 503) throw cause;
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

  return analysis;
};
