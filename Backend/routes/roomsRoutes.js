const express = require('express');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { createRoom, getRoom } = require('../controllers/roomsController');

const router = express.Router();
router.post('/', auth(true), asyncHandler(createRoom));
router.get('/:code', auth(true), asyncHandler(getRoom));

module.exports = router;
