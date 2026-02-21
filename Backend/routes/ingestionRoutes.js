const express = require("express");
const { ingestNote } = require("../controllers/ingestionController");
const router = express.Router();

router.post("/ingest", ingestNote);

module.exports = router;
