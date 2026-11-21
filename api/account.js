/* Customer account API (passwordless).
   POST /api/account?a=login    {email}  -> emails a sign-in link to any valid email, so first-time visitors can create an account (rate limited to one per minute per email)
   POST /api/account?a=code     {email,code} -> exchanges the 6-digit emailed code for a session token (5 tries, 10 minutes, single use)
   POST /api/account?a=session  {token}  -> exchanges the link token for a 30-day session token
   GET  /api/account?a=me                -> the signed-in customer's subscriptions   (Authorization: Bearer <session>)
   GET  /api/account?a=list              -> the customer's wishlist and watched titles
   POST /api/account?a=list {k,id,s,t,p,y,v} -> sets one title's status: s = "wish" | "watched" | "" (remove)
   POST /api/account?a=profile {name,picture} -> saves the customer's display name and profile photo (picture: small image data URL, or "" to remove) */
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

// One row per successful sign-in (email, method, time). Best effort: a missing table never blocks signing in.
async function logLogin(email, method, name) {
  const row = { email: normEmail(email), method: String(method).slice(0, 20) };
  const nm = String(name || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80);
  try { await db.rest("POST", "login_events", [nm ? { ...row, name: nm } : row], "return=minimal"); }
  catch (e) { // the name column may not exist yet: log without it
    try { await db.rest("POST", "login_events", [row], "return=minimal"); } catch (e2) { console.error("login not logged", e2 && e2.message); }
  }
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
      {
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
      await logLogin(email, "email-code");
      return res.status(200).json({ session: sign({ t: "sess", e: email, n: "", pic: "", pv: "", exp: Date.now() + 30 * 86400000 }), email });
    }
    if (a === "session" && req.method === "POST") {
      const o = verify(body.token, "link");
      if (!o) return res.status(401).json({ error: "This link has expired. Please request a new one." });
      await logLogin(o.e, o.pv || "email-link", o.n);
      return res.status(200).json({ session: sign({ t: "sess", e: o.e, n: o.n || "", pic: o.pic || "", pv: o.pv || "", exp: Date.now() + 30 * 86400000 }), email: o.e });
    }
    if (a === "seen" && req.method === "POST") { // the customer has read the "your login details changed" notice
      const o = verify(bearer(req), "sess");
      if (!o) return res.status(401).json({ error: "Please sign in again." });
      const ids = (Array.isArray(body.ids) ? body.ids : []).map((x) => parseInt(x, 10)).filter((x) => x > 0).slice(0, 50);
      if (ids.length) { try { await db.rest("PATCH", `subscriptions?email=eq.${db.q(o.e)}&id=in.(${ids.join(",")})`, { acct_seen_at: new Date().toISOString() }); } catch (e) { console.error("seen not saved", e && e.message); } }
      return res.status(200).json({ ok: true });
    }
    if (a === "profile" && req.method === "POST") {
      const o = verify(bearer(req), "sess");
      if (!o) return res.status(401).json({ error: "Please sign in again." });
      const name = String(body.name || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
      if (name.length < 2) return res.status(400).json({ error: "Please enter your name (at least 2 letters)." });
      const row = { email: normEmail(o.e), name, updated_at: new Date().toISOString() };
      if (body.picture !== undefined) {
        const pic = String(body.picture || "");
        if (pic && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(pic)) return res.status(400).json({ error: "That image could not be used. Please choose a JPG or PNG photo." });
        if (pic.length > 60000) return res.status(400).json({ error: "That photo is too large. Please choose a smaller one." });
        row.picture = pic;
      }
      try { await db.rest("POST", "profiles?on_conflict=email", [row], "resolution=merge-duplicates,return=minimal"); }
      catch (e) { console.error("profile not saved", e && e.message); return res.status(424).json({ error: "Profile editing is not available yet. Please try again later." }); }
      return res.status(200).json({ ok: true, profile: { name, picture: row.picture !== undefined ? row.picture : undefined } });
    }
    if (a === "list") {
      const o = verify(bearer(req), "sess");
      if (!o) return res.status(401).json({ error: "Please sign in to use your lists." });
      const email = normEmail(o.e);
      if (req.method === "GET") {
        try {
          const rows = await db.rest("GET", `watchlist?email=eq.${db.q(email)}&select=kind,tmdb_id,status,title,poster,year,rating,added_at&order=added_at.desc&limit=500`) || [];
          return res.status(200).json({ items: rows.map((r) => ({ k: r.kind, id: r.tmdb_id, s: r.status, t: r.title || "", p: r.poster || "", y: r.year || "", v: Number(r.rating) || 0, at: r.added_at })) });
        } catch (e) { console.error("watchlist read", e && e.message); return res.status(424).json({ error: "Lists are not available yet." }); }
      }
      if (req.method === "POST") {
        const k = body.k === "tv" ? "tv" : body.k === "movie" ? "movie" : "", id = String(body.id || ""), st = String(body.s || "");
        if (!k || !/^\d{1,9}$/.test(id) || !["wish", "watched", ""].includes(st)) return res.status(400).json({ error: "Bad request." });
        try {
          if (!st) { await db.rest("DELETE", `watchlist?email=eq.${db.q(email)}&kind=eq.${k}&tmdb_id=eq.${id}`); return res.status(200).json({ ok: true, s: "" }); }
          const poster = /^\/[A-Za-z0-9_-]{5,60}\.(jpg|png|webp)$/.test(String(body.p || "")) ? String(body.p) : "";
          const v = Math.max(0, Math.min(10, Number(body.v) || 0));
          const row = { email, kind: k, tmdb_id: Number(id), status: st, title: String(body.t || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 140), poster, year: /^\d{4}$/.test(String(body.y || "")) ? String(body.y) : "", rating: Math.round(v * 10) / 10, added_at: new Date().toISOString() };
          await db.rest("POST", "watchlist?on_conflict=email,kind,tmdb_id", [row], "resolution=merge-duplicates,return=minimal");
          return res.status(200).json({ ok: true, s: st });
        } catch (e) { console.error("watchlist write", e && e.message); return res.status(424).json({ error: "Lists are not available yet. Please try again later." }); }
      }
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
      // Purchases the admin added by hand (offline): shown beside online orders, grouped by order reference.
      let offline = [];
      try {
        let adm;
        try { adm = await db.rest("GET", `subscriptions?email=eq.${db.q(o.e)}&source=eq.admin&select=id,service,plan,start_date,end_date,order_ref,created_at,price,pay_method,txn_id,channel&order=created_at.desc&limit=100`); }
        catch (e) { adm = await db.rest("GET", `subscriptions?email=eq.${db.q(o.e)}&source=eq.admin&select=id,service,plan,start_date,end_date,order_ref,created_at&order=created_at.desc&limit=100`); } // payment columns not added yet
        const g = new Map();
        (adm || []).forEach((r) => { const k = r.order_ref || "ADM" + r.id; if (!g.has(k)) g.set(k, { id: k, date: r.created_at, kind: "offline", delivery: "delivered", delivered_at: r.created_at, pay_method: r.pay_method || "", txn_id: r.txn_id || "", channel: r.channel || "", start: r.start_date, end: r.end_date, lines: [] }); const x = g.get(k); x.lines.push({ name: r.service, plan: r.plan, q: 1, price: Number(r.price) || 0 }); if (r.pay_method && !x.pay_method) x.pay_method = r.pay_method; if (r.txn_id && !x.txn_id) x.txn_id = r.txn_id; if (r.channel && !x.channel) x.channel = r.channel; });
        offline = [...g.values()];
      } catch (e) { console.error("offline purchases", e && e.message); }
      let notices = [];
      try {
        notices = ((await db.rest("GET", "notices?select=id,title,message,kind,created_at,expires_at&order=created_at.desc&limit=20")) || [])
          .filter((n) => !n.expires_at || new Date(n.expires_at) > new Date()).map((n) => ({ id: n.id, title: n.title, message: n.message, kind: n.kind, at: n.created_at }));
      } catch (e) { /* notices table not created yet */ }
      let custom = null, editable = true; // the customer's own name and photo (profiles table; may not exist yet)
      try { custom = ((await db.rest("GET", `profiles?email=eq.${db.q(normEmail(o.e))}&select=name,picture&limit=1`)) || [])[0] || null; } catch (e) { editable = false; }
      return res.status(200).json({
        notices, email: o.e, today: dhakaToday(), contact: { name: c.name || "", phone: c.phone || "" },
        profile: { name: (custom && custom.name) || o.n || c.name || "", picture: custom && custom.picture !== null && custom.picture !== undefined ? custom.picture : (o.pic || ""), provider: o.pv || "", editable, custom: !!(custom && custom.picture) },
        subscriptions: (rows || []).map((r) => ({ id: r.id, service: r.service, plan: r.plan, months: r.months, start_date: r.start_date, end_date: r.end_date, order_ref: r.order_ref || null, login: access.fromRow(r) })),
        orders: orders.map((r) => ({ id: r.mtid, date: r.paid_at || r.created_at, kind: "online", delivery: r.delivery || "pending", delivered_at: r.delivered_at || null, lines: Array.isArray(r.lines) ? r.lines : [] })).concat(offline).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
      });
    }
    return res.status(404).json({ error: "Not found" });
  } catch (e) {
    console.error("account error", a, e && e.message);
    return res.status(424).json({ error: "Something went wrong. Please try again." });
  }
};
