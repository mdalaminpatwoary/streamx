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
  function loginBox(s) {
    var lg = s.login || {}, wa = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi StreamX! I need the login details for my " + s.service + " (" + s.plan + ").");
    var h = '<div class="ac-lbx"><div class="ac-lbh">' + LOCK + "Account login</div>";
    if (!lg.email && !lg.password && !lg.otp) return h + '<p class="ac-lbn">Your login details will appear here once your account is ready. Need them now? <a href="' + wa + '" target="_blank" rel="noopener">Talk to support</a>.</p></div>';
    h += '<div class="ac-lr"><span class="ac-lk">Email</span><span class="ac-lv">' + (lg.email ? esc(lg.email) : '<em>Not added yet</em>') + "</span>" + (lg.email ? '<button class="ac-cp" type="button" data-copy="e" data-sid="' + s.id + '">' + COPY + "<span>Copy</span></button>" : "") + "</div>";
    if (lg.otp) h += '<div class="ac-lr"><span class="ac-lk">Password</span><span class="ac-lv ac-ot">OTP based. Please <a href="' + wa + '" target="_blank" rel="noopener">talk to support</a> for your login code.</span></div>';
    else h += '<div class="ac-lr"><span class="ac-lk">Password</span><span class="ac-lv" data-pv="' + s.id + '">' + (lg.password ? "••••••••••" : "<em>Not added yet</em>") + "</span>" + (lg.password ? '<button class="ac-eye" type="button" data-eye="' + s.id + '" aria-label="Show password"><span>Show</span></button><button class="ac-cp" type="button" data-copy="p" data-sid="' + s.id + '">' + COPY + "<span>Copy</span></button>" : "") + "</div>";
    return h + "</div>";
  }

  function render(d) {
    $("#login").hidden = true; $("#app").hidden = false; $("#who").textContent = d.email;
    var pf = d.profile || {}, nm = pf.name || "", av = $("#av"); av.innerHTML = "";
    if (pf.picture) { var im = new Image(); im.alt = ""; im.referrerPolicy = "no-referrer"; im.onerror = function () { av.textContent = (nm || d.email)[0].toUpperCase(); }; im.src = pf.picture; av.appendChild(im); } else av.textContent = (nm || d.email)[0].toUpperCase();
    $("#hi").textContent = nm ? "Welcome back, " + nm.split(" ")[0] : "Welcome back";
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
        (planOf(s) ? '<button class="ac-btn ac-sm" type="button" data-renew="' + s.id + '">Renew · ' + taka(planOf(s).price) + '</button>' : '<a class="ac-btn ac-sm" href="' + renewLink(s) + '">Renew</a>') + '<a class="ac-btn ac-ghost ac-sm" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(msg) + '">Renew on WhatsApp</a></div>' + (s._left >= 0 ? loginBox(s) : "") + '</article>';
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
      copyText(c.dataset.copy === "p" ? lg.password : lg.email).then(function () {
        var sp = c.querySelector("span"); c.classList.add("ok"); sp.textContent = "Copied"; clearTimeout(c._t);
        c._t = setTimeout(function () { c.classList.remove("ok"); sp.textContent = "Copy"; }, 1800);
      }).catch(function () { var sp = c.querySelector("span"); sp.textContent = "Press Ctrl+C"; });
    }
    if (v) {
      var s2 = subById(v.dataset.eye), el = document.querySelector('[data-pv="' + v.dataset.eye + '"]'); if (!s2 || !el) return;
      var show = !el.classList.contains("shown"); el.classList.toggle("shown", show);
      el.textContent = show ? s2.login.password : "••••••••••"; v.querySelector("span").textContent = show ? "Hide" : "Show";
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
