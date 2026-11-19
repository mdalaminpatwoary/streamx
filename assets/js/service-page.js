/* Service pages: reveal, scroll progress, particle network, text decode, 3D tilt, count-up, live trending, review form. */
(function () {
  "use strict";
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = matchMedia("(hover:hover) and (pointer:fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* 1. Scroll progress bar */
  var bar = document.createElement("div"); bar.className = "sp-prog"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar);
  var tick = false;
  function prog() { tick = false; var m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = "scaleX(" + (m > 0 ? Math.min(1, scrollY / m) : 0).toFixed(4) + ")"; }
  addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true }); prog();

  /* 2. Reveal on scroll */
  var rv = $$(".sp-rv");
  if (!("IntersectionObserver" in window) || RM) { rv.forEach(function (e) { e.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12 });
    rv.forEach(function (e, i) { e.style.setProperty("--d", (i % 4) * 70 + "ms"); io.observe(e); });
  }

  /* 3. Hero: cursor light, particle network, decoded headline, count-up price */
  var hero = $(".sp-hero");
  if (hero && FINE && !RM) {
    hero.addEventListener("pointermove", function (e) { var b = hero.getBoundingClientRect(); hero.style.setProperty("--mx", (e.clientX - b.left) + "px"); hero.style.setProperty("--my", (e.clientY - b.top) + "px"); });
  }
  if (hero && !RM) {
    /* count up the starting price */
    var pb = $(".sp-from b");
    if (pb) { var m = pb.textContent.match(/^(\D*)([\d,]+)(.*)$/); if (m) { var to = +m[2].replace(/,/g, ""), s = performance.now(); (function up(t) { var k = Math.min(1, (t - s) / 1100), e = 1 - Math.pow(1 - k, 3); pb.textContent = m[1] + Math.round(to * e).toLocaleString("en-US") + m[3]; if (k < 1) requestAnimationFrame(up); })(s); } }
  }

  /* 4. 3D tilt with glare on cards (mouse devices only) */
  if (FINE && !RM) {
    var TILT = ".sp-vcard,.sp-hcard,.sp-rev,.sp-rc,.sp-poster,.sp-why>div";
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(TILT); $$(".sp-tilting").forEach(function (o) { if (o !== el) { o.classList.remove("sp-tilting"); o.style.rotate = ""; } });
      if (!el) return; var b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      el.classList.add("sp-tilting"); el.style.rotate = (-y * 2).toFixed(3) + " " + (x * 2).toFixed(3) + " 0 " + (Math.hypot(x, y) * 10).toFixed(2) + "deg";
      el.style.setProperty("--gx", (x + .5) * 100 + "%"); el.style.setProperty("--gy", (y + .5) * 100 + "%");
    }, { passive: true });
  }

  /* 5. Live trending (TMDB via /api/trending). The section stays hidden if the data is unavailable. */
  var ts = $("[data-trend]");
  if (ts) {
    var ids = ts.dataset.trend.split(","), names = ts.dataset.names.split(","), st = { p: ids[0], k: "movie" }, cache = {}, rail = $(".sp-rail", ts), note = $(".sp-tnote", ts);
    var REG = { US: "United States", IN: "India", GB: "United Kingdom", BD: "Bangladesh" };
    var paint = function (d) {
      var list = (st.k === "movie" ? d.movies : d.tv) || [];
      if (!list.length) { rail.innerHTML = '<p class="sp-empty">Nothing to show here right now.</p>'; return; }
      rail.innerHTML = list.map(function (m, i) { return '<article class="sp-poster" style="--i:' + i + '"><span class="sp-rank" aria-hidden="true">' + (i + 1) + '</span><img src="https://image.tmdb.org/t/p/w342' + esc(m.p) + '" alt="' + esc(m.t) + ' poster" loading="lazy" width="342" height="513"><div><b>' + esc(m.t) + '</b><small>' + esc([m.y, m.v ? "★ " + m.v : ""].filter(Boolean).join(" · ")) + '</small></div></article>'; }).join("");
      note.textContent = d.fallback ? "Local chart not available for this platform, showing the " + (REG[d.fallback] || d.fallback) + " chart. Data: TMDB." : "Chart for " + (REG[d.region] || d.region) + ". Data: TMDB.";
    };
    var load = function (first) {
      var p = st.p; if (cache[p]) { paint(cache[p]); return Promise.resolve(); }
      return fetch("/api/trending?p=" + p + "&r=BD").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { cache[p] = d; if (p === st.p) paint(d); if (first) ts.hidden = false; }).catch(function () { if (!first) rail.innerHTML = '<p class="sp-empty">Trending is unavailable right now.</p>'; });
    };
    $$(".sp-seg", ts).forEach(function (seg) { seg.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; $$("button", seg).forEach(function (x) { x.classList.toggle("on", x === b); }); st[seg.dataset.seg] = b.dataset.v; if (cache[st.p]) paint(cache[st.p]); else load(false); }); });
    load(true);
  }

  /* 6. Review form -> WhatsApp */
  var f = $(".sp-rform");
  if (f) {
    var n = 5, pick = $(".sp-pick", f), btns = $$("button", pick);
    var setN = function (v) { n = v; btns.forEach(function (b) { var on = +b.dataset.n <= v; b.classList.toggle("on", on); b.setAttribute("aria-checked", +b.dataset.n === v); }); };
    setN(5); pick.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) setN(+b.dataset.n); });
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var t = f.t.value.trim();
      if (!t) { f.t.classList.add("bad"); f.t.focus(); setTimeout(function () { f.t.classList.remove("bad"); }, 700); return; }
      var name = f.n.value.trim(), msg = "Hi StreamX! My review of " + f.dataset.svc + ":\n" + "★".repeat(n) + "☆".repeat(5 - n) + " (" + n + "/5)\n" + t + (name ? "\n- " + name : "");
      window.open("https://wa.me/" + f.dataset.wa + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }
})();
