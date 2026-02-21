// Stub: add your provider's moderation if desired
function checkAllowed(text = "") {
  // block long PII dumps or obviously unsafe content
  if (text.length > 5000) return { ok: false, reason: "Too long" };
  return { ok: true };
}
module.exports = { checkAllowed };
