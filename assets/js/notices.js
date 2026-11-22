/* Public notice board: filter chips, pinned posts first, grouped by month. Data from /api/catalog?a=notices (posted in Admin → Notice board). */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var KIND = { info: "Update", price: "Price change", offer: "Offer", maintenance: "Maintenance", important: "Important" };
  var ICON = {
    info: '<path d="M12 8v5"/><path d="M12 16.5h.01"/><circle cx="12" cy="12" r="9"/>',
    price: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    offer: '<path d="M20 12v8H4v-8"/><path d="M2 7h20v5H2z"/><path d="M12 20V7"/><path d="M12 7H8a2.5 2.5 0 1 1 0-5c3 0 4 5 4 5zm0 0h4a2.5 2.5 0 1 0 0-5c-3 0-4 5-4 5z"/>',
    maintenance: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    important: '<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17.5h.01"/>'
  };
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
  var ALL = [], cur = (decodeURIComponent(location.hash.slice(1)) || "all");
  var wa = $("#nbWa"); if (wa && typeof WA_NUMBER !== "undefined") wa.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent("Hi StreamX! I have a question about a notice.");
  var fmt = function (d) { return new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric" }); };
  var month = function (d) { return new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", month: "long", year: "numeric" }); };
  var safe = function (u) { return /^(https?:\/\/|\/)/i.test(u || "") && !/^\/\//.test(u) ? u : ""; };
  function card(n, i) {
    var k = KIND[n.k] ? n.k : "info", isNew = Date.now() - Date.parse(n.at) < 3 * 864e5, u = safe(n.l), ext = /^https?:/i.test(u);
    return '<article class="nb-card k-' + k + (n.pin ? " is-pin" : "") + '" style="--i:' + Math.min(i, 12) + '"><span class="nb-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg></span><div>' +
      '<div class="nb-top">' + (n.pin ? '<span class="nb-pin">📌 Pinned</span>' : "") + '<span class="nb-kind">' + KIND[k] + "</span>" + (isNew ? '<span class="nb-new">NEW</span>' : "") + '<time class="nb-date" datetime="' + esc(n.at) + '">' + fmt(n.at) + "</time></div>" +
      "<h2>" + esc(n.t) + "</h2>" + (n.m ? "<p>" + esc(n.m) + "</p>" : "") +
      (u ? '<a class="nb-go" href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + esc(n.ll || "Learn more") + ARROW + "</a>" : "") + "</div></article>";
  }
  function chips() {
    var cnt = { all: ALL.length }; ALL.forEach(function (n) { var k = KIND[n.k] ? n.k : "info"; cnt[k] = (cnt[k] || 0) + 1; });
    $("#nbChips").innerHTML = ["all"].concat(Object.keys(KIND).filter(function (k) { return cnt[k]; })).map(function (k) {
      return '<button type="button" role="tab" data-k="' + k + '" aria-selected="' + (k === cur) + '">' + (k === "all" ? "All" : KIND[k]) + "<b>" + cnt[k] + "</b></button>";
    }).join("");
  }
  function paint() {
    var l = ALL.filter(function (n) { return cur === "all" || (KIND[n.k] ? n.k : "info") === cur; });
    $("#nbCount").textContent = l.length + (l.length === 1 ? " notice" : " notices");
    if (!l.length) { $("#nbList").innerHTML = '<div class="nb-empty"><b>' + (ALL.length ? "Nothing in this category" : "No notices right now") + "</b>" + (ALL.length ? "Try another filter." : "New updates, price changes and offers will be posted here.") + "</div>"; return; }
    var pins = l.filter(function (n) { return n.pin; }), rest = l.filter(function (n) { return !n.pin; }), h = "", last = "", i = 0;
    pins.forEach(function (n) { h += card(n, i++); });
    rest.forEach(function (n) { var m = month(n.at); if (m !== last) { h += '<div class="nb-month">' + m + "</div>"; last = m; } h += card(n, i++); });
    $("#nbList").innerHTML = h;
  }
  $("#nbChips").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; cur = b.dataset.k; try { history.replaceState(null, "", cur === "all" ? location.pathname : "#" + cur); } catch (x) {}
    chips(); paint();
  });
  fetch("/api/catalog?a=notices").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    ALL = (d.list || []).sort(function (a, b) { return Date.parse(b.at) - Date.parse(a.at); });
    if (cur !== "all" && !ALL.some(function (n) { return n.k === cur; })) cur = "all";
    chips(); paint();
  }).catch(function () { $("#nbList").innerHTML = '<div class="nb-empty"><b>Couldn\'t load notices</b>Please refresh in a moment, or message us on WhatsApp.</div>'; });
})();
