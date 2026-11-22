/* Makes a 1200x630 share image per service (assets/img/og/<slug>.jpg) and the home image.
   Run after build-services.js:  node scripts/build-og.js   (needs Playwright) */
const fs = require("fs"), path = require("path"), { chromium } = require("playwright");
const ROOT = path.join(__dirname, ".."), list = JSON.parse(fs.readFileSync(path.join(__dirname, "og-list.json"), "utf8"));
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const logoBrand = "data:image/png;base64," + fs.readFileSync(path.join(ROOT, "assets/img/brand/logo.png")).toString("base64");
const tile = it => {
  const L = it.logo;
  if (!L) return `<div class="lg" style="background:${it.color}"><b>${esc(it.name[0])}</b></div>`;
  return `<div class="lg${L.r ? " r" : ""}" style="background:${L.bg}"><svg viewBox="${L.vb}" fill="${L.fg}" style="width:${L.a > 2.4 ? 80 : 62}%;${L.a > 2.4 ? "height:auto" : "height:62%"}"><path d="${L.p}"/></svg></div>`;
};
const page = (it, home) => `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;font-family:Manrope,Inter,Arial,sans-serif;color:#fff;background:#0a0d1a;position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(700px 420px at 82% 28%,${home ? "#ed312466" : it.color + "66"},transparent 70%),radial-gradient(800px 500px at 0% 0%,#4f6bff33,transparent 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff0d 1px,transparent 1px),linear-gradient(90deg,#ffffff0d 1px,transparent 1px);background-size:50px 50px;-webkit-mask:radial-gradient(ellipse at 70% 40%,#000 10%,transparent 70%)}
.in{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.top{display:flex;align-items:center;gap:16px;font-weight:800;font-size:28px}.top img{width:56px;height:56px;border-radius:14px}
.mid{display:flex;align-items:center;gap:56px}
.lg{width:250px;height:250px;border-radius:62px;display:grid;place-items:center;flex:none;box-shadow:0 30px 70px #000a}.lg.r{border-radius:50%}.lg svg{display:block}.lg b{font-size:120px}
h1{font-size:${home ? 78 : 80}px;line-height:1.02;letter-spacing:-2.5px;font-weight:800}h1 span{color:#ed3124}
p{margin-top:20px;font-size:34px;color:#c4cbe3;font-weight:600}
.bot{display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#98a1bc;font-weight:600}
.pill{padding:12px 26px;border-radius:99px;background:linear-gradient(90deg,#ed3124,#ff4f3f);color:#fff;font-weight:800}
</style><div class="bg"></div><div class="grid"></div><div class="in">
<div class="top"><img src="${logoBrand}">StreamX</div>
<div class="mid">${home ? "" : tile(it)}<div><h1>${home ? "Premium subscriptions,<br><span>fairly priced.</span>" : esc(it.name) + "<br><span>in Bangladesh</span>"}</h1><p>${home ? "Netflix, Spotify, ChatGPT and more. Pay in BDT." : (it.from ? "From ৳" + it.from.toLocaleString("en-US") + " · Fixed BDT prices" : "Price on WhatsApp")}</p></div></div>
<div class="bot"><span>streamx.bd</span><span class="pill">bKash · Nagad · Rocket · Card</span></div></div>`;
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  fs.mkdirSync(path.join(ROOT, "assets/img/og"), { recursive: true });
  for (const it of [{ slug: "home" }, ...list]) {
    await pg.setContent(page(it, it.slug === "home")); await pg.waitForTimeout(150);
    await pg.screenshot({ path: path.join(ROOT, "assets/img/og", it.slug + ".jpg"), type: "jpeg", quality: 88 });
  }
  await b.close(); console.log("og images:", list.length + 1);
})();
