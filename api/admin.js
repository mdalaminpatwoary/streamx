/* Owner-only API for the /admin/ page. Every call needs the x-admin-key header (env ADMIN_KEY).
   GET    /api/admin?q=<text>       list / search subscriptions
   POST   /api/admin                add one  {email,name,phone,service,plan,months,start?,notes?}
   PATCH  /api/admin?id=<n>         change expiry  {end_date}
   DELETE /api/admin?id=<n>         remove one */
const crypto = require("crypto");
const db = require("./_db");
const { addSub, validDate, normEmail } = require("./_subs");

const h = (s) => crypto.createHash("sha256").update(String(s)).digest();
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const k = process.env.ADMIN_KEY;
    if (!k || !db.enabled()) return res.status(503).json({ error: "Admin is not configured." });
    if (!crypto.timingSafeEqual(h(req.headers["x-admin-key"] || ""), h(k))) return res.status(401).json({ error: "Wrong admin key." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const id = parseInt((req.query && req.query.id) || "", 10);

    if (req.method === "GET") {
      const t = clean(req.query && req.query.q, 60).replace(/[(),*%]/g, "");
      const f = t ? `&or=(email.ilike.*${db.q(t)}*,phone.ilike.*${db.q(t)}*,name.ilike.*${db.q(t)}*,service.ilike.*${db.q(t)}*)` : "";
      return res.status(200).json({ rows: await db.rest("GET", `subscriptions?select=*&order=created_at.desc&limit=300${f}`) });
    }
    if (req.method === "POST") {
      const email = normEmail(body.email), months = Math.floor(Number(body.months));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: "Enter a valid email." });
      if (!clean(body.service, 80) || !clean(body.plan, 80) || !(months >= 1 && months <= 60)) return res.status(400).json({ error: "Choose a service and plan." });
      if (body.start && !validDate(body.start)) return res.status(400).json({ error: "Start date is not valid." });
      const row = await addSub({ email, name: clean(body.name, 60), phone: clean(body.phone, 20), service: clean(body.service, 80), plan: clean(body.plan, 80), months, start: body.start || null, notes: clean(body.notes, 200), source: "admin" });
      return res.status(200).json({ row });
    }
    if (!(id > 0)) return res.status(400).json({ error: "Missing id." });
    if (req.method === "PATCH") {
      if (!validDate(body.end_date)) return res.status(400).json({ error: "Expiry date is not valid." });
      return res.status(200).json({ row: (await db.rest("PATCH", `subscriptions?id=eq.${id}`, { end_date: body.end_date }, "return=representation"))[0] });
    }
    if (req.method === "DELETE") { await db.rest("DELETE", `subscriptions?id=eq.${id}`); return res.status(200).json({ ok: true }); }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("admin error", e && e.message);
    return res.status(424).json({ error: "Request failed: " + String((e && e.message) || "").slice(0, 120) });
  }
};
