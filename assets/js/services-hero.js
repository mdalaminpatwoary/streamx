/* Services hub hero: stats count up, hero layer drifts with scroll, cards and headings reveal in sequence. Everything is optional: without IntersectionObserver or with reduced motion the page just shows normally. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var hero = document.querySelector(".hb-hero"); if (!hero) return;
  var fx = hero.querySelector(".hx-fx");

  /* stats count up once */
  if (!reduce) [].forEach.call(hero.querySelectorAll(".hb-stats b"), function (b, k) {
    var to = parseInt(b.textContent, 10); if (!(to > 0) || String(to) !== b.textContent.trim()) return;
    var t0 = performance.now() + 350 + k * 120, D = 1100; b.textContent = "0";
    (function tick(now) {
      var p = Math.max(0, Math.min(1, (now - t0) / D)), e = 1 - Math.pow(1 - p, 3);
      b.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  });

  /* hero layer drifts slower than the page */
  if (fx && !reduce) {
    var tk = false;
    addEventListener("scroll", function () {
      if (tk) return; tk = true;
      requestAnimationFrame(function () { tk = false; var y = Math.min(scrollY, 500); fx.style.setProperty("--hy", (y * .22).toFixed(1)); });
    }, { passive: true });
  }

  /* reveal on scroll */
  if (reduce || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("hx-js");
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -6% 0px", threshold: .05 });
  [].forEach.call(document.querySelectorAll(".hb-sh"), function (el) { io.observe(el); });
  [].forEach.call(document.querySelectorAll(".hb-grid"), function (g) {
    [].forEach.call(g.querySelectorAll(".hb-card"), function (c, i) { c.style.transitionDelay = Math.min(i % 8, 7) * 55 + "ms,"+ Math.min(i % 8, 7) * 55 + "ms,0s,0s"; io.observe(c); });
  });
})();
