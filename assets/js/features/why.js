/* Why StreamX: bento cards with cursor spotlight, 3D tilt, scroll-triggered animations and live starting prices. */
(function(){
  const grid=$("#bwGrid");if(!grid)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches,fine=matchMedia("(pointer:fine)").matches;
  // Every product with its starting price, scrolling vertically as a 3D wheel
  const pr=$("#bwPrices");
  const lock='<span class="bw-lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Price locked</span>';
  const list=PRODUCTS.map((p,i)=>[p,i]).filter(x=>x[0].cat!=="18+");
  pr.innerHTML=`<div class="vp" id="vp">${list.map(([p,i])=>{const f=entry(p),pk=!!p.packs;return `<button type="button" class="vp-i" data-i="${i}" tabindex="-1">${pk?ptile({name:"Netflix"}):ptile(p)}<span>${p.name}<small>${f.u||(pk?"/ month":"/ "+UNIT[f.m])}</small></span><b>${p.ask?"Ask":taka(f.p)}</b></button>`}).join("")}</div>${lock}`;
  const vp=$("#vp"),its=[...vp.children],PITCH=60,H=250,TOT=its.length*PITCH;
  vp.style.height=H+"px";
  vp.addEventListener("click",e=>{const b=e.target.closest(".vp-i");if(b)showPlans(+b.dataset.i,true)});
  let off=0,spd=calm?0:.27,tgt=spd,vis=false,last=0;
  function wheel(now){
    requestAnimationFrame(wheel);
    if(!vis||document.hidden)return;
    const dt=Math.min(40,now-last||16);last=now;
    spd+=(tgt-spd)*.08;off=(off+spd*dt*.06*PITCH/16*.9)%TOT;
    for(let k=0;k<its.length;k++){
      let y=((k*PITCH-off)%TOT+TOT)%TOT;if(y>TOT-PITCH*1.5)y-=TOT;
      const d=(y+PITCH/2-H/2)/(H/2),a=Math.abs(d);
      const el=its[k];
      if(a>1.25){el.style.visibility="hidden";continue}
      el.style.visibility="visible";
      el.style.transform=`translateY(${y.toFixed(1)}px) rotateX(${(d*-28).toFixed(1)}deg) scale(${(1-.16*a).toFixed(3)})`;
      el.style.opacity=Math.max(0,1-.75*a*a).toFixed(2);
      el.classList.toggle("hot",a<.17);
    }
  }
  if(calm){vp.classList.add("still");its.forEach((el,k)=>{el.style.transform=`translateY(${k*PITCH}px)`;el.style.opacity=1});vp.style.overflowY="auto"}
  else{
    new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(vp);
    vp.addEventListener("pointerenter",()=>tgt=0);vp.addEventListener("pointerleave",()=>tgt=.27);
    requestAnimationFrame(wheel);
  }
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
