/* How a customer signs in to the service they bought, plus VPN and gift-card details.
   Shared by the admin API (write) and the account API (read). Secrets (password, PIN, redeem code) are encrypted at rest. */
const cred = require("./_cred");

const MODES = ["none", "email_pass", "email_otp", "phone_pass", "phone_otp", "number", "own"];
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);

/* Column groups, newest first. Older databases may lack the newer ones, so readers fall back one group at a time. */
const BASE = "id,service,plan,months,start_date,end_date,name,phone";
const TIERS = [
  ",acct_email,acct_pass,acct_otp,acct_profile,acct_pin,acct_mode,acct_phone,acct_family,vpn_required,vpn_country,gift_code,gift_region,gift_amount",
  ",acct_email,acct_pass,acct_otp,acct_profile,acct_pin",
  ",acct_email,acct_pass,acct_otp",
  "",
];

/* Rows saved before modes existed still show sensibly. */
function modeOf(r) {
  if (r.acct_mode && MODES.includes(r.acct_mode)) return r.acct_mode;
  if (r.acct_otp) return "email_otp";
  if (r.acct_pass) return "email_pass";
  if (r.acct_email) return "own";
  return "none";
}

/* Database row -> what the owner and the customer see (secrets decrypted). */
function fromRow(r) {
  const mode = modeOf(r);
  return {
    mode,
    email: r.acct_email || "", phone: r.acct_phone || "", password: cred.dec(r.acct_pass), otp: mode === "email_otp" || mode === "phone_otp",
    profile: r.acct_profile || "", pin: cred.dec(r.acct_pin), family: r.acct_family || "",
    vpn: { required: !!r.vpn_required, country: r.vpn_country || "" },
    gift: { code: cred.dec(r.gift_code), region: r.gift_region || "", amount: r.gift_amount || "" },
  };
}

/* Request body -> columns to save. Only fields that were sent are touched. */
function toRow(b) {
  const o = {}, has = (k) => b[k] !== undefined;
  if (has("acct_mode")) { const m = clean(b.acct_mode, 20); if (!MODES.includes(m)) throw new Error("Unknown login type."); o.acct_mode = m; o.acct_otp = m === "email_otp" || m === "phone_otp"; }
  if (has("acct_email")) o.acct_email = clean(b.acct_email, 120);
  if (has("acct_phone")) o.acct_phone = clean(b.acct_phone, 24).replace(/[^\d+\s-]/g, "");
  if (has("acct_family")) o.acct_family = clean(b.acct_family, 120);
  if (has("acct_profile")) o.acct_profile = clean(b.acct_profile, 60);
  if (has("vpn_required")) o.vpn_required = !!b.vpn_required;
  if (has("vpn_country")) o.vpn_country = /^[A-Za-z]{2}$/.test(String(b.vpn_country || "")) ? String(b.vpn_country).toUpperCase() : "";
  if (has("gift_region")) o.gift_region = clean(b.gift_region, 40);
  if (has("gift_amount")) o.gift_amount = clean(b.gift_amount, 20);
  for (const [k, n] of [["acct_pass", 120], ["acct_pin", 20], ["gift_code", 120]]) {
    if (!has(k)) continue;
    const v = clean(k === "acct_pass" ? String(b[k] == null ? "" : b[k]).replace(/[\u0000-\u001f]/g, "") : b[k], n);
    if (v && !cred.ready()) throw new Error("AUTH_SECRET is not set, so secrets cannot be stored safely.");
    o[k] = cred.enc(v);
  }
  return Object.keys(o).length ? o : null;
}

module.exports = { MODES, BASE, TIERS, modeOf, fromRow, toRow };
