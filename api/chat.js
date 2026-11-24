/* POST /api/chat {messages:[{role:"user"|"assistant",content}]} -> {reply}
   Free AI answers for the chat assistant, used only when the site's own answers do not fit.
   Providers (OpenAI-compatible, free tiers): Google Gemini first, then Groq, then Cerebras if their keys exist. Keys live in Vercel env vars:
     GROQ_API_KEY      (optional GROQ_MODEL, default openai/gpt-oss-20b)
     GEMINI_API_KEY    (optional GEMINI_MODEL, default gemini-4-hydrogen)
     CEREBRAS_API_KEY  (optional CEREBRAS_MODEL, default llama3.1-8b)
   The model only sees StreamX's own catalog, FAQ and refund policy (loaded here, never from the browser), no account data. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { products } = require("./_eps");

const PROVIDERS = [
  { name: "gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: () => process.env.GEMINI_API_KEY, model: () => process.env.GEMINI_MODEL || "gemini-4-hydrogen" },
  { name: "groq", url: "https://api.groq.com/openai/v1/chat/completions", key: () => process.env.GROQ_API_KEY, model: () => process.env.GROQ_MODEL || "openai/gpt-oss-20b" },
  { name: "cerebras", url: "https://api.cerebras.ai/v1/chat/completions", key: () => process.env.CEREBRAS_API_KEY, model: () => process.env.CEREBRAS_MODEL || "llama3.1-8b" },
];

/* ---- site data, loaded once per warm instance ---- */
let SC;
function serviceContent() {
  if (SC !== undefined) return SC;
  SC = null;
  for (const f of [path.join(process.cwd(), "scripts", "service-content.js"), path.join(__dirname, "..", "scripts", "service-content.js"), "/var/task/scripts/service-content.js"]) {
    try { if (fs.existsSync(f)) { const m = require(f); SC = m.default || m; break; } } catch (e) {}
  }
  return SC;
}
function about(p) {
  const c = (serviceContent() || {})[p.name];
  if (!c) return "";
  const faq = (c.faq || []).map((f) => (Array.isArray(f) ? `Q: ${f[0]} A: ${f[1]}` : f && f.q ? `Q: ${f.q} A: ${f.a}` : "")).filter(Boolean).join(" ");
  return `ABOUT ${p.name}: ${(c.about || []).join(" ")}${c.best ? " Best for: " + (Array.isArray(c.best) ? c.best.join("; ") : c.best) + "." : ""}${faq ? " " + faq : ""}`.slice(0, 2400);
}
let FACTS;
function readData(name, expr) {
  const rel = path.join("assets", "js", "data", name);
  const file = [path.join(process.cwd(), rel), path.join(__dirname, "..", rel), path.join("/var/task", rel)].find((f) => fs.existsSync(f));
  if (!file) return null;
  try { return vm.runInNewContext(fs.readFileSync(file, "utf8") + "\n;" + expr, {}, { timeout: 2000 }); } catch (e) { return null; }
}
function facts() {
  if (FACTS) return FACTS;
  const P = products();
  const from = (p) => Math.min(...p.variants.flatMap((v) => v.plans.map((x) => x.p)).filter((n) => n > 0));
  const faq = readData("faq.js", "FAQS") || [];
  const pol = readData("policies.js", "POL") || {};
  const row = (p) => `${p.name} [${p.cat}]: ` + p.variants.map((v) => `${v.n}: ` + v.plans.map((x) => `${x.v} ৳${x.p}`).join(", ")).join(" | ");
  const shown = P.filter((p) => !p.name.startsWith("18"));
  const faqText = faq.map((f) => `Q: ${f[0]} A: ${f[1]}`).join("\n").slice(0, 6000);
  const terms = pol.terms ? pol.terms[1].join(" ").slice(0, 2200) : "";
  const ret = pol.return ? pol.return[1].join(" ").slice(0, 1800) : "";
  const known = new Set();
  shown.forEach((p) => p.variants.forEach((v) => v.plans.forEach((x) => known.add(Number(x.p)))));
  (faqText + " " + terms + " " + ret).replace(/৳\s?([\d,]+)|([\d,]+)\s?(?:taka|tk|bdt)/gi, (m, a, b) => { known.add(Number(String(a || b).replace(/,/g, ""))); return m; });
  FACTS = { P: shown, table: shown.map(row).join("\n"), faq: faqText, terms, ret, known };
  return FACTS;
}
function detail(p) {
  const vs = p.variants.map((v) => `${v.n}${v.line ? " - " + v.line : ""}${v.f && v.f.length ? " Includes: " + v.f.join(", ") + "." : ""}${v.notes && v.notes.length ? " Note: " + v.notes.join("; ") + "." : ""} Prices: ` + v.plans.map((x) => `${x.v} ৳${x.p}`).join(", ")).join("\n  ");
  return `${p.name} (${p.cat}): ${String(p.desc || "").slice(0, 200)}\n  ${vs}`.slice(0, 2200);
}
const ALIAS = { prime: "amazon prime video", amazon: "amazon prime video", yt: "youtube premium", youtube: "youtube premium", gpt: "chatgpt", openai: "chatgpt", hotstar: "jiohotstar", jio: "jiohotstar", disney: "disney+", hbo: "hbo max", max: "hbo max", paramount: "paramount+", apple: "apple music", itunes: "itunes gift card", vpn: "nordvpn", nord: "nordvpn", express: "expressvpn", gemini: "gemini plus", google: "google one", anime: "crunchyroll", bkash: "", combo: "entertainment combo" };
function matchProducts(text) {
  const t = " " + text.toLowerCase().replace(/[^a-z0-9+ ]/g, " ") + " ";
  const hit = new Map();
  facts().P.forEach((p) => {
    const n = p.name.toLowerCase();
    if (t.includes(" " + n.replace(/[^a-z0-9+ ]/g, " ") + " ") || t.includes(n)) hit.set(p.name, p);
  });
  t.split(/\s+/).forEach((w) => {
    const a = ALIAS[w];
    if (a) { const p = facts().P.find((x) => x.name.toLowerCase() === a); if (p) hit.set(p.name, p); }
  });
  return [...hit.values()].slice(0, 3);
}
function system(text) {
  const F = facts(), hit = matchProducts(text);
  return [
    "You are the StreamX assistant on streamx.bd, a Bangladeshi digital subscription store with fixed prices in Bangladeshi Taka (৳).",
    "ACCURACY RULES (most important): 1) Use ONLY the facts below. Quote prices, plan names and durations exactly as listed, never round or estimate. 2) If a product, plan, price, delivery time or policy is not in the facts, say you are not sure and suggest WhatsApp +880 1312-850241; never guess. 3) If the question is ambiguous (for example a product with several plan types), name the options with their prices and ask which one they want. 4) Compare plans only using the listed prices and features. 5) Never promise discounts, stock, delivery times or refunds that the facts do not state. 6) Questions about movies, series or general streaming knowledge can use general knowledge, but never claim a title is on a specific service unless you are sure.",
    "Never ask for passwords, card numbers or OTP codes. Subscriptions do not renew automatically. Payment: bKash, Nagad, Rocket, Upay, card, bank transfer. Orders are placed online or on WhatsApp.",
    "Style: friendly, plain text, no markdown, at most 90 words. Reply in the user's language (English or Bengali). When giving a price include the plan name and duration.",
    hit.length ? "MOST RELEVANT PRODUCT DETAILS:\n" + hit.map((p) => detail(p) + "\n" + about(p)).join("\n") : "",
    "FULL PRICE LIST (all current prices):\n" + F.table,
    "FAQ:\n" + F.faq,
    F.terms ? "TERMS: " + F.terms : "",
    F.ret ? "REFUND POLICY: " + F.ret : "",
  ].filter(Boolean).join("\n\n");
}

/* A reply may only quote prices that exist in the facts; otherwise it is retried once, then replaced by a safe answer. */
function badPrice(reply) {
  const known = facts().known; let bad = false;
  reply.replace(/৳\s?([\d,]+)|([\d,]+)\s?(?:taka|tk|bdt)\b/gi, (m, a, b) => { const n = Number(String(a || b).replace(/,/g, "")); if (n > 0 && !known.has(n)) bad = true; return m; });
  return bad;
}
const SAFE = "I am not fully sure about that, so I would rather not guess. Please message our team on WhatsApp +880 1312-850241 and they will confirm the exact price and details.";

/* ---- light abuse control (per warm instance) ---- */
const hits = new Map(); let day = "", dayN = 0;
function limited(ip) {
  const now = Date.now(), d = new Date().toISOString().slice(0, 10);
  if (d !== day) { day = d; dayN = 0; }
  if (dayN >= 900) return true; // stay inside the free daily quota
  const a = (hits.get(ip) || []).filter((x) => now - x < 10 * 60000);
  if (a.length >= 12) { hits.set(ip, a); return true; }
  a.push(now); hits.set(ip, a); dayN++;
  if (hits.size > 2000) hits.clear();
  return false;
}

/* Questions that are about movies, series or the wider streaming world (not about StreamX prices or policy) can use Google Search grounding on Gemini. */
function wantsWeb(t) {
  const q = t.toLowerCase();
  if (/(price|cost|৳|taka|tk\b|plan|order|pay|refund|deliver|renew|activate|login|warranty|discount|coupon|cart|stock|available on streamx)/.test(q)) return false;
  return /(movie|film|series|season|episode|cast|actor|actress|director|release|released|when does|new on|trailer|imdb|rating|story|plot|anime|show|watch|ending|sequel|review of)/.test(q);
}
async function askGeminiWeb(pr, msgs) {
  const model = pr.model();
  const sys = msgs[0].content;
  const body = {
    systemInstruction: { parts: [{ text: sys + "\n\nFor movie or series questions you may use Google Search, then answer briefly. If a title is available on a StreamX service, mention it only if the facts above list that service." }] },
    contents: msgs.slice(1).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
  };
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": pr.key() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error("gemini-web HTTP " + r.status);
  const j = await r.json();
  const parts = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts || [];
  const t = parts.map((x) => x.text || "").join("").trim();
  if (!t) throw new Error("gemini-web empty");
  return t;
}

async function ask(pr, msgs) {
  const r = await fetch(pr.url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + pr.key() },
    body: JSON.stringify(Object.assign({ model: pr.model(), messages: msgs, temperature: 0.2, max_tokens: 220 }, /gpt-oss|gemini/.test(pr.model()) ? { max_tokens: 700, reasoning_effort: "low" } : {})),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(pr.name + " HTTP " + r.status);
  const j = await r.json();
  const t = String(j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || "").trim();
  if (!t) throw new Error(pr.name + " empty");
  return t;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const on = PROVIDERS.filter((p) => p.key());
    if (!on.length) return res.status(503).json({ error: "AI is not configured" });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-8)
      .map((m) => ({ role: m && m.role === "assistant" ? "assistant" : "user", content: String((m && m.content) || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 400) }))
      .filter((m) => m.content);
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== "user" || last.content.length < 2) return res.status(400).json({ error: "Ask a question." });
    if (/\b\d{12,}\b|[\w.+-]+@[\w-]+\.[\w.]+/.test(last.content)) return res.status(400).json({ error: "Please do not share personal or card details here." });
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
    if (limited(ip)) return res.status(429).json({ error: "Too many questions right now." });
    const convo = [{ role: "system", content: system(msgs.map((m) => m.content).join(" ")) }].concat(msgs);
    let reply = "", used = "";
    for (const pr of on) {
      try {
        if (pr.name === "gemini" && wantsWeb(last.content)) {
          try { reply = await askGeminiWeb(pr, convo); used = "gemini+search"; } catch (e) { console.error("chat web", e && e.message); reply = ""; }
        }
        if (!reply) { reply = await ask(pr, convo); used = pr.name; }
        if (badPrice(reply)) {
          reply = await ask(pr, convo.concat([{ role: "assistant", content: reply }, { role: "user", content: "That answer contains a price that is not in the price list. Answer again using only exact prices from the FULL PRICE LIST, or say you are not sure." }]));
          if (badPrice(reply)) reply = SAFE;
        }
        break;
      } catch (e) { console.error("chat", e && e.message); }
    }
    if (!reply) return res.status(502).json({ error: "AI is busy right now." });
    reply = reply.replace(/[*_`#<>]/g, "").replace(/\n{3,}/g, "\n\n").slice(0, 900);
    return res.status(200).json({ reply, by: used });
  } catch (e) {
    console.error("chat error", e && e.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};
