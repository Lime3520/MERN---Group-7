const express = require('express');
const multer = require('multer');
const { analyzeClothingImage } = require('../controllers/clothingController');
const { requireAuth } = require('../middleware/tokenAuth');

const router = express.Router();

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      const error = new Error('Only JPEG, PNG, WebP, HEIC, and HEIF images are supported');
      error.statusCode = 415;
      return callback(error);
    }

    callback(null, true);
  }
});

router.post('/analyze', requireAuth, upload.single('image'), analyzeClothingImage);

module.exports = router;

