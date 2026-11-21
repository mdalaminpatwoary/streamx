/* Customer account page: sign-in by emailed link, then show subscriptions with expiry and renew. */
(function () {
  "use strict";
  var KEY = "sx_session", WA = "8801312850241";
  var PROD = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var slug = function (n) { return n.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var get = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var set = function (v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} };
  var api = function (a, opt) { return fetch("/api/account?a=" + a, opt).then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || "Error"); e.status = r.status; throw e; } return j; }); }); };
  var fmt = function (iso) { var d = new Date(iso + "T00:00:00Z"); return d.getUTCDate() + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()] + " " + d.getUTCFullYear(); };
  var days = function (a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); };

  function showLogin(msg) { document.documentElement.classList.remove("hs"); try { sessionStorage.removeItem("sx_acc_pre"); } catch (e) {} $("#app").hidden = true; $("#login").hidden = false; $("#cf").hidden = true; $("#lf").hidden = false; $("#sub").textContent = "See what is active, when it ends, and renew in one tap."; if (msg) { var m = $("#lm"); m.textContent = msg; m.className = "ac-msg"; } }

  function renewLink(s) {
    var p = PROD.filter(function (x) { return x.name === s.service; })[0];
    if (!p) return "/#pricing";
    var vi = 0, pj = 0, label = s.plan.indexOf(" · ") > -1 ? s.plan.split(" · ")[0] : "";
    if (label) p.variants.forEach(function (v, i) { if (v.n === label) vi = i; });
    p.variants[vi].plans.forEach(function (pl, j) { if (pl.m === s.months) pj = j; });
    return "/#plan=" + slug(p.name) + "&v=" + vi + "&k=" + pj;
  }
  /* Same product, variant and plan as the subscription, so the server can price it. Returns null if the plan was removed. */
  function planOf(s) {
    var p = PROD.filter(function (x) { return x.name === s.service; })[0]; if (!p) return null;
    var label = s.plan.indexOf(" · ") > -1 ? s.plan.split(" · ")[0] : "", vr = label ? p.variants.filter(function (v) { return v.n === label; })[0] : p.variants[0];
    var pl = vr && vr.plans.filter(function (x) { return x.m === s.months; })[0];
    return pl ? { name: p.name, vr: label || undefined, v: pl.v, price: pl.p } : null;
  }
  var NM = { google: "Google", microsoft: "Microsoft", apple: "Apple" };
  var DATA = null, taka = function (n) { return "৳" + n.toLocaleString("en-US"); };
  var LG = typeof LOGOS !== "undefined" ? LOGOS : {}, LO = typeof LOGO_OF !== "undefined" ? LOGO_OF : {};
  function tile(s) {
    var p = PROD.filter(function (x) { return x.name === s.service; })[0], L = LG[LO[s.service]];
    if (L && L.p) return '<span class="ac-tile ac-logo" style="--c:' + esc(L.bg) + ';--f:' + esc(L.fg || "#fff") + '" aria-hidden="true"><svg viewBox="' + esc(L.vb) + '"><path d="' + L.p + '"/></svg></span>';
    return '<span class="ac-tile" style="--c:' + esc((p && p.color) || "#444") + '" aria-hidden="true">' + esc(((p && p.icon) || s.service[0] || "?").toString().slice(0, 2)) + "</span>";
  }
  var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYEOFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  var COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  var GIFTI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 1 1 0 5"/></svg>';
  var isGift = function (s) { return /gift card$/i.test(s.service || ""); };
  var phoneFlag = function (p) { p = String(p || "").replace(/\s/g, ""); return /^\+?880/.test(p) ? flagImg("bd") : /^\+?91/.test(p) ? flagImg("in") : ""; };
  var ic = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
  var PLAT = {
    web: ["Web", ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>')],
    ios: ["iOS", ic('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>')],
    android: ["Android", ic('<path d="M5.5 14a6.5 6.5 0 0 1 13 0z"/><path d="m8 5.5 1.6 2.3M16 5.5l-1.6 2.3"/><circle cx="9.6" cy="11.2" r=".55"/><circle cx="14.4" cy="11.2" r=".55"/><path d="M6.5 16.5H17.5V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19z"/>')],
    tablet: ["Tablet", ic('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M11 16.5h2"/>')],
    tv: ["TV", ic('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>')]
  };
  function supportMsg(s, lg, issue) {
    var phone = lg.mode === "phone_otp" || lg.mode === "phone_pass" || lg.mode === "number", who = phone ? lg.phone : (lg.email || lg.phone);
    var t = [issue ? "Hi StreamX! I need help with " + s.service + " (" + s.plan + ")." : "Hi StreamX! I need my " + (lg.otp ? "login code" : isGift(s) ? "redeem code" : "login details") + " for " + s.service + ".", ""];
    if (issue) t.push("Issue: " + issue);
    if (who) t.push(s.service + (phone || (!lg.email && lg.phone) ? " number: " : " mail: ") + who);
    if (lg.profile) t.push("Profile: " + lg.profile);
    if (isGift(s) && lg.gift && lg.gift.amount) t.push("Gift card: " + lg.gift.amount + (lg.gift.region ? " (" + lg.gift.region + ")" : ""));
    if (DATA && DATA.email) t.push("My StreamX email: " + DATA.email);
    if (issue) t.push("Subscription ID: #" + s.id);
    return t.join("\n");
  }
  function lrow(k, v, extra, cls) { return '<div class="ac-lr"><span class="ac-lk">' + k + '</span><span class="ac-lv' + (cls ? " " + cls : "") + '">' + v + "</span>" + (extra || "") + "</div>"; }
  function cp(key, s) { return '<button class="ac-ib ac-cp" type="button" data-copy="' + key + '" data-sid="' + s.id + '" aria-label="Copy"><span class="ic a">' + COPY + '</span><span class="ic b">' + CHECK + "</span></button>"; }
  function secret(k, s, mask, label) { return lrow(label || ({ pass: "Password", pin: "PIN", gift: "Redeem code" })[k], '<span data-sv="' + s.id + ":" + k + '" data-mask="' + mask + '">' + mask + "</span>", '<span class="ac-ibs"><button class="ac-ib ac-eye" type="button" data-eye="' + s.id + '" data-k="' + k + '" aria-label="Show"><span class="ic a">' + EYE + '</span><span class="ic b">' + EYEOFF + "</span></button>" + cp(k === "pass" ? "p" : k === "pin" ? "n" : "g", s) + "</span>"); }
  function waLink(s, lg, issue) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(supportMsg(s, lg, issue)); }

  function devBlock(lg) {
    var d = lg.devices || {}, it = d.items || [];
    if (!it.length && !d.limit) return "";
    var h = '<div class="ac-dh"><span>Signed-in devices</span></div>';
    if (it.length) h += '<ul class="ac-dlist">' + it.map(function (x, i) { var p = PLAT[x.type] || PLAT.web; return '<li style="--i:' + i + '"><span class="ac-dic">' + p[1] + '</span><span class="ac-dn">' + esc(x.name || p[0]) + '</span><span class="ac-dt">' + p[0] + "</span></li>"; }).join("") + "</ul>";
    else h += '<p class="ac-dnote">Up to ' + d.limit + (d.limit === 1 ? " device" : " devices") + " can be signed in at once.</p>";
    return h;
  }

  function giftBox(s) {
    var gs = s.gifts || [s], sup = '<a href="' + waLink(s, gs[0].login || {}) + '" target="_blank" rel="noopener">talk to support</a>';
    var h = '<div class="ac-lbx ac-gift"><div class="ac-lbh">' + GIFTI + (gs.length > 1 ? gs.length + " gift cards" : "Gift card") + "</div>";
    gs.forEach(function (g, i) {
      var gg = (g.login && g.login.gift) || {}, head = (gg.amount ? "<b>" + esc(gg.amount) + "</b>" : "<b>Gift card</b>") + (gg.region ? " " + flagImg(gg.region) + " " + esc(countryName(gg.region)) : "");
      h += '<div class="ac-gc"><div class="ac-gch">' + (gs.length > 1 ? '<span class="ac-gn">' + (i + 1) + "</span>" : "") + head + "</div>" +
        (gg.code ? secret("gift", g, "••••-••••-••••") : '<p class="ac-lbn">Your redeem code will appear here once it is ready. Need it now? Please ' + sup + ".</p>") + "</div>";
    });
    h += lrow("Valid until", fmt(s.end_date) + " <em>(6 months from purchase)</em>");
    return h + '<p class="ac-lbn ac-hint">Redeem in the App Store or at apple.com/redeem. Each code works once.</p></div>';
  }

  function loginBox(s) {
    if (isGift(s)) return giftBox(s);
    var lg = s.login || {}, vp = lg.vpn || {}, sup = '<a href="' + waLink(s, lg) + '" target="_blank" rel="noopener">talk to support</a>', h, any = false, mode = lg.mode || "none";
    h = '<div class="ac-lbx"><div class="ac-lbh">' + LOCK + "Account login</div>";
    var ph = lg.phone ? phoneFlag(lg.phone) + " " + esc(lg.phone) : "<em>Not added yet</em>", em = lg.email ? esc(lg.email) : "<em>Not added yet</em>";
    var otp = '<span class="ac-ot">OTP based. Please ' + sup + " for your login code.</span>";
    if (mode === "email_pass" || mode === "email_otp") { any = true; h += lrow("Email", em, lg.email ? cp("e", s) : ""); h += mode === "email_pass" ? (lg.password ? secret("pass", s, "••••••••••") : lrow("Password", "<em>Not added yet</em>")) : lrow("Login", otp); }
    else if (mode === "phone_otp" || mode === "phone_pass" || mode === "number") { any = true; h += lrow("Number", ph, lg.phone ? cp("t", s) : ""); h += mode === "phone_otp" ? lrow("Login", otp) : mode === "phone_pass" ? (lg.password ? secret("pass", s, "••••••••••") : lrow("Password", "<em>Not added yet</em>")) : '<p class="ac-lbn ac-hint">Activated on this number. No password needed.</p>'; }
    else if (mode === "own") { any = true; var onNum = !lg.email && lg.phone, v = lg.email || lg.phone || (DATA && DATA.email) || ""; h += lrow("Activated on", (onNum ? phoneFlag(lg.phone) + " " : "") + esc(v), cp("e0", s)); h += '<p class="ac-lbn ac-hint">Activated on your own ' + (onNum ? "number" : "mail") + ". No password needed.</p>"; }
    if (lg.profile) { any = true; h += lrow("Profile", esc(lg.profile), cp("f", s)); }
    if (lg.pin) { any = true; h += secret("pin", s, "••••"); }
    if (lg.family) { any = true; h += lrow("Family mail", esc(lg.family), cp("m", s)) + '<p class="ac-lbn ac-hint">Your plan is activated from this mail.</p>'; }
    if (vp.required) { any = true; h += lrow("VPN", '<span class="ac-vpn"><b>Required</b>' + (vp.country ? flagImg(vp.country) + " " + esc(countryName(vp.country)) : "") + "</span>") + '<p class="ac-lbn ac-hint">Connect to a server in ' + (vp.country ? esc(countryName(vp.country)) : "the required country") + " before you sign in.</p>"; }
    var dv = devBlock(lg); if (dv) { any = true; h += '<div class="ac-dsep"></div>' + dv; }
    if (!any) return h + '<p class="ac-lbn">Your login details will appear here once your account is ready. Need them now? Please ' + sup + ".</p></div>";
    return h + "</div>";
  }

  /* "Need help?" panel: every topic opens WhatsApp with the subscription details already filled in. */
  var HELPI = ic('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01"/>');
  var WAI = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97s-.47-.15-.67.15-.77.97-.94 1.16-.35.22-.64.08c-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06s-.02-.46.13-.6c.13-.13.3-.35.45-.52s.2-.3.3-.5.05-.37-.02-.52c-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41s.25-1.29.17-1.41c-.07-.13-.27-.2-.57-.35M12.05 21.8a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.9M20.5 3.49A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45c6.55 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.48-8.41"/></svg>';
  var MSI = ic('<path d="M12 3C6.9 3 3 6.8 3 11.5c0 2.6 1.2 4.8 3.1 6.3V21l3-1.7c.9.2 1.8.4 2.9.4 5.1 0 9-3.8 9-8.5S17.1 3 12 3z"/><path d="m7.5 13.5 3.2-3.3 2.2 2 3.6-2.7"/>');
  var IGI = ic('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>');
  var MLI = ic('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6.5L20.5 7"/>');
  function helpBox(s) {
    var lg = s.login || {}, topics, stream = PROD.some(function (p) { return p.name === s.service && p.cat === "Streaming"; });
    if (isGift(s)) topics = ["My redeem code is not working", "I have not received my code", "The code says it was already used"];
    else {
      topics = ["I cannot sign in"];
      topics.push(lg.otp ? "I need my login code" : "My password is not working");
      if ((lg.devices && (lg.devices.limit || (lg.devices.items || []).length)) || stream) topics.push("Device limit reached");
      if (stream) topics.push("Video quality or buffering problem");
      if (lg.vpn && lg.vpn.required) topics.push("VPN is not working");
      if (s._left <= 7) topics.push("My plan is about to expire. How do I renew?");
      topics.push("I want to change my login email");
    }
    var sub = encodeURIComponent("Help with " + s.service + " (#" + s.id + ")"), mark = "__ISSUE__", url = waLink(s, lg, mark).replace(encodeURIComponent(mark), "");
    return '<details class="ac-help"><summary>' + HELPI + "<span>Need help with this subscription?</span></summary>" +
      '<div class="ac-hb" data-u="' + esc(url) + '" data-sub="' + sub + '"><p>Tap a common question or type your own. We open WhatsApp with your subscription details already attached.</p>' +
      '<div class="ac-topics">' + topics.map(function (t) { return '<button type="button" class="ac-topic" data-t="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + "</div>" +
      '<div class="ac-ta-w"><textarea class="ac-ta" rows="3" maxlength="500" placeholder="Describe your issue, in English or Bangla" aria-label="Describe your issue"></textarea><small class="ac-ccn">0 / 500</small></div>' +
      '<button type="button" class="ac-send">' + WAI + "<span>Send on WhatsApp</span></button>" +
      '<div class="ac-alt"><span>Or reach us on</span><a href="https://m.me/streamx.com.bd" target="_blank" rel="noopener">' + MSI + 'Messenger</a><a href="https://instagram.com/streamx.com.bd" target="_blank" rel="noopener">' + IGI + 'Instagram</a><a data-mail href="mailto:streamx.com.bd@gmail.com?subject=' + sub + '">' + MLI + "Email</a></div></div></details>";
  }
  document.addEventListener("click", function (e) {
    var box = e.target.closest && e.target.closest(".ac-hb[data-u]"); if (!box) return;
    var ta = box.querySelector(".ac-ta"), cc = box.querySelector(".ac-ccn"), t;
    if ((t = e.target.closest(".ac-topic"))) { ta.value = t.dataset.t + ". "; cc.textContent = ta.value.length + " / 500"; box.querySelectorAll(".ac-topic").forEach(function (x) { x.classList.toggle("on", x === t); }); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); return; }
    if (e.target.closest(".ac-send")) { var v = ta.value.trim(); if (!v) { ta.classList.remove("shake"); void ta.offsetWidth; ta.classList.add("shake"); ta.focus(); return; } window.open(box.dataset.u + encodeURIComponent(v), "_blank", "noopener"); return; }
    var m = e.target.closest("a[data-mail]"); if (m && ta.value.trim()) m.href = "mailto:streamx.com.bd@gmail.com?subject=" + box.dataset.sub + "&body=" + encodeURIComponent(ta.value.trim());
  });
  document.addEventListener("input", function (e) { var ta = e.target; if (ta.classList && ta.classList.contains("ac-ta")) ta.parentNode.querySelector(".ac-ccn").textContent = ta.value.length + " / 500"; });

  /* Gift cards bought together (same order) are shown as one card with several codes. */
  function groupRows(list) {
    var out = [], idx = {};
    list.forEach(function (s) {
      if (!isGift(s)) { s.members = [s]; out.push(s); return; }
      var k = s.service + "|" + (s.order_ref || "id" + s.id) + "|" + (s._left >= 0);
      if (idx[k] === undefined) { idx[k] = out.length; var g = Object.assign({}, s); g.gifts = [s]; g.members = [s]; out.push(g); }
      else { var g2 = out[idx[k]]; g2.gifts.push(s); g2.members.push(s); }
    });
    out.forEach(function (g) {
      if (!g.gifts || g.gifts.length < 2) return;
      var am = g.gifts.map(function (x) { return (x.login && x.login.gift && x.login.gift.amount) || x.plan; }), nums = am.map(function (a) { return parseFloat(String(a).replace(/[^\d.]/g, "")); });
      g.plan = g.gifts.length + " cards · " + (am.length <= 4 ? am.join(" + ") : (nums.every(function (n) { return n > 0; }) ? "$" + nums.reduce(function (a, b) { return a + b; }, 0) + " total" : ""));
    });
    return out;
  }
  var BELL = ic('<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 0 0 4 0"/>');
  var LINEI = {
    key: ic('<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.2-8.2M16 7l3 3M14 9l2 2"/>'),
    shield: ic('<path d="M12 3 5 6v6c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>'),
    devices: ic('<rect x="3" y="5" width="14" height="10" rx="2"/><path d="M8 19h4M10 15v4"/><rect x="18" y="9" width="3" height="8" rx="1"/>'),
    swap: ic('<path d="M7 7h12l-3-3M17 17H5l3 3"/>'),
    mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    phone: ic('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
    gift: ic('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 1 1 0 5"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    spark: ic('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>')
  };
  function lineIcon(l) { return /login type/i.test(l) ? LINEI.swap : /password|PIN/i.test(l) ? LINEI.key : /VPN/i.test(l) ? LINEI.shield : /device/i.test(l) ? LINEI.devices : /email|mail/i.test(l) ? LINEI.mail : /number/i.test(l) ? LINEI.phone : /code/i.test(l) ? LINEI.gift : /profile/i.test(l) ? LINEI.user : LINEI.spark; }
  function noticeOf(g) {
    var lines = [], at = "";
    g.members.forEach(function (m) { var n = m.login && m.login.notice; if (!n) return; if (n.at > at) at = n.at; n.lines.forEach(function (l) { if (lines.indexOf(l) < 0) lines.push(l); }); });
    return lines.length ? { lines: lines, at: at } : null;
  }
  function when(iso) { var d = new Date(Date.parse(iso) + 6 * 3600000); return fmt(d.toISOString().slice(0, 10)) + ", " + d.toISOString().slice(11, 16); }

  /* ---- Update pop-up: shown before anything else when the owner changed account details ---- */
  var PENDING = [], ANN = [], paintLater = null, modal = null, lastFocus = null;
  var SEEN_KEY = "sx_ann_seen";
  function seenIds() { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch (e) { return []; } }
  function unread() { var s = seenIds(); return ANN.filter(function (n) { return s.indexOf(n.id) < 0; }); }
  var KT = { info: ["gen", "Update", "spark"], offer: ["gift", "Offer", "gift"], maintenance: ["net", "Maintenance", "devices"], important: ["sec", "Important", "shield"] };
  function setBell() { var n = PENDING.length + unread().length, b = $("#bn"); if (b) { b.hidden = !n; b.textContent = n; } var bl = $("#bell"); if (bl) bl.classList.toggle("has", !!n); }
  var TAGS = { sec: "Security", net: "Network", dev: "Devices", acc: "Access", gift: "Gift card", gen: "Update" };
  function tagOf(l) { return /^login type/i.test(l) || (/email|number|mail|family|profile name/i.test(l) && !/password|PIN/i.test(l)) ? "acc" : /password|PIN/i.test(l) ? "sec" : /VPN/i.test(l) ? "net" : /device/i.test(l) ? "dev" : /code/i.test(l) ? "gift" : /profile/i.test(l) ? "acc" : "gen"; }
  function openNotice() {
    if (!PENDING.length && !ANN.length) return;
    if (!modal) {
      modal = document.createElement("div"); modal.className = "ac-ov"; document.body.appendChild(modal);
      modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest("[data-nclose]")) closeNotice(); });
      /* swipe down on a phone to dismiss */
      var y0 = null, dy = 0;
      modal.addEventListener("touchstart", function (e) { if (e.target.closest(".ac-grab,.ac-shh")) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
      modal.addEventListener("touchmove", function (e) { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); var s = modal.querySelector(".ac-sh"); s.style.transition = "none"; s.style.transform = "translateY(" + dy + "px)"; }, { passive: true });
      modal.addEventListener("touchend", function () { if (y0 == null) return; var s = modal.querySelector(".ac-sh"); s.style.transition = ""; s.style.transform = ""; if (dy > 90) closeNotice(); y0 = null; });
    }
    var total = PENDING.reduce(function (n, p) { return n + p.lines.length; }, 0), at = PENDING.reduce(function (a, p) { return p.at > a ? p.at : a; }, "");
    var k = 0, fresh = unread(), sn = seenIds();
    modal.innerHTML = '<aside class="ac-sh" role="dialog" aria-modal="true" aria-labelledby="acnt"><div class="ac-grab"><i></i></div>' +
      '<header class="ac-shh"><span class="ac-shi">' + BELL + '<b></b></span><div><h3 id="acnt">' + (PENDING.length ? "What changed in your account" : "Notice board") + "</h3><p>" + (PENDING.length ? total + (total === 1 ? " update" : " updates") + " from StreamX · " + when(at) : fresh.length ? fresh.length + " new from StreamX" : "Latest from StreamX") + '</p></div><button class="ac-mx" type="button" data-nclose aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>' +
      '<div class="ac-shb">' + PENDING.map(function (p) {
        return '<section class="ac-tl"><div class="ac-tlh">' + p.tile + '<div><b>' + esc(p.name) + "</b><small>" + p.lines.length + (p.lines.length === 1 ? " change" : " changes") + "</small></div></div><ol>" +
          p.lines.map(function (l) {
            var t = tagOf(l), m = l.split(": "), n = k++;
            return '<li style="--i:' + n + '"><span class="ac-nd t-' + t + '">' + lineIcon(l) + '</span><div class="ac-cc"><span class="ac-tag t-' + t + '">' + TAGS[t] + "</span><b>" + esc(m.length > 1 ? m[0] : l) + "</b>" + (m.length > 1 ? '<span class="ac-val">' + esc(m.slice(1).join(": ")) + "</span>" : "") + "</div></li>";
          }).join("") + "</ol></section>";
      }).join("") + (ANN.length ? '<section class="ac-tl ac-ann"><div class="ac-tlh"><span class="ac-annh">' + BELL + '</span><div><b>Announcements</b><small>' + ANN.length + (ANN.length === 1 ? " notice" : " notices") + "</small></div></div><ol>" +
        ANN.map(function (n) {
          var kt = KT[n.kind] || KT.info, isNew = sn.indexOf(n.id) < 0, n2 = k++;
          return '<li style="--i:' + n2 + '"><span class="ac-nd t-' + kt[0] + '">' + LINEI[kt[2]] + '</span><div class="ac-cc"><span class="ac-tag t-' + kt[0] + '">' + kt[1] + "</span>" + (isNew ? '<span class="ac-new">New</span>' : "") + "<b>" + esc(n.title) + "</b>" + (n.message ? '<span class="ac-val ac-msgt">' + esc(n.message) + "</span>" : "") + "<small>" + esc(when(n.at)) + "</small></div></li>";
        }).join("") + "</ol></section>" : "") + "</div>" +
      '<footer class="ac-shf"><p>' + (PENDING.length ? "Your details are already updated below. Nothing else to do." : "You are all caught up after this.") + '</p><button class="ac-go" type="button" data-nclose><span>Got it</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg></button></footer></aside>';
    lastFocus = document.activeElement; document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { modal.classList.add("on"); var b = modal.querySelector(".ac-go"); if (b) b.focus({ preventScroll: true }); });
  }
  function closeNotice() {
    if (!modal || !modal.classList.contains("on")) return;
    var ids = []; PENDING.forEach(function (p) { p.ids.forEach(function (i) { ids.push(i); var s = subById(i); if (s && s.login) s.login.notice = null; }); });
    var t = get(); if (t && ids.length) api("seen", { method: "POST", headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify({ ids: ids }) }).catch(function () {});
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(ANN.map(function (n) { return n.id; }).slice(-60))); } catch (e) {}
    PENDING = []; setBell(); modal.classList.remove("on"); modal.classList.add("off"); document.documentElement.style.overflow = "";
    setTimeout(function () { if (modal) modal.classList.remove("off"); }, 400);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    if (paintLater) { var f = paintLater; paintLater = null; setTimeout(f, 120); }
  }
  function flash(msg) { var t = document.createElement("div"); t.className = "ac-toast"; t.innerHTML = BELL + "<span>" + esc(msg) + "</span>"; document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add("on"); }); setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 400); }, 2200); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNotice(); });
  document.addEventListener("click", function (e) { if (e.target.closest("#bell")) { if (PENDING.length || ANN.length) openNotice(); else flash("You are all caught up. No new updates."); } });

  /* /account/#renew=<id> (from the chat assistant) opens that subscription's renew popup */
  function render(d) { renderCore(d); setTimeout(function () { var m = /renew=(\d+)/.exec(location.hash), b = m && document.querySelector('[data-renew="' + m[1] + '"]'); if (b) { try { history.replaceState(null, "", location.pathname); } catch (e) {} b.click(); } }, 0); }
  function renderCore(d) {
    $("#login").hidden = true; $("#app").hidden = false; $("#who").textContent = d.email; var fw = $("#fwho"); if (fw) fw.textContent = d.email;
    var pf = d.profile || {}, nm = pf.name || "", av = $("#av"); av.innerHTML = "";
    if (pf.picture) { var im = new Image(); im.alt = ""; im.referrerPolicy = "no-referrer"; im.onerror = function () { av.textContent = (nm || d.email)[0].toUpperCase(); }; im.src = pf.picture; av.appendChild(im); } else av.textContent = (nm || d.email)[0].toUpperCase();
    $("#hi").textContent = nm ? "Welcome back, " + nm : "Welcome back";
    var pvEl = $("#pv"); pvEl.hidden = !pf.provider; if (pf.provider) pvEl.textContent = "Signed in with " + (NM[pf.provider] || pf.provider);
    DATA = d; var today = d.today, rows = d.subscriptions.map(function (s) { s._left = days(today, s.end_date); return s; });
    var live = groupRows(rows.filter(function (s) { return s._left >= 0; }).sort(function (a, b) { return a._left - b._left; }));
    var gone = groupRows(rows.filter(function (s) { return s._left < 0; }).sort(function (a, b) { return b._left - a._left; }));
    $("#sub").textContent = live.length ? live.length + " active " + (live.length === 1 ? "subscription" : "subscriptions") + ". Expiry dates are in Bangladesh time." : "You have no active subscription right now.";
    PENDING = []; paintLater = null; ANN = Array.isArray(d.notices) ? d.notices : [];
    var idx = 0, html;
    if (!rows.length) html = '<div class="ac-card ac-empty">No subscriptions found for this email yet.<br><a class="ac-btn ac-sm" style="margin-top:14px" href="/#pricing">Browse plans</a></div>';
    else html = live.concat(gone).map(function (s) {
      var st = s._left < 0 ? ["Expired", "#ef4444"] : s._left <= 7 ? ["Expires soon", "#f59e0b"] : ["Active", "#22c55e"];
      var total = Math.max(1, days(s.start_date, s.end_date)), left = Math.min(100, Math.max(0, Math.round(s._left / total * 100)));
      var L = s._left, big = L < 0 ? "Expired" : L === 0 ? "Today" : String(L), small = L < 0 ? (-L) + (L === -1 ? " day ago" : " days ago") : L === 0 ? "last day" : (L === 1 ? "day left" : "days left");
      var msg = "Hi StreamX! I want to renew my " + s.service + " (" + s.plan + "), " + (s._left < 0 ? "expired on " : "expires on ") + fmt(s.end_date) + ". My email: " + d.email;
      var nt = s._left >= 0 ? noticeOf(s) : null;
      if (nt) PENDING.push({ name: s.service, tile: tile(s), lines: nt.lines, at: nt.at, ids: s.members.map(function (m) { return m.id; }) });
      return '<article class="ac-sub-card" style="--st:' + st[1] + ';--i:' + (idx++) + '">' + tile(s) +
        '<div><div class="ac-name">' + esc(s.service) + '<span class="ac-chip">' + st[0] + '</span></div><div class="ac-plan">' + esc(s.plan) + '</div>' +
        '<div class="ac-dates"><span>Started<b>' + fmt(s.start_date) + '</b></span><span>Expires<b>' + fmt(s.end_date) + '</b></span></div><div class="ac-track" title="' + left + '% of this plan is left"><i data-p="' + left + '"></i></div></div>' +
        '<div class="ac-act"><div class="ac-left"><b data-n="' + (L >= 0 ? L : "") + '">' + esc(big) + '</b>' + esc(small) + '</div>' +
        (isGift(s) ? '<a class="ac-btn ac-sm" href="/#pricing">Buy another</a>' : (planOf(s) ? '<button class="ac-btn ac-sm" type="button" data-renew="' + s.id + '">Renew · ' + taka(planOf(s).price) + '</button>' : '<a class="ac-btn ac-sm" href="' + renewLink(s) + '">Renew</a>') + '<a class="ac-btn ac-ghost ac-sm" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(msg) + '">Renew on WhatsApp</a>') + '</div>' +
        (s._left >= 0 ? loginBox(s) + helpBox(s) : "") + '</article>';
    }).join("");
    var paint = function () { renderOrders(d.orders || []); $("#list").innerHTML = html; animateIn(); };
    setBell();
    if (PENDING.length) { $("#list").innerHTML = ""; $("#hist").hidden = true; paintLater = paint; openNotice(); } else paint();
  }

  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function animateIn() {
    var bars = document.querySelectorAll(".ac-track i"), nums = document.querySelectorAll(".ac-left b[data-n]");
    requestAnimationFrame(function () { requestAnimationFrame(function () { bars.forEach(function (i) { i.style.width = i.dataset.p + "%"; }); }); });
    if (calm) return;
    nums.forEach(function (b) {
      var to = parseInt(b.dataset.n, 10); if (!(to > 0)) return;
      var t0 = performance.now(), dur = 900 + Math.min(600, to);
      (function step(t) { var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); b.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); })(t0);
    });
  }
  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
    return new Promise(function (ok, no) { try { var t = document.createElement("textarea"); t.value = txt; t.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(t); t.select(); document.execCommand("copy") ? ok() : no(); t.remove(); } catch (e) { no(e); } });
  }
  function subById(id) { return DATA && DATA.subscriptions.filter(function (x) { return String(x.id) === String(id); })[0]; }
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-copy]"), v = e.target.closest("[data-eye]");
    if (c) {
      var s = subById(c.dataset.sid), lg = s && s.login; if (!lg) return;
      var map = { p: lg.password, f: lg.profile, n: lg.pin, e: lg.email, e0: lg.email || lg.phone || (DATA && DATA.email), t: lg.phone, m: lg.family, g: lg.gift && lg.gift.code };
      var tip = function (msg, bad) { var t = document.createElement("i"); t.className = "ac-tip" + (bad ? " bad" : ""); t.innerHTML = (bad ? "" : CHECK) + "<span>" + msg + "</span>"; c.appendChild(t); setTimeout(function () { t.remove(); }, 1700); };
      copyText(map[c.dataset.copy] || "").then(function () {
        c.classList.remove("ok"); void c.offsetWidth; c.classList.add("ok"); c.setAttribute("aria-label", "Copied"); tip("Copied to clipboard"); clearTimeout(c._t);
        c._t = setTimeout(function () { c.classList.remove("ok"); c.setAttribute("aria-label", "Copy"); }, 1800);
      }).catch(function () { tip("Press Ctrl+C to copy", true); });
    }
    if (v) {
      var s2 = subById(v.dataset.eye), k = v.dataset.k, el = document.querySelector('[data-sv="' + v.dataset.eye + ":" + k + '"]'); if (!s2 || !el) return;
      var l2 = s2.login, val = k === "pin" ? l2.pin : k === "gift" ? l2.gift.code : l2.password, show = !el.classList.contains("shown");
      el.classList.toggle("shown", show); el.textContent = show ? val : el.dataset.mask; v.classList.toggle("on", show); v.setAttribute("aria-label", show ? "Hide" : "Show");
    }
  });

  function renderOrders(os) {
    var box = $("#hist"); box.hidden = !os.length; if (!os.length) return;
    $("#hn").textContent = "· " + os.length + (os.length === 1 ? " order" : " orders");
    var dt = function (iso) { return fmt(new Date(Date.parse(iso) + 6 * 3600000).toISOString().slice(0, 10)); };
    $("#orders").innerHTML = os.map(function (o) {
      var ok = o.delivery === "delivered", priced = o.lines.length && o.lines.every(function (l) { return l.price > 0; }),
        tot = priced ? o.lines.reduce(function (t, l) { return t + l.price * (l.q || 1); }, 0) : 0;
      return '<article class="ac-ord"><div class="ac-oh"><div><b>Order #' + esc(String(o.id).slice(-8).toUpperCase()) + '</b><small>' + dt(o.date) + '</small></div><span class="ac-os ' + (ok ? "ok" : "wait") + '">' + (ok ? "Delivered" : "Processing") + '</span></div>' +
        '<ul class="ac-ol">' + o.lines.map(function (l) { return "<li><span>" + esc(l.name) + (l.plan ? "<small>" + esc(l.plan) + "</small>" : "") + '</span><em>×' + (l.q || 1) + "</em>" + (l.price > 0 ? "<b>" + taka(l.price * (l.q || 1)) + "</b>" : "") + "</li>"; }).join("") + "</ul>" +
        '<div class="ac-of"><span>' + (ok && o.delivered_at ? "Delivered " + dt(o.delivered_at) : "We deliver to your email and WhatsApp") + "</span>" + (tot ? "<b>Total " + taka(tot) + "</b>" : "") + "</div></article>";
    }).join("");
  }

  /* The home page fetches the account data in the background (on idle and when the account icon is touched), so it is often ready here. */
  function takePre(t) { try { var j = JSON.parse(sessionStorage.getItem("sx_acc_pre") || "null"); sessionStorage.removeItem("sx_acc_pre"); if (j && j.t === t && Date.now() - j.at < 90000) return j.d; } catch (e) {} return null; }
  function load() {
    var t = get(); if (!t) return showLogin();
    var pre = takePre(t); if (pre) { render(pre); return; }
    api("me", { headers: { Authorization: "Bearer " + t } }).then(render).catch(function (e) {
      if (e.status === 401) { set(null); showLogin("Your session ended. Please sign in again."); } else { showLogin(e.message); }
    });
  }

  var curEmail = "", lockT = null;
  var post = function (a, o) { return api(a, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) }); };
  function resendLock(sec) { var r = $("#cr"); r.disabled = true; var n = sec; clearInterval(lockT); r.textContent = "Resend code (" + n + ")"; lockT = setInterval(function () { n--; if (n <= 0) { clearInterval(lockT); r.disabled = false; r.textContent = "Resend code"; } else r.textContent = "Resend code (" + n + ")"; }, 1000); }
  function sendCode(em, quiet) {
    var m = $("#lm"), b = $("#lb"); b.disabled = true; m.className = "ac-msg"; m.textContent = "";
    return post("login", { email: em }).then(function () {
      curEmail = em; $("#lf").hidden = true; $("#cf").hidden = false; $("#cd").value = ""; $("#cm").textContent = "";
      $("#cs").textContent = "If " + em + " has subscriptions with us, a 6-digit code is on its way. Check spam too.";
      resendLock(60); setTimeout(function () { $("#cd").focus(); }, 50);
    }).catch(function (er) { (quiet ? $("#cm") : m).className = "ac-msg"; (quiet ? $("#cm") : m).textContent = er.message; })
      .then(function () { b.disabled = false; });
  }
  $("#lf").addEventListener("submit", function (e) {
    e.preventDefault();
    var em = $("#em").value.trim(), m = $("#lm");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { m.className = "ac-msg"; m.textContent = "Please enter a valid email address."; return; }
    sendCode(em, false);
  });
  $("#cd").addEventListener("input", function () { this.value = this.value.replace(/\D/g, "").slice(0, 6); if (this.value.length === 6) $("#cf").requestSubmit ? $("#cf").requestSubmit() : $("#cb").click(); });
  $("#cf").addEventListener("submit", function (e) {
    e.preventDefault();
    var code = $("#cd").value, m = $("#cm"), b = $("#cb");
    if (code.length !== 6) { m.className = "ac-msg"; m.textContent = "Enter the 6-digit code from your email."; return; }
    b.disabled = true; m.className = "ac-msg"; m.textContent = "";
    post("code", { email: curEmail, code: code })
      .then(function (j) { set(j.session); $("#cf").hidden = true; $("#lf").hidden = false; load(); })
      .catch(function (er) { m.textContent = er.message; $("#cd").select(); })
      .then(function () { b.disabled = false; });
  });
  $("#cr").addEventListener("click", function () { sendCode(curEmail, true).then(function () { var m = $("#cm"); if (!m.textContent) { m.className = "ac-msg ok"; m.textContent = "A new code was sent."; } }); });
  $("#cx").addEventListener("click", function () { $("#cf").hidden = true; $("#lf").hidden = false; $("#em").focus(); });
  $("#out").addEventListener("click", function () { set(null); showLogin(); });

  /* Renew: confirm the contact details, then open the EPS payment page. Expiry is extended automatically once payment is confirmed. */
  var rm = $("#rm"), cur = null;
  function closeRenew() { rm.hidden = true; document.documentElement.style.overflow = ""; }
  $("#list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-renew]"); if (!b || !DATA) return;
    cur = DATA.subscriptions.filter(function (x) { return String(x.id) === b.dataset.renew; })[0]; var pl = cur && planOf(cur); if (!pl) return;
    var base = cur.end_date > DATA.today ? cur.end_date : DATA.today, end = new Date(Date.parse(base + "T00:00:00Z")); end.setUTCMonth(end.getUTCMonth() + cur.months);
    $("#rt").textContent = cur.service + " · " + cur.plan; $("#rp").textContent = taka(pl.price);
    $("#rn").textContent = "Your plan will run until about " + fmt(end.toISOString().slice(0, 10)) + ". It is added after your current expiry, so no days are lost.";
    $("#remail").value = DATA.email || ""; $("#rname").value = (DATA.contact && DATA.contact.name) || ""; $("#rphone").value = (DATA.contact && DATA.contact.phone) || "";
    $("#re").textContent = ""; $("#rgo").disabled = false; $("#rgo").textContent = "Pay " + taka(pl.price) + " securely";
    rm.hidden = false; document.documentElement.style.overflow = "hidden";
  });
  rm.addEventListener("click", function (e) { if (e.target === rm || e.target.closest("[data-close]")) closeRenew(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeRenew(); });
  $("#rf").addEventListener("submit", function (e) {
    e.preventDefault(); var pl = cur && planOf(cur), name = $("#rname").value.trim(), phone = $("#rphone").value.replace(/[\s-]/g, ""), er = $("#re"), go = $("#rgo");
    if (!pl) return;
    if (name.length < 2) { er.textContent = "Please enter your name."; return; }
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) { er.textContent = "Enter a valid mobile number, e.g. 01712345678."; return; }
    er.textContent = ""; go.disabled = true; go.textContent = "Opening secure payment…";
    fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + get() }, body: JSON.stringify({ renew: true, name: name, phone: phone, items: [{ name: pl.name, vr: pl.vr, v: pl.v, q: 1 }] }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (r.status === 401) { set(null); closeRenew(); showLogin("Your session ended. Please sign in again."); throw new Error("signed out"); } if (!r.ok || !j.redirectUrl) throw new Error(j.error || "Online payment is unavailable right now. Please renew on WhatsApp."); location.href = j.redirectUrl; }); })
      .catch(function (x) { if (x.message === "signed out") return; er.textContent = x.message; go.disabled = false; go.textContent = "Pay " + taka(pl.price) + " securely"; });
  });

  var ICO = {
    google: '<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.5-4.1 7-10.2 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>',
    microsoft: '<svg viewBox="0 0 24 24"><path fill="#F25022" d="M2 2h9.5v9.5H2z"/><path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z"/><path fill="#00A4EF" d="M2 12.5h9.5V22H2z"/><path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z"/></svg>',
    apple: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1.9-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.200.8 1.300 0 2.100-1.200 2.900-2.400.9-1.400 1.300-2.700 1.300-2.800 0 0-2.400-.9-2.400-3.800zM14 5.400c.7-.8 1.100-1.900 1-3-1 0-2.100.7-2.800 1.500-.6.700-1.200 1.800-1 2.900 1.100.1 2.100-.5 2.800-1.400z"/></svg>'
  };
  fetch("/api/oauth?a=config").then(function (r) { return r.json(); }).then(function (c) {
    var on = ["google", "microsoft", "apple"].filter(function (k) { return c[k]; });
    if (!on.length) return;
    $("#soc").innerHTML = on.map(function (k) { return '<a class="ac-sb" href="/api/oauth?a=start&p=' + k + '">' + ICO[k] + "Continue with " + NM[k] + "</a>"; }).join("") + '<div class="ac-or">or use email</div>';
    $("#soc").hidden = false;
  }).catch(function () {});

  var eh = location.hash.match(/^#e=(.+)/);
  if (eh) { history.replaceState(null, "", location.pathname); var em = ""; try { em = decodeURIComponent(eh[1]); } catch (x) {} showLogin(em); return; }
  var h = location.hash.match(/^#t=([\w.\-]+)/);
  if (h) {
    history.replaceState(null, "", location.pathname);
    api("session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: h[1] }) })
      .then(function (j) { set(j.session); load(); }).catch(function (e) { showLogin(e.message); });
  } else load();
})();
