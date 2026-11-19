/* Minimal Supabase (PostgREST) client over fetch. Uses the SERVICE key, so it only runs on the server. */
const enabled = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

async function rest(method, pathAndQuery, body, prefer) {
  if (!enabled()) throw new Error("Database is not configured.");
  const key = process.env.SUPABASE_SERVICE_KEY;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + pathAndQuery, {
      method,
      headers: Object.assign({ apikey: key, "Content-Type": "application/json" }, /^eyJ/.test(key) ? { Authorization: "Bearer " + key } : {}, prefer ? { Prefer: prefer } : {}), // new sb_secret_ keys go in apikey only; legacy JWT keys also go in Authorization
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
    const text = await r.text();
    if (!r.ok) throw new Error("DB " + r.status + ": " + text.slice(0, 200));
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(t);
  }
}
const q = (v) => encodeURIComponent(v);
module.exports = { enabled, rest, q };
