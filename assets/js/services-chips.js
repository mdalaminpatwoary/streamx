/* Services hub category pills: sticky bar, one highlight that glides between pills, auto-highlight while scrolling, tap = smooth scroll to that section,
   soft edge fade on the sideways-scrolling row. Replaces the old filter behaviour (every section stays on the page). */
(function () {
  "use strict";
  var bar = document.getElementById("hbBar"), row = document.getElementById("hbChips");
  if (!bar || !row) return;
  var btns = [].slice.call(row.querySelectorAll("button")), reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var secs = {}; [].forEach.call(document.querySelectorAll(".hb-sec"), function (s) { secs[s.dataset.c] = s; });
  var ind = document.createElement("span"); ind.className = "hb-ind"; ind.setAttribute("aria-hidden", "true"); row.insertBefore(ind, row.firstChild);
  document.documentElement.classList.add("hx-chip");
  var cur = null, first = true;

  function place(b, instant) {
    ind.style.transition = (instant || reduce) ? "none" : "";
    ind.style.width = b.offsetWidth + "px"; ind.style.transform = "translate3d(" + b.offsetLeft + "px,0,0)";
    var l = b.offsetLeft - (row.clientWidth - b.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, l), behavior: (instant || reduce) ? "auto" : "smooth" });
  }
  function set(c, instant) {
    if (c === cur) return; cur = c;
    var on = btns.filter(function (b) { return b.dataset.c === c; })[0] || btns[0];
    btns.forEach(function (b) { var is = b === on; b.classList.toggle("on", is); b.setAttribute("aria-selected", is); });
    place(on, instant);
  }
  function stickTop() { return parseFloat(getComputedStyle(bar).top) || 0; }
  function offset() { return stickTop() + bar.offsetHeight + 8; }
  function pick() {
    var y = offset() + 24, c = "all";
    Object.keys(secs).forEach(function (k) { if (secs[k].getBoundingClientRect().top <= y) c = k; });
    // bottom of the page: last section is the active one
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) { var ks = Object.keys(secs); if (ks.length) c = ks[ks.length - 1]; }
    set(c, first); first = false;
    bar.classList.toggle("stuck", bar.getBoundingClientRect().top <= stickTop() + 1);
  }
  var tk = false; addEventListener("scroll", function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; pick(); }); } }, { passive: true });
  addEventListener("resize", function () { var b = btns.filter(function (x) { return x.classList.contains("on"); })[0]; if (b) place(b, true); fade(); });

  row.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) {}
    var c = b.dataset.c, s = secs[c], y = 0;
    if (c !== "all" && s) y = s.getBoundingClientRect().top + scrollY - offset() + 10;
    else { var f = document.querySelector(".hb-sec"); y = f ? f.getBoundingClientRect().top + scrollY - offset() - 6 : 0; if (y < 0) y = 0; }
    set(c, false);
    scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
  });

  function fade() {
    var max = row.scrollWidth - row.clientWidth, l = row.scrollLeft;
    row.style.setProperty("--fl", l > 4 ? "26px" : "0px"); row.style.setProperty("--fr", l < max - 4 ? "30px" : "0px");
  }
  row.addEventListener("scroll", fade, { passive: true });
  fade(); pick();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { var b = btns.filter(function (x) { return x.classList.contains("on"); })[0]; if (b) place(b, true); fade(); });
})();
