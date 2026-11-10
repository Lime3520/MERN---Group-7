const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateWithFallback } = require('../config/gemini');

const request = { contents: [{ inlineData: { mimeType: 'image/png', data: 'test' } }], config: { responseMimeType: 'application/json', responseJsonSchema: { type: 'object' } } };

test('primary model success makes only one request', async () => {
  const calls = [];
  const ai = { models: { generateContent: async (value) => { calls.push(value); return { text: '{}' }; } } };
  assert.deepEqual(await generateWithFallback(ai, request), { text: '{}' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, process.env.GEMINI_MODEL || 'gemini-3.8-flash');
  assert.equal(calls[0].config.httpOptions.retryOptions.attempts, 1);
  assert.equal(calls[0].config.httpOptions.timeout, 30000);
});

test('overload switches models preserving image and JSON schema', async () => {
  const calls = [];
  const ai = { models: { generateContent: async (value) => {
    calls.push(value);
    if (calls.length === 1) throw Object.assign(new Error('overloaded'), { status: 503 });
    return { text: '{"ok":true}' };
  } } };
  assert.equal((await generateWithFallback(ai, request)).text, '{"ok":true}');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].model, process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.7-flash');
  assert.deepEqual(calls[1].contents, request.contents);
  assert.deepEqual(calls[1].config.responseJsonSchema, request.config.responseJsonSchema);
});

test('invalid input, credentials, unknown model and quota errors do not switch', async () => {
  for (const status of [400, 401, 403, 404, 429]) {
    let calls = 0;
    const failure = Object.assign(new Error('failure'), { status });
    const ai = { models: { generateContent: async () => { calls++; throw failure; } } };
    await assert.rejects(generateWithFallback(ai, request), (error) => error === failure);
    assert.equal(calls, 1);
  }
});

test('both overloaded models return a clear 503 and stop', async () => {
  let calls = 0;
  const ai = { models: { generateContent: async () => { calls++; throw { status: 503 }; } } };
  await assert.rejects(generateWithFallback(ai, request), { statusCode: 503, message: 'Gemini models are temporarily busy or unavailable. Please try again shortly.' });
  assert.equal(calls, 2);
});

test('timeout falls back once', async () => {
  let calls = 0;
  const ai = { models: { generateContent: async () => {
    if (++calls === 1) throw Object.assign(new Error('timeout'), { name: 'AbortError' });
    return { text: '{}' };
  } } };
  await generateWithFallback(ai, request);
  assert.equal(calls, 2);
});
