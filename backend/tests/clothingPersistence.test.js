const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const {
  saveClothingItem,
  getUserClothingItems,
  getUserClothingImage
} = require('../services/clothingService');

const userId = '123456789012345678901234';
const clothingId = 'abcdefabcdefabcdefabcdef';

test('clothing photos and analysis are saved with the authenticated owner', async () => {
  const image = Buffer.from('photo');
  const analysis = { name: 'Blue shirt' };
  const insertedId = new mongoose.Types.ObjectId(clothingId);
  const stub = mock.method(mongoose.connection, 'collection', (name) => {
    assert.equal(name, 'clothingitems');
    return {
      async insertOne(document) {
        assert.equal(document.userId.toHexString(), userId);
        assert.equal(document.image, image);
        assert.equal(document.mimeType, 'image/jpeg');
        assert.deepEqual(document.analysis, analysis);
        assert.ok(document.createdAt instanceof Date);
        return { insertedId };
      }
    };
  });

  try {
    const saved = await saveClothingItem({ userId, image, mimeType: 'image/jpeg', analysis });
    assert.deepEqual(saved, { id: clothingId, createdAt: saved.createdAt });
    assert.ok(saved.createdAt instanceof Date);
    await assert.rejects(saveClothingItem({ userId: 'not-an-id', image, mimeType: 'image/jpeg', analysis }), {
      statusCode: 401
    });
    assert.equal(stub.mock.callCount(), 1);
  } finally {
    stub.mock.restore();
  }
});

test('wardrobe listing is owner-scoped and excludes image bytes', async () => {
  let cursor;
  const records = [{ _id: new mongoose.Types.ObjectId(clothingId), analysis: { name: 'Blue shirt' } }];
  const stub = mock.method(mongoose.connection, 'collection', (name) => {
    assert.equal(name, 'clothingitems');
    return {
      find(filter, options) {
        assert.equal(filter.userId.toHexString(), userId);
        assert.deepEqual(options.projection, { _id: 1, analysis: 1, mimeType: 1, createdAt: 1 });
        cursor = {
          sort(value) { assert.deepEqual(value, { _id: -1 }); return this; },
          limit(value) { assert.equal(value, 201); return this; },
          async toArray() { return records; }
        };
        return cursor;
      }
    };
  });

  try {
    assert.deepEqual(await getUserClothingItems(userId), [{
      id: clothingId,
      analysis: { name: 'Blue shirt' },
      mimeType: undefined,
      createdAt: undefined
    }]);
    cursor.toArray = async () => Array(201).fill(records[0]);
    await assert.rejects(getUserClothingItems(userId), { statusCode: 422 });
    await assert.rejects(getUserClothingItems('not-an-id'), { statusCode: 401 });
  } finally {
    stub.mock.restore();
  }
});

test('photo retrieval requires both a valid clothing ID and its owner', async () => {
  const image = Buffer.from('photo');
  let shouldFind = true;
  const stub = mock.method(mongoose.connection, 'collection', (name) => {
    assert.equal(name, 'clothingitems');
    return {
      async findOne(filter, options) {
        assert.equal(filter._id.toHexString(), clothingId);
        assert.equal(filter.userId.toHexString(), userId);
        assert.deepEqual(options.projection, { _id: 0, image: 1, mimeType: 1 });
        return shouldFind ? { image, mimeType: 'image/jpeg' } : null;
      }
    };
  });

  try {
    assert.deepEqual(await getUserClothingImage(userId, clothingId), { image, mimeType: 'image/jpeg' });
    await assert.rejects(getUserClothingImage(userId, 'invalid'), { statusCode: 400 });
    assert.equal(stub.mock.callCount(), 1);
    shouldFind = false;
    await assert.rejects(getUserClothingImage(userId, clothingId), { statusCode: 404 });
  } finally {
    stub.mock.restore();
  }
});
