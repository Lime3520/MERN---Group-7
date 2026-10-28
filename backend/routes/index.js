// Organizes and mounts API routes under /api


const express = require('express');
const router = express.Router();

const authRouter = require('./auth');

router.use('/auth', authRouter);

module.exports = router;