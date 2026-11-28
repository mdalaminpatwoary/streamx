/* Chat assistant: loaded after the page has finished, so the page itself paints first.
   Starts on the first touch / scroll / key press, or when the browser is idle after load, or at once if the chat button is tapped. */
(function () {
  var root = document.getElementById("cw"); if (!root) return;
  /* phones and weak devices: no floating chat bubble (the tab bar has a WhatsApp Help button) */
  if (document.documentElement.classList.contains("lite") || matchMedia("(max-width:640px)").matches) { root.remove(); return; }
  var btn = document.getElementById("cwBtn"), bubble = document.getElementById("cwBubble");
  var started = false, ready = null, wantOpen = false, lean = !!window.spData, cssP = null, avP = null;
  var CSS = "/assets/css/components/chatbot.css?v=44";
  var JS = ["/assets/js/features/chatbot.js?v=20261128c", "/assets/js/features/chat-avatar.js?v=20261121j"];
  function loadCss() { return cssP || (cssP = new Promise(function (ok) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = CSS; l.onload = l.onerror = ok; document.head.appendChild(l); })); }
  function put(src) { return new Promise(function (ok) { var s = document.createElement("script"); s.src = src; s.onload = s.onerror = ok; document.body.appendChild(s); }); }
  /* Pages that fetch their catalog on demand: the small avatar/button script loads when idle; the assistant (which needs the catalog) only when its button is tapped. */
  function avatarOnly() { return avP || (avP = Promise.all([loadCss(), put(JS[1])])); }
  function load() {
    if (started) return ready; started = true;
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (t) { removeEventListener(t, load, true); });
    var css = loadCss();
    var js = (lean ? [JS[0]].concat(avP ? [] : [JS[1]]) : JS).reduce(function (p, src) { return p.then(function () { return put(src); }); }, window.spData ? window.spData() : Promise.resolve());
    ready = Promise.all([css, js]).then(function () {
      btn && btn.removeEventListener("click", early, true); bubble && bubble.removeEventListener("click", early, true);
      if (wantOpen && window.sxBot) window.sxBot.open();
    });
    return ready;
  }
  /* If the button is tapped before the chat has loaded, load it and open it as soon as it is ready. */
  function early(e) { if (e.target.closest && e.target.closest("#cwX")) return; e.preventDefault(); e.stopPropagation(); wantOpen = true; load(); }
  btn && btn.addEventListener("click", early, true); bubble && bubble.addEventListener("click", early, true);
  if (lean) { (window.requestIdleCallback || function (f) { setTimeout(f, 800); })(function () { if (!started) avatarOnly(); }, { timeout: 3000 }); return; }
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (t) { addEventListener(t, load, { capture: true, once: true, passive: true }); });
  function later() { (window.requestIdleCallback || function (f) { setTimeout(f, 800); })(load, { timeout: 3000 }); }
  /* weak phones (lite mode): wait for the first touch instead of loading the chat on idle */
  if (document.documentElement.classList.contains("lite")) return;
  if (document.readyState === "complete") later(); else addEventListener("load", later);
})();
