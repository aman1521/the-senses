const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env before anything
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for video/audio uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Route Definitions
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));

// Question Systems
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/questions-ai', require('./routes/questionRoutes'));

// Intelligence & Evaluation (The Critical Fix)
app.use('/api/intelligence', require('./routes/intelligence'));

// Game & Social
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/duels', require('./routes/duelRoutes'));
app.use('/api/ai-battles', require('./routes/aiBattleRoutes'));
app.use('/api/game', require('./routes/gameRoutes'));
app.use('/api/rooms', require('./routes/roomsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Business & Profile
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/market-update', require('./routes/marketUpdateRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Health Check
app.get('/health', (req, res) => res.send('API Running'));

// Error Handling
app.use(require('./middleware/error'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
