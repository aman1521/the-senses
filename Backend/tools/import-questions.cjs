// tools/import-questions.cjs
// Usage: MONGO_URI=mongodb://127.0.0.1:27017/senses node tools/import-questions.cjs

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  domain: { type: String, index: true },
  level: { type: Number, default: 1 },
  type: { type: String, enum: ["pattern","logic","problem","creativity","adapt"], required: true },
  prompt: { type: String, required: true },
  choices: [{ text: String, score: Number, next: String }]
}, { timestamps: true });

const Question = mongoose.model("Question", QuestionSchema);

async function run() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/senses";
  await mongoose.connect(MONGO_URI, { dbName: "senses" });
  console.log("✅ Mongo connected");

  const jsonPath = path.join(process.cwd(), "questions_auto.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error("questions_auto.json not found. Run tools/generate-questions.cjs first.");
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  if (!Array.isArray(data) || data.length === 0) throw new Error("questions_auto.json is empty");

  // Optional: wipe only auto-generated batch (heuristic: ids start with 'BK')
  await Question.deleteMany({ prompt: /— / }); // our prompts contain " — " between title & author

  const chunkSize = 1000;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await Question.insertMany(chunk, { ordered: false });
    console.log(`Inserted ${i + chunk.length}/${data.length}`);
  }

  console.log("🎉 Import complete");
  await mongoose.connection.close();
}

run().catch(async (e) => {
  console.error("❌ Import failed:", e.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
