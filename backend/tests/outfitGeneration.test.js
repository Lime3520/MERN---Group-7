const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { parseOutfitRequest, compactWardrobe, validateOutfitResponse } = require('../utils/outfitGeneration');
const { generateOutfits } = require('../services/outfitService');
const { getUserWardrobe } = require('../services/wardrobeService');

const analysis = {
  name: 'Blue shirt', category: 'top', subcategory: 'shirt', intendedAudience: 'unisex',
  primaryColor: 'blue', secondaryColors: [], pattern: 'solid', materials: ['unknown'],
  fit: 'regular', styleTags: ['casual'], seasons: ['summer'], occasions: ['casual'],
  formality: 'casual', warmth: 'light', description: 'A blue shirt.', confidence: 0.8
};
const items = [
  { _id: '000000000000000000000001', analysis },
  { _id: '000000000000000000000002', analysis: { ...analysis, category: 'bottom', subcategory: 'jeans' } }
];
const result = () => ({
  outfits: [{ name: 'Everyday blue', clothingIds: items.map((item) => item._id), explanation: 'A casual combination.' }],
  message: 'Only one distinct combination is available.'
});
const preferences = parseOutfitRequest({});

test('requests support random defaults and specific preferences', () => {
  assert.equal(preferences.mode, 'random');
  assert.equal(preferences.count, 3);
  assert.deepEqual(parseOutfitRequest({ mode: 'specific', prompt: '  Dinner date  ', count: 5, weather: 'Cool' }), {
    mode: 'specific', prompt: 'Dinner date', count: 5, weather: 'Cool', occasion: '', style: ''
  });
});

test('requests reject invalid input and caller-supplied ownership', () => {
  for (const body of [null, [], { mode: 'other' }, { mode: 'specific' }, { count: 6 },
    { count: '3' }, { weather: {} }, { prompt: 'x'.repeat(1001) }, { userId: 'another-user' }]) {
    assert.throws(() => parseOutfitRequest(body), { statusCode: 400 });
  }
});

test('compaction excludes invalid analysis, images and unrelated fields', () => {
  const compact = compactWardrobe([
    { ...items[0], imageUrl: 'private-url', userId: 'private-user' },
    { _id: 'bad', analysis: {} }
  ]);
  assert.equal(compact.length, 1);
  assert.equal(compact[0].id, items[0]._id);
  assert.equal(compact[0].imageUrl, undefined);
  assert.equal(compact[0].userId, undefined);
  assert.equal(compact[0].description, undefined);
});

test('service sends preferences and wardrobe in one structured Gemini call', async () => {
  let calls = 0;
  const client = { models: { generateContent: async (request) => {
    calls++;
    const input = JSON.parse(request.contents);
    assert.deepEqual(input.preferences, preferences);
    assert.equal(input.wardrobe.length, 2);
    assert.equal(request.config.responseMimeType, 'application/json');
    assert.equal(request.config.httpOptions.timeout, 30000);
    return { text: JSON.stringify(result()) };
  } } };
  assert.deepEqual(await generateOutfits(items, preferences, client), result());
  assert.equal(calls, 1);
});

test('empty or invalid wardrobes do not call Gemini', async () => {
  let called = false;
  const client = { models: { generateContent: async () => { called = true; } } };
  await assert.rejects(generateOutfits([], preferences, client), { statusCode: 422 });
  await assert.rejects(generateOutfits([{ _id: 'bad', analysis: {} }], preferences, client), { statusCode: 422 });
  assert.equal(called, false);
});

test('response validation accepts a shortage with an explanation', () => {
  const wardrobe = compactWardrobe(items);
  assert.deepEqual(validateOutfitResponse(result(), wardrobe, 3), result());
  assert.deepEqual(validateOutfitResponse({ outfits: [], message: 'No suitable formal clothing.' }, wardrobe, 3), {
    outfits: [], message: 'No suitable formal clothing.'
  });
});

test('response validation rejects foreign IDs and duplicate items or outfits', () => {
  const wardrobe = compactWardrobe(items);
  const unknownId = result();
  unknownId.outfits[0].clothingIds.push('another-users-item');
  const duplicateId = result();
  duplicateId.outfits[0].clothingIds.push(items[0]._id);
  const duplicateOutfit = result();
  duplicateOutfit.outfits.push({ ...duplicateOutfit.outfits[0], clothingIds: [...duplicateOutfit.outfits[0].clothingIds].reverse() });
  for (const value of [unknownId, duplicateId, duplicateOutfit]) {
    assert.throws(() => validateOutfitResponse(value, wardrobe, 3), { statusCode: 502 });
  }
});

test('response validation rejects malformed contracts', () => {
  const wardrobe = compactWardrobe(items);
  for (const value of [null, [], {}, { ...result(), extra: true },
    { outfits: [], message: '' }, { outfits: [{}], message: '' },
    { outfits: [result().outfits[0]], message: 3 }]) {
    assert.throws(() => validateOutfitResponse(value, wardrobe, 3), { statusCode: 502 });
  }
});

test('Gemini errors and malformed JSON become controlled 502 errors', async () => {
  const broken = { models: { generateContent: async () => { throw new Error('private provider details'); } } };
  await assert.rejects(generateOutfits(items, preferences, broken), {
    statusCode: 502, message: 'Gemini could not generate outfits. Please try again.'
  });
  const malformed = { models: { generateContent: async () => ({ text: 'not JSON' }) } };
  await assert.rejects(generateOutfits(items, preferences, malformed), { statusCode: 502 });
});

test('database adapter scopes reads to the authenticated ObjectId and limits results', async () => {
  const userId = '123456789012345678901234';
  const cursor = {
    sort(value) { assert.deepEqual(value, { _id: 1 }); return this; },
    limit(value) { assert.equal(value, 201); return this; },
    async toArray() { return items; }
  };
  const stub = mock.method(mongoose.connection, 'collection', (name) => {
    assert.equal(name, 'clothingitems');
    return { find(filter, options) {
      assert.deepEqual(Object.keys(filter), ['userId']);
      assert.equal(filter.userId.toHexString(), userId);
      assert.deepEqual(options.projection, { _id: 1, analysis: 1 });
      return cursor;
    } };
  });
  try {
    assert.deepEqual(await getUserWardrobe(userId), items);
    await assert.rejects(getUserWardrobe({ $ne: null }), { statusCode: 401 });
    assert.equal(stub.mock.callCount(), 1);
    cursor.toArray = async () => Array(201).fill(items[0]);
    await assert.rejects(getUserWardrobe(userId), { statusCode: 422 });
  } finally { stub.mock.restore(); }
});
