/* Home: the latest 3 notices (pinned first). The section and its menu link stay hidden until there is something to show. */
(function(){
  const sec=document.getElementById("notices");if(!sec)return;
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const KIND={info:"Update",price:"Price change",offer:"Offer",maintenance:"Maintenance",important:"Important"};
  const fmt=d=>new Date(d).toLocaleDateString("en-GB",{timeZone:"Asia/Dhaka",day:"numeric",month:"short",year:"numeric"});
  const SEEN="sx_notice_seen";
  const store={get(){try{return localStorage.getItem(SEEN)||""}catch(e){return ""}},set(v){try{localStorage.setItem(SEEN,v)}catch(e){}}};
  /* One-time island: shows each new notice once per browser, then lives only in the megaphone icon */
  const island=t=>{
    const id=String(t.id!=null?t.id:t.at+"|"+t.t),bell=document.getElementById("ntBell");
    if(!bell||store.get()===id)return;
    store.set(id); /* mark as seen straight away so a refresh never repeats it */
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){bell.classList.add("pop");return}
    const k=KIND[t.k]?t.k:"info",el=document.createElement("a");
    el.className="nt-isl k-"+k;el.href="/notices/#"+k;el.setAttribute("role","status");
    el.innerHTML=`<div class="nt-isl-in"><span class="nt-ik"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg></span><div class="nt-it"><small>${KIND[k]}</small><b>${esc(t.t)}</b>${t.m?`<em>${esc(t.m)}</em>`:""}</div><button class="nt-isl-x" type="button" aria-label="Close">✕</button></div>`;
    const from=()=>{const r=bell.getBoundingClientRect(),ok=r.width>0&&r.top>=0&&r.bottom<=innerHeight;return ok?r:{left:innerWidth-62,top:12,width:42,height:42}};
    const put=(r)=>{el.style.left=r.left+"px";el.style.top=r.top+"px";el.style.width=r.width+"px";el.style.height=r.height+"px"};
    let timer,closed=false,hover=false;
    const close=()=>{if(closed)return;closed=true;clearTimeout(timer);el.classList.remove("open");put(from());setTimeout(()=>{el.style.opacity="0"},520);setTimeout(()=>{el.remove();bell.classList.add("pop")},800)};
    const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{hover?arm():close()},6500)};
    el.addEventListener("mouseenter",()=>{hover=true});el.addEventListener("mouseleave",()=>{hover=false});
    el.querySelector(".nt-isl-x").addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation();close()});
    put(from());document.body.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const w=Math.min(520,innerWidth-24),nb=document.querySelector(".navbar"),top=nb?Math.max(12,nb.getBoundingClientRect().bottom+10):80;
      put({left:(innerWidth-w)/2,top:top,width:w,height:68});el.classList.add("open");arm();
    }));
  };
  const run=()=>fetch("/api/catalog?a=notices").then(r=>r.ok?r.json():null).then(d=>{
    const l=((d&&d.list)||[]).sort((a,b)=>(b.pin-a.pin)||(Date.parse(b.at)-Date.parse(a.at))).slice(0,3);
    if(!l.length)return;
    const bell=document.getElementById("ntBell");if(bell){document.getElementById("ntCount").textContent=((d&&d.list)||[]).length;bell.hidden=false;}
    island(l[0]);
    document.getElementById("ntRow").innerHTML=l.map(n=>{const k=KIND[n.k]?n.k:"info";return `<a class="nt-card k-${k}" href="/notices/#${k}"><span class="nt-kind">${n.pin?"📌 ":""}${KIND[k]}</span><h3>${esc(n.t)}</h3>${n.m?`<p>${esc(n.m)}</p>`:""}<small>${fmt(n.at)}</small></a>`}).join("");
    sec.hidden=false;const nl=document.getElementById("ntNav");if(nl)nl.hidden=false;
  }).catch(()=>{});
  setTimeout(run,900); /* short pause so the page settles before the island pops out */
})();
