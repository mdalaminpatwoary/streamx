/* Login details of delivered accounts (shown to the customer in My account).
   The password is encrypted at rest with AES-256-GCM, keyed from AUTH_SECRET, so the database alone never holds it in plain text. */
const crypto = require("crypto");
const key = () => crypto.createHash("sha256").update("cred:" + (process.env.AUTH_SECRET || "")).digest();
const ready = () => !!process.env.AUTH_SECRET;
function enc(text) {
  const t = String(text || "");
  if (!t) return "";
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(t, "utf8"), c.final()]);
  return "enc1:" + Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}
function dec(v) {
  const s = String(v || "");
  if (!s) return "";
  if (!s.startsWith("enc1:")) return "";
  try {
    const b = Buffer.from(s.slice(5), "base64url"), d = crypto.createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch (e) { return ""; }
}
module.exports = { enc, dec, ready };
