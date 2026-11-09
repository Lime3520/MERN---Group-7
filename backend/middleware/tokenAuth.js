// Handles JWT session token creation and verification

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');


// Create a token after successful login or registration.
// Generates a signed token containing the user's database ID. The token expires after the configured duration.
exports.createToken = (user) => 
    jwt.sign({ sub: String(user._id) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } );



// Checks the Authorization header for a Bearer token. 
// If the token is valid, it stores the user's ID in req.userId and lets the request continue. 
// Otherwise, it returns HTTP 401 Unauthorized.
exports.requireAuth = (req, res, next) => {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({error: 'Authentication required'});
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } 
  catch (err) {
    return res.status(401).json({error: 'Invalid or expired token'});
  }
};



// Ensure the authenticated user can only access their own account.
// Use this after requireAuth on routes containing :userId.
// Compares the authenticated user's ID against the :userId in the URL. If they differ, it returns HTTP 403 Forbidden.
exports.requireSelf = (req, res, next) => {

  if (req.params.userId !== req.userId) {
    return res.status(403).json({error: 'You can only access your own account'});
  }

  next();
};

