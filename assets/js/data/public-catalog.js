/* The public pages do not list 18+ services (they have their own separate page). Runs right after catalog.js; the admin, account and checkout keep the full catalog. */
(function () {
  for (var i = PRODUCTS.length - 1; i >= 0; i--) if (PRODUCTS[i].cat === "18+") PRODUCTS.splice(i, 1);
  var k = CATS.indexOf("18+"); if (k > -1) CATS.splice(k, 1);
})();
