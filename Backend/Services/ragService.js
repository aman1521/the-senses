const VectorDoc = require("../models/VectorDoc");
const { embedOne } = require("./embeddingService");

// Cosine sim via MongoDB Atlas Vector Search using $vectorSearch pipeline:
async function vectorSearch(query, { k = 5, filter = {} } = {}) {
  const embedding = await embedOne(query);
  // Atlas Vector Search pipeline
  const pipeline = [
    {
      $vectorSearch: {
        index: "senses_vsearch", // create this index in Atlas
        path: "embedding",
        queryVector: embedding,
        numCandidates: 200,
        limit: k,
        filter
      }
    },
    { $project: { text: 1, title: 1, domain: 1, level: 1, metadata: 1, score: { $meta: "vectorSearchScore" } } }
  ];
  return VectorDoc.aggregate(pipeline);
}

async function retrieveContext(userProfile, questionHint) {
  const dom = userProfile?.domain || undefined;
  const q = [
    questionHint,
    userProfile?.goals?.join(", ") || "",
    userProfile?.profileType || "",
    userProfile?.recentWeaknesses?.join(", ") || ""
  ].filter(Boolean).join(" | ");

  const filter = dom ? { domain: dom } : {};
  const results = await vectorSearch(q || "thinking skills", { k: 8, filter });
  const context = results.map(r => `• ${r.title || ""}\n${r.text}`).join("\n\n");
  return { context, results };
}

module.exports = { vectorSearch, retrieveContext };
