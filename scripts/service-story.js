/* The scroll story on a service page ("From tap to <service>, step by step"). Pure markup: assets/js/service-story.js drives it, assets/css/service-story.css styles it.
   Used by scripts/build-services.js for the services listed in STORY. */
module.exports = function story({ p, qp, esc, taka, logo, ic }) {
  const name = esc(p.name), tile = logo(p);
  const steps = [
    ["Pick your plan", `Choose the plan type and how long you want ${name}. Every price is fixed in BDT.`],
    ["Pay the way you like", "bKash, Nagad, Rocket, Upay or a card on a secure payment page. Or just order on WhatsApp."],
    ["We confirm it", "Your payment is checked and your order is locked in, usually within moments."],
    ["Your profile is prepared", "A profile on the plan you picked is set up for you, with a PIN where the plan includes one."],
    ["Delivered to you", "Your login details reach you on WhatsApp or email. Many plans are delivered within minutes."],
    ["Start watching", "Sign in on your phone, tablet or web. Replacement warranty and 24/7 support if anything goes wrong."]
  ];
  const labels = ["Choose", "Pay", "Confirm", "Prepare", "Deliver", "Watch"];
  const tiles = (qp || []).slice(0, 4);
  const first = tiles[0] || [p.name, 0];
  const price = first[1] > 0 ? taka(first[1]) : "";
  const S = [
    /* 1 choose */
    `<div class="hd"><i>1</i>Choose</div><div class="pl">${tiles.map((t, i) => `<div class="tl${i ? "" : " sel"}"><span>${esc(t[0])}</span><b>${t[1] > 0 ? taka(t[1]) : ""}</b></div>`).join("")}</div>
     <div class="dr"><span class="du on">1 Month</span><span class="du">6 Months</span><span class="du">1 Year</span><b class="pp">${price}</b></div>`,
    /* 2 pay */
    `<div class="hd"><i>2</i>Pay</div><div class="am"><small>Total</small><b>${price}</b></div>
     <div class="mt"><span class="m1"><u></u>bKash</span><span class="m2"><u></u>Nagad</span><span class="m3"><u></u>Rocket</span><span class="m4"><u></u>Upay</span></div>
     <div class="pw"><span class="pay">Pay ${price}</span><span class="dn"><svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9"/></svg>Payment sent</span></div>`,
    /* 3 confirm */
    `<div class="hd"><i>3</i>Confirm</div><div class="cf"><div class="rg"><span>${ic("shield")}</span></div>
     <ul><li style="--k:0"><svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9"/></svg>Payment received</li><li style="--k:1"><svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9"/></svg>Order verified</li><li style="--k:2"><svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9"/></svg>Plan reserved</li></ul></div>`,
    /* 4 prepare */
    `<div class="hd"><i>4</i>Prepare</div><div class="pf2"><div class="av2"><i class="al a1"></i><i class="al a2"></i><i class="al a3"></i><i class="al a4"></i><span class="fc"></span><u class="pe"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/></svg></u></div>
     <div class="tx2"><small>Profile name</small><div class="nm"><span class="ty">Your name</span><i class="cr"></i></div><span class="pl">${esc(first[0])} · ${name}</span></div></div>
     <div class="cl"><small>Avatar</small><i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i></div>
     <div class="pn"><span>PIN</span><i style="--k:0"></i><i style="--k:1"></i><i style="--k:2"></i><i style="--k:3"></i><em>Ready</em></div>`,
    /* 5 deliver */
    `<div class="hd"><i>5</i>Deliver</div><div class="em"><div class="emm"><img src="/assets/img/brand/logo-128.png" alt="" width="64" height="64"><span><b>StreamX</b><small>no-reply@streamx.bd</small></span><time>Just now</time></div>
     <div class="emc"><i class="emg"></i><div class="emi"><span class="eme">Order delivered</span><b class="emh">Your ${name} is ready</b>
      <div class="emr"><div><small>Login email</small><b>name@example.com</b></div><div><small>Password</small><b>••••••••••</b></div><div><small>Plan</small><b>${esc(first[0])} · 1 month</b></div></div>
      <span class="emb">View my subscriptions</span></div></div></div>`,
    /* 6 watch */
    `<div class="hd"><i>6</i>Watch</div><div class="tv"><div class="sp1">${tile}</div><div class="ps"><i></i><i></i><i></i><i></i></div></div>
     <div class="bd"><span><svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9"/></svg>Replacement warranty</span><span><svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9"/></svg>24/7 support</span></div>`
  ];
  return `<section class="nj" id="journey" aria-labelledby="njT"><div class="nj-pin"><div class="sp-wrap nj-in">
 <div class="nj-hd"><span class="sp-eyebrow">How it works</span><h2 id="njT">From tap to ${name}, step by step</h2></div>
 <div class="nj-grid"><ol class="nj-copy">${steps.map((s, i) => `<li data-i="${i}"><b>${i + 1}</b><div><h3>${s[0]}</h3><p>${s[1]}</p></div></li>`).join("")}</ol>
 <div class="nj-stage" aria-hidden="true"><div class="nj-track">${S.map((h, i) => `<div class="ns s${i + 1}" style="--i:${i}"><div class="sc">${h}</div><i class="nd"></i><span class="lb">${labels[i]}</span></div>`).join("")}</div><i class="nj-orb"></i></div></div>
 </div></div></section>`;
};

/* The price card in the hero of a story page: a poster banner and a plan selector that updates the price. */
module.exports.card = function card({ p, qp, esc, taka, logo, ic }) {
  const tiles = (qp || []).slice(0, 4), first = tiles[0] || [p.name, 0];
  const pr = v => (v > 0 ? taka(v) : "Ask");
  return `<aside class="sp-hcard nf-card sp-rv" aria-label="${esc(p.name)} pricing summary">
   <div class="nfc-art" aria-hidden="true"><div class="nfc-posters"><i></i><i></i><i></i><i></i></div><span class="nfc-logo">${logo(p)}</span><span class="nfc-tag">${esc(p.name)}</span></div>
   <div class="nfc-price"><small>Starting from</small><div><b data-nfp>${pr(first[1])}</b><span>for 1 Month</span></div></div>
   <div class="nfc-seg" role="group" aria-label="Plan types">${tiles.map((t, i) => `<button type="button" class="${i ? "" : "on"}" data-tv="${/single\s*slot|signature/i.test(String(t[0])) ? 1 : 0}" data-p="${pr(t[1])}" aria-pressed="${i ? "false" : "true"}">${esc(String(t[0]).replace(/\s+Edition$/i, ""))}${/\s+Edition$/i.test(String(t[0])) ? '<span class="ed"> Edition</span>' : ""}</button>`).join("")}</div>
   <div class="nfc-dev" data-tv="0" aria-label="Where you can watch"><span class="dv"><i><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg></i>Phone</span><span class="dv"><i><svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18M6.6 6.8h.01M9.2 6.8h.01"/></svg></i>Web</span><span class="dv dv-tv"><i><svg viewBox="0 0 24 24"><rect x="2.5" y="7.5" width="19" height="12" rx="2.5"/><path d="m8.5 3 3.5 4.5L15.5 3M7.5 19.5v1.5M16.5 19.5v1.5"/></svg></i>TV</span></div>
   <a class="sp-btn nfc-go" href="#plans">Choose this plan <span aria-hidden="true">→</span></a></aside>`;
};


/* The pricing section of a story page: one duration switch drives every plan card; each card keeps real buy links. */
/* "All features" opens a popup that service-story.js builds from this template. */
const moreBtn = (all, notes, chk, esc) => `<button type="button" class="nfp-all" aria-haspopup="dialog">All features<i aria-hidden="true">+</i></button><template class="nfp-full"><ul class="nfp-ft">${all.map(x => `<li>${chk}${esc(x)}</li>`).join("")}</ul>${notes.length ? `<ul class="nfp-nt">${notes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</template>`;
/* device lines are already shown by the Phone / Web / TV strip, so cards skip them (the popup keeps them) */
const notDev = x => !/^(watch on )?mobile, tablet/i.test(x);
const devStrip = tv => `<div class="nfc-dev" data-tv="${tv ? 1 : 0}" aria-label="Where you can watch"><span class="dv"><i><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg></i>Phone</span><span class="dv"><i><svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18M6.6 6.8h.01M9.2 6.8h.01"/></svg></i>Web</span><span class="dv dv-tv"><i><svg viewBox="0 0 24 24"><rect x="2.5" y="7.5" width="19" height="12" rx="2.5"/><path d="m8.5 3 3.5 4.5L15.5 3M7.5 19.5v1.5M16.5 19.5v1.5"/></svg></i>TV</span></div>`;
module.exports.plans = function plans({ p, esc, taka, slug, buy }) {
  const vs = p.variants, mo = vs[0].plans.map(x => x.v), n = mo.length;
  const save = k => Math.max(0, ...vs.map(v => { const a = v.plans[0], b = v.plans[k]; return a && b && a.p > 0 && b.m > 1 ? Math.round((1 - b.p / (a.p * b.m)) * 100) : 0; }));
  const chk = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const dur = `<div class="nfp-dur" role="group" aria-label="Choose duration">${mo.map((m, k) => `<button type="button" class="${k ? "" : "on"}" data-k="${k}" aria-pressed="${k ? "false" : "true"}">${esc(m)}${save(k) ? `<em>Save up to ${save(k)}%</em>` : ""}</button>`).join("")}</div>`;
  const card = (v, vi) => {
    const top = v.f.filter(notDev).slice(0, 4);
    return `<article class="nfp-card sp-rv"><header><h3>${esc(v.n)}</h3>${v.tag ? `<span class="nfp-tag">${esc(v.tag)}</span>` : ""}</header>
     <div class="nfp-price">${v.plans.map((pl, k) => `<div class="nfp-pr" data-k="${k}"><b>${taka(pl.p)}</b><span>${pl.m > 1 ? `${taka(Math.round(pl.p / pl.m))} / month` : "for 1 month"}</span></div>`).join("")}</div>
     ${devStrip(/\bTV\b/.test(v.f.join(" ")) && !/no TV/i.test(v.f.join(" ")))}
     <ul class="nfp-ft">${top.map(x => `<li>${chk}${esc(x)}</li>`).join("")}</ul>
     ${moreBtn(v.f, v.notes, chk, esc)}
     <div class="nfp-acts">${v.plans.map((pl, k) => `<div class="nfp-act" data-k="${k}"><a class="sp-row" href="/#plan=${slug(p.name)}&v=${vi}&k=${k}"${buy(p.name, vs.length > 1 ? v.n : "", pl.v, v.n, pl.p)}><span>Buy now</span><i aria-hidden="true">→</i></a></div>`).join("")}</div></article>`;
  };
  return `<div class="sp-wrap"><span class="sp-eyebrow sp-rv">Pricing</span><h2 class="sp-rv">${esc(p.name)} plans and prices</h2><p class="sp-sub sp-rv">Every price is fixed in BDT. Pick how long you want it and every plan updates. Longer plans cost less per month.</p>
   ${dur}<div class="nfp-grid" data-d="0">${vs.map(card).join("")}</div></div>`;
};


/* The combo packs section of a story page, in the same glass-card style as the plans. */
module.exports.combo = function combo({ p, combo, others, cs, esc, taka, buy, slug }) {
  const chk = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const names = [p.name].concat(others);
  const logos = `<span class="nfc2-logos" aria-hidden="true">${names.map(n => `<img src="/assets/img/logos/${slug(n)}.svg" alt="" width="40" height="40" loading="lazy">`).join("")}</span>`;
  const card = (k, i) => {
    const top = k.f.filter(notDev).slice(0, 4);
    return `<article class="nfp-card nfc2-card sp-rv"><header><h3>${esc(k.n)}</h3><span class="nfp-tag">${esc(k.tag)}</span></header>
     <div class="nfp-price"><div class="nfp-pr"><b>${taka(k.p)}</b><span>per month, both apps</span></div>${k.old ? `<div class="nfc2-save"><s>${taka(k.old)}</s><u>Save ${taka(k.old - k.p)}</u></div>` : ""}</div>
     ${devStrip(!/no TV/i.test([k.sub, k.tag].concat(k.f).join(" ")) && /\bTV\b/.test([k.sub, k.tag].concat(k.f).join(" ")))}
     <ul class="nfp-ft">${top.map(x => `<li>${chk}${esc(x)}</li>`).join("")}</ul>
     ${moreBtn(k.f, [], chk, esc)}
     <div class="nfp-acts"><div class="nfp-act"><a class="sp-row" href="/#plan=${cs}&v=0&k=${i}"${buy(combo.name, "", k.n, combo.variants[0].n, k.p)}><span>Buy now</span><i aria-hidden="true">→</i></a></div></div></article>`;
  };
  return `<section class="sp-sec nfp nfc2" id="combo"><div class="sp-wrap"><div class="nfc2-head"><div>${logos}<span class="sp-eyebrow sp-rv">Save more, together</span><h2 class="sp-rv">${esc(names.join(" + "))} combo packs</h2><p class="sp-sub sp-rv">${esc(names.join(" and "))} in one monthly price, and you save compared with buying each separately.</p></div><a class="nfc2-link sp-rv" href="/services/${cs}/">About the combo <span aria-hidden="true">→</span></a></div>
   <div class="nfp-grid nfc2-grid">${combo.packs.map(card).join("")}</div></div></section>`;
};

/* "Why buy from StreamX": four glass cards, each with a small picture of what it promises. */
module.exports.why = function why({ p, esc, ic, taka }) {
  const prices = Array.from(new Set(p.variants.map(v => v.plans[0] && v.plans[0].p).filter(Boolean))).sort((a, b) => a - b);
  const i = k => `<i class="nfw-i">${ic(k)}</i>`;
  return `<div class="sp-wrap"><span class="sp-eyebrow sp-rv">Why StreamX</span><h2 class="sp-rv">Why buy ${esc(p.name)} from StreamX</h2>
  <div class="nfw-grid">
   <article class="nfw-c nfw-a sp-rv">${i("card")}<h3>Fixed prices in BDT</h3><p>The price you see is the price you pay, with no hidden charges and no foreign card needed.</p>
    <div class="nfw-chips" aria-hidden="true">${prices.map(x => `<span>${taka(x)}</span>`).join("")}<em>No hidden charges</em></div></article>
   <article class="nfw-c nfw-b sp-rv">${i("bolt")}<h3>Fast delivery</h3><p>Many plans are delivered within minutes after payment is confirmed.</p>
    <ol class="nfw-flow" aria-hidden="true"><li>Pay</li><li>Confirmed</li><li class="on">Delivered</li></ol></article>
   <article class="nfw-c nfw-c3 sp-rv">${i("shield")}<h3>Replacement warranty</h3><p>If an eligible subscription has a problem during its stated period, we sort it out.</p>
    <div class="nfw-seal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m8.8 12.2 2.4 2.4 4.2-4.6"/></svg><span>Covered for the stated period</span></div></article>
   <article class="nfw-c nfw-d sp-rv">${i("chat")}<h3>Real people on WhatsApp</h3><p>Questions about a plan, payment or delivery? We reply directly, any time.</p>
    <div class="nfw-chat" aria-hidden="true"><span class="me">Hi StreamX! I have a question about ${esc(p.name)}.</span><span class="them">Hi! Happy to help \u{1F44B}</span></div></article>
  </div></div>`;
};

/* "You may also like": glass cards with a brand-coloured glow. */
module.exports.related = function related({ related, esc, taka, lo, logo, slug, GLOW }) {
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  return `<div class="sp-wrap"><span class="sp-eyebrow sp-rv">Keep exploring</span><h2 class="sp-rv">You may also like</h2>
  <div class="nfr-grid">${related.map(x => `<a class="nfr-c sp-rv" href="/services/${slug(x.name)}/" style="--c:${GLOW[x.name] || x.color}"><span class="nfr-top">${logo(x)}<i class="nfr-go">${arrow}</i></span><b>${esc(x.name)}</b><small>${esc(x.cat || "")}</small><span class="nfr-pr">From <em>${taka(lo(x))}</em></span></a>`).join("")}</div></div>`;
};

/* The closing call to action. Keeps the sp-end class: the sticky buy bar hides when it is on screen. */
module.exports.end = function end({ p, esc, taka, from, plan, chat }) {
  return `<div class="sp-end nfe sp-rv"><div class="nfe-t"><span class="sp-eyebrow">Ready when you are</span><h2>Ready to get ${esc(p.name)}?</h2><p>Pick your plan, pay online in seconds or order on WhatsApp.</p>
   <div class="nfe-cta"><a class="nfe-go" href="${plan}"><span>Choose your plan</span><i aria-hidden="true">\u2192</i></a><a class="nfe-wa" href="${chat}" rel="noopener">Chat on WhatsApp</a></div></div>
   <div class="nfe-v" aria-hidden="true"><span class="nfe-from">Plans from</span><b>${taka(from)}</b><ul><li>Fixed prices in BDT</li><li>Fast delivery</li><li>Replacement warranty</li></ul></div></div>`;
};
