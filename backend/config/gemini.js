// Creates the Gemini client lazily so importing the app does not make an API call.

let geminiClient;

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

