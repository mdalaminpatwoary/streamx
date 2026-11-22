/* Reviews: popular spotlight, moving rows and full story card. */
// Reviews: popular spotlight (one after another), moving rows, click for full story
const initials=n=>n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const ph=r=>r.photo?`<img src="${r.photo}" alt="${r.n}" loading="lazy" onerror="this.remove()">`:"";
const THUMB='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
const GR=[["#ED3124","#B4233C"],["#4F6BFF","#1E2F8F"],["#FF6F61","#D9363E"],["#2DD4BF","#0E6E80"],["#8B9DFF","#3B4BC8"],["#FF5B4D","#8E2A5C"],["#34D399","#0B6B4B"],["#60A5FA","#1D4ED8"]];
const grad=i=>`--c1:${GR[i%GR.length][0]};--c2:${GR[i%GR.length][1]}`;
const subLine=r=>[r.role,r.company].filter(Boolean).join(" · ");
const svcOf=r=>r.services&&r.services.length?r.services:[r.p];
const svcTiles=(r,cls)=>svcOf(r).map(n=>{const p=PRODUCTS.find(x=>x.name===n);return `<span class="${cls}">${p?ptile(p):""}<em>${n}</em></span>`}).join("");
const rcard=(r,dup)=>{const i=REVIEWS.indexOf(r),p=PRODUCTS.find(x=>x.name===r.p);return `<figure class="rk2${dup?" dup":""}" style="${grad(i)}" data-r="${i}" tabindex="${dup?-1:0}" role="button" aria-label="Open ${r.n}'s story"${dup?' aria-hidden="true"':""}><div class="rk2-top"><span class="av4"><i>${initials(r.n)}${ph(r)}</i></span><div class="who2"><b>${r.n}</b><small>${r.role||"Customer"}</small></div><span class="rec">${THUMB}Recommends</span></div>
  <blockquote>${r.t}</blockquote><figcaption>${p?ptile(p):""}<span>${r.p}</span><span class="rk2-more">Details ↗</span></figcaption></figure>`};
function renderRows(){
  const half=Math.ceil(REVIEWS.length/2),rows=[REVIEWS.slice(0,half),REVIEWS.slice(half)];
  rows.forEach((row,x)=>{$("#rrow"+(x+1)).innerHTML=row.length?[0,1,2,3].map(c=>row.map(r=>rcard(r,c>0)).join("")).join(""):""});
}
// Popular review spotlight: big portrait, one review after another every 10 seconds (pauses on hover, off-screen and in background tabs)
let POP=REVIEWS.map((r,i)=>i); // every review takes its turn in the spotlight
const QUOTE='<svg class="rs-q" viewBox="0 0 48 36" aria-hidden="true"><path d="M0 36V20C0 8 6 1.5 18 0v7c-6 1.2-8.600 4.400-8.800 9H18v20zm27 0V20C27 8 33 1.500 45 0v7c-6 1.200-8.600 4.400-8.800 9H45v20z"/></svg>';
const POP_MS=10000;
let pk=0,pEl=0,pHover=false,pSeen=true,pBusy=false;
const popTile=(r)=>svcOf(r).slice(0,3).map((s,x)=>{const p=PRODUCTS.find(y=>y.name===s);return p?`<span class="rs-chip c${x}">${ptile(p)}<em>${s}</em></span>`:""}).join("");
function setPop(n,instant){
  if(pBusy)return;
  const box=$("#pop"),prev=box.querySelector(".rs");
  const paint=()=>{
    pk=(n+POP.length)%POP.length;pEl=0;const i=POP[pk],r=REVIEWS[i];
    box.innerHTML=`<div class="rs" style="${grad(i)}">
    <div class="rs-bg" aria-hidden="true"><i></i><i></i></div>
    <div class="rs-portrait"><span class="rs-pring"></span><span class="rs-ring r1"></span><span class="rs-ring r2"></span>
      <div class="rs-frame" onclick="openReview(${i})"><span class="rs-init">${initials(r.n)}</span>${ph(r)}<span class="rs-shine"></span></div>
      <span class="rs-badge"><span class="rs-stars">${"★".repeat(r.s||5)}</span><b>${(r.s||5).toFixed(1)}</b></span></div>
    <div class="rs-body"><span class="eyebrow">Popular review</span>${QUOTE}
      <blockquote>${r.t.split(" ").map((w,k)=>`<span class="rw" style="--k:${k}">${w}</span>`).join(" ")}</blockquote>
      <div class="rs-by"><b>${r.n}</b><span>${[subLine(r),r.loc].filter(Boolean).join(" · ")}</span></div>
      <div class="rs-svcs" aria-label="Services bought">${popTile(r)}</div>
      <div class="rs-act"><button class="btn grad-bg" onclick="openReview(${i})">View full story →</button></div></div>
    <div class="rs-nav" role="tablist">${POP.map((j,x)=>`<button type="button" role="tab" aria-selected="${x===pk}" class="${x===pk?"on":""}" onclick="setPop(${x})" style="${grad(j)}"><span class="rs-mini"><i>${initials(REVIEWS[j].n)}</i>${ph(REVIEWS[j])}</span><span class="rs-nm"><b>${REVIEWS[j].n}</b><small>${REVIEWS[j].role||"Customer"}</small></span><span class="rs-bar"><i></i></span></button>`).join("")}</div></div>`;
    pBusy=false;
    const nv=box.querySelector(".rs-nav"),ab=nv&&nv.querySelector("button.on");if(ab&&nv.scrollWidth>nv.clientWidth)nv.scrollTo({left:ab.offsetLeft-nv.clientWidth/2+ab.offsetWidth/2,behavior:instant?"auto":"smooth"});
  };
  if(prev&&!instant){pBusy=true;prev.classList.add("out");setTimeout(paint,480)}else paint();
}
setInterval(()=>{
  const el=$("#pop .rs");if(!el||pBusy)return;
  if(pHover||!pSeen||document.hidden)return;
  pEl+=100;const f=Math.min(1,pEl/POP_MS);
  el.style.setProperty("--p",f.toFixed(3));
  const l=$("#rsLeft");if(l)l.textContent=Math.max(0,Math.ceil((POP_MS-pEl)/1000));
  if(pEl>=POP_MS)setPop(pk+1);
},100);
$("#pop").addEventListener("pointerenter",()=>pHover=true);$("#pop").addEventListener("pointerleave",()=>pHover=false);
$("#pop").addEventListener("focusin",()=>pHover=true);$("#pop").addEventListener("focusout",()=>pHover=false);
new IntersectionObserver(es=>{pSeen=es[0].isIntersecting},{threshold:.25}).observe($("#pop"));
// pointer parallax on the portrait
$("#pop").addEventListener("pointermove",e=>{
  const t=e.target.closest&&e.target.closest(".rs-portrait");if(!t)return;
  const r=t.getBoundingClientRect();
  t.style.setProperty("--mx",((e.clientX-r.left)/r.width-.5).toFixed(3));t.style.setProperty("--my",((e.clientY-r.top)/r.height-.5).toFixed(3));
});
// full story card
const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const PROOF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m9 15 2 2 4-4"/></svg>';
function openReview(i){
  const r=REVIEWS[i],info=[["Designation",r.role],["Company",r.company],["Location",r.loc]].filter(x=>x[1]);
  $("#rmb").innerHTML=`<button class="rm-x" aria-label="Close">✕</button><div class="rm-cover" style="${grad(i)}"></div>
  <div class="rm-body" style="${grad(i)}"><div class="rm-av"><i>${initials(r.n)}</i>${ph(r)}</div>
  <div class="rm-head rm-i" style="--n:0"><h3>${r.n}</h3><p>${subLine(r)||"Customer"}</p><span class="rec">${THUMB}Recommends StreamX</span></div>
  <blockquote class="rm-i" style="--n:1">“${r.t}”</blockquote>
  ${info.length?`<div class="rm-grid rm-i" style="--n:2">${info.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join("")}</div>`:""}
  <h4 class="rm-i" style="--n:3">Services taken</h4><div class="rm-svc rm-i" style="--n:3">${svcTiles(r,"sv2")}</div>
  ${r.pk?`<div class="rm-proof rm-i" style="--n:4"><h4>Original review</h4>${r.pk==="link"?`<a class="rm-orig" href="${esc(r.pu)}" target="_blank" rel="noopener nofollow">${PROOF}View original review<span aria-hidden="true">↗</span></a>`:`<button type="button" class="rm-orig" data-shot="${r.id}" aria-expanded="false">${PROOF}View original review</button><figure class="rm-shot" hidden><img alt="Screenshot of ${esc(r.n)}'s original review" decoding="async"></figure>`}</div>`:""}</div>`;
  $("#rmodal").classList.add("show");document.documentElement.style.overflow="hidden";
}
function closeReview(){$("#rmodal").classList.remove("show");document.documentElement.style.overflow=""}
document.addEventListener("click",e=>{
  const sh=e.target.closest("[data-shot]");
  if(sh){const f=sh.parentNode.querySelector(".rm-shot"),im=f.querySelector("img"),open=f.hidden;if(open&&!im.src)im.src="/api/catalog?a=rvimg&id="+sh.dataset.shot;f.hidden=!open;sh.setAttribute("aria-expanded",open);sh.lastChild.nodeType===3&&(sh.lastChild.textContent=open?"Hide original review":"View original review");return}
  const c=e.target.closest(".rk2[data-r]");if(c)openReview(+c.dataset.r);
  if(e.target.id==="rmodal"||e.target.closest(".rm-x"))closeReview();
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape")closeReview();
  if(e.key==="Enter"&&e.target.matches&&e.target.matches(".rk2[data-r]"))openReview(+e.target.dataset.r);
});

// Reviews come from the admin page (database). If it can't be reached, the built-in list is used.
function startReviews(){
  POP=REVIEWS.map((r,i)=>i);pk=0;
  const any=REVIEWS.length>0;
  ["#pop",".rwall"].forEach(q=>{const el=document.querySelector(q);if(el)el.hidden=!any});
  let em=document.getElementById("rvEmpty");
  if(!any){if(!em){em=document.createElement("p");em.id="rvEmpty";em.className="rv-empty";em.textContent="Customer reviews will appear here soon.";document.querySelector(".rwall").after(em)}}else if(em)em.remove();
  if(any){renderRows();setPop(0,true)}
  document.dispatchEvent(new Event("sx-reviews"));
}
(function(){
  let done=false;const go=l=>{if(done)return;done=true;if(l)REVIEWS.splice(0,REVIEWS.length,...l.map(r=>({...r,n:esc(r.n),role:esc(r.role),company:esc(r.company),loc:esc(r.loc),t:esc(r.t),photo:esc(r.photo),p:(r.services||[])[0]||""})));startReviews()};
  const t=setTimeout(()=>go(null),4000);
  fetch("/api/catalog?a=reviews").then(r=>r.ok?r.json():null).then(d=>{clearTimeout(t);go(d&&Array.isArray(d.list)?d.list:null)}).catch(()=>{clearTimeout(t);go(null)});
})();
