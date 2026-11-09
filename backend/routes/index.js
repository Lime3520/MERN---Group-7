// Organizes and mounts API routes under /api


const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const clothingRouter = require('./clothing');

router.use('/auth', authRouter);
router.use('/clothing', clothingRouter);

module.exports = router;
