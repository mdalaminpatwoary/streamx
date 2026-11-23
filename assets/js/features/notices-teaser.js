/* Home: the latest 3 notices (pinned first). The section and its menu link stay hidden until there is something to show. */
(function(){
  const sec=document.getElementById("notices");if(!sec)return;
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const KIND={info:"Update",price:"Price change",offer:"Offer",maintenance:"Maintenance",important:"Important"};
  const fmt=d=>new Date(d).toLocaleDateString("en-GB",{timeZone:"Asia/Dhaka",day:"numeric",month:"short",year:"numeric"});
  let LIST=[];
  /* Short view: tapping the megaphone opens a small glass panel with the latest announcements over a blurred page */
  const ICONS={info:'<path d="M12 8v5"/><path d="M12 16.5h.01"/><circle cx="12" cy="12" r="9"/>',price:'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',offer:'<path d="M20 12v8H4v-8"/><path d="M2 7h20v5H2z"/><path d="M12 20V7"/>',maintenance:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',important:'<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17.5h.01"/>'};
  let panel=null;
  const closePanel=()=>{if(!panel)return;const p=panel;panel=null;p.classList.remove("open");document.removeEventListener("keydown",onKey);document.documentElement.classList.remove("nt-lock");setTimeout(()=>p.remove(),260);const b=document.getElementById("ntBell");if(b)b.setAttribute("aria-expanded","false")};
  const onKey=e=>{if(e.key==="Escape")closePanel()};
  const openPanel=()=>{
    if(panel||!LIST.length)return;
    document.querySelectorAll(".nt-isl").forEach(x=>x.remove());
    const bell=document.getElementById("ntBell"),nb=document.querySelector(".navbar"),top=nb?Math.max(12,Math.round(nb.getBoundingClientRect().bottom+10)):76;
    const items=LIST.slice(0,4).map(n=>{const k=KIND[n.k]?n.k:"info";return `<a class="nt-pi k-${k}" href="/notices/#${k}"><span class="nt-pic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg></span><span class="nt-pit"><small>${n.pin?"📌 ":""}${KIND[k]} · ${fmt(n.at)}</small><b>${esc(n.t)}</b>${n.m?`<em>${esc(n.m)}</em>`:""}</span></a>`}).join("");
    panel=document.createElement("div");panel.className="nt-pop";
    panel.innerHTML=`<div class="nt-glass"></div><section class="nt-card2" role="dialog" aria-modal="true" aria-label="Announcements" style="top:${top}px"><header><b>Announcements</b><span class="nt-pn">${LIST.length}</span><button type="button" class="nt-px" aria-label="Close">✕</button></header><div class="nt-pl">${items}</div><a class="nt-all" href="/notices/">View all announcements<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg></a><div class="nt-grab" role="separator" aria-label="Swipe up to close"><i></i></div></section>`;
    document.body.appendChild(panel);document.documentElement.classList.add("nt-lock");
    panel.querySelector(".nt-glass").addEventListener("click",closePanel);panel.querySelector(".nt-px").addEventListener("click",closePanel);
    /* Phones and tablets: swipe the bar at the bottom upwards and the panel slides away */
    const card=panel.querySelector(".nt-card2"),glass=panel.querySelector(".nt-glass"),grab=panel.querySelector(".nt-grab");let sy=0,dy=0,t0=0,drag=false;
    grab.addEventListener("pointerdown",e=>{drag=true;sy=e.clientY;dy=0;t0=Date.now();card.style.transition="none";glass.style.transition="none";try{grab.setPointerCapture(e.pointerId)}catch(x){}});
    grab.addEventListener("pointermove",e=>{if(!drag)return;dy=Math.min(0,e.clientY-sy);card.style.transform="translateY("+dy+"px)";card.style.opacity=String(Math.max(.35,1+dy/380));glass.style.opacity=String(Math.max(0,1+dy/420))});
    const end=()=>{if(!drag)return;drag=false;card.style.transition="";glass.style.transition="";const v=Math.abs(dy)/(Date.now()-t0+1);
      if(dy<-70||(dy<-24&&v>.5)){card.style.transform="translateY(-120%)";card.style.opacity="0";glass.style.opacity="0";closePanel()}
      else{card.style.transform="";card.style.opacity="";glass.style.opacity=""}};
    grab.addEventListener("pointerup",end);grab.addEventListener("pointercancel",end);
    document.addEventListener("keydown",onKey);if(bell)bell.setAttribute("aria-expanded","true");
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(panel){panel.classList.add("open");const a=panel.querySelector(".nt-all");a&&a.focus({preventScroll:true})}}));
  };
  const bellEl=document.getElementById("ntBell");
  if(bellEl){bellEl.setAttribute("aria-haspopup","dialog");bellEl.setAttribute("aria-expanded","false");bellEl.addEventListener("click",e=>{if(!LIST.length)return;e.preventDefault();panel?closePanel():openPanel()})}
  const SEEN="sx_notice_seen";
  const store={get(){try{return localStorage.getItem(SEEN)||""}catch(e){return ""}},set(v){try{localStorage.setItem(SEEN,v)}catch(e){}}};
  /* One-time island: shows each new notice once per browser, then lives only in the megaphone icon */
  const island=t=>{
    const id=String(t.id!=null?t.id:t.at+"|"+t.t),bell=document.getElementById("ntBell");
    if(!bell||store.get()===id)return;
    store.set(id); /* mark as seen straight away so a refresh never repeats it */
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){bell.classList.add("nt-pop-b");return}
    const k=KIND[t.k]?t.k:"info",el=document.createElement("a");
    el.className="nt-isl k-"+k;el.href="/notices/#"+k;el.setAttribute("role","status");
    el.innerHTML=`<div class="nt-isl-in"><span class="nt-ik"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg></span><div class="nt-it"><small>${KIND[k]}</small><b>${esc(t.t)}</b>${t.m?`<em>${esc(t.m)}</em>`:""}</div><button class="nt-isl-x" type="button" aria-label="Close">✕</button></div>`;
    const from=()=>{const r=bell.getBoundingClientRect(),ok=r.width>0&&r.top>=0&&r.bottom<=innerHeight;return ok?r:{left:innerWidth-62,top:12,width:42,height:42}};
    const put=(r)=>{el.style.left=r.left+"px";el.style.top=r.top+"px";el.style.width=r.width+"px";el.style.height=r.height+"px"};
    let timer,closed=false,hover=false;
    /* Close with a transform-only fly-back to the icon: no width/height/top animation, so the navbar is never overlapped or re-laid-out (Safari/Firefox glitch) */
    const root=document.documentElement,done=()=>{el.remove();root.classList.remove("nt-isl-on");bell.classList.add("nt-pop-b")};
    const close=()=>{if(closed)return;closed=true;clearTimeout(timer);
      const a=el.getBoundingClientRect(),b=from(),dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
      el.style.transition="transform .45s cubic-bezier(.5,0,.75,0),opacity .35s ease .1s";
      el.style.transformOrigin="50% 50%";el.style.pointerEvents="none";
      requestAnimationFrame(()=>{el.style.transform=`translate(${dx}px,${dy}px) scale(.12)`;el.style.opacity="0"});
      setTimeout(done,520)};
    /* Swipe left or right (like a phone notification) to dismiss: follows the finger, then slides off the screen */
    const swipe=dir=>{if(closed)return;closed=true;clearTimeout(timer);el.style.pointerEvents="none";
      el.style.transition="transform .32s cubic-bezier(.4,0,.8,.4),opacity .28s ease";
      requestAnimationFrame(()=>{el.style.transform=`translateX(${dir*(innerWidth+40)}px)`;el.style.opacity="0"});
      setTimeout(done,360)};
    let sx=0,sy=0,dx0=0,drag=false,moved=false,t0=0;
    el.style.touchAction="pan-y";el.draggable=false;el.style.userSelect="none";el.style.webkitUserDrag="none";el.addEventListener("dragstart",e=>e.preventDefault());
    el.addEventListener("pointerdown",e=>{if(closed||e.target.closest(".nt-isl-x"))return;drag=true;moved=false;sx=e.clientX;sy=e.clientY;dx0=0;t0=Date.now();try{el.setPointerCapture(e.pointerId)}catch(_){}});
    el.addEventListener("pointermove",e=>{if(!drag||closed)return;const x=e.clientX-sx;if(!moved&&Math.abs(x)<6)return;moved=true;dx0=x;clearTimeout(timer);
      el.style.transition="none";el.style.transform=`translateX(${x}px)`;el.style.opacity=String(Math.max(.25,1-Math.abs(x)/(innerWidth*.6)))});
    const up=()=>{if(!drag)return;drag=false;if(!moved){arm();return}
      const v=Math.abs(dx0)/Math.max(1,Date.now()-t0);
      if(Math.abs(dx0)>70||v>.5)swipe(dx0<0?-1:1);
      else{el.style.transition="transform .3s cubic-bezier(.2,.9,.25,1.2),opacity .2s ease";el.style.transform="";el.style.opacity="";arm()}};
    el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
    el.addEventListener("click",e=>{if(moved){e.preventDefault();moved=false}});
    const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{hover?arm():close()},6500)};
    el.addEventListener("mouseenter",()=>{hover=true});el.addEventListener("mouseleave",()=>{hover=false});
    el.querySelector(".nt-isl-x").addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation();close()});
    put(from());document.body.appendChild(el);document.documentElement.classList.add("nt-isl-on");
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const w=Math.min(520,innerWidth-24),top=Math.max(12,innerHeight-68-20); /* bottom of the screen, like a footer toast */
      put({left:(innerWidth-w)/2,top:top,width:w,height:68});el.classList.add("open");arm();
    }));
  };
  const run=()=>fetch("/api/catalog?a=notices").then(r=>r.ok?r.json():null).then(d=>{
    const all=((d&&d.list)||[]).sort((a,b)=>(b.pin-a.pin)||(Date.parse(b.at)-Date.parse(a.at))),l=all.slice(0,3);
    if(!l.length)return;
    LIST=all;
    const bell=document.getElementById("ntBell");if(bell){document.getElementById("ntCount").textContent=((d&&d.list)||[]).length;bell.hidden=false;}
    island(l[0]);
    document.getElementById("ntRow").innerHTML=l.map(n=>{const k=KIND[n.k]?n.k:"info";return `<a class="nt-card k-${k}" href="/notices/#${k}"><span class="nt-kind">${n.pin?"📌 ":""}${KIND[k]}</span><h3>${esc(n.t)}</h3>${n.m?`<p>${esc(n.m)}</p>`:""}<small>${fmt(n.at)}</small></a>`}).join("");
    sec.hidden=false;const nl=document.getElementById("ntNav");if(nl)nl.hidden=false;
  }).catch(()=>{});
  setTimeout(run,900); /* short pause so the page settles before the island pops out */
})();
