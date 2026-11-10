// Creates the Gemini client lazily so importing the app does not make an API call.

let geminiClient;

// Keep the primary first; do not retry invalid requests, credentials, or quota errors.
exports.generateWithFallback = async (ai, request) => {
  const models = [...new Set([
    process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.7-flash'
  ])];
  for (let index = 0; index < models.length; index++) {
    try {
      return await ai.models.generateContent({
        ...request,
        model: models[index],
        config: {
          ...request.config,
          httpOptions: {
            ...request.config?.httpOptions,
            timeout: 30000,
            retryOptions: { attempts: 1 }
          }
        }
      });
    } catch (cause) {
      const transient = [500, 502, 503, 504].includes(Number(cause.status)) || cause.name === 'AbortError';
      if (!transient) throw cause;
      if (index + 1 < models.length) {
        console.warn(`Gemini ${models[index]} temporarily unavailable; trying ${models[index + 1]}`);
      } else {
        const error = new Error('Gemini models are temporarily busy or unavailable. Please try again shortly.');
        error.statusCode = 503;
        throw error;
      }
    }
  }
};

exports.getGeminiClient = async () => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is missing from the .env file');
    error.statusCode = 500;
    throw error;
  }

  if (!geminiClient) {
    const { GoogleGenAI } = await import('@google/genai');
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  return geminiClient;
};

