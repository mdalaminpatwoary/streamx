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

// Optional payment details for hand-added purchases (price, method, transaction id). Returns a warning text if the columns are missing.
async function savePay(row, body) {
  const price = Number(String(body.price || "").replace(/[^0-9.]/g, "")), pay = {};
  if (price > 0 && price < 10000000) pay.price = Math.round(price * 100) / 100;
  const pm = clean(body.pay_method, 30); if (pm) pay.pay_method = pm;
  const tx = clean(body.txn_id, 60); if (tx) pay.txn_id = tx;
  if (!Object.keys(pay).length || !row || !row.id) return "";
  try { await db.rest("PATCH", `subscriptions?id=eq.${row.id}`, pay); return ""; }
  catch (e) { console.error("payment details not saved", e && e.message); return "the payment details could not be saved. Run the latest SQL in Supabase."; }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const k = process.env.ADMIN_KEY;
    if (!k || !db.enabled()) return res.status(503).json({ error: "Admin is not configured." });
    if (!crypto.timingSafeEqual(h(req.headers["x-admin-key"] || ""), h(k))) return res.status(401).json({ error: "Wrong admin key." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const id = parseInt((req.query && req.query.id) || "", 10);

    // Notice board: announcements for every customer (they only raise the bell count)
    if (req.query && (req.query.view === "notices" || req.query.notice)) {
      if (req.method === "GET") return res.status(200).json({ rows: await db.rest("GET", "notices?select=*&order=created_at.desc&limit=100") });
      if (req.method === "POST") {
        const title = clean(body.title, 80), message = clean(body.message, 500);
        const kind = ["info", "offer", "maintenance", "important"].includes(body.kind) ? body.kind : "info";
        if (!title) return res.status(400).json({ error: "Please add a title." });
        let exp = null;
        if (body.expires_at) { const d = new Date(body.expires_at); if (isNaN(d)) return res.status(400).json({ error: "Invalid expiry date." }); exp = d.toISOString(); }
        const row = (await db.rest("POST", "notices", { title, message, kind, expires_at: exp }, "return=representation"))[0];
        return res.status(200).json({ row });
      }
      if (req.method === "DELETE") {
        const nid = parseInt(req.query.notice, 10);
        if (!(nid > 0)) return res.status(400).json({ error: "Invalid notice." });
        await db.rest("DELETE", `notices?id=eq.${nid}`);
        return res.status(200).json({ ok: true });
      }
    }
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
      const svc = clean(body.service, 80), gift = /gift card$/i.test(svc), email = normEmail(body.email), months = gift ? 6 : Math.floor(Number(body.months));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: "Enter a valid email." });
      if (body.start && !validDate(body.start)) return res.status(400).json({ error: "Start date is not valid." });
      const base = { email, name: clean(body.name, 60), phone: clean(body.phone, 20), service: svc, months, nostack: gift, start: body.start || null, notes: clean(body.notes, 200), source: "admin" };
      if (gift) {
        // One order can hold several cards of different amounts: each becomes its own subscription row, grouped by a shared order reference.
        const cards = (Array.isArray(body.gifts) ? body.gifts : [{ amount: body.gift_amount || body.plan, code: body.gift_code }]).slice(0, 20).map((g) => ({ amount: clean(g && g.amount, 20), code: clean(g && g.code, 120) })).filter((g) => g.amount);
        if (!svc || !cards.length) return res.status(400).json({ error: "Add at least one gift card with an amount." });
        const ref = "ADM" + Date.now().toString(36).toUpperCase(), rows = [];
        let warn = "";
        for (let i = 0; i < cards.length; i++) {
          const row = await addSub(Object.assign({}, base, { plan: cards[i].amount, order_ref: ref, line_idx: i }));
          rows.push(row);
          if (row && row.id) { try { const lg = access.toRow({ gift_code: cards[i].code, gift_region: body.gift_region || "US", gift_amount: cards[i].amount }); await db.rest("PATCH", `subscriptions?id=eq.${row.id}`, lg); } catch (e) { console.error("gift details not saved", e && e.message); warn = "Added, but the gift card details could not be saved. Run the latest SQL in Supabase."; } }
        }
        { const pw = await savePay(rows[0], body); if (pw) warn = warn || "Added, but " + pw; }
        return res.status(200).json(warn ? { row: rows[0], rows, warn } : { row: rows[0], rows });
      }
      if (!svc || !clean(body.plan, 80) || !(months >= 1 && months <= 60)) return res.status(400).json({ error: "Choose a service and plan." });
      const row = await addSub(Object.assign({}, base, { plan: clean(body.plan, 80) }));
      const lg = access.toRow(body);
      if (lg && row && row.id) { try { await db.rest("PATCH", `subscriptions?id=eq.${row.id}`, lg); } catch (e) { console.error("login details not saved", e && e.message); return res.status(200).json({ row, warn: "Added, but the login details could not be saved. Run the latest SQL in Supabase." }); } }
      const payWarn = await savePay(row, body);
      return res.status(200).json(payWarn ? { row, warn: "Added, but " + payWarn } : { row });
    }
    if (!(id > 0)) return res.status(400).json({ error: "Missing id." });
    if (req.method === "PATCH") {
      const upd = {};
      if (body.end_date !== undefined) { if (!validDate(body.end_date)) return res.status(400).json({ error: "Expiry date is not valid." }); upd.end_date = body.end_date; }
      const lg = access.toRow(body);
      let stamp = null;
      if (lg) {
        Object.assign(upd, lg);
        // Tell the customer what changed the next time they open My account (never includes secrets).
        try { const cur = ((await db.rest("GET", `subscriptions?id=eq.${id}&select=*`)) || [])[0], lines = cur ? access.describeChange(cur, body) : []; if (lines.length) stamp = { acct_changed_at: new Date().toISOString(), acct_change: lines.join("\n") }; } catch (e) { console.error("change notice skipped", e && e.message); }
      }
      if (!Object.keys(upd).length) return res.status(400).json({ error: "Nothing to change." });
      let out;
      try { out = await db.rest("PATCH", `subscriptions?id=eq.${id}`, Object.assign({}, upd, stamp || {}), "return=representation"); }
      catch (e) { if (!stamp) throw e; out = await db.rest("PATCH", `subscriptions?id=eq.${id}`, upd, "return=representation"); } // notice columns not added yet
      return res.status(200).json({ row: out[0] });
    }
    if (req.method === "DELETE") { await db.rest("DELETE", `subscriptions?id=eq.${id}`); return res.status(200).json({ ok: true }); }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("admin error", e && e.message);
    return res.status(424).json({ error: "Request failed: " + String((e && e.message) || "").slice(0, 120) });
  }
};
