/* Service pages: "Buy" opens a short checkout form, then goes straight to the secure EPS payment page. */
(function () {
  "use strict";
  var KEY = "sx_buyer", WA = "8801312850241";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var PHONE = /^(?:\+?88)?01[3-9]\d{8}$/, EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var m = document.createElement("div"); m.className = "co"; m.hidden = true; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "co-t");
  m.innerHTML = '<form class="co-box" novalidate><button class="co-x" type="button" data-x aria-label="Close">✕</button><span class="co-eb">Checkout</span><h3 id="co-t"></h3><div class="co-pr"></div>' +
    '<label for="co-n">Your name</label><input id="co-n" autocomplete="name">' +
    '<label for="co-p">Mobile number</label><input id="co-p" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX">' +
    '<label for="co-e">Email</label><input id="co-e" type="email" autocomplete="email" placeholder="you@example.com">' +
    '<p class="co-er" role="alert"></p><button class="co-go" type="submit"></button>' +
    '<p class="co-nt">Pay with bKash, Nagad, Rocket, cards and more on the secure EPS page. We deliver on WhatsApp to the mobile number above.</p><a class="co-wa" target="_blank" rel="noopener"></a></form>';
  document.body.appendChild(m);
  var f = $("form", m), er = $(".co-er", m), go = $(".co-go", m), cur = null;
  function close() { m.hidden = true; document.documentElement.style.overflow = ""; }
  function open(a) {
    var d; try { d = JSON.parse(a.dataset.buy); } catch (e) { return false; }
    var price = ($("b", a) || {}).textContent || "", label = d.n + (d.vr ? " · " + d.vr : "") + " · " + d.v;
    cur = { item: { name: d.n, vr: d.vr || undefined, v: d.v, q: 1 }, price: price, label: label };
    $("#co-t").textContent = label; $(".co-pr", m).textContent = price;
    var s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    $("#co-n").value = s.n || ""; $("#co-p").value = s.p || ""; $("#co-e").value = s.e || "";
    er.textContent = ""; go.disabled = false; go.textContent = "Pay " + price + " securely";
    $(".co-wa", m).textContent = "Prefer WhatsApp? Order there instead";
    $(".co-wa", m).href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi StreamX! I want to buy " + label + " (" + price + ").");
    m.hidden = false; document.documentElement.style.overflow = "hidden"; setTimeout(function () { ($("#co-n").value ? $("#co-p") : $("#co-n")).focus(); }, 50); return true;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-buy]");
    if (a && !(e.metaKey || e.ctrlKey || e.shiftKey) && open(a)) e.preventDefault();
    else if (e.target === m || (e.target.closest && e.target.closest("[data-x]"))) close();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !m.hidden) close(); });
  f.addEventListener("submit", function (e) {
    e.preventDefault(); if (!cur) return;
    var name = $("#co-n").value.trim(), phone = $("#co-p").value.replace(/[\s-]/g, ""), email = $("#co-e").value.trim();
    if (name.length < 2) { er.textContent = "Please enter your name."; return; }
    if (!PHONE.test(phone)) { er.textContent = "Enter a valid mobile number, e.g. 01712345678."; return; }
    if (!EMAIL.test(email)) { er.textContent = "Enter a valid email address."; return; }
    er.textContent = ""; go.disabled = true; go.textContent = "Opening secure payment…";
    try { localStorage.setItem(KEY, JSON.stringify({ n: name, p: phone, e: email })); } catch (x) {}
    fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name, phone: phone, email: email, tip: 0, comment: "", items: [cur.item] }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.redirectUrl) throw new Error(j.error || "Online payment is unavailable right now. Please order on WhatsApp."); location.href = j.redirectUrl; }); })
      .catch(function (x) { er.textContent = x.message; go.disabled = false; go.textContent = "Pay " + cur.price + " securely"; });
  });
})();
