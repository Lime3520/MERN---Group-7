// Defines endpoints such as POST /api/auth/login and POST /api/auth/register
// Mounts as auth/ under /api/


const express = require('express');
const router = express.Router();

// import registration logic function from controller
const { register, verifyEmail, forgotPassword, resetPassword, login } = require('../controllers/authController'); 

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/verify-email
router.post('/verify-email', verifyEmail);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/auth/login
router.post('/login', login);

// TEMPORARY: A test ping (GET) to ensure that the server runs and can access the auth.js route
router.get('/test', (req, res) => {
  res.json({ message: 'Authentication routes are working' });
});

module.exports = router;