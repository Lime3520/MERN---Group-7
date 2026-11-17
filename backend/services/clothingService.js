const mongoose = require('mongoose');

const isValidObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

function getUserId(userId) {
  if (!isValidObjectId(userId)) {
    const error = new Error('Invalid authenticated user ID');
    error.statusCode = 401;
    throw error;
  }

  return new mongoose.Types.ObjectId(userId);
}

exports.saveClothingItem = async ({ userId, image, mimeType, analysis }) => {
  const owner = getUserId(userId);
  const createdAt = new Date();
  const result = await mongoose.connection.collection('clothingitems').insertOne({
    userId: owner,
    image,
    mimeType,
    analysis,
    createdAt
  });

  return { id: String(result.insertedId), createdAt };
};

exports.getUserClothingItems = async (userId) => {
  const owner = getUserId(userId);
  const items = await mongoose.connection.collection('clothingitems')
    .find({ userId: owner }, {
      projection: { _id: 1, analysis: 1, mimeType: 1, createdAt: 1 }
    })
    .sort({ _id: -1 })
    .limit(201)
    .toArray();

  if (items.length > 200) {
    const error = new Error('Wardrobe currently supports up to 200 clothing items');
    error.statusCode = 422;
    throw error;
  }

  return items.map(({ _id, analysis, mimeType, createdAt }) => ({
    id: String(_id),
    analysis,
    mimeType,
    createdAt
  }));
};

exports.getUserClothingImage = async (userId, clothingId) => {
  if (!isValidObjectId(clothingId)) {
    const error = new Error('Invalid clothing item ID');
    error.statusCode = 400;
    throw error;
  }

  const item = await mongoose.connection.collection('clothingitems').findOne({
    _id: new mongoose.Types.ObjectId(clothingId),
    userId: getUserId(userId)
  }, {
    projection: { _id: 0, image: 1, mimeType: 1 }
  });

  if (!item) {
    const error = new Error('Clothing item not found');
    error.statusCode = 404;
    throw error;
  }

  const image = Buffer.isBuffer(item.image) ? item.image : item.image?.value?.(true);
  if (!image || !Buffer.isBuffer(image)) {
    throw new Error('Stored clothing image is unavailable');
  }

  return { image, mimeType: item.mimeType };
};

exports.deleteUserClothingItem = async (userId, clothingId) => {
  const owner = getUserId(userId);
  if (!isValidObjectId(clothingId)) {
    const error = new Error('Invalid clothing item ID');
    error.statusCode = 400;
    throw error;
  }

  // Check ownership in the delete itself so another user's record cannot be removed.
  const result = await mongoose.connection.collection('clothingitems').deleteOne({
    _id: new mongoose.Types.ObjectId(clothingId),
    userId: owner
  });
  if (result.deletedCount === 0) {
    const error = new Error('Clothing item not found');
    error.statusCode = 404;
    throw error;
  }
};

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
