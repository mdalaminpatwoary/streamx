/* Sends every subscription (hand-added and paid online) to the Google Sheet: the "Active Users" tab, the Customers tab and, for hand-added ones, the "Manual sales" tab.
   Needs env SHEETS_WEBHOOK_URL (the Apps Script web app URL) and SHEETS_WEBHOOK_SECRET. Without them it quietly does nothing.
   A second, optional sheet ("Track Accounts", Netflix tab) gets the Netflix rows with the account email and profile name, so each Netflix account shows its 10 profile slots.
   It needs TRACK_SHEET_WEBHOOK_URL and TRACK_SHEET_WEBHOOK_SECRET. Deleting a user in the admin panel clears that slot there and keeps the account email. Passwords, PINs and codes are never sent.
   Only plain purchase details are sent: never login details, passwords, PINs or gift card codes. */
const db = require("./_db");

const FIELDS = ["id", "created_at", "name", "email", "phone", "service", "plan", "months", "start_date", "end_date", "price", "pay_method", "txn_id", "channel", "notes", "source", "order_ref", "manual_id"];
/* A value that starts with = + - or @ would be read by Google Sheets as a formula (for example +44 phone numbers), so it is stored as plain text. */
const safe = (v) => (typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v);
/* One phone format in the sheet: +<country code><number>, so the same number is never listed twice in different spellings (01…, 880…, +880 1…). */
const intl = (v) => {
  const s = String(v == null ? "" : v).trim();
  if (!s) return "";
  const d = s.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(d)) return d;
  const n = d.replace(/\+/g, "");
  if (/^00\d{8,15}$/.test(n)) return "+" + n.slice(2);
  if (/^0\d{10}$/.test(n)) return "+88" + n;
  if (/^880\d{10}$/.test(n)) return "+" + n;
  return s;
};
const slim = (r) => { const o = {}; FIELDS.forEach((k) => { o[k] = r[k] == null ? "" : safe(k === "phone" ? intl(r[k]) : r[k]); }); return o; };
const enabled = () => !!process.env.SHEETS_WEBHOOK_URL;
const trackOn = () => !!process.env.TRACK_SHEET_WEBHOOK_URL;

/* Netflix profile slots in the Track Accounts sheet: each account has 1 Signature, 3 Private and 6 Shared profiles.
   Entertainment Combo packs 1, 2 and 4 use a Shared, Private and Signature Netflix profile. Other plans (for example Single Slot) are not tracked there. */
const COMBO_TYPE = { 1: "Shared", 2: "Private", 4: "Signature" };
function trackRow(r) {
  const svc = String(r.service || "").trim().toLowerCase(), plan = String(r.plan || "").trim().toLowerCase();
  let type = "", label = "";
  if (svc === "netflix") {
    if (/signature/.test(plan)) { type = "Signature"; label = "Netflix Signature"; }
    else if (/private/.test(plan)) { type = "Private"; label = "Netflix Private"; }
    else if (/share/.test(plan)) { type = "Shared"; label = "Netflix Shared"; }
  } else if (svc === "entertainment combo" && !/prime/.test(plan)) {
    const m = /pack\s*(\d)/.exec(plan);
    if (m && COMBO_TYPE[m[1]]) { type = COMBO_TYPE[m[1]]; label = "Entertainment Combo " + m[1]; }
  }
  if (!type) return null;
  const v = (k) => (r[k] == null ? "" : safe(r[k]));
  return { id: r.id, type, plan: label, name: v("name"), phone: safe(intl(r.phone)), email: v("email"), acct_email: v("acct_email"), acct_profile: v("acct_profile"), start_date: v("start_date"), end_date: v("end_date"), channel: v("channel") };
}

/* Returns "" when the sheet accepted the data, otherwise a short reason. */
async function post(payload, track) {
  const url = track ? process.env.TRACK_SHEET_WEBHOOK_URL : process.env.SHEETS_WEBHOOK_URL;
  const secret = (track ? process.env.TRACK_SHEET_WEBHOOK_SECRET : process.env.SHEETS_WEBHOOK_SECRET) || "";
  if (!url) return "not set up";
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ secret }, payload)), redirect: "follow", signal: ctl.signal });
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
  if ((!enabled() && !trackOn()) || !(id > 0)) return false;
  try {
    const r = ((await db.rest("GET", `subscriptions?id=eq.${id}&select=*`)) || [])[0];
    if (!r) return false;
    const jobs = [];
    if (enabled()) jobs.push(post({ event: "upsert", rows: [slim(r)] }));
    if (trackOn()) { const t = trackRow(r); jobs.push(post(t ? { event: "upsert", rows: [t] } : { event: "delete", ids: [id] }, true)); }
    return (await Promise.all(jobs)).every((x) => x === "");
  } catch (e) { console.error("sheet sync skipped", e && e.message); return false; }
}
async function removeSub(id) {
  if (!(id > 0)) return false;
  const jobs = [];
  if (enabled()) jobs.push(post({ event: "delete", ids: [id] }));
  if (trackOn()) jobs.push(post({ event: "delete", ids: [id] }, true));
  return jobs.length ? (await Promise.all(jobs)).every((x) => x === "") : false;
}

/* Sends every subscription (used by the "Send all to Google Sheet" button). */
/* Sends one page of subscriptions to the sheet(s) and says where the next page starts (null when finished).
   The admin button repeats the call, so no single request can run past the time limit however many purchases there are. */
async function syncAll(offset, size) {
  if (!enabled() && !trackOn()) return { ok: false, count: 0, next: null, error: "The Google Sheet link is not set up yet." };
  const off = Math.max(0, parseInt(offset, 10) || 0), n = Math.min(50, Math.max(5, parseInt(size, 10) || 15));
  const rows = (await db.rest("GET", `subscriptions?select=*&order=id.asc&offset=${off}&limit=${n}`)) || [];
  if (!rows.length) return { ok: true, count: 0, next: null };
  const t = rows.map(trackRow).filter(Boolean);
  const [e1, e2] = await Promise.all([
    enabled() ? post({ event: "upsert", rows: rows.map(slim) }) : "",
    trackOn() && t.length ? post({ event: "upsert", rows: t }, true).then((e) => (e ? "Track Accounts sheet: " + e : "")) : "",
  ]);
  const err = e1 ? "Active Users sheet: " + e1 : e2;
  return err ? { ok: false, count: rows.length, next: null, error: "Could not update the sheet: " + err } : { ok: true, count: rows.length, next: rows.length === n ? off + n : null };
}
module.exports = { enabled, trackOn, syncSub, removeSub, syncAll };
