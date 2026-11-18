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
    {id:"hulu",name:"Hulu",logo:"hulu",shop:"Hulu"}
  ];
  const REGIONS=[["BD","Bangladesh"],["IN","India"],["PK","Pakistan"],["LK","Sri Lanka"],["NP","Nepal"],["US","United States"],["GB","United Kingdom"],["CA","Canada"],["AU","Australia"],["AE","United Arab Emirates"],["SA","Saudi Arabia"],["SG","Singapore"],["MY","Malaysia"],["JP","Japan"],["KR","South Korea"],["DE","Germany"],["FR","France"],["BR","Brazil"]];
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const flag=c=>`https://flagcdn.com/48x36/${c.toLowerCase()}.png`;
  const ok=(v,list)=>list.includes(v);

  let st={p:"netflix",r:"BD",k:"all"};
  try{const s=JSON.parse(localStorage.getItem("sx_trend")||"{}");
    if(ok(s.p,PLATFORMS.map(x=>x.id)))st.p=s.p;if(ok(s.r,REGIONS.map(x=>x[0])))st.r=s.r;if(ok(s.k,["all","movie","tv"]))st.k=s.k}catch(e){}
  const save=()=>{try{localStorage.setItem("sx_trend",JSON.stringify(st))}catch(e){}};

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
  tabs.onclick=e=>{const b=e.target.closest(".tr-tab");if(!b||b.dataset.p===st.p)return;st.p=b.dataset.p;save();paintControls();load()};
  seg.onclick=e=>{const b=e.target.closest("button");if(!b||b.dataset.k===st.k)return;st.k=b.dataset.k;save();paintControls();render()};
  addEventListener("resize",()=>shown&&paintControls());

  // ---------- Region picker ----------
  const btn=$("#trRegBtn"),pop=$("#trPop"),list=$("#trRegList"),rq=$("#trRegQ");
  function paintRegion(){
    const r=REGIONS.find(x=>x[0]===st.r);$("#trRegName").textContent=r[1];
    const f=$("#trFlag");f.style.visibility="";f.src=flag(r[0]);f.onerror=()=>{f.style.visibility="hidden"};
  }
  function fillList(q=""){
    list.innerHTML=REGIONS.filter(r=>r[1].toLowerCase().includes(q.toLowerCase())).map(r=>`<li role="option" tabindex="0" data-r="${r[0]}" aria-selected="${r[0]===st.r}"><img src="${flag(r[0])}" alt="" width="22" height="16" loading="lazy" onerror="this.style.visibility='hidden'">${r[1]}</li>`).join("")||`<li aria-disabled="true">No match</li>`;
  }
  function openPop(o){
    pop.hidden=!o;btn.setAttribute("aria-expanded",o);
    if(o){rq.value="";fillList();setTimeout(()=>rq.focus(),30)}
  }
  btn.onclick=()=>openPop(pop.hidden);
  rq.oninput=()=>fillList(rq.value);
  const pick=li=>{if(!li||!li.dataset.r)return;st.r=li.dataset.r;save();paintRegion();openPop(false);btn.focus();load()};
  list.onclick=e=>pick(e.target.closest("li"));
  list.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(e.target.closest("li"))}};
  document.addEventListener("click",e=>{if(!pop.hidden&&!$("#trReg").contains(e.target))openPop(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!pop.hidden){openPop(false);btn.focus()}});

  // ---------- Data ----------
  async function fetchTop(p,r){
    const key=p+"|"+r;if(cache.has(key))return cache.get(key);
    const res=await fetch(`/api/trending?p=${p}&r=${r}`);
    if(!res.ok)throw new Error("HTTP "+res.status);
    const j=await res.json();cache.set(key,j);return j;
  }
  const pl=()=>PLATFORMS.find(x=>x.id===st.p);
  const regionName=()=>REGIONS.find(x=>x[0]===st.r)[1];
  let data=null;

  function skeleton(){
    rail.innerHTML=Array.from({length:8},()=>`<div class="tr-sk"><i></i><b></b></div>`).join("");
  }
  async function load(){
    const my=++token;skeleton();cta();
    try{
      const j=await fetchTop(st.p,st.r);
      if(my!==token)return;
      data=j;render();
      if(!shown){shown=true;sec.hidden=false;const n=$("#trNav");if(n)n.hidden=false;requestAnimationFrame(paintControls)}
    }catch(e){
      if(my!==token)return;
      if(!shown)return; // first load failed (e.g. not configured yet): keep the whole section hidden
      rail.innerHTML=`<div class="tr-msg"><b>Couldn't load trending right now</b>Please check your connection and try again.<br><button class="btn ghost" type="button" id="trRetry">Try again</button></div>`;
      $("#trRetry").onclick=load;
    }
  }
  function items(){
    if(!data)return[];
    if(st.k==="movie")return data.movies.slice(0,10);
    if(st.k==="tv")return data.tv.slice(0,10);
    return[...data.movies,...data.tv].sort((a,b)=>b.pop-a.pop).slice(0,10);
  }
  function render(){
    const list=items(),P=pl();
    if(!list.length){
      rail.innerHTML=`<div class="tr-msg"><b>Nothing to show for ${esc(P.name)} in ${esc(regionName())}</b>${esc(P.name)} may not be available in this region. Try another region or platform.</div>`;
      return;
    }
    rail.innerHTML=list.map((m,i)=>`<article class="tr-card" style="--i:${i}" tabindex="0"><span class="tr-rank" aria-hidden="true">${i+1}</span><div class="tr-poster"><img src="https://image.tmdb.org/t/p/w342${esc(m.p)}" alt="${esc(m.t)} poster" loading="lazy"><span class="tr-kind">${m.k==="tv"?"Series":"Movie"}</span>${m.o?`<div class="tr-ov">${esc(m.o)}</div>`:""}</div><div class="tr-info"><h3>${esc(m.t)}</h3><div class="tr-meta">${m.y?`<span>${esc(m.y)}</span>`:""}${m.v?`<span class="tr-star">★ ${m.v}</span>`:""}</div></div></article>`).join("");
    rail.scrollTo({left:0});
  }

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

  paintRegion();paintControls();load();
})();
