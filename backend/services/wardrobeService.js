const mongoose = require('mongoose');
const { clothingAnalysisSchema, validateClothingAnalysis } = require('../utils/clothingAnalysis');

function ownerId(userId) {
  if (typeof userId !== 'string' || !/^[a-f\d]{24}$/i.test(userId)) {
    const error = new Error('Invalid authenticated user ID');
    error.statusCode = 401;
    throw error;
  }
  return new mongoose.Types.ObjectId(userId);
}

// Only store validated attributes; ownership always comes from the verified JWT.
exports.saveWardrobeItem = async (userId, body) => {
  const userObjectId = ownerId(userId);
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some((key) => key !== 'analysis') ||
      !validateClothingAnalysis(body.analysis) ||
      Object.keys(body.analysis).some((key) => !Object.hasOwn(clothingAnalysisSchema.properties, key)) ||
      Buffer.byteLength(JSON.stringify(body.analysis)) > 16384) {
    const error = new Error('Provide only a valid clothing analysis (up to 16 KB)');
    error.statusCode = 400;
    throw error;
  }

  const item = {
    _id: new mongoose.Types.ObjectId(),
    userId: userObjectId,
    analysis: structuredClone(body.analysis),
    createdAt: new Date()
  };
  await mongoose.connection.collection('clothingitems').insertOne(item);
  return { _id: item._id, analysis: item.analysis, createdAt: item.createdAt };
};

exports.getUserWardrobe = async (userId) => {
  const userObjectId = ownerId(userId);

  const items = await mongoose.connection.collection('clothingitems')
    .find({ userId: userObjectId }, {
      projection: { _id: 1, analysis: 1 }
    })
    .sort({ _id: 1 })
    .limit(201)
    .toArray();

  // Avoid silently dropping items or sending an unbounded prompt to Gemini.
  if (items.length > 200) {
    const error = new Error('Outfit generation currently supports up to 200 wardrobe items');
    error.statusCode = 422;
    throw error;
  }

  return items;
};
