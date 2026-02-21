import mongoose from "mongoose";

const UserProgressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  scores: [
    {
      finalScore: Number,
      normalizedScore: Number,
      createdAt: Date
    }
  ]
});

export default mongoose.model("UserProgress", UserProgressSchema);
