process.env.JWT_SECRET = 'clothing-delete-test-only-secret';
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const { createToken } = require('../middleware/tokenAuth');
const { errorHandler } = require('../middleware/errorHandler');

const owner = '123456789012345678901234';
const other = '123456789012345678901235';
const clothingId = 'abcdefabcdefabcdefabcdef';

test('DELETE clothing authenticates, validates IDs, and removes only the owner’s document', async () => {
  let record = {
    _id: new mongoose.Types.ObjectId(clothingId),
    userId: new mongoose.Types.ObjectId(owner),
    image: Buffer.from('photo'), analysis: { name: 'Shirt' }
  };
  const stub = mock.method(mongoose.connection, 'collection', (name) => {
    assert.equal(name, 'clothingitems');
    return { async deleteOne(filter) {
      assert.deepEqual(Object.keys(filter).sort(), ['_id', 'userId']);
      assert.ok(filter._id instanceof mongoose.Types.ObjectId);
      assert.ok(filter.userId instanceof mongoose.Types.ObjectId);
      if (record && record._id.equals(filter._id) && record.userId.equals(filter.userId)) {
        record = null;
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    } };
  });
  const app = express();
  app.use(express.json());
  app.use('/api/clothing', require('../routes/clothing'));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const base = `http://127.0.0.1:${server.address().port}/api/clothing`;
    const headers = (id) => ({ Authorization: `Bearer ${createToken({ _id: id })}`, 'Content-Type': 'application/json' });
    const remove = (id, options = {}) => fetch(`${base}/${id}`, { method: 'DELETE', ...options });
    assert.equal((await remove(clothingId)).status, 401);
    assert.equal((await remove(clothingId, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
    assert.equal((await remove('invalid', { headers: headers(owner) })).status, 400);
    assert.equal((await remove(clothingId, { headers: headers('invalid-owner') })).status, 401);
    assert.equal(stub.mock.callCount(), 0);
    const foreign = await remove(clothingId, { headers: headers(other), body: JSON.stringify({ userId: owner }) });
    assert.equal(foreign.status, 404);
    assert.deepEqual(await foreign.json(), { error: 'Clothing item not found' });
    assert.ok(record, 'Another user must not delete the photo or its analysis');
    assert.equal((await remove('aaaaaaaaaaaaaaaaaaaaaaaa', { headers: headers(owner) })).status, 404);
    assert.ok(record);
    const success = await remove(clothingId, { headers: headers(owner) });
    assert.equal(success.status, 204);
    assert.equal(await success.text(), '');
    assert.equal(record, null, 'Delete removes the whole document, including image and analysis');
    assert.equal((await remove(clothingId, { headers: headers(owner) })).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    stub.mock.restore();
  }
});
