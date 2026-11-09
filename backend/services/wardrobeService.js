const mongoose = require('mongoose');

// Database integration boundary: change this query if the DB team's schema differs.
// Expected document: { _id: ObjectId, userId: ObjectId, analysis: { ... } }.
// This reads the collection directly without defining or changing a Mongoose model.
exports.getUserWardrobe = async (userId) => {
  if (typeof userId !== 'string' || !/^[a-f\d]{24}$/i.test(userId)) {
    const error = new Error('Invalid authenticated user ID');
    error.statusCode = 401;
    throw error;
  }

  const items = await mongoose.connection.collection('clothingitems')
    .find({ userId: new mongoose.Types.ObjectId(userId) }, {
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
