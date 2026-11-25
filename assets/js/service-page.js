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

  /* Highlight the nav link of the section in view */
  var links = $$('.sp-nav nav a[href^="#"]'), secs = links.map(function (a) { return $(a.getAttribute("href")); });
  if (links.length && "IntersectionObserver" in window) {
    var cur = null, so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) cur = e.target; });
      links.forEach(function (a, i) { if (secs[i] && secs[i] === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    }, { rootMargin: "-35% 0px -60% 0px" });
    secs.forEach(function (s) { if (s) so.observe(s); });
    addEventListener("scroll", function () { if (innerHeight + scrollY >= document.documentElement.scrollHeight - 6) { cur = null; links.forEach(function (a, i) { if (i === links.length - 1) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); }); } }, { passive: true });
  }

  /* 3. Hero: cursor light, particle network, decoded headline, count-up price */
  var hero = $(".sp-hero");
  if (hero && !RM) {
    /* count up the starting price */
    var pb = $(".sp-from b");
    if (pb) { var m = pb.textContent.match(/^(\D*)([\d,]+)(.*)$/); if (m) { var to = +m[2].replace(/,/g, ""), s = performance.now(); (function up(t) { var k = Math.min(1, (t - s) / 1100), e = 1 - Math.pow(1 - k, 3); pb.textContent = m[1] + Math.round(to * e).toLocaleString("en-US") + m[3]; if (k < 1) requestAnimationFrame(up); })(s); } }
  }

  /* Newer title sheet (same one as the home page Trending): loaded only on first click, falls back to the built-in dialog. */
  var sheetP = null;
  function loadSheet() {
    if (window.sxSheet) return Promise.resolve();
    if (sheetP) return sheetP;
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "/assets/css/title-sheet.css?v=11"; document.head.appendChild(l);
    var one = function (src) { return new Promise(function (ok, no) { var sc = document.createElement("script"); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); }); };
    var chain = Promise.resolve();
    ["/assets/js/data/logos.js?v=20261125b", "/assets/js/features/mylist.js?v=1", "/assets/js/features/title-sheet.js?v=20"].forEach(function (u) { if (u.indexOf("logos") > -1 && typeof LOGOS !== "undefined") return; chain = chain.then(function () { return one(u); }); });
    sheetP = chain.then(function () { if (!window.sxSheet) throw 0; }).catch(function (e) { sheetP = null; throw e; });
    return sheetP;
  }
  function openTitle(id, k, from) {
    loadSheet().then(function () { sxSheet.open(id, k, from); }).catch(function () { titleDialog()(id, k, from); });
  }

  /* Title details dialog: shared by the trending rail and the About poster strip. */
  var ttOpen = null;
  function titleDialog() {
    if (ttOpen) return ttOpen;
    var svcName = ((($("[data-trend]") || {}).dataset || {}).svc) || (($(".sp-hc-top b") || {}).textContent) || "";
    /* Title details dialog: same design and logic as the home page (trailer, IMDb link, "buy" card). */
    var dlg = document.createElement("div"); dlg.className = "tt"; dlg.hidden = true; dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-modal", "true");
    dlg.innerHTML = '<div class="tt-bg" data-x></div><div class="tt-box" tabindex="-1"><button class="tt-x" type="button" data-x aria-label="Close">×</button><div class="tt-in"></div></div>';
    document.body.appendChild(dlg);
    var tin = $(".tt-in", dlg), tbox = $(".tt-box", dlg), lastFocus = null, tTok = 0, tcache = {};
    var mins = function (n) { return n ? (n >= 60 ? Math.floor(n / 60) + "h " + (n % 60 ? n % 60 + "m" : "") : n + "m") : ""; };
    var closeT = function () { dlg.hidden = true; tin.innerHTML = ""; document.documentElement.classList.remove("tt-open"); if (lastFocus) lastFocus.focus(); };
    dlg.addEventListener("click", function (e) { if (e.target.closest("[data-x]")) closeT(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !dlg.hidden) closeT(); });
    var svcLogo = ($(".sp-hcard .sp-logo") || {}).outerHTML || "";
    var buyCard = function () { var svcFrom = ($(".sp-hcard .sp-from b") || {}).textContent || ""; return '<div class="tt-buy">' + svcLogo + '<div class="tt-buy-t"><small>Wanna watch it now?</small><b>Grab yours · ' + esc(svcName) + '</b>' + (svcFrom ? '<span>Plans from <strong>' + esc(svcFrom) + '</strong></span>' : '') + '</div><button class="btn grad-bg" type="button" data-buy>Buy now <i aria-hidden="true">→</i></button></div>'; };
    tin.addEventListener("click", function (e) { if (!e.target.closest("[data-buy]")) return; closeT(); var pl = document.getElementById("plans"); if (pl) pl.scrollIntoView({ behavior: "smooth" }); });
    var paintT = function (d) {
      var meta = [d.y, d.k === "tv" ? (d.seasons ? d.seasons + " season" + (d.seasons > 1 ? "s" : "") : "Series") : mins(d.rt), d.lang].filter(Boolean).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
      tin.innerHTML = '<div class="tt-hero" style="' + (d.bd ? "--bd:url(https://image.tmdb.org/t/p/w780" + esc(d.bd) + ")" : "") + '"><div class="tt-media" id="ttMedia">' + (d.yt ? '<button class="tt-play" type="button" id="ttPlay" aria-label="Play trailer"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><b>Play trailer</b></button>' : '<div class="tt-nt">No trailer available</div>') + '</div></div>' +
        '<div class="tt-body"><div class="tt-head"><div class="tt-ttl"><h3>' + esc(d.t) + '</h3>' + (d.tag ? '<p class="tt-tag">' + esc(d.tag) + '</p>' : "") + '</div>' + buyCard() + '</div>' +
        '<div class="tt-meta">' + meta + (d.v ? '<span class="tt-rate">★ ' + d.v + '<small>/10 TMDB' + (d.vc ? " · " + d.vc.toLocaleString() + " votes" : "") + '</small></span>' : "") + '</div>' +
        (d.g && d.g.length ? '<div class="tt-gen">' + d.g.map(function (g) { return "<i>" + esc(g) + "</i>"; }).join("") + '</div>' : "") +
        (d.o ? '<p class="tt-ov">' + esc(d.o) + '</p>' : "") +
        (d.dir ? '<p class="tt-dir"><small>' + (d.k === "tv" ? "Created by" : "Director") + '</small> ' + esc(d.dir) + '</p>' : "") +
        (d.cast && d.cast.length ? '<div class="tt-cast">' + d.cast.slice(0, 6).map(function (c) { return "<div>" + (c.p ? '<img src="https://image.tmdb.org/t/p/w185' + esc(c.p) + '" alt="" loading="lazy">' : '<span class="tt-ph">' + esc(c.n[0] || "") + '</span>') + "<b>" + esc(c.n) + "</b><small>" + esc(c.c) + "</small></div>"; }).join("") + '</div>' : "") +
        '<div class="tt-act">' + (d.imdb ? '<a class="btn imdb" href="https://www.imdb.com/title/' + esc(d.imdb) + '/" target="_blank" rel="noopener"><b>IMDb</b> View ratings &amp; reviews ↗</a>' : '<a class="btn ghost" href="https://www.imdb.com/find/?q=' + encodeURIComponent(d.t) + '" target="_blank" rel="noopener">Search on IMDb ↗</a>') + (d.yt ? '<a class="btn ghost" href="https://www.youtube.com/watch?v=' + esc(d.yt) + '" target="_blank" rel="noopener">Open on YouTube ↗</a>' : "") + '</div></div>';
      var pb = $("#ttPlay"); if (pb) pb.onclick = function () { $("#ttMedia").innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(d.yt) + '?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=' + encodeURIComponent(d.yt) + '&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0" title="' + esc(d.t) + ' trailer" allow="autoplay; encrypted-media" tabindex="-1" style="opacity:0;transition:opacity .9s ease"></iframe>'; setTimeout(function () { var f = document.querySelector("#ttMedia iframe"); if (f) f.style.opacity = "1"; }, 4000); };   /* cover (backdrop) stays 4s, muted, no controls */
    };
    var openT = function (id, k, from) {
      lastFocus = from; var my = ++tTok; dlg.hidden = false; document.documentElement.classList.add("tt-open");
      tin.innerHTML = '<div class="tt-load"><i></i><span>Loading details…</span></div>'; tbox.focus();
      var key = k + id, got = tcache[key] ? Promise.resolve(tcache[key]) : fetch("/api/title?id=" + id + "&k=" + k).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { tcache[key] = d; return d; });
      got.then(function (d) { if (my === tTok && !dlg.hidden) paintT(d); }).catch(function () { if (my === tTok) tin.innerHTML = '<div class="tt-load"><span>Couldn\'t load details right now. Please try again.</span><button class="btn ghost" type="button" data-x>Close</button></div>'; });
    };
    ttOpen = openT; return openT;
  }

  /* 5. Live trending (TMDB via /api/trending). The section stays hidden if the data is unavailable. */
  var ts = $("[data-trend]");
  if (ts) {
    var ids = ts.dataset.trend.split(","), names = ts.dataset.names.split(","), st = { p: ids[0], k: "movie" }, cache = {}, rail = $(".sp-rail", ts), note = $(".sp-tnote", ts);
    var REG = { US: "United States", IN: "India", GB: "United Kingdom", BD: "Bangladesh" };
    var paint = function (d) {
      var list = (st.k === "movie" ? d.movies : d.tv) || [];
      if (!list.length) { rail.innerHTML = '<p class="sp-empty">Nothing to show here right now.</p>'; return; }
      rail.innerHTML = list.map(function (m, i) { return '<article class="sp-poster" style="--i:' + i + '" tabindex="0" role="button" aria-label="' + esc(m.t) + ': details and trailer" data-id="' + m.id + '" data-k="' + m.k + '"><span class="sp-rank" aria-hidden="true">' + (i + 1) + '</span><img src="https://image.tmdb.org/t/p/w342' + esc(m.p) + '" alt="' + esc(m.t) + ' poster" loading="lazy" width="342" height="513"><div class="sp-ov" aria-hidden="true"><i><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></i><b>Watch trailer</b></div><div><b>' + esc(m.t) + '</b><small>' + esc([m.y, m.v ? "★ " + m.v : ""].filter(Boolean).join(" · ")) + '</small></div></article>'; }).join("");
      note.textContent = d.fallback ? "Local chart not available for this platform, showing the " + (REG[d.fallback] || d.fallback) + " chart. Data: TMDB." : "Chart for " + (REG[d.region] || d.region) + ". Data: TMDB.";
    };
    var openT = titleDialog();
    rail.addEventListener("click", function (e) { var c = e.target.closest(".sp-poster[data-id]"); if (c) openTitle(c.dataset.id, c.dataset.k, c); });
    rail.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches(".sp-poster[data-id]")) { e.preventDefault(); openTitle(e.target.dataset.id, e.target.dataset.k, e.target); } });
    var load = function (first) {
      var p = st.p; if (cache[p]) { paint(cache[p]); return Promise.resolve(); }
      return fetch("/api/trending?p=" + p + "&r=BD").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { cache[p] = d; if (p === st.p) paint(d); if (first) { ts.hidden = false; var tl = $('.sp-nav nav a[href="#trending"]'); if (tl) tl.hidden = false; } }).catch(function () { if (!first) rail.innerHTML = '<p class="sp-empty">Trending is unavailable right now.</p>'; });
    };
    $$(".sp-seg", ts).forEach(function (seg) { seg.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; $$("button", seg).forEach(function (x) { x.classList.toggle("on", x === b); }); st[seg.dataset.seg] = b.dataset.v; if (cache[st.p]) paint(cache[st.p]); else load(false); }); });
    load(true);
  }

  /* 6. Review form -> WhatsApp */
  /* Reviews of this service: from the admin-managed list, filled in the browser */
  (function () {
    var box = $("#spRevs"); if (!box) return;
    var svc = box.dataset.svc, sec = $("#reviews"), sub = sec && sec.querySelector(".sp-sub");
    var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
    fetch("/api/catalog?a=reviews").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.list) return;
      var l = d.list.filter(function (r) { return (r.services || []).indexOf(svc) > -1; });
      if (!l.length) return;
      var avg = (l.reduce(function (a, r) { return a + (r.s || 5); }, 0) / l.length).toFixed(1);
      if (sub) sub.innerHTML = '<span class="sp-avg">' + avg + "</span> average from " + l.length + " review" + (l.length > 1 ? "s" : "") + " of " + esc(svc) + ".";
      box.innerHTML = l.map(function (r) {
        var ini = String(r.n).split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
        return '<figure class="sp-rev"><div class="sp-rst" aria-label="' + r.s + ' out of 5">' + "★★★★★".slice(0, r.s) + '</div><blockquote>' + esc(r.t) + '</blockquote><figcaption><span class="sp-av">' + esc(ini) + '</span><span><b>' + esc(r.n) + "</b><small>" + esc([r.role, r.loc].filter(Boolean).join(" · ")) + "</small></span></figcaption></figure>";
      }).join("");
    }).catch(function () {});
  })();
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

  /* Nav: compact once scrolled; on phones the section links hide while scrolling down and return when scrolling up */
  (function () {
    var nv = $("#spNav"), bb = $("#spBuy"), last = scrollY, tk = false;
    var pl = $("#plans"), en = $(".sp-end"), vis = { p: false, e: false };
    if (bb && "IntersectionObserver" in window) {
      var bo = new IntersectionObserver(function (es) { es.forEach(function (e) { vis[e.target === pl ? "p" : "e"] = e.isIntersecting; }); upd(); });
      if (pl) bo.observe(pl); if (en) bo.observe(en);
    }
    function upd() { if (bb) bb.classList.toggle("on", scrollY > 520 && !vis.p && !vis.e); }
    /* Lock the nav's layout height: hiding the links row only changes the pill, never the page flow (this caused the flicker loop). */
    function lock() { if (!nv) return; var c = nv.classList.contains("sp-compact"); nv.style.height = ""; nv.classList.remove("sp-compact"); var h = nv.offsetHeight; nv.style.height = h + "px"; if (c) nv.classList.add("sp-compact"); }
    lock(); addEventListener("load", lock); addEventListener("resize", function () { clearTimeout(lock.t); lock.t = setTimeout(lock, 150); });
    function run() {
      tk = false; var y = scrollY;
      if (nv) { nv.classList.toggle("sp-scrolled", y > 30); if (y > 140 && y > last + 4) nv.classList.add("sp-compact"); else if (y < last - 4 || y < 60) nv.classList.remove("sp-compact"); }
      last = y; upd();
    }
    addEventListener("scroll", function () { if (!tk) { tk = true; requestAnimationFrame(run); } }, { passive: true }); run();
  })();

  /* About strip: cards without a poster carry the service logo so they never look empty. */
  (function () {
    var lg = $(".sp-ablogo .sp-logo"); if (!lg) return;
    $$(".sp-pcs .sp-pc").forEach(function (c) { var w = document.createElement("span"); w.className = "sp-pclg"; w.setAttribute("aria-hidden", "true"); w.appendChild(lg.cloneNode(true)); c.insertBefore(w, c.firstChild); });
  })();

  /* 6. About: real posters on the popular-titles strip (TMDB via /api/title?q=). Only entries that resolve to a real title with a poster are shown;
     if fewer than 3 do (e.g. categories like "Local films"), the styled cards stay. */
  (function () {
    var mq = $(".sp-pcs[data-posters]"); if (!mq || !("IntersectionObserver" in window)) return;
    var norm = function (x) { return String(x || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim(); };
    var same = function (q, r) { q = norm(q); r = norm(r); return !!q && !!r && (q === r || r.indexOf(q + " ") === 0 || q.indexOf(r) > -1 && r.length > 3); };
    var seen = false, io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || seen) return; seen = true; io.disconnect();
      var track = $(".sp-abtrack", mq), names = [];
      [].slice.call(track.querySelectorAll(".sp-pc b")).forEach(function (b) { var t = b.textContent; if (t && names.indexOf(t) < 0) names.push(t); });
      Promise.all(names.map(function (t) {
        return fetch("/api/title?q=" + encodeURIComponent(t) + (mq.dataset.lang ? "&l=" + encodeURIComponent(mq.dataset.lang) : "")).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
          .then(function (d) { return d && d.p && d.id && same(t, d.t) ? { t: d.t || t, id: d.id, k: d.k, p: d.p } : null; });
      })).then(function (all) {
        var ok = all.filter(Boolean); if (ok.length < 3) return;
        var half = ok.slice(), n = ok.length; while (half.length < 10) half = half.concat(ok); if (half.length % 2) half = half.concat(ok);
        var card = function (m, i, dup) {
          return '<div class="sp-pc has clk" data-id="' + m.id + '" data-k="' + m.k + '"' + (dup ? ' aria-hidden="true"' : ' tabindex="0" role="button" aria-label="' + esc(m.t) + ': details and trailer"') + '><img src="https://image.tmdb.org/t/p/w342' + esc(m.p) + '" alt="" decoding="async"><i>' + ("0" + ((i % n) + 1)).slice(-2) + '</i><b>' + esc(m.t) + '</b></div>';
        };
        track.innerHTML = half.map(function (m, i) { return card(m, i, false); }).join("") + half.map(function (m, i) { return card(m, i, true); }).join("");
      });
    }, { rootMargin: "200px" });
    io.observe(mq);
    var go = function (c) { openTitle(c.dataset.id, c.dataset.k, c); };
    mq.addEventListener("click", function (e) { var c = e.target.closest(".sp-pc[data-id]"); if (c) go(c); });
    mq.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches(".sp-pc[data-id]")) { e.preventDefault(); go(e.target); } });
  })();
})();
