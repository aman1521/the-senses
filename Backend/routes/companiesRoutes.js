const express = require("express");
const { getCompanyStats } = require("../controllers/companiesController");
const router = express.Router();

router.get("/stats", getCompanyStats);

module.exports = router;

const { companyCoach } = require("../controllers/companyCoachController");
router.get("/coach/:companyId", companyCoach);
