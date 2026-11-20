/* Customer account API (passwordless).
   POST /api/account?a=login    {email}  -> emails a sign-in link (only if that email has subscriptions; the reply is always the same)
   POST /api/account?a=session  {token}  -> exchanges the link token for a 30-day session token
   GET  /api/account?a=me                -> the signed-in customer's subscriptions   (Authorization: Bearer <session>) */
const db = require("./_db");
const { secret, sign, verify, bearer } = require("./_auth");
const { dhakaToday, normEmail } = require("./_subs");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function sendLink(req, email, link) {
  const mail = require("./_mail"), m = mail.signIn(req, link);
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
          await sendLink(req, email, `${site}/account/#t=${sign({ t: "link", e: email, exp: Date.now() + 20 * 60000 })}`);
        }
      }
      return res.status(200).json({ ok: true });
    }
    if (a === "session" && req.method === "POST") {
      const o = verify(body.token, "link");
      if (!o) return res.status(401).json({ error: "This link has expired. Please request a new one." });
      return res.status(200).json({ session: sign({ t: "sess", e: o.e, n: o.n || "", pic: o.pic || "", pv: o.pv || "", exp: Date.now() + 30 * 86400000 }), email: o.e });
    }
    if (a === "me" && req.method === "GET") {
      const o = verify(bearer(req), "sess");
      if (!o) return res.status(401).json({ error: "Please sign in again." });
      const rows = await db.rest("GET", `subscriptions?email=eq.${db.q(o.e)}&select=id,service,plan,months,start_date,end_date,name,phone&order=end_date.desc`);
      const c = (rows || []).find((r) => r.phone) || (rows || [])[0] || {};
      // Purchase history: paid online orders for this email (empty if the orders table has not been upgraded yet).
      let orders = [];
      try {
        orders = await db.rest("GET", `orders?email=eq.${db.q(o.e)}&paid=eq.true&select=mtid,lines,paid_at,created_at,delivery,delivered_at&order=created_at.desc&limit=50`) || [];
      } catch (e) { console.error("orders history", e && e.message); }
      return res.status(200).json({
        email: o.e, today: dhakaToday(), contact: { name: c.name || "", phone: c.phone || "" },
        profile: { name: o.n || c.name || "", picture: o.pic || "", provider: o.pv || "" },
        subscriptions: (rows || []).map(({ name, phone, ...r }) => r),
        orders: orders.map((r) => ({ id: r.mtid, date: r.paid_at || r.created_at, delivery: r.delivery || "pending", delivered_at: r.delivered_at || null, lines: Array.isArray(r.lines) ? r.lines : [] })),
      });
    }
    return res.status(404).json({ error: "Not found" });
  } catch (e) {
    console.error("account error", a, e && e.message);
    return res.status(424).json({ error: "Something went wrong. Please try again." });
  }
};
