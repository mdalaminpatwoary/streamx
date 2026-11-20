/* How a customer signs in to the service they bought, plus VPN, devices and gift-card details.
   Shared by the admin API (write) and the account API (read). Secrets (password, PIN, redeem code) are encrypted at rest. */
const cred = require("./_cred");

/* email_pass, email_otp, phone_otp, own (customer's own mail or number) are offered today.
   phone_pass, number and none are old values that are still shown correctly. */
const MODES = ["none", "email_pass", "email_otp", "phone_pass", "phone_otp", "number", "own"];
const MODE_LABEL = { email_pass: "Email + password", email_otp: "Email + OTP", phone_otp: "Number + OTP", own: "Customer mail/number", phone_pass: "Number + password", number: "Number only", none: "Not set" };
const PLATFORMS = ["web", "ios", "android", "tablet", "tv"];
const PLATFORM_LABEL = { web: "Web", ios: "iOS", android: "Android", tablet: "Tablet", tv: "TV" };
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);

/* Column groups, newest first. Older databases may lack the newer ones, so readers fall back one group at a time. */
const BASE = "id,service,plan,months,start_date,end_date,name,phone,order_ref";
const T3 = ",acct_email,acct_pass,acct_otp,acct_profile,acct_pin,acct_mode,acct_phone,acct_family,vpn_required,vpn_country,gift_code,gift_region,gift_amount";
const TIERS = [T3 + ",acct_devices,acct_changed_at,acct_change,acct_seen_at", T3, ",acct_email,acct_pass,acct_otp,acct_profile,acct_pin", ",acct_email,acct_pass,acct_otp", ""];

function modeOf(r) {
  if (r.acct_mode && MODES.includes(r.acct_mode)) return r.acct_mode;
  if (r.acct_otp) return "email_otp";
  if (r.acct_pass) return "email_pass";
  if (r.acct_email) return "own";
  return "none";
}

function devicesOf(d) {
  if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = null; } }
  d = d && typeof d === "object" ? d : {};
  const lim = parseInt(d.limit, 10);
  let items = Array.isArray(d.items) ? d.items : null;
  if (!items) { // older format: separate platform and name lists
    const pl = Array.isArray(d.platforms) ? d.platforms : [], nm = Array.isArray(d.names) ? d.names : [];
    items = Array.from({ length: Math.max(pl.length, nm.length) }, (_, i) => ({ type: pl[i], name: nm[i] }));
  }
  return {
    items: items.map((x) => ({ type: PLATFORMS.includes(x && x.type) ? x.type : "web", name: clean(x && x.name, 30) })).filter((x, i) => x.name || (items[i] && PLATFORMS.includes(items[i].type))).slice(0, 3),
    limit: lim >= 1 && lim <= 20 ? lim : null,
  };
}

/* Database row -> what the owner and the customer see (secrets decrypted). */
function fromRow(r) {
  const mode = modeOf(r), seen = r.acct_seen_at ? Date.parse(r.acct_seen_at) : 0, ch = r.acct_changed_at ? Date.parse(r.acct_changed_at) : 0;
  return {
    mode,
    email: r.acct_email || "", phone: r.acct_phone || "", password: cred.dec(r.acct_pass), otp: mode === "email_otp" || mode === "phone_otp",
    profile: r.acct_profile || "", pin: cred.dec(r.acct_pin), family: r.acct_family || "",
    vpn: { required: !!r.vpn_required, country: r.vpn_country || "" },
    gift: { code: cred.dec(r.gift_code), region: r.gift_region || "", amount: r.gift_amount || "" },
    devices: devicesOf(r.acct_devices),
    notice: ch && ch > seen ? { at: r.acct_changed_at, lines: String(r.acct_change || "").split("\n").filter(Boolean) } : null,
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
  if (has("vpn_country")) o.vpn_country = ["IN", "US"].includes(String(b.vpn_country || "").toUpperCase()) ? String(b.vpn_country).toUpperCase() : "";
  if (has("gift_region")) o.gift_region = clean(b.gift_region, 40);
  if (has("gift_amount")) o.gift_amount = clean(b.gift_amount, 20);
  if (has("acct_devices")) { const d = devicesOf(b.acct_devices); o.acct_devices = d.items.length || d.limit ? d : null; }
  for (const [k, n] of [["acct_pass", 120], ["acct_pin", 20], ["gift_code", 120]]) {
    if (!has(k)) continue;
    const v = clean(b[k], n);
    if (v && !cred.ready()) throw new Error("AUTH_SECRET is not set, so secrets cannot be stored safely.");
    o[k] = cred.enc(v);
  }
  return Object.keys(o).length ? o : null;
}

/* Plain-language lines describing what the owner just changed (never contains secrets). Empty when nothing changed. */
function describeChange(row, b) {
  const old = fromRow(row), L = [], has = (k) => b[k] !== undefined, s = (k, n) => clean(b[k], n || 200);
  const cn = (c) => (c === "IN" ? "India" : c === "US" ? "United States" : c);
  const hadAny = old.mode !== "none" || old.email || old.phone || old.password || old.pin || old.profile || old.family || old.gift.code || old.vpn.required || old.devices.items.length || old.devices.limit;
  if (has("acct_mode") && s("acct_mode") !== old.mode && s("acct_mode") !== "none") L.push("Login type: " + MODE_LABEL[s("acct_mode")]);
  if (has("acct_email") && s("acct_email") && s("acct_email") !== old.email) L.push(old.email ? "Account email was changed" : "Account email was added");
  if (has("acct_phone") && s("acct_phone") && s("acct_phone") !== old.phone) L.push(old.phone ? "Account number was changed" : "Account number was added");
  if (has("acct_pass") && String(b.acct_pass || "").trim() && String(b.acct_pass).trim() !== old.password) L.push(old.password ? "Password was updated" : "Password was added");
  if (has("acct_pin") && s("acct_pin") && s("acct_pin") !== old.pin) L.push(old.pin ? "Profile PIN was updated" : "Profile PIN was added");
  if (has("acct_profile") && s("acct_profile") && s("acct_profile") !== old.profile) L.push("Profile name: " + s("acct_profile"));
  if (has("acct_family") && s("acct_family") && s("acct_family") !== old.family) L.push(old.family ? "Family mail was changed" : "Family mail was added");
  if (has("vpn_required") || has("vpn_country")) {
    const req = has("vpn_required") ? !!b.vpn_required : old.vpn.required, c = has("vpn_country") ? String(b.vpn_country || "").toUpperCase() : old.vpn.country;
    if (req !== old.vpn.required || (req && c !== old.vpn.country)) L.push(req ? "VPN is required" + (c ? ": connect to " + cn(c) : "") : "VPN is no longer required");
  }
  if (has("gift_code") && s("gift_code") && s("gift_code") !== old.gift.code) L.push(old.gift.code ? "Redeem code was updated" : "Redeem code is now available");
  if (has("acct_devices")) {
    const d = devicesOf(b.acct_devices);
    if (JSON.stringify(d) !== JSON.stringify(old.devices)) {
      if (d.limit !== old.devices.limit && d.limit) L.push("Device limit: " + d.limit);
      if (JSON.stringify(d.items) !== JSON.stringify(old.devices.items)) L.push("Signed-in devices were updated");
    }
  }
  if (L.length && !hadAny && !L.some((x) => /^Redeem/.test(x))) L.unshift("Your login details are now available");
  return L;
}

module.exports = { MODES, MODE_LABEL, PLATFORMS, BASE, TIERS, modeOf, fromRow, toRow, describeChange, devicesOf };
