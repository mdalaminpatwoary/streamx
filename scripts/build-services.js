/* Builds the SEO landing pages from the catalog.
   Run:  node scripts/build-services.js      (then: node scripts/build-og.js for the share images)
   Output: services/index.html, services/<slug>/index.html, sitemap.xml
   Edit prices/plans in assets/js/data/catalog.js and copy in scripts/service-content.js, then run this again. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const SITE = "https://streamx.bd";
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const ctx = vm.createContext({});
["assets/js/data/config.js", "assets/js/utils/helpers.js", "assets/js/data/catalog.js", "assets/js/data/logos.js", "assets/js/data/reviews.js"]
  .forEach(f => vm.runInContext(read(f).replace(/^const /gm, "var "), ctx));
const run = s => vm.runInContext(s, ctx);
const PRODUCTS = run("PRODUCTS"), LOGOS = run("LOGOS"), LOGO_OF = run("LOGO_OF"), WA = run("WA_NUMBER"), slug = run("slug"), PARTS = run("PARTS");
const CONTENT = require("./service-content.js");
const REVIEWS = run("REVIEWS");
const TREND = { "Netflix": ["netflix"], "Amazon Prime Video": ["prime"], "Disney+": ["disney"], "HBO Max": ["hbomax"], "Hulu": ["hulu"], "Paramount+": ["paramount"], "Crunchyroll": ["crunchyroll"], "JioHotstar": ["hotstar"], "ZEE5": ["zee5"], "Entertainment Combo": ["netflix", "prime"] };
const TNAME = { netflix: "Netflix", prime: "Prime Video", disney: "Disney+", hbomax: "HBO Max", hulu: "Hulu", paramount: "Paramount+", crunchyroll: "Crunchyroll", hotstar: "JioHotstar", zee5: "ZEE5" };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const taka = n => "৳" + n.toLocaleString("en-US");
const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const ADULT = run("ADULT_PAGES");
const isAdult = p => p.cat === "18+";
const pages = PRODUCTS.filter(p => p.cat !== "18+" || ADULT.includes(p.name));
const open18 = pages.filter(p => !isAdult(p));   // pages shown in the hub, sitemap, share images and "related" lists
const allPrices = p => p.variants.flatMap(v => v.plans.map(x => x.p));
const lo = p => Math.min(...allPrices(p)), hi = p => Math.max(...allPrices(p));
const logo = p => {
  const L = LOGOS[LOGO_OF[p.name]];
  if (!L) return `<span class="sp-logo" style="background:${p.color}"><b>${esc(p.name[0])}</b></span>`;
  return `<span class="sp-logo${L.a > 2.4 ? " wide" : ""}${L.r ? " round" : ""}" style="background:${L.bg}"><svg viewBox="${L.vb}" fill="${L.fg}" aria-hidden="true"><path d="${L.p}"/></svg></span>`;
};
const catLabel = { "Streaming": "streaming", "Music & Audio": "music and audio", "AI Tools": "AI tools", "Productivity": "productivity tools", "Learning": "learning", "Gift Cards": "gift cards", "Virtual Cards": "virtual cards", "VPN": "VPN", "Bundle": "bundles" };
const ICON = {
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>', chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'
};
const ic = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

const buy = (n, vr, v, vn, pr) => ` data-buy="${esc(JSON.stringify({ n, vr: vr || "", v, i: [n, vn, v].join("|"), p: pr }))}"`;
function plansHtml(p) {
  const s = slug(p.name);
  if (p.gift) return `<div class="sp-vcard"><div class="sp-vh"><h3>US ${esc(p.name)}</h3><span class="sp-tag">$5 to $500</span></div><p>Choose any amount from $5 to $500 in steps of $5. Price = dollars × ৳130.</p><ul class="sp-ft"><li>US region</li><li>${p.name === "iTunes Gift Card" ? "For iTunes Store, App Store, Apple Music and more" : "For the App Store, iCloud+, Apple Music and more"}</li></ul><div class="sp-rows">${[5, 10, 25, 50, 100].map(a => `<a class="sp-row" href="/#plan=${s}"${buy(p.name, "", "$" + a, p.variants[0].n, a * 130)}><span>$${a}</span><b>${taka(a * 130)}</b><i>Buy</i></a>`).join("")}</div></div>`;
  if (p.packs) return p.packs.map((k, i) => `<div class="sp-vcard"><div class="sp-vh"><h3>${esc(k.n)}</h3><span class="sp-tag">${esc(k.tag)}</span></div><p>${esc(k.sub)}</p><ul class="sp-ft">${k.f.map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="sp-rows"><a class="sp-row" href="/#plan=${s}&v=0&k=${i}"${buy(p.name, "", k.n, p.variants[0].n, k.p)}><span>Per month</span><b>${taka(k.p)}</b><i>Buy</i></a></div></div>`).join("");
  return p.variants.map((v, vi) => `<div class="sp-vcard"><div class="sp-vh"><h3>${esc(v.n)}</h3>${v.tag ? `<span class="sp-tag">${esc(v.tag)}</span>` : ""}</div><p>${esc(v.line)}</p><ul class="sp-ft">${v.f.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${v.notes.length ? `<ul class="sp-nt">${v.notes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<div class="sp-rows">${v.plans.map((pl, k) => `<a class="sp-row" href="/#plan=${s}&v=${vi}&k=${k}"${buy(p.name, p.variants.length > 1 ? v.n : "", pl.v, v.n, pl.p)}><span>${esc(pl.v)}${pl.m > 1 ? `<small>${taka(Math.round(pl.p / pl.m))} / month</small>` : ""}</span><b>${taka(pl.p)}</b><i>Buy</i></a>`).join("")}</div></div>`).join("");
}

const head = ({ title, desc, url, img, extra = "", noindex = false }) => `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large,max-snippet:-1"}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="StreamX"><meta property="og:locale" content="en_BD">
<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#0a0d1a">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/assets/img/favicon/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/service-page.css?v=35"><link rel="stylesheet" href="/assets/css/title-modal.css?v=3"><link rel="stylesheet" href="/assets/css/components/chat-widget.css?v=20261121c"><link rel="stylesheet" href="/assets/css/components/chatbot.css?v=8">
${extra}
</head>`;

/* glow colour that matches the logo, where the brand colour in the catalog is a different hue */
const GLOW = { ChatGPT: "#5f3fd0", "Gemini Pro": "#8e75b2" };
const nav = (items) => `<header class="sp-nav"><div class="sp-wrap sp-navin"><a class="sp-brand" href="/"><img src="/assets/img/brand/logo.png" alt="StreamX" width="40" height="40"></a><nav aria-label="Page sections">${items.map(([l, h]) => `<a href="${h}"${h === "#trending" ? " hidden" : ""}>${l}</a>`).join("")}</nav><button type="button" class="sp-acct sp-cartb" id="spCart" aria-label="Open cart" title="Cart"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg><em id="spCartN" hidden>0</em></button><a class="sp-acct" href="/account/" aria-label="My subscriptions" title="My subscriptions"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg></a></div></header>`;
const HOME = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const HF = HOME.slice(HOME.indexOf('<footer id="contact"'));
const trustHtml = (HF.match(/<div class="wrap ftrust">([\s\S]*?)<\/div>\s*\n\s*<div class="wrap fgrid">/) || [,""])[1].replace(/class="ftr rv" style="--k:\d"/g, 'class="sf-tr"').replace(/<\/div><div class="sf-tr"/g, '</div><div class="sf-tr"');
const socsHtml = (HF.match(/<div class="socs">[\s\S]*?<\/div>/) || [""])[0];
const ctHtml = (HF.match(/<div class="fcol fct rv">[\s\S]*?<\/div>\s*\n\s*<\/div>/) || [""])[0];
const foot = `<footer class="sp-foot" id="contact"><div class="sf-w sf-trust">${trustHtml}</div><div class="sf-w sf-grid"><div class="sf-brand"><img src="/assets/img/brand/logo.png" alt="StreamX" width="72" height="72"><p>Digital subscriptions, made easier for Bangladesh. Straightforward ordering, local payments and support when you need it.</p>${socsHtml}</div><div class="sf-col"><h4>Explore</h4><a class="fl" href="/services/"><b>All services</b></a><a class="fl" href="/#pricing"><b>Plans</b></a><a class="fl" href="/#bundles"><b>Combo packs</b></a><a class="fl" href="/#how"><b>How it works</b></a><a class="fl" href="/#reviews"><b>Reviews</b></a></div><div class="sf-col"><h4>Popular</h4><a class="fl" href="/services/netflix/"><b>Netflix</b></a><a class="fl" href="/services/amazon-prime-video/"><b>Prime Video</b></a><a class="fl" href="/services/spotify/"><b>Spotify</b></a><a class="fl" href="/services/youtube-premium/"><b>YouTube Premium</b></a><a class="fl" href="/services/chatgpt/"><b>ChatGPT Plus</b></a></div><div class="sf-col"><h4>Help</h4><a class="fl" href="/#faq"><b>FAQ</b></a><a class="fl" href="${wa("Hi StreamX! I have a question.")}"><b>Support</b></a><a class="fl" href="/account/"><b>My account</b></a><a class="fl" href="/about/"><b>About us</b></a><a class="fl" href="/terms/"><b>Terms</b></a><a class="fl" href="/privacy/"><b>Privacy</b></a><a class="fl" href="/return-policy/"><b>Returns</b></a></div><div class="sf-ct"><h4>Contact</h4>CTILES<p class="sf-hrs"><i></i>Support available 24/7 on WhatsApp</p></div></div><div class="sf-w sf-bar"><span>© 2026 StreamX. All rights reserved.</span><span>Independent reseller. Not affiliated with any brand shown.</span><button class="sp-fdb" type="button" data-fbk aria-label="Send feedback"><span>Feedback</span><i><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></i></button></div></footer>`.replace("CTILES", ctHtml.replace(/^<div[^>]*><h4>Contact<\/h4>/, "").replace(/<p class="fhrs">[\s\S]*$/, "").replace(/<a class="ctile" data-wa="([^"]*)" href="#">/, (m, t) => `<a class="ctile" href="${wa(t)}" target="_blank" rel="noopener">`));
const scriptOld = `<script>(function(){var r=document.querySelectorAll('.sp-rv');if(!('IntersectionObserver' in window)){r.forEach(function(e){e.classList.add('in')});return}var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');o.unobserve(e.target)}})},{threshold:.12});r.forEach(function(e,i){e.style.setProperty('--d',(i%4)*70+'ms');o.observe(e)});var h=document.querySelector('.sp-hero');if(h&&matchMedia('(hover:hover)').matches){h.addEventListener('pointermove',function(e){var b=h.getBoundingClientRect();h.style.setProperty('--mx',(e.clientX-b.left)+'px');h.style.setProperty('--my',(e.clientY-b.top)+'px')})}})();</script>`;

const script = `<div class="cw" id="cw">
  <div class="cw-bubble" id="cwBubble" role="status" aria-live="polite">
    <button class="cw-x" id="cwX" type="button" aria-label="Close message">×</button>
    <b><i></i><em id="cwName">Muhammad Al-Amin</em><small>· StreamX</small></b>
    <span class="cw-msg" id="cwMsg"></span><span class="dots"><i></i><i></i><i></i></span>
    
  </div>
  <a class="cw-btn" id="cwBtn" href="#" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
    <span class="cw-ring"></span><span class="cw-av" id="cwAv"></span><span class="cw-on"></span>
    <span class="cw-wa" id="cwBadge" data-p="wa" aria-hidden="true"><svg class="cwi-w" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg><svg class="cwi-m" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.16.16.14.26.35.27.57l.05 1.78a.8.8 0 0 0 1.12.71l1.98-.87a.8.8 0 0 1 .53-.04c.9.25 1.86.38 2.9.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.94 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.19-.69-.64l2.94-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.19.69.64z"/></svg><svg class="cwi-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg></span>
  </a>
</div>\n<script src="/assets/js/service-page.js?v=10" defer></script><script src="/assets/js/feedback-lite.js?v=3" defer></script><script src="/assets/js/service-checkout.js?v=3" defer></script><script src="/assets/js/service-cart.js?v=1" defer></script><script src="/assets/js/service-share.js?v=1" defer></script><script src="/assets/js/data/logos.js?v=20261121a" defer></script><script src="/assets/js/data/config.js?v=20261119zz" defer></script><script src="/assets/js/data/catalog.js?v=20261120k" defer></script><script src="/assets/js/data/faq.js?v=20261121e" defer></script><script src="/assets/js/data/policies.js?v=20261121a" defer></script><script src="/assets/js/utils/helpers.js?v=20261119zz" defer></script><script src="/assets/js/service-bot.js?v=1" defer></script><script src="/assets/js/features/chatbot.js?v=11" defer></script><script src="/assets/js/features/chat-avatar.js?v=20261121j" defer></script>`;
const AGE = `<div class="sp-age" id="spAge" role="dialog" aria-modal="true" aria-labelledby="spAgeT"><div class="sp-agebox"><b class="sp-age18">18+</b><h2 id="spAgeT">Adults only</h2><p>This page is about a service with mature content. Please confirm that you are 18 or older to continue.</p><button type="button" class="sp-btn" id="spAgeYes">I am 18 or older</button><a class="sp-agno" href="/">Leave</a></div></div><script>(function(){var b=document.body,ok=false;try{ok=sessionStorage.getItem("sx_18")==="1"}catch(e){}if(ok){b.classList.add("ok");return}document.getElementById("spAgeYes").onclick=function(){try{sessionStorage.setItem("sx_18","1")}catch(e){}b.classList.add("ok")}})()</script>`;
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);
function trendHtml(p) {
  const ids = TREND[p.name]; if (!ids) return "";
  const names = ids.map(i => TNAME[i]).join(" and ");
  return `<section class="sp-sec sp-alt sp-trend" id="trending" data-svc="${esc(p.name)}" data-trend="${ids.join(",")}" data-names="${esc(ids.map(i => TNAME[i]).join(","))}" hidden><div class="sp-wrap"><div class="sp-thead"><div><span class="sp-eyebrow">Trending now</span><h2>Trending on ${esc(names)}</h2><p class="sp-sub">The top 10 movies and series people are watching, updated through the day.</p></div><div class="sp-tctl">${ids.length > 1 ? `<div class="sp-seg" data-seg="p">${ids.map((i, n) => `<button type="button" data-v="${i}"${n ? "" : ' class="on"'}>${TNAME[i]}</button>`).join("")}</div>` : ""}<div class="sp-seg" data-seg="k"><button type="button" data-v="movie" class="on">Movies</button><button type="button" data-v="tv">Series</button></div></div></div><div class="sp-rail" aria-live="polite"></div><p class="sp-tnote"></p></div></section>`;
}
function comboHtml(p) {
  const combo = PRODUCTS.find(x => x.packs && (PARTS[x.name] || []).includes(LOGO_OF[p.name]));
  if (!combo || combo === p) return "";
  const cs = slug(combo.name), others = (PARTS[combo.name] || []).filter(k => k !== LOGO_OF[p.name]).map(k => (PRODUCTS.find(x => LOGO_OF[x.name] === k) || {}).name).filter(Boolean);
  return `<section class="sp-sec sp-combo" id="combo"><div class="sp-wrap"><div class="sp-thead"><div><span class="sp-eyebrow">Save more, together</span><h2>${esc(p.name)}${others.length ? " + " + esc(others.join(" + ")) : ""} combo packs</h2><p class="sp-sub">Get ${esc(p.name)} with ${esc(others.join(" and ") || "more")} in one monthly price, and save compared with buying each separately.</p></div><a class="sp-btn sp-ghost sp-sm" href="/services/${cs}/">About the combo</a></div>
<div class="sp-vgrid">${combo.packs.map((k, i) => `<div class="sp-vcard sp-rv"><div class="sp-vh"><h3>${esc(k.n)}</h3><span class="sp-tag">${esc(k.tag)}</span></div><p>${esc(k.sub)}</p><ul class="sp-ft">${k.f.map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="sp-rows"><a class="sp-row" href="/#plan=${cs}&v=0&k=${i}"${buy(combo.name, "", k.n, combo.variants[0].n, k.p)}><span>Per month<small>Regular <s>${taka(k.old)}</s> · Save ${taka(k.old - k.p)}</small></span><b>${taka(k.p)}</b><i>Buy</i></a></div></div>`).join("")}</div></div></section>`;
}
function reviewsHtml(p) {
  const list = REVIEWS.filter(r => (r.services || []).includes(p.name) || r.p === p.name);
  const avg = list.length ? (list.reduce((a, r) => a + r.s, 0) / list.length).toFixed(1) : "";
  const init = n => n.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const cards = list.map(r => `<figure class="sp-rev sp-rv"><div class="sp-rst" aria-label="${r.s} out of 5">${stars(r.s)}</div><blockquote>${esc(r.t)}</blockquote><figcaption><span class="sp-av">${esc(init(r.n))}</span><span><b>${esc(r.n)}</b><small>${esc([r.role, r.loc].filter(Boolean).join(" · "))}</small></span></figcaption></figure>`).join("");
  return `<section class="sp-sec" id="reviews"><div class="sp-wrap"><div class="sp-thead"><div><span class="sp-eyebrow">Customer reviews</span><h2>What customers say about ${esc(p.name)}</h2>${list.length ? `<p class="sp-sub"><span class="sp-avg">${avg}</span> average from ${list.length} review${list.length > 1 ? "s" : ""} of ${esc(p.name)}.</p>` : `<p class="sp-sub">No reviews of ${esc(p.name)} yet. Bought it from us? Be the first to share how it went.</p>`}</div><a class="sp-btn sp-ghost sp-sm" href="https://www.facebook.com/streamx.com.bd/reviews" target="_blank" rel="noopener">Reviews on Facebook ↗</a></div>
${cards ? `<div class="sp-revgrid">${cards}</div>` : ""}
<form class="sp-rform sp-rv" data-svc="${esc(p.name)}" data-wa="${WA}" novalidate><h3>Write a review of ${esc(p.name)}</h3><div class="sp-pick" role="radiogroup" aria-label="Your rating">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="${n === 5}" data-n="${n}" aria-label="${n} star${n > 1 ? "s" : ""}"${n === 5 ? ' class="on"' : ""}>★</button>`).join("")}</div><div class="sp-rrow"><input name="n" type="text" placeholder="Your name (optional)" autocomplete="name"><textarea name="t" rows="3" placeholder="How was your experience with ${esc(p.name)}?" required></textarea></div><div class="sp-ract"><button class="sp-btn" type="submit">Send review on WhatsApp</button><small>Your review opens in WhatsApp so you can read it before you send.</small></div></form></div></section>`;
}
function servicePage(p) {
  const combo = PRODUCTS.find(x => x.packs && (PARTS[x.name] || []).includes(LOGO_OF[p.name]) && x !== p);
  const s = slug(p.name), c = CONTENT[p.name] || { h: p.desc, about: [p.desc], pop: [], popLabel: "Highlights", best: [], faq: [] };
  const url = `${SITE}/services/${s}/`, img = isAdult(p) ? `${SITE}/assets/img/og/home.jpg` : `${SITE}/assets/img/og/${s}.jpg`;
  const from = lo(p), cheap = p.variants.flatMap(v => v.plans).find(x => x.p === from);
  const unit = p.gift ? "" : p.packs ? " / month" : "";
  const title = `Buy ${p.name} in Bangladesh – from ${taka(from)} | StreamX`;
  let desc = `Buy ${p.name} in Bangladesh from ${taka(from)}. ${p.desc} Pay with bKash, Nagad, Rocket or card. Fixed BDT prices.`;
  if (desc.length > 158) desc = `Buy ${p.name} in Bangladesh from ${taka(from)}. Fixed BDT prices, pay with bKash, Nagad, Rocket or card, support on WhatsApp.`;
  const related = isAdult(p) ? pages.filter(x => isAdult(x) && x !== p) : open18.filter(x => x.cat === p.cat && x !== p).slice(0, 4).concat(open18.filter(x => x.cat !== p.cat && x.cat !== "Bundle")).slice(0, 4);
  const faqs = [
    [`How much is ${p.name} in Bangladesh?`, `${p.name} on StreamX starts from ${taka(from)}${unit}${p.gift ? " (for a $5 card)" : ""}. Prices are fixed in BDT, so the amount you see is the amount you pay. Plans for longer periods cost less per month.`],
    [`How do I pay for ${p.name}?`, `Pay online with bKash, Nagad, Rocket, Upay or a card through EPS's secure payment page, or order on WhatsApp and send the payment yourself.`],
    [`How is ${p.name} delivered?`, `Many plans are delivered instantly after payment is confirmed. Plans activated on your own email or marked as depending on stock can take longer. Each plan lists its delivery type.`],
    ...(c.faq || []),
    [`What if my ${p.name} stops working?`, `Message us on WhatsApp. If it is an eligible subscription within its stated period, we will fix or replace it.`]
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.desc, image: img, brand: { "@type": "Brand", name: p.name }, category: p.cat, url,
      offers: { "@type": "AggregateOffer", priceCurrency: "BDT", lowPrice: lo(p), highPrice: hi(p), offerCount: p.variants.flatMap(v => v.plans).length, availability: "https://schema.org/InStock", url, seller: { "@type": "Organization", name: "StreamX", url: SITE } } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" }, { "@type": "ListItem", position: 2, name: "Services", item: SITE + "/services/" }, { "@type": "ListItem", position: 3, name: p.name, item: url }] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
  ];
  const orderMsg = `Hi StreamX! I want to buy ${p.name}.`;
  return head({ title, desc, url, img, noindex: isAdult(p), extra: isAdult(p) ? "" : `<script type="application/ld+json">${JSON.stringify(ld)}</script>` }) + `
<body style="--c:${GLOW[p.name] || p.color}"${isAdult(p) ? ' class="sp-adult"' : ""}>${isAdult(p) ? AGE : ""}
${nav([["Home", "/"], ["Pricing", "#plans"], ...(combo ? [["Combo", "#combo"]] : []), ...(TREND[p.name] ? [["Trending", "#trending"]] : []), ["About", "#about"], ["Reviews", "#reviews"], ["FAQ", "#faq"], ["Contact", "#contact"]])}
<main>
<section class="sp-hero"><div class="sp-grid" aria-hidden="true"></div>
 <div class="sp-wrap sp-herogrid">
  <div class="sp-rv"><nav class="sp-crumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/services/">Services</a><span>/</span><b>${esc(p.name)}</b></nav>
   <span class="sp-eyebrow">${esc(p.cat === "Bundle" ? "Bundle" : p.cat)}</span>
   <h1>Buy ${esc(p.name)} <span>in Bangladesh</span></h1>
   <p class="sp-lead">${esc(c.h)}.</p>
   <div class="sp-cta"><a class="sp-btn" href="#plans">See plans and prices</a><a class="sp-btn sp-ghost" href="${wa(orderMsg)}" rel="noopener">Order on WhatsApp</a><button type="button" class="sp-btn sp-ghost sp-share" data-name="${esc(p.name)}" data-text="${esc(p.name)} in Bangladesh on StreamX. Fixed prices in BDT, fast delivery. See plans:" ${isAdult(p) ? "" : `data-img="/assets/img/og/${s}.jpg"`}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg><span>Share</span></button></div>
   <ul class="sp-trust"><li>${ic("bolt")}Fast delivery</li><li>${ic("card")}bKash, Nagad, Rocket</li><li>${ic("shield")}Replacement warranty</li><li>${ic("chat")}24/7 support</li></ul>
  </div>
  <div class="sp-hcard sp-rv"><i class="sp-ring r1" aria-hidden="true"></i><i class="sp-ring r2" aria-hidden="true"></i>${logo(p)}<div class="sp-from"><small>Starting from</small><b>${taka(from)}</b><small>${p.gift ? "for a $5 card" : cheap && cheap.m ? `for ${esc(cheap.v)}${p.packs ? "" : ""}` : ""}</small></div><div class="sp-meta"><span>${p.variants.length > 1 || p.packs ? (p.packs ? p.packs.length : p.variants.length) + " plan types" : "1 plan type"}</span><span>Fixed BDT price</span></div></div>
 </div></section>

<section class="sp-sec" id="plans"><div class="sp-wrap"><h2 class="sp-rv">${esc(p.name)} plans and prices</h2><p class="sp-sub sp-rv">Every price is fixed in BDT. Choose a plan type, then the duration. Longer plans cost less per month.</p><div class="sp-vgrid">${plansHtml(p).replace(/<div class="sp-vcard">/g, '<div class="sp-vcard sp-rv">')}</div></div></section>

${comboHtml(p)}
${trendHtml(p)}
<section class="sp-sec sp-alt" id="about"><div class="sp-wrap sp-two">
 <div class="sp-rv"><h2>About ${esc(p.name)}</h2>${c.about.map(t => `<p>${esc(t)}</p>`).join("")}</div>
 <div class="sp-rv"><h2>${esc(c.popLabel || "Highlights")}</h2><div class="sp-chips">${(c.pop || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>${(c.best || []).length ? `<h3>Great for</h3><ul class="sp-list">${c.best.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}</div>
</div></section>

<section class="sp-sec"><div class="sp-wrap"><h2 class="sp-rv">Why buy ${esc(p.name)} from StreamX</h2><div class="sp-why">
 <div class="sp-rv">${ic("card")}<h3>Fixed prices in BDT</h3><p>The price you see is the price you pay, with no hidden charges and no foreign card needed.</p></div>
 <div class="sp-rv">${ic("bolt")}<h3>Fast delivery</h3><p>Many plans are delivered within minutes after payment is confirmed.</p></div>
 <div class="sp-rv">${ic("shield")}<h3>Replacement warranty</h3><p>If an eligible subscription has a problem during its stated period, we sort it out.</p></div>
 <div class="sp-rv">${ic("chat")}<h3>Real people on WhatsApp</h3><p>Questions about a plan, payment or delivery? We reply directly, any time.</p></div>
</div></div></section>

${reviewsHtml(p)}

<section class="sp-sec sp-alt" id="faq"><div class="sp-wrap sp-narrow"><h2 class="sp-rv">${esc(p.name)} questions, answered</h2>${faqs.map(([q, a]) => `<details class="sp-faq sp-rv"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></section>

<section class="sp-sec"><div class="sp-wrap"><h2 class="sp-rv">You may also like</h2><div class="sp-rel">${related.map(x => `<a class="sp-rc sp-rv" href="/services/${slug(x.name)}/" style="--c:${x.color}">${logo(x)}<span><b>${esc(x.name)}</b><small>From ${taka(lo(x))}</small></span></a>`).join("")}</div></div></section>

<section class="sp-sec"><div class="sp-wrap"><div class="sp-end sp-rv"><h2>Ready to get ${esc(p.name)}?</h2><p>Pick your plan, pay online in seconds or order on WhatsApp.</p><div class="sp-cta"><a class="sp-btn" href="/#plan=${s}">Choose your plan</a><a class="sp-btn sp-ghost" href="${wa(orderMsg)}" rel="noopener">Chat on WhatsApp</a></div></div></div></section>
</main>
${foot}
${script}
</body></html>`;
}

function hubPage() {
  const ad = pages.filter(isAdult);
  const HUB18 = ad.length ? `<section class="sp-sec" id="adults"><div class="sp-wrap"><h2 class="sp-rv">18+ <span class="sp-tag">Adults only</span></h2><div id="adLock" class="sp-adlock"><p>These services contain mature content and are for viewers aged 18 or older.</p><button type="button" class="sp-btn" id="adShow">I am 18 or older, show them</button></div><div class="sp-rel sp-big" id="adList" hidden>${ad.map(x => `<a class="sp-rc" href="/services/${slug(x.name)}/" style="--c:${x.color}">${logo(x)}<span><b>${esc(x.name)}</b><small>From ${taka(lo(x))}</small></span></a>`).join("")}</div></div></section>` : "";
  const HUB18JS = ad.length ? `<script>(function(){var l=document.getElementById("adList"),k=document.getElementById("adLock");function go(){l.hidden=false;k.hidden=true}var ok=false;try{ok=sessionStorage.getItem("sx_18")==="1"}catch(e){}if(ok)go();document.getElementById("adShow").onclick=function(){try{sessionStorage.setItem("sx_18","1")}catch(e){}go()}})()</script>` : "";
  const url = `${SITE}/services/`, img = `${SITE}/assets/img/og/home.jpg`;
  const title = "All Services in Bangladesh – Netflix, Spotify, ChatGPT | StreamX";
  const desc = "Browse every StreamX service: streaming, music, AI, VPN, learning and cards at fixed BDT prices. Pay with bKash, Nagad, Rocket or card.";
  const cats = [...new Set(open18.map(p => p.cat))];
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: "StreamX services", url, hasPart: open18.map(p => ({ "@type": "WebPage", name: p.name, url: `${SITE}/services/${slug(p.name)}/` })) };
  return head({ title, desc, url, img, extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` }) + `
<body style="--c:#ed3124">${nav([["Home", "/"], ...cats.map(c => [({ "Bundle": "Bundles", "Music & Audio": "Music", "Virtual Cards": "Cards" })[c] || c, "#" + slug(c)]), ["Contact", "#contact"]])}<main>
<section class="sp-hero sp-hub"><div class="sp-grid" aria-hidden="true"></div><div class="sp-wrap"><div class="sp-rv"><span class="sp-eyebrow">All services</span><h1>Premium subscriptions <span>for Bangladesh</span></h1><p class="sp-lead">Streaming, music, AI tools, VPN, learning, gift cards and virtual cards. Fixed prices in BDT, local payments, support on WhatsApp.</p><div class="sp-cta"><button type="button" class="sp-btn sp-ghost sp-share" data-name="Services" data-text="Premium subscriptions for Bangladesh on StreamX. Fixed prices in BDT, local payments:" data-img="/assets/img/og/home.jpg"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg><span>Share</span></button></div></div></div></section>
${cats.map(c => `<section class="sp-sec" id="${slug(c)}"><div class="sp-wrap"><h2 class="sp-rv">${esc(c === "Bundle" ? "Bundles" : c)}</h2><div class="sp-rel sp-big">${open18.filter(p => p.cat === c).map(x => `<a class="sp-rc sp-rv" href="/services/${slug(x.name)}/" style="--c:${x.color}">${logo(x)}<span><b>${esc(x.name)}</b><small>From ${taka(lo(x))}</small></span></a>`).join("")}</div></div></section>`).join("")}
${HUB18}</main>${foot}${script}${HUB18JS}</body></html>`;
}

const out = (f, t) => { const p = path.join(ROOT, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); };
pages.forEach(p => out(`services/${slug(p.name)}/index.html`, servicePage(p)));
out("services/index.html", hubPage());
const d = new Date().toISOString().slice(0, 10);
const urls = [["/", "1.0", "weekly"], ["/services/", "0.9", "weekly"], ["/about/", "0.5", "monthly"], ["/return-policy/", "0.4", "monthly"], ["/terms/", "0.3", "monthly"], ["/privacy/", "0.3", "monthly"], ...open18.map(p => [`/services/${slug(p.name)}/`, "0.8", "weekly"])];
out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, pr, cf]) => `<url><loc>${SITE}${u}</loc><lastmod>${d}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`).join("\n")}\n</urlset>\n`);
console.log("pages:", pages.length, "| OG list:", open18.map(p => slug(p.name)).join(","));
fs.writeFileSync(path.join(__dirname, "og-list.json"), JSON.stringify(open18.map(p => ({ slug: slug(p.name), name: p.name, from: lo(p), color: p.color, cat: p.cat, logo: LOGOS[LOGO_OF[p.name]] || null }))));
