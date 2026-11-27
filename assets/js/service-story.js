/* Scroll story: scrolling the tall section pans a stage of six chained scenes. Without this script, or with reduced motion, the page just shows the list of steps. */
(function () {
  "use strict";
  var sec = document.getElementById("journey"); if (!sec) return;
  var stage = sec.querySelector(".nj-stage"), track = sec.querySelector(".nj-track"), slots = [].slice.call(sec.querySelectorAll(".ns")), steps = [].slice.call(sec.querySelectorAll(".nj-copy li"));
  var N = slots.length, labels = ["Choose", "Pay", "Confirm", "Prepare", "Deliver", "Watch"];
  if (matchMedia("(prefers-reduced-motion:reduce)").matches || !("IntersectionObserver" in window) || !N) return;
  sec.classList.add("nj-on");
  var CTA = ["Choose plan", "Pay now", "Order now", "Order now", "Order now", "Get started"], dock = document.createElement("div");
  dock.className = "nj-dock"; dock.setAttribute("aria-hidden", "true");
  dock.innerHTML = '<div class="dk-seg">' + steps.map(function () { return "<i><u></u></i>"; }).join("") + '</div><div class="dk-row"><span class="dk-n"><b>1</b><small>/ ' + N + '</small></span><span class="dk-t"></span><a class="dk-go" href="#plans"></a></div>';
  document.body.appendChild(dock);
  var dn = dock.querySelector(".dk-n b"), dt = dock.querySelector(".dk-t"), dg = dock.querySelector(".dk-go"), dsegs = [].slice.call(dock.querySelectorAll(".dk-seg u")), pinned = false;
  function dockPaint() {
    var r = sec.getBoundingClientRect(), on = r.top <= 8 && r.bottom >= innerHeight - 8;
    if (on !== pinned) { pinned = on; dock.classList.toggle("on", on); document.documentElement.classList.toggle("nj-dock-on", on); }
    dsegs.forEach(function (u, i) { u.style.transform = "scaleX(" + Math.min(1, Math.max(0, cur - i + .5)).toFixed(3) + ")"; });
  }
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
      s.style.setProperty("--d", Math.max(-1, Math.min(1, d)).toFixed(3)); s.style.setProperty("--f", f.toFixed(3)); s.style.setProperty("--t", t.toFixed(3)); s.style.setProperty("--lit", t.toFixed(3));
    });
    dockPaint();
    var a = Math.min(N - 1, Math.max(0, Math.round(cur)));
    if (a !== act) { act = a; dn.textContent = a + 1; dt.textContent = labels[a]; dg.textContent = CTA[a]; steps.forEach(function (li, i) { li.classList.toggle("on", i === a); }); }
  }
  function loop() { cur += (tgt - cur) * .16; if (Math.abs(tgt - cur) < .0007) { cur = tgt; paint(); raf = 0; return; } paint(); raf = requestAnimationFrame(loop); }
  function onScroll() { if (!near) return; tgt = prog(); if (!raf) raf = requestAnimationFrame(loop); }
  new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (!near) dockPaint(); if (near) { tgt = prog(); cur = tgt; paint(); } }, { rootMargin: "20% 0px 20% 0px" }).observe(sec);
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", function () { size(); onScroll(); });
  steps.forEach(function (li, i) {
    li.addEventListener("click", function () {
      var top = sec.getBoundingClientRect().top + scrollY, h = sec.offsetHeight - innerHeight;
      scrollTo({ top: top + ((i / (N - 1)) * .9 + .05) * h, behavior: "smooth" });
    });
  });
  size(); tgt = cur = prog(); paint();
})();
