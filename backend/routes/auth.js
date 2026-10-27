// Defines the login and registration URLs and connects them to controller functions.


const express = require('express');
const router = express.Router();

// TEMPORARY: A test ping to ensure that the server runs and can access the auth.js route
router.get('/test', (req, res) => {
  res.json({ message: 'Authentication routes are working' });
});

module.exports = router;