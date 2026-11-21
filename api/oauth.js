/* Sign in with Google / Microsoft / Apple (OpenID Connect, authorization-code flow). No extra dependencies.
   GET  /api/oauth?a=config                 -> which providers are configured, e.g. {google:true,microsoft:false,apple:false}
   GET  /api/oauth?a=start&p=<provider>     -> redirects to the provider
   GET|POST /api/oauth?a=cb&p=<provider>    -> provider returns here (Apple uses POST); we read the VERIFIED email,
                                               then send the browser to /account/#t=<short link token> (same flow as the email link).
   Env: GOOGLE_CLIENT_ID/_SECRET, MS_CLIENT_ID/_SECRET, APPLE_CLIENT_ID (Services ID), APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY. */
const crypto = require("crypto");
const { secret, sign, verify } = require("./_auth");

const env = (k) => process.env[k] || "";
const site = (req) => (env("SITE_URL") || "https://" + (req.headers["x-forwarded-host"] || req.headers.host)).replace(/\/$/, "");
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

const P = {
  google: { name: "Google", auth: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", scope: "openid email", iss: ["https://accounts.google.com", "accounts.google.com"],
    id: () => env("GOOGLE_CLIENT_ID"), sec: () => env("GOOGLE_CLIENT_SECRET") },
  // "consumers" = personal Microsoft accounts only (Outlook, Hotmail, Live), whose email is verified by Microsoft.
  microsoft: { name: "Microsoft", auth: "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize", token: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token", scope: "openid email profile", iss: ["https://login.live.com", "https://sts.windows.net/9188040d-6c67-4c5b-b112-36a304b66dad/", "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0"],
    id: () => env("MS_CLIENT_ID"), sec: () => env("MS_CLIENT_SECRET") },
  apple: { name: "Apple", auth: "https://appleid.apple.com/auth/authorize", token: "https://appleid.apple.com/auth/token", scope: "email", iss: ["https://appleid.apple.com"], post: true,
    id: () => env("APPLE_CLIENT_ID"), sec: () => appleSecret() },
};
function appleSecret() {
  const key = env("APPLE_PRIVATE_KEY").replace(/\\n/g, "\n"), now = Math.floor(Date.now() / 1000);
  if (!key || !env("APPLE_TEAM_ID") || !env("APPLE_KEY_ID") || !env("APPLE_CLIENT_ID")) return "";
  const h = b64({ alg: "ES256", kid: env("APPLE_KEY_ID") }), p = b64({ iss: env("APPLE_TEAM_ID"), iat: now, exp: now + 300, aud: "https://appleid.apple.com", sub: env("APPLE_CLIENT_ID") });
  return h + "." + p + "." + crypto.sign("sha256", Buffer.from(h + "." + p), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
}
const ready = (k) => !!(P[k].id() && P[k].sec());
const back = (res, hash) => { res.statusCode = 302; res.setHeader("Location", "/account/#" + hash); res.setHeader("Set-Cookie", "sx_oauth=; Path=/api/oauth; Max-Age=0; HttpOnly; Secure; SameSite=None"); res.end(); };
const fail = (res, msg) => back(res, "e=" + encodeURIComponent(msg));
const cookie = (req, n) => ((req.headers.cookie || "").split(/;\s*/).map((c) => c.split("=")).find((c) => c[0] === n) || [])[1] || "";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const a = String((req.query && req.query.a) || ""), k = String((req.query && req.query.p) || "");
  try {
    if (a === "config") return res.status(200).json({ google: ready("google"), microsoft: ready("microsoft"), apple: ready("apple"), enabled: !!secret() });
    if (!secret() || !P[k] || !ready(k)) return fail(res, "This sign-in option is not available yet.");
    const prov = P[k], redirect = site(req) + (k === "microsoft" ? "/auth/microsoft" : "/api/oauth?a=cb&p=" + k); // Azure rejects redirect URIs with a query string, so Microsoft uses a clean path (rewritten in vercel.json)

    if (a === "start") {
      const nonce = crypto.randomBytes(16).toString("hex");
      const state = sign({ t: "oas", p: k, n: nonce, exp: Date.now() + 10 * 60000 });
      const q = new URLSearchParams({ client_id: prov.id(), redirect_uri: redirect, response_type: "code", scope: prov.scope, state, nonce, prompt: "select_account" });
      if (prov.post) { q.set("response_mode", "form_post"); q.delete("prompt"); }
      res.statusCode = 302;
      res.setHeader("Set-Cookie", `sx_oauth=${nonce}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=None`);
      res.setHeader("Location", prov.auth + "?" + q.toString());
      return res.end();
    }

    if (a === "cb") {
      const src = req.method === "POST" ? (typeof req.body === "string" ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {}) : req.query || {};
      if (src.error) return fail(res, "Sign-in was cancelled.");
      const st = verify(src.state, "oas");
      if (!st || st.p !== k || !src.code || !cookie(req, "sx_oauth") || cookie(req, "sx_oauth") !== st.n) return fail(res, "Sign-in expired. Please try again.");
      const tr = await fetch(prov.token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code: String(src.code), redirect_uri: redirect, client_id: prov.id(), client_secret: prov.sec() }).toString() });
      const tj = await tr.json().catch(() => ({}));
      if (!tr.ok || !tj.id_token) { console.error("oauth token", k, tr.status, JSON.stringify(tj).slice(0, 160)); return fail(res, "Sign-in failed. Please try again."); }
      // The id_token came straight from the provider over TLS in exchange for our code + secret, so its claims are trusted; still check audience, issuer, expiry and nonce.
      const c = JSON.parse(Buffer.from(tj.id_token.split(".")[1], "base64url").toString());
      const aud = [].concat(c.aud);
      if (!aud.includes(prov.id()) || !prov.iss.includes(c.iss) || c.exp * 1000 < Date.now() || c.nonce !== st.n) return fail(res, "Sign-in could not be verified.");
      const email = String(c.email || "").trim().toLowerCase();
      const verified = c.email_verified === true || c.email_verified === "true" || k === "microsoft";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !verified) return fail(res, "Your " + prov.name + " account has no verified email.");
      const pic = typeof c.picture === "string" && /^https:\/\//.test(c.picture) ? c.picture.slice(0, 300) : "";
      return back(res, "t=" + sign({ t: "link", e: email, n: String(c.name || "").slice(0, 80), pic, pv: k, exp: Date.now() + 2 * 60000 }));
    }
    return res.status(404).json({ error: "Not found" });
  } catch (e) {
    console.error("oauth error", a, k, e && e.message);
    return fail(res, "Something went wrong. Please try again.");
  }
};
