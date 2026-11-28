/* Featured review spotlight for story pages: the same design and timing as the home page,
   filled in the browser with the reviews of this one service. */
(function () {
  var box = document.getElementById("pop"); if (!box) return;
  var svc = box.getAttribute("data-svc"), sec = document.getElementById("reviews"), sub = sec && sec.querySelector(".sp-sub");
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var GR = [["#ED3124", "#B4233C"], ["#4F6BFF", "#1E2F8F"], ["#FF6F61", "#D9363E"], ["#2DD4BF", "#0E6E80"], ["#8B9DFF", "#3B4BC8"], ["#FF5B4D", "#8E2A5C"], ["#34D399", "#0B6B4B"], ["#60A5FA", "#1D4ED8"]];
  var grad = function (i) { return "--c1:" + GR[i % GR.length][0] + ";--c2:" + GR[i % GR.length][1]; };
  var ini = function (n) { return String(n).split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase(); };
  var slug = function (n) { return String(n).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var ph = function (r) { return r.photo ? '<img src="' + esc(r.photo) + '" alt="' + esc(r.n) + '" loading="lazy" onerror="this.remove()">' : ""; };
  var cname = function (c) { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c) || c; } catch (e) { return c; } };
  var flag = function (c) { return c && /^[A-Z]{2}$/.test(c) ? '<img class="fl-i" src="https://flagcdn.com/w40/' + c.toLowerCase() + '.png" alt="" width="20" height="15" loading="lazy" onerror="this.remove()">' : ""; };
  var QUOTE = '<svg class="rs-q" viewBox="0 0 48 36" aria-hidden="true"><path d="M0 36V20C0 8 6 1.5 18 0v7c-6 1.2-8.600 4.400-8.800 9H18v20zm27 0V20C27 8 33 1.500 45 0v7c-6 1.200-8.600 4.400-8.800 9H45v20z"/></svg>';
  var MS = 10000, L = [], pk = 0, el = 0, hover = false, seen = true, busy = false;
  var chips = function (r) { return (r.services && r.services.length ? r.services : [r.p]).slice(0, 3).map(function (s, x) { return '<span class="rs-chip c' + x + '"><img src="/assets/img/logos/' + slug(s) + '.svg" alt="" onerror="this.remove()"><em>' + esc(s) + "</em></span>"; }).join(""); };
  var stars = function (n) { var h = ""; for (var i = 0; i < n; i++) h += '<i style="--s:' + i + '">\u2605</i>'; return h; };
  function set(n, instant) {
    if (busy) return;
    var prev = box.querySelector(".rs");
    var paint = function () {
      pk = (n + L.length) % L.length; el = 0; var r = L[pk];
      var cc = r.cc ? '<span class="rs-cc">' + flag(r.cc) + (r.x ? "Expatriate · " : "") + esc(cname(r.cc)) + "</span>" : "";
      box.innerHTML = '<div class="rs" style="' + grad(pk) + '"><div class="rs-bg" aria-hidden="true"><i></i><i></i></div>' +
        '<div class="rs-portrait"><span class="rs-pring"></span><div class="rs-frame"><span class="rs-init">' + esc(ini(r.n)) + "</span>" + ph(r) + '<span class="rs-shine"></span></div>' +
        '<span class="rs-badge"><span class="rs-stars">' + stars(r.s || 5) + "</span><b>" + (r.s || 5).toFixed(1) + "</b></span></div>" +
        '<div class="rs-body"><span class="sp-eyebrow">Featured review</span>' + QUOTE +
        "<blockquote>" + String(r.t).split(" ").map(function (w, k) { return '<span class="rw" style="--k:' + k + '">' + esc(w) + "</span>"; }).join(" ") + "</blockquote>" +
        '<div class="rs-by"><b>' + esc(r.n) + "</b><span>" + esc([r.role, r.company].filter(Boolean).join(" · ")) + "</span>" + cc + "</div>" +
        '<div class="rs-svcs" aria-label="Services bought">' + chips(r) + '</div><div class="rs-act"><a class="rs-fb" href="/#reviews">See all customer reviews <i aria-hidden="true">\u2192</i></a></div></div>' +
        (L.length > 1 ? '<div class="rs-nav" role="tablist">' + L.map(function (j, x) { return '<button type="button" role="tab" aria-selected="' + (x === pk) + '" class="' + (x === pk ? "on" : "") + '" data-i="' + x + '" style="' + grad(x) + '"><span class="rs-mini"><i>' + esc(ini(j.n)) + "</i>" + ph(j) + '</span><span class="rs-nm"><b>' + esc(j.n) + "</b><small>" + esc(j.role || "Customer") + '</small></span><span class="rs-bar"><i></i></span></button>'; }).join("") + "</div>" : "") + "</div>";
      busy = false;
      var nv = box.querySelector(".rs-nav"), ab = nv && nv.querySelector("button.on");
      if (ab && nv.scrollWidth > nv.clientWidth) nv.scrollTo({ left: ab.offsetLeft - nv.clientWidth / 2 + ab.offsetWidth / 2, behavior: instant ? "auto" : "smooth" });
    };
    if (prev && !instant) { busy = true; prev.classList.add("out"); setTimeout(paint, 480); } else paint();
  }
  fetch("/api/catalog?a=reviews").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || !d.list) return;
    /* like the home page: the reviews marked Featured, from every service (all reviews if none are marked) */
    L = d.list.filter(function (r) { return r.popular; }); if (!L.length) L = d.list.slice();
    if (!L.length) return;
    var avg = (L.reduce(function (a, r) { return a + (r.s || 5); }, 0) / L.length).toFixed(1);
    if (sub) sub.innerHTML = '<span class="sp-avg">' + avg + "</span> average from " + L.length + " featured customer review" + (L.length > 1 ? "s" : "") + ".";
    set(0, true);
    box.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".rs-nav button"); if (b) set(+b.getAttribute("data-i")); });
    box.addEventListener("pointerenter", function () { hover = true; }); box.addEventListener("pointerleave", function () { hover = false; });
    box.addEventListener("focusin", function () { hover = true; }); box.addEventListener("focusout", function () { hover = false; });
    box.addEventListener("pointermove", function (e) {
      var t = e.target.closest && e.target.closest(".rs-portrait"); if (!t) return; var b = t.getBoundingClientRect();
      t.style.setProperty("--mx", ((e.clientX - b.left) / b.width - .5).toFixed(3)); t.style.setProperty("--my", ((e.clientY - b.top) / b.height - .5).toFixed(3));
    });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: .25 }).observe(box);
    if (L.length > 1) setInterval(function () {
      var s = box.querySelector(".rs"); if (!s || busy || hover || !seen || document.hidden) return;
      el += 100; s.style.setProperty("--p", Math.min(1, el / MS).toFixed(3));
      if (el >= MS) set(pk + 1);
    }, 100);
  }).catch(function () {});
})();
