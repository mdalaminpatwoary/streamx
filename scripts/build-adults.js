/* Builds the separate 18+ page: adults/index.html (noindex, not in the sitemap, not linked from any other page).
   Run:  node scripts/build-adults.js
   Data comes from the "18+" entries of assets/js/data/catalog.js. Orders go through WhatsApp only (no online checkout). */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const ctx = vm.createContext({});
["assets/js/data/config.js", "assets/js/utils/helpers.js", "assets/js/data/catalog.js"].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8").replace(/^const /gm, "var "), ctx));
const run = s => vm.runInContext(s, ctx);
const PRODUCTS = run("PRODUCTS"), WA = run("WA_NUMBER"), slug = run("slug"), DUR = run("DUR");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const taka = n => "৳" + n.toLocaleString("en-US");
const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const items = PRODUCTS.filter(p => p.cat === "18+");
const logo = p => {
  const f = ["png", "svg"].find(e => fs.existsSync(path.join(ROOT, "assets/img/logos", slug(p.name) + "." + e)));
  return f ? `<span class="lg"><img src="/assets/img/logos/${slug(p.name)}.${f}" alt="" width="56" height="56"></span>` : `<span class="lg">${esc(p.name[0])}</span>`;
};
const card = p => {
  const v = p.variants[0];
  return `<article class="card"><div class="top">${logo(p)}<div><h2>${esc(p.name)}</h2><p class="v">${esc(v.n)}</p></div></div>
<p class="d">${esc(v.line || p.desc)}</p><ul class="f">${v.f.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
<div class="rows">${v.plans.map(pl => `<a class="row" href="${wa(`Hi StreamX! I want to buy ${p.name} (${pl.v}).`)}" rel="noopener nofollow"><span>${esc(pl.v)}</span><b>${taka(pl.p)}</b><i>Order on WhatsApp</i></a>`).join("")}</div></article>`;
};
const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>StreamX 18+</title>
<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#0a0d1a">
<link rel="icon" href="/favicon.ico" sizes="any">
<style>
:root{--bg:#0a0d1a;--fg:#eef1ff;--mut:#9aa4c6;--line:rgba(255,255,255,.1);--acc:#ed3124}
*{box-sizing:border-box}html{color-scheme:dark}
body{margin:0;background:radial-gradient(520px circle at 100% 0,rgba(79,107,255,.22),transparent 60%),radial-gradient(480px circle at 0 100%,rgba(237,49,36,.18),transparent 60%),var(--bg);color:var(--fg);font:15px/1.5 Manrope,system-ui,-apple-system,"Segoe UI",sans-serif;min-height:100vh;padding:0 max(16px,env(safe-area-inset-left)) 40px max(16px,env(safe-area-inset-right))}
.w{max-width:960px;margin:0 auto}
header{padding:28px 0 8px}.br{font-weight:800;letter-spacing:.3px;font-size:20px}.br em{font-style:normal;color:var(--acc)}
h1{font-size:clamp(28px,6vw,40px);line-height:1.1;margin:18px 0 8px}.tag{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#ff8b80;border:1px solid rgba(237,49,36,.45);border-radius:99px;padding:4px 10px;margin-left:8px;vertical-align:middle}
.sub{color:var(--mut);max-width:60ch;margin:0 0 24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}
.card{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:20px;padding:18px;display:flex;flex-direction:column;gap:12px;min-width:0;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.top{display:flex;gap:12px;align-items:center}.top h2{font-size:19px;margin:0}.v{margin:2px 0 0;color:var(--mut);font-size:13px}
.lg{flex:none;width:52px;height:52px;border-radius:14px;background:#2a3050;display:grid;place-items:center;font-weight:800;font-size:22px;overflow:hidden}.lg img{width:100%;height:100%;object-fit:cover}
.d{margin:0;color:var(--mut)}.f{margin:0;padding-left:18px;color:#cfd6ee;font-size:14px}
.rows{display:grid;gap:8px;margin-top:auto}
.row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:2px 10px;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--fg);text-decoration:none}
.row:hover{border-color:rgba(237,49,36,.55);background:rgba(237,49,36,.1)}.row b{font-size:17px}.row i{grid-column:1/-1;font-style:normal;font-size:12px;color:#7ee0a4}
.note{margin:28px 0 0;color:var(--mut);font-size:13px}
/* age gate: nothing is shown until the visitor confirms */
html:not(.ok) main{display:none}
.gate{position:fixed;inset:0;z-index:10;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(5,7,16,.72);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
html:not(.ok) .gate{display:flex}
.gb{width:min(420px,100%);border-radius:24px;border:1px solid var(--line);background:rgba(10,13,28,.7);padding:26px;text-align:center}
.gb b{display:block;font-size:44px;line-height:1}.gb h2{margin:8px 0}.gb p{color:var(--mut);margin:0 0 18px}
.btn{display:block;width:100%;padding:13px 16px;border-radius:99px;border:0;font:inherit;font-weight:700;cursor:pointer;text-decoration:none;text-align:center}
.yes{background:linear-gradient(90deg,#ed3124,#ff6a3d);color:#fff}.no{margin-top:10px;background:rgba(255,255,255,.08);color:var(--fg)}
</style>
</head><body>
<script>try{if(sessionStorage.getItem("sx_18")==="1")document.documentElement.classList.add("ok")}catch(e){}</script>
<div class="gate" role="dialog" aria-modal="true" aria-labelledby="gt"><div class="gb"><b>18+</b><h2 id="gt">Adults only</h2><p>These services are for people aged 18 or older. Please confirm your age to continue.</p>
<button class="btn yes" id="yes" type="button">I am 18 or older</button><a class="btn no" href="about:blank" rel="noopener nofollow">I am under 18, leave</a></div></div>
<div class="w"><header><div class="br">Stream<em>X</em></div></header>
<main><h1>18+ services<span class="tag">Adults only</span></h1>
<p class="sub">Adults-only subscriptions on shared accounts. Pick a plan and send the order on WhatsApp; we reply with the details and how to pay.</p>
<div class="grid">
${items.map(card).join("\n")}
</div>
<p class="note">Orders are taken on WhatsApp only. You must be 18 or older to buy.</p></main></div>
<noscript><p style="padding:20px;text-align:center">Please turn on JavaScript to continue.</p></noscript>
<script>document.getElementById("yes").addEventListener("click",function(){try{sessionStorage.setItem("sx_18","1")}catch(e){}document.documentElement.classList.add("ok")})</script>
</body></html>
`;
fs.mkdirSync(path.join(ROOT, "adults"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "adults", "index.html"), html);
console.log("adults/index.html:", items.map(p => p.name).join(", "));
