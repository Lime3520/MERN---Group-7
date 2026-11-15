// Organizes and mounts API routes under /api


const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const clothingRouter = require('./clothing');
const outfitRouter = require('./outfits');

router.use('/auth', authRouter);
router.use('/clothing', clothingRouter);
router.use('/outfits', outfitRouter);

module.exports = router;
