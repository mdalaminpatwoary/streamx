/* Site-wide motion layer: scroll progress, ambient glow, heading reveals, card tilt, magnetic buttons. */
// ===== Premium motion =====
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const fine=matchMedia("(hover:hover) and (pointer:fine)").matches;
  const make=(cls,html="")=>{const d=document.createElement("div");d.className=cls;d.setAttribute("aria-hidden","true");d.innerHTML=html;document.body.appendChild(d);return d};

  // 1. Scroll progress bar + ambient light that drifts as you scroll
  make("sx-progress");make("sx-ambient","<i></i><i></i><i></i>");
  let tick=false;
  const onScroll=()=>{tick=false;const m=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty("--sp",(m>0?Math.min(1,scrollY/m):0).toFixed(4))};
  addEventListener("scroll",()=>{if(!tick){tick=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

  // 2. Section headings: words rise in one by one
  const hio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");hio.unobserve(e.target)}}),{threshold:.35});
  document.querySelectorAll(".sec h2:not([data-bn])").forEach(h=>{splitWords(h);h.classList.add("sx-h");hio.observe(h)});

  if(!fine)return;

  // 3. Card tilt with a moving glare (eased so it never snaps)
  const TILT=".pc,.rc,.pcard,.tr-poster";
  const live=new Map();let raf=0;
  function loop(){
    let busy=false;
    live.forEach((s,el)=>{
      s.x+=(s.tx-s.x)*.14;s.y+=(s.ty-s.y)*.14;
      const m=Math.hypot(s.x,s.y);
      el.style.rotate=m<.002?"":`${-s.y.toFixed(4)} ${s.x.toFixed(4)} 0 ${(m*9).toFixed(3)}deg`;
      el.style.setProperty("--gx",(50+s.x*100).toFixed(1)+"%");el.style.setProperty("--gy",(50+s.y*100).toFixed(1)+"%");
      if(Math.abs(s.tx-s.x)>.001||Math.abs(s.ty-s.y)>.001)busy=true;else if(s.tx===0&&s.ty===0){el.style.rotate="";live.delete(el)}
    });
    raf=busy?requestAnimationFrame(loop):0;
  }
  const glare=el=>{
    if(el.querySelector(":scope>.sx-gl"))return;
    if(getComputedStyle(el).position==="static")el.style.position="relative";
    el.insertAdjacentHTML("beforeend",'<span class="sx-gl" aria-hidden="true"></span>');
  };
  let cur=null;
  document.addEventListener("pointermove",e=>{
    const el=e.target.closest&&e.target.closest(TILT);
    if(cur&&cur!==el){const s=live.get(cur);if(s){s.tx=0;s.ty=0}}
    cur=el;if(!el)return;
    glare(el);
    const r=el.getBoundingClientRect(),s=live.get(el)||{x:0,y:0,tx:0,ty:0};
    s.tx=(e.clientX-r.left)/r.width-.5;s.ty=(e.clientY-r.top)/r.height-.5;live.set(el,s);
    if(!raf)raf=requestAnimationFrame(loop);
  },{passive:true});
  document.addEventListener("pointerleave",()=>{if(cur){const s=live.get(cur);if(s){s.tx=0;s.ty=0}cur=null;if(!raf)raf=requestAnimationFrame(loop)}});

  // 4. Magnetic buttons
  document.addEventListener("pointermove",e=>{
    const b=e.target.closest&&e.target.closest(".btn:not(.hx-btn):not(.lm)");
    if(!b)return;
    b.classList.add("sx-mag");
    const r=b.getBoundingClientRect();
    b.style.translate=`${((e.clientX-r.left)/r.width-.5)*8}px ${((e.clientY-r.top)/r.height-.5)*6}px`;
  },{passive:true});
  document.addEventListener("pointerout",e=>{const b=e.target.closest&&e.target.closest(".sx-mag");if(b&&!b.contains(e.relatedTarget))b.style.translate=""});
})();

/* While text is selected, hold the gradient shimmer still: repainting it every frame under the selection highlight makes the heading blink. */
(function(){
  const root=document.documentElement;let on=false;
  document.addEventListener("selectionchange",()=>{
    const s=getSelection(),v=!!s&&!s.isCollapsed&&String(s).trim().length>0;
    if(v!==on){on=v;root.classList.toggle("selecting",v)}
  });
})();
