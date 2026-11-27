/* Services hub category pills: one highlight that glides between pills, auto-highlight while scrolling, tap = smooth scroll to that section, soft edge fade.
   On phones, once the in-page row scrolls under the top bar, the nav pill widens and the same pills move into it. */
(function () {
  "use strict";
  var bar = document.getElementById("hbBar"), row = document.getElementById("hbChips");
  if (!bar || !row) return;
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches, phone = matchMedia("(max-width:640px)");
  var nav = document.querySelector(".sp-nav"), navin = nav && nav.querySelector(".sp-navin"), nr = navin && navin.querySelector(".sp-nr");
  var secs = {}; [].forEach.call(document.querySelectorAll(".hb-sec"), function (s) { secs[s.dataset.c] = s; });
  var rows = [row];
  if (navin && nr) { var r2 = document.createElement("div"); r2.className = "hb-navchips"; r2.setAttribute("role", "tablist"); r2.setAttribute("aria-label", "Filter by category"); r2.innerHTML = row.innerHTML; navin.insertBefore(r2, nr); rows.push(r2); }
  var R = rows.map(function (el) {
    var ind = document.createElement("span"); ind.className = "hb-ind"; ind.setAttribute("aria-hidden", "true"); el.insertBefore(ind, el.firstChild);
    return { el: el, ind: ind, btns: [].slice.call(el.querySelectorAll("button")) };
  });
  document.documentElement.classList.add("hx-chip");
  var cur = null, first = true;

  function place(r, b, instant) {
    var inst = instant || reduce;
    r.ind.style.transition = inst ? "none" : "";
    r.ind.style.width = b.offsetWidth + "px"; r.ind.style.transform = "translate3d(" + b.offsetLeft + "px,0,0)";
    if (r.el.clientWidth) r.el.scrollTo({ left: Math.max(0, b.offsetLeft - (r.el.clientWidth - b.offsetWidth) / 2), behavior: inst ? "auto" : "smooth" });
  }
  function placeAll(instant) { R.forEach(function (r) { var b = r.btns.filter(function (x) { return x.dataset.c === cur; })[0] || r.btns[0]; if (b) place(r, b, instant); fade(r); }); }
  function set(c, instant) {
    if (c === cur) return; cur = c;
    R.forEach(function (r) { r.btns.forEach(function (b) { var is = b.dataset.c === c; b.classList.toggle("on", is); b.setAttribute("aria-selected", is); }); });
    placeAll(instant);
  }
  function offset() { var nb = navin ? navin.getBoundingClientRect().bottom : 0; return nb + 12; }
  function pick() {
    var y = offset() + 24, c = "all";
    Object.keys(secs).forEach(function (k) { if (secs[k].getBoundingClientRect().top <= y) c = k; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) { var ks = Object.keys(secs); if (ks.length) c = ks[ks.length - 1]; }
    set(c, first); first = false;
    if (nav) {
      var nb = navin ? navin.getBoundingClientRect().bottom : 0, ks2 = Object.keys(secs), lastSec = ks2.length ? secs[ks2[ks2.length - 1]] : null;
      // pills live in the nav pill only while the category list is on screen: back to the small pill once the last section (Bundles) is behind it
      var on = phone.matches && bar.getBoundingClientRect().bottom < nb + 6 && (!lastSec || lastSec.getBoundingClientRect().bottom > nb + 24);
      if (on !== nav.classList.contains("sp-chipmode")) { nav.classList.toggle("sp-chipmode", on); if (on) { setTimeout(function () { placeAll(true); }, 90); setTimeout(function () { placeAll(true); }, 700); } }
    }
  }
  var tk = false; addEventListener("scroll", function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; pick(); }); } }, { passive: true });
  addEventListener("resize", function () { placeAll(true); pick(); });

  R.forEach(function (r) {
    r.el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) {}
      var c = b.dataset.c, s = secs[c], y;
      if (c !== "all" && s) y = s.getBoundingClientRect().top + scrollY - (phone.matches ? 86 : offset()) + 6;
      else { var f = document.querySelector(".hb-sec"); y = f ? f.getBoundingClientRect().top + scrollY - offset() - 6 : 0; }
      set(c, false);
      scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
    });
    r.el.addEventListener("scroll", function () { fade(r); }, { passive: true });
  });
  function fade(r) {
    var max = r.el.scrollWidth - r.el.clientWidth, l = r.el.scrollLeft;
    r.el.style.setProperty("--fl", l > 4 ? "22px" : "0px"); r.el.style.setProperty("--fr", max > 4 && l < max - 4 ? "26px" : "0px");
  }
  pick(); placeAll(true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeAll(true); });
})();
