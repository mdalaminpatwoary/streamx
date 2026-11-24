/* Trending: top 10 movies and series per streaming platform and region (data from /api/trending). */
// ===== Trending section =====
(function(){
  const sec=$("#trending");if(!sec)return;
  const PLATFORMS=[
    {id:"netflix",name:"Netflix",logo:"netflix",shop:"Netflix"},
    {id:"prime",name:"Prime Video",logo:"primevideo",shop:"Amazon Prime Video"},
    {id:"disney",name:"Disney+",mono:"D+",bg:"#113CCF",shop:"Disney+"},
    {id:"hbomax",name:"HBO Max",logo:"hbomax",shop:"HBO Max"},
    {id:"crunchyroll",name:"Crunchyroll",logo:"crunchyroll",shop:"Crunchyroll"},
    {id:"hotstar",name:"JioHotstar",mono:"JH",bg:"#1F2A6B",shop:"JioHotstar"},
    {id:"paramount",name:"Paramount+",logo:"paramountplus",shop:"Paramount+"},
    {id:"hulu",name:"Hulu",logo:"hulu",shop:"Hulu"},
    {id:"appletv",name:"Apple TV+",mono:"tv+",bg:"#1d1d1f",shop:"Apple TV+"},
    {id:"peacock",name:"Peacock",mono:"P",bg:"#111",shop:"Peacock"},
    {id:"zee5",name:"ZEE5",logo:"zee5",shop:"ZEE5"},
    {id:"viki",name:"Rakuten Viki",mono:"V",bg:"#0b8fe0",shop:"Viki"},
    {id:"mubi",name:"MUBI",mono:"M",bg:"#0a0a0a",shop:"MUBI"}
  ];
  const REGIONS=[["CA","Canada"],["CN","China"],["CY","Cyprus"],["FI","Finland"],["FR","France"],["DE","Germany"],["HU","Hungary"],["IN","India"],["IT","Italy"],["KW","Kuwait"],["MY","Malaysia"],["MV","Maldives"],["NP","Nepal"],["OM","Oman"],["PK","Pakistan"],["QA","Qatar"],["SA","Saudi Arabia"],["SG","Singapore"],["KR","South Korea"],["ES","Spain"],["SE","Sweden"],["CH","Switzerland"],["TH","Thailand"],["AE","United Arab Emirates"],["GB","United Kingdom"],["US","United States"]];   // the 25 delivery countries + India (alphabetical, India in its place)
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const flag=c=>`https://flagcdn.com/48x36/${c.toLowerCase()}.png`;
  const ok=(v,list)=>list.includes(v);
  /* "New": released in the last 30 days */
  const isNew=m=>{const t=Date.parse(m.d||"");return t>0&&Date.now()-t>=0&&Date.now()-t<30*864e5};

  // Defaults: movies, in the visitor's own country (from their IP address); the United States when that country isn't in the list.
  // JioHotstar is India only. A region the visitor picks themselves is remembered.
  let geo="US";
  const homeRegion=p=>["hotstar","zee5"].includes(p)?"IN":geo;
  const R=()=>st.p==="hotstar"?"IN":st.r;
  let st={p:"netflix",r:"US",k:"movie",manual:false};
  try{const s=JSON.parse(localStorage.getItem("sx_trend2")||"{}");
    if(ok(s.p,PLATFORMS.map(x=>x.id)))st.p=s.p;
    if(s.manual&&ok(s.r,REGIONS.map(x=>x[0]))){st.r=s.r;st.manual=true}else st.r=homeRegion(st.p);
    if(ok(s.k,["movie","tv"]))st.k=s.k}catch(e){}
  const save=()=>{try{localStorage.setItem("sx_trend2",JSON.stringify(st))}catch(e){}};

  const tabs=$("#trTabs"),ink=tabs.querySelector(".tr-ink"),rail=$("#trRail"),seg=$("#trType"),thumb=seg.querySelector(".tr-thumb");
  const cache=new Map();let shown=false,token=0;

  // ---------- Platform tabs ----------
  const icon=p=>{
    const L=p.logo&&LOGOS[p.logo];
    return L?`<i style="background:${L.bg}"><svg viewBox="${L.vb}" fill="${L.fg}"><path d="${L.p}"/></svg></i>`:`<i style="background:${p.bg}">${p.mono}</i>`;
  };
  tabs.insertAdjacentHTML("beforeend",PLATFORMS.map(p=>`<button type="button" role="tab" class="tr-tab" data-p="${p.id}" aria-selected="false">${icon(p)}${p.name}</button>`).join(""));
  const slide=(box,el,bar)=>{if(!el||!el.offsetWidth)return;bar.style.width=el.offsetWidth+"px";bar.style.transform=`translateX(${el.offsetLeft}px)`};
  function paintControls(){
    tabs.querySelectorAll(".tr-tab").forEach(b=>{const on=b.dataset.p===st.p;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
    seg.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.k===st.k));
    const a=tabs.querySelector(".tr-tab.on");slide(tabs,a,ink);slide(seg,seg.querySelector("button.on"),thumb);
    if(a&&tabs.scrollWidth>tabs.clientWidth)tabs.scrollTo({left:a.offsetLeft-tabs.clientWidth/2+a.offsetWidth/2,behavior:"smooth"});
  }
  tabs.onclick=e=>{const b=e.target.closest(".tr-tab");if(!b||b.dataset.p===st.p)return;st.p=b.dataset.p;if(!st.manual)st.r=homeRegion(st.p);paintRegion();save();paintControls();load()};
  seg.onclick=e=>{const b=e.target.closest("button");if(!b||b.dataset.k===st.k)return;st.k=b.dataset.k;save();paintControls();render()};
  addEventListener("resize",()=>shown&&paintControls());

  // ---------- Region picker ----------
  const btn=$("#trRegBtn"),pop=$("#trPop"),list=$("#trRegList"),rq=$("#trRegQ");
  function paintRegion(){
    const r=REGIONS.find(x=>x[0]===R());$("#trRegName").textContent=r[1];
    const f=$("#trFlag");f.style.visibility="";f.src=flag(r[0]);f.onerror=()=>{f.style.visibility="hidden"};
  }
  function fillList(q=""){
    list.innerHTML=REGIONS.filter(r=>(st.p!=="hotstar"||r[0]==="IN")&&r[1].toLowerCase().includes(q.toLowerCase())).map(r=>`<li role="option" tabindex="0" data-r="${r[0]}" aria-selected="${r[0]===R()}"><img src="${flag(r[0])}" alt="" width="22" height="16" loading="lazy" onerror="this.style.visibility='hidden'">${r[1]}</li>`).join("")||`<li aria-disabled="true">No match</li>`;
  }
  function openPop(o){
    pop.hidden=!o;btn.setAttribute("aria-expanded",o);
    if(o){rq.value="";fillList();setTimeout(()=>rq.focus(),30)}
  }
  btn.onclick=()=>openPop(pop.hidden);
  rq.oninput=()=>fillList(rq.value);
  const pick=li=>{if(!li||!li.dataset.r)return;if(st.p==="hotstar"){openPop(false);btn.focus();return}st.r=li.dataset.r;st.manual=true;save();paintRegion();openPop(false);btn.focus();load()};
  list.onclick=e=>pick(e.target.closest("li"));
  list.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(e.target.closest("li"))}};
  document.addEventListener("click",e=>{if(!pop.hidden&&!$("#trReg").contains(e.target))openPop(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!pop.hidden){openPop(false);btn.focus()}});

  // ---------- Data ----------
  async function fetchTop(p,r){
    const key=p+"|"+r,hit=cache.get(key);
    if(hit&&Date.now()-hit.t<10*60*1000)return hit.j;
    const res=await fetch(`/api/trending?p=${p}&r=${r}`);
    if(!res.ok)throw new Error("HTTP "+res.status);
    const j=await res.json();cache.set(key,{t:Date.now(),j});return j;
  }
  const pl=()=>PLATFORMS.find(x=>x.id===st.p);
  const regionName=()=>REGIONS.find(x=>x[0]===R())[1];
  let data=null;

  function skeleton(){
    rail.innerHTML=Array.from({length:8},()=>`<div class="tr-sk"><i></i><b></b></div>`).join("");
  }
  async function load(){
    const my=++token;skeleton();cta();
    try{
      const j=await fetchTop(st.p,R());
      if(my!==token)return;
      data=j;render();paintLive();
      if(!shown){shown=true;sec.hidden=false;const n=$("#trNav");if(n)n.hidden=false;requestAnimationFrame(()=>{paintControls();if(window.realignHash)realignHash()})}
    }catch(e){
      if(my!==token)return;
      if(!shown)return; // first load failed (e.g. not configured yet): keep the whole section hidden
      rail.innerHTML=`<div class="tr-msg"><b>Couldn't load trending right now</b>Please check your connection and try again.<br><button class="btn ghost" type="button" id="trRetry">Try again</button></div>`;
      $("#trRetry").onclick=load;
    }
  }
  function items(){
    if(!data)return[];
    return(st.k==="tv"?data.tv:data.movies).slice(0,10);
  }
  function render(){
    const list=items(),P=pl(),note=$("#trNote");
    const fb=data&&data.fallback&&REGIONS.find(x=>x[0]===data.fallback);
    note.hidden=!fb;
    if(fb)note.textContent=`Our data source has no ${regionName()} listings for ${P.name}, so this shows what's trending in ${fb[1]}.`;
    if(!list.length){
      rail.innerHTML=`<div class="tr-msg"><b>Nothing to show for ${esc(P.name)} in ${esc(regionName())}</b>${esc(P.name)} may not be available in this region. Try another region or platform.</div>`;
      return;
    }
    rail.innerHTML=list.map((m,i)=>`<article class="tr-card" style="--i:${i}" tabindex="0" role="button" aria-label="${esc(m.t)}: details and trailer" data-id="${m.id}" data-k="${m.k}"><span class="tr-rank" aria-hidden="true">${i+1}</span><div class="tr-poster"><img src="https://image.tmdb.org/t/p/w342${esc(m.p)}" alt="${esc(m.t)} poster" loading="lazy"><span class="tr-kind">${m.k==="tv"?"Series":"Movie"}</span>${isNew(m)?`<span class="tr-new">New</span>`:""}<div class="tr-ov" aria-hidden="true"><span class="tr-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><b>Watch trailer</b></div></div><div class="tr-info"><h3>${esc(m.t)}</h3><div class="tr-meta">${m.y?`<span>${esc(m.y)}</span>`:""}${m.v?`<span class="tr-star">★ ${m.v}</span>`:""}</div></div></article>`).join("");
    rail.scrollTo({left:0});
  }

  // ---------- Title details (IMDb link + trailer) ----------
  const dlg=document.createElement("div");dlg.className="tt";dlg.hidden=true;dlg.setAttribute("role","dialog");dlg.setAttribute("aria-modal","true");
  dlg.innerHTML=`<div class="tt-bg" data-x></div><div class="tt-box" tabindex="-1"><button class="tt-x" type="button" data-x aria-label="Close">×</button><div class="tt-in"></div></div>`;
  document.body.appendChild(dlg);
  const tin=dlg.querySelector(".tt-in"),tbox=dlg.querySelector(".tt-box");let lastFocus=null,tTok=0;const tcache=new Map();
  const mins=n=>n?(n>=60?Math.floor(n/60)+"h "+(n%60?n%60+"m":""):n+"m"):"";
  if(window.sxSwipe)sxSwipe(tbox,{bg:dlg.querySelector(".tt-bg"),close:()=>closeT()});
  function closeT(){dlg.hidden=true;tin.innerHTML="";document.documentElement.classList.remove("tt-open");if(lastFocus)lastFocus.focus()}
  dlg.addEventListener("click",e=>{if(e.target.closest("[data-x]"))closeT()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!dlg.hidden)closeT()});
  function buyCard(){
    const P=pl(),i=PRODUCTS.findIndex(x=>x.name===P.shop),prod=PRODUCTS[i];
    const logo=prod?ptile(prod):`<span class="lg" style="background:${P.bg||"#1d2347"}">${esc(P.mono||P.name[0])}</span>`;
    if(prod){const from=Math.min(...prod.variants.flatMap(v=>v.plans.map(x=>x.p)));
      return `<div class="tt-buy">${logo}<div class="tt-buy-t"><small>Wanna watch it now?</small><b>Grab yours · ${esc(P.name)}</b><span>Plans from <strong>${taka(from)}</strong></span></div><button class="btn grad-bg" type="button" data-buy="${i}">Buy now <i aria-hidden="true">→</i></button></div>`}
    return `<div class="tt-buy">${logo}<div class="tt-buy-t"><small>Wanna watch it now?</small><b>Grab yours · ${esc(P.name)}</b><span>Ask us for today's price</span></div><a class="btn grad-bg" target="_blank" rel="noopener" href="${wa("Hi StreamX! I want a "+P.name+" subscription.")}">Order <i aria-hidden="true">↗</i></a></div>`;
  }
  tin.addEventListener("click",e=>{const b=e.target.closest("[data-buy]");if(!b)return;const i=+b.dataset.buy;closeT();showPlans(i,true)});
  function paintT(d){
    const meta=[d.y,d.k==="tv"?(d.seasons?d.seasons+" season"+(d.seasons>1?"s":""):"Series"):mins(d.rt),d.lang].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("");
    tin.innerHTML=`<div class="tt-hero" style="${d.bd?`--bd:url(https://image.tmdb.org/t/p/w780${esc(d.bd)})`:""}">
      <div class="tt-media" id="ttMedia">${d.yt?`<button class="tt-play" type="button" id="ttPlay" aria-label="Play trailer"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><b>Play trailer</b></button>`:`<div class="tt-nt">No trailer available</div>`}</div></div>
      <div class="tt-body">
        <div class="tt-head"><div class="tt-ttl"><h3>${esc(d.t)}</h3>${d.tag?`<p class="tt-tag">${esc(d.tag)}</p>`:""}</div>${buyCard()}</div>
        <div class="tt-meta">${meta}${d.v?`<span class="tt-rate">★ ${d.v}<small>/10 TMDB${d.vc?` · ${d.vc.toLocaleString()} votes`:""}</small></span>`:""}</div>
        ${d.g.length?`<div class="tt-gen">${d.g.map(g=>`<i>${esc(g)}</i>`).join("")}</div>`:""}
        ${d.o?`<p class="tt-ov">${esc(d.o)}</p>`:""}
        ${d.dir?`<p class="tt-dir"><small>${d.k==="tv"?"Created by":"Director"}</small> ${esc(d.dir)}</p>`:""}
        ${d.cast.length?`<div class="tt-cast">${d.cast.slice(0,6).map(c=>`<div>${c.p?`<img src="https://image.tmdb.org/t/p/w185${esc(c.p)}" alt="" loading="lazy">`:`<span class="tt-ph">${esc(c.n[0]||"")}</span>`}<b>${esc(c.n)}</b><small>${esc(c.c)}</small></div>`).join("")}</div>`:""}
        <div class="tt-act">${d.imdb?`<a class="btn imdb" href="https://www.imdb.com/title/${esc(d.imdb)}/" target="_blank" rel="noopener"><b>IMDb</b> View ratings &amp; reviews ↗</a>`:`<a class="btn ghost" href="https://www.imdb.com/find/?q=${encodeURIComponent(d.t)}" target="_blank" rel="noopener">Search on IMDb ↗</a>`}
          ${d.yt?`<a class="btn ghost" href="https://www.youtube.com/watch?v=${esc(d.yt)}" target="_blank" rel="noopener">Open on YouTube ↗</a>`:""}</div>
      </div>`;
    const pb=$("#ttPlay");
    if(pb)pb.onclick=()=>{{$("#ttMedia").innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.yt)}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${encodeURIComponent(d.yt)}&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0" title="${esc(d.t)} trailer" allow="autoplay; encrypted-media" tabindex="-1" style="opacity:0;transition:opacity .9s ease"></iframe>`;setTimeout(()=>{const f=document.querySelector("#ttMedia iframe");if(f)f.style.opacity="1"},4000)}};   /* cover (backdrop) stays 4s, muted, no controls */
  }
  async function openT(id,k,from){
    lastFocus=from;const my=++tTok;dlg.hidden=false;document.documentElement.classList.add("tt-open");
    tin.innerHTML=`<div class="tt-load"><i></i><span>Loading details…</span></div>`;tbox.focus();
    try{
      const key=k+id;let d=tcache.get(key);
      if(!d){const r=await fetch(`/api/title?id=${id}&k=${k}`);if(!r.ok)throw new Error("HTTP "+r.status);d=await r.json();tcache.set(key,d)}
      if(my===tTok&&!dlg.hidden)paintT(d);
    }catch(e){if(my===tTok)tin.innerHTML=`<div class="tt-load"><span>Couldn't load details right now. Please try again.</span><button class="btn ghost" type="button" data-x>Close</button></div>`}
  }
  window.sxTitle=openT;
  rail.addEventListener("click",e=>{const c=e.target.closest(".tr-card[data-id]");if(c)(window.sxSheet?sxSheet.open(c.dataset.id,c.dataset.k,c):openT(c.dataset.id,c.dataset.k,c))});
  rail.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches(".tr-card[data-id]")){e.preventDefault();(window.sxSheet?sxSheet.open(e.target.dataset.id,e.target.dataset.k,e.target):openT(e.target.dataset.id,e.target.dataset.k,e.target))}});

  // ---------- Link to the shop ----------
  function cta(){
    const P=pl(),prod=PRODUCTS.find(x=>x.name===P.shop);
    const el=$("#trCta");
    if(prod){
      const from=Math.min(...prod.variants.flatMap(v=>v.plans.map(x=>x.p)));
      el.innerHTML=`<p>Want to watch on <b>${esc(P.name)}</b>? Plans start from <b>${taka(from)}</b>, paid online or on WhatsApp.</p><button class="btn grad-bg" type="button" id="trGo">See ${esc(P.name)} plans</button>`;
      $("#trGo").onclick=()=>{const s=$("#search");s.value=prod.name;s.dispatchEvent(new Event("input"));$("#products").scrollIntoView({behavior:"smooth"})};
    }else{
      el.innerHTML=`<p>Want to watch on <b>${esc(P.name)}</b>? Ask us for today's price.</p><a class="btn grad-bg" target="_blank" rel="noopener" href="${wa("Hi StreamX! I want a "+P.name+" subscription.")}">Ask on WhatsApp ↗</a>`;
    }
  }

  // Live label ("Updated 3 min ago") and silent background refresh, so the list stays current without a reload.
  function paintLive(){
    const el=$("#trLive");if(!el||!data||!data.at)return;
    const m=Math.max(0,Math.round((Date.now()-new Date(data.at))/60000));
    el.textContent=m<1?"Live · updated just now":m<60?`Live · updated ${m} min ago`:`Live · updated ${Math.round(m/60)} h ago`;
  }
  async function refresh(){
    if(!shown||document.hidden)return;
    try{
      const j=await fetchTop(st.p,R());
      if(!data||j.at!==data.at){const same=JSON.stringify(j.movies.map(x=>x.id))===JSON.stringify(data&&data.movies.map(x=>x.id));data=j;if(!same)render()}
      paintLive();
    }catch(e){}
  }
  setInterval(paintLive,60000);
  setInterval(refresh,10*60*1000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});

  /* Ask the server which country the visitor is in (it reads it from the IP address); wait at most 1.5 s, then use the United States. */
  const geoReady=Promise.race([
    fetch("/api/trending?geo=1").then(r=>r.ok?r.json():null).then(j=>{const c=String(j&&j.c||"").toUpperCase();if(ok(c,REGIONS.map(x=>x[0])))geo=c}).catch(()=>{}),
    new Promise(r=>setTimeout(r,1500))
  ]).then(()=>{if(!st.manual){st.r=homeRegion(st.p);paintRegion()}});
  paintRegion();paintControls();geoReady.then(load);
})();
