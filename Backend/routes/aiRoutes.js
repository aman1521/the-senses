const express = require("express");
const { assist, generate } = require("../controllers/aiController");
const router = express.Router();

router.post("/assist", assist);
router.post("/generate", generate);

module.exports = router;
