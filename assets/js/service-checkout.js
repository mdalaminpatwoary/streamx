/* Service pages: "Buy" opens a short checkout form, then goes straight to the secure EPS payment page. */
(function () {
  "use strict";
  var KEY = "sx_buyer", WA = "8801312850241";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var PHONE = /^(?:(?:\+?88)?01[3-9]\d{8}|\+[1-9]\d{7,14})$/, EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var m = document.createElement("div"); m.className = "co"; m.hidden = true; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "co-t");
  m.innerHTML = '<form class="co-box" novalidate><button class="co-x" type="button" data-x aria-label="Close">✕</button><span class="co-eb">Secure checkout</span><h3 id="co-t">Pay online</h3><div class="co-sum" id="co-s"></div>' +
    '<button type="button" class="co-cpt" aria-expanded="false"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>Have a coupon?</button>' +
    '<div class="co-cp" hidden><label for="co-cpi" class="co-l">Coupon code <em>(optional)</em></label><div class="co-cprow"><input id="co-cpi" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. EID10" maxlength="24"><button type="button" class="co-cpgo">Apply</button></div><p class="co-cpm" role="status"></p></div>' +
    '<label><span class="co-l">Your name</span><input id="co-n" type="text" autocomplete="name" placeholder="e.g. Rafiq Ahmed" maxlength="60"></label>' +
    '<div class="co-row"><label><span class="co-l">Mobile number</span><input id="co-p" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX or +358…" maxlength="20"></label>' +
    '<label><span class="co-l">Email</span><input id="co-e" type="email" autocomplete="email" placeholder="you@example.com" maxlength="100"></label></div>' +
    '<label><span class="co-l">Note for us <em>(optional)</em></span><textarea id="co-c" rows="2" maxlength="300" placeholder="Anything we should know about your order?"></textarea></label>' +
    '<p class="co-agree">By paying, you agree to our <a href="/terms/" target="_blank" rel="noopener">Terms &amp; Conditions</a> and <a href="/refund-policy/" target="_blank" rel="noopener">Refund Policy</a>.</p>' +
    '<p class="co-er" role="alert"></p><button class="co-go" type="submit"></button>' +
    '<img class="co-eps" src="/assets/img/pay/eps-dark.webp?v=2" alt="Pay with EPS: Visa, Mastercard, American Express, bKash, Nagad, Rocket and more" loading="lazy" width="1012" height="162">' +
    '<small class="co-fine">You will be taken to the EPS payment page. We never see your card or wallet PIN.</small>' +
    '<small class="co-fine co-wa">Prefer another way to pay? <button type="button" class="co-man">Pay manually</button></small></form>' +
    '<div class="co-box co-mbox" hidden><button class="co-x" type="button" data-x aria-label="Close">✕</button><button class="co-back" type="button">← Back to online payment</button><span class="co-eb">Pay manually</span><h3>Send the payment, then confirm</h3><div class="co-sum" id="co-ms"></div><div id="co-mm"></div></div>';
  document.body.appendChild(m);
  var f = $("form", m), mb = $(".co-mbox", m), PM = null, er = $(".co-er", m), go = $(".co-go", m), cur = null;
  function close() { m.hidden = true; if (!mb.hidden) { $("#co-s").after($(".co-cpt", m)); $(".co-cpt", m).after($(".co-cp", m)); } f.hidden = false; mb.hidden = true; document.documentElement.style.overflow = ""; }
function sessEmail(){try{var t=localStorage.getItem("sx_session");if(!t)return "";var o=JSON.parse(atob(t.split(".")[0].replace(/-/g,"+").replace(/_/g,"/")));return o&&o.t==="sess"&&o.exp>Date.now()&&o.e?String(o.e):""}catch(e){return ""}}
  function lockEmail() {
    var el = $("#co-e"), se = sessEmail(), h = $("#co-lock");
    if (se) { el.value = se; el.readOnly = true; el.classList.add("is-lock"); if (!h) { h = document.createElement("small"); h.id = "co-lock"; h.className = "co-lock"; el.parentNode.appendChild(h); } h.textContent = "You are signed in, so your order uses your account email."; }
    else { el.readOnly = false; el.classList.remove("is-lock"); if (h) h.remove(); }
    return se;
  }
  var cp = null;
  function paintSum() {
    var d = cp ? cp.discount : 0, tot = cur.baseTxt;
    if (d) { tot = cur.pre + fmt(Math.max(1, cur.base - d)) + cur.suf; }
    cur.price = tot;
    $("#co-s").innerHTML = cur.rows.map(function (x) { return '<div><span>' + esc(x.label) + ' <em>×' + (x.q || 1) + '</em></span><b>' + esc(x.priceTxt) + '</b></div>'; }).join("") +
      (d ? '<div class="co-disc"><span>Coupon ' + esc(cp.code) + '</span><b>−' + esc(cur.pre + fmt(d)) + '</b></div>' : "") +
      '<div class="co-tot"><span>Total</span><b>' + esc(tot) + "</b></div>";
    go.textContent = "Pay " + tot + " securely";
    var gb = $(".co-cpgo", m), gi = $("#co-cpi"); gi.readOnly = !!cp; gb.textContent = cp ? "Remove" : "Apply"; gb.classList.toggle("on", !!cp);
    if (!mb.hidden) { $("#co-ms").innerHTML = $("#co-s").innerHTML; if (PM) PM.refresh(); }
  }
  function fmt(n) { return Number(n).toLocaleString("en-US"); }
  function cpToggle(on) { $(".co-cp", m).hidden = !on; $(".co-cpt", m).hidden = on; $(".co-cpt", m).setAttribute("aria-expanded", on ? "true" : "false"); }
  function cpApply() {
    var msg = $(".co-cpm", m), gi = $("#co-cpi"), gb = $(".co-cpgo", m);
    if (cp) { cp = null; gi.value = ""; msg.textContent = ""; msg.className = "co-cpm"; paintSum(); return; }
    var code = gi.value.trim();
    if (!code) { msg.className = "co-cpm bad"; msg.textContent = "Enter a coupon code."; return; }
    gb.disabled = true; msg.className = "co-cpm"; msg.textContent = "Checking…";
    var se = sessEmail(), em = se || $("#co-e").value.trim();
    fetch("/api/checkout", { method: "POST", headers: se ? { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("sx_session") } : { "Content-Type": "application/json" }, body: JSON.stringify({ check: true, coupon: code, email: EMAIL.test(em) ? em : "", items: cur.items }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.discount) throw new Error(j.error || "Couldn't check the coupon. Please try again."); cp = { code: j.coupon, discount: j.discount }; gi.value = j.coupon; msg.className = "co-cpm ok"; msg.textContent = "Coupon applied. You save " + cur.pre + fmt(j.discount) + "."; paintSum(); }); })
      .catch(function (x) { msg.className = "co-cpm bad"; msg.textContent = x.message; })
      .then(function () { gb.disabled = false; });
  }
  function show(items, totalTxt, label) {
    var mt = String(totalTxt).match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
    cur = { items: items.map(function (x) { return { name: x.name, vr: x.vr || undefined, v: x.v, q: x.q || 1 }; }), price: totalTxt, label: label, rows: items, baseTxt: totalTxt, pre: mt ? mt[1] : "৳", base: mt ? Number(mt[2].replace(/,/g, "")) : 0, suf: mt ? mt[3] : "" };
    cp = null; $("#co-cpi").value = ""; $(".co-cpm", m).textContent = ""; $(".co-cpm", m).className = "co-cpm"; cpToggle(false);
    paintSum(); $("#co-c").value = "";
    var s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    $("#co-n").value = s.n || ""; $("#co-p").value = s.p || ""; $("#co-e").value = s.e || "";
    lockEmail(); er.textContent = ""; go.disabled = false; go.textContent = "Pay " + totalTxt + " securely";
    f.hidden = false; mb.hidden = true; m.hidden = false; document.documentElement.style.overflow = "hidden"; setTimeout(function () { ($("#co-n").value ? $("#co-p") : $("#co-n")).focus(); }, 50); return true;
  }
  function open(a) {
    var d; try { d = JSON.parse(a.dataset.buy); } catch (e) { return false; }
    var price = ($("b", a) || {}).textContent || "", label = d.n + (d.vr ? " · " + d.vr : "") + " · " + d.v;
    return show([{ name: d.n, vr: d.vr, v: d.v, q: 1, label: label, priceTxt: price }], price, label);
  }
  function asset(tag, url) { var el = document.createElement(tag); if (tag === "link") { el.rel = "stylesheet"; el.href = url; } else { el.src = url; } document.head.appendChild(el); return el; }
  function ensurePM(cb) {
    if (window.PayMethods) return cb();
    if (!document.querySelector('link[href*="pay-methods.css"]')) asset("link", "/assets/css/components/pay-methods.css?v=6");
    var s = document.querySelector('script[src*="pay-methods.js"]') || asset("script", "/assets/js/features/pay-methods.js?v=20261126i");
    s.addEventListener("load", cb);
  }
  function showManual() {
    if (!cur) return;
    ensurePM(function () {
      if (!PM) PM = window.PayMethods.mount($("#co-mm"), {
        getTotal: function () { return Number(String(cur.price).replace(/[^\d.]/g, "")) || null; },
        getLines: function () { return cur.items.map(function (x, i) { return (i + 1) + ". " + x.name + (x.vr ? " · " + x.vr : "") + " · " + x.v + " ×" + x.q; }).concat(cp ? ["Coupon: " + cp.code + " (−" + cur.pre + fmt(cp.discount) + ")"] : []); },
        onName: function (n) { try { var b = JSON.parse(localStorage.getItem(KEY) || "{}"); b.n = n; localStorage.setItem(KEY, JSON.stringify(b)); } catch (x) {} }
      });
      var mm = $("#co-mm"); mm.parentNode.insertBefore($(".co-cpt", m), mm); mm.parentNode.insertBefore($(".co-cp", m), mm);
      $("#co-ms").innerHTML = $("#co-s").innerHTML; PM.refresh(); PM.reset();
      try { PM.setName(JSON.parse(localStorage.getItem(KEY) || "{}").n); } catch (e) {}
      mb.hidden = false; paintSum(); f.hidden = true; mb.scrollTop = 0;
    });
  }
  m.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("button"); if (!t) return;
    if (t.classList.contains("co-man")) showManual();
    else if (t.classList.contains("co-back")) { mb.hidden = true; f.hidden = false; f.scrollTop = 0; $("#co-s").after($(".co-cpt", m)); $(".co-cpt", m).after($(".co-cp", m)); }
    else if (t.classList.contains("co-cpt")) { cpToggle(true); setTimeout(function () { $("#co-cpi").focus(); }, 50); }
    else if (t.classList.contains("co-cpgo")) cpApply();
  });
  m.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "co-cpi") { e.preventDefault(); cpApply(); } });
  window.spCheckout = show;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-buy]");
    if (a && !(e.metaKey || e.ctrlKey || e.shiftKey) && open(a)) e.preventDefault();
    else if (e.target === m || (e.target.closest && e.target.closest("[data-x]"))) close();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !m.hidden) close(); });
  f.addEventListener("submit", function (e) {
    e.preventDefault(); if (!cur) return;
    var name = $("#co-n").value.trim(), phone = $("#co-p").value.replace(/[\s\-()]/g, ""), se = sessEmail(), email = se || $("#co-e").value.trim();
    if (name.length < 2) { er.textContent = "Please enter your name."; return; }
    if (!PHONE.test(phone)) { er.textContent = "Enter a valid mobile number: 01712345678, or with country code, e.g. +358442354993."; return; }
    if (!EMAIL.test(email)) { er.textContent = "Enter a valid email address."; return; }
    er.textContent = ""; go.disabled = true; go.textContent = "Opening secure payment…";
    try { localStorage.setItem(KEY, JSON.stringify({ n: name, p: phone, e: se ? "" : email })); } catch (x) {}
    fetch("/api/checkout", { method: "POST", headers: se ? { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("sx_session") } : { "Content-Type": "application/json" }, body: JSON.stringify({ name: name, phone: phone, email: email, tip: 0, coupon: cp ? cp.code : "", comment: $("#co-c").value.trim().slice(0, 300), items: cur.items }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.redirectUrl) throw new Error(j.error || "Online payment is unavailable right now. Please order on WhatsApp."); location.href = j.redirectUrl; }); })
      .catch(function (x) { er.textContent = x.message; go.disabled = false; go.textContent = "Pay " + cur.price + " securely"; });
  });
})();
