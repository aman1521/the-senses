// routes/aiStreamRoutes.js
const express = require("express");
const { streamAssist } = require("./aiStreamController");
const router = express.Router();

router.post("/stream", streamAssist);

module.exports = router;
