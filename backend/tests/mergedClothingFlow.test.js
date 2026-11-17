process.env.JWT_SECRET = 'merged-clothing-test-only';
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const express = require('express');
const gemini = require('../config/gemini');
const { createToken } = require('../middleware/tokenAuth');
const { errorHandler } = require('../middleware/errorHandler');

const owner = '123456789012345678901234';
const other = '123456789012345678901235';
const analysis = {
  name: 'Blue shirt', category: 'top', subcategory: 'shirt', intendedAudience: 'unisex',
  primaryColor: 'blue', secondaryColors: [], pattern: 'solid', materials: ['unknown'],
  fit: 'regular', styleTags: ['casual'], seasons: ['summer'], occasions: ['casual'],
  formality: 'casual', warmth: 'light', description: 'A blue shirt.', confidence: 0.8
};

test('automatic upload saves a photo after fallback, scopes image access and feeds outfit generation', async () => {
  const records = [];
  const models = [];
  let failAnalysis = false;
  const ai = { models: { generateContent: async (request) => {
    models.push(request.model);
    if (Array.isArray(request.contents)) {
      if (failAnalysis) return { text: '{}' };
      if (models.length === 1) throw Object.assign(new Error('Busy'), { status: 503 });
      return { text: JSON.stringify(analysis) };
    }
    const input = JSON.parse(request.contents);
    assert.equal(input.wardrobe.length, 1);
    assert.equal(input.wardrobe[0].id, String(records[0]._id));
    return { text: JSON.stringify({ outfits: [], message: 'Add bottoms and footwear for a complete outfit.' }) };
  } } };
  const clientStub = mock.method(gemini, 'getGeminiClient', async () => ai);
  const dbStub = mock.method(mongoose.connection, 'collection', () => ({
    async insertOne(item) {
      item._id = new mongoose.Types.ObjectId(); records.push(item);
      return { insertedId: item._id };
    },
    find({ userId }) {
      return { sort() { return this; }, limit() { return this; },
        async toArray() { return records.filter(item => item.userId.equals(userId)).map(({ image, ...item }) => item); } };
    },
    async findOne({ _id, userId }) { return records.find(item => item._id.equals(_id) && item.userId.equals(userId)); }
  }));
  const app = express(); app.use(express.json());
  app.use('/api/clothing', require('../routes/clothing'));
  app.use('/api/outfits', require('../routes/outfits'));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const headers = { Authorization: `Bearer ${createToken({ _id: owner })}` };
    const form = () => { const body = new FormData(); body.append('image', new Blob(['test-photo'], { type: 'image/jpeg' }), 'photo.jpg'); return body; };
    assert.equal((await fetch(`${base}/clothing/analyze`, { method: 'POST', body: form() })).status, 401);
    const upload = await fetch(`${base}/clothing/analyze`, { method: 'POST', headers, body: form() });
    assert.equal(upload.status, 201);
    const saved = await upload.json();
    assert.deepEqual(models, [process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite']);
    assert.equal(records.length, 1);
    assert.equal(records[0].userId.toHexString(), owner);
    const list = await (await fetch(`${base}/clothing`, { headers })).json();
    assert.equal(list.items[0].id, saved.clothing.id);
    assert.equal(list.items[0].image, undefined);
    const photo = await fetch(`${base}/clothing/${saved.clothing.id}/image`, { headers });
    assert.equal(photo.status, 200); assert.equal(await photo.text(), 'test-photo');
    assert.equal((await fetch(`${base}/clothing/${saved.clothing.id}/image`, { headers: { Authorization: `Bearer ${createToken({ _id: other })}` } })).status, 404);
    const outfits = await fetch(`${base}/outfits/generate`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ style: 'casual' }) });
    assert.equal(outfits.status, 200);
    assert.deepEqual((await outfits.json()).outfits, []);
    failAnalysis = true;
    assert.equal((await fetch(`${base}/clothing/analyze`, { method: 'POST', headers, body: form() })).status, 502);
    assert.equal(records.length, 1);
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    clientStub.mock.restore(); dbStub.mock.restore();
  }
});
