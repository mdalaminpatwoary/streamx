/* Shared subscription logic: dates in Dhaka time, renewals stack after the current expiry. */
const { rest, q } = require("./_db");

const dhakaToday = () => new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);

function addMonths(iso, m) {
  const [y, mo, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1 + m, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, last));
  return t.toISOString().slice(0, 10);
}
const validDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T00:00:00Z"));
const normEmail = (e) => String(e || "").trim().toLowerCase();

/* If the customer already has this service running, the new period starts when it ends (a renewal never loses days). */
async function addSub(s) {
  const email = normEmail(s.email);
  let start = s.start && validDate(s.start) ? s.start : null;
  if (!start) {
    start = dhakaToday();
    const cur = s.nostack ? null : await rest("GET", `subscriptions?email=eq.${q(email)}&service=eq.${q(s.service)}&select=end_date&order=end_date.desc&limit=1`);
    if (cur && cur[0] && cur[0].end_date > start) start = cur[0].end_date;
  }
  const row = {
    email, name: s.name || null, phone: s.phone || null, service: s.service, plan: s.plan, months: s.months,
    start_date: start, end_date: addMonths(start, s.months), source: s.source || "admin", order_ref: s.order_ref || null, line_idx: s.line_idx == null ? null : s.line_idx, notes: s.notes || null,
  };
  const url = "subscriptions" + (row.order_ref ? "?on_conflict=order_ref,line_idx" : ""), pref = row.order_ref ? "return=representation,resolution=ignore-duplicates" : "return=representation";
  // Hand-added purchases get a Manual ID: 1, 2, 3, ... (needs the manual_id column; without it the purchase is still saved, just without the ID)
  let mid = null;
  if (s.manual_id) mid = String(s.manual_id);   // the 2nd+ row of one pack/order shares the first row's ID
  else if (row.source === "admin") {
    try { const last = await rest("GET", "subscriptions?manual_id=not.is.null&select=manual_id&order=id.desc&limit=1"); const n = last && last[0] ? parseInt(String(last[0].manual_id).replace(/\D/g, ""), 10) || 0 : 0; mid = String(n + 1); } catch (e) { mid = null; }
  }
  let out;
  if (mid) { try { out = await rest("POST", url, [Object.assign({}, row, { manual_id: mid })], pref); } catch (e) { console.error("manual id not saved", e && e.message); out = null; } }
  if (!out) out = await rest("POST", url, [row], pref);
  return (out && out[0]) || null;
}

/* Called when EPS confirms a payment: turns the saved order into subscription records (safe to call many times). */
async function activateOrder(mtid) {
  const o = await rest("GET", `orders?mtid=eq.${q(mtid)}&select=*`);
  if (!o || !o[0]) return 0;
  const ord = o[0];
  if (!ord.paid) { try { await rest("PATCH", `orders?mtid=eq.${q(mtid)}`, { paid: true, paid_at: new Date().toISOString() }); } catch (e) { console.error("mark paid failed", e && e.message); } }
  let n = 0;
  const lines = Array.isArray(ord.lines) ? ord.lines : [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    const gift = /gift card$/i.test(String(l.name || ""));
    if (!gift && !(l.months >= 1)) continue;
    for (let k = 0; k < (l.q || 1); k++) {
      // A gift card is valid for 6 months from purchase and never stacks on an earlier one.
      const combo = l.name === "Entertainment Combo";   // two accounts (Netflix + Prime Video): one row each, same dates
      const row = await addSub({ email: ord.email, name: ord.name, phone: ord.phone, service: l.name, plan: combo ? l.plan + " · Netflix" : l.plan, months: gift ? 6 : l.months, nostack: gift, source: "online", order_ref: mtid, line_idx: i * 20 + k });
      if (combo && row) { try { const r2 = await addSub({ email: ord.email, name: ord.name, phone: ord.phone, service: l.name, plan: l.plan + " · Prime Video", months: l.months, nostack: true, start: row.start_date, source: "online", order_ref: mtid, line_idx: 1000 + i * 20 + k }); if (r2 && r2.id) { try { await require("./_sheet").syncSub(r2.id); } catch (e) { /* optional */ } } } catch (e) { console.error("combo second row not saved", e && e.message); } }
      if (gift && row && row.id) {
        const m = /\$\s?(\d+)/.exec(String(l.plan || ""));
        try { await rest("PATCH", `subscriptions?id=eq.${row.id}`, { gift_region: "US", gift_amount: m ? "$" + m[1] : null }); } catch (e) { console.error("gift details not saved", e && e.message); }
      }
      if (row && row.id) { try { await require("./_sheet").syncSub(row.id); } catch (e) { /* the sheet is optional */ } }
      n++;
    }
  }
  return n;
}
module.exports = { dhakaToday, addMonths, validDate, normEmail, addSub, activateOrder };
