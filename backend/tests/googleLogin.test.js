process.env.JWT_SECRET ||= 'google-login-test-secret';
process.env.GOOGLE_CLIENT_ID ||= 'google-login-test-client-id';

const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { OAuth2Client } = require('google-auth-library');
const User = require('../mongoosemodels/User');
const { googleLogin } = require('../controllers/authController');

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('Google login verifies an ID token and creates a verified account', async () => {
  const googleUser = {
    sub: 'google-subject-123',
    email: 'person@example.com',
    email_verified: true,
    name: 'Google Person'
  };
  const user = {
    _id: '123456789012345678901234',
    username: googleUser.name,
    email: googleUser.email,
    createdAt: new Date()
  };
  const verify = mock.method(OAuth2Client.prototype, 'verifyIdToken', async (options) => {
    assert.equal(options.idToken, 'valid-id-token');
    assert.equal(options.audience, process.env.GOOGLE_CLIENT_ID);
    return { getPayload: () => googleUser };
  });
  const findOne = mock.method(User, 'findOne', async () => null);
  const create = mock.method(User, 'create', async (document) => {
    assert.deepEqual(document, {
      username: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.sub,
      emailVerified: true
    });
    return user;
  });

  try {
    const response = createResponse();
    await googleLogin({ body: { credential: 'valid-id-token' } }, response, (error) => { throw error; });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.user.email, googleUser.email);
    assert.ok(response.body.token);
    assert.equal(findOne.mock.callCount(), 2);
    assert.equal(create.mock.callCount(), 1);
    assert.equal(verify.mock.callCount(), 1);
  } finally {
    verify.mock.restore();
    findOne.mock.restore();
    create.mock.restore();
  }
});

test('Google login does not silently link an existing password account', async () => {
  const verify = mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => ({
    getPayload: () => ({
      sub: 'google-subject-456',
      email: 'existing@example.com',
      email_verified: true
    })
  }));
  const findOne = mock.method(User, 'findOne', async (filter) => (
    Object.hasOwn(filter, 'googleId') ? null : { _id: 'existing-account' }
  ));
  const create = mock.method(User, 'create', async () => {
    throw new Error('Should not create or link an existing account');
  });

  try {
    const response = createResponse();
    await googleLogin({ body: { idToken: 'valid-id-token' } }, response, (error) => { throw error; });
    assert.equal(response.statusCode, 409);
    assert.match(response.body.error, /already exists/);
    assert.equal(create.mock.callCount(), 0);
  } finally {
    verify.mock.restore();
    findOne.mock.restore();
    create.mock.restore();
  }
});

test('Google login rejects a missing ID token', async () => {
  const response = createResponse();
  await googleLogin({ body: {} }, response, (error) => { throw error; });
  assert.equal(response.statusCode, 400);
});

test('Google login recovers when another request creates the account first', async () => {
  const googleUser = {
    sub: 'google-subject-race',
    email: 'race@example.com',
    email_verified: true
  };
  const user = {
    _id: 'abcdefabcdefabcdefabcdef',
    username: 'Race User',
    email: googleUser.email,
    createdAt: new Date()
  };
  const verify = mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => ({
    getPayload: () => googleUser
  }));
  const findOne = mock.method(User, 'findOne', async (filter) => (
    Object.hasOwn(filter, 'googleId') ? user : null
  ));
  const create = mock.method(User, 'create', async () => {
    const error = new Error('Duplicate key');
    error.code = 11000;
    throw error;
  });

  try {
    const response = createResponse();
    await googleLogin({ body: { idToken: 'valid-id-token' } }, response, (error) => { throw error; });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.user.id, user._id);
    assert.equal(findOne.mock.callCount(), 3);
    assert.equal(create.mock.callCount(), 1);
  } finally {
    verify.mock.restore();
    findOne.mock.restore();
    create.mock.restore();
  }
});
