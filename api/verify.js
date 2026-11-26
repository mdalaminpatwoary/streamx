/* GET /api/verify?t=<merchantTransactionId>  ->  { status, amount, ... }
   Asks EPS directly whether the payment succeeded. The page never trusts the URL alone. */
const { config, xhash, epsFetch, getToken } = require("./_eps");
const db = require("./_db");
const subs = require("./_subs");

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Sends the owner a copy of a PAID order (via Resend). Safe to call many times:
// the idempotency key makes Resend ignore repeats, so refreshing the result page never sends duplicates.
async function mailOrder(j, mtid, env, req) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const mail = require("./_mail");
    const m = mail.orderCopy(req, { ref: mtid, paid: true, amount: j.TotalAmount, method: j.FinancialEntity, eps: j.EpsTransactionId, date: j.TransactionDate, name: j.CustomerName, phone: j.CustomerPhone, email: j.CustomerEmail, items: j.ValueC || j.ProductName, note: j.ValueA, tip: j.ValueB, env });
    await mail.send({ to: process.env.ORDER_EMAIL_TO || "streamx.com.bd@gmail.com", subject: m.subject, html: m.html, text: m.text, replyTo: j.CustomerEmail || undefined, idem: "order-" + mtid });
  } catch (e) { console.error("order email error", e && e.message); }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const t = String((req.query && req.query.t) || "");
  if (!/^\d{10,24}$/.test(t)) return res.status(400).json({ error: "Invalid reference." });
  try {
    const c = config();
    const token = await getToken(c);
    const r = await epsFetch(`${c.base}/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${encodeURIComponent(t)}`, {
      method: "GET",
      headers: { Authorization: "Bearer " + token, "x-hash": xhash(c.hashKey, t) },
    });
    const j = r.json || {};
    if (!j.MerchantTransactionId && !j.Status) return res.status(200).json({ status: "Unknown" });
    if (String(j.Status).toLowerCase() === "success") {
      await mailOrder(j, t, c.env, req);
      if (db.enabled()) { try { await subs.activateOrder(t); } catch (e) { console.error("activate failed", e && e.message); } }
    }
    // Only non-personal fields go back to the browser.
    return res.status(200).json({
      status: j.Status || "Unknown",
      amount: j.TotalAmount,
      date: j.TransactionDate,
      method: j.FinancialEntity,
      epsTransactionId: j.EpsTransactionId,
      reference: j.MerchantTransactionId,
      items: j.ValueC || j.ProductName || "",
    });
  } catch (e) {
    console.error("verify error", e && e.message);
    // 424 (not 5xx) so Cloudflare does not replace our JSON with its own error page.
    return res.status(424).json({ error: "Could not check the payment right now." });
  }
};
module.exports.mailOrder = mailOrder;
