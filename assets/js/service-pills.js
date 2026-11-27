/* Service pages (phones): once you scroll into the page, the nav pill widens and shows the page sections (Pricing, About, Reviews, FAQ…) as pills with a sliding highlight.
   It goes back to the small pill after the last section. Tap a pill to jump there. */
(function () {
  "use strict";
  var nav = document.getElementById("spNav"), navin = nav && nav.querySelector(".sp-navin"), nr = navin && navin.querySelector(".sp-nr"), src = nav && nav.querySelector("nav");
  if (!navin || !nr || !src || document.getElementById("hbChips")) return;   // the Services hub has its own category pills
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches, phone = matchMedia("(max-width:640px)");
  var items = [];
  [].forEach.call(src.querySelectorAll("a"), function (a) {
    var h = a.getAttribute("href") || ""; if (h.charAt(0) !== "#" || a.hidden || h === "#contact") return;
    var el = document.getElementById(h.slice(1)); if (el) items.push({ id: h.slice(1), el: el, label: (a.textContent || "").trim() });
  });
  if (items.length < 2) return;
  var row = document.createElement("div"); row.className = "hb-navchips"; row.setAttribute("role", "tablist"); row.setAttribute("aria-label", "Page sections");
  var ind = document.createElement("span"); ind.className = "hb-ind"; ind.setAttribute("aria-hidden", "true"); row.appendChild(ind);
  var btns = items.map(function (it) { var b = document.createElement("button"); b.type = "button"; b.dataset.c = it.id; b.textContent = it.label; row.appendChild(b); return b; });
  navin.insertBefore(row, nr);
  var cur = "", first = true;
  function fade() { var max = row.scrollWidth - row.clientWidth, l = row.scrollLeft; row.style.setProperty("--fl", l > 4 ? "20px" : "0px"); row.style.setProperty("--fr", max > 4 && l < max - 4 ? "24px" : "0px"); }
  function place(instant) {
    var b = btns.filter(function (x) { return x.dataset.c === cur; })[0], inst = instant || reduce;
    if (!b) { ind.style.opacity = 0; return; }
    ind.style.transition = inst ? "none" : ""; ind.style.opacity = 1; ind.style.width = b.offsetWidth + "px"; ind.style.transform = "translate3d(" + b.offsetLeft + "px,0,0)";
    if (row.clientWidth) row.scrollTo({ left: Math.max(0, b.offsetLeft - (row.clientWidth - b.offsetWidth) / 2), behavior: inst ? "auto" : "smooth" });
    fade();
  }
  function set(c, instant) { if (c === cur) return; cur = c; btns.forEach(function (b) { var on = b.dataset.c === c; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); }); place(instant); }
  function pick() {
    var nb = navin.getBoundingClientRect().bottom, c = "";
    items.forEach(function (it) { if (it.el.getBoundingClientRect().top <= nb + 40) c = it.id; });
    set(c, first); first = false;
    var last = items[items.length - 1].el, firstEl = items[0].el;
    var on = phone.matches && firstEl.getBoundingClientRect().top < innerHeight * .55 && last.getBoundingClientRect().bottom > nb + 24;
    if (on !== nav.classList.contains("sp-chipmode")) { nav.classList.toggle("sp-chipmode", on); if (on) { setTimeout(function () { place(true); }, 90); setTimeout(function () { place(true); }, 700); } }
  }
  var tk = false; addEventListener("scroll", function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; pick(); }); } }, { passive: true });
  addEventListener("resize", function () { place(true); pick(); });
  row.addEventListener("scroll", fade, { passive: true });
  row.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) {}
    var it = items.filter(function (i) { return i.id === b.dataset.c; })[0]; if (!it) return;
    set(it.id, false); scrollTo({ top: Math.max(0, it.el.getBoundingClientRect().top + scrollY - 84), behavior: reduce ? "auto" : "smooth" });
  });
  pick();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(true); });
})();
