/* Phone bottom tab bar: Home / Services / Cart / Account. Phones only (<=640px). */
(function(){
  if(window.__sxTabs)return;window.__sxTabs=1;
  var mq=window.matchMedia("(max-width:640px)");
  var path=location.pathname.replace(/index\.html$/,"");
  var ic={
   home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
   svc:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
   search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
   help:'<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5z"/><path d="M9 9.5c.3 2.4 2.6 4.7 5 5l1.2-1.2-1.8-1-.8.6c-.8-.3-1.5-1-1.8-1.8l.6-.8-1-1.8z"/>',
   me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'};
  var svg=function(k){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ic[k]+'</svg>'};
  var act=path==="/"?0:path.indexOf("/services")===0?1:path.indexOf("/account")===0?4:-1;
  var nav=document.createElement("div");nav.className="sx-tb";nav.setAttribute("role","navigation");nav.setAttribute("aria-label","Quick navigation");
  nav.innerHTML='<i class="sx-tb-pill"></i>'+
   '<a class="sx-tb-i" href="/">'+svg("home")+'<span>Home</span></a>'+
   '<a class="sx-tb-i" href="/services/">'+svg("svc")+'<span>Services</span></a>'+
   '<button type="button" class="sx-tb-i" id="sxTbSearch">'+svg("search")+'<span>Search</span></button>'+
   '<a class="sx-tb-i" id="sxTbHelp" href="#" target="_blank" rel="noopener">'+svg("help")+'<span>Help</span></a>'+
   '<a class="sx-tb-i" href="/account/">'+svg("me")+'<span>Account</span></a>';
  var st=document.createElement("style");st.textContent=
   ".sx-tb{display:none}"+
   "@media(max-width:640px){"+
   "html.sx-tb-on{--tbh:calc(70px + env(safe-area-inset-bottom,0px))}"+
   "html.sx-tb-on body{padding-bottom:var(--tbh)}"+
   "html.sx-tb-on .sx-tb{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:50%;transform:translateX(-50%);bottom:calc(8px + env(safe-area-inset-bottom,0px));width:min(420px,100% - 24px);height:56px;padding:5px;border-radius:30px;z-index:45;background:linear-gradient(180deg,rgba(26,32,68,.74),rgba(10,13,28,.82));-webkit-backdrop-filter:blur(26px) saturate(1.6);backdrop-filter:blur(26px) saturate(1.6);box-shadow:0 18px 44px -14px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.1);transition:opacity .25s,transform .35s cubic-bezier(.2,.9,.3,1.1)}"+
   "html.sx-tb-on.lite .sx-tb{background:linear-gradient(180deg,#161b3a,#0a0d1c);-webkit-backdrop-filter:none;backdrop-filter:none}"+
   "html.sx-tb-on .sx-tb::before{content:\"\";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;background:linear-gradient(120deg,rgba(255,255,255,.22),rgba(79,107,255,.3) 45%,rgba(237,49,36,.4));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}"+
   "html.sx-tb-on .sx-tb.hide,html.mn-lock .sx-tb{opacity:0;pointer-events:none;transform:translate(-50%,16px)}"+
   ".sx-tb-pill{position:absolute;top:5px;bottom:5px;left:5px;width:calc((100% - 10px)/5);border-radius:25px;background:linear-gradient(135deg,rgba(79,107,255,.3),rgba(237,49,36,.26));box-shadow:0 8px 22px -10px rgba(237,49,36,.6),inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.1);transition:transform .45s cubic-bezier(.3,1.3,.5,1),opacity .25s;opacity:0}"+
   ".sx-tb-i{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:0;background:none;color:#9aa4c6;font-weight:600;font-size:10.5px;line-height:1;font-family:inherit;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .25s}"+
   ".sx-tb-i.on{color:#fff}.sx-tb-i.on svg{color:#ff8a7c}"+
   ".sx-tb-i:active svg{transform:scale(.88)}.sx-tb-i svg{transition:transform .2s}"+
   ".sx-tb-i em{position:absolute;top:3px;left:calc(50% + 4px);min-width:16px;height:16px;padding:0 4px;border-radius:9px;background:#ed3124;color:#fff;font:700 10px/16px inherit;font-family:inherit;text-align:center;font-style:normal}"+
   "html.sx-tb-on #cw{display:none!important}"+
   "html.sx-tb-on #acctBtn,html.sx-tb-on .sp-nr .sp-acct[href='/account/']{display:none!important}"+
   "html.sx-tb-on .sp-nav nav{display:none!important}"+
   "html.sx-tb-on .sp-nav .sp-navin{flex-wrap:nowrap}"+
   "html.sx-tb-on #burger{order:9}"+
   ".sx-mb{display:none}"+
   "html.sx-tb-on .sx-mb{display:grid;place-items:center;width:40px;height:40px;padding:0;margin:0;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;cursor:pointer}"+
   ".sx-mp{position:fixed;left:12px;right:12px;top:calc(68px + env(safe-area-inset-top,0px));z-index:49;display:none;flex-direction:column;gap:2px;padding:10px;border-radius:24px;background:linear-gradient(180deg,#151a3a,#090c1a);box-shadow:0 30px 70px -20px rgba(0,0,0,.85),inset 0 0 0 1px rgba(255,255,255,.1);max-height:calc(100dvh - 160px);overflow-y:auto}"+
   ".sx-mp.on{display:flex;animation:sxMp .3s cubic-bezier(.2,.9,.3,1.1)}"+
   "@keyframes sxMp{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}"+
   ".sx-mp a{display:flex;align-items:center;gap:14px;padding:12px;border-radius:16px;color:#e4e8f7;text-decoration:none;font-weight:600;font-size:15.5px}"+
   ".sx-mp a svg{width:20px;height:20px;flex:none;opacity:.8}"+
   ".sx-mp a[aria-current]{color:#fff;background:linear-gradient(135deg,rgba(237,49,36,.2),rgba(237,49,36,.05));box-shadow:inset 0 0 0 1px rgba(237,49,36,.35)}"+

   "html.sx-tb-on .sp-buybar{bottom:var(--tbh);padding-bottom:10px}"+
   "html.sx-tb-on .hs-fab{display:none!important}"+
   "html.sx-tb-on .sp-toast{bottom:calc(var(--tbh) + 14px)}"+
   "}";
  document.head.appendChild(st);
  document.body.appendChild(nav);
  var items=nav.querySelectorAll(".sx-tb-i"),pill=nav.querySelector(".sx-tb-pill");
  function setActive(i){items.forEach(function(e,k){e.classList.toggle("on",k===i)});if(i<0){pill.style.opacity=0}else{pill.style.opacity=1;pill.style.transform="translateX("+(i*100)+"%)"}}
  setActive(act);
  /* service pages (phone): a menu button replaces the account icon in the top bar and lists the page sections */
  var spNr=document.querySelector(".sp-nr"),spNav=document.querySelector(".sp-nav nav");
  if(spNr&&spNav){
    var mb=document.createElement("button");mb.type="button";mb.className="sx-mb";mb.setAttribute("aria-label","Menu");mb.setAttribute("aria-expanded","false");
    mb.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
    spNr.appendChild(mb);
    var mp=document.createElement("div");mp.className="sx-mp";document.body.appendChild(mp);
    var shut=function(){mp.classList.remove("on");mb.setAttribute("aria-expanded","false")};
    mb.addEventListener("click",function(e){e.stopPropagation();if(mp.classList.contains("on"))return shut();
      mp.innerHTML="";spNav.querySelectorAll("a").forEach(function(a){if(a.hidden||a.offsetParent===null&&a.hasAttribute("hidden"))return;var c=a.cloneNode(true);c.removeAttribute("id");mp.appendChild(c)});
      mp.classList.add("on");mb.setAttribute("aria-expanded","true")});
    mp.addEventListener("click",function(e){if(e.target.closest("a"))shut()});
    document.addEventListener("click",function(e){if(!mp.contains(e.target))shut()});
    addEventListener("scroll",shut,{passive:true});
  }
  var H=nav.querySelector("#sxTbHelp");
  function wa(){var w=(typeof WA_NUMBER!=="undefined"&&WA_NUMBER)||"";if(w)H.href="https://wa.me/"+String(w).replace(/\D/g,"")+"?text="+encodeURIComponent("Hi StreamX, I need help")}
  wa();document.addEventListener("DOMContentLoaded",wa);window.addEventListener("load",wa);
  nav.querySelector("#sxTbSearch").addEventListener("click",function(){var b=document.getElementById("sxSrchBtn");if(b)b.click()});
  function sync(){document.documentElement.classList.toggle("sx-tb-on",mq.matches)}
  sync();(mq.addEventListener?mq.addEventListener("change",sync):mq.addListener(sync));
  /* hide while typing (on-screen keyboard) */
  document.addEventListener("focusin",function(e){if(/^(input|textarea|select)$/i.test(e.target.tagName)&&!nav.contains(e.target))nav.classList.add("hide")});
  document.addEventListener("focusout",function(){setTimeout(function(){var a=document.activeElement;if(!a||!/^(input|textarea|select)$/i.test(a.tagName))nav.classList.remove("hide")},120)});
})();
