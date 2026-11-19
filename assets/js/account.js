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

  function showLogin(msg) { $("#app").hidden = true; $("#login").hidden = false; $("#sub").textContent = "See what is active, when it ends, and renew in one tap."; if (msg) { var m = $("#lm"); m.textContent = msg; m.className = "ac-msg"; } }

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
  var DATA = null, taka = function (n) { return "৳" + n.toLocaleString("en-US"); };
  function tile(s) { var p = PROD.filter(function (x) { return x.name === s.service; })[0]; return '<span class="ac-tile" style="--c:' + esc((p && p.color) || "#444") + '" aria-hidden="true">' + esc(((p && p.icon) || s.service[0] || "?").toString().slice(0, 2)) + "</span>"; }

  function render(d) {
    $("#login").hidden = true; $("#app").hidden = false; $("#who").textContent = d.email;
    DATA = d; var today = d.today, rows = d.subscriptions.map(function (s) { s._left = days(today, s.end_date); return s; });
    var live = rows.filter(function (s) { return s._left >= 0; }).sort(function (a, b) { return a._left - b._left; });
    var gone = rows.filter(function (s) { return s._left < 0; }).sort(function (a, b) { return b._left - a._left; });
    $("#sub").textContent = live.length ? live.length + " active " + (live.length === 1 ? "subscription" : "subscriptions") + ". Expiry dates are in Bangladesh time." : "You have no active subscription right now.";
    if (!rows.length) { $("#list").innerHTML = '<div class="ac-card ac-empty">No subscriptions found for this email yet.<br><a class="ac-btn ac-sm" style="margin-top:14px" href="/#pricing">Browse plans</a></div>'; return; }
    $("#list").innerHTML = live.concat(gone).map(function (s) {
      var st = s._left < 0 ? ["Expired", "#ef4444"] : s._left <= 7 ? ["Expires soon", "#f59e0b"] : ["Active", "#22c55e"];
      var total = Math.max(1, days(s.start_date, s.end_date)), used = Math.min(100, Math.max(0, Math.round(days(s.start_date, today) / total * 100)));
      var L = s._left, big = L < 0 ? "Expired" : L === 0 ? "Today" : String(L), small = L < 0 ? (-L) + (L === -1 ? " day ago" : " days ago") : L === 0 ? "last day" : (L === 1 ? "day left" : "days left");
      var msg = "Hi StreamX! I want to renew my " + s.service + " (" + s.plan + "), " + (s._left < 0 ? "expired on " : "expires on ") + fmt(s.end_date) + ". My email: " + d.email;
      return '<article class="ac-sub-card" style="--st:' + st[1] + '">' + tile(s) +
        '<div><div class="ac-name">' + esc(s.service) + '<span class="ac-chip">' + st[0] + '</span></div><div class="ac-plan">' + esc(s.plan) + '</div>' +
        '<div class="ac-dates"><span>Started<b>' + fmt(s.start_date) + '</b></span><span>Expires<b>' + fmt(s.end_date) + '</b></span></div><div class="ac-track"><i style="--p:' + used + '%"></i></div></div>' +
        '<div class="ac-act"><div class="ac-left"><b>' + esc(big) + '</b>' + esc(small) + '</div>' +
        (planOf(s) ? '<button class="ac-btn ac-sm" type="button" data-renew="' + s.id + '">Renew · ' + taka(planOf(s).price) + '</button>' : '<a class="ac-btn ac-sm" href="' + renewLink(s) + '">Renew</a>') + '<a class="ac-btn ac-ghost ac-sm" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(msg) + '">Renew on WhatsApp</a></div></article>';
    }).join("");
  }

  function load() {
    var t = get(); if (!t) return showLogin();
    api("me", { headers: { Authorization: "Bearer " + t } }).then(render).catch(function (e) {
      if (e.status === 401) { set(null); showLogin("Your session ended. Please sign in again."); } else { showLogin(e.message); }
    });
  }

  $("#lf").addEventListener("submit", function (e) {
    e.preventDefault();
    var em = $("#em").value.trim(), m = $("#lm"), b = $("#lb");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { m.className = "ac-msg"; m.textContent = "Please enter a valid email address."; return; }
    b.disabled = true; m.className = "ac-msg"; m.textContent = "";
    api("login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em }) })
      .then(function () { m.className = "ac-msg ok"; m.textContent = "Check your inbox. If this email has subscriptions with us, a sign-in link is on its way (look in spam too)."; })
      .catch(function (er) { m.textContent = er.message; })
      .then(function () { setTimeout(function () { b.disabled = false; }, 4000); });
  });
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
  }, NM = { google: "Google", microsoft: "Microsoft", apple: "Apple" };
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
