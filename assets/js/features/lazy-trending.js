/* Trending is loaded only when the visitor scrolls near it (about 1.5 screens before), so it never slows the first paint. */
(function () {
  var sent = document.getElementById("trSent"), done = false;
  if (!sent) return;
  function go() {
    if (done) return; done = true;
    ["assets/css/sections/trending.css?v=20261123a", "assets/css/title-sheet.css?v=11"].forEach(function (h) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = h; document.head.appendChild(l); });
    ["assets/js/features/trending.js?v=20261125a", "assets/js/features/mylist.js?v=2", "assets/js/features/title-sheet.js?v=20"].reduce(function (p, src) {
      return p.then(function () { return new Promise(function (ok) { var s = document.createElement("script"); s.src = src; s.onload = s.onerror = ok; document.body.appendChild(s); }); });
    }, Promise.resolve());
  }
  if (location.hash === "#trending" || !("IntersectionObserver" in window)) { setTimeout(go, 1500); return; }
  new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: "0px 0px 1200px 0px" }).observe(sent);
})();
