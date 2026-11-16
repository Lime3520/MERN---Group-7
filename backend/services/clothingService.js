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
  const createdAt = new Date();
  const result = await mongoose.connection.collection('clothingitems').insertOne({
    userId: getUserId(userId),
    image,
    mimeType,
    analysis,
    createdAt
  });

  return { id: String(result.insertedId), createdAt };
};

exports.getUserClothingItems = async (userId) => {
  const items = await mongoose.connection.collection('clothingitems')
    .find({ userId: getUserId(userId) }, {
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
