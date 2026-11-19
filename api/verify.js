/* GET /api/verify?t=<merchantTransactionId>  ->  { status, amount, ... }
   Asks EPS directly whether the payment succeeded. The page never trusts the URL alone. */
const { config, xhash, epsFetch, getToken } = require("./_eps");
const db = require("./_db");
const subs = require("./_subs");

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Sends the owner a copy of a PAID order (via Resend). Safe to call many times:
// the idempotency key makes Resend ignore repeats, so refreshing the result page never sends duplicates.
async function mailOrder(j, mtid, env) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.ORDER_EMAIL_TO || "streamx.com.bd@gmail.com";
  const from = process.env.MAIL_FROM || "StreamX Orders <onboarding@resend.dev>";
  const rows = [
    ["Order reference", mtid], ["Status", j.Status], ["Amount", "৳" + j.TotalAmount], ["Paid with", j.FinancialEntity],
    ["EPS transaction ID", j.EpsTransactionId], ["Date", j.TransactionDate], ["Environment", env],
    ["Customer", j.CustomerName], ["Phone", j.CustomerPhone], ["Email", j.CustomerEmail],
    ["Items", j.ValueC || j.ProductName], ["Customer note", j.ValueA], ["Tip", j.ValueB],
  ].filter((r) => r[1]);
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="color:#ED3124">New paid order · StreamX</h2><table cellpadding="8" style="border-collapse:collapse;width:100%">${rows
    .map((r) => `<tr><td style="border-bottom:1px solid #eee;color:#666">${esc(r[0])}</td><td style="border-bottom:1px solid #eee"><b>${esc(r[1])}</b></td></tr>`)
    .join("")}</table><p style="color:#666">Deliver the subscription on WhatsApp to the phone number above.</p></div>`;
  const text = rows.map((r) => r[0] + ": " + r[1]).join("\n");
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "Idempotency-Key": "order-" + mtid },
      body: JSON.stringify({ from, to: [to], reply_to: j.CustomerEmail || undefined, subject: `New paid order ৳${j.TotalAmount} · ${j.CustomerName || mtid}`, html, text }),
      signal: ctl.signal,
    });
    if (!r.ok) console.error("order email failed", r.status, (await r.text()).slice(0, 200));
  } catch (e) {
    console.error("order email error", e && e.message);
  } finally {
    clearTimeout(t);
  }
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
      await mailOrder(j, t, c.env);
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
