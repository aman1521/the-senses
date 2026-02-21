const express = require("express");
const { generatePlan } = require("../controllers/planController");
const router = express.Router();
router.post("/generate", generatePlan);
module.exports = router;
