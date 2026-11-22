/* Service pages: "Buy" opens a short checkout form, then goes straight to the secure EPS payment page. */
(function () {
  "use strict";
  var KEY = "sx_buyer", WA = "8801312850241";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var PHONE = /^(?:\+?88)?01[3-9]\d{8}$/, EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var m = document.createElement("div"); m.className = "co"; m.hidden = true; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "co-t");
  m.innerHTML = '<form class="co-box" novalidate><button class="co-x" type="button" data-x aria-label="Close">✕</button><span class="co-eb">Secure checkout</span><h3 id="co-t">Pay online</h3><div class="co-sum" id="co-s"></div>' +
    '<label><span class="co-l">Your name</span><input id="co-n" type="text" autocomplete="name" placeholder="e.g. Rafiq Ahmed" maxlength="60"></label>' +
    '<div class="co-row"><label><span class="co-l">Mobile number</span><input id="co-p" type="tel" inputmode="numeric" autocomplete="tel" placeholder="01XXXXXXXXX" maxlength="14"></label>' +
    '<label><span class="co-l">Email</span><input id="co-e" type="email" autocomplete="email" placeholder="you@example.com" maxlength="100"></label></div>' +
    '<label><span class="co-l">Note for us <em>(optional)</em></span><textarea id="co-c" rows="2" maxlength="300" placeholder="Anything we should know about your order?"></textarea></label>' +
    '<p class="co-agree">By paying, you agree to our <a href="/terms/" target="_blank" rel="noopener">Terms &amp; Conditions</a> and <a href="/refund-policy/" target="_blank" rel="noopener">Refund Policy</a>.</p>' +
    '<p class="co-er" role="alert"></p><button class="co-go" type="submit"></button>' +
    '<img class="co-eps" src="/assets/img/pay/eps-renew.webp" alt="Pay with EPS: Visa, Mastercard, American Express, bKash, Nagad, Rocket and more" loading="lazy" width="1012" height="162">' +
    '<small class="co-fine">You will be taken to the EPS payment page. We never see your card or wallet PIN.</small>' +
    '<small class="co-fine co-wa">Prefer to order by chat? <a target="_blank" rel="noopener">Order on WhatsApp instead ↗</a></small></form>';
  document.body.appendChild(m);
  var f = $("form", m), er = $(".co-er", m), go = $(".co-go", m), cur = null;
  function close() { m.hidden = true; document.documentElement.style.overflow = ""; }
function sessEmail(){try{var t=localStorage.getItem("sx_session");if(!t)return "";var o=JSON.parse(atob(t.split(".")[0].replace(/-/g,"+").replace(/_/g,"/")));return o&&o.t==="sess"&&o.exp>Date.now()&&o.e?String(o.e):""}catch(e){return ""}}
  function lockEmail() {
    var el = $("#co-e"), se = sessEmail(), h = $("#co-lock");
    if (se) { el.value = se; el.readOnly = true; el.classList.add("is-lock"); if (!h) { h = document.createElement("small"); h.id = "co-lock"; h.className = "co-lock"; el.parentNode.appendChild(h); } h.textContent = "You are signed in, so your order uses your account email."; }
    else { el.readOnly = false; el.classList.remove("is-lock"); if (h) h.remove(); }
    return se;
  }
  function show(items, totalTxt, label) {
    cur = { items: items.map(function (x) { return { name: x.name, vr: x.vr || undefined, v: x.v, q: x.q || 1 }; }), price: totalTxt, label: label };
    $("#co-s").innerHTML = items.map(function (x) { return '<div><span>' + esc(x.label) + ' <em>×' + (x.q || 1) + '</em></span><b>' + esc(x.priceTxt) + '</b></div>'; }).join("") + '<div class="co-tot"><span>Total</span><b>' + esc(totalTxt) + "</b></div>"; $("#co-c").value = "";
    var s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    $("#co-n").value = s.n || ""; $("#co-p").value = s.p || ""; $("#co-e").value = s.e || "";
    lockEmail(); er.textContent = ""; go.disabled = false; go.textContent = "Pay " + totalTxt + " securely";
    $(".co-wa a", m).href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi StreamX! I want to order:\n" + items.map(function (x, j) { return (j + 1) + ". " + x.label + " x" + (x.q || 1) + " - " + x.priceTxt; }).join("\n") + "\nTotal: " + totalTxt);
    m.hidden = false; document.documentElement.style.overflow = "hidden"; setTimeout(function () { ($("#co-n").value ? $("#co-p") : $("#co-n")).focus(); }, 50); return true;
  }
  function open(a) {
    var d; try { d = JSON.parse(a.dataset.buy); } catch (e) { return false; }
    var price = ($("b", a) || {}).textContent || "", label = d.n + (d.vr ? " · " + d.vr : "") + " · " + d.v;
    return show([{ name: d.n, vr: d.vr, v: d.v, q: 1, label: label, priceTxt: price }], price, label);
  }
  window.spCheckout = show;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-buy]");
    if (a && !(e.metaKey || e.ctrlKey || e.shiftKey) && open(a)) e.preventDefault();
    else if (e.target === m || (e.target.closest && e.target.closest("[data-x]"))) close();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !m.hidden) close(); });
  f.addEventListener("submit", function (e) {
    e.preventDefault(); if (!cur) return;
    var name = $("#co-n").value.trim(), phone = $("#co-p").value.replace(/[\s-]/g, ""), se = sessEmail(), email = se || $("#co-e").value.trim();
    if (name.length < 2) { er.textContent = "Please enter your name."; return; }
    if (!PHONE.test(phone)) { er.textContent = "Enter a valid mobile number, e.g. 01712345678."; return; }
    if (!EMAIL.test(email)) { er.textContent = "Enter a valid email address."; return; }
    er.textContent = ""; go.disabled = true; go.textContent = "Opening secure payment…";
    try { localStorage.setItem(KEY, JSON.stringify({ n: name, p: phone, e: se ? "" : email })); } catch (x) {}
    fetch("/api/checkout", { method: "POST", headers: se ? { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("sx_session") } : { "Content-Type": "application/json" }, body: JSON.stringify({ name: name, phone: phone, email: email, tip: 0, comment: $("#co-c").value.trim().slice(0, 300), items: cur.items }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.redirectUrl) throw new Error(j.error || "Online payment is unavailable right now. Please order on WhatsApp."); location.href = j.redirectUrl; }); })
      .catch(function (x) { er.textContent = x.message; go.disabled = false; go.textContent = "Pay " + cur.price + " securely"; });
  });
})();
