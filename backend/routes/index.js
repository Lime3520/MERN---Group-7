// Collects route groups and mounts them under the API prefix.


const express = require('express');
const router = express.Router();

const authRouter = require('./auth');

router.use('/auth', authRouter);

module.exports = router;