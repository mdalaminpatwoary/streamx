/* Scroll story: scrolling the tall section pans a stage of six chained scenes. Without this script, or with reduced motion, the page just shows the list of steps. */
(function () {
  "use strict";
  var sec = document.getElementById("journey"); if (!sec) return;
  var stage = sec.querySelector(".nj-stage"), track = sec.querySelector(".nj-track"), slots = [].slice.call(sec.querySelectorAll(".ns")), steps = [].slice.call(sec.querySelectorAll(".nj-copy li"));
  var N = slots.length;
  if (matchMedia("(prefers-reduced-motion:reduce)").matches || !("IntersectionObserver" in window) || !N) return;
  sec.classList.add("nj-on");
  var cur = 0, tgt = 0, raf = 0, W = 0, U = 4.6, near = false, act = -1;
  function size() { W = stage.clientWidth; U = W / 100; stage.style.setProperty("--u", U.toFixed(3) + "px"); paint(); }
  function prog() {
    var r = sec.getBoundingClientRect(), h = r.height - innerHeight; if (h <= 0) return 0;
    var p = Math.min(1, Math.max(0, -r.top / h)); return Math.min(1, Math.max(0, (p - .05) / .9)) * (N - 1);
  }
  function paint() {
    track.style.transform = "translate3d(" + (W / 2 - (cur + .5) * 80 * U).toFixed(1) + "px,0,0)";
    slots.forEach(function (s, i) {
      var d = cur - i, f = Math.max(0, 1 - Math.abs(d)), t = Math.min(1, Math.max(0, d + .5));
      s.style.setProperty("--f", f.toFixed(3)); s.style.setProperty("--t", t.toFixed(3)); s.style.setProperty("--lit", t.toFixed(3));
    });
    var a = Math.min(N - 1, Math.max(0, Math.round(cur)));
    if (a !== act) { act = a; steps.forEach(function (li, i) { li.classList.toggle("on", i === a); }); }
  }
  function loop() { cur += (tgt - cur) * .16; if (Math.abs(tgt - cur) < .0007) { cur = tgt; paint(); raf = 0; return; } paint(); raf = requestAnimationFrame(loop); }
  function onScroll() { if (!near) return; tgt = prog(); if (!raf) raf = requestAnimationFrame(loop); }
  new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) { tgt = prog(); cur = tgt; paint(); } }, { rootMargin: "20% 0px 20% 0px" }).observe(sec);
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", function () { size(); onScroll(); });
  steps.forEach(function (li, i) {
    li.addEventListener("click", function () {
      var top = sec.getBoundingClientRect().top + scrollY, h = sec.offsetHeight - innerHeight;
      scrollTo({ top: top + ((i / (N - 1)) * .9 + .05) * h, behavior: "smooth" });
    });
  });
  size(); tgt = cur = prog(); paint();
})();
