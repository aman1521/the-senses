const express = require('express');
const { auth } = require("../middleware/auth");
const { me, updateProfile, myStats, getTalentPool, getPublicProfile, getUserPosts, getUserActivity, addCertification, deleteCertification } = require("../controllers/usersController");

const router = express.Router();

// Public Routes
router.get("/talent-pool", getTalentPool);
router.get("/profile/:username", getPublicProfile);
router.get("/profile/:username/posts", getUserPosts);
router.get("/profile/:username/activity", getUserActivity);

// Private Routes
router.get("/me", auth(), me);
router.patch("/me", auth(), updateProfile);
router.get("/me/stats", auth(), myStats);

// Certifications
router.post("/certifications", auth(), addCertification);
router.delete("/certifications/:id", auth(), deleteCertification);

module.exports = router;
