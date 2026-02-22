const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const timeout = require("connect-timeout");

dotenv.config();
connectDB();

// Environment check
if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️  Running in non-production mode");
}

const app = express();

// Security headers
app.use(helmet());

// Timeout guard (60 seconds to support AI analysis)
app.use(timeout("60s"));

// Rate limiters
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_ENABLED === 'true' ? 300 : 10000, // per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_ENABLED === 'true' ? 30 : 1000, // sensitive routes
    standardHeaders: true,
    legacyHeaders: false,
    message: "Rate limit exceeded for this sensitive endpoint.",
});

// Middleware
const parseOrigins = (value) =>
    (value || "")
        .split(",")
        .map((origin) => {
            const trimmed = origin.trim().replace(/\/+$/, "");
            if (!trimmed) return "";
            try {
                return new URL(trimmed).origin;
            } catch {
                return trimmed;
            }
        })
        .filter(Boolean);

const configuredOrigins = [
    ...parseOrigins(process.env.FRONTEND_URL),
    ...parseOrigins(process.env.CLIENT_URL),
    ...parseOrigins(process.env.CORS_ORIGIN),
];

if (process.env.VERCEL_URL) {
    configuredOrigins.push(`https://${process.env.VERCEL_URL}`);
}

const developmentOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
const allowedOrigins = Array.from(new Set(
    process.env.NODE_ENV === 'production'
        ? configuredOrigins
        : [...developmentOrigins, ...configuredOrigins]
));

const enforceCorsOriginCheck = process.env.NODE_ENV === 'production' && allowedOrigins.length > 0;

if (process.env.NODE_ENV === 'production' && !enforceCorsOriginCheck) {
    console.warn("CORS origin allowlist is empty in production. All origins are temporarily allowed.");
}

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (enforceCorsOriginCheck && allowedOrigins.indexOf(origin) === -1) {
            if (origin.endsWith('.vercel.app')) {
                return callback(null, true);
            }
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

app.use(express.json());
app.use(express.static("."));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(generalLimiter); // Apply to all routes

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Timeout handler
app.use((req, res, next) => {
    if (!req.timedout) next();
});

// Health Check — used by Railway & Vercel
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});

// Routes
// Routes V1
const v1Router = express.Router();

v1Router.use("/auth", require("./routes/authRoutes"));
v1Router.use("/game", require("./routes/gameRoutes"));
v1Router.use("/company", require("./routes/companyRoutes"));
v1Router.use("/admin", require("./routes/adminRoutes"));
v1Router.use("/ai", require("./routes/aiRoutes"));
v1Router.use("/ai/stream", require("./routes/aiStreamRoutes"));
v1Router.use("/ingest", require("./routes/ingestionRoutes"));
v1Router.use("/leaderboard", require("./routes/leaderboardRoutes"));
v1Router.use("/ai/plan", require("./routes/planRoutes"));
v1Router.use("/intelligence", strictLimiter, require("./routes/intelligence"));
v1Router.use("/cards", require("./routes/cardRoutes"));
v1Router.use("/duels", strictLimiter, require("./routes/duelRoutes"));
v1Router.use("/ai-battles", require("./routes/aiBattleRoutes"));
v1Router.use("/profile", require("./routes/profileRoutes"));
v1Router.use("/questions", require("./routes/questionsRoutes"));
v1Router.use("/questions-ai", require("./routes/questionRoutes")); // New AI question system
v1Router.use("/bubbles", require("./routes/bubbles")); // Post Bubble System
v1Router.use("/company-dashboard", require("./routes/companyDashboard")); // Company Dashboard
v1Router.use("/dashboard", require("./routes/dashboardRoutes")); // User Dashboard
v1Router.use("/payments", require("./routes/paymentRoutes")); // Payments & Certificates
v1Router.use("/market-updates", require("./routes/marketUpdateRoutes")); // New Market Feeds
v1Router.use("/notifications", require("./routes/notificationRoutes")); // Notification System
v1Router.use("/users", require("./routes/usersRoutes"));
v1Router.use("/chat", require("./routes/chatRoutes"));
v1Router.use("/public", require("./routes/publicRoutes")); // Public stats - no auth required
v1Router.use("/session", require("./routes/telemetryRoutes")); // Telemetry & Activity Logging
v1Router.use("/messages", require("./routes/messageRoutes")); // Messaging System
v1Router.use("/search", require("./routes/searchRoutes")); // Global Search
v1Router.use("/upload", require("./routes/uploadRoutes")); // Media Upload

// --- NEW SOCIAL SYSTEM (Section 12) ---
v1Router.use("/", require("./routes/socialRoutes")); // Mounts /create-post, /feed at root of v1

// B2B Features (Enterprise SSO & Team Management)
v1Router.use("/organizations", require("./routes/organizationRoutes")); // Organization Management
v1Router.use("/teams", require("./routes/teamRoutes")); // Team Management
v1Router.use("/invites", require("./routes/inviteRoutes")); // Team Invitations
v1Router.use("/sso", require("./routes/ssoRoutes")); // SSO Authentication
v1Router.use("/push-tokens", require("./routes/pushTokenRoutes")); // Push Notifications

// Complete Profile System
v1Router.use("/user-profiles", require("./routes/userProfileRoutes")); // User Profile System
v1Router.use("/company-profiles", require("./routes/companyProfileRoutes")); // Company Profile System

// Phase 6: Enterprise Features
v1Router.use("/analytics", require("./routes/analyticsRoutes")); // Advanced Analytics
v1Router.use("/developer", require("./routes/developerRoutes")); // Developer API Tokens

// Mount V1 Router
app.use("/api/v1", v1Router);

// FALLBACK for backward compatibility (optional - remove later)
app.use("/api", v1Router);

// Global Error Handler
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// HTTP Server and Socket.IO Integration
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: enforceCorsOriginCheck ? allowedOrigins : true,
        credentials: true
    }
});

// Make `io` accessible in routes/controllers
app.set("io", io);

io.on("connection", (socket) => {
    socket.on("join", (userId) => {
        if (userId) {
            socket.join(userId.toString());
            console.log(`🔌 User ${userId} joined via WebSocket`);
        }
    });

    socket.on("disconnect", () => {
        // Disconnect logic if needed
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 The Senses backend running on http://localhost:${PORT}`));
