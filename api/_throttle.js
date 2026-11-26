/* Failed-login limiter for the admin API: 8 wrong keys from one address in 15 minutes locks that address out for the rest of the window.
   Uses the admin_attempts table when it exists (shared by every server instance); falls back to memory per instance if the SQL has not been run yet. */
const db = require("./_db");
const MAX = 8, WINDOW = 15 * 60 * 1000;
const mem = new Map();
let tableOk = true;

const ipOf = (req) => String((req.headers["cf-connecting-ip"] || req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0] || "unknown")).trim().slice(0, 64) || "unknown";

async function load(ip) {
  if (tableOk) {
    try { const r = await db.rest("GET", `admin_attempts?ip=eq.${db.q(ip)}&select=n,first_at`); return r && r[0] ? { n: r[0].n, t: Date.parse(r[0].first_at) } : null; }
    catch (e) { if (/admin_attempts|42P01|PGRST205/.test(String(e && e.message))) tableOk = false; }
  }
  return mem.get(ip) || null;
}
/* Returns seconds left if this address is locked out, otherwise 0. */
async function locked(ip) {
  const r = await load(ip);
  if (!r || Date.now() - r.t >= WINDOW || r.n < MAX) return 0;
  return Math.ceil((r.t + WINDOW - Date.now()) / 1000);
}
async function fail(ip) {
  const r = await load(ip), fresh = !r || Date.now() - r.t >= WINDOW, n = fresh ? 1 : r.n + 1, t = fresh ? Date.now() : r.t;
  if (tableOk) {
    try { await db.rest("POST", "admin_attempts?on_conflict=ip", [{ ip, n, first_at: new Date(t).toISOString() }], "resolution=merge-duplicates,return=minimal"); return; }
    catch (e) { if (/admin_attempts|42P01|PGRST205/.test(String(e && e.message))) tableOk = false; }
  }
  mem.set(ip, { n, t });
}
async function clear(ip) {
  mem.delete(ip);
  if (tableOk) { try { await db.rest("DELETE", `admin_attempts?ip=eq.${db.q(ip)}`); } catch (e) { /* optional */ } }
}
module.exports = { ipOf, locked, fail, clear };
