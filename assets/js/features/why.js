/* Why StreamX: bento cards with cursor spotlight, 3D tilt, scroll-triggered animations and live starting prices. */
(function(){
  const grid=$("#bwGrid");if(!grid)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches,fine=matchMedia("(pointer:fine)").matches;
  // Live starting prices from the catalog
  const pr=$("#bwPrices"),pick=["Netflix","Spotify","ChatGPT"].map(n=>PRODUCTS.find(p=>p.name===n)).filter(Boolean);
  pr.innerHTML=pick.map((p,k)=>{const f=entry(p);return `<div style="--k:${k}">${ptile(p)}<span>${p.name}<small>from</small></span><b data-to="${f.p}">৳0</b></div>`}).join("")+`<span class="bw-lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Price locked</span>`;
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
    e.target.querySelectorAll("[data-to]").forEach((b,k)=>setTimeout(()=>tween(b,0,+b.dataset.to,1100,"৳"),400+k*140));
  }),{threshold:.25});
  cards.forEach(c=>io.observe(c));
})();
