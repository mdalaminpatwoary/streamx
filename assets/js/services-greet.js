/* Nav pop-ups (front page + All services). Once the nav has melted into its pill, the pill flips open to the left with a message, holds a moment, then flips shut.
   Messages wait in a queue (window.sxPopQ): the greeting for a signed-in customer first, then a "new announcement" notice. Each one shows once. */
(function () {
  var home = !document.getElementById("spNav") && document.getElementById("nav");
  var nav = document.getElementById("spNav") || home, nr = home ? home.querySelector(".navbar>.nr") : document.querySelector(".sp-nr"), ON = home ? "pill" : "sp-compact", AWAY = home ? "away" : "sp-away";
  if (!nav || !nr) return;
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
    }, delay == null ? 1100 : delay);
  }

  function show(it) {
    busy = true; if (it.onShow) it.onShow();
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
    var base = home ? (parseFloat(nav.style.getPropertyValue("--pw")) || 200) + 14 : 190, cap = Math.max(60, innerWidth - 28 - base - 12), w = Math.min(Math.ceil(b.offsetWidth) + 4, cap);
    b.style.maxWidth = w + "px"; el.style.setProperty("--w", w + "px");
    var closed = false;
    curClose = close;
    function close() {
      if (closed) return; closed = true; if (curClose === close) curClose = null;
      el.classList.add("out");
      setTimeout(function () {
        el.classList.remove("on"); nav.style.setProperty("--hiw", "0px");
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); busy = false; pump(500); }, 700);
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
    if (first.length > 40) first = first.slice(0, 39) + "…";
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
