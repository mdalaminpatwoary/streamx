/* Customer account API (passwordless).
   POST /api/account?a=login    {email}  -> emails a sign-in link (only if that email has subscriptions; the reply is always the same)
   POST /api/account?a=code     {email,code} -> exchanges the 6-digit emailed code for a session token (5 tries, 10 minutes, single use)
   POST /api/account?a=session  {token}  -> exchanges the link token for a 30-day session token
   GET  /api/account?a=me                -> the signed-in customer's subscriptions   (Authorization: Bearer <session>) */
const crypto = require("crypto");
const db = require("./_db");
const { secret, sign, verify, bearer } = require("./_auth");
const { dhakaToday, normEmail } = require("./_subs");
const cred = require("./_cred");
const access = require("./_access");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const hashCode = (email, code) => crypto.createHmac("sha256", secret()).update("otp:" + email + ":" + code).digest("hex");
const MAX_TRIES = 5;

async function sendLink(req, email, link, code) {
  const mail = require("./_mail"), m = mail.signIn(req, link, code);
  await mail.send({ to: email, subject: m.subject, html: m.html, text: m.text });
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
          // 6-digit one-time code, stored only as a keyed hash. If the login_codes table is not set up yet, the email still carries the link.
          let code = "";
          try {
            code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
            await db.rest("POST", "login_codes?on_conflict=email", [{ email, code_hash: hashCode(email, code), expires_at: new Date(Date.now() + 10 * 60000).toISOString(), tries: 0, sent_at: new Date().toISOString() }], "resolution=merge-duplicates");
          } catch (e) { code = ""; console.error("login code", e && e.message); }
          await sendLink(req, email, `${site}/account/#t=${sign({ t: "link", e: email, exp: Date.now() + 20 * 60000 })}`, code);
        }
      }
      return res.status(200).json({ ok: true });
    }
    if (a === "code" && req.method === "POST") {
      const email = normEmail(body.email), code = String(body.code || "").replace(/\D/g, "");
      if (!EMAIL.test(email) || code.length !== 6) return res.status(400).json({ error: "Enter the 6-digit code from your email." });
      const bad = () => res.status(401).json({ error: "That code is not right or has expired. Check the latest email, or request a new code." });
      const rows = await db.rest("GET", `login_codes?email=eq.${db.q(email)}&select=code_hash,expires_at,tries`);
      const row = rows && rows[0];
      if (!row || Date.parse(row.expires_at) < Date.now()) return bad();
      if (row.tries >= MAX_TRIES) return res.status(429).json({ error: "Too many wrong attempts. Please request a new code." });
      // Count the attempt first, so parallel guesses cannot beat the limit.
      await db.rest("PATCH", `login_codes?email=eq.${db.q(email)}`, { tries: row.tries + 1 });
      const want = Buffer.from(row.code_hash), got = Buffer.from(hashCode(email, code));
      if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return bad();
      await db.rest("DELETE", `login_codes?email=eq.${db.q(email)}`);
      return res.status(200).json({ session: sign({ t: "sess", e: email, n: "", pic: "", pv: "", exp: Date.now() + 30 * 86400000 }), email });
    }
    if (a === "session" && req.method === "POST") {
      const o = verify(body.token, "link");
      if (!o) return res.status(401).json({ error: "This link has expired. Please request a new one." });
      return res.status(200).json({ session: sign({ t: "sess", e: o.e, n: o.n || "", pic: o.pic || "", pv: o.pv || "", exp: Date.now() + 30 * 86400000 }), email: o.e });
    }
    if (a === "me" && req.method === "GET") {
      const o = verify(bearer(req), "sess");
      if (!o) return res.status(401).json({ error: "Please sign in again." });
      let rows;
      for (const cols of access.TIERS) { // newer columns may not exist yet
        try { rows = await db.rest("GET", `subscriptions?email=eq.${db.q(o.e)}&select=${access.BASE}${cols}&order=end_date.desc`); break; } catch (e) { if (!cols) throw e; }
      }
      const c = (rows || []).find((r) => r.phone) || (rows || [])[0] || {};
      // Purchase history: paid online orders for this email (empty if the orders table has not been upgraded yet).
      let orders = [];
      try {
        orders = await db.rest("GET", `orders?email=eq.${db.q(o.e)}&paid=eq.true&select=mtid,lines,paid_at,created_at,delivery,delivered_at&order=created_at.desc&limit=50`) || [];
      } catch (e) { console.error("orders history", e && e.message); }
      return res.status(200).json({
        email: o.e, today: dhakaToday(), contact: { name: c.name || "", phone: c.phone || "" },
        profile: { name: o.n || c.name || "", picture: o.pic || "", provider: o.pv || "" },
        subscriptions: (rows || []).map((r) => ({ id: r.id, service: r.service, plan: r.plan, months: r.months, start_date: r.start_date, end_date: r.end_date, login: access.fromRow(r) })),
        orders: orders.map((r) => ({ id: r.mtid, date: r.paid_at || r.created_at, delivery: r.delivery || "pending", delivered_at: r.delivered_at || null, lines: Array.isArray(r.lines) ? r.lines : [] })),
      });
    }
    return res.status(404).json({ error: "Not found" });
  } catch (e) {
    console.error("account error", a, e && e.message);
    return res.status(424).json({ error: "Something went wrong. Please try again." });
  }
};
