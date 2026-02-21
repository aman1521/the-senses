const User = require("../models/User");
const GameSession = require("../models/GameSession");

exports.me = async (req, res) => {
  // Calculate Retake Capability
  let canRetake = true;
  let nextRetakeDate = null;

  if (req.user.lastTestDate) {
    const cooldownHours = 24;
    const last = new Date(req.user.lastTestDate).getTime();
    const now = Date.now();
    const diffHours = (now - last) / (1000 * 60 * 60);

    if (diffHours < cooldownHours) {
      canRetake = false;
      nextRetakeDate = new Date(last + (cooldownHours * 60 * 60 * 1000));
    }
  }

  const userObj = req.user.toObject();
  res.json({
    ...userObj,
    retake: {
      canRetake,
      nextRetakeDate
    }
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "profileType", "bio", "skills", "yearsOfExperience", "workHistory", "projects"]; // Added onboarding fields
    const updates = {};
    allowed.forEach((k) => { if (k in req.body) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.myStats = async (req, res) => {
  try {
    const sessions = await GameSession.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ stats: req.user.stats, sessions });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const IntelligenceResult = require("../models/IntelligenceResult");

exports.getTalentPool = async (req, res) => {
  try {
    // Fetch top verified results
    const results = await IntelligenceResult.find({
      trustScore: { $gte: 90 }, // Validated only
      finalScore: { $gte: 80 }  // High Performers
    })
      .sort({ finalScore: -1 })
      .limit(50)
      .populate("userId", "name email"); // Assuming userId in Schema is ref to User (Wait, in IntelligenceResult it is defined as String, not ObjectId Ref. We need to manually fetch or fix schema).

    // Since IntelligenceResult schema defines userId as String, populate won't work directly unless we set ref or do manual lookup.
    // Let's do manual lookup for now to be safe, or just return result data if names aren't critical (Profile usually has name?).
    // Actually, let's fetch Users.

    // Better strategy:
    // 1. Get results.
    // 2. Extract userIds.
    // 3. Fetch Users.
    // 4. Map.

    // Or just rely on what is in result? Result doesn't have name.

    const User = require("../models/User");

    // Fetching user details manually
    const enrichedResults = await Promise.all(results.map(async (r) => {
      const u = await User.findById(r.userId).select("name");
      return {
        _id: r.userId,
        name: u ? u.name : "Anonymous User",
        rank: r.rank,
        stats: {
          bestScore: r.finalScore,
        },
        profile: r.profile,
        verified: true
      };
    }));

    // Deduplicate by user (take best score)
    const uniqueUsers = [];
    const seen = new Set();
    enrichedResults.forEach(u => {
      if (!seen.has(u._id)) {
        seen.add(u._id);
        uniqueUsers.push(u);
      }
    });

    res.json({
      success: true,
      users: uniqueUsers
    });

  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch talent" });
  }
};

// --- NEW PROFILE METHODS ---

exports.getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;

    // Try exact match first
    let user = await User.findOne({ username }).select('-password -__v -oauthId -oauthProvider');

    // If not found, try case-insensitive
    if (!user) {
      user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).select('-password -__v -oauthId -oauthProvider');
    }

    // If still not found, try searching by name (slugified) or just name? 
    // This is risky if names are not unique, but useful for "rishitatrivedi" if name is "Rishita Trivedi"
    if (!user) {
      // Try to match name by removing spaces
      // This is a heavy query, but fine for fallback
      // We can't do regex on calculated fields easily in Mongo without aggregation, 
      // so let's just try exact name match if username looks like a name
      user = await User.findOne({ name: { $regex: new RegExp(`^${username}$`, 'i') } }).select('-password -__v -oauthId -oauthProvider');
    }

    // Attempt to match "FirstLast" to "First Last"
    if (!user) {
      // e.g. "rishitatrivedi" -> "Rishita Trivedi" logic is hard to guess
      // Just return 404
      return res.status(404).json({ message: "User not found" });
    }

    // Determine privacy
    // If not public profile and requester is not admin/owner, restrict
    // For now, assume public profiles

    res.json({ success: true, user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

exports.addCertification = async (req, res) => {
  try {
    const { title, organization, issueDate, credentialUrl, description } = req.body;
    const user = await User.findById(req.user._id);

    user.certifications.push({
      title, organization, issueDate, credentialUrl, description
    });

    await user.save();
    res.json({ success: true, certifications: user.certifications });
  } catch (error) {
    res.status(500).json({ message: "Failed to add certification" });
  }
};

exports.deleteCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    user.certifications = user.certifications.filter(c => c._id.toString() !== id);
    await user.save();

    res.json({ success: true, certifications: user.certifications });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete certification" });
  }
};

exports.getUserActivity = async (req, res) => {
  // Mock activity for now, eventually query Comment/Post/GameSession models
  // and aggregate by time
  const Post = require('../models/Post');
  const Comment = require('../models/Comment');

  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const recentPosts = await Post.find({ author: user._id }).sort({ createdAt: -1 }).limit(5);
    // const recentComments = await Comment.find({ user: user._id }).sort({createdAt: -1}).limit(5);

    // Combine and normalize
    const activity = [
      ...recentPosts.map(p => ({ type: 'post', data: p, date: p.createdAt })),
      // ...recentComments.map(c => ({ type: 'comment', data: c, date: c.createdAt }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ message: "Failed to get activity" });
  }
};

exports.getUserPosts = async (req, res) => {
  const Post = require('../models/Post');
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ author: user._id, visibility: 'public' })
      .sort({ createdAt: -1 })
      .populate('author', 'name username profilePicture verified tier');

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
};

const fs = require('fs');
fs.writeFileSync('debug_exports.txt', JSON.stringify(Object.keys(exports), null, 2));
