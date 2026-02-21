const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { errorResponse } = require("../utils/apiResponse");

function auth(required = true) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) {
        if (!required) return next();
        return errorResponse(res, "Auth token missing", 401);
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).populate("company");
      if (!req.user) return errorResponse(res, "User not found", 401);
      next();
    } catch (e) {
      if (!required) return next(); // If optional and token invalid, proceed as guest
      return errorResponse(res, "Invalid token", 401, e.message);
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return errorResponse(res, "Unauthorized", 401);
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, "Forbidden: insufficient role", 403);
    }
    next();
  };
}

module.exports = { auth, requireRole };
