const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_ENABLED === 'true' ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Rate limit exceeded for this sensitive endpoint.",
});

module.exports = { apiLimiter, strictLimiter };
