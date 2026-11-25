/* Services hub: tapping the search box blurs the page (frosted glass), glides the box to the top centre and lists matching services right under it. Esc, tapping the glass or leaving the box closes it. */
(function () {
  "use strict";
  var q = document.getElementById("hbQ"), form = document.getElementById("hbForm");
  if (!q || !form) return;
  var cards = [].slice.call(document.querySelectorAll(".hb-card"));
  if (!cards.length) return;
  var norm = function (t) { return String(t || "").toLowerCase().replace(/[^a-z0-9+ ]+/g, " ").replace(/\s+/g, " ").trim(); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches, DUR = reduce ? 0 : 520;
  var ov, panel, ph, isOpen = false, timer, closeT, fab, fromFab = false;

  /* Floating search pill: pops up at the bottom centre once the search box has scrolled out of view. */
  fab = document.createElement("button"); fab.type = "button"; fab.className = "hs-fab"; fab.setAttribute("aria-label", "Search services"); fab.tabIndex = -1;
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>Search services</span>';
  document.body.appendChild(fab);
  var ticking = false;
  function upd() {
    ticking = false;
    var anchor = isOpen ? null : form, show = false;
    if (anchor) { var r = anchor.getBoundingClientRect(); show = r.bottom < 40; }
    fab.classList.toggle("on", show); fab.tabIndex = show ? 0 : -1;
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener("resize", upd);
  fab.addEventListener("click", function () { fromFab = true; q.focus({ preventScroll: true }); open(); });

  var rows = cards.map(function (c) {
    var lg = c.querySelector(".sp-logo"), sec = c.closest(".hb-sec"), h = sec && sec.querySelector("h2"), p = c.querySelector(".hb-price b");
    return { s: c.dataset.s || "", href: c.getAttribute("href"), logo: lg ? lg.outerHTML : "", name: (c.querySelector("h3") || {}).textContent || "", cat: h ? h.textContent.replace(/18\+.*/, "18+").trim() : "", price: p ? p.textContent : "", c: c.style.getPropertyValue("--c") };
  });

  function build() {
    ov = document.createElement("div"); ov.className = "hs-ov"; ov.addEventListener("mousedown", function (e) { e.preventDefault(); close(); }); ov.addEventListener("touchstart", function () { close(); }, { passive: true });
    panel = document.createElement("div"); panel.className = "hs-panel"; panel.setAttribute("role", "listbox"); panel.setAttribute("aria-label", "Matching services");
    panel.addEventListener("mousedown", function (e) { if (!e.target.closest("a")) e.preventDefault(); });
    document.body.appendChild(ov); document.body.appendChild(panel);
  }
  function fill() {
    var words = norm(q.value).split(" ").filter(Boolean);
    var list = rows.filter(function (r) { return words.every(function (w) { return r.s.indexOf(w) > -1; }); });
    if (!list.length) {
      var wa = document.getElementById("hbWa"), href = wa ? wa.href : "#";
      panel.innerHTML = '<div class="hs-none"><b>No service found</b><span>Tell us what you need and we will check if we can get it for you.</span><a href="' + esc(href) + '" target="_blank" rel="noopener">Ask on WhatsApp</a></div>'; return;
    }
    panel.innerHTML = '<div class="hs-hd">' + (words.length ? list.length + (list.length === 1 ? " match" : " matches") : "All services") + "</div>" + list.map(function (r, i) {
      return '<a class="hs-r" role="option" href="' + esc(r.href) + '" style="--c:' + esc(r.c) + ";--i:" + Math.min(i, 12) + '">' + r.logo + '<span class="hs-n"><b>' + esc(r.name) + "</b><small>" + esc(r.cat) + '</small></span><span class="hs-p">' + (r.price ? "from <b>" + esc(r.price) + "</b>" : "") + "</span></a>";
    }).join("");
    panel.scrollTop = 0;
  }
  function geo() {
    var w = Math.min(680, innerWidth - 24), top = innerWidth <= 620 ? 14 : 26;
    return { w: w, left: Math.round((innerWidth - w) / 2), top: top };
  }
  function open() {
    if (isOpen) return; isOpen = true; clearTimeout(closeT);
    if (!ov) build();
    document.documentElement.classList.add("hs-lock");
    var r = form.getBoundingClientRect(), cs = getComputedStyle(form), src = r;
    if (fab.classList.contains("on") || r.bottom < 0) { src = fab.getBoundingClientRect(); fromFab = true; }
    fab.classList.remove("on");
    ph = document.createElement("div"); ph.style.cssText = "height:" + r.height + "px;margin:" + cs.marginTop + " 0 " + cs.marginBottom + ";max-width:" + cs.maxWidth; form.parentNode.insertBefore(ph, form);
    document.body.appendChild(form); q.focus({ preventScroll: true });   // out of the hero's stacking context, so it sits above the glass
    form.classList.add("hs-fx");
    form.style.transition = "none"; form.style.top = src.top + "px"; form.style.left = src.left + "px"; form.style.width = src.width + "px";
    void form.offsetWidth;
    var g = geo(); form.style.transition = ""; form.style.top = g.top + "px"; form.style.left = g.left + "px"; form.style.width = g.w + "px";
    fill(); panel.style.top = g.top + 56 + 12 + "px"; panel.style.left = g.left + "px"; panel.style.width = g.w + "px";
    ov.classList.add("on"); clearTimeout(timer);
    timer = setTimeout(function () { panel.classList.add("on"); }, reduce ? 0 : 140);
  }
  function close() {
    if (!isOpen) return; isOpen = false;
    ov.classList.remove("on"); panel.classList.remove("on");
    if (document.activeElement === q) q.blur();
    var r = ph.getBoundingClientRect();
    if (r.bottom < 40) { var fw = Math.min(420, innerWidth - 32); r = { top: innerHeight - 18 - 52, left: (innerWidth - fw) / 2, width: fw }; }
    form.style.top = r.top + "px"; form.style.left = r.left + "px"; form.style.width = r.width + "px";
    closeT = setTimeout(function () {
      form.classList.remove("hs-fx"); form.style.cssText = ""; if (ph && ph.parentNode) { ph.parentNode.insertBefore(form, ph); ph.parentNode.removeChild(ph); }
      document.documentElement.classList.remove("hs-lock"); fromFab = false; upd();
    }, DUR);
  }
  q.addEventListener("focus", open);
  q.addEventListener("click", open);
  q.addEventListener("input", function () { if (isOpen) fill(); });
  q.addEventListener("blur", function () { setTimeout(function () { if (isOpen && !panel.contains(document.activeElement) && document.activeElement !== q) close(); }, 120); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) close(); });
  addEventListener("resize", function () { if (!isOpen) return; var g = geo(); form.style.left = g.left + "px"; form.style.width = g.w + "px"; form.style.top = g.top + "px"; panel.style.left = g.left + "px"; panel.style.width = g.w + "px"; panel.style.top = g.top + 68 + "px"; });
})();
