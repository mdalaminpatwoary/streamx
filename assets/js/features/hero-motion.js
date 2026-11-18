/* Home hero: per-word title reveal, order-card progress loop, mouse depth. */
// ===== Home hero motion =====
(function(){
  const hero=$("#home"),card=$("#hxCard"),title=$(".hx-title");
  if(!hero||!card||!title)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Each title word animates in on its own.
  if(!calm)splitWords(title);

  // Order card: step through "received → paid → delivered", then loop. Pauses when off-screen.
  const steps=[...card.querySelectorAll(".hx-steps li")];
  let timers=[],visible=true;
  const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
  function cycle(){
    timers.forEach(clearTimeout);timers=[];
    card.classList.remove("done");steps.forEach(s=>s.classList.remove("on"));card.style.setProperty("--p",0);
    const at=[900,2300,3800];
    steps.forEach((s,k)=>later(()=>{s.classList.add("on");card.style.setProperty("--p",Math.round((k+1)/steps.length*100))},at[k]));
    later(()=>card.classList.add("done"),at[2]+200);
    later(()=>{if(visible)cycle();else wait=true},at[2]+3600);
  }
  let wait=false;
  if(calm){steps.forEach(s=>s.classList.add("on"));card.classList.add("done");card.style.setProperty("--p",100)}
  else{
    cycle();
    new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible&&wait){wait=false;cycle()}},{threshold:.1}).observe(hero);
  }

  // Mouse depth: card tilts, tiles shift by their own depth. Skipped on touch devices.
  if(calm||!matchMedia("(hover:hover) and (pointer:fine)").matches)return;
  const stage=$(".hx-stage");let tx=0,ty=0,cx=0,cy=0,raf=0;
  function frame(){
    cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
    stage.style.setProperty("--rx",(cx*7).toFixed(3));
    stage.style.setProperty("--ry",(cy*-6).toFixed(3));
    stage.style.setProperty("--ty",cy.toFixed(3));
    raf=(Math.abs(tx-cx)>.001||Math.abs(ty-cy)>.001)?requestAnimationFrame(frame):0;
  }
  hero.addEventListener("pointermove",e=>{
    const r=hero.getBoundingClientRect();
    tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2;
    if(!raf)raf=requestAnimationFrame(frame);
  });
  hero.addEventListener("pointerleave",()=>{tx=ty=0;if(!raf)raf=requestAnimationFrame(frame)});

  // Magnetic primary button.
  const b=$(".hx-btn");
  if(b){
    b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();b.style.translate=`${((e.clientX-r.left)/r.width-.5)*10}px ${((e.clientY-r.top)/r.height-.5)*8}px`});
    b.addEventListener("pointerleave",()=>{b.style.translate=""});
  }
})();
