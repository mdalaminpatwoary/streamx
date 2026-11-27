/* Phone bottom tab bar: Home / Services / Cart / Account. Phones only (<=640px). */
(function(){
  if(window.__sxTabs)return;window.__sxTabs=1;
  var mq=window.matchMedia("(max-width:640px)");
  var path=location.pathname.replace(/index\.html$/,"");
  var ic={
   home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
   svc:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
   search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
   help:'<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.2c-1.3 0-2.5-.3-3.6-.8L4 20l1.3-4.4A8.2 8.2 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3.3 8.4 8.4 0 0 1 21 11.5z"/><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" stroke-width="2.4"/>',
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
   "html.sx-tb-on .sx-tb{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:50%;transform:translateX(-50%);bottom:calc(8px + env(safe-area-inset-bottom,0px));width:min(420px,100% - 24px);height:60px;padding:6px;border-radius:30px;z-index:45;background:linear-gradient(180deg,rgba(30,37,76,.52),rgba(11,14,30,.5));-webkit-backdrop-filter:blur(22px) saturate(1.7);backdrop-filter:blur(22px) saturate(1.7);box-shadow:0 18px 44px -20px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.1);transition:opacity .25s,transform .35s cubic-bezier(.2,.9,.3,1.1)}"+
   "html.sx-tb-on .sx-tb.hide,html.mn-lock .sx-tb{opacity:0;pointer-events:none;transform:translate(-50%,16px)}"+
   ".sx-tb-pill{position:absolute;top:6px;bottom:6px;left:6px;width:calc((100% - 12px)/5);border-radius:24px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);box-shadow:0 8px 20px -10px rgba(237,49,36,.5),inset 0 1px 0 rgba(255,255,255,.1);transition:transform .45s cubic-bezier(.3,1.3,.5,1),opacity .25s;opacity:0}"+
   ".sx-tb-i{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:0;background:none;color:#a3acd0;font-weight:600;font-size:10.5px;line-height:1;font-family:inherit;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .25s}"+
   ".sx-tb-i.on{color:#fff}.sx-tb-i.on svg{color:#ff6a5c;filter:drop-shadow(0 0 8px rgba(237,49,36,.5))}"+
   ".sx-tb-i:active svg,.sx-tb-i:active .sx-tb-av{transform:scale(.88)}.sx-tb-i svg,.sx-tb-av{transition:transform .2s,box-shadow .25s}"+
   ".sx-tb-av{display:block;width:24px;height:24px;border-radius:50%;object-fit:cover;background:#1b2142;box-shadow:0 0 0 1.5px rgba(255,255,255,.3)}"+
   ".sx-tb-i.on .sx-tb-av{box-shadow:0 0 0 2px #ff6a5c,0 0 12px rgba(237,49,36,.55)}"+
   ".sx-tb-i em{position:absolute;top:3px;left:calc(50% + 4px);min-width:16px;height:16px;padding:0 4px;border-radius:9px;background:#ed3124;color:#fff;font:700 10px/16px inherit;font-family:inherit;text-align:center;font-style:normal}"+
   "html.sx-tb-on #cw{display:none!important}"+
   "html.sx-tb-on #acctBtn,html.sx-tb-on .sp-nr .sp-acct[href='/account/']{display:none!important}"+
   "html.sx-tb-on .sp-nav nav{display:none!important}"+
   "html.sx-tb-on .sp-nav .sp-navin{flex-wrap:nowrap}"+
   "html.sx-tb-on .nav .navbar,html.sx-tb-on .nav.pill .navbar,html.sx-tb-on .sp-nav .sp-navin,html.sx-tb-on .sp-nav.sp-compact .sp-navin{background:linear-gradient(180deg,rgba(30,37,76,.52),rgba(11,14,30,.5))!important;-webkit-backdrop-filter:blur(22px) saturate(1.7)!important;backdrop-filter:blur(22px) saturate(1.7)!important;box-shadow:0 18px 44px -20px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.04)!important}"+
   "html.sx-tb-on .nav.scrolled .navbar,html.sx-tb-on .sp-nav.sp-scrolled .sp-navin{background:linear-gradient(180deg,rgba(24,30,64,.68),rgba(9,12,26,.66))!important}"+
   "html.sx-tb-on #burger{order:9}"+
   "html.sx-tb-on .nav.pill .navbar{width:max(168px,calc(var(--pw,168px) + var(--hiw,0px)))}"+
   ".sx-mb{display:none}"+
   "html.sx-tb-on .sx-mb{display:grid;place-items:center;width:40px;height:40px;padding:0;margin:0;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;cursor:pointer}"+
   ".sx-mo{position:fixed;inset:0;z-index:48;background:rgba(5,7,16,.38);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .3s}"+
   ".sx-mo.on{opacity:1;pointer-events:auto}"+
   ".sx-mp{position:fixed;left:12px;right:12px;top:calc(72px + env(safe-area-inset-top,0px));z-index:49;display:none;flex-direction:column;gap:3px;padding:12px 10px 10px;border-radius:30px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;max-height:calc(100dvh - 72px - var(--tbh,70px) - 22px - env(safe-area-inset-top,0px));background:radial-gradient(300px circle at 100% 0,rgba(79,107,255,.3),transparent 62%),radial-gradient(280px circle at 0 100%,rgba(237,49,36,.22),transparent 62%),linear-gradient(180deg,rgba(24,30,64,.6),rgba(9,12,26,.58));-webkit-backdrop-filter:blur(28px) saturate(1.6);backdrop-filter:blur(28px) saturate(1.6);border:1px solid rgba(255,255,255,.13);box-shadow:0 34px 80px -22px rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.16)}"+
   ".sx-mp::-webkit-scrollbar{display:none}"+
   ".sx-mp.on{display:flex;transform-origin:100% 0;animation:sxMp .38s cubic-bezier(.2,.9,.3,1.1)}"+
   "@keyframes sxMp{from{opacity:0;transform:translateY(-10px) scale(.96)}to{opacity:1;transform:none}}"+
   ".sx-mp h6{margin:2px 10px 6px;font:800 10.5px/1 Manrope,system-ui,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:rgba(201,208,240,.55)}"+
   ".sx-mp a{position:relative;display:flex;align-items:center;gap:14px;padding:8px 12px 8px 8px;border-radius:20px;color:#e4e8f7;text-decoration:none;font-weight:700;font-size:16px;-webkit-tap-highlight-color:transparent;transition:background .25s,transform .2s}"+
   ".sx-mp.on a{animation:sxMi .5s cubic-bezier(.2,.9,.3,1) both;animation-delay:calc(var(--k,0)*32ms + 70ms)}"+
   "@keyframes sxMi{from{opacity:0;transform:translate3d(-14px,0,0)}to{opacity:1;transform:none}}"+
   ".sx-mp a:active{transform:scale(.97);background:rgba(255,255,255,.06)}"+
   ".sx-mp a::after{content:\"\";width:7px;height:7px;margin-left:auto;border-top:2px solid currentColor;border-right:2px solid currentColor;transform:rotate(45deg);opacity:.3;flex:none}"+
   ".sx-mp .mi{flex:none;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;color:#c9d0f0;background:linear-gradient(160deg,rgba(255,255,255,.12),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.16)}"+
   ".sx-mp .mi svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;overflow:visible}"+
   ".sx-mp a[aria-current]{color:#fff;background:linear-gradient(135deg,rgba(237,49,36,.24),rgba(237,49,36,.05));box-shadow:inset 0 0 0 1px rgba(237,49,36,.4)}"+
   ".sx-mp a[aria-current] .mi{color:#fff;background:linear-gradient(135deg,#ed3124,#ff6a3d);border-color:transparent;box-shadow:0 8px 20px -6px rgba(237,49,36,.7),inset 0 1px 0 rgba(255,255,255,.35)}"+
   ".sx-mp a[aria-current]::after{opacity:.8}"+

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
    var mo=document.createElement("div");mo.className="sx-mo";document.body.appendChild(mo);
    var shut=function(){mp.classList.remove("on");mo.classList.remove("on");mb.setAttribute("aria-expanded","false")};
    var I={
      home:['i-home','<path class="rf" d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>'],
      play:['i-play','<rect x="3" y="5" width="18" height="14" rx="3.5"/><path class="pl" d="M10.4 9.4v5.2l4.3-2.6z" fill="currentColor" stroke="none"/>'],
      music:['i-music','<path class="b1" d="M6 18V10"/><path class="b2" d="M12 18V5"/><path class="b3" d="M18 18v-6"/>'],
      ai:['i-ai','<path class="sp" d="M11 3.5l1.9 5.4 5.4 1.9-5.4 1.9L11 18.1l-1.9-5.4-5.4-1.9 5.4-1.9z"/><path class="sm" d="M19 15v4M17 17h4"/>'],
      check:['i-check','<rect x="4" y="4" width="16" height="16" rx="4.5"/><path class="ck" d="M8.2 12.4l2.6 2.6 5-5.2"/>'],
      gift:['i-gift','<rect x="3.5" y="10" width="17" height="10" rx="2"/><path d="M12 10v10M3.5 14h17"/><path class="bow" d="M12 10c-2.4-4.4-6-3-5 0 .4 1.4 3 1 5 0zm0 0c2.4-4.4 6-3 5 0-.4 1.4-3 1-5 0z"/>'],
      book:['i-book','<path class="pg" d="M4 5.5c3-1 5.5-.5 8 1 2.5-1.5 5-2 8-1V18c-3-1-5.5-.5-8 1-2.5-1.5-5-2-8-1z"/><path d="M12 6.5V19"/>'],
      card:['i-card','<g class="cd"><rect x="3" y="6" width="18" height="12" rx="2.8"/><path d="M3 10.5h18M7 15h3"/></g>'],
      shield:['i-shield','<path class="sh" d="M12 3 5 6v5.5c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6z"/><path d="m9.2 12 2 2 3.6-3.8"/>'],
      heart:['i-heart','<path class="ht" d="M12 20s-7.2-4.4-7.2-10A4.1 4.1 0 0 1 12 7.6 4.1 4.1 0 0 1 19.2 10c0 5.6-7.2 10-7.2 10z"/>'],
      thumb:['i-thumb','<path d="M7 11v9H4v-9z"/><path class="th" d="M7 11l4-7a2 2 0 0 1 2 2v3h5.4a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 17.4 19H7"/>'],
      layers:['i-layers','<path class="l0" d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>'],
      help:['i-help','<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/>'],
      tag:['i-tag','<g class="tg"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/></g>'],
      star:['i-star','<path class="st" d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'],
      trend:['i-trend','<path class="tr" d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'],
      info:['i-q','<circle cx="12" cy="12" r="9"/><path class="qq" d="M12 11v5M12 7.8h.01" stroke-width="2.2"/>'],
      faq:['i-q','<circle cx="12" cy="12" r="9"/><path class="qq" d="M9.5 9.6a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1 1-1.1 1.8M12 17h.01" stroke-width="2"/>'],
      dot:['i-q','<circle cx="12" cy="12" r="3"/>']
    };
    var KEY={"/":"home","#streaming":"play","#music-audio":"music","#ai-tools":"ai","#productivity":"check","#gift-cards":"gift","#learning":"book","#virtual-cards":"card","#vpn":"shield","#dating":"heart","#facebook":"thumb","#bundle":"layers","#contact":"help","#plans":"tag","#combo":"layers","#trending":"trend","#about":"info","#reviews":"star","#faq":"faq","#why":"shield"};
    function build(){
      var head=document.querySelector(".hb-hero")?"Browse categories":"On this page",k=0;
      mp.innerHTML="<h6>"+head+"</h6>";
      spNav.querySelectorAll("a").forEach(function(a){
        if(a.hidden||a.offsetParent===null&&a.hasAttribute("hidden"))return;
        var sp=a.querySelector("span"),label=(sp?sp.textContent:a.textContent).trim(),h=a.getAttribute("href")||"",ic=I[KEY[h]]||I.dot;
        var c=document.createElement("a");c.href=h;c.style.setProperty("--k",k++);if(a.hasAttribute("aria-current"))c.setAttribute("aria-current",a.getAttribute("aria-current"));
        c.innerHTML='<i class="mi"><svg class="'+ic[0]+'" viewBox="0 0 24 24" aria-hidden="true">'+ic[1]+'</svg></i><span></span>';c.lastChild.textContent=label;mp.appendChild(c);
      });
    }
    mb.addEventListener("click",function(e){e.stopPropagation();if(mp.classList.contains("on"))return shut();
      build();mp.scrollTop=0;mp.classList.add("on");mo.classList.add("on");mb.setAttribute("aria-expanded","true")});
    mp.addEventListener("click",function(e){if(e.target.closest("a"))shut()});
    document.addEventListener("click",function(e){if(!mp.contains(e.target))shut()});
    addEventListener("scroll",shut,{passive:true});
  }
  /* signed-in customers see their profile photo in place of the account icon (photo cached by My account in localStorage "sx_av") */
  function avatar(){
    var a=nav.querySelector('a[href="/account/"]'),old=a&&a.querySelector(".sx-tb-av"),p="";
    try{if(localStorage.getItem("sx_session")){var v=JSON.parse(localStorage.getItem("sx_av")||"null");p=v&&v.p||""}}catch(e){}
    if(!a)return;
    if(!p){if(old){old.remove();var sv=a.querySelector("svg");if(sv)sv.style.display=""}return}
    if(old&&old.dataset.src===p)return;
    var im=new Image();im.className="sx-tb-av";im.alt="";im.width=24;im.height=24;im.referrerPolicy="no-referrer";im.dataset.src=p;
    im.onload=function(){var o=a.querySelector(".sx-tb-av");if(o)o.remove();var sv=a.querySelector("svg");if(sv)sv.style.display="none";a.insertBefore(im,a.firstChild)};
    im.src=p;
  }
  avatar();addEventListener("load",avatar);addEventListener("storage",avatar);addEventListener("pageshow",avatar);
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
