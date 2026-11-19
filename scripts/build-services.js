/* Builds the SEO landing pages from the catalog.
   Run:  node scripts/build-services.js      (then: node scripts/build-og.js for the share images)
   Output: services/index.html, services/<slug>/index.html, sitemap.xml
   Edit prices/plans in assets/js/data/catalog.js and copy in scripts/service-content.js, then run this again. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const SITE = "https://streamx.com.bd";
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const ctx = vm.createContext({});
["assets/js/data/config.js", "assets/js/utils/helpers.js", "assets/js/data/catalog.js", "assets/js/data/logos.js", "assets/js/data/reviews.js"]
  .forEach(f => vm.runInContext(read(f).replace(/^const /gm, "var "), ctx));
const run = s => vm.runInContext(s, ctx);
const PRODUCTS = run("PRODUCTS"), LOGOS = run("LOGOS"), LOGO_OF = run("LOGO_OF"), WA = run("WA_NUMBER"), slug = run("slug");
const CONTENT = require("./service-content.js");
const REVIEWS = run("REVIEWS");
const TREND = { "Netflix": ["netflix"], "Amazon Prime Video": ["prime"], "Disney+": ["disney"], "HBO Max": ["hbomax"], "Hulu": ["hulu"], "Paramount+": ["paramount"], "Crunchyroll": ["crunchyroll"], "JioHotstar": ["hotstar"], "ZEE5": ["zee5"], "Entertainment Combo": ["netflix", "prime"] };
const TNAME = { netflix: "Netflix", prime: "Prime Video", disney: "Disney+", hbomax: "HBO Max", hulu: "Hulu", paramount: "Paramount+", crunchyroll: "Crunchyroll", hotstar: "JioHotstar", zee5: "ZEE5" };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const taka = n => "৳" + n.toLocaleString("en-US");
const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const pages = PRODUCTS.filter(p => p.cat !== "18+");
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

function plansHtml(p) {
  const s = slug(p.name);
  if (p.gift) return `<div class="sp-vcard"><div class="sp-vh"><h3>US Apple Gift Card</h3><span class="sp-tag">$5 to $500</span></div><p>Choose any amount from $5 to $500 in steps of $5. Price = dollars × ৳130.</p><ul class="sp-ft"><li>US region</li><li>For the App Store, iCloud+, Apple Music and more</li></ul><div class="sp-rows">${[5, 10, 25, 50, 100].map(a => `<a class="sp-row" href="/#plan=${s}"><span>$${a}</span><b>${taka(a * 130)}</b><i>Buy</i></a>`).join("")}</div></div>`;
  if (p.packs) return p.packs.map((k, i) => `<div class="sp-vcard"><div class="sp-vh"><h3>${esc(k.n)}</h3><span class="sp-tag">${esc(k.tag)}</span></div><p>${esc(k.sub)}</p><ul class="sp-ft">${k.f.map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="sp-rows"><a class="sp-row" href="/#plan=${s}&v=0&k=${i}"><span>Per month</span><b>${taka(k.p)}</b><i>Buy</i></a></div></div>`).join("");
  return p.variants.map((v, vi) => `<div class="sp-vcard"><div class="sp-vh"><h3>${esc(v.n)}</h3>${v.tag ? `<span class="sp-tag">${esc(v.tag)}</span>` : ""}</div><p>${esc(v.line)}</p><ul class="sp-ft">${v.f.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${v.notes.length ? `<ul class="sp-nt">${v.notes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<div class="sp-rows">${v.plans.map((pl, k) => `<a class="sp-row" href="/#plan=${s}&v=${vi}&k=${k}"><span>${esc(pl.v)}${pl.m > 1 ? `<small>${taka(Math.round(pl.p / pl.m))} / month</small>` : ""}</span><b>${taka(pl.p)}</b><i>Buy</i></a>`).join("")}</div></div>`).join("");
}

const head = ({ title, desc, url, img, extra = "" }) => `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="StreamX"><meta property="og:locale" content="en_BD">
<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#0a0d1a">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/assets/img/favicon/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/service-page.css?v=9">
${extra}
</head>`;

const nav = (cur) => `<header class="sp-nav"><div class="sp-wrap sp-navin"><a class="sp-brand" href="/"><img src="/assets/img/brand/logo.png" alt="StreamX" width="40" height="40"></a><nav aria-label="Main"><a href="/">Home</a><a href="/#products">Products</a><a href="/services/" ${cur}>Services</a><a href="/#pricing">Pricing</a><a href="/#how">How It Works</a><a href="/#reviews">Reviews</a><a href="/#faq">FAQ</a><a href="/#contact">Contact</a></nav><a class="sp-btn sp-sm" href="${wa("Hi StreamX!")}" rel="noopener">WhatsApp</a></div></header>`;
const foot = `<footer class="sp-foot"><div class="sp-wrap"><div><a class="sp-brand" href="/"><img src="/assets/img/brand/logo.png" alt="StreamX" width="40" height="40"></a><p>Digital subscriptions made easier for Bangladesh. Fixed BDT prices, local payments, support on WhatsApp.</p></div><div><h4>Explore</h4><a href="/">Home</a><a href="/services/">All services</a><a href="/#pricing">Pricing</a><a href="/#faq">FAQ</a></div><div><h4>Contact</h4><a href="${wa("Hi StreamX!")}">WhatsApp +880 1312-850241</a><a href="mailto:streamx.com.bd@gmail.com">streamx.com.bd@gmail.com</a></div></div><div class="sp-wrap sp-fine">© 2026 StreamX. Independent reseller, not affiliated with any brand shown. Brand names and logos belong to their owners.</div></footer>`;
const scriptOld = `<script>(function(){var r=document.querySelectorAll('.sp-rv');if(!('IntersectionObserver' in window)){r.forEach(function(e){e.classList.add('in')});return}var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');o.unobserve(e.target)}})},{threshold:.12});r.forEach(function(e,i){e.style.setProperty('--d',(i%4)*70+'ms');o.observe(e)});var h=document.querySelector('.sp-hero');if(h&&matchMedia('(hover:hover)').matches){h.addEventListener('pointermove',function(e){var b=h.getBoundingClientRect();h.style.setProperty('--mx',(e.clientX-b.left)+'px');h.style.setProperty('--my',(e.clientY-b.top)+'px')})}})();</script>`;

const script = `<script src="/assets/js/service-page.js?v=5" defer></script>`;
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);
function trendHtml(p) {
  const ids = TREND[p.name]; if (!ids) return "";
  const names = ids.map(i => TNAME[i]).join(" and ");
  return `<section class="sp-sec sp-alt sp-trend" id="trending" data-trend="${ids.join(",")}" data-names="${esc(ids.map(i => TNAME[i]).join(","))}" hidden><div class="sp-wrap"><div class="sp-thead"><div><span class="sp-eyebrow">Trending now</span><h2>Trending on ${esc(names)}</h2><p class="sp-sub">The top 10 movies and series people are watching, updated through the day.</p></div><div class="sp-tctl">${ids.length > 1 ? `<div class="sp-seg" data-seg="p">${ids.map((i, n) => `<button type="button" data-v="${i}"${n ? "" : ' class="on"'}>${TNAME[i]}</button>`).join("")}</div>` : ""}<div class="sp-seg" data-seg="k"><button type="button" data-v="movie" class="on">Movies</button><button type="button" data-v="tv">Series</button></div></div></div><div class="sp-rail" aria-live="polite"></div><p class="sp-tnote"></p></div></section>`;
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
  const s = slug(p.name), c = CONTENT[p.name] || { h: p.desc, about: [p.desc], pop: [], popLabel: "Highlights", best: [], faq: [] };
  const url = `${SITE}/services/${s}/`, img = `${SITE}/assets/img/og/${s}.jpg`;
  const from = lo(p), cheap = p.variants.flatMap(v => v.plans).find(x => x.p === from);
  const unit = p.gift ? "" : p.packs ? " / month" : "";
  const title = `Buy ${p.name} in Bangladesh – from ${taka(from)} | StreamX`;
  let desc = `Buy ${p.name} in Bangladesh from ${taka(from)}. ${p.desc} Pay with bKash, Nagad, Rocket or card. Fixed BDT prices.`;
  if (desc.length > 158) desc = `Buy ${p.name} in Bangladesh from ${taka(from)}. Fixed BDT prices, pay with bKash, Nagad, Rocket or card, support on WhatsApp.`;
  const related = pages.filter(x => x.cat === p.cat && x !== p).slice(0, 4).concat(pages.filter(x => x.cat !== p.cat && x.cat !== "Bundle")).slice(0, 4);
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
  return head({ title, desc, url, img, extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` }) + `
<body style="--c:${p.color}">
${nav("aria-current=\"page\"")}
<main>
<section class="sp-hero"><div class="sp-grid" aria-hidden="true"></div><div class="sp-scan" aria-hidden="true"></div>
 <div class="sp-wrap sp-herogrid">
  <div class="sp-rv"><nav class="sp-crumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/services/">Services</a><span>/</span><b>${esc(p.name)}</b></nav>
   <span class="sp-eyebrow">${esc(p.cat === "Bundle" ? "Bundle" : p.cat)}</span>
   <h1>Buy ${esc(p.name)} <span>in Bangladesh</span></h1>
   <p class="sp-lead">${esc(c.h)}.</p>
   <div class="sp-cta"><a class="sp-btn" href="#plans">See plans and prices</a><a class="sp-btn sp-ghost" href="${wa(orderMsg)}" rel="noopener">Order on WhatsApp</a></div>
   <ul class="sp-trust"><li>${ic("bolt")}Fast delivery</li><li>${ic("card")}bKash, Nagad, Rocket</li><li>${ic("shield")}Replacement warranty</li><li>${ic("chat")}24/7 support</li></ul>
  </div>
  <div class="sp-hcard sp-rv"><i class="sp-ring r1" aria-hidden="true"></i><i class="sp-ring r2" aria-hidden="true"></i>${logo(p)}<div class="sp-from"><small>Starting from</small><b>${taka(from)}</b><small>${p.gift ? "for a $5 card" : cheap && cheap.m ? `for ${esc(cheap.v)}${p.packs ? "" : ""}` : ""}</small></div><div class="sp-meta"><span>${p.variants.length > 1 || p.packs ? (p.packs ? p.packs.length : p.variants.length) + " plan types" : "1 plan type"}</span><span>Fixed BDT price</span></div></div>
 </div></section>

<section class="sp-sec" id="plans"><div class="sp-wrap"><h2 class="sp-rv">${esc(p.name)} plans and prices</h2><p class="sp-sub sp-rv">Every price is fixed in BDT. Choose a plan type, then the duration. Longer plans cost less per month.</p><div class="sp-vgrid">${plansHtml(p).replace(/<div class="sp-vcard">/g, '<div class="sp-vcard sp-rv">')}</div></div></section>

${trendHtml(p)}
<section class="sp-sec sp-alt"><div class="sp-wrap sp-two">
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

<section class="sp-sec sp-alt"><div class="sp-wrap sp-narrow"><h2 class="sp-rv">${esc(p.name)} questions, answered</h2>${faqs.map(([q, a]) => `<details class="sp-faq sp-rv"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></section>

<section class="sp-sec"><div class="sp-wrap"><h2 class="sp-rv">You may also like</h2><div class="sp-rel">${related.map(x => `<a class="sp-rc sp-rv" href="/services/${slug(x.name)}/" style="--c:${x.color}">${logo(x)}<span><b>${esc(x.name)}</b><small>From ${taka(lo(x))}</small></span></a>`).join("")}</div></div></section>

<section class="sp-sec"><div class="sp-wrap"><div class="sp-end sp-rv"><h2>Ready to get ${esc(p.name)}?</h2><p>Pick your plan, pay online in seconds or order on WhatsApp.</p><div class="sp-cta"><a class="sp-btn" href="/#plan=${s}">Choose your plan</a><a class="sp-btn sp-ghost" href="${wa(orderMsg)}" rel="noopener">Chat on WhatsApp</a></div></div></div></section>
</main>
${foot}
${script}
</body></html>`;
}

function hubPage() {
  const url = `${SITE}/services/`, img = `${SITE}/assets/img/og/home.jpg`;
  const title = "All Services in Bangladesh – Netflix, Spotify, ChatGPT | StreamX";
  const desc = "Browse every StreamX service: streaming, music, AI, VPN, learning and cards at fixed BDT prices. Pay with bKash, Nagad, Rocket or card.";
  const cats = [...new Set(pages.map(p => p.cat))];
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: "StreamX services", url, hasPart: pages.map(p => ({ "@type": "WebPage", name: p.name, url: `${SITE}/services/${slug(p.name)}/` })) };
  return head({ title, desc, url, img, extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` }) + `
<body style="--c:#ed3124">${nav("aria-current=\"page\"")}<main>
<section class="sp-hero sp-hub"><div class="sp-grid" aria-hidden="true"></div><div class="sp-scan" aria-hidden="true"></div><div class="sp-wrap"><div class="sp-rv"><span class="sp-eyebrow">All services</span><h1>Premium subscriptions <span>for Bangladesh</span></h1><p class="sp-lead">Streaming, music, AI tools, VPN, learning, gift cards and virtual cards. Fixed prices in BDT, local payments, support on WhatsApp.</p></div></div></section>
${cats.map(c => `<section class="sp-sec"><div class="sp-wrap"><h2 class="sp-rv">${esc(c === "Bundle" ? "Bundles" : c)}</h2><div class="sp-rel sp-big">${pages.filter(p => p.cat === c).map(x => `<a class="sp-rc sp-rv" href="/services/${slug(x.name)}/" style="--c:${x.color}">${logo(x)}<span><b>${esc(x.name)}</b><small>From ${taka(lo(x))}</small></span></a>`).join("")}</div></div></section>`).join("")}
</main>${foot}${script}</body></html>`;
}

const out = (f, t) => { const p = path.join(ROOT, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); };
pages.forEach(p => out(`services/${slug(p.name)}/index.html`, servicePage(p)));
out("services/index.html", hubPage());
const d = new Date().toISOString().slice(0, 10);
const urls = [["/", "1.0", "weekly"], ["/services/", "0.9", "weekly"], ...pages.map(p => [`/services/${slug(p.name)}/`, "0.8", "weekly"])];
out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, pr, cf]) => `<url><loc>${SITE}${u}</loc><lastmod>${d}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`).join("\n")}\n</urlset>\n`);
console.log("pages:", pages.length, "| OG list:", pages.map(p => slug(p.name)).join(","));
fs.writeFileSync(path.join(__dirname, "og-list.json"), JSON.stringify(pages.map(p => ({ slug: slug(p.name), name: p.name, from: lo(p), color: p.color, cat: p.cat, logo: LOGOS[LOGO_OF[p.name]] || null }))));
