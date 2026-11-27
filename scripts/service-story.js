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
    `<div class="hd"><i>4</i>Prepare</div><div class="pf"><div class="av">${tile}</div><div class="tx"><b>${name}</b><span>${esc(first[0])}</span>
     <div class="ln l1"><i></i></div><div class="ln l2"><i></i></div></div></div>
     <div class="pn"><span>PIN</span><i style="--k:0"></i><i style="--k:1"></i><i style="--k:2"></i><i style="--k:3"></i><em>Secure OTP login</em></div>`,
    /* 5 deliver */
    `<div class="hd"><i>5</i>Deliver</div><div class="ch"><div class="chh"><img src="/assets/img/brand/logo-128.png" alt="" width="64" height="64"><span><b>StreamX</b><small>online</small></span></div>
     <div class="ty"><u></u><u></u><u></u></div>
     <div class="bb"><b>Your ${name} is ready</b><span>Email, profile and PIN are inside</span><div class="bx"><i></i><i></i><i></i></div><em>✓✓</em></div></div>`,
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
   <div class="nfc-seg" role="group" aria-label="Plan types">${tiles.map((t, i) => `<button type="button" class="${i ? "" : "on"}" data-p="${pr(t[1])}" aria-pressed="${i ? "false" : "true"}">${esc(String(t[0]).replace(/\s+Edition$/i, ""))}</button>`).join("")}</div>
   <a class="sp-btn nfc-go" href="#plans">Choose this plan <span aria-hidden="true">→</span></a>
   <div class="sp-meta"><span>${tiles.length} plan types</span><span>Fixed BDT price</span></div></aside>`;
};
