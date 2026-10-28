// Defines endpoints such as POST /api/auth/login and POST /api/auth/register
// Mounts as auth/ under /api/


const express = require('express');
const router = express.Router();

// import registration logic function from controller
const { register } = require('../controllers/authController'); 

// POST /api/auth/register
router.post('/register', register);

// TEMPORARY: A test ping to ensure that the server runs and can access the auth.js route
router.get('/test', (req, res) => {
  res.json({ message: 'Authentication routes are working' });
});

module.exports = router;