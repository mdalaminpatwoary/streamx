/* Nav pop-ups (front page + All services). Once the nav has melted into its pill, the pill flips open to the left with a message, holds a moment, then flips shut.
   Messages wait in a queue (window.sxPopQ): the greeting for a signed-in customer first, then a "new announcement" notice. Each one shows once. */
(function () {
  var home = !document.getElementById("spNav") && document.getElementById("nav");
  var nav = document.getElementById("spNav") || home, nr = home ? home.querySelector(".navbar>.nr") : document.querySelector(".sp-nr"), ON = home ? "pill" : "sp-compact", AWAY = home ? "away" : "sp-away";
  if (!nav || !nr) return;
  /* Long names: the name scrolls right to left in a loop (carousel) instead of being cut off */
  var st = document.createElement("style");
  st.textContent = ".sp-hi b em.mq{text-overflow:clip;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%)}.mq-t{display:inline-flex;white-space:nowrap;animation:mqGo var(--mqd,8s) linear 1.1s 1 both;will-change:transform}.mq-t>span{padding-right:32px}@keyframes mqGo{to{transform:translateX(-50%)}}@media (prefers-reduced-motion:reduce){.mq-t{animation:none}.sp-hi b em.mq{text-overflow:ellipsis;-webkit-mask-image:none;mask-image:none}}";
  document.head.appendChild(st);
  var Q = window.sxPopQ = window.sxPopQ || [], busy = false, tm = 0;
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>';

  function active() { return nav.classList.contains(ON) && !nav.classList.contains(AWAY); }
  var armed = false, curClose = null;
  function pump(delay) {
    if (armed || busy || !Q.length || !active()) return;
    armed = true;
    tm = setTimeout(function () {
      armed = false;
      if (busy || !Q.length || !active()) return;
      Q.sort(function (a, b) { return (a.pri || 0) - (b.pri || 0); });
      show(Q.shift());
    }, delay == null ? 2800 : delay);
  }

  function show(it) {
    busy = true; window.sxHold = true; if (it.onShow) it.onShow();
    var el = document.createElement(it.href ? "a" : "span"), b = document.createElement("b"), s1 = document.createElement("i"), s2 = document.createElement("em");
    el.className = "sp-hi" + (it.k === "notice" ? " sp-nt k-" + (it.kind || "info") : ""); el.setAttribute("role", "status");
    s1.textContent = it.small; s2.textContent = it.big;
    if (it.k === "notice") {
      var ic = document.createElement("u"), tx = document.createElement("span"); ic.innerHTML = ICON; tx.appendChild(s1); tx.appendChild(s2); b.appendChild(ic); b.appendChild(tx);
      el.href = it.href; el.addEventListener("click", function (e) { var t = document.querySelector(it.href); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" }); close(); } });
    } else { b.appendChild(s1); b.appendChild(s2); }
    el.appendChild(b);
    if (home) nr.parentNode.insertBefore(el, nr); else nr.insertBefore(el, nr.firstChild);
    b.style.maxWidth = "none";
    var nat = s2.scrollWidth;
    var base = home ? (parseFloat(nav.style.getPropertyValue("--pw")) || 200) + 14 : 190, cap = Math.min(250, Math.max(60, innerWidth - 28 - base - 12)), w = Math.min(Math.ceil(b.offsetWidth) + 4, cap);
    b.style.maxWidth = w + "px"; el.style.setProperty("--w", w + "px");
    if (it.k !== "notice" && nat > w - 16 + 1 && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      var tx0 = s2.textContent, inn = document.createElement("span"), a = document.createElement("span"), a2 = document.createElement("span");
      a.textContent = tx0; a2.textContent = tx0; a2.setAttribute("aria-hidden", "true"); inn.className = "mq-t"; inn.appendChild(a); inn.appendChild(a2);
      var dur = Math.min(6, Math.max(3, (nat + 32) / 40)); inn.style.setProperty("--mqd", dur.toFixed(2) + "s");
      s2.textContent = ""; s2.className = "mq"; s2.setAttribute("aria-label", tx0); s2.appendChild(inn);
      it.hold = 1100 + dur * 1000 + 1100; /* one full turn, a short rest on the name, then the 3D flip closes it */
    }
    var closed = false;
    curClose = close;
    function close() {
      if (closed) return; closed = true; if (curClose === close) curClose = null;
      el.classList.add("out");
      setTimeout(function () {
        el.classList.remove("on"); nav.style.setProperty("--hiw", "0px");
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); busy = false; window.sxHold = false; if (window.scrollY < 60) nav.classList.remove(ON); pump(500); }, 700);
      }, 340);
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      nav.style.setProperty("--hiw", (w + (home ? 14 : 8)) + "px"); el.classList.add("on");
      setTimeout(close, it.hold || 6500);
    }); });
  }

  /* Greeting for a signed-in customer (once per visit) */
  var tok, nm;
  try { tok = localStorage.getItem("sx_session"); if (tok && !sessionStorage.getItem("sx_hi")) nm = localStorage.getItem("sx_nm") || ""; else tok = null; } catch (e) { tok = null; }
  function greet(full) {
    var first = String(full || "").trim().replace(/\s+/g, " ");
    if (!first) return;
    if (first.length > 80) first = first.slice(0, 79) + "…";
    var hr = new Date().getHours(), g = hr >= 5 && hr < 12 ? "Good morning" : hr >= 12 && hr < 17 ? "Good afternoon" : hr >= 17 && hr < 21 ? "Good evening" : "Hello";
    Q.push({ k: "greet", pri: 0, small: g, big: first, hold: 6500, onShow: function () { try { sessionStorage.setItem("sx_hi", "1"); } catch (e) {} } });
    pump();
  }
  if (tok) {
    if (nm) greet(nm);
    else fetch("/api/account?a=me", { headers: { Authorization: "Bearer " + tok } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { var n = d && d.profile && d.profile.name; if (n) { try { localStorage.setItem("sx_nm", n); } catch (e) {} greet(n); } })
      .catch(function () {});
  }
  new MutationObserver(function () { if (curClose && !active()) curClose(); pump(); }).observe(nav, { attributes: true, attributeFilter: ["class"] });
  setInterval(function () { if (Q.length && !busy) pump(); }, 700);
})();
