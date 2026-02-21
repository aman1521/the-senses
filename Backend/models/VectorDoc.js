const mongoose = require("mongoose");

const VectorDocSchema = new mongoose.Schema({
  kind: { type: String, enum: ["book", "question"], index: true },
  refId: { type: String },       // e.g., book id or question id
  title: String,
  text: String,
  domain: String,
  level: Number,
  metadata: Object,
  embedding: { type: [Number], index: "columnstore" } // for Atlas Vector Search
}, { timestamps: true });

module.exports = mongoose.model("VectorDoc", VectorDocSchema);
