/* Sends hand-added purchases (admin panel) to the "Manual sales" tab of the Google Sheet.
   Needs env SHEETS_WEBHOOK_URL (the Apps Script web app URL) and SHEETS_WEBHOOK_SECRET. Without them it quietly does nothing.
   Only plain purchase details are sent: never login details, passwords, PINs or gift card codes. */
const db = require("./_db");

const FIELDS = ["id", "created_at", "name", "email", "phone", "service", "plan", "months", "start_date", "end_date", "price", "pay_method", "txn_id", "channel", "notes"];
const slim = (r) => { const o = {}; FIELDS.forEach((k) => { o[k] = r[k] == null ? "" : r[k]; }); return o; };
const enabled = () => !!process.env.SHEETS_WEBHOOK_URL;

async function post(payload) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return false;
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ secret: process.env.SHEETS_WEBHOOK_SECRET || "" }, payload)), redirect: "follow", signal: ctl.signal });
    return r.ok;
  } catch (e) { console.error("sheet sync failed", e && e.message); return false; }
  finally { clearTimeout(t); }
}

/* Re-reads the saved row (so price and payment details are included) and sends it. Online orders are skipped: they already reach the sheet as orders. */
async function syncSub(id) {
  if (!enabled() || !(id > 0)) return false;
  try {
    const r = ((await db.rest("GET", `subscriptions?id=eq.${id}&select=*`)) || [])[0];
    if (!r || r.source !== "admin") return false;
    return await post({ event: "upsert", rows: [slim(r)] });
  } catch (e) { console.error("sheet sync skipped", e && e.message); return false; }
}
const removeSub = (id) => (enabled() && id > 0 ? post({ event: "delete", ids: [id] }) : Promise.resolve(false));

/* Sends every hand-added purchase (used by the "Send all to Google Sheet" button). */
async function syncAll() {
  if (!enabled()) return { ok: false, count: 0 };
  const rows = (await db.rest("GET", "subscriptions?source=eq.admin&select=*&order=created_at.asc&limit=2000")) || [];
  let ok = true;
  for (let i = 0; i < rows.length; i += 100) ok = (await post({ event: "upsert", rows: rows.slice(i, i + 100).map(slim) })) && ok;
  return { ok, count: rows.length };
}
module.exports = { enabled, syncSub, removeSub, syncAll };
