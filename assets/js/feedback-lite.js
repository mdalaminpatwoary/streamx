/* Feedback for service pages: small self-contained form that opens in WhatsApp. */
(function () {
  "use strict";
  var WA = "8801312850241", L = ["Poor", "Fair", "Okay", "Good", "Great"], st = { r: 0, t: "Suggestion" };
  var css = ".fbk{position:fixed;inset:0;z-index:300;display:none;place-items:center;padding:16px;background:rgba(5,7,16,.72);backdrop-filter:blur(6px)}.fbk.show{display:grid}.fbk-box{position:relative;width:min(480px,100%);max-height:92vh;overflow:auto;padding:26px 24px 22px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:#0d1124;color:#e8ecfa;font:14px/1.5 Manrope,system-ui,sans-serif}.fbk h3{margin:0 0 4px;font-size:22px;color:#fff}.fbk p{margin:0 0 14px;color:#9aa3c2}.fbk-x{position:absolute;top:12px;right:12px;width:32px;height:32px;border:1px solid rgba(255,255,255,.14);border-radius:50%;background:none;color:#fff;cursor:pointer}.fbk-l{display:block;margin:12px 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9aa3c2}.fbk-row{display:flex;gap:8px;flex-wrap:wrap}.fbk-row button{flex:1;min-width:68px;padding:9px 6px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.04);color:#c5cce2;font:600 12.5px inherit;cursor:pointer}.fbk-row button.on{border-color:#ed3124;background:rgba(237,49,36,.16);color:#fff}.fbk textarea,.fbk input{width:100%;padding:10px 12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.04);color:#fff;font:inherit;box-sizing:border-box}.fbk-send{width:100%;margin-top:14px;padding:12px;border:0;border-radius:999px;background:linear-gradient(135deg,#ff5a45,#ed3124);color:#fff;font:700 14px inherit;cursor:pointer}.fbk-hint{min-height:18px;margin:8px 0 0!important;color:#ff8a7c!important;font-size:12.5px}.fbk-tab{position:absolute;right:0;top:50%;transform:translateY(-50%);z-index:5;display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px 8px 16px;border:1px solid rgba(255,255,255,.12);border-right:0;border-radius:14px 0 0 14px;background:linear-gradient(180deg,rgba(20,25,53,.9),rgba(10,13,28,.95));color:#fff;font:700 13px Manrope,sans-serif;letter-spacing:.08em;cursor:pointer}.fbk-tab:hover{border-color:rgba(237,49,36,.55)}.fbk-sq{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#ff5a45,#ed3124)}.fbk-tx{writing-mode:vertical-rl;transform:rotate(180deg)}";
  var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  var m = document.createElement("div"); m.className = "fbk"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "Feedback");
  m.innerHTML = '<div class="fbk-box"><button class="fbk-x" type="button" aria-label="Close">✕</button><form novalidate><h3>How are we doing?</h3><p>Tell us what we can improve. It takes less than a minute.</p><span class="fbk-l">Your experience</span><div class="fbk-row" data-r>' + L.map(function (t, i) { return '<button type="button" data-v="' + (i + 1) + '">' + t + "</button>"; }).join("") + '</div><span class="fbk-l">Topic</span><div class="fbk-row" data-t>' + ["Suggestion", "Problem", "Compliment", "Question"].map(function (t) { return '<button type="button" data-v="' + t + '"' + (t === "Suggestion" ? ' class="on"' : "") + ">" + t + "</button>"; }).join("") + '</div><span class="fbk-l">Your name (optional)</span><input name="n" autocomplete="name"><span class="fbk-l">Your message</span><textarea name="m" rows="4" placeholder="Tell us what went well, or what we can improve..."></textarea><p class="fbk-hint" role="alert"></p><button class="fbk-send" type="submit">Send on WhatsApp</button></form></div>';
  document.body.appendChild(m);
  var f = m.querySelector("form"), hint = m.querySelector(".fbk-hint");
  var open = function () { m.classList.add("show"); document.documentElement.style.overflow = "hidden"; };
  var close = function () { m.classList.remove("show"); document.documentElement.style.overflow = ""; };
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-fbk],[data-fdk]")) { e.preventDefault(); open(); }
    else if (e.target === m || e.target.closest(".fbk-x")) close();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  m.addEventListener("click", function (e) {
    var b = e.target.closest(".fbk-row button"); if (!b) return;
    var g = b.parentNode; Array.prototype.forEach.call(g.children, function (x) { x.classList.toggle("on", x === b); });
    if (g.hasAttribute("data-r")) st.r = +b.dataset.v; else st.t = b.dataset.v;
  });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!st.r) { hint.textContent = "Please choose how your experience was."; return; }
    var t = f.m.value.trim(); if (t.length < 5) { hint.textContent = "Please write a short message."; return; }
    var txt = "Hi StreamX! Here is my feedback.\nExperience: " + st.r + "/5 (" + L[st.r - 1] + ")\nTopic: " + st.t + "\nPage: " + location.pathname + (f.n.value.trim() ? "\nName: " + f.n.value.trim() : "") + "\nMessage: " + t;
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(txt), "_blank", "noopener"); hint.textContent = ""; close();
  });
})();
