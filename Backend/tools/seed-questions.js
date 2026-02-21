const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Question = require("../models/Question");
require("dotenv").config();

async function run() {
  await connectDB();

  console.log("Cleaning old questions...");
  await Question.deleteMany({}); // Clear all to be safe

  const docs = [
    // --- General Logic ---
    {
      domain: "general",
      level: 1,
      type: "pattern",
      prompt: "2, 6, 12, 20, 30, ?",
      choices: [{ text: "40", score: 0 }, { text: "42", score: 10 }, { text: "44", score: 2 }, { text: "38", score: 0 }]
    },
    {
      domain: "general",
      level: 1,
      type: "logic",
      prompt: "If all Bloops are Razzies and some Razzies are Zuzus, are some Bloops definitely Zuzus?",
      choices: [{ text: "Yes", score: 0 }, { text: "No", score: 10 }, { text: "Maybe", score: 2 }, { text: "Impossible", score: 0 }]
    },
    {
      domain: "general",
      level: 2,
      type: "problem",
      prompt: "You have a 3-gallon jug and a 5-gallon jug. How do you measure exactly 4 gallons?",
      choices: [{ text: "Impossible", score: 0 }, { text: "Fill 5, pour to 3, empty 3, pour rem 2 to 3, fill 5, pour to 3", score: 10 }, { text: "Fill 3, pour to 5, fill 3, pour to 5", score: 2 }]
    },
    {
      domain: "general",
      level: 2,
      type: "creativity",
      prompt: "Which of these is the most innovative use for a paperclip?",
      choices: [{ text: "Holding paper", score: 1 }, { text: "SIM card reset", score: 5 }, { text: "Lockpick", score: 7 }, { text: "Conductive wire bridge for circuit", score: 10 }]
    },

    // --- Developer Profile ---
    {
      domain: "developer",
      level: 3,
      type: "logic",
      prompt: "What is the time complexity of looking up a value in a Hash Map (average case)?",
      choices: [{ text: "O(n)", score: 0 }, { text: "O(log n)", score: 2 }, { text: "O(1)", score: 10 }, { text: "O(n^2)", score: 0 }]
    },
    {
      domain: "developer",
      level: 3,
      type: "problem",
      prompt: "Your production server processes 10k req/s and spikes to 50k. The DB locks up. First action?",
      choices: [{ text: "add indexes", score: 2 }, { text: "vertical scale DB", score: 5 }, { text: "implement caching layer (Redis)", score: 10 }, { text: "restart server", score: 0 }]
    },

    // --- Founder Profile ---
    {
      domain: "founder",
      level: 3,
      type: "adapt",
      prompt: "Your runway is 3 months. A competitor launches a free clone. You:",
      choices: [{ text: "Lower prices to match", score: 2 }, { text: "Pivot to enterprise/niche they can't serve", score: 10 }, { text: "Run more ads", score: 0 }, { text: "Seek acquisition", score: 5 }]
    }
  ];

  await Question.insertMany(docs);
  console.log(`✅ Seeded ${docs.length} questions successfully.`);
  await mongoose.connection.close();
}

run().catch(e => { console.error(e); process.exit(1); });
