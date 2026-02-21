import mongoose from "mongoose";

const WeeklyChallengeSchema = new mongoose.Schema({
  weekId: String,
  topUsers: [mongoose.Schema.Types.ObjectId],
});

export default mongoose.model(
  "WeeklyChallenge",
  WeeklyChallengeSchema
);
