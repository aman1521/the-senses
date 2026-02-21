const User = require("../models/User");
const Company = require("../models/Company");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require('fs');

const IntelligenceResult = require("../models/IntelligenceResult");
const { upsertUserProfile } = require("../ai-agents/profile/profileService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// Password Strength Validator
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain a lowercase letter");
  if (!/\d/.test(password)) errors.push("Password must contain a number");
  return errors;
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, profileType, experienceLevel, companyName, claimSessionId, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return errorResponse(res, "Please provide all required fields", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, "An account with this email already exists. Please login instead.", 400);
    }

    // Password strength validation
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return errorResponse(res, passwordErrors[0], 400);
    }

    let company = null;
    if (companyName) {
      company = await Company.findOne({ name: companyName });
      if (!company) company = await Company.create({ name: companyName });
    }

    // Generate Username
    const baseHandle = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    let username = baseHandle;
    const exists = await User.findOne({ username });
    if (exists) {
      username = `${baseHandle}${Math.floor(Math.random() * 1000)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      profileType,
      experienceLevel: experienceLevel || 'mid',
      company: company ? company._id : null,
      role: role || 'user'
    });

    // 🔗 Claim Score Logic
    if (claimSessionId) {
      const result = await IntelligenceResult.findOne({ sessionId: claimSessionId });
      if (result && (!result.userId || result.userId === 'guest')) {
        result.userId = user._id;
        await result.save();

        await upsertUserProfile({
          userId: user._id,
          finalScore: result.finalScore,
          normalizedScore: result.normalizedScore,
          trustScore: result.trustScore,
          difficulty: result.difficulty,
          badge: result.badge,
        });

        user.lastTestDate = new Date();
        user.history = [{ score: result.finalScore, date: new Date() }];
        user.bestScoreEver = result.finalScore;
        await user.save();

        console.log(`✅ User ${user._id} claimed score ${result.finalScore} from session ${claimSessionId}`);
      }
    }

    return successResponse(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted
      }
    }, "Registration successful", 201);

  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(res, "An account with this email already exists", 400);
    }
    next(err); // Pass to global error handler
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const lookup = User.findOne({ email: email.toLowerCase() });
    let user;

    // Mongoose query path
    if (lookup && typeof lookup.select === "function") {
      user = await lookup.select("+password").populate("company");
    } else {
      // SimpleDB/mock path
      user = await lookup;
      if (user && typeof user.populate === "function") {
        await user.populate("company");
      }
    }

    if (!user) {
      return errorResponse(res, "No account found with this email. Please register first.", 400);
    }

    // Check if user registered via OAuth (no password)
    if (!user.password) {
      return errorResponse(res, "This account was created with Google/LinkedIn. Please use that login method.", 400);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return errorResponse(res, "Incorrect password. Please try again.", 400);
    }

    const safeUser = typeof user.toObject === "function" ? user.toObject() : { ...user };
    delete safeUser.password;

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return successResponse(res, { token, user: safeUser }, "Login successful");

  } catch (err) {
    next(err);
  }
};

// Forgot Password - Generate Reset Token
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not for security
      return successResponse(res, null, "If an account exists, a reset link has been sent.");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // For now, log the token (you'd integrate with SendGrid/Mailgun)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log(`🔑 Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: ${resetUrl}`);

    // Write to file for AI assistant to retrieve
    fs.writeFileSync('reset_log.txt', resetUrl);

    return successResponse(res, null, "If an account exists, a reset link has been sent.");

  } catch (err) {
    console.error("Forgot Password Error:", err);
    return errorResponse(res, "Failed to send reset link", 500, err.message); // Could use next(err) but preserving logic
  }
};

// Reset Password with Token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, "Invalid or expired reset token", 400);
    }

    // Validate new password
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return errorResponse(res, passwordErrors[0], 400);
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return successResponse(res, null, "Password has been reset. Please login.");

  } catch (err) {
    next(err);
  }
};

// OAuth Callback Handler (for Google/LinkedIn)
exports.oauthCallback = async (req, res, next) => {
  try {
    const { provider, profile } = req.body; // profile contains: id, email, name, profilePicture, etc.

    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      // Create new user from OAuth
      const baseHandle = profile.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      let username = baseHandle;
      const exists = await User.findOne({ username });
      if (exists) {
        username = `${baseHandle}${Math.floor(Math.random() * 1000)}`;
      }

      user = await User.create({
        name: profile.name,
        email: profile.email.toLowerCase(),
        username,
        profilePicture: profile.profilePicture,
        oauthProvider: provider,
        oauthId: profile.id,
        profileType: profile.profileType || 'software-engineer',
        experienceLevel: profile.experienceLevel || 'mid',
        // LinkedIn specific fields
        profileHeadline: profile.headline,
        location: profile.location
      });
    } else {
      // Update existing user with OAuth info if not already set
      if (!user.oauthProvider) {
        user.oauthProvider = provider;
        user.oauthId = profile.id;
        if (profile.profilePicture) user.profilePicture = profile.profilePicture;
        if (profile.headline) user.profileHeadline = profile.headline;
        if (profile.location) user.location = profile.location;
        await user.save();
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return successResponse(res, { token, user }, "Authentication successful");

  } catch (err) {
    console.error("OAuth callback error:", err);
    return errorResponse(res, "OAuth authentication failed", 400);
  }
};
