/* Top 250 and Coming soon: ranked chart with the platforms each title streams on (data from /api/catalog).
   Platforms for the ranked list are loaded in small batches as rows are shown. */
(function(){
  const sec=document.getElementById("toplist");if(!sec)return;
  const feat=document.getElementById("tlFeat"),grid=document.getElementById("tlGrid"),more=document.getElementById("tlMore"),cnt=document.getElementById("tlCount");
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const SHOP={"Prime Video":"Amazon Prime Video"};
  const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const STEP=25,st={l:"top",k:"movie",n:STEP},cache={},pv={},asked={};
  const logo=n=>{const key=SHOP[n]||n,L=typeof LOGOS!=="undefined"&&typeof LOGO_OF!=="undefined"&&LOGOS[LOGO_OF[key]];
    return L&&L.p?`<span class="tl-lg" style="background:${esc(L.bg)};color:${esc(L.fg||"#fff")}"><svg viewBox="${esc(L.vb)}" aria-hidden="true"><path d="${L.p}"/></svg></span>`:`<span class="tl-lg" style="background:#1d2347">${esc(n[0])}</span>`};
  const chips=(list,soon)=>list&&list.length?list.map(p=>p.s?`<a class="tl-chip own" href="/services/${esc(p.s)}/" title="Get ${esc(p.n)} on StreamX">${logo(p.n)}<span>${esc(p.n)}</span></a>`:`<span class="tl-chip">${logo(p.n)}<span>${esc(p.n)}</span></span>`).join(""):`<span class="tl-tba">${soon?"Platform to be announced":"Streaming info not available"}</span>`;
  const plBox=(m,soon)=>{const key=m.k+":"+m.id,d=m.pl||(pv[key]&&pv[key].list);return `<div class="tl-pl" data-pl="${key}" data-soon="${soon?1:0}">${d?chips(d,soon):`<span class="tl-chip tl-ld"></span><span class="tl-chip tl-ld"></span>`}</div>`};
  const own=m=>{const d=m.pl||(pv[m.k+":"+m.id]&&pv[m.k+":"+m.id].list)||[];return d.find(p=>p.s)};
  const cta=m=>{const o=own(m);return o?`<a class="tl-cta" href="/services/${esc(o.s)}/">Watch with ${esc(o.n)} <span aria-hidden="true">→</span></a>`:""};
  const daysTo=d=>{if(!d)return null;const n=Math.round((new Date(d+"T00:00:00Z")-Date.now())/864e5);return n};
  const img=(m,w)=>`<img src="https://image.tmdb.org/t/p/${w}${esc(m.p)}" alt="${esc(m.t)} poster" loading="lazy" decoding="async">`;
  const rate=m=>m.v?`<b class="tl-v"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.6 3.1 1.2-6.3L3 9.4l6.3-.8z"/></svg>${m.v.toFixed(1)}</b>`:"";
  const meta=m=>[m.y,m.g&&m.g.join(" · ")].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("");
  const attrs=(m,i)=>`data-id="${m.id}" data-k="${m.k}" style="--i:${i%12}"`;

  function pod(m,i){return `<article class="tl-pod r${i+1}" ${attrs(m,i)}><button class="tl-po" type="button" aria-label="${esc(m.t)}: details and trailer">${img(m,"w342")}<span class="tl-rk">#${i+1}</span></button><div class="tl-bd"><h3>${esc(m.t)}</h3><div class="tl-meta">${rate(m)}${meta(m)}</div>${m.o?`<p class="tl-o">${esc(m.o)}</p>`:""}<div class="tl-w">Where to watch</div>${plBox(m,false)}${cta(m)}</div></article>`}
  function row(m,i){return `<article class="tl-row" ${attrs(m,i)}><span class="tl-n">${i+1}</span><button class="tl-po" type="button" aria-label="${esc(m.t)}: details and trailer">${img(m,"w185")}</button><div class="tl-bd"><h3>${esc(m.t)}</h3><div class="tl-meta">${rate(m)}${meta(m)}</div></div>${plBox(m,false)}</article>`}
  function soonCard(m,i){const d=m.d?new Date(m.d+"T00:00:00Z"):null,n=daysTo(m.d);
    return `<article class="tl-pc" ${attrs(m,i)}><button class="tl-po" type="button" aria-label="${esc(m.t)}: details and trailer">${img(m,"w342")}${d?`<span class="tl-db"><b>${d.getUTCDate()}</b><span>${MON[d.getUTCMonth()]}</span></span>`:`<span class="tl-db tba"><span>TBA</span></span>`}${n>0&&n<=90?`<span class="tl-in">in ${n} day${n>1?"s":""}</span>`:""}</button><div class="tl-bd"><h3>${esc(m.t)}</h3><div class="tl-meta">${meta(m)}</div><div class="tl-w">Expected on</div>${plBox(m,true)}${cta(m)}</div></article>`}

  function fillPl(){grid.parentNode.querySelectorAll("[data-pl]").forEach(el=>{const k=el.dataset.pl,d=pv[k];if(d&&el.querySelector(".tl-ld")){el.innerHTML=chips(d.list,el.dataset.soon==="1");const card=el.closest("[data-id]"),b=card&&card.querySelector(".tl-bd");if(b&&!b.querySelector(".tl-cta")){const m={k:card.dataset.k,id:card.dataset.id,pl:d.list};b.insertAdjacentHTML("beforeend",cta(m))}}})}
  function wantPl(list){
    const need=list.filter(m=>!m.pl&&!pv[m.k+":"+m.id]&&!asked[m.k+":"+m.id]);
    for(let i=0;i<need.length;i+=12){const ch=need.slice(i,i+12);ch.forEach(m=>asked[m.k+":"+m.id]=1);
      fetch(`/api/catalog?a=pv&k=${st.k}&ids=${ch.map(m=>m.id).join(",")}`).then(r=>r.ok?r.json():null).then(d=>{if(d&&d.pv)Object.keys(d.pv).forEach(id=>{pv[d.k+":"+id]=d.pv[id]});ch.forEach(m=>{if(!pv[m.k+":"+m.id])pv[m.k+":"+m.id]={reg:"",list:[]}});fillPl()}).catch(()=>{ch.forEach(m=>{pv[m.k+":"+m.id]={reg:"",list:[]}});fillPl()})}
  }
  function paint(){
    const d=cache[st.l+st.k];if(!d)return;
    const list=d.list||[],soon=st.l==="soon";
    grid.className="tl-grid"+(soon?" soon":"");feat.hidden=soon;
    if(!list.length){feat.innerHTML="";grid.innerHTML=`<div class="tr-msg"><b>Nothing to show right now</b>Please check back soon.</div>`;more.hidden=true;cnt.textContent="";return}
    if(soon){feat.innerHTML="";grid.innerHTML=list.map(soonCard).join("");more.hidden=true;cnt.textContent=`${list.length} upcoming ${st.k==="tv"?"series":"movies"}`;return}
    const shown=list.slice(0,st.n);
    feat.innerHTML=shown.slice(0,3).map(pod).join("");
    grid.innerHTML=shown.slice(3).map((m,i)=>row(m,i+3)).join("");
    more.hidden=shown.length>=list.length;more.textContent=`Show ${Math.min(STEP,list.length-shown.length)} more`;
    cnt.textContent=`Showing ${shown.length} of ${list.length}`;
    wantPl(shown);
  }
  function load(first){
    const key=st.l+st.k;if(cache[key]){paint();return Promise.resolve()}
    if(!first){feat.innerHTML="";grid.className="tl-grid";grid.innerHTML=`<div class="tl-sk">${"<i></i>".repeat(6)}</div>`;more.hidden=true}
    return fetch(`/api/catalog?l=${st.l}&k=${st.k}`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{cache[key]=d;if(st.l==="soon")(d.list||[]).forEach(m=>{pv[m.k+":"+m.id]={reg:m.reg,list:m.pl||[]}});if(first)sec.hidden=false;if(key===st.l+st.k)paint()})
      .catch(()=>{if(!first){feat.innerHTML="";grid.innerHTML=`<div class="tr-msg"><b>Couldn't load this list right now</b>Please try again in a moment.</div>`}})
  }
  function seg(id,attr){const el=document.getElementById(id);el.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;el.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));st[attr]=b.dataset[attr];st.n=STEP;thumb(el);load(false)})}
  function thumb(el){const on=el.querySelector("button.on"),t=el.querySelector(".tr-thumb");if(on&&t){t.style.width=on.offsetWidth+"px";t.style.transform=`translateX(${on.offsetLeft}px)`}}
  seg("tlKind","l");seg("tlType","k");
  more.addEventListener("click",()=>{st.n+=STEP;paint()});
  sec.addEventListener("click",e=>{const c=e.target.closest("[data-id]");if(!c||e.target.closest("a"))return;if(e.target.closest(".tl-po")||e.target.closest("h3")){if(window.sxTitle)window.sxTitle(c.dataset.id,c.dataset.k,c)}});
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();load(true).then(()=>{["tlKind","tlType"].forEach(i=>thumb(document.getElementById(i)))})}},{rootMargin:"600px"});
  io.observe(document.getElementById("pricing")||sec);
  addEventListener("resize",()=>["tlKind","tlType"].forEach(i=>thumb(document.getElementById(i))));
})();
