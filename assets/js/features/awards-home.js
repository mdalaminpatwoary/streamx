/* Home "Awards" section: a chip toggle over the curated award lists from /api/catalog (a=hub, s=oscars|awards). Posters open the title sheet. */
(function(){
  const sec=document.getElementById("awardsec");if(!sec)return;
  const grid=document.getElementById("awGrid"),chips=document.getElementById("awChips"),cnt=document.getElementById("awCount"),note=document.getElementById("awNote");
  const T=[
    {id:"oscars",l:"Oscars",s:"oscars",m:"winners",n:"The 98th Academy Awards (March 2026): this year's winners."},
    {id:"bp",l:"Oscars Best Picture",s:"oscars",m:"bestpicture",n:"Every Best Picture winner since 1990, newest first."},
    {id:"globes",l:"Golden Globes",s:"awards",m:"goldenglobes",n:"Best Motion Picture – Drama winners, newest first."},
    {id:"bafta",l:"BAFTA",s:"awards",m:"bafta",n:"British Academy Film Awards: Best Film winners, newest first."},
    {id:"cannes",l:"Cannes Palme d'Or",s:"awards",m:"cannes",n:"The top prize of the Cannes Film Festival, newest first."},
    {id:"filmfare",l:"Filmfare",s:"awards",m:"filmfare",n:"India's Filmfare Awards: Best Film winners, newest first."},
    {id:"nfa",l:"National Film Awards (India)",s:"awards",m:"national",n:"Best Feature Film winners of India's National Film Awards."},
    {id:"bdfa",l:"Bangladesh Film Awards",s:"awards",m:"bangladesh",n:"Best Film winners of the Bangladesh National Film Awards."}
  ];
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const cache={},idx={};let cur=T[0],seq=0;
  chips.innerHTML=T.map((t,i)=>`<button type="button" role="tab" data-i="${i}" aria-selected="${i===0}" class="${i===0?"on":""}">${esc(t.l)}</button>`).join("");
  const card=(m,i)=>{idx[m.k+":"+m.id]=m;
    return `<article class="tp-card" data-id="${m.id}" data-k="${m.k}" style="--i:${i%10}"><div class="tp-pw"><div class="tp-poster"><img src="https://image.tmdb.org/t/p/w342${esc(m.p)}" alt="" loading="lazy" decoding="async" width="342" height="513"><button class="tp-open" type="button" aria-label="${esc(m.t)}: details, trailer and where to watch"></button>${m.aw?`<span class="aw-badge">${esc(m.aw)}</span>`:""}</div></div><div class="tp-info"><h3>${esc(m.t)}</h3><p class="tp-meta">${m.y?`<span>${esc(m.y)}</span>`:""}</p></div></article>`};
  const sk='<div class="tp-sk" aria-hidden="true">'+"<i></i>".repeat(6)+"</div>";
  function load(){
    const t=cur,my=++seq;note.textContent=t.n;
    const done=d=>{if(my!==seq)return;const l=d.list||[];
      if(!l.length){grid.innerHTML='<div class="tp-msg"><b>Nothing to show right now</b>Please check back soon.</div>';cnt.textContent="";return}
      grid.innerHTML=l.map(card).join("");cnt.textContent=l.length+" titles";grid.scrollLeft=0;sync()};
    if(cache[t.id])return done(cache[t.id]);
    grid.innerHTML=sk;cnt.textContent="";
    fetch(`/api/catalog?a=hub&s=${t.s}&k=movie&page=1&m=${t.m}`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{cache[t.id]=d;done(d)}).catch(()=>{if(my===seq)grid.innerHTML='<div class="tp-msg"><b>Couldn\'t load this list</b>Please try again in a moment.</div>'});
  }
  chips.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const t=T[+b.dataset.i];if(t===cur)return;cur=t;
    chips.querySelectorAll("button").forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-selected",on)});b.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"});load()});
  const rail=document.createElement("div");rail.className="tp-rail";grid.parentNode.insertBefore(rail,grid);rail.appendChild(grid);
  const mk=(c,d)=>{const b=document.createElement("button");b.type="button";b.className="tp-nav "+c;b.setAttribute("aria-label",c==="prev"?"Scroll left":"Scroll right");b.innerHTML=d;rail.appendChild(b);return b};
  const pb=mk("prev",'<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>'),nb=mk("next",'<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>');
  function sync(){pb.hidden=grid.scrollLeft<8;nb.hidden=grid.scrollLeft+grid.clientWidth>=grid.scrollWidth-8}
  const go=d=>grid.scrollBy({left:d*Math.max(240,grid.clientWidth*.85),behavior:"smooth"});
  pb.onclick=()=>go(-1);nb.onclick=()=>go(1);grid.addEventListener("scroll",sync,{passive:true});addEventListener("resize",sync);
  grid.addEventListener("click",e=>{const c=e.target.closest(".tp-card");if(!c)return;
    if(e.target.closest(".tp-open")||e.target.closest("h3")){if(window.sxSheet)sxSheet.open(c.dataset.id,c.dataset.k,e.target.closest(".tp-open")||c,idx[c.dataset.k+":"+c.dataset.id])}});
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();load()}},{rootMargin:"600px"});io.observe(sec);
})();
