const mongoose = require('mongoose');
const Question = require('../models/Question');
const connectDB = require('../config/db');

const sampleQuestions = [
  {
    prompt: "What is the primary goal of object-oriented programming?",
    choices: [
      { text: "To write code faster", score: 2 },
      { text: "To organize code into reusable objects with encapsulation", score: 8 },
      { text: "To eliminate functions", score: 1 },
      { text: "To make code more complex", score: 0 }
    ],
    type: "logic",
    domain: "programming",
    level: 1,
    approved: true
  },
  {
    prompt: "Which design pattern emphasizes composition over inheritance?",
    choices: [
      { text: "Singleton", score: 3 },
      { text: "Factory", score: 5 },
      { text: "Strategy", score: 7 },
      { text: "Observer", score: 4 }
    ],
    type: "problem",
    domain: "design",
    level: 2,
    approved: true
  },
  {
    prompt: "In a distributed system, what does CAP theorem stand for?",
    choices: [
      { text: "Cache, Availability, Performance", score: 1 },
      { text: "Consistency, Availability, Partition tolerance", score: 9 },
      { text: "CPU, API, Protocol", score: 0 },
      { text: "Client, Account, Permission", score: 2 }
    ],
    type: "logic",
    domain: "architecture",
    level: 3,
    approved: true
  },
  {
    prompt: "What is the time complexity of binary search?",
    choices: [
      { text: "O(n)", score: 2 },
      { text: "O(log n)", score: 9 },
      { text: "O(n²)", score: 0 },
      { text: "O(1)", score: 3 }
    ],
    type: "pattern",
    domain: "algorithms",
    level: 1,
    approved: true
  },
  {
    prompt: "How would you optimize a slow database query?",
    choices: [
      { text: "Add more servers", score: 3 },
      { text: "Use indexing, query optimization, and caching", score: 9 },
      { text: "Increase RAM", score: 4 },
      { text: "Rewrite it in a faster language", score: 2 }
    ],
    type: "problem",
    domain: "database",
    level: 2,
    approved: true
  },
  {
    prompt: "What is the main purpose of microservices architecture?",
    choices: [
      { text: "To make code harder to understand", score: 0 },
      { text: "To create independent, scalable services with clear boundaries", score: 9 },
      { text: "To avoid using databases", score: 1 },
      { text: "To reduce the number of developers needed", score: 2 }
    ],
    type: "logic",
    domain: "architecture",
    level: 3,
    approved: true
  },
  {
    prompt: "What principle ensures that a function does one thing well?",
    choices: [
      { text: "DRY", score: 4 },
      { text: "Single Responsibility Principle", score: 9 },
      { text: "SOLID", score: 5 },
      { text: "KISS", score: 6 }
    ],
    type: "logic",
    domain: "principles",
    level: 1,
    approved: true
  },
  {
    prompt: "In creative problem-solving, what technique involves rapid idea generation?",
    choices: [
      { text: "Critical analysis", score: 2 },
      { text: "Brainstorming", score: 8 },
      { text: "Documentation", score: 1 },
      { text: "Testing", score: 3 }
    ],
    type: "creativity",
    domain: "problem-solving",
    level: 2,
    approved: true
  },
  {
    prompt: "How do you adapt your approach when encountering new technology?",
    choices: [
      { text: "Refuse to learn", score: 0 },
      { text: "Study docs, experiment, and integrate gradually", score: 9 },
      { text: "Use it immediately in production", score: 1 },
      { text: "Wait for others to figure it out", score: 2 }
    ],
    type: "adapt",
    domain: "learning",
    level: 2,
    approved: true
  },
  {
    prompt: "What is the essence of good API design?",
    choices: [
      { text: "Maximum features", score: 2 },
      { text: "Clear, intuitive, and backwards compatible", score: 9 },
      { text: "No documentation needed", score: 0 },
      { text: "Minimum features", score: 3 }
    ],
    type: "logic",
    domain: "design",
    level: 2,
    approved: true
  }
];

async function seedQuestions() {
  try {
    await connectDB();
    
    // Clear existing questions
    await Question.deleteMany({});
    console.log('✅ Cleared existing questions');
    
    // Insert new questions
    const inserted = await Question.insertMany(sampleQuestions);
    console.log(`✅ Seeded ${inserted.length} questions`);
    
    // Verify
    const count = await Question.countDocuments();
    console.log(`✅ Total questions in database: ${count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seedQuestions();
