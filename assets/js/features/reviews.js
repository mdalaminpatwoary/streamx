/* Reviews: popular spotlight, moving rows and full story card. */
// Reviews: popular spotlight (one after another), moving rows, click for full story
const initials=n=>n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const ph=r=>r.photo?`<img src="${r.photo}" alt="${r.n}" loading="lazy" onerror="this.remove()">`:"";
const THUMB='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
const FBI='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>',IGI='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>';
const GR=[["#ED3124","#B4233C"],["#4F6BFF","#1E2F8F"],["#FF6F61","#D9363E"],["#2DD4BF","#0E6E80"],["#8B9DFF","#3B4BC8"],["#FF5B4D","#8E2A5C"],["#34D399","#0B6B4B"],["#60A5FA","#1D4ED8"]];
const grad=i=>`--c1:${GR[i%GR.length][0]};--c2:${GR[i%GR.length][1]}`;
const subLine=r=>[r.role,r.company].filter(Boolean).join(" · ");
const svcOf=r=>r.services&&r.services.length?r.services:[r.p];
const svcTiles=(r,cls)=>svcOf(r).map(n=>{const p=PRODUCTS.find(x=>x.name===n);return `<span class="${cls}">${p?ptile(p):""}<em>${n}</em></span>`}).join("");
const rcard=(r,dup)=>{const i=REVIEWS.indexOf(r),p=PRODUCTS.find(x=>x.name===r.p);return `<figure class="rk2${dup?" dup":""}" style="${grad(i)}" data-r="${i}" tabindex="${dup?-1:0}" role="button" aria-label="Open ${r.n}'s story"${dup?' aria-hidden="true"':""}><div class="rk2-top"><span class="av4"><i>${initials(r.n)}${ph(r)}</i></span><div class="who2"><b>${r.n}</b><small>${r.role||"Customer"}</small></div><span class="rec">${THUMB}Recommends</span></div>
  <blockquote>${r.t}</blockquote><figcaption>${p?ptile(p):""}<span>${r.p}</span><span class="rk2-more">Details ↗</span></figcaption></figure>`};
(function(){
  const half=Math.ceil(REVIEWS.length/2),rows=[REVIEWS.slice(0,half),REVIEWS.slice(half)];
  rows.forEach((row,x)=>{if(!row.length)return;$("#rrow"+(x+1)).innerHTML=[0,1,2,3].map(c=>row.map(r=>rcard(r,c>0)).join("")).join("")});
})();
// Popular review spotlight: big portrait, one review after another every 10 seconds (pauses on hover, off-screen and in background tabs)
const POP=(()=>{const a=REVIEWS.map((r,i)=>i).filter(i=>REVIEWS[i].popular);return a.length?a:REVIEWS.slice(0,4).map((r,i)=>i)})();
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
      <span class="rs-badge"><span class="rs-stars">${"★".repeat(r.s||5)}</span><b>${(r.s||5).toFixed(1)}</b></span>${popTile(r)}</div>
    <div class="rs-body"><span class="eyebrow">Popular review</span>${QUOTE}
      <blockquote>${r.t.split(" ").map((w,k)=>`<span class="rw" style="--k:${k}">${w}</span>`).join(" ")}</blockquote>
      <div class="rs-by"><b>${r.n}</b><span>${[subLine(r),r.loc].filter(Boolean).join(" · ")}</span></div>
      <div class="rs-act"><button class="btn grad-bg" onclick="openReview(${i})">View full story →</button><span class="rs-hint">Next review in <b id="rsLeft">${POP_MS/1000}</b>s</span></div></div>
    <div class="rs-nav" role="tablist">${POP.map((j,x)=>`<button type="button" role="tab" aria-selected="${x===pk}" class="${x===pk?"on":""}" onclick="setPop(${x})" style="${grad(j)}"><span class="rs-mini"><i>${initials(REVIEWS[j].n)}</i>${ph(REVIEWS[j])}</span><span class="rs-nm"><b>${REVIEWS[j].n}</b><small>${REVIEWS[j].role||"Customer"}</small></span><span class="rs-bar"><i></i></span></button>`).join("")}</div></div>`;
    pBusy=false;
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
setPop(0,true);
// full story card
function openReview(i){
  const r=REVIEWS[i],info=[["Designation",r.role],["Company",r.company],["Location",r.loc]].filter(x=>x[1]);
  $("#rmb").innerHTML=`<button class="rm-x" aria-label="Close">✕</button><div class="rm-cover" style="${grad(i)}"></div>
  <div class="rm-body" style="${grad(i)}"><div class="rm-av"><i>${initials(r.n)}</i>${ph(r)}</div>
  <div class="rm-head rm-i" style="--n:0"><h3>${r.n}</h3><p>${subLine(r)||"Customer"}</p><span class="rec">${THUMB}Recommends StreamX</span></div>
  <blockquote class="rm-i" style="--n:1">“${r.t}”</blockquote>
  ${info.length?`<div class="rm-grid rm-i" style="--n:2">${info.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join("")}</div>`:""}
  <h4 class="rm-i" style="--n:3">Services taken</h4><div class="rm-svc rm-i" style="--n:3">${svcTiles(r,"sv2")}</div>
  ${r.fb||r.ig?`<div class="rm-soc rm-i" style="--n:4">${r.fb?`<a class="s-fb" href="${r.fb}" target="_blank" rel="noopener">${FBI}Facebook</a>`:""}${r.ig?`<a class="s-ig" href="${r.ig}" target="_blank" rel="noopener">${IGI}Instagram</a>`:""}</div>`:""}</div>`;
  $("#rmodal").classList.add("show");document.documentElement.style.overflow="hidden";
}
function closeReview(){$("#rmodal").classList.remove("show");document.documentElement.style.overflow=""}
document.addEventListener("click",e=>{
  const c=e.target.closest(".rk2[data-r]");if(c)openReview(+c.dataset.r);
  if(e.target.id==="rmodal"||e.target.closest(".rm-x"))closeReview();
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape")closeReview();
  if(e.key==="Enter"&&e.target.matches&&e.target.matches(".rk2[data-r]"))openReview(+e.target.dataset.r);
});
