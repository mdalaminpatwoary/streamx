/* POST /api/checkout  ->  { redirectUrl }
   Creates an EPS payment session for the cart and returns the EPS payment page link. */
const { config, xhash, epsFetch, getToken, priceCart, clean, stage } = require("./_eps");

const PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const name = clean(b.name, 60), email = clean(b.email, 100), phone = clean(b.phone, 20).replace(/[\s-]/g, "");
    if (name.length < 2) return res.status(400).json({ error: "Please enter your name." });
    if (!EMAIL.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
    if (!PHONE.test(phone)) return res.status(400).json({ error: "Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)." });

    const wa = clean(b.whatsapp, 20).replace(/[\s-]/g, "");
    if (wa && !PHONE.test(wa)) return res.status(400).json({ error: "Please enter a valid WhatsApp number or leave it empty." });

    const lines = priceCart(b.items);
    const tip = Math.max(0, Math.min(5000, Math.floor(Number(b.tip) || 0)));
    const comment = clean(b.comment, 300);
    const subtotal = lines.reduce((s, l) => s + l.price * l.q, 0);
    const total = subtotal + tip;
    if (!(total >= 1)) return res.status(400).json({ error: "Invalid total." });

    const c = config();
    const site = (process.env.SITE_URL || "https://" + (req.headers["x-forwarded-host"] || req.headers.host)).replace(/\/$/, "");
    const stamp = Date.now().toString() + Math.floor(1000 + Math.random() * 9000);
    const mtid = stamp; // unique, 10+ digits
    const ret = (s) => `${site}/payment-result.html?s=${s}&t=${mtid}`;
    const summary = lines.map((l) => `${l.name} (${l.plan}) x${l.q}`).join("; ");
    const ip = clean((req.headers["x-forwarded-for"] || "").split(",")[0], 45) || "0.0.0.0";

    const token = await getToken(c);
    const body = (txnType) => ({
      merchantId: c.merchantId,
      storeId: c.storeId,
      CustomerOrderId: "SX" + stamp,
      merchantTransactionId: mtid,
      transactionTypeId: txnType,
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: total,
      ipAddress: ip,
      version: "1",
      successUrl: ret("success"),
      failUrl: ret("fail"),
      cancelUrl: ret("cancel"),
      customerName: name,
      customerEmail: email,
      customerAddress: "Dhaka",
      customerAddress2: "",
      customerCity: "Dhaka",
      customerState: "Dhaka",
      customerPostcode: "1361",
      customerCountry: "BD",
      customerPhone: phone,
      shipmentName: name,
      shipmentAddress: "Digital delivery",
      shipmentAddress2: "",
      shipmentCity: "Dhaka",
      shipmentState: "Dhaka",
      shipmentPostcode: "1361",
      shipmentCountry: "BD",
      valueA: comment,
      valueB: tip ? "Tip " + tip : "",
      valueC: summary.slice(0, 250),
      valueD: wa ? "WhatsApp " + wa : "",
      shippingMethod: "NO",
      noOfItem: String(lines.reduce((s, l) => s + l.q, 0)),
      productName: clean(lines.map((l) => l.name).join(", "), 100),
      productProfile: "digital-subscription",
      productCategory: "Subscription",
      ProductList: lines.map((l) => ({
        ProductName: l.name,
        NoOfItem: String(l.q),
        ProductProfile: l.plan,
        ProductCategory: "Subscription",
        ProductPrice: String(l.price),
      })),
    });

    const send = (t) =>
      epsFetch(c.base + "/EPSEngine/InitializeEPS", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, "x-hash": xhash(c.hashKey, mtid) },
        body: JSON.stringify(body(t)),
      });

    let r = await send(c.txnType);
    // The guide shows both 1 (Web) and 10 in samples; retry once with the other if EPS rejects the type.
    if (!(r.json && r.json.RedirectURL)) r = await send(c.txnType === 1 ? 10 : 1);
    if (!(r.json && r.json.RedirectURL)) {
      console.error("EPS initialize failed", r.status, r.text && r.text.slice(0, 400));
      const d = process.env.EPS_DEBUG ? " [INIT HTTP " + r.status + ": " + String(r.text || "").slice(0, 200) + "]" : " (code: INIT)";
      return res.status(424).json({ error: "The payment page could not be opened. Please try again or order on WhatsApp." + d });
    }
    return res.status(200).json({ redirectUrl: r.json.RedirectURL });
  } catch (e) {
    const msg = (e && e.message) || "";
    console.error("checkout error", (e && e.stage) || "", msg);
    if (/Your cart|no longer available|not configured/.test(msg)) return res.status(/not configured/.test(msg) ? 424 : 400).json({ error: msg });
    const code = (e && e.stage) || "SERVER";
    const detail = process.env.EPS_DEBUG ? " [" + code + ": " + msg.slice(0, 220) + "]" : " (code: " + code + ")";
    return res.status(424).json({ error: "Something went wrong. Please try again or order on WhatsApp." + detail });
  }
};
