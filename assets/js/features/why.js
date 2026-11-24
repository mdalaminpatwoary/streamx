/* Why StreamX: bento cards with cursor spotlight, 3D tilt, scroll-triggered animations and live starting prices. */
(function(){
  const grid=$("#bwGrid");if(!grid)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches,fine=matchMedia("(pointer:fine)").matches;
  // Autopilot: an order that runs itself (order > verify > assign > send), one real product and price per round
  const pr=$("#bwPrices");
  const lock='<span class="bw-lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Price locked</span>';
  const pick=["Netflix","Spotify","Amazon Prime Video","ChatGPT","YouTube Premium","Disney+"].map(n=>PRODUCTS.find(p=>p.name===n)).filter(Boolean);
  const list=pick.length?pick:PRODUCTS.filter(p=>p.cat!=="18+").slice(0,5);
  const label=p=>{const f=entry(p);return p.name+" \u00b7 "+(p.ask?"Ask":taka(f.p))};
  const oid=()=>String(1000+Math.floor(Math.random()*9000));
  const I={cart:'<path d="M6 6h15l-2 9H8zM6 6 5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',shield:'<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',key:'<circle cx="8" cy="15" r="3.5"/><path d="m10.5 12.5 8-8M15 8l2.5 2.5M17.5 5.5 20 8"/>',mail:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="m3.5 8 8.5 6 8.5-6"/>'};
  const nodes=[["cart","Order"],["shield","Verify"],["key","Assign"],["mail","Send"]];
  pr.innerHTML=`<div class="ap"><i class="ap-c a"></i><i class="ap-c b"></i><i class="ap-c c"></i><i class="ap-c d"></i>
    <div class="ap-top"><span class="ap-badge"><i></i>AUTOPILOT</span><span class="ap-zero"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4"/><path class="ap-x" d="M3.5 3.5 20.5 20.5"/></svg>0 people needed</span></div>
    <div class="ap-pipe"><div class="ap-line"><u id="apBar"></u></div><ol>${nodes.map((n,k)=>`<li style="--s:${k}"><i><svg viewBox="0 0 24 24">${I[n[0]]}</svg></i><span>${n[1]}</span></li>`).join("")}</ol></div>
    <div class="ap-log"><p class="l0"><em>00:00.0</em>order received <b id="apItem">${label(list[0])}</b></p><p class="l1"><em>00:00.6</em>payment verified <b>OK</b></p><p class="l2"><em>00:01.3</em>access assigned <b id="apId">#SX-${oid()}</b></p><p class="l3"><em>00:02.4</em>sent to your email <b>OK</b></p></div></div>${lock}`;
  let n=0;const item=$("#apItem"),idEl=$("#apId"),bar=$("#apBar");
  if(!calm&&list.length>1)bar.addEventListener("animationiteration",()=>{n=(n+1)%list.length;item.textContent=label(list[n]);idEl.textContent="#SX-"+oid()});
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
