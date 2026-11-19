/* Signed tokens for the passwordless customer account (HMAC-SHA256, no extra dependencies). */
const crypto = require("crypto");
const secret = () => process.env.AUTH_SECRET || "";
const b64 = (b) => Buffer.from(b).toString("base64url");
const sign = (o) => { const p = b64(JSON.stringify(o)); return p + "." + crypto.createHmac("sha256", secret()).update(p).digest("base64url"); };
function verify(tok, type) {
  try {
    if (!secret()) return null;
    const [p, s] = String(tok || "").split(".");
    const ok = crypto.createHmac("sha256", secret()).update(p).digest("base64url");
    if (!s || s.length !== ok.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(ok))) return null;
    const o = JSON.parse(Buffer.from(p, "base64url").toString());
    return o.t === type && o.exp > Date.now() ? o : null;
  } catch (e) { return null; }
}
const bearer = (req) => String((req.headers && req.headers.authorization) || "").replace(/^Bearer /, "");
module.exports = { secret, sign, verify, bearer };
