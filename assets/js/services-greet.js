/* All services: greets a signed-in customer once per visit. The nav pill flips open to the left ("Hi, Name"), holds a moment, then flips shut. */
(function () {
  var nav = document.getElementById("spNav"), nr = document.querySelector(".sp-nr");
  if (!nav || !nr || !document.querySelector(".hb-hero")) return;
  var tok, nm;
  try { tok = localStorage.getItem("sx_session"); if (!tok || sessionStorage.getItem("sx_hi")) return; nm = localStorage.getItem("sx_nm"); } catch (e) { return; }

  function show(full) {
    var first = String(full || "").trim().replace(/\s+/g, " ");
    if (!first) return;
    if (first.length > 40) first = first.slice(0, 39) + "…";
    try { sessionStorage.setItem("sx_hi", "1"); } catch (e) {}
    var el = document.createElement("span"), b = document.createElement("b");
    var hr = new Date().getHours(), g = hr >= 5 && hr < 12 ? "Good morning" : hr >= 12 && hr < 17 ? "Good afternoon" : hr >= 17 && hr < 21 ? "Good evening" : "Hello";
    el.className = "sp-hi"; el.setAttribute("role", "status");
    var s1 = document.createElement("i"), s2 = document.createElement("em"); s1.textContent = g; s2.textContent = first; b.appendChild(s1); b.appendChild(s2); el.appendChild(b);
    nr.insertBefore(el, nr.firstChild);
    b.style.maxWidth = "none";
    var cap = Math.max(70, innerWidth - 28 - 190 - 12), w = Math.min(Math.ceil(b.offsetWidth) + 4, cap);
    b.style.maxWidth = w + "px";
    el.style.setProperty("--w", w + "px");
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      nav.style.setProperty("--hiw", w + "px"); el.classList.add("on");
      setTimeout(function () {
        el.classList.add("out");
        setTimeout(function () {
          el.classList.remove("on"); nav.style.setProperty("--hiw", "0px");
          setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
        }, 380);
      }, 6500);
    }); });
  }

  /* Wait until the nav has melted into the pill (first scroll), then greet a moment later. */
  var done = false, tm = 0, name = nm || "";
  function scrolled() { return nav.classList.contains("sp-scrolled"); }
  function arm() {
    if (done) return;
    clearTimeout(tm);
    if (!scrolled() || !name) return;
    tm = setTimeout(function () {
      if (done || !scrolled()) return;
      done = true; mo.disconnect(); show(name);
    }, 1100);
  }
  var mo = new MutationObserver(arm);
  mo.observe(nav, { attributes: true, attributeFilter: ["class"] });
  if (name) arm();
  else fetch("/api/account?a=me", { headers: { Authorization: "Bearer " + tok } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { var n = d && d.profile && d.profile.name; if (n) { try { localStorage.setItem("sx_nm", n); } catch (e) {} name = n; arm(); } })
    .catch(function () {});
})();
