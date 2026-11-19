/* Customer account API (passwordless).
   POST /api/account?a=login    {email}  -> emails a sign-in link (only if that email has subscriptions; the reply is always the same)
   POST /api/account?a=session  {token}  -> exchanges the link token for a 30-day session token
   GET  /api/account?a=me                -> the signed-in customer's subscriptions   (Authorization: Bearer <session>) */
const crypto = require("crypto");
const db = require("./_db");
const { dhakaToday, normEmail } = require("./_subs");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const b64 = (b) => Buffer.from(b).toString("base64url");
const secret = () => process.env.AUTH_SECRET || "";
const sign = (o) => { const p = b64(JSON.stringify(o)); return p + "." + crypto.createHmac("sha256", secret()).update(p).digest("base64url"); };
function verify(tok, type) {
  try {
    const [p, s] = String(tok || "").split(".");
    const ok = crypto.createHmac("sha256", secret()).update(p).digest("base64url");
    if (!s || s.length !== ok.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(ok))) return null;
    const o = JSON.parse(Buffer.from(p, "base64url").toString());
    return o.t === type && o.exp > Date.now() ? o : null;
  } catch (e) { return null; }
}
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function sendLink(email, link) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email is not configured.");
  const from = process.env.MAIL_FROM || "StreamX <onboarding@resend.dev>";
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px"><h2 style="color:#ED3124;margin:0 0 12px">Sign in to StreamX</h2><p>Press the button to see your subscriptions and expiry dates. The link works for 20 minutes.</p><p><a href="${esc(link)}" style="display:inline-block;background:#ED3124;color:#fff;padding:12px 22px;border-radius:99px;text-decoration:none;font-weight:700">Open my account</a></p><p style="color:#666;font-size:13px">If you did not ask for this, you can ignore this email.</p></div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject: "Your StreamX sign-in link", html, text: "Sign in to StreamX: " + link + "\nThe link works for 20 minutes." }),
  });
  if (!r.ok) throw new Error("mail " + r.status + " " + (await r.text()).slice(0, 160));
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const a = String((req.query && req.query.a) || "");
  try {
    if (!db.enabled() || !secret()) return res.status(503).json({ error: "Accounts are not available yet." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (a === "login" && req.method === "POST") {
      const email = normEmail(body.email);
      if (!EMAIL.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
      const has = await db.rest("GET", `subscriptions?email=eq.${db.q(email)}&select=id&limit=1`);
      if (has && has.length) {
        const last = await db.rest("GET", `login_links?email=eq.${db.q(email)}&select=sent_at`);
        if (!(last && last[0] && Date.now() - Date.parse(last[0].sent_at) < 60000)) {
          await db.rest("POST", "login_links?on_conflict=email", [{ email, sent_at: new Date().toISOString() }], "resolution=merge-duplicates");
          const site = (process.env.SITE_URL || "https://" + (req.headers["x-forwarded-host"] || req.headers.host)).replace(/\/$/, "");
          await sendLink(email, `${site}/account/#t=${sign({ t: "link", e: email, exp: Date.now() + 20 * 60000 })}`);
        }
      }
      return res.status(200).json({ ok: true });
    }
    if (a === "session" && req.method === "POST") {
      const o = verify(body.token, "link");
      if (!o) return res.status(401).json({ error: "This link has expired. Please request a new one." });
      return res.status(200).json({ session: sign({ t: "sess", e: o.e, exp: Date.now() + 30 * 86400000 }), email: o.e });
    }
    if (a === "me" && req.method === "GET") {
      const o = verify(String(req.headers.authorization || "").replace(/^Bearer /, ""), "sess");
      if (!o) return res.status(401).json({ error: "Please sign in again." });
      const rows = await db.rest("GET", `subscriptions?email=eq.${db.q(o.e)}&select=id,service,plan,months,start_date,end_date&order=end_date.desc`);
      return res.status(200).json({ email: o.e, today: dhakaToday(), subscriptions: rows || [] });
    }
    return res.status(404).json({ error: "Not found" });
  } catch (e) {
    console.error("account error", a, e && e.message);
    return res.status(424).json({ error: "Something went wrong. Please try again." });
  }
};
