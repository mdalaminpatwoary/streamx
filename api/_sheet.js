/* Sends every subscription (hand-added and paid online) to the Google Sheet: the "Subscriptions" tab, the Customers tab and, for hand-added ones, the "Manual sales" tab.
   Needs env SHEETS_WEBHOOK_URL (the Apps Script web app URL) and SHEETS_WEBHOOK_SECRET. Without them it quietly does nothing.
   Only plain purchase details are sent: never login details, passwords, PINs or gift card codes. */
const db = require("./_db");

const FIELDS = ["id", "created_at", "name", "email", "phone", "service", "plan", "months", "start_date", "end_date", "price", "pay_method", "txn_id", "channel", "notes", "source", "order_ref"];
/* A value that starts with = + - or @ would be read by Google Sheets as a formula (for example +44 phone numbers), so it is stored as plain text. */
const safe = (v) => (typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v);
const slim = (r) => { const o = {}; FIELDS.forEach((k) => { o[k] = r[k] == null ? "" : safe(r[k]); }); return o; };
const enabled = () => !!process.env.SHEETS_WEBHOOK_URL;

/* Returns "" when the sheet accepted the data, otherwise a short reason. */
async function post(payload) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return "not set up";
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ secret: process.env.SHEETS_WEBHOOK_SECRET || "" }, payload)), redirect: "follow", signal: ctl.signal });
    const txt = await r.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) { /* not JSON */ }
    if (r.ok && j && j.ok) return "";
    const why = j && j.error ? "the script said: " + j.error : "HTTP " + r.status + (/<title>([^<]{1,60})/i.exec(txt) ? " (" + /<title>([^<]{1,60})/i.exec(txt)[1] + ")" : "");
    console.error("sheet sync failed", why);
    return why;
  } catch (e) { const why = String(e && e.message || "unknown error").slice(0, 80); console.error("sheet sync failed", why); return why; }
  finally { clearTimeout(t); }
}

/* Re-reads the saved row (so price and payment details are included) and sends it. */
async function syncSub(id) {
  if (!enabled() || !(id > 0)) return false;
  try {
    const r = ((await db.rest("GET", `subscriptions?id=eq.${id}&select=*`)) || [])[0];
    if (!r) return false;
    return (await post({ event: "upsert", rows: [slim(r)] })) === "";
  } catch (e) { console.error("sheet sync skipped", e && e.message); return false; }
}
const removeSub = async (id) => (enabled() && id > 0 ? (await post({ event: "delete", ids: [id] })) === "" : false);

/* Sends every subscription (used by the "Send all to Google Sheet" button). */
async function syncAll() {
  if (!enabled()) return { ok: false, count: 0, error: "The Google Sheet link is not set up yet." };
  const rows = (await db.rest("GET", "subscriptions?select=*&order=created_at.asc&limit=2000")) || [];
  let err = "";
  for (let i = 0; i < rows.length && !err; i += 100) err = await post({ event: "upsert", rows: rows.slice(i, i + 100).map(slim) });
  return err ? { ok: false, count: rows.length, error: "Could not reach the sheet: " + err } : { ok: true, count: rows.length };
}
module.exports = { enabled, syncSub, removeSub, syncAll };
