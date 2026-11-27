/* Chat assistant: loaded after the page has finished, so the page itself paints first.
   Starts on the first touch / scroll / key press, or when the browser is idle after load, or at once if the chat button is tapped. */
(function () {
  var root = document.getElementById("cw"); if (!root) return;
  var btn = document.getElementById("cwBtn"), bubble = document.getElementById("cwBubble");
  var started = false, ready = null, wantOpen = false;
  var CSS = "/assets/css/components/chatbot.css?v=44";
  var JS = ["/assets/js/features/chatbot.js?v=20261124r", "/assets/js/features/chat-avatar.js?v=20261121j"];
  function load() {
    if (started) return ready; started = true;
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (t) { removeEventListener(t, load, true); });
    var css = new Promise(function (ok) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = CSS; l.onload = l.onerror = ok; document.head.appendChild(l); });
    var js = JS.reduce(function (p, src) { return p.then(function () { return new Promise(function (ok) { var s = document.createElement("script"); s.src = src; s.onload = s.onerror = ok; document.body.appendChild(s); }); }); }, Promise.resolve());
    ready = Promise.all([css, js]).then(function () {
      btn && btn.removeEventListener("click", early, true); bubble && bubble.removeEventListener("click", early, true);
      if (wantOpen && window.sxBot) window.sxBot.open();
    });
    return ready;
  }
  /* If the button is tapped before the chat has loaded, load it and open it as soon as it is ready. */
  function early(e) { if (e.target.closest && e.target.closest("#cwX")) return; e.preventDefault(); e.stopPropagation(); wantOpen = true; load(); }
  btn && btn.addEventListener("click", early, true); bubble && bubble.addEventListener("click", early, true);
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (t) { addEventListener(t, load, { capture: true, once: true, passive: true }); });
  function later() { (window.requestIdleCallback || function (f) { setTimeout(f, 800); })(load, { timeout: 3000 }); }
  /* weak phones (lite mode): wait for the first touch instead of loading the chat on idle */
  if (document.documentElement.classList.contains("lite")) return;
  if (document.readyState === "complete") later(); else addEventListener("load", later);
})();
