/* Owner-only API for the /admin/ page. Every call needs the x-admin-key header (env ADMIN_KEY).
   GET    /api/admin?q=<text>       list / search subscriptions
   POST   /api/admin                add one  {email,name,phone,service,plan,months,start?,notes?}
   PATCH  /api/admin?id=<n>         change expiry {end_date} and/or login details {acct_email, acct_pass, acct_otp, acct_profile, acct_pin}
   DELETE /api/admin?id=<n>         remove one
   GET    /api/admin?view=orders    list paid orders (newest first) with delivery status
   PATCH  /api/admin?order=<mtid>   set delivery  {delivery:"pending"|"delivered"} */
const crypto = require("crypto");
const db = require("./_db");
const { addSub, validDate, normEmail } = require("./_subs");
const access = require("./_access");

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

    const ord = clean(req.query && req.query.order, 40).replace(/[^0-9A-Za-z]/g, "");
    if (req.method === "GET" && req.query && req.query.view === "orders")
      return res.status(200).json({ rows: await db.rest("GET", "orders?select=*&paid=eq.true&order=created_at.desc&limit=200") });
    if (req.method === "PATCH" && ord) {
      const dv = body.delivery === "delivered" ? "delivered" : body.delivery === "pending" ? "pending" : "";
      if (!dv) return res.status(400).json({ error: "Invalid status." });
      const before = ((await db.rest("GET", `orders?mtid=eq.${db.q(ord)}&select=delivery`)) || [])[0];
      const row = (await db.rest("PATCH", `orders?mtid=eq.${db.q(ord)}`, { delivery: dv, delivered_at: dv === "delivered" ? new Date().toISOString() : null }, "return=representation"))[0];
      let mailed = false;
      // First time it flips to "delivered": tell the customer by email.
      if (row && dv === "delivered" && !(before && before.delivery === "delivered") && row.email && process.env.RESEND_API_KEY) {
        try { const mail = require("./_mail"), m = mail.delivered(req, row); await mail.send({ to: row.email, subject: m.subject, html: m.html, text: m.text, idem: "delivered-" + row.mtid }); mailed = true; }
        catch (e) { console.error("delivered email failed", e && e.message); }
      }
      return res.status(200).json({ row, mailed });
    }
    if (req.method === "GET") {
      const t = clean(req.query && req.query.q, 60).replace(/[(),*%]/g, "");
      const f = t ? `&or=(email.ilike.*${db.q(t)}*,phone.ilike.*${db.q(t)}*,name.ilike.*${db.q(t)}*,service.ilike.*${db.q(t)}*)` : "";
      const rows = await db.rest("GET", `subscriptions?select=*&order=created_at.desc&limit=300${f}`);
      return res.status(200).json({ rows: (rows || []).map((r) => Object.assign({}, r, { acct_pass: undefined, acct_pin: undefined, gift_code: undefined, access: access.fromRow(r) })) });
    }
    if (req.method === "POST") {
      const gift = /gift card$/i.test(clean(body.service, 80)), email = normEmail(body.email), months = gift ? 6 : Math.floor(Number(body.months));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: "Enter a valid email." });
      if (!clean(body.service, 80) || !clean(body.plan, 80) || !(months >= 1 && months <= 60)) return res.status(400).json({ error: "Choose a service and plan." });
      if (body.start && !validDate(body.start)) return res.status(400).json({ error: "Start date is not valid." });
      const row = await addSub({ email, name: clean(body.name, 60), phone: clean(body.phone, 20), service: clean(body.service, 80), plan: clean(body.plan, 80), months, nostack: gift, start: body.start || null, notes: clean(body.notes, 200), source: "admin" });
      const lg = access.toRow(body);
      if (lg && row && row.id) { try { await db.rest("PATCH", `subscriptions?id=eq.${row.id}`, lg); } catch (e) { console.error("login details not saved", e && e.message); return res.status(200).json({ row, warn: "Added, but the login details could not be saved. Run the latest SQL in Supabase." }); } }
      return res.status(200).json({ row });
    }
    if (!(id > 0)) return res.status(400).json({ error: "Missing id." });
    if (req.method === "PATCH") {
      const upd = {};
      if (body.end_date !== undefined) { if (!validDate(body.end_date)) return res.status(400).json({ error: "Expiry date is not valid." }); upd.end_date = body.end_date; }
      const lg = access.toRow(body);
      if (lg) Object.assign(upd, lg);
      if (!Object.keys(upd).length) return res.status(400).json({ error: "Nothing to change." });
      return res.status(200).json({ row: (await db.rest("PATCH", `subscriptions?id=eq.${id}`, upd, "return=representation"))[0] });
    }
    if (req.method === "DELETE") { await db.rest("DELETE", `subscriptions?id=eq.${id}`); return res.status(200).json({ ok: true }); }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("admin error", e && e.message);
    return res.status(424).json({ error: "Request failed: " + String((e && e.message) || "").slice(0, 120) });
  }
};
