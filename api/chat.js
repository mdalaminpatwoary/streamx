/* POST /api/chat {messages:[{role:"user"|"assistant",content}]} -> {reply}
   Free AI answers for the chat assistant, used only when the site's own answers do not fit.
   Providers (OpenAI-compatible, both have a free tier): Groq first, Cerebras as the backup. Keys live in Vercel env vars:
     GROQ_API_KEY      (optional GROQ_MODEL, default openai/gpt-oss-20b)
     CEREBRAS_API_KEY  (optional CEREBRAS_MODEL, default llama3.1-8b)
   The model only sees StreamX's own catalog, FAQ and return policy (loaded here, never from the browser), no account data. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { products } = require("./_eps");

const PROVIDERS = [
  { name: "groq", url: "https://api.groq.com/openai/v1/chat/completions", key: () => process.env.GROQ_API_KEY, model: () => process.env.GROQ_MODEL || "openai/gpt-oss-20b" },
  { name: "cerebras", url: "https://api.cerebras.ai/v1/chat/completions", key: () => process.env.CEREBRAS_API_KEY, model: () => process.env.CEREBRAS_MODEL || "llama3.1-8b" },
];

/* ---- site data, loaded once per warm instance ---- */
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
  FACTS = {
    P,
    list: P.filter((p) => !p.name.startsWith("18")).map((p) => `${p.name} (${p.cat}${isFinite(from(p)) ? ", from ৳" + from(p) : ""})`).join("; "),
    faq: faq.map((f) => `Q: ${f[0]} A: ${f[1]}`).join("\n").slice(0, 3500),
    ret: pol.return ? pol.return[1].join(" ").slice(0, 900) : "",
  };
  return FACTS;
}
function detail(p) {
  const vs = p.variants.map((v) => `${v.n}${v.line ? " - " + v.line : ""}: ` + v.plans.map((x) => `${x.v} ৳${x.p}`).join(", ")).join(" | ");
  return `${p.name} (${p.cat}): ${String(p.desc || "").slice(0, 160)} Plans: ${vs}`.slice(0, 900);
}
function system(text) {
  const F = facts(), t = text.toLowerCase();
  const hit = F.P.filter((p) => t.includes(p.name.toLowerCase()) || (p.name.length > 5 && t.includes(p.name.toLowerCase().split(" ")[0]) && p.name.split(" ")[0].length > 4)).slice(0, 3);
  return [
    "You are the StreamX assistant on streamx.bd, a Bangladeshi digital subscription store (Netflix, Spotify, Prime, ChatGPT, VPNs and more) with fixed prices in Bangladeshi Taka (৳).",
    "Rules: answer ONLY from the facts below and general knowledge about movies and series. If the facts do not contain the answer, say you are not sure and suggest messaging the team on WhatsApp. Never invent prices, plans or policies. Prices are in ৳ and may change, so tell people to confirm at checkout.",
    "Never ask for passwords, card numbers or OTP codes. Do not claim subscriptions renew automatically (they do not). Payment: bKash, Nagad, Rocket, Upay, card, bank transfer. Orders are placed online or on WhatsApp.",
    "Style: friendly, plain text, no markdown, at most 70 words. Reply in the user's language (English or Bengali).",
    "SERVICES: " + F.list,
    hit.length ? "DETAILS:\n" + hit.map(detail).join("\n") : "",
    "FAQ:\n" + F.faq,
    F.ret ? "RETURN POLICY: " + F.ret : "",
  ].filter(Boolean).join("\n\n");
}

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

async function ask(pr, msgs) {
  const r = await fetch(pr.url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + pr.key() },
    body: JSON.stringify(Object.assign({ model: pr.model(), messages: msgs, temperature: 0.3, max_tokens: 220 }, /gpt-oss/.test(pr.model()) ? { max_tokens: 700, reasoning_effort: "low" } : {})),
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
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-6)
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
      try { reply = await ask(pr, convo); used = pr.name; break; } catch (e) { console.error("chat", e && e.message); }
    }
    if (!reply) return res.status(502).json({ error: "AI is busy right now." });
    reply = reply.replace(/[*_`#<>]/g, "").replace(/\n{3,}/g, "\n\n").slice(0, 900);
    return res.status(200).json({ reply, by: used });
  } catch (e) {
    console.error("chat error", e && e.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};
