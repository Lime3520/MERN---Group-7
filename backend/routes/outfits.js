const express = require('express');
const { requireAuth } = require('../middleware/tokenAuth');
const { generateOutfitSuggestions } = require('../controllers/outfitController');

const router = express.Router();
router.post('/generate', requireAuth, generateOutfitSuggestions);
module.exports = router;
