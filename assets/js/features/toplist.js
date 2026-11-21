/* Top rated and Coming soon (home section) and the full Top 250 page. Data from /api/catalog; wishlist/watched from window.sxList; details from window.sxSheet. */
(function(){
  const sec=document.getElementById("toplist");if(!sec)return;
  const PAGE=sec.dataset.mode==="page";
  const grid=document.getElementById("tlGrid"),more=document.getElementById("tlMore"),all=document.getElementById("tlAll"),cnt=document.getElementById("tlCount"),qEl=document.getElementById("tlQ"),hideEl=document.getElementById("tlHide");
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const NAME={"Prime Video":"Amazon Prime Video"};
  const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const FIRST=PAGE?50:10,STEP=PAGE?50:20;
  const st={l:"top",k:"movie",n:FIRST,q:"",hide:false},cache={},pv={},asked={},idx={};
  const logo=n=>{const key=NAME[n]||n,L=typeof LOGOS!=="undefined"&&typeof LOGO_OF!=="undefined"&&LOGOS[LOGO_OF[key]];
    return L&&L.p?`<span class="tp-lg" style="background:${esc(L.bg)};color:${esc(L.fg||"#fff")}"><svg viewBox="${esc(L.vb)}" aria-hidden="true"><path d="${L.p}"/></svg></span>`:`<span class="tp-lg" style="background:#1d2347">${esc((n||"?")[0])}</span>`};
  const ICON={mark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.6 3.1 1.2-6.3L3 9.4l6.3-.8z"/></svg>'};
  const onHtml=(list,soon)=>{
    const own=(list||[]).filter(p=>p.s),oth=(list||[]).filter(p=>!p.s);
    if(own.length)return own.slice(0,3).map(p=>`<a class="tp-svc" href="/services/${esc(p.s)}/" title="Get ${esc(p.n)} on StreamX">${logo(p.n)}<span>${esc(p.n)}</span></a>`).join("")+(own.length>3?`<span class="tp-more-n">+${own.length-3}</span>`:"");
    return `<span class="tp-no">${oth.length?`On ${esc(oth.slice(0,2).map(p=>p.n).join(", "))} only`:soon?"Platform to be announced":"Not on StreamX services"}</span>`;
  };
  const onBox=(m,soon)=>{const key=m.k+":"+m.id,d=m.pl||(pv[key]&&pv[key].list);return `<div class="tp-on" data-pl="${key}" data-soon="${soon?1:0}"><small>${soon?"Expected on":"Watch on"}</small><div class="tp-sv">${d?onHtml(d,soon):'<span class="tp-ld"></span><span class="tp-ld"></span>'}</div></div>`};
  const poster=(m,w)=>`<img src="https://image.tmdb.org/t/p/${w}${esc(m.p)}" alt="" loading="lazy" decoding="async" width="342" height="513">`;
  const acts=`<div class="tp-acts"><button class="tp-act" type="button" data-act="wish" aria-pressed="false" aria-label="Add to wishlist" title="Wishlist">${ICON.mark}</button><button class="tp-act" type="button" data-act="watched" aria-pressed="false" aria-label="Mark as watched" title="Watched">${ICON.check}</button></div>`;
  const metaHtml=m=>`<p class="tp-meta">${m.v?`<b class="tp-star">${ICON.star}${m.v.toFixed(1)}</b>`:""}${[m.y,m.g&&m.g[0]].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("")}</p>`;
  function card(m,rank,i,soon){
    idx[m.k+":"+m.id]=m;
    let num;
    if(soon){const d=m.d?new Date(m.d+"T00:00:00Z"):null;num=d?`<span class="tp-n date"><b>${String(d.getUTCDate()).padStart(2,"0")}</b><span>${MON[d.getUTCMonth()]}</span></span>`:`<span class="tp-n date"><b>TBA</b></span>`}
    else num=`<span class="tp-n ${rank<=3?"r"+rank:""} l${String(rank).length}" aria-hidden="true">${rank}</span>`;
    const days=soon&&m.d?Math.round((new Date(m.d+"T00:00:00Z")-Date.now())/864e5):null;
    return `<article class="tp-card" data-id="${m.id}" data-k="${m.k}" style="--i:${i%10}"><div class="tp-pw">${num}<div class="tp-poster">${poster(m,"w342")}<button class="tp-open" type="button" aria-label="${esc(m.t)}: details, trailer and where to watch"></button><span class="tp-seen">Watched</span>${acts}</div></div><div class="tp-info"><h3>${esc(m.t)}</h3>${soon?`<p class="tp-meta">${days!=null&&days>0&&days<=90?`<b class="tp-soon">in ${days} day${days>1?"s":""}</b>`:""}${[m.y,m.g&&m.g[0]].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("")}</p>`:metaHtml(m)}${onBox(m,soon)}</div></article>`;
  }
  function paintStates(){
    if(!window.sxList)return;
    grid.querySelectorAll(".tp-card").forEach(c=>{
      const s=sxList.get(c.dataset.k,c.dataset.id);
      c.classList.toggle("is-wish",s==="wish");c.classList.toggle("is-seen",s==="watched");
      c.querySelectorAll(".tp-act").forEach(b=>{const on=b.dataset.act===s;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.setAttribute("aria-label",b.dataset.act==="wish"?(on?"Remove from wishlist":"Add to wishlist"):(on?"Unmark as watched":"Mark as watched"))});
    });
  }
  function fillPl(){grid.querySelectorAll("[data-pl]").forEach(el=>{const d=pv[el.dataset.pl];if(d&&el.querySelector(".tp-ld"))el.querySelector(".tp-sv").innerHTML=onHtml(d.list,el.dataset.soon==="1")})}
  function wantPl(list){
    const need=list.filter(m=>!m.pl&&!pv[m.k+":"+m.id]&&!asked[m.k+":"+m.id]);
    for(let i=0;i<need.length;i+=12){const ch=need.slice(i,i+12);ch.forEach(m=>asked[m.k+":"+m.id]=1);
      fetch(`/api/catalog?a=pv&k=${st.k}&ids=${ch.map(m=>m.id).join(",")}`).then(r=>r.ok?r.json():null).then(d=>{if(d&&d.pv)Object.keys(d.pv).forEach(id=>{pv[d.k+":"+id]=d.pv[id]});ch.forEach(m=>{if(!pv[m.k+":"+m.id])pv[m.k+":"+m.id]={reg:"",list:[]}});fillPl()}).catch(()=>{ch.forEach(m=>{pv[m.k+":"+m.id]={reg:"",list:[]}});fillPl()})}
  }
  function paint(){
    const mine=st.l==="wish"||st.l==="watched";
    const d=mine?{list:(window.sxList&&sxList.authed()?sxList.all().filter(x=>x.s===st.l&&x.k===st.k):[])}:cache[st.l+st.k];if(!d)return;
    const soon=st.l==="soon";
    if(mine&&!(window.sxList&&sxList.authed())){grid.className="tp-grid";grid.innerHTML=`<div class="tp-msg"><b>Sign in to see your ${st.l==="wish"?"wishlist":"watched list"}</b>Save titles from any poster and they will be here on every device.<br><a class="tp-all" style="margin-top:16px" href="/account/">Sign in</a></div>`;more.hidden=true;if(all)all.hidden=true;if(cnt)cnt.textContent="";sec.hidden=false;return}
    let rows=(d.list||[]).map((m,i)=>({m,r:i+1}));
    if(PAGE){const q=st.q.trim().toLowerCase();if(q)rows=rows.filter(x=>x.m.t.toLowerCase().includes(q));if(st.hide&&window.sxList)rows=rows.filter(x=>sxList.get(x.m.k,x.m.id)!=="watched")}
    grid.className="tp-grid"+(soon?" soon":"");
    if(!rows.length){grid.innerHTML=`<div class="tp-msg"><b>${st.q||st.hide?"No titles match":mine?(st.l==="wish"?"Your wishlist is empty":"Nothing marked as watched yet"):"Nothing to show right now"}</b>${st.q||st.hide?"Try a different search or turn off the filter.":mine?"Tap the "+(st.l==="wish"?"bookmark":"tick")+" on any poster to add titles here.":"Please check back soon."}</div>`;more.hidden=true;if(all)all.hidden=PAGE;if(cnt)cnt.textContent="";return}
    const shown=rows.slice(0,st.n);
    grid.innerHTML=shown.map((x,i)=>card(x.m,x.r,i,soon)).join("");
    const left=rows.length-shown.length;
    more.hidden=left<=0;more.textContent=`Show ${Math.min(STEP,left)} more`;
    if(all){all.hidden=mine;all.href=soon?"/top/#soon":"/top/";all.firstChild.textContent=soon?"Explore all upcoming ":"Explore all 250 "}
    if(cnt)cnt.textContent=`Showing ${shown.length} of ${rows.length}`;
    wantPl(shown.map(x=>x.m));paintStates();
  }
  function load(first){
    if(st.l==="wish"||st.l==="watched"){const go=()=>{sec.hidden=false;paint()};return window.sxList?sxList.load().then(go,go):(go(),Promise.resolve())}
    const key=st.l+st.k;if(cache[key]){paint();return Promise.resolve()}
    if(!first){grid.className="tp-grid";grid.innerHTML=`<div class="tp-sk">${"<i></i>".repeat(PAGE?10:5)}</div>`;more.hidden=true}
    return fetch(`/api/catalog?l=${st.l}&k=${st.k}`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{cache[key]=d;if(st.l==="soon")(d.list||[]).forEach(m=>{pv[m.k+":"+m.id]={reg:m.reg,list:m.pl||[]}});if(first)sec.hidden=false;if(key===st.l+st.k)paint()})
      .catch(()=>{if(first&&!PAGE)return;grid.innerHTML=`<div class="tp-msg"><b>Couldn't load this list right now</b>Please try again in a moment.</div>`;sec.hidden=false})
  }
  function thumb(el){const on=el.querySelector("button.on"),t=el.querySelector(".tp-thumb");if(on&&t){t.style.width=on.offsetWidth+"px";t.style.transform=`translateX(${on.offsetLeft}px)`}}
  function seg(id,attr){const el=document.getElementById(id);el.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st[attr]=b.dataset[attr];st.n=FIRST;syncSegs();load(false);if(PAGE)try{history.replaceState(null,"",st.l==="soon"?"#soon":location.pathname)}catch(x){}})}
  function syncSegs(){[["tlKind","l"],["tlType","k"]].forEach(([id,a])=>{const el=document.getElementById(id);el.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset[a]===st[a]));thumb(el)})}
  seg("tlKind","l");seg("tlType","k");
  if(PAGE&&/soon/i.test(location.hash))st.l="soon";
  more.addEventListener("click",()=>{st.n+=STEP;paint()});
  if(qEl)qEl.addEventListener("input",()=>{st.q=qEl.value;st.n=FIRST;paint()});
  if(hideEl)hideEl.addEventListener("change",()=>{st.hide=hideEl.checked;st.n=FIRST;paint()});
  sec.addEventListener("click",e=>{
    const c=e.target.closest(".tp-card");if(!c||e.target.closest("a"))return;
    const m=idx[c.dataset.k+":"+c.dataset.id];
    const a=e.target.closest(".tp-act");
    if(a){e.preventDefault();if(window.sxList&&m)sxList.toggle({k:m.k,id:m.id,t:m.t,p:m.p,y:m.y,v:m.v},a.dataset.act);return}
    if(e.target.closest(".tp-open")||e.target.closest("h3")){if(window.sxSheet)sxSheet.open(c.dataset.id,c.dataset.k,e.target.closest(".tp-open")||c,m)}
  });
  if(window.sxList){sxList.onChange(()=>{paintStates();if((st.l==="wish"||st.l==="watched")||(PAGE&&st.hide))paint()});sxList.load().then(paintStates)}
  const boot=()=>load(true).then(()=>{syncSegs()});
  if(PAGE){syncSegs();boot()}
  else{const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();boot()}},{rootMargin:"600px"});io.observe(document.getElementById("bundles")||sec)}
  addEventListener("resize",syncSegs);
})();
