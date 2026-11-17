const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { saveWardrobeItem, getUserWardrobe } = require('../services/wardrobeService');
const { generateOutfits } = require('../services/outfitService');
const { parseOutfitRequest } = require('../utils/outfitGeneration');

const owner = '123456789012345678901234';
const other = '123456789012345678901235';
const analysis = {
  name: 'Blue shirt', category: 'top', subcategory: 'shirt', intendedAudience: 'unisex',
  primaryColor: 'blue', secondaryColors: [], pattern: 'solid', materials: ['unknown'],
  fit: 'regular', styleTags: ['casual'], seasons: ['summer'], occasions: ['casual'],
  formality: 'casual', warmth: 'light', description: 'A blue shirt.', confidence: 0.8
};

function memoryCollection() {
  const records = [];
  const stub = mock.method(mongoose.connection, 'collection', (name) => {
    assert.equal(name, 'clothingitems');
    return {
      async insertOne(item) { records.push(item); return { insertedId: item._id }; },
      find({ userId }) {
        return {
          sort() { return this; }, limit() { return this; },
          async toArray() {
            return records.filter((item) => item.userId.equals(userId))
              .map(({ _id, analysis }) => ({ _id, analysis }));
          }
        };
      }
    };
  });
  return { records, stub };
}

test('saved items survive a fresh wardrobe read and feed outfit generation for their owner only', async () => {
  const { records, stub } = memoryCollection();
  try {
    const first = await saveWardrobeItem(owner, { analysis });
    const second = await saveWardrobeItem(owner, { analysis: { ...analysis, category: 'bottom', name: 'Jeans' } });
    await saveWardrobeItem(other, { analysis });
    assert.ok(records[0].userId instanceof mongoose.Types.ObjectId);
    assert.ok(first.createdAt instanceof Date);
    assert.equal(first.userId, undefined);
    const wardrobe = await getUserWardrobe(owner);
    assert.equal(wardrobe.length, 2);
    assert.equal((await getUserWardrobe(other)).length, 1);
    const client = { models: { generateContent: async ({ contents }) => {
      const input = JSON.parse(contents);
      assert.deepEqual(input.wardrobe.map((item) => item.id), [String(first._id), String(second._id)]);
      return { text: JSON.stringify({ outfits: [{ name: 'Casual', clothingIds: input.wardrobe.map((item) => item.id), explanation: 'Shirt and jeans.' }], message: 'One combination available.' }) };
    } } };
    const result = await generateOutfits(wardrobe, parseOutfitRequest({}), client);
    assert.equal(result.outfits.length, 1);
  } finally { stub.mock.restore(); }
});

test('invalid analysis, extra fields and spoofed ownership never reach the database', async () => {
  const { records, stub } = memoryCollection();
  try {
    for (const body of [null, [], {}, { analysis: {} }, { analysis, userId: other },
      { analysis, _id: other }, { analysis: { ...analysis, image: 'unexpected' } },
      { analysis: { ...analysis, confidence: 2 } },
      { analysis: { ...analysis, description: 'x'.repeat(17000) } }]) {
      await assert.rejects(saveWardrobeItem(owner, body), { statusCode: 400 });
    }
    await assert.rejects(saveWardrobeItem({ $ne: null }, { analysis }), { statusCode: 401 });
    assert.equal(records.length, 0);
    assert.equal(stub.mock.callCount(), 0);
  } finally { stub.mock.restore(); }
});

test('HTTP save/list require authentication and use the JWT owner', async () => {
  process.env.JWT_SECRET = 'wardrobe-test-only-secret';
  const express = require('express');
  const { createToken } = require('../middleware/tokenAuth');
  const { errorHandler } = require('../middleware/errorHandler');
  const app = express();
  app.use(express.json());
  app.use('/api/clothing', require('../routes/clothing'));
  app.use(errorHandler);
  const { records, stub } = memoryCollection();
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const url = `http://127.0.0.1:${server.address().port}/api/clothing`;
    for (const method of ['GET', 'POST']) {
      assert.equal((await fetch(url, { method })).status, 401);
    }
    const headers = { Authorization: `Bearer ${createToken({ _id: owner })}`, 'Content-Type': 'application/json' };
    assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ analysis, userId: other }) })).status, 400);
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ analysis }) });
    assert.equal(response.status, 201);
    const saved = (await response.json()).item;
    assert.match(saved._id, /^[a-f\d]{24}$/);
    assert.equal(records[0].userId.toHexString(), owner);
    const ownItems = await (await fetch(url, { headers })).json();
    assert.equal(ownItems.items[0].id, saved._id);
    const others = await (await fetch(url, { headers: { Authorization: `Bearer ${createToken({ _id: other })}` } })).json();
    assert.deepEqual(others.items, []);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    stub.mock.restore();
  }
});
