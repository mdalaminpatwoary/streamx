/* EPS payment gateway helpers (server side only).
   Secrets come from environment variables. They are NEVER sent to the browser. */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASES = {
  live: "https://pgapi.eps.com.bd/v1",
  sandbox: "https://sandboxpgapi.eps.com.bd/v1",
};

function config() {
  const env = (process.env.EPS_ENV || "sandbox").toLowerCase() === "live" ? "live" : "sandbox";
  const t = (v) => (v == null ? v : String(v).trim());
  const c = {
    env,
    base: BASES[env],
    merchantId: t(process.env.EPS_MERCHANT_ID),
    storeId: t(process.env.EPS_STORE_ID),
    userName: t(process.env.EPS_USERNAME),
    password: t(process.env.EPS_PASSWORD),
    hashKey: t(process.env.EPS_HASH_KEY),
    txnType: Number(process.env.EPS_TXN_TYPE || 1),
  };
  const missing = ["merchantId", "storeId", "userName", "password", "hashKey"].filter((k) => !c[k]);
  if (missing.length) throw new Error("Payment is not configured on the server (" + missing.join(", ") + ")");
  return c;
}

// Mechanism from the EPS guide: HMAC-SHA512 (key = UTF-8 hash key), Base64 result.
const xhash = (hashKey, data) =>
  crypto.createHmac("sha512", Buffer.from(hashKey, "utf8")).update(data, "utf8").digest("base64");

async function epsFetch(url, opts) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { ...opts, signal: ctl.signal });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) {}
    return { ok: r.ok, status: r.status, json, text };
  } finally {
    clearTimeout(t);
  }
}

const stage = (code, msg) => Object.assign(new Error(msg), { stage: code });

async function getToken(c) {
  const r = await epsFetch(c.base + "/Auth/GetToken", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hash": xhash(c.hashKey, c.userName) },
    body: JSON.stringify({ userName: c.userName, password: c.password }),
  });
  if (!r.json || !r.json.token) {
    // Safe diagnostics (lengths only, never the values) so a bad copy/paste of a credential can be spotted.
    const diag = ` | env=${c.env} user.len=${c.userName.length} pass.len=${c.password.length} key.len=${c.hashKey.length} key.shape=${c.hashKey.replace(/[A-Za-z]/g,"a").replace(/[0-9]/g,"9").slice(0,12)} key.chars=${c.hashKey.slice(9,13)} user.head=${c.userName.slice(0,3)} trimmed=${c.userName === c.userName.trim() && c.hashKey === c.hashKey.trim()}`;
    throw stage("LOGIN", "EPS login failed (HTTP " + r.status + ")" + (r.json && r.json.errorMessage ? ": " + r.json.errorMessage : r.text ? ": " + r.text.slice(0, 120) : "") + diag);
  }
  return r.json.token;
}

// Load the SAME catalog the website uses, so prices are always taken from the server, never from the browser.
let _products, _gift;
function products() {
  if (_products) return _products;
  const rel = path.join("assets", "js", "data", "catalog.js");
  const file = [path.join(process.cwd(), rel), path.join(__dirname, "..", rel), path.join("/var/task", rel)].find((f) => fs.existsSync(f));
  if (!file) throw stage("CATALOG", "catalog.js was not found on the server (is vercel.json uploaded?)");
  const code = fs.readFileSync(file, "utf8");
  const out = vm.runInNewContext(code + "\n;[PRODUCTS, GIFT];", {}, { timeout: 2000 });
  _products = out[0];
  _gift = out[1];
  return _products;
}

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);

// Turn the cart sent by the browser into trusted lines (name, plan, price from the catalog).
function priceCart(items) {
  if (!Array.isArray(items) || !items.length || items.length > 30) throw new Error("Your cart is empty.");
  const P = products();
  return items.map((it) => {
    const p = P.find((x) => x.name === it.name);
    const vr = p && (it.vr ? p.variants.find((v) => v.n === it.vr) : p.variants[0]);
    let pl = vr && vr.plans.find((x) => x.v === it.v);
    if (!pl && vr && p.gift && _gift) {
      // Apple Gift Card: $5 to $500 in steps of $5, at 130 BDT per $1. Price is computed here, never taken from the browser.
      const m = /^\$(\d{1,3})$/.exec(String(it.v || "")), a = m ? Number(m[1]) : 0;
      if (a && _gift.ok(a)) pl = { v: "$" + a, p: a * _gift.rate(a) };
    }
    const q = Math.floor(Number(it.q));
    if (!pl || !(q >= 1 && q <= 20)) throw new Error("An item in your cart is no longer available. Please re-add it.");
    return { name: p.name, plan: (p.variants.length > 1 ? vr.n + " · " : "") + pl.v, price: pl.p, q };
  });
}

module.exports = { config, xhash, epsFetch, getToken, priceCart, clean, stage };
