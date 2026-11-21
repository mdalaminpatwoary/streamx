/* Lets the chat assistant order from service pages: same cart (sx_cart) and checkout as the service page itself. */
(function () {
  function item(i, v, k) { var p = PRODUCTS[i], vr = p.variants[v], pl = vr.plans[k], vn = p.variants.length > 1 ? vr.n : ""; return { i: [p.name, vr.n, pl.v].join("|"), n: p.name, vr: vn, v: pl.v, p: pl.p }; }
  window.addToCart = function (i, v, k) { if (window.spCart) window.spCart.add(item(i, v, k)); };
  window.buyNow = function (i, v, k) { var d = item(i, v, k); if (!window.spCart) { location.href = "/#plan=" + slug(PRODUCTS[i].name) + "&v=" + v + "&k=" + k; return; } if (!window.spCart.has(d.i)) window.spCart.add(d); window.spCart.pay(); };
  window.openCart = function () { if (window.spCart) window.spCart.open(); };
})();
