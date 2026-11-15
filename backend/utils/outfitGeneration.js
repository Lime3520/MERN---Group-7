const { validateClothingAnalysis } = require('./clothingAnalysis');

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

// All preferences are optional except the prompt for a specific request.
const parseOutfitRequest = (body = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail('Request body must be an object');
  }
  const allowed = ['mode', 'prompt', 'occasion', 'weather', 'style', 'count'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    fail('Allowed fields: mode, prompt, occasion, weather, style, count');
  }
  const mode = body.mode === undefined ? 'random' : body.mode;
  if (!['random', 'specific'].includes(mode)) fail('mode must be random or specific');
  const count = body.count === undefined ? 3 : body.count;
  if (!Number.isInteger(count) || count < 3 || count > 5) {
    fail('count must be an integer from 3 to 5');
  }

  const request = { mode, count };
  for (const key of ['prompt', 'occasion', 'weather', 'style']) {
    const value = body[key] === undefined ? '' : body[key];
    const limit = key === 'prompt' ? 1000 : 200;
    if (typeof value !== 'string' || value.length > limit) {
      fail(`${key} must be a string of at most ${limit} characters`);
    }
    request[key] = value.trim();
  }
  if (mode === 'specific' && !request.prompt) {
    fail('prompt is required for specific suggestions');
  }
  return request;
};

// Send only bounded attributes used for matching, never image bytes or account data.
const compactWardrobe = (items) => items
  .filter((item) => item._id && validateClothingAnalysis(item.analysis))
  .map(({ _id, analysis: a }) => ({
    id: String(_id),
    category: a.category,
    type: a.subcategory.slice(0, 80),
    colors: [a.primaryColor, ...a.secondaryColors].slice(0, 6).map((s) => s.slice(0, 40)),
    pattern: a.pattern,
    materials: a.materials.slice(0, 5).map((s) => s.slice(0, 40)),
    fit: a.fit,
    styles: a.styleTags.slice(0, 5).map((s) => s.slice(0, 40)),
    seasons: [...new Set(a.seasons)],
    occasions: [...new Set(a.occasions)],
    formality: a.formality,
    warmth: a.warmth
  }));

const outfitResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['outfits', 'message'],
  properties: {
    outfits: {
      type: 'array', maxItems: 5,
      items: {
        type: 'object', additionalProperties: false,
        required: ['name', 'clothingIds', 'explanation'],
        properties: {
          name: { type: 'string' },
          clothingIds: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string' } },
          explanation: { type: 'string' }
        }
      }
    },
    message: { type: 'string', description: 'Explain any shortage of outfits or unmet preferences; otherwise empty.' }
  }
};

const hasKeys = (value, keys) => value && typeof value === 'object' &&
  !Array.isArray(value) && Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));
const isText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

const validateOutfitResponse = (value, wardrobe, count) => {
  const invalid = () => fail('Gemini returned invalid outfit recommendations', 502);
  if (!hasKeys(value, ['outfits', 'message']) || !Array.isArray(value.outfits) ||
      value.outfits.length > count || typeof value.message !== 'string' || value.message.length > 1000) invalid();
  if (value.outfits.length < count && !value.message.trim()) invalid();

  const allowedIds = new Set(wardrobe.map((item) => item.id));
  const seenOutfits = new Set();
  for (const outfit of value.outfits) {
    if (!hasKeys(outfit, ['name', 'clothingIds', 'explanation']) ||
        !isText(outfit.name, 120) || !isText(outfit.explanation, 1000) ||
        !Array.isArray(outfit.clothingIds) || outfit.clothingIds.length < 1 ||
        outfit.clothingIds.length > 12 ||
        outfit.clothingIds.some((id) => typeof id !== 'string' || !allowedIds.has(id)) ||
        new Set(outfit.clothingIds).size !== outfit.clothingIds.length) invalid();

    const signature = [...outfit.clothingIds].sort().join(',');
    if (seenOutfits.has(signature)) invalid();
    seenOutfits.add(signature);
  }
  return value;
};

module.exports = { parseOutfitRequest, compactWardrobe, outfitResponseSchema, validateOutfitResponse };
