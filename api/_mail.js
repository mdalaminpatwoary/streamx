/* Shared email sender + the StreamX email design (dark, matches the website). Every email goes through layout(). */
const WA = "8801312850241";
const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const site = (req) => (process.env.SITE_URL || (req && req.headers ? "https://" + (req.headers["x-forwarded-host"] || req.headers.host) : "https://streamx.bd")).replace(/\/$/, "");

const C = { bg: "#070914", card: "#10142a", line: "#232a4d", tx: "#f4f6fb", mut: "#98a1bc", ac: "#ED3124" };
const FONT = "'Manrope','Segoe UI',Helvetica,Arial,sans-serif";

const button = (href, label, ghost) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td align="center" bgcolor="${ghost ? "#161b36" : C.ac}" style="border-radius:999px;${ghost ? "border:1px solid #2d3563;" : ""}background:${ghost ? "#161b36" : "linear-gradient(90deg,#ed3124,#ff4f3f)"}"><a href="${esc(href)}" style="display:inline-block;padding:14px 30px;font:700 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;

/* opts: { req, preheader, eyebrow, title, intro (html), body (html), cta:[href,label], cta2:[href,label], note (html) } */
function layout(o) {
  const S = site(o.req);
  const logo = `${S}/assets/img/brand/logo.png`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg}">${esc(o.preheader || o.title)}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background:${C.bg}"><tr><td align="center" style="padding:28px 14px">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
  <tr><td style="padding:0 6px 18px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle"><img src="${logo}" width="38" height="38" alt="StreamX" style="display:block;border-radius:10px;border:0"></td>
    <td style="vertical-align:middle;padding-left:10px;font:800 19px ${FONT};color:${C.tx};letter-spacing:-.01em">Stream<span style="color:${C.ac}">X</span></td></tr></table></td></tr>
  <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-radius:22px;overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
     <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${C.ac};background:linear-gradient(90deg,#ed3124,#ff6a3d 55%,#4f6bff)">&nbsp;</td></tr>
     <tr><td style="padding:34px 32px 8px">
       ${o.eyebrow ? `<div style="font:800 12px ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${C.ac};margin:0 0 12px">${esc(o.eyebrow)}</div>` : ""}
       <h1 style="margin:0 0 14px;font:800 27px/1.2 ${FONT};color:${C.tx};letter-spacing:-.02em">${o.title}</h1>
       ${o.intro ? `<p style="margin:0 0 20px;font:400 15.5px/1.65 ${FONT};color:#c5cce2">${o.intro}</p>` : ""}
     </td></tr>
     ${o.body ? `<tr><td style="padding:0 32px 8px">${o.body}</td></tr>` : ""}
     ${o.cta ? `<tr><td align="center" style="padding:22px 32px 6px">${button(o.cta[0], o.cta[1])}</td></tr>` : ""}
     ${o.cta2 ? `<tr><td align="center" style="padding:10px 32px 6px">${button(o.cta2[0], o.cta2[1], true)}</td></tr>` : ""}
     ${o.note ? `<tr><td style="padding:18px 32px 0;font:400 13.5px/1.6 ${FONT};color:${C.mut}">${o.note}</td></tr>` : ""}
     <tr><td style="padding:26px 32px 30px">&nbsp;</td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:22px 10px 6px;font:400 12.5px/1.7 ${FONT};color:${C.mut}">
    Need help? <a href="https://wa.me/${WA}" style="color:#ffb3aa;text-decoration:none;font-weight:700">Message us on WhatsApp</a> or reply to this email.<br>
    <a href="${S}/account/" style="color:${C.mut}">My account</a> &nbsp;·&nbsp; <a href="${S}/terms/" style="color:${C.mut}">Terms</a> &nbsp;·&nbsp; <a href="${S}/privacy/" style="color:${C.mut}">Privacy</a> &nbsp;·&nbsp; <a href="${S}/refund-policy/" style="color:${C.mut}">Refund policy</a><br>
    <span style="color:#6c7596">StreamX · Premium subscriptions for Bangladesh · Dhaka</span>
  </td></tr>
 </table>
</td></tr></table></body></html>`;
}

/* A table of label / value rows, used inside emails. */
const rows = (list) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px;background:#0c1024">${list
    .filter((r) => r[1] !== "" && r[1] != null)
    .map((r, i, a) => `<tr><td style="padding:12px 16px;${i < a.length - 1 ? `border-bottom:1px solid ${C.line};` : ""}font:400 13.5px ${FONT};color:${C.mut};width:38%">${esc(r[0])}</td><td style="padding:12px 16px;${i < a.length - 1 ? `border-bottom:1px solid ${C.line};` : ""}font:700 14.5px ${FONT};color:${C.tx}">${r[2] ? r[1] : esc(r[1])}</td></tr>`)
    .join("")}</table>`;

/* Item list: [{name, plan, q}] */
const items = (list, pill = ["DELIVERED", "#0e2a1d", "#1d6b43", "#4ade80"]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px;background:#0c1024">${list
    .map((l, i) => `<tr><td style="padding:14px 16px;${i < list.length - 1 ? `border-bottom:1px solid ${C.line};` : ""}"><div style="font:800 15.5px ${FONT};color:${C.tx}">${esc(l.name)}${(l.q || 1) > 1 ? ` <span style="color:${C.mut};font-weight:600">× ${esc(l.q)}</span>` : ""}</div>${l.plan ? `<div style="font:400 13px ${FONT};color:${C.mut};margin-top:2px">${esc(l.plan)}</div>` : ""}</td><td align="right" style="padding:14px 16px;${i < list.length - 1 ? `border-bottom:1px solid ${C.line};` : ""}"><span style="display:inline-block;padding:4px 11px;border-radius:99px;background:${pill[1]};border:1px solid ${pill[2]};font:800 11.5px ${FONT};color:${pill[3]};letter-spacing:.03em">${pill[0]}</span></td></tr>`)
    .join("")}</table>`;

async function send({ to, subject, html, text, replyTo, idem, bcc }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email is not configured.");
  const from = process.env.MAIL_FROM || "StreamX <onboarding@resend.dev>";
  const headers = { Authorization: "Bearer " + key, "Content-Type": "application/json" };
  if (idem) headers["Idempotency-Key"] = idem;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers, signal: ctl.signal, body: JSON.stringify({ from, to: [].concat(to), bcc, reply_to: replyTo || undefined, subject, html, text }) });
    if (!r.ok) throw new Error("mail " + r.status + " " + (await r.text()).slice(0, 160));
  } finally { clearTimeout(t); }
}

/* ---------- the emails ---------- */
const signIn = (req, link, code) => ({
  subject: code ? "Your StreamX sign-in code: " + code : "Your StreamX sign-in link",
  html: layout({ req, preheader: code ? "Your code is " + code + ". It works for 10 minutes." : "Your secure sign-in link. It works for 20 minutes.", eyebrow: "My account", title: "Sign in to StreamX",
    intro: code ? "Enter this code on the sign-in page to see your subscriptions, expiry dates and purchase history. It works for 10 minutes and can be used once." : "Press the button below to see your subscriptions, expiry dates and purchase history. The link works for 20 minutes and can be used once.",
    body: code ? "<div style=\"margin:6px 0 4px;padding:18px 12px;text-align:center;border:1px solid " + C.line + ";border-radius:16px;background:" + C.bg + "\"><div style=\"font:800 34px/1 'Courier New',monospace;letter-spacing:10px;color:#ffffff;padding-left:10px\">" + esc(code) + "</div></div><p style=\"margin:14px 0 0;color:" + C.mut + ";font-size:13.5px;text-align:center\">Or sign in with one tap:</p>" : "",
    cta: [link, "Sign in securely"],
    note: "Never share this code with anyone. StreamX will never ask you for it on WhatsApp or by phone.<br><br>Did not ask for this? You can safely ignore this email." }),
  text: (code ? "Your StreamX sign-in code: " + code + "\nIt works for 10 minutes. Never share it with anyone.\n\nOr use this link: " : "Sign in to StreamX: ") + link,
});

const delivered = (req, ord) => {
  const S = site(req), lines = (Array.isArray(ord.lines) ? ord.lines : []).filter(Boolean), first = (ord.name || "").trim().split(/\s+/)[0];
  const ref = String(ord.mtid || "").slice(-8).toUpperCase();
  return {
    subject: lines.length === 1 ? `Your ${lines[0].name} is delivered` : "Your StreamX order is delivered",
    html: layout({ req, preheader: "Good news: your subscription has been delivered.", eyebrow: "Order delivered", title: first ? `${esc(first)}, your order is delivered` : "Your order is delivered",
      intro: "Thank you for choosing StreamX. Your subscription is ready to use. Your account details and setup steps were sent to you on WhatsApp, and you can track expiry dates and renew from your account at any time.",
      body: (lines.length ? items(lines) : "") + `<div style="height:14px"></div>` + rows([["Order", "#" + ref], ["Delivered", new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10) + " (Bangladesh time)"]]),
      cta: [S + "/account/", "View my subscriptions"],
      cta2: ["https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi StreamX! I need help with my order #" + ref), "Get help on WhatsApp"],
      note: "Sign in to your account with this email address (<b style=\"color:#c5cce2\">" + esc(ord.email || "") + "</b>) to see everything in one place. Something wrong with your account? Tell us within the warranty period and we will fix or replace it. See our <a href=\"" + S + "/refund-policy/\" style=\"color:#ffb3aa\">refund policy</a>." }),
    text: `Your StreamX order #${ref} is delivered.\n` + lines.map((l) => `- ${l.name} ${l.plan || ""} x${l.q || 1}`).join("\n") + `\nManage your subscriptions: ${S}/account/\nHelp: https://wa.me/${WA}`,
  };
};

/* Support changed the customer's name or mobile number. d = {email, name, changes:[[label, text]]}. Never contains secrets. */
const profileChanged = (req, d) => {
  const S = site(req), first = (d.name || "").trim().split(/\s+/)[0], list = (d.changes || []).filter(Boolean);
  return {
    subject: "Your StreamX account details were updated",
    html: layout({ req, preheader: "StreamX support updated your account details.", eyebrow: "Account update", title: first ? `${esc(first)}, your details were updated` : "Your details were updated",
      intro: "Our team updated the details on your StreamX account. Here is what changed:",
      body: rows(list),
      cta: [S + "/account/", "Open my account"],
      cta2: ["https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi StreamX! I did not expect a change to my account details."), "This was not me? Message us"],
      note: "Your sign-in email (<b style=\"color:#c5cce2\">" + esc(d.email || "") + "</b>) has not changed. You can edit your name and mobile number any time from My account → Edit profile." }),
    text: "StreamX support updated your account details:\n" + list.map((l) => `- ${l[0]}: ${l[1]}`).join("\n") + `\nOpen your account: ${S}/account/\nNot you? WhatsApp: https://wa.me/${WA}`,
  };
};

/* Copy of an online order for the shop mailbox. paid=false means "order placed, payment pending". */
const orderCopy = (req, d) => {
  const list = [["Order reference", d.ref], ["Status", d.paid ? "PAID" : "Awaiting payment"], ["Amount", d.amount ? "৳" + d.amount : ""], ["Paid with", d.method], ["EPS transaction ID", d.eps], ["Date", d.date],
    ["Customer", d.name], ["Phone", d.phone], ["Email", d.email], ["Items", d.items], ["Customer note", d.note], ["Tip", d.tip], ["Environment", d.env]];
  return {
    subject: (d.paid ? "New paid order" : "New order placed") + (d.amount ? ` ৳${d.amount}` : "") + ` · ${d.name || d.ref}`,
    html: layout({ req, preheader: `${d.name || "A customer"} ordered ${d.items || "a subscription"}`, eyebrow: d.paid ? "Paid order" : "Order placed", title: d.paid ? "New paid order" : "New order (awaiting payment)",
      intro: d.paid ? "Payment confirmed by EPS. Deliver the subscription, then mark the order as delivered in the admin page (the customer gets an email automatically)." : "A customer started an online order. You will get another email when the payment is confirmed.",
      body: rows(list), cta: [site(req) + "/admin/", "Open admin"] }),
    text: list.filter((r) => r[1]).map((r) => r[0] + ": " + r[1]).join("\n"),
  };
};


/* Sent when the owner marks an online order as refunded. r = {amount, fee, method, account, ref, note} */
const refunded = (req, ord, r = {}) => {
  const S = site(req), lines = (Array.isArray(ord.lines) ? ord.lines : []).filter(Boolean), first = (ord.name || "").trim().split(/\s+/)[0];
  const ref = String(ord.mtid || "").slice(-8).toUpperCase(), tk = (n) => "৳" + Number(n).toLocaleString("en-US");
  const paid = lines.reduce((t, l) => t + (Number(l.price) > 0 ? Number(l.price) * (l.q || 1) : 0), 0), amt = Number(r.amount) || 0, fee = Number(r.fee) || 0;
  const day = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10) + " (Bangladesh time)";
  const refundRows = rows([["Order", "#" + ref], ["Amount paid", paid ? tk(paid) : ""], ["Refund charge", fee > 0 ? "− " + tk(fee) : ""], ["Amount refunded", amt > 0 ? tk(amt) : ""], ["Refunded to", [r.method, r.account].filter(Boolean).join(" · ")], ["Refund reference", r.ref || ""], ["Refund date", day]]);
  const you = rows([["Name", ord.name || ""], ["Email", ord.email || ""], ["Mobile", ord.phone || ""]]);
  const h = (t) => `<div style="font:800 12px ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${C.mut};margin:18px 0 8px">${t}</div>`;
  return {
    subject: lines.length === 1 ? `Your ${lines[0].name} payment has been refunded` : "Your StreamX payment has been refunded",
    html: layout({ req, preheader: "We have refunded your payment. You are always welcome back.", eyebrow: "Refund processed", title: first ? `${esc(first)}, your payment is refunded` : "Your payment is refunded",
      intro: "We are sorry to see you go. We have refunded your payment, and the details are below. Thank you for giving StreamX a try." + (r.note ? "<br><br>" + esc(r.note) : ""),
      body: (lines.length ? items(lines, ["REFUNDED", "#1b1f4a", "#4f5bd5", "#a5b4fc"]) : "") + h("Refund details") + refundRows + h("Your details") + you,
      cta: [S + "/", "Browse subscriptions"],
      cta2: ["https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi StreamX! About my refunded order #" + ref), "Message us on WhatsApp"],
      note: "You are always welcome at StreamX. Whenever you would like to come back, we will be glad to help. If any detail above looks wrong, reply to this email or message us and we will check it right away. See our <a href=\"" + S + "/refund-policy/\" style=\"color:#ffb3aa\">refund policy</a>." }),
    text: `Your StreamX order #${ref} has been refunded.\n` + (amt > 0 ? `Amount refunded: ${tk(amt)}${fee > 0 ? ` (refund charge ${tk(fee)})` : ""}\n` : "") + ([r.method, r.account].filter(Boolean).length ? `Refunded to: ${[r.method, r.account].filter(Boolean).join(" ")}\n` : "") + (r.ref ? `Reference: ${r.ref}\n` : "") + `\nName: ${ord.name || ""}\nEmail: ${ord.email || ""}\nMobile: ${ord.phone || ""}\n\nYou are always welcome at StreamX.\nHelp: https://wa.me/${WA}`,
  };
};

module.exports = { send, layout, signIn, delivered, refunded, profileChanged, orderCopy, esc, site };
