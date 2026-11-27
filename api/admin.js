/* Owner-only API for the /admin/ page. Every call needs the x-admin-key header (env ADMIN_KEY).
   GET    /api/admin?q=<text>       list / search subscriptions
   POST   /api/admin                add one  {email,name,phone,service,plan,months,start?,notes?}
   PATCH  /api/admin?id=<n>         change any purchase detail {name,email,phone,service,plan,months,start_date,end_date,price,pay_method,txn_id,channel,notes,source} and/or login details {acct_email, acct_pass, acct_otp, acct_profile, acct_pin}
   PATCH  also takes {refund_amount, refund_method, refund_note} to record a partial refund (empty amount clears it)
   DELETE /api/admin?id=<n>         remove one (also needs header x-admin-confirm = the admin password)
   POST   /api/admin?reconcile=1    check unpaid orders (last 7 days) with EPS and activate the ones EPS says are paid
   POST   /api/admin?sheetsync=1    send all hand-added purchases to the Google Sheet
   GET    /api/admin?view=orders    list paid orders (newest first) with delivery status
   PATCH  /api/admin?review=<id>  feature or unfeature a review {popular:true|false} (shown in the home page spotlight)
   PATCH  /api/admin?order=<mtid>   set delivery  {delivery:"pending"|"delivered"|"refunded"}
   GET    /api/admin?view=customers&q=<text>   list customers (profiles + purchase history)
   GET/POST/PATCH/DELETE /api/admin?view=coupons | ?coupon=new | ?coupon=<id>   coupon codes
   GET/POST/DELETE /api/admin?view=reviews | ?review=new | ?review=<id>   customer reviews
   PATCH  /api/admin?customer=<email>          change name / mobile / remove photo {name, phone, remove_photo, notify}. The email can never be changed. */
const crypto = require("crypto");
const db = require("./_db");
const { addSub, validDate, normEmail } = require("./_subs");
const access = require("./_access");
const sheet = require("./_sheet");
const throttle = require("./_throttle");
const { cleanPhone } = require("./_phone");

const h = (s) => crypto.createHash("sha256").update(String(s)).digest();
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

// Optional payment details for hand-added purchases (price, method, transaction id). Returns a warning text if the columns are missing.
async function savePay(row, body) {
  const price = Number(String(body.price || "").replace(/[^0-9.]/g, "")), pay = {};
  if (price > 0 && price < 10000000) pay.price = Math.round(price * 100) / 100;
  const pm = clean(body.pay_method, 30); if (pm) pay.pay_method = pm;
  const tx = clean(body.txn_id, 60); if (tx) pay.txn_id = tx;
  const ch = clean(body.channel, 30); if (ch) pay.channel = ch;
  if (!Object.keys(pay).length || !row || !row.id) return "";
  try { await db.rest("PATCH", `subscriptions?id=eq.${row.id}`, pay); return ""; }
  catch (e) { console.error("payment details not saved", e && e.message); return "the payment details could not be saved. Run the latest SQL in Supabase."; }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const k = process.env.ADMIN_KEY;
    if (!k || !db.enabled()) return res.status(503).json({ error: "Admin is not configured." });
    const ip = throttle.ipOf(req), wait = await throttle.locked(ip);
    if (wait) { res.setHeader("Retry-After", String(wait)); return res.status(429).json({ error: "Too many wrong keys. Try again in " + Math.ceil(wait / 60) + " minute(s)." }); }
    if (!crypto.timingSafeEqual(h(req.headers["x-admin-key"] || ""), h(k))) {
      // An empty key is just the page asking "am I signed in?", so only real wrong guesses count.
      if (req.headers["x-admin-key"]) { await throttle.fail(ip); await new Promise((r) => setTimeout(r, 600)); }
      return res.status(401).json({ error: "Wrong admin key." });
    }
    if (req.headers["x-admin-key"]) throttle.clear(ip).catch(() => {});
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const id = parseInt((req.query && req.query.id) || "", 10);

    // Missed payments: EPS says "paid" but the customer's browser never came back to the result page, so the order was never marked paid.
    // This asks EPS about every unpaid order of the last 7 days and activates the ones that were really paid.
    if (req.query && req.query.reconcile && req.method === "POST") {
      const eps = require("./_eps"), subs = require("./_subs"), verify = require("./verify");
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const rows = (await db.rest("GET", `orders?paid=eq.false&created_at=gte.${db.q(since)}&select=mtid,email,name,created_at&order=created_at.desc&limit=24`)) || [];
      const c = eps.config(), token = await eps.getToken(c), found = [];
      await Promise.all(rows.map(async (o) => {
        try {
          const r = await eps.epsFetch(`${c.base}/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${encodeURIComponent(o.mtid)}`, { method: "GET", headers: { Authorization: "Bearer " + token, "x-hash": eps.xhash(c.hashKey, o.mtid) } });
          const j = r.json || {};
          if (String(j.Status).toLowerCase() === "success") {
            try { await verify.mailOrder(j, o.mtid, c.env, req); } catch (e) { /* the copy email is optional */ }
            const n = await subs.activateOrder(o.mtid);
            found.push({ mtid: o.mtid, email: o.email, name: o.name, amount: j.TotalAmount, subs: n });
          }
        } catch (e) { console.error("reconcile skipped", o.mtid, e && e.message); }
      }));
      return res.status(200).json({ ok: true, checked: rows.length, found });
    }

    // Send every hand-added purchase to the Google Sheet (button on the Active Users tab)
    if (req.query && req.query.sheetsync && req.method === "POST") {
      if (!sheet.enabled() && !sheet.trackOn()) return res.status(200).json({ ok: false, error: "The Google Sheet link is not set up yet (SHEETS_WEBHOOK_URL)." });
      const r = await sheet.syncAll(req.query.offset, req.query.size);
      return res.status(200).json(r);
    }

    // Notice board: announcements for every customer (they only raise the bell count)
    if (req.query && (req.query.view === "notices" || req.query.notice)) {
      if (req.method === "GET") return res.status(200).json({ rows: await db.rest("GET", "notices?select=*&order=created_at.desc&limit=100") });
      if (req.method === "POST") {
        const title = clean(body.title, 90), message = clean(body.message, 700);
        const kind = ["info", "price", "offer", "maintenance", "important"].includes(body.kind) ? body.kind : "info";
        if (!title) return res.status(400).json({ error: "Please add a title." });
        let exp = null;
        if (body.expires_at) { const d = new Date(body.expires_at); if (isNaN(d)) return res.status(400).json({ error: "Invalid expiry date." }); exp = d.toISOString(); }
        let link = clean(body.link, 300); if (link && !/^(https?:\/\/|\/)/i.test(link)) return res.status(400).json({ error: "The link must start with https:// or /" });
        const base = { title, message, kind, expires_at: exp }, extra = { pinned: !!body.pinned, link, link_label: clean(body.link_label, 30) };
        let row; try { row = (await db.rest("POST", "notices", { ...base, ...extra }, "return=representation"))[0]; }
        catch (e) { if (!extra.pinned && !link) row = (await db.rest("POST", "notices", base, "return=representation"))[0]; else throw new Error("The notice board needs the latest SQL in Supabase (pinned and link)."); }
        return res.status(200).json({ row });
      }
      if (req.method === "DELETE") {
        const nid = parseInt(req.query.notice, 10);
        if (!(nid > 0)) return res.status(400).json({ error: "Invalid notice." });
        await db.rest("DELETE", `notices?id=eq.${nid}`);
        return res.status(200).json({ ok: true });
      }
    }
    // Reviews: post and delete customer reviews (shown on the site; proof = screenshot or link to the original review)
    if (req.query && (req.query.view === "reviews" || req.query.review)) {
      const RV = "id,name,role,company,loc,services,rating,body,photo,proof_kind,proof_url,has_img,popular,created_at,kind,institution,country,expat,has_photo";
      if (req.method === "GET") return res.status(200).json({ rows: await db.rest("GET", `reviews?select=${RV}&order=created_at.desc&limit=200`) });
      if (req.method === "POST") {
        const name = clean(body.name, 60), text = clean(body.body, 600);
        if (!name || !text) return res.status(400).json({ error: "Please add the customer's name and the review text." });
        const services = (Array.isArray(body.services) ? body.services : []).map((x) => clean(x, 60)).filter(Boolean).slice(0, 6);
        const rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
        let kind = ["image", "link"].includes(body.proof_kind) ? body.proof_kind : "", purl = "", pimg = "";
        if (kind === "link") { purl = clean(body.proof_url, 400); if (!/^https?:\/\//i.test(purl)) return res.status(400).json({ error: "The review link must start with https://" }); }
        if (kind === "image") { pimg = String(body.proof_img || ""); if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(pimg) || pimg.length > 400000) return res.status(400).json({ error: "The screenshot must be a JPEG, PNG or WebP image under 300 KB." }); }
        let photo = clean(body.photo, 400); if (photo && !/^https?:\/\//i.test(photo)) photo = "";
        const student = body.kind === "student", country = /^[A-Za-z]{2}$/.test(String(body.country || "")) ? String(body.country).toUpperCase() : "";
        let phimg = String(body.photo_img || ""); if (phimg && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(phimg) || phimg.length > 150000)) return res.status(400).json({ error: "The customer photo must be a JPEG, PNG or WebP image." });
        const row = { name, role: clean(body.role, 60) || (student ? "Student" : ""), company: student ? "" : clean(body.company, 80), loc: clean(body.loc, 60), services, rating, body: text, photo: phimg ? "" : photo, proof_kind: kind, proof_url: purl, proof_img: pimg, has_img: !!pimg, popular: !!body.popular, kind: student ? "student" : "pro", institution: student ? clean(body.institution, 100) : "", country, expat: !!body.expat && country !== "BD", photo_img: phimg, has_photo: !!phimg };
        const out = (await db.rest("POST", "reviews", row, "return=representation"))[0];
        delete out.proof_img; delete out.photo_img; return res.status(200).json({ row: out });
      }
      if (req.method === "PATCH") {
        const rid = parseInt(req.query.review, 10);
        if (!(rid > 0)) return res.status(400).json({ error: "Invalid review." });
        await db.rest("PATCH", `reviews?id=eq.${rid}`, { popular: !!body.popular });
        return res.status(200).json({ ok: true });
      }
      if (req.method === "DELETE") {
        const rid = parseInt(req.query.review, 10);
        if (!(rid > 0)) return res.status(400).json({ error: "Invalid review." });
        await db.rest("DELETE", `reviews?id=eq.${rid}`);
        return res.status(200).json({ ok: true });
      }
    }
    // Coupon codes: create, pause and delete (the discount itself is always calculated at checkout, on the server)
    if (req.query && (req.query.view === "coupons" || req.query.coupon)) {
      if (req.method === "GET") {
        const rows = (await db.rest("GET", "coupons?select=*&order=created_at.desc&limit=200")) || [];
        let paid = []; try { paid = (await db.rest("GET", "orders?select=coupon,discount&coupon=not.is.null&paid=eq.true&limit=5000")) || []; } catch (e) { /* coupon columns not added yet */ }
        return res.status(200).json({ rows: rows.map((r) => { const u = paid.filter((o) => o.coupon === r.code); return { ...r, used: u.length, saved: u.reduce((s, o) => s + (o.discount || 0), 0) }; }) });
      }
      if (req.method === "POST") {
        const code = require("./_coupon").norm(body.code);
        if (code.length < 3) return res.status(400).json({ error: "The code needs at least 3 letters or numbers." });
        const kind = body.kind === "fixed" ? "fixed" : "percent", value = Math.floor(Number(body.value));
        if (!(value >= 1) || (kind === "percent" && value > 100) || value > 100000) return res.status(400).json({ error: kind === "percent" ? "Percent must be between 1 and 100." : "Enter the taka amount off." });
        const num = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
        let exp = null; if (body.expires_at) { const d = new Date(body.expires_at); if (isNaN(d)) return res.status(400).json({ error: "Invalid expiry date." }); exp = d.toISOString(); }
        const row = { code, kind, value, max_discount: kind === "percent" ? num(body.max_discount, 100000) : 0, min_order: num(body.min_order, 1000000), max_uses: num(body.max_uses, 1000000), per_email: body.per_email !== false, services: (Array.isArray(body.services) ? body.services : []).map((x) => clean(x, 60)).filter(Boolean).slice(0, 40), expires_at: exp, active: true, note: clean(body.note, 120) };
        try { const out = (await db.rest("POST", "coupons", row, "return=representation"))[0]; return res.status(200).json({ row: out }); }
        catch (e) { if (/duplicate|unique|23505/i.test(e.message || "")) return res.status(409).json({ error: "That code already exists." }); throw e; }
      }
      const cid = parseInt(req.query.coupon, 10);
      if (!(cid > 0)) return res.status(400).json({ error: "Invalid coupon." });
      if (req.method === "PATCH") { await db.rest("PATCH", `coupons?id=eq.${cid}`, { active: !!body.active }); return res.status(200).json({ ok: true }); }
      if (req.method === "DELETE") { await db.rest("DELETE", `coupons?id=eq.${cid}`); return res.status(200).json({ ok: true }); }
    }
    // Customers: look one up and correct their name or mobile number (never the email). The customer is told in My account and by email.
    if (req.query && (req.query.view === "customers" || req.query.customer)) {
      if (req.method === "GET") {
        const t = clean(req.query.q, 60).replace(/[(),*%]/g, "");
        const pq = t ? `&or=(email.ilike.*${db.q(t)}*,name.ilike.*${db.q(t)}*,phone.ilike.*${db.q(t)}*)` : "";
        const [pr, sb] = await Promise.all([
          db.rest("GET", `profiles?select=email,name,phone&order=updated_at.desc&limit=300${pq}`).catch(() => db.rest("GET", `profiles?select=email,name&order=updated_at.desc&limit=300${pq.replace(/,phone\.ilike\.\*[^)]*\*/, "")}`).catch(() => [])),
          db.rest("GET", `subscriptions?select=email,name,phone,end_date&order=created_at.desc&limit=1000${pq}`).catch(() => []),
        ]);
        const today = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10), m = new Map();
        const get = (e) => { e = normEmail(e); if (!m.has(e)) m.set(e, { email: e, name: "", phone: "", subs: 0, active: 0, account: false }); return m.get(e); };
        (sb || []).forEach((r) => { const c = get(r.email); c.name = c.name || r.name || ""; c.phone = c.phone || r.phone || ""; c.subs++; if (r.end_date >= today) c.active++; });
        (pr || []).forEach((r) => { const c = get(r.email); c.account = true; if (r.name) c.name = r.name; if (r.phone) c.phone = r.phone; });
        return res.status(200).json({ rows: [...m.values()].slice(0, 300) });
      }
      if (req.method === "PATCH") {
        const email = normEmail(req.query.customer);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: "Invalid customer." });
        const name = clean(body.name, 60).replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
        if (name && name.length < 2) return res.status(400).json({ error: "The name needs at least 2 letters." });
        const rawPhone = clean(body.phone, 25), phone = rawPhone ? cleanPhone(rawPhone) : "";
        if (rawPhone && !phone) return res.status(400).json({ error: "That mobile number does not look right. Use 01XXXXXXXXX or +<country code><number>." });
        // what the customer has now: their own profile first, else what the purchases say
        let prof = null;
        try { prof = ((await db.rest("GET", `profiles?email=eq.${db.q(email)}&select=name,phone&limit=1`)) || [])[0] || null; }
        catch (e) { try { prof = ((await db.rest("GET", `profiles?email=eq.${db.q(email)}&select=name&limit=1`)) || [])[0] || null; } catch (e2) { return res.status(424).json({ error: "Profiles are not set up in Supabase yet." }); } }
        const sub = ((await db.rest("GET", `subscriptions?email=eq.${db.q(email)}&select=name,phone&order=created_at.desc&limit=1`).catch(() => [])) || [])[0] || {};
        const was = { name: (prof && prof.name) || sub.name || "", phone: (prof && prof.phone) || sub.phone || "" };
        const changes = [], show = (v) => v || "not set";
        if (name !== was.name) changes.push(["Name", was.name ? `${was.name} → ${name || "removed"}` : `set to ${name || "empty"}`]);
        if (phone !== was.phone) changes.push(["Mobile number", was.phone ? `${was.phone} → ${phone || "removed"}` : `set to ${phone || "empty"}`]);
        if (body.remove_photo) changes.push(["Profile photo", "removed"]);
        if (!changes.length) return res.status(400).json({ error: "Nothing to change." });
        const notify = body.notify !== false, row = { email, name: name || null, phone: phone || null, updated_at: new Date().toISOString() };
        if (body.remove_photo) row.picture = "";
        const stamp = { admin_changed_at: new Date().toISOString(), admin_change: changes.map((c) => c[0] + ": " + c[1]).join("\n") };
        let inapp = false, warn = "";
        const save = (r) => db.rest("POST", "profiles?on_conflict=email", [r], "resolution=merge-duplicates,return=minimal");
        try { if (notify) { await save(Object.assign({}, row, stamp)); inapp = true; } else await save(row); }
        catch (e) {
          try { await save(row); warn = notify ? "Saved, but the in-account notice needs the latest SQL in Supabase." : ""; }
          catch (e2) { console.error("customer not saved", e2 && e2.message); return res.status(424).json({ error: "Could not save. Run the latest SQL in Supabase (profiles.phone)." }); }
        }
        // keep the purchase rows in step so the admin list and sheets show the same details
        const sp = {}; if (name !== was.name && name) sp.name = name; if (phone !== was.phone && phone) sp.phone = phone;
        if (Object.keys(sp).length) { try { await db.rest("PATCH", `subscriptions?email=eq.${db.q(email)}`, sp); } catch (e) { console.error("subscriptions not synced", e && e.message); } }
        let mailed = false;
        if (notify && process.env.RESEND_API_KEY) {
          try { const mail = require("./_mail"), m = mail.profileChanged(req, { email, name: name || was.name, changes }); await mail.send({ to: email, subject: m.subject, html: m.html, text: m.text, idem: "profile-" + email + "-" + Date.now() }); mailed = true; }
          catch (e) { console.error("profile email failed", e && e.message); warn = warn || "Saved, but the email could not be sent."; }
        }
        return res.status(200).json({ ok: true, customer: { email, name, phone }, changes, inapp, mailed, warn });
      }
    }
    const ord = clean(req.query && req.query.order, 40).replace(/[^0-9A-Za-z]/g, "");
    if (req.method === "GET" && req.query && req.query.view === "orders")
      return res.status(200).json({ rows: await db.rest("GET", "orders?select=*&paid=eq.true&order=created_at.desc&limit=200") });
    // The purchases created by one paid order, with their login details, so access can be given right from the Paid orders list.
    if (req.method === "GET" && req.query && req.query.view === "ordersubs") {
      const mt = clean(req.query.order, 80);
      if (!mt) return res.status(400).json({ error: "Missing order id." });
      const rows = await db.rest("GET", `subscriptions?order_ref=eq.${db.q(mt)}&select=*&order=id.asc`);
      return res.status(200).json({ rows: (rows || []).map((r) => Object.assign({}, r, { acct_pass: undefined, acct_pin: undefined, gift_code: undefined, access: access.fromRow(r) })) });
    }
    if (req.method === "PATCH" && ord) {
      const dv = ["delivered", "pending", "refunded"].includes(body.delivery) ? body.delivery : "";
      if (!dv) return res.status(400).json({ error: "Invalid status." });
      const before = ((await db.rest("GET", `orders?mtid=eq.${db.q(ord)}&select=delivery`)) || [])[0];
      const row = (await db.rest("PATCH", `orders?mtid=eq.${db.q(ord)}`, { delivery: dv, delivered_at: dv === "delivered" ? new Date().toISOString() : null }, "return=representation"))[0];
      let mailed = false, mailNote = "";
      // First time it flips to "delivered": tell the customer by email.
      if (row && dv === "delivered" && !(before && before.delivery === "delivered")) {
        if (!row.email) mailNote = "No email address on this order, so no email was sent.";
        else if (!process.env.RESEND_API_KEY) mailNote = "Email is not configured (RESEND_API_KEY missing), so no email was sent.";
        else {
          try { const mail = require("./_mail"), m = mail.delivered(req, row); await mail.send({ to: row.email, subject: m.subject, html: m.html, text: m.text, idem: "delivered-" + row.mtid }); mailed = true; }
          catch (e) { console.error("delivered email failed", e && e.message); mailNote = "Email to the customer failed: " + String(e && e.message || "unknown error").slice(0, 120); }
        }
      } else if (row && dv === "delivered") mailNote = "Customer was already emailed earlier.";
      if (row && dv === "refunded" && !(before && before.delivery === "refunded")) {
        const rf = body.refund && typeof body.refund === "object" ? body.refund : {};
        if (rf.notify === false) mailNote = "Customer was not emailed (you turned it off).";
        else if (!row.email) mailNote = "No email address on this order, so no email was sent.";
        else if (!process.env.RESEND_API_KEY) mailNote = "Email is not configured (RESEND_API_KEY missing), so no email was sent.";
        else {
          try {
            const mail = require("./_mail"), m = mail.refunded(req, row, { amount: Number(rf.amount) || 0, fee: Number(rf.fee) || 0, method: clean(rf.method, 40), account: clean(rf.account, 60), ref: clean(rf.ref, 60), note: clean(rf.note, 300) });
            await mail.send({ to: row.email, subject: m.subject, html: m.html, text: m.text, idem: "refunded-" + row.mtid }); mailed = true;
          } catch (e) { console.error("refund email failed", e && e.message); mailNote = "Email to the customer failed: " + String(e && e.message || "unknown error").slice(0, 120); }
        }
      }
      return res.status(200).json({ row, mailed, mailNote });
    }
    if (req.method === "GET") {
      const t = clean(req.query && req.query.q, 60).replace(/[(),*%]/g, "");
      const f = (withMid) => t ? `&or=(email.ilike.*${db.q(t)}*,phone.ilike.*${db.q(t)}*,name.ilike.*${db.q(t)}*,service.ilike.*${db.q(t)}*${withMid ? `,manual_id.ilike.*${db.q(t)}*` : ""})` : "";
      let rows;
      try { rows = await db.rest("GET", `subscriptions?select=*&order=created_at.desc&limit=300${f(true)}`); }
      catch (e) { rows = await db.rest("GET", `subscriptions?select=*&order=created_at.desc&limit=300${f(false)}`); } // manual_id column not added yet
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
          const row = await addSub(Object.assign({}, base, { plan: cards[i].amount, order_ref: ref, line_idx: i, manual_id: i && rows[0] ? rows[0].manual_id : null }));
          rows.push(row);
          if (row && row.id) { try { const lg = access.toRow({ gift_code: cards[i].code, gift_region: body.gift_region || "US", gift_amount: cards[i].amount }); await db.rest("PATCH", `subscriptions?id=eq.${row.id}`, lg); } catch (e) { console.error("gift details not saved", e && e.message); warn = "Added, but the gift card details could not be saved. Run the latest SQL in Supabase."; } }
        }
        { const pw = await savePay(rows[0], body); if (pw) warn = warn || "Added, but " + pw; }
        for (let i = 0; i < rows.length; i++) await sheet.syncSub(rows[i] && rows[i].id);
        return res.status(200).json(warn ? { row: rows[0], rows, warn } : { row: rows[0], rows });
      }
      if (!svc || !clean(body.plan, 80) || !(months >= 1 && months <= 60)) return res.status(400).json({ error: "Choose a service and plan." });
      if (svc === "Entertainment Combo" && Array.isArray(body.parts) && body.parts.length === 2) {
        // The combo is two accounts (Netflix + Prime Video): one subscription row each, same dates, grouped by a shared order reference.
        const ref = "ADM" + Date.now().toString(36).toUpperCase(), names = ["Netflix", "Prime Video"], rows = [];
        let warn = "";
        for (let i = 0; i < 2; i++) {
          const row = await addSub(Object.assign({}, base, { plan: clean(body.plan, 60) + " · " + names[i], order_ref: ref, line_idx: i, start: i ? rows[0].start_date : base.start, nostack: i > 0, manual_id: i && rows[0] ? rows[0].manual_id : null }));
          rows.push(row);
          const lg = access.toRow(body.parts[i] || {});
          if (lg && row && row.id) { try { await db.rest("PATCH", `subscriptions?id=eq.${row.id}`, lg); } catch (e) { console.error("login details not saved", e && e.message); warn = "Added, but some login details could not be saved. Run the latest SQL in Supabase."; } }
        }
        { const pw = await savePay(rows[0], body); if (pw) warn = warn || "Added, but " + pw; }
        for (let i = 0; i < rows.length; i++) await sheet.syncSub(rows[i] && rows[i].id);
        return res.status(200).json(warn ? { row: rows[0], rows, warn } : { row: rows[0], rows });
      }
      const row = await addSub(Object.assign({}, base, { plan: clean(body.plan, 80) }));
      const lg = access.toRow(body);
      if (lg && row && row.id) { try { await db.rest("PATCH", `subscriptions?id=eq.${row.id}`, lg); } catch (e) { console.error("login details not saved", e && e.message); return res.status(200).json({ row, warn: "Added, but the login details could not be saved. Run the latest SQL in Supabase." }); } }
      const payWarn = await savePay(row, body);
      await sheet.syncSub(row && row.id);
      return res.status(200).json(payWarn ? { row, warn: "Added, but " + payWarn } : { row });
    }
    if (!(id > 0)) return res.status(400).json({ error: "Missing id." });
    if (req.method === "PATCH") {
      const upd = {};
      if (body.end_date !== undefined) { if (!validDate(body.end_date)) return res.status(400).json({ error: "Expiry date is not valid." }); upd.end_date = body.end_date; }
      // Purchase details: the admin can correct anything about the purchase itself.
      const has = (k) => body[k] !== undefined;
      if (has("name")) upd.name = clean(body.name, 60);
      if (has("email")) { const em = normEmail(body.email); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) || em.length > 120) return res.status(400).json({ error: "Enter a valid email address." }); upd.email = em; }
      if (has("phone")) { const raw = clean(body.phone, 25); upd.phone = raw ? cleanPhone(raw) || raw : ""; }
      if (has("service")) { const v = clean(body.service, 80); if (!v) return res.status(400).json({ error: "Service cannot be empty." }); upd.service = v; }
      if (has("plan")) { const v = clean(body.plan, 80); if (!v) return res.status(400).json({ error: "Plan cannot be empty." }); upd.plan = v; }
      if (has("months")) { const m = parseInt(body.months, 10); if (!(m >= 1 && m <= 60)) return res.status(400).json({ error: "Months must be between 1 and 60." }); upd.months = m; }
      if (has("start_date")) { if (!validDate(body.start_date)) return res.status(400).json({ error: "Start date is not valid." }); upd.start_date = body.start_date; }
      if (has("price")) { const t = String(body.price).trim(); if (!t) upd.price = null; else { const n = Number(t.replace(/[^0-9.]/g, "")); if (!(n >= 0 && n < 10000000)) return res.status(400).json({ error: "Price is not valid." }); upd.price = Math.round(n * 100) / 100; } }
      if (has("pay_method")) upd.pay_method = clean(body.pay_method, 30) || null;
      if (has("txn_id")) upd.txn_id = clean(body.txn_id, 60) || null;
      if (has("channel")) upd.channel = clean(body.channel, 30) || null;
      if (has("notes")) upd.notes = clean(body.notes, 200) || null;
      // Partial refund after delivery: the amount handed back to the customer (never more than they paid).
      if (has("refund_amount")) {
        const t = String(body.refund_amount).trim();
        if (!t) { upd.refund_amount = null; upd.refund_method = null; upd.refund_note = null; upd.refunded_at = null; }
        else {
          const n = Number(t.replace(/[^0-9.]/g, ""));
          if (!(n > 0 && n < 10000000)) return res.status(400).json({ error: "Refund amount is not valid." });
          let paid = upd.price;
          if (paid === undefined) { try { const cp = ((await db.rest("GET", `subscriptions?id=eq.${id}&select=price`)) || [])[0]; paid = cp ? cp.price : null; } catch (e) { paid = null; } }
          if (paid != null && n > Number(paid)) return res.status(400).json({ error: "The refund cannot be more than the amount paid (৳" + paid + ")." });
          upd.refund_amount = Math.round(n * 100) / 100;
          if (has("refund_method")) upd.refund_method = clean(body.refund_method, 30) || null;
          if (has("refund_note")) upd.refund_note = clean(body.refund_note, 200) || null;
          upd.refunded_at = new Date().toISOString();
        }
      }
      if (has("source")) { if (!["admin", "online"].includes(body.source)) return res.status(400).json({ error: "Source must be admin or online." }); upd.source = body.source; }
      if (upd.start_date && upd.end_date && upd.end_date < upd.start_date) return res.status(400).json({ error: "The expiry date is before the start date." });
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
      catch (e) {
        if (upd.refund_amount !== undefined && /refund/i.test(String(e && e.message))) return res.status(400).json({ error: "Refund columns are missing. Run the new lines at the bottom of supabase/schema.sql in Supabase (SQL Editor) once, then try again." });
        if (!stamp) throw e; out = await db.rest("PATCH", `subscriptions?id=eq.${id}`, upd, "return=representation"); } // notice columns not added yet
      await sheet.syncSub(id);
      return res.status(200).json({ row: out[0] });
    }
    if (req.method === "DELETE") {
      // Deleting a user is permanent, so the admin password is checked again on the server (not just at sign-in).
      if (!crypto.timingSafeEqual(h(req.headers["x-admin-confirm"] || ""), h(k))) return res.status(403).json({ error: "Wrong admin password. Nothing was deleted." });
      await db.rest("DELETE", `subscriptions?id=eq.${id}`); await sheet.removeSub(id); return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("admin error", e && e.message);
    return res.status(424).json({ error: "Request failed: " + String((e && e.message) || "").slice(0, 120) });
  }
};
