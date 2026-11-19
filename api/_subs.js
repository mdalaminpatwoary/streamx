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
    const cur = await rest("GET", `subscriptions?email=eq.${q(email)}&service=eq.${q(s.service)}&select=end_date&order=end_date.desc&limit=1`);
    if (cur && cur[0] && cur[0].end_date > start) start = cur[0].end_date;
  }
  const row = {
    email, name: s.name || null, phone: s.phone || null, service: s.service, plan: s.plan, months: s.months,
    start_date: start, end_date: addMonths(start, s.months), source: s.source || "admin", order_ref: s.order_ref || null, line_idx: s.line_idx == null ? null : s.line_idx, notes: s.notes || null,
  };
  const out = await rest("POST", "subscriptions" + (row.order_ref ? "?on_conflict=order_ref,line_idx" : ""), [row], row.order_ref ? "return=representation,resolution=ignore-duplicates" : "return=representation");
  return (out && out[0]) || null;
}

/* Called when EPS confirms a payment: turns the saved order into subscription records (safe to call many times). */
async function activateOrder(mtid) {
  const o = await rest("GET", `orders?mtid=eq.${q(mtid)}&select=*`);
  if (!o || !o[0]) return 0;
  const ord = o[0];
  let n = 0;
  const lines = Array.isArray(ord.lines) ? ord.lines : [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l || !(l.months >= 1)) continue; // gift cards and the like are not subscriptions
    for (let k = 0; k < (l.q || 1); k++) {
      await addSub({ email: ord.email, name: ord.name, phone: ord.phone, service: l.name, plan: l.plan, months: l.months, source: "online", order_ref: mtid, line_idx: i * 20 + k });
      n++;
    }
  }
  return n;
}
module.exports = { dhakaToday, addMonths, validDate, normEmail, addSub, activateOrder };
