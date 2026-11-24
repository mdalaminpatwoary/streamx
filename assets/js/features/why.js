/* Why StreamX: bento cards with cursor spotlight, 3D tilt, scroll-triggered animations and live starting prices. */
(function(){
  const grid=$("#bwGrid");if(!grid)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches,fine=matchMedia("(pointer:fine)").matches;
  // Automatic checkout: a looping order that moves through the steps on its own, one real product and price per round
  const pr=$("#bwPrices");
  const lock='<span class="bw-lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Price locked</span>';
  const pick=["Netflix","Spotify","Amazon Prime Video","ChatGPT","YouTube Premium","Disney+"].map(n=>PRODUCTS.find(p=>p.name===n)).filter(Boolean);
  const list=pick.length?pick:PRODUCTS.filter(p=>p.cat!=="18+").slice(0,5);
  const STEPS=["Selected","Paid","Processing","Delivered"];
  const row=p=>{const f=entry(p),pk=!!p.packs;return `${pk?ptile({name:"Netflix"}):ptile(p)}<span>${p.name}<small>${f.u||(pk?"/ month":"/ "+UNIT[f.m])}</small></span><b>${p.ask?"Ask":taka(f.p)}</b>`};
  const oid=()=>String(1000+Math.floor(Math.random()*9000));
  pr.innerHTML=`<div class="ba"><div class="ba-top"><span class="ba-badge"><i></i>AUTOMATIC</span><span class="ba-id">ORDER #SX-<b id="baId">${oid()}</b></span></div><div class="ba-item" id="baItem">${row(list[0])}</div><ol class="ba-steps">${STEPS.map((t,k)=>`<li style="--s:${k}"><i></i>${t}</li>`).join("")}</ol><div class="ba-bar"><u id="baBar"></u></div><div class="ba-done"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="m3.5 8 8.5 6 8.5-6"/></svg>Sent to your email, no person needed</div></div>${lock}`;
  let n=0;const item=$("#baItem"),idEl=$("#baId"),bar=$("#baBar");
  if(!calm&&list.length>1)bar.addEventListener("animationiteration",()=>{
    n=(n+1)%list.length;item.classList.add("sw");
    setTimeout(()=>{item.innerHTML=row(list[n]);idEl.textContent=oid();item.classList.remove("sw")},260);
  });
  const cards=[...grid.querySelectorAll(".bw")];
  // Spotlight + tilt
  cards.forEach(c=>{
    c.addEventListener("pointermove",e=>{
      const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      c.style.setProperty("--mx",(x*100).toFixed(1)+"%");c.style.setProperty("--my",(y*100).toFixed(1)+"%");
      if(fine&&!calm){c.style.setProperty("--rx",((.5-y)*5).toFixed(2)+"deg");c.style.setProperty("--ry",((x-.5)*7).toFixed(2)+"deg")}
    });
    c.addEventListener("pointerleave",()=>{c.style.setProperty("--rx","0deg");c.style.setProperty("--ry","0deg")});
  });
  // Start each card's animation when it scrolls into view
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;io.unobserve(e.target);e.target.classList.add("in");
  }),{threshold:.25});
  cards.forEach(c=>io.observe(c));
})();
