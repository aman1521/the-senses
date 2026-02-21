const VectorDoc = require("../models/VectorDoc");
const { embedOne } = require("../Services/embeddingService");

// Simple ingestion endpoint if you want to push new reference notes
exports.ingestNote = async (req, res) => {
  try {
    const { kind = "book", refId = "", title = "", text = "", domain = "general", level = 3, metadata = {} } = req.body;
    const embedding = await embedOne([title, text].filter(Boolean).join("\n"));
    const doc = await VectorDoc.create({ kind, refId, title, text, domain, level, metadata, embedding });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
