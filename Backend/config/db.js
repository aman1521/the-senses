const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️  MongoDB Connection Failed: ${error.message}`);
    console.warn("⚠️  Switching to File-Based Mock Database (SimpleDB mode) for MVP.");
    global.USE_MOCK_DB = true;
    // process.exit(1); // Do not crash, allow fallback
  }
};

module.exports = connectDB;
