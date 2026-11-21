/* Top rated and coming soon: IMDb-style chart with the platforms each title streams on (data from /api/catalog). */
(function(){
  const sec=document.getElementById("toplist");if(!sec)return;
  const grid=document.getElementById("tlGrid"),more=document.getElementById("tlMore");
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const SHOP={"Prime Video":"Amazon Prime Video"}; // chip name -> catalog product name (for the logo)
  const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let st={l:"top",k:"movie",all:false};const cache={};
  const logo=n=>{const key=SHOP[n]||n,L=typeof LOGOS!=="undefined"&&typeof LOGO_OF!=="undefined"&&LOGOS[LOGO_OF[key]];
    return L&&L.p?`<span class="tl-lg" style="background:${esc(L.bg)};color:${esc(L.fg||"#fff")}"><svg viewBox="${esc(L.vb)}" aria-hidden="true"><path d="${L.p}"/></svg></span>`:`<span class="tl-lg" style="background:#1d2347">${esc(n[0])}</span>`};
  const when=d=>{if(!d)return"Date to be announced";const t=new Date(d+"T00:00:00Z"),n=Math.round((t-Date.now())/864e5);return `${t.getUTCDate()} ${MON[t.getUTCMonth()]} ${t.getUTCFullYear()}`+(n>0&&n<=60?` · in ${n} day${n>1?"s":""}`:"")};
  function card(m,i){
    const soon=st.l==="soon";
    const pls=m.pl&&m.pl.length?`<div class="tl-pl">${m.pl.map(p=>p.s?`<a class="tl-chip own" href="/services/${esc(p.s)}/" title="Get ${esc(p.n)} on StreamX">${logo(p.n)}<span>${esc(p.n)}</span></a>`:`<span class="tl-chip">${logo(p.n)}<span>${esc(p.n)}</span></span>`).join("")}</div>`:`<div class="tl-pl"><span class="tl-tba">${soon?"Platform to be announced":"Streaming info not available"}</span></div>`;
    const own=(m.pl||[]).find(p=>p.s);
    const cta=own?`<a class="tl-cta" href="/services/${esc(own.s)}/">Watch it with ${esc(own.n)} <i aria-hidden="true">→</i></a>`:"";
    const meta=soon?`<span class="tl-date">${esc(when(m.d))}</span>`:[m.y,m.g&&m.g.join(", ")].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("");
    return `<article class="tl-card" style="--i:${i%10}" data-id="${m.id}" data-k="${m.k}"><button class="tl-po" type="button" aria-label="${esc(m.t)}: details and trailer"><img src="https://image.tmdb.org/t/p/w185${esc(m.p)}" alt="${esc(m.t)} poster" loading="lazy" width="92" height="138">${soon?"":`<span class="tl-rk">${i+1}</span>`}</button><div class="tl-bd"><h3>${esc(m.t)}</h3><div class="tl-meta">${meta}${!soon&&m.v?`<b class="tl-v">★ ${m.v}</b>`:""}</div>${m.o?`<p class="tl-o">${esc(m.o)}</p>`:""}<small class="tl-w">${soon?"Expected on":"Where to watch"}</small>${pls}${cta}</div></article>`;
  }
  function paint(){
    const d=cache[st.l+st.k];if(!d)return;
    const list=d.list||[];
    if(!list.length){grid.innerHTML=`<div class="tr-msg"><b>Nothing to show right now</b>Please check back soon.</div>`;more.hidden=true;return}
    const shown=st.all?list:list.slice(0,10);
    grid.innerHTML=shown.map(card).join("");more.hidden=list.length<=10||st.all;
  }
  function load(first){
    const key=st.l+st.k;if(cache[key]){paint();return Promise.resolve()}
    if(!first)grid.innerHTML=`<div class="tl-sk">${"<i></i>".repeat(6)}</div>`;
    return fetch(`/api/catalog?l=${st.l}&k=${st.k}`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{cache[key]=d;if(first)sec.hidden=false;if(key===st.l+st.k)paint()})
      .catch(()=>{if(!first)grid.innerHTML=`<div class="tr-msg"><b>Couldn't load this list right now</b>Please try again in a moment.</div>`});
  }
  function seg(id,attr){const el=document.getElementById(id);el.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;el.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));st[attr]=b.dataset[attr];st.all=false;thumb(el);load(false)})}
  function thumb(el){const on=el.querySelector("button.on"),t=el.querySelector(".tr-thumb");if(on&&t){t.style.width=on.offsetWidth+"px";t.style.transform=`translateX(${on.offsetLeft}px)`}}
  seg("tlKind","l");seg("tlType","k");
  more.addEventListener("click",()=>{st.all=true;paint()});
  grid.addEventListener("click",e=>{const c=e.target.closest(".tl-card");if(!c||e.target.closest("a"))return;if(e.target.closest(".tl-po")||e.target.closest("h3")){if(window.sxTitle)window.sxTitle(c.dataset.id,c.dataset.k,c)}});
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();load(true).then(()=>{["tlKind","tlType"].forEach(i=>thumb(document.getElementById(i)))})}},{rootMargin:"600px"});
  io.observe(document.getElementById("pricing")||sec);
  addEventListener("resize",()=>["tlKind","tlType"].forEach(i=>thumb(document.getElementById(i))));
})();
