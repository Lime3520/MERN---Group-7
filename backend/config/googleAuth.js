const { OAuth2Client } = require('google-auth-library');

let client;
let configuredClientId;

exports.verifyGoogleIdToken = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error = new Error('GOOGLE_CLIENT_ID is missing from the .env file');
    error.statusCode = 500;
    throw error;
  }

  if (!client || configuredClientId !== clientId) {
    client = new OAuth2Client(clientId);
    configuredClientId = clientId;
  }

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    return ticket.getPayload();
  } catch (cause) {
    const error = new Error('Google ID token is invalid or expired');
    error.statusCode = 401;
    error.cause = cause;
    throw error;
  }
};
