/* Coupon codes. The discount is always worked out here on the server from the priced cart; the browser only sends the code.
   Table: public.coupons (see supabase/schema.sql). A coupon counts as used once an order that carries it is paid. */
const db = require("./_db");
const norm = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
class CouponError extends Error {}
const bad = (m) => new CouponError(m);

// lines = priced cart lines [{name, price, q}]. Returns {code, discount, label} or throws CouponError with a customer-friendly message.
async function apply(code, lines, email) {
  code = norm(code);
  if (!code) throw bad("Enter a coupon code.");
  if (!db.enabled()) throw bad("Coupons are unavailable right now.");
  let row;
  try { row = ((await db.rest("GET", `coupons?code=eq.${db.q(code)}&select=*`)) || [])[0]; }
  catch (e) { throw bad("Coupons are unavailable right now."); }
  if (!row || !row.active || (row.expires_at && Date.parse(row.expires_at) < Date.now())) throw bad("This coupon code isn't valid or has expired.");
  const svc = Array.isArray(row.services) ? row.services : [];
  const subtotal = lines.reduce((s, l) => s + l.price * l.q, 0);
  const base = lines.filter((l) => !svc.length || svc.includes(l.name)).reduce((s, l) => s + l.price * l.q, 0);
  if (!base) throw bad("This coupon doesn't apply to the items in your cart" + (svc.length ? " (valid for " + svc.slice(0, 4).join(", ") + (svc.length > 4 ? " and more" : "") + ")." : "."));
  if (row.min_order > 0 && subtotal < row.min_order) throw bad("This coupon needs an order of at least ৳" + row.min_order.toLocaleString("en-US") + ".");
  if (row.max_uses > 0 || row.per_email) {
    const used = (await db.rest("GET", `orders?coupon=eq.${db.q(code)}&paid=eq.true&select=email&limit=2000`)) || [];
    if (row.max_uses > 0 && used.length >= row.max_uses) throw bad("This coupon has been fully used.");
    if (row.per_email && email && used.some((o) => String(o.email).toLowerCase() === String(email).toLowerCase())) throw bad("You have already used this coupon.");
  }
  let d = row.kind === "fixed" ? row.value : Math.floor((base * row.value) / 100);
  if (row.kind !== "fixed" && row.max_discount > 0) d = Math.min(d, row.max_discount);
  d = Math.max(0, Math.min(d, base, subtotal - 1));
  if (!(d >= 1)) throw bad("This coupon doesn't give a discount on this order.");
  return { code, discount: d, label: row.kind === "fixed" ? "৳" + row.value + " off" : row.value + "% off" };
}
module.exports = { apply, norm, CouponError };
