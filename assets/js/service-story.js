/* Scroll story: scrolling the tall section pans a stage of six chained scenes. Without this script, or with reduced motion, the page just shows the list of steps. */
(function () {
  "use strict";
  (function () {
    var card = document.querySelector(".nf-card"); if (!card) return;
    var lab = card.querySelector(".nfc-price small"), out = card.querySelector("[data-nfp]"), bs = [].slice.call(card.querySelectorAll(".nfc-seg button"));
    bs.forEach(function (b) { b.addEventListener("click", function () {
      bs.forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      out.textContent = b.getAttribute("data-p"); var dv = card.querySelector(".nfc-dev"); if (dv) dv.setAttribute("data-tv", b.getAttribute("data-tv") || "0"); lab.textContent = bs.indexOf(b) ? "Price" : "Starting from"; out.classList.remove("pop"); void out.offsetWidth; out.classList.add("pop");
    }); });
  })();
  (function () {
    var hero = document.querySelector(".nf .sp-hero"); if (!hero || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (es) { document.body.classList.toggle("nf-hero", es[0].isIntersecting); }, { threshold: .2 }).observe(hero);
  })();
  var sec = document.getElementById("journey"); if (!sec) return;
  var stage = sec.querySelector(".nj-stage"), track = sec.querySelector(".nj-track"), slots = [].slice.call(sec.querySelectorAll(".ns")), steps = [].slice.call(sec.querySelectorAll(".nj-copy li"));
  var N = slots.length, labels = ["Choose", "Pay", "Confirm", "Prepare", "Deliver", "Watch"];
  if (matchMedia("(prefers-reduced-motion:reduce)").matches || !("IntersectionObserver" in window) || !N) return;
  sec.classList.add("nj-on");
  var CTA = ["Choose plan", "Pay now", "Order now", "Order now", "Order now", "Get started"], dock = document.createElement("div");
  dock.className = "nj-dock"; dock.setAttribute("aria-hidden", "true");
  dock.innerHTML = '<div class="dk-seg">' + steps.map(function () { return "<i><u></u></i>"; }).join("") + '</div><div class="dk-row"><span class="dk-n"><b>1</b><small>/ ' + N + '</small></span><span class="dk-t"></span><a class="dk-go" href="#plans"></a></div>';
  var dn = dock.querySelector(".dk-n b"), dt = dock.querySelector(".dk-t"), dg = dock.querySelector(".dk-go"), dsegs = [].slice.call(dock.querySelectorAll(".dk-seg u")), pinned = false;
  function dockPaint() {
    var r = sec.getBoundingClientRect(), on = r.top <= 8 && r.bottom >= NV - 8;
    if (on !== pinned) { pinned = on; dock.classList.toggle("on", on); document.documentElement.classList.toggle("nj-dock-on", on); }
    dsegs.forEach(function (u, i) { u.style.transform = "scaleX(" + Math.min(1, Math.max(0, cur - i + .5)).toFixed(3) + ")"; });
  }
  var cur = 0, tgt = 0, raf = 0, W = 0, U = 4.6, near = false, act = -1;
  var D = 70, XS = [0, 1, 2, 3, 4, 5].map(function (i) { return (i % 2 ? 1 : -1) * 17; }), FY = 62, segs = [], rings = [];
  (function build() {
    var f = document.createElement("i"); f.className = "w-floor"; track.appendChild(f);
    for (var i = 0; i < N - 1; i++) { var g = document.createElement("i"); g.className = "w-seg"; track.appendChild(g); segs.push(g); }
    slots.forEach(function (sl) { var r = document.createElement("i"); r.className = "w-ring"; track.appendChild(r); rings.push(r); });
    for (var k = 0; k < 24; k++) { var d = document.createElement("i"); d.className = "w-dot"; d.style.setProperty("--x", ((Math.random() - .5) * 190).toFixed(1)); d.style.setProperty("--y", (Math.random() * 78 - 22).toFixed(1)); d.style.setProperty("--z", (-Math.random() * D * (N + .5) + 40).toFixed(1)); d.style.setProperty("--s", (.5 + Math.random() * 1.1).toFixed(2)); track.appendChild(d); }
  })();
  function place() {
    var u = U; slots.forEach(function (sl, i) { sl.style.transform = "translate3d(" + (XS[i] * u).toFixed(1) + "px,0," + (-i * D * u).toFixed(1) + "px)"; rings[i].style.transform = "translate3d(" + (XS[i] * u).toFixed(1) + "px," + (FY * u).toFixed(1) + "px," + (-i * D * u).toFixed(1) + "px) rotateX(90deg)"; });
    segs.forEach(function (g, i) {
      var dx = (XS[i + 1] - XS[i]) * u, dz = -D * u, len = Math.sqrt(dx * dx + dz * dz), a = Math.atan2(-dz, dx) * 180 / Math.PI;
      g.style.width = len.toFixed(1) + "px"; g.style.transform = "translate3d(" + (XS[i] * u).toFixed(1) + "px," + (FY * u).toFixed(1) + "px," + (-i * D * u).toFixed(1) + "px) rotateY(" + a.toFixed(2) + "deg) rotateX(90deg)";
    });
  }
  var NV = innerHeight, LW = innerWidth;
  function lock() { NV = innerHeight; LW = innerWidth; sec.style.setProperty("--nvh", NV + "px"); }
  lock();
  function size() { W = stage.clientWidth; U = W / 100; stage.style.setProperty("--u", U.toFixed(3) + "px"); place(); paint(); }
  function prog() {
    var r = sec.getBoundingClientRect(), h = r.height - NV; if (h <= 0) return 0;
    var p = Math.min(1, Math.max(0, -r.top / h)); return Math.min(1, Math.max(0, (p - .04) / .78)) * (N - 1) + Math.min(1, Math.max(0, (p - .82) / .18));
  }
  function lerpX(c) { var a = Math.max(0, Math.min(N - 1, c)), i = Math.floor(a), k = Math.min(N - 1, i + 1), t = a - i, e = t * t * (3 - 2 * t); return XS[i] + (XS[k] - XS[i]) * e; }
  function dwell(c) { var i = Math.floor(c), f = c - i, g = f < .34 ? 0 : f > .66 ? 1 : (f - .34) / .32; g = g * g * (3 - 2 * g); return Math.min(N - 1, i + g); }
  function paint() {
    var ex = Math.max(0, cur - (N - 1)), cb = dwell(Math.min(cur, N - 1)), cam = cb + ex * 1.3, cx = lerpX(cb), sway = (lerpX(cb + .02) - lerpX(cb - .02)) * 6;
    track.style.transform = "rotateX(-7deg) rotateY(" + (sway * -.6).toFixed(2) + "deg) translate3d(" + (-cx * U).toFixed(1) + "px," + (-(4 + ex * 6) * U).toFixed(1) + "px," + (cam * D * U).toFixed(1) + "px)";
    slots.forEach(function (s, i) {
      var d = cb - i; if (Math.abs(d) > 2.3) { if (s._far) return; s._far = 1; } else s._far = 0; var a = -d, f = Math.max(0, 1 - Math.abs(d)), t = Math.min(1, Math.max(0, cur - i + .5));
      var o = a >= 0 ? Math.max(0, 1 - a * .52) : Math.max(0, 1 - d / .45);
      s.style.setProperty("--d", Math.max(-1, Math.min(1, d)).toFixed(3)); s.style.setProperty("--f", f.toFixed(3)); s.style.setProperty("--t", t.toFixed(3)); s.style.setProperty("--o", o.toFixed(3)); s.style.setProperty("--bl", (Math.max(0, a) * 1.1).toFixed(2) + "px");
      s.style.setProperty("--ry", ((XS[i] > 0 ? -1 : 1) * 14 * Math.min(1, Math.abs(d) + .35)).toFixed(2) + "deg");
      rings[i].style.setProperty("--f", f.toFixed(3));
      if (segs[i]) segs[i].style.setProperty("--lit", Math.min(1, Math.max(0, cur - i)).toFixed(3));
    });
    sec.style.setProperty("--ex", ex.toFixed(3));
    dockPaint();
    var a2 = Math.min(N - 1, Math.max(0, Math.round(cur)));
    if (a2 !== act) { act = a2; dn.textContent = a2 + 1; dt.textContent = labels[a2]; dg.textContent = CTA[a2]; steps.forEach(function (li, i) { li.classList.toggle("on", i === a2); }); }
  }
  function loop() { cur += (tgt - cur) * .16; if (Math.abs(tgt - cur) < .0007) { cur = tgt; paint(); raf = 0; return; } paint(); raf = requestAnimationFrame(loop); }
  function onScroll() { if (!near) return; tgt = prog(); if (!raf) raf = requestAnimationFrame(loop); }
  new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (!near) dockPaint(); if (near) { tgt = prog(); cur = tgt; paint(); } }, { rootMargin: "20% 0px 20% 0px" }).observe(sec);
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", function () { if (innerWidth === LW) return; lock(); size(); onScroll(); });
  steps.forEach(function (li, i) {
    li.addEventListener("click", function () {
      var top = sec.getBoundingClientRect().top + scrollY, h = sec.offsetHeight - NV;
      scrollTo({ top: top + ((i / (N - 1)) * .9 + .05) * h, behavior: "smooth" });
    });
  });
  size(); tgt = cur = prog(); paint();
})();
