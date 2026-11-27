/* Services hub (/services/): live search, category chips and a result count. Cards are plain links in the page, so it works for search engines without this script. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var q = $("#hbQ"), x = $("#hbX"), chips = $("#hbChips"), count = $("#hbCount"), none = $("#hbNone");
  var cards = [].slice.call(document.querySelectorAll(".hb-card")), secs = [].slice.call(document.querySelectorAll(".hb-sec")), adults = $("#adults");
  var cat = "all", qv = function () { return q ? q.value : ""; };
  var norm = function (t) { return String(t || "").toLowerCase().replace(/[^a-z0-9+ ]+/g, " ").replace(/\s+/g, " ").trim(); };
  function run() {
    var words = norm(qv()).split(" ").filter(Boolean), shown = 0;
    cards.forEach(function (c) {
      var sec = c.closest(".hb-sec"), ok = (cat === "all" || sec.dataset.c === cat) && words.every(function (w) { return c.dataset.s.indexOf(w) > -1; });
      c.hidden = !ok; if (ok) shown++;
    });
    secs.forEach(function (s) { var n = s.querySelectorAll(".hb-card:not([hidden])").length; s.hidden = !n; var l = s.querySelector(".hb-sn"); if (l) l.textContent = n + (n === 1 ? " service" : " services"); });
    if (adults) adults.hidden = words.length > 0 || cat !== "all";
    if (x) x.hidden = !qv();
    none.hidden = shown > 0; var hT = $("#hbT"); if (hT) hT.textContent = qv().trim() ? ' for "' + qv().trim().slice(0, 40) + '"' : "";
    var wa = $("#hbWa"); if (wa && qv().trim()) wa.href = wa.href.split("?")[0] + "?text=" + encodeURIComponent("Hi StreamX! Do you have " + qv().trim().slice(0, 60) + "?");
    count.textContent = words.length || cat !== "all" ? shown + (shown === 1 ? " service" : " services") : "";
    try { var u = new URL(location.href); if (qv().trim()) u.searchParams.set("q", qv().trim()); else u.searchParams.delete("q"); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (e) {}
  }
  if (q) q.addEventListener("input", run);
  if ($("#hbForm")) $("#hbForm").addEventListener("submit", function (e) { e.preventDefault(); var f = $(".hb-card:not([hidden])"); if (f && qv().trim() && cards.filter(function (c) { return !c.hidden; }).length === 1) location.href = f.href; });
  if (x) x.addEventListener("click", function () { q.value = ""; run(); q.focus(); });
  chips.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; cat = b.dataset.c;
    [].forEach.call(chips.children, function (k) { var on = k === b; k.classList.toggle("on", on); k.setAttribute("aria-selected", on); });
    run(); var first = $(".hb-sec:not([hidden])"); if (first && cat !== "all") { var y = first.getBoundingClientRect().top + scrollY - 130; scrollTo({ top: y, behavior: "smooth" }); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !/input|textarea|select/i.test((e.target.tagName || ""))) { e.preventDefault(); if (q) q.focus(); }
    if (q && e.key === "Escape" && document.activeElement === q) { q.value = ""; run(); q.blur(); }
  });
  var pre = new URLSearchParams(location.search).get("q"); if (pre && q) q.value = pre.slice(0, 60);
  run();
})();
