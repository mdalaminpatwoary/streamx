/* Header account menu: signed-in customers get a quick menu (Manage account, Subscriptions, Wishlist, Orders, Renew, Sign out);
   signed-out visitors keep the plain link to the sign-in page. Works for the home header (#acctBtn) and service pages (a.sp-acct). */
(function () {
  var btn = document.getElementById("acctBtn") || document.querySelector("a.sp-acct");
  if (!btn) return;
  var ST = "sx_session", ME = "sx_me", pop = null, open = false, busy = false;
  var tok = function () { try { return localStorage.getItem(ST); } catch (e) { return null; } };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ic = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
  var ITEMS = [
    ["Manage account", "/account/", ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>')],
    ["Subscriptions", "/account/#subs", ic('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/>')],
    ["Wishlist", "/account/#mylist", ic('<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>')],
    ["Orders", "/account/#orders", ic('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>')],
    ["Renew", "/account/#renew", ic('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>'), "renew"]
  ];
  var css = document.createElement("style");
  css.textContent = ".sxm{position:fixed;z-index:120;width:276px;max-width:calc(100vw - 24px);padding:8px;border-radius:20px;background:linear-gradient(180deg,rgba(24,29,62,.97),rgba(11,14,30,.98));box-shadow:0 30px 70px -20px #000,inset 0 0 0 1px rgba(255,255,255,.1);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);font-family:Manrope,system-ui,sans-serif;opacity:0;transform:translateY(-8px) scale(.96);transform-origin:top right;pointer-events:none;transition:opacity .18s,transform .26s cubic-bezier(.16,1,.3,1)}" +
    ".sxm.on{opacity:1;transform:none;pointer-events:auto}" +
    ".sxm-h{display:flex;align-items:center;gap:12px;padding:12px 12px 14px;margin-bottom:6px;border-radius:14px;background:radial-gradient(120% 140% at 0% 0%,rgba(237,49,36,.2),transparent 60%),rgba(255,255,255,.04)}" +
    ".sxm-av{flex:none;display:grid;place-items:center;width:42px;height:42px;overflow:hidden;border-radius:50%;background:linear-gradient(135deg,#ed3124,#ff6a52);color:#fff;font-weight:800;font-size:17px;box-shadow:0 0 0 2px rgba(255,255,255,.18)}.sxm-av img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".sxm-t{min-width:0}.sxm-t b{display:block;color:#fff;font-size:14.5px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sxm-t small{display:block;margin-top:2px;color:#9aa4c7;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".sxm a,.sxm button.sxm-o{display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;border:0;border-radius:12px;background:none;color:#dfe5fb;font:700 14px Manrope,system-ui,sans-serif;text-decoration:none;text-align:left;cursor:pointer;opacity:0;transform:translateX(8px);transition:background .2s,color .2s}" +
    ".sxm.on a,.sxm.on button.sxm-o{opacity:1;transform:none;transition:background .2s,color .2s,opacity .3s calc(var(--i)*40ms + 60ms),transform .35s cubic-bezier(.16,1,.3,1) calc(var(--i)*40ms + 60ms)}" +
    ".sxm a:hover,.sxm a:focus-visible,.sxm button.sxm-o:hover,.sxm button.sxm-o:focus-visible{background:rgba(255,255,255,.09);color:#fff;outline:0}" +
    ".sxm a svg,.sxm button.sxm-o svg{flex:none;width:19px;height:19px;color:#9aa4c7;transition:color .2s,transform .3s}.sxm a:hover svg{color:#ff8a7e;transform:scale(1.1)}" +
    ".sxm a span{flex:1}.sxm a i{flex:none;padding:2px 8px;border-radius:99px;background:linear-gradient(135deg,#ff5a3d,#ed3124);color:#fff;font:800 10.5px Manrope,sans-serif;font-style:normal;letter-spacing:.04em}" +
    ".sxm hr{height:1px;margin:6px 8px;border:0;background:rgba(255,255,255,.09)}" +
    ".sxm button.sxm-o:hover{background:rgba(237,49,36,.16)}.sxm button.sxm-o:hover svg{color:#ff8a7e}" +
    "@media(prefers-reduced-motion:reduce){.sxm,.sxm a,.sxm button.sxm-o{transition:none!important;transform:none!important}}";
  document.head.appendChild(css);

  var cached = function () { try { return JSON.parse(localStorage.getItem(ME) || "null"); } catch (e) { return null; } };
  var avatar = function () { var im = btn.querySelector("img"); return im ? im.src : ""; };
  function dueCount(d) { // subscriptions ending within 7 days (or already ended)
    if (!d || !d.today || !d.subs) return 0; var t = Date.parse(d.today + "T00:00:00Z");
    return d.subs.filter(function (e) { return e && (Date.parse(e + "T00:00:00Z") - t) / 86400000 <= 7; }).length;
  }
  function build() {
    var m = cached() || {}, name = m.n || "", email = m.e || "", due = dueCount(m), pic = avatar();
    var av = pic ? '<img src="' + esc(pic) + '" alt="" referrerpolicy="no-referrer">' : esc(((name || email || "M")[0] || "M").toUpperCase());
    var h = '<div class="sxm-h"><span class="sxm-av">' + av + '</span><span class="sxm-t"><b>' + esc(name || (email ? email.split("@")[0] : "My account")) + "</b><small>" + esc(email || "Signed in") + "</small></span></div>";
    ITEMS.forEach(function (it, i) { h += '<a role="menuitem" style="--i:' + i + '" href="' + it[1] + '">' + it[2] + "<span>" + it[0] + "</span>" + (it[3] === "renew" && due ? "<i>" + due + " due</i>" : "") + "</a>"; });
    h += '<hr><button type="button" class="sxm-o" role="menuitem" style="--i:' + ITEMS.length + '" data-out>' + ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>') + "<span>Sign out</span></button>";
    pop.innerHTML = h;
  }
  function place() { var r = btn.getBoundingClientRect(), w = Math.min(276, innerWidth - 24); pop.style.top = r.bottom + 10 + "px"; pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.right - w)) + "px"; }
  function refresh() { // fill name/email for the header of the menu (once, then cached)
    if (busy || !tok()) return; busy = true;
    fetch("/api/account?a=me", { headers: { Authorization: "Bearer " + tok() } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d) return; var pf = d.profile || {};
      var m = { n: pf.name || "", e: d.email || "", today: d.today, subs: (d.subscriptions || []).map(function (s) { return s.end_date; }) };
      try { localStorage.setItem(ME, JSON.stringify(m)); } catch (e) {} if (open) build();
    }).catch(function () {}).then(function () { busy = false; });
  }
  function show() {
    if (!pop) { pop = document.createElement("div"); pop.className = "sxm"; pop.setAttribute("role", "menu"); pop.setAttribute("aria-label", "Account"); document.body.appendChild(pop);
      pop.addEventListener("click", function (e) { var o = e.target.closest("[data-out]"); if (o) { try { localStorage.removeItem(ST); localStorage.removeItem("sx_av"); localStorage.removeItem(ME); sessionStorage.removeItem("sx_acc_pre"); } catch (x) {} location.reload(); } }); }
    build(); place(); open = true; btn.setAttribute("aria-expanded", "true"); requestAnimationFrame(function () { pop.classList.add("on"); }); refresh();
  }
  function hide() { if (!open) return; open = false; btn.setAttribute("aria-expanded", "false"); pop.classList.remove("on"); }
  btn.setAttribute("aria-haspopup", "menu"); btn.setAttribute("aria-expanded", "false");
  btn.addEventListener("click", function (e) {
    if (!tok() || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // signed out: plain link to sign in
    e.preventDefault(); open ? hide() : show();
  });
  document.addEventListener("click", function (e) { if (open && !e.target.closest(".sxm") && !btn.contains(e.target)) hide(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { hide(); btn.focus(); } });
  addEventListener("resize", function () { if (open) place(); }); addEventListener("scroll", function () { if (open) place(); }, { passive: true });
  btn.addEventListener("pointerenter", function () { if (tok() && !cached()) refresh(); }, { passive: true });
})();
