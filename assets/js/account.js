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

  function showLogin(msg) { $("#app").hidden = true; $("#login").hidden = false; $("#cf").hidden = true; $("#lf").hidden = false; $("#sub").textContent = "See what is active, when it ends, and renew in one tap."; if (msg) { var m = $("#lm"); m.textContent = msg; m.className = "ac-msg"; } }

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
  var COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  var GIFTI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 1 1 0 5"/></svg>';
  var isGift = function (s) { return /gift card$/i.test(s.service || ""); };
  var famLabel = function (s) { return /truecaller/i.test(s.service) ? "Family number" : "Family mail"; };
  var hasFam = function (s) { return /spotify|truecaller/i.test(s.service); };
  function supportMsg(s, lg) {
    var phone = lg.mode === "phone_otp" || lg.mode === "phone_pass" || lg.mode === "number";
    var t = ["Hi StreamX! I need my " + (lg.otp ? "login code" : isGift(s) ? "redeem code" : "login details") + " for " + s.service + ".", ""];
    if (phone && lg.phone) t.push(s.service + " number: " + lg.phone);
    else if (lg.email) t.push(s.service + " mail: " + lg.email);
    if (lg.profile) t.push("Profile: " + lg.profile);
    if (isGift(s) && lg.gift && lg.gift.amount) t.push("Gift card: " + lg.gift.amount + (lg.gift.region ? " (" + lg.gift.region + ")" : ""));
    if (DATA && DATA.email) t.push("My StreamX email: " + DATA.email);
    return t.join("\n");
  }
  function lrow(k, v, extra, cls) { return '<div class="ac-lr"><span class="ac-lk">' + k + '</span><span class="ac-lv' + (cls ? " " + cls : "") + '">' + v + "</span>" + (extra || "") + "</div>"; }
  function cp(key, s) { return '<button class="ac-cp" type="button" data-copy="' + key + '" data-sid="' + s.id + '">' + COPY + "<span>Copy</span></button>"; }
  function secret(k, s, mask, val) { return lrow(({ pass: "Password", pin: "PIN", gift: "Redeem code" })[k], '<span data-sv="' + s.id + ":" + k + '" data-mask="' + mask + '">' + mask + "</span>", '<button class="ac-eye" type="button" data-eye="' + s.id + '" data-k="' + k + '" aria-label="Show"><span>Show</span></button>' + cp(k === "pass" ? "p" : k === "pin" ? "n" : "g", s)); }
  function loginBox(s) {
    var lg = s.login || {}, g = lg.gift || {}, vp = lg.vpn || {}, wa = "https://wa.me/" + WA + "?text=" + encodeURIComponent(supportMsg(s, lg));
    var sup = '<a href="' + wa + '" target="_blank" rel="noopener">talk to support</a>', h, any = false, mode = lg.mode || "none";
    if (isGift(s)) {
      h = '<div class="ac-lbx ac-gift"><div class="ac-lbh">' + GIFTI + "Gift card</div>";
      if (g.code) h += secret("gift", s, "••••-••••-••••");
      else h += '<p class="ac-lbn">Your redeem code will appear here once it is ready. Need it now? Please ' + sup + ".</p>";
      if (g.region) h += lrow("Region", flagImg(g.region) + " " + esc(countryName(g.region)));
      if (g.amount) h += lrow("Amount", esc(g.amount));
      h += lrow("Valid until", fmt(s.end_date) + ' <em>(6 months from purchase)</em>');
      return h + '<p class="ac-lbn ac-hint">Redeem it in the App Store or at apple.com/redeem. Each code works once.</p></div>';
    }
    h = '<div class="ac-lbx"><div class="ac-lbh">' + LOCK + "Account login</div>";
    var ph = lg.phone ? esc(lg.phone) : "<em>Not added yet</em>", em = lg.email ? esc(lg.email) : "<em>Not added yet</em>";
    var otp = '<span class="ac-ot">OTP based. Please ' + sup + " for your login code.</span>";
    if (mode === "email_pass" || mode === "email_otp") { any = true; h += lrow("Email", em, lg.email ? cp("e", s) : ""); h += mode === "email_pass" ? (lg.password ? secret("pass", s, "••••••••••") : lrow("Password", "<em>Not added yet</em>")) : lrow("Login", otp); }
    else if (mode === "phone_pass" || mode === "phone_otp") { any = true; h += lrow("Number", ph, lg.phone ? cp("t", s) : ""); h += mode === "phone_pass" ? (lg.password ? secret("pass", s, "••••••••••") : lrow("Password", "<em>Not added yet</em>")) : lrow("Login", otp); }
    else if (mode === "number") { any = true; h += lrow("Number", ph, lg.phone ? cp("t", s) : ""); h += '<p class="ac-lbn ac-hint">Activated on this number. No password needed.</p>'; }
    else if (mode === "own") { any = true; var oe = lg.email || (DATA && DATA.email) || ""; h += lrow("Activated on", esc(oe), cp("e0", s)); h += '<p class="ac-lbn ac-hint">Activated on your own email. No password needed.</p>'; }
    if (lg.profile) { any = true; h += lrow("Profile", esc(lg.profile), cp("f", s)); }
    if (lg.pin) { any = true; h += secret("pin", s, "••••"); }
    if (lg.family && hasFam(s)) { any = true; h += lrow(famLabel(s), esc(lg.family), cp("m", s)) + '<p class="ac-lbn ac-hint">' + (famLabel(s) === "Family number" ? "Your plan is activated from this number." : "Your plan is activated from this mail.") + "</p>"; }
    if (vp.required) { any = true; h += lrow("VPN", '<span class="ac-vpn"><b>Required</b>' + (vp.country ? flagImg(vp.country) + " " + esc(countryName(vp.country)) : "") + "</span>") + '<p class="ac-lbn ac-hint">Connect to a server in ' + (vp.country ? esc(countryName(vp.country)) : "the required country") + " before you sign in.</p>"; }
    if (!any) return h + '<p class="ac-lbn">Your login details will appear here once your account is ready. Need them now? Please ' + sup + ".</p></div>";
    return h + "</div>";
  }

  function render(d) {
    $("#login").hidden = true; $("#app").hidden = false; $("#who").textContent = d.email;
    var pf = d.profile || {}, nm = pf.name || "", av = $("#av"); av.innerHTML = "";
    if (pf.picture) { var im = new Image(); im.alt = ""; im.referrerPolicy = "no-referrer"; im.onerror = function () { av.textContent = (nm || d.email)[0].toUpperCase(); }; im.src = pf.picture; av.appendChild(im); } else av.textContent = (nm || d.email)[0].toUpperCase();
    $("#hi").textContent = nm ? "Welcome back, " + nm : "Welcome back";
    var pvEl = $("#pv"); pvEl.hidden = !pf.provider; if (pf.provider) pvEl.textContent = "Signed in with " + (NM[pf.provider] || pf.provider);
    renderOrders(d.orders || []);
    DATA = d; var today = d.today, rows = d.subscriptions.map(function (s) { s._left = days(today, s.end_date); return s; });
    var live = rows.filter(function (s) { return s._left >= 0; }).sort(function (a, b) { return a._left - b._left; });
    var gone = rows.filter(function (s) { return s._left < 0; }).sort(function (a, b) { return b._left - a._left; });
    $("#sub").textContent = live.length ? live.length + " active " + (live.length === 1 ? "subscription" : "subscriptions") + ". Expiry dates are in Bangladesh time." : "You have no active subscription right now.";
    if (!rows.length) { $("#list").innerHTML = '<div class="ac-card ac-empty">No subscriptions found for this email yet.<br><a class="ac-btn ac-sm" style="margin-top:14px" href="/#pricing">Browse plans</a></div>'; return; }
    var idx = 0;
    $("#list").innerHTML = live.concat(gone).map(function (s) {
      var st = s._left < 0 ? ["Expired", "#ef4444"] : s._left <= 7 ? ["Expires soon", "#f59e0b"] : ["Active", "#22c55e"];
      var total = Math.max(1, days(s.start_date, s.end_date)), left = Math.min(100, Math.max(0, Math.round(s._left / total * 100)));
      var L = s._left, big = L < 0 ? "Expired" : L === 0 ? "Today" : String(L), small = L < 0 ? (-L) + (L === -1 ? " day ago" : " days ago") : L === 0 ? "last day" : (L === 1 ? "day left" : "days left");
      var msg = "Hi StreamX! I want to renew my " + s.service + " (" + s.plan + "), " + (s._left < 0 ? "expired on " : "expires on ") + fmt(s.end_date) + ". My email: " + d.email;
      return '<article class="ac-sub-card" style="--st:' + st[1] + ';--i:' + (idx++) + '">' + tile(s) +
        '<div><div class="ac-name">' + esc(s.service) + '<span class="ac-chip">' + st[0] + '</span></div><div class="ac-plan">' + esc(s.plan) + '</div>' +
        '<div class="ac-dates"><span>Started<b>' + fmt(s.start_date) + '</b></span><span>Expires<b>' + fmt(s.end_date) + '</b></span></div><div class="ac-track" title="' + left + '% of this plan is left"><i data-p="' + left + '"></i></div></div>' +
        '<div class="ac-act"><div class="ac-left"><b data-n="' + (L >= 0 ? L : "") + '">' + esc(big) + '</b>' + esc(small) + '</div>' +
        (isGift(s) ? '<a class="ac-btn ac-sm" href="/#pricing">Buy another</a>' : (planOf(s) ? '<button class="ac-btn ac-sm" type="button" data-renew="' + s.id + '">Renew · ' + taka(planOf(s).price) + '</button>' : '<a class="ac-btn ac-sm" href="' + renewLink(s) + '">Renew</a>') + '<a class="ac-btn ac-ghost ac-sm" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(msg) + '">Renew on WhatsApp</a>') + '</div>' + (s._left >= 0 ? loginBox(s) : "") + '</article>';
    }).join("");
    animateIn();
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
      var map = { p: lg.password, f: lg.profile, n: lg.pin, e: lg.email, e0: lg.email || (DATA && DATA.email), t: lg.phone, m: lg.family, g: lg.gift && lg.gift.code };
      copyText(map[c.dataset.copy] || "").then(function () {
        var sp = c.querySelector("span"); c.classList.add("ok"); sp.textContent = "Copied"; clearTimeout(c._t);
        c._t = setTimeout(function () { c.classList.remove("ok"); sp.textContent = "Copy"; }, 1800);
      }).catch(function () { var sp = c.querySelector("span"); sp.textContent = "Press Ctrl+C"; });
    }
    if (v) {
      var s2 = subById(v.dataset.eye), k = v.dataset.k, el = document.querySelector('[data-sv="' + v.dataset.eye + ":" + k + '"]'); if (!s2 || !el) return;
      var l2 = s2.login, val = k === "pin" ? l2.pin : k === "gift" ? l2.gift.code : l2.password, show = !el.classList.contains("shown");
      el.classList.toggle("shown", show); el.textContent = show ? val : el.dataset.mask; v.querySelector("span").textContent = show ? "Hide" : "Show";
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

  function load() {
    var t = get(); if (!t) return showLogin();
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
    $("#rname").value = (DATA.contact && DATA.contact.name) || ""; $("#rphone").value = (DATA.contact && DATA.contact.phone) || "";
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
