/* Cart on service pages. Uses the same browser storage ("sx_cart") as the home page, so both always match. */
(function () {
  "use strict";
  var KEY = "sx_cart";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var taka = function (n) { return "৳" + Number(n).toLocaleString("en-US"); };
  var cart = [];
  function load() { try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; } if (!Array.isArray(cart)) cart = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function toast(m) { var t = document.createElement("div"); t.className = "sp-toast"; t.textContent = m; document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add("on"); }); setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 300); }, 2200); }
  var CART = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';

  /* Drawer */
  var ov = document.createElement("div"); ov.className = "sc-ov";
  var dr = document.createElement("aside"); dr.className = "sc-dr"; dr.setAttribute("aria-label", "Cart"); dr.setAttribute("aria-hidden", "true");
  var TRASH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
  dr.innerHTML = '<div class="sc-h"><h3>' + CART + ' Your Cart <small id="sc-sub"></small></h3><span class="sc-act"><button type="button" class="sc-clr" id="sc-clr" aria-label="Clear cart" title="Clear cart" hidden>' + TRASH + '</button><button type="button" class="sc-x" aria-label="Close cart">✕</button></span></div><div class="sc-items" id="sc-items"></div>' +
    '<div class="sc-f"><div class="sc-pr"><div class="sc-t"><span>Total</span><b id="sc-tot">৳0</b></div><button type="button" class="sc-pay" id="sc-pay"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg><span>Pay online</span></button></div><a class="sc-wa" id="sc-wa" target="_blank" rel="noopener" href="#">Order on WhatsApp instead ↗</a><p class="sc-tr"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>Secure checkout · Delivery right after payment</p></div>';
  document.body.appendChild(ov); document.body.appendChild(dr);
  /* Product logos in the cart (logos.js is already loaded on service pages) */
  function logoOf(c) {
    try {
      var L = typeof LOGOS !== "undefined" && typeof LOGO_OF !== "undefined" ? LOGOS[LOGO_OF[c.name]] : null;
      if (L) return '<span class="sc-lg" style="background:' + L.bg + '"><svg viewBox="' + L.vb + '" fill="' + L.fg + '" aria-hidden="true"><path d="' + L.p + '"/></svg></span>';
      var h = document.querySelector(".sp-hcard .sp-logo"), t = document.querySelector(".sp-hcard .sp-hc-top b");
      if (h && t && t.textContent === c.name) return '<span class="sc-lg">' + h.outerHTML + "</span>";
    } catch (e) {}
    return '<span class="sc-lg" style="background:#1e2545"><b>' + esc(c.name.charAt(0)) + "</b></span>";
  }
  function openD(o) { dr.classList.toggle("on", o); ov.classList.toggle("on", o); dr.setAttribute("aria-hidden", o ? "false" : "true"); document.documentElement.style.overflow = o ? "hidden" : ""; }

  function render() {
    var n = cart.reduce(function (s, c) { return s + c.q; }, 0), total = cart.reduce(function (s, c) { return s + c.q * c.p; }, 0);
    var b = $("#spCartN"); if (b) { b.textContent = n; b.hidden = !n; }
    var cb = $("#spCart"); if (cb && document.querySelector(".hb-hero")) cb.hidden = !n;   // All services page: nothing to add here, so the cart button only shows when the cart has items
    $("#sc-sub").textContent = n ? "· " + n + " item" + (n > 1 ? "s" : "") : ""; $("#sc-clr").hidden = !n;
    $("#sc-items").innerHTML = cart.length ? cart.map(function (c, j) {
      return '<div class="sc-i">' + logoOf(c) + '<div class="sc-n"><b>' + esc(c.name) + '</b><small>' + (c.vr ? esc(c.vr) + " · " : "") + esc(c.v) + " · " + taka(c.p) + '</small></div><div class="sc-q"><button type="button" data-q="' + j + '" data-d="-1" aria-label="Decrease">−</button><span>' + c.q + '</span><button type="button" data-q="' + j + '" data-d="1" aria-label="Increase">+</button></div><button type="button" class="sc-rm" data-rm="' + j + '" aria-label="Remove ' + esc(c.name) + '">✕</button></div>';
    }).join("") : '<div class="sc-e"><span class="sc-eb">' + CART + '</span><p>Your cart is empty.<br>Add a plan to get started.</p></div>';
    $("#sc-tot").textContent = taka(total);
    $("#sc-pay").disabled = !cart.length;
    var wa = $("#sc-wa"); wa.classList.toggle("off", !cart.length);
    wa.href = cart.length ? "https://wa.me/8801312850241?text=" + encodeURIComponent("Hi StreamX! I want to order:\n" + cart.map(function (c, j) { return (j + 1) + ". " + c.name + (c.vr ? " – " + c.vr : "") + " (" + c.v + ") x" + c.q + " - " + taka(c.p * c.q); }).join("\n") + "\nTotal: " + taka(total)) : "#";
    save();
  }
  function add(d) {
    load();
    var x = cart.find(function (c) { return c.id === d.i; });
    if (x) x.q++; else cart.push({ id: d.i, name: d.n, vr: d.vr || "", v: d.v, p: d.p, q: 1 });
    render(); if (window.sxCartPop) sxCartPop(d.n + (d.vr ? " – " + d.vr : ""), d.v, d.n); else toast("✓ " + d.n + (d.vr ? " – " + d.vr : "") + " (" + d.v + ") added to cart");
    var c = $("#spCart"); if (c) { c.classList.remove("sp-bump"); void c.offsetWidth; c.classList.add("sp-bump"); }
  }

  /* Add-to-cart button beside every plan row */
  document.querySelectorAll(".sp-row[data-buy]").forEach(function (a) {
    var d; try { d = JSON.parse(a.dataset.buy); } catch (e) { return; }
    if (!d.i || !d.p) return;
    var w = document.createElement("div"); w.className = "sp-rw"; a.parentNode.insertBefore(w, a); w.appendChild(a);
    var b = document.createElement("button"); b.type = "button"; b.className = "sp-add"; b.setAttribute("aria-label", "Add " + d.n + " " + d.v + " to cart"); b.title = "Add to cart"; b.innerHTML = CART;
    b.addEventListener("click", function () { add(d); }); w.appendChild(b);
  });

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest && t.closest("#spCart")) { load(); render(); openD(true); if (window.spData && typeof LOGOS === "undefined") window.spData().then(render); return; }
    if (t === ov || (t.closest && t.closest(".sc-x"))) { openD(false); return; }
    var q = t.closest && t.closest("[data-q]"), r = t.closest && t.closest("[data-rm]");
    if (q) { var j = +q.dataset.q; load(); if (cart[j]) { cart[j].q += +q.dataset.d; if (cart[j].q < 1) cart.splice(j, 1); } render(); }
    else if (r) { load(); cart.splice(+r.dataset.rm, 1); render(); }
  });
  $("#sc-clr").addEventListener("click", function () { cart = []; render(); });
  $("#sc-pay").addEventListener("click", function () {
    load(); if (!cart.length || !window.spCheckout) return;
    var items = cart.map(function (c) { return { name: c.name, vr: c.vr, v: c.v, q: c.q, label: c.name + (c.vr ? " · " + c.vr : "") + " · " + c.v, priceTxt: taka(c.p * c.q) }; });
    var total = taka(cart.reduce(function (s, c) { return s + c.q * c.p; }, 0));
    openD(false); window.spCheckout(items, total, "Cart");
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") openD(false); });
  window.addEventListener("storage", function (e) { if (e.key === KEY) { load(); render(); } });
  window.addEventListener("pageshow", function (e) { if (e.persisted) { load(); render(); } });
  window.spCart = { add: add, has: function (id) { load(); return cart.some(function (c) { return c.id === id; }); }, open: function () { load(); render(); openD(true); }, pay: function () { $("#sc-pay").click(); } };
  load(); render();
})();
