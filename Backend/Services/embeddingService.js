const { client, EMBED_MODEL } = require("../config/Ai");

async function embedTexts(texts = []) {
  if (!texts.length) return [];
  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    input: texts
  });
  return res.data.map(v => v.embedding);
}

async function embedOne(text) {
  const [e] = await embedTexts([text]);
  return e;
}

module.exports = { embedTexts, embedOne };
