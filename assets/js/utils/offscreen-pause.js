/* Pause looping animations in sections that are off-screen. Same look, far fewer repaints, no flicker while scrolling. */
(function () {
  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle("is-off", !e.isIntersecting); });
  }, { rootMargin: "120px 0px" });
  document.querySelectorAll("section, footer").forEach(function (s) { io.observe(s); });
  document.addEventListener("visibilitychange", function () {
    document.documentElement.classList.toggle("tab-hidden", document.hidden);
  });
})();
