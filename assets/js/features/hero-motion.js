/* Home hero: word reveal, rolling brand ticker, reactive dot-grid canvas and a draggable 3D service carousel. */
// ===== Home hero motion =====
(function(){
  const hero=$("#home"),title=$(".hx-title"),SEL=document.documentElement.classList; /* 'selecting' is set while text is selected: the hero then stands still so the selection does not blink */
  if(!hero||!title)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine=matchMedia("(pointer:fine)").matches;
  if(!calm)splitWords(title);

  // Services shown in the carousel / ticker (key in LOGOS, label, regex to find the shop product for its price)
  // The original premium 12, plus six more popular services. Every tile opens its own service page.
  const PICK=["Netflix","Spotify","YouTube Premium","Amazon Prime Video","ChatGPT","Disney+","Apple Music","Canva","Claude","HBO Max","Udemy","Adobe Express","Gemini Plus","Crunchyroll"];
  const SV=PICK.map(n=>(typeof PRODUCTS!=="undefined"?PRODUCTS:[]).find(p=>p.name===n)).filter(p=>p&&LOGOS[LOGO_OF[p.name]]).map(p=>{
    const k=LOGO_OF[p.name],L=LOGOS[k];
    const from=Math.min(...p.variants.flatMap(v=>v.plans.map(x=>x.p)));
    return{k,n:p.name,L,from,href:"/services/"+slug(p.name)+"/"};
  });
  const N=SV.length,STEP=360/N;
  const lg=s=>s.L.txt?`<i class="hx-ini">${s.L.txt}</i>`:`<svg viewBox="${s.L.vb}"><path d="${s.L.p}"/></svg>`;
  const col=s=>s.L.bg==="#1E2545"||s.L.bg==="#000000"||s.L.bg==="#000"?"#fff":s.L.bg;
  const price=s=>s.from?taka(s.from):"";

  // ---------- Rolling ticker ----------
  const list=$("#rlList"),pr=$("#rlPrice"),win=list&&list.parentElement;
  if(list){
    let i=0;const h=()=>win.clientHeight-4||30;
    // Only short names fit the ticker cleanly: every streaming, music, AI, learning, productivity and VPN service up to 9 letters
    const OKC=["Streaming","Music & Audio","AI Tools","Productivity","Learning","VPN"];
    const TK=(typeof PRODUCTS!=="undefined"?PRODUCTS:[]).filter(p=>OKC.includes(p.cat)&&p.name.length<=9&&!["HBO Max","Grammarly","Gamma AI"].includes(p.name)&&LOGO_OF[p.name]&&LOGOS[LOGO_OF[p.name]]).map(p=>{
      const L=LOGOS[LOGO_OF[p.name]];return{n:p.name,L,from:Math.min(...p.variants.flatMap(v=>v.plans.map(x=>x.p)))};
    }),TN=TK.length;
    list.innerHTML=TK.concat(TK[0]).map(s=>`<b style="--c:${col(s)}">${lg(s)}${s.n}</b>`).join("");
    const setP=()=>{pr.textContent=price(TK[i%TN])||"৳"};setP();
    const tick=()=>{
      if(document.hidden)return;
      i++;list.style.transition="transform .7s cubic-bezier(.77,0,.18,1)";list.style.transform=`translateY(${-i*(list.firstElementChild.offsetHeight)}px)`;setP();
      if(i===TN)setTimeout(()=>{list.style.transition="none";list.style.transform="translateY(0)";i=0},750);
    };
    if(!calm)setInterval(tick,2400);
  }

  // ---------- 3D carousel ----------
  const orbit=$("#hxOrbit"),stage=$("#hxStage"),nameEl=$("#hxName"),fromEl=$("#hxFrom"),info=$("#hxInfo");
  if(orbit&&N){
    const mobile=()=>innerWidth<=520;
    const TW=()=>mobile()?100:134;const R=()=>Math.max(mobile()?235:300,Math.round(N*(TW()+(mobile()?10:12))/6.283));const fit=()=>{stage.style.perspective=Math.round(R()/(1-1/(mobile()?1.2:1.27)))+"px"};
    orbit.innerHTML=SV.map((s,i)=>`<div class="hx-slot" data-href="${s.href}" style="--ang:${i*STEP};--r:${R()}px"><div class="hx-t" style="--bg:${s.L.bg};--fg:${s.L.fg}">${lg(s)}</div></div>`).join("");
    orbit.style.setProperty("--d",R()*2+"px");orbit.style.setProperty("--w",TW()+"px");orbit.style.setProperty("--h",Math.round(TW()*1.2)+"px");fit();
    const slots=[...orbit.children];
    addEventListener("resize",()=>{slots.forEach(e=>e.style.setProperty("--r",R()+"px"));orbit.style.setProperty("--d",R()*2+"px");orbit.style.setProperty("--w",TW()+"px");orbit.style.setProperty("--h",Math.round(TW()*1.2)+"px");fit()});
    let ry=0,vel=calm?0:-.18,dragging=false,lx=0,front=-1,seen=true,tgtTy=0,ty=0;
    new IntersectionObserver(e=>seen=e[0].isIntersecting).observe(stage);
    function paintFront(){
      const f=((Math.round(-ry/STEP)%N)+N)%N;
      if(f===front)return;front=f;const s=SV[f];
      info.classList.remove("sw");void info.offsetWidth;info.classList.add("sw");
      nameEl.textContent=s.n;fromEl.innerHTML=s.from?`<span data-i>from</span> <strong>${price(s)}</strong>`:"";
    }
    /* Time-based motion: same speed at 60 Hz, 90 Hz or 120 Hz, and no slow-down or jerk when a frame is late.
       The orbit is turned with one direct transform (no custom-property cascade) and each tile is dimmed with an overlay instead of a filter. */
    let last=0;const o0=new Float32Array(N).fill(-1),d0=new Float32Array(N).fill(-1),z0=new Int8Array(N).fill(-1);
    function frame(t){
      requestAnimationFrame(frame);
      if(!seen||document.hidden||SEL.contains("selecting")){last=0;return}
      const dt=last?Math.min(3,(t-last)/16.667):1;last=t;
      if(!dragging){
        const auto=calm?0:(stage.matches(":hover")?-.05:-.18);
        vel+=(auto-vel)*(1-Math.pow(1-.04,dt));
      }
      ry+=vel*dt;ty+=(tgtTy-ty)*(1-Math.pow(1-.06,dt));
      orbit.style.transform="rotateX("+(-8+ty).toFixed(2)+"deg) rotateY("+ry.toFixed(2)+"deg)";
      slots.forEach((e,i)=>{
        const a=((i*STEP+ry)%360+540)%360-180;        // -180..180, 0 = front
        const f=1-Math.min(1,Math.abs(a)/180),o=+(.35+.65*f).toFixed(2),d=+(.45*(1-f)).toFixed(2),z=Math.round(f*10),tile=e.firstChild;
        if(o!==o0[i]){o0[i]=o;tile.style.opacity=o}
        if(d!==d0[i]){d0[i]=d;tile.style.setProperty("--dim",d)}
        if(z!==z0[i]){z0[i]=z;e.style.zIndex=z}
      });
      paintFront();
    }
    requestAnimationFrame(frame);
    stage.addEventListener("pointermove",e=>{
      const r=stage.getBoundingClientRect();tgtTy=((e.clientY-r.top)/r.height-.5)*-14;
    });
    stage.addEventListener("pointerleave",()=>{tgtTy=0});
  }

  // ---------- Reactive dot grid ----------
  const cv=$("#hxCanvas");
  if(cv&&!calm){
    const c=cv.getContext("2d");let W=0,H=0,dpr=1,mx=-9999,my=-9999,t=0,vis=true;
    const GAP=34;
    const size=()=>{dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0)};
    size();addEventListener("resize",size);
    new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(hero);
    if(fine)hero.addEventListener("pointermove",e=>{const r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});
    hero.addEventListener("pointerleave",()=>{mx=my=-9999});
    const pulse=[];let nextP=0,skip=false;
    function draw(){
      requestAnimationFrame(draw);
      if(!vis||document.hidden||SEL.contains("selecting"))return;
      if(!fine&&(skip=!skip))return;   /* touch devices: draw every other frame, leaves the carousel more time */
      t+=.012*(fine?1:2);c.clearRect(0,0,W,H);
      if(t>nextP){pulse.push({x:Math.random()*W,y:Math.random()*H,r:0});nextP=t+1.1}
      for(let i=pulse.length-1;i>=0;i--){pulse[i].r+=3.2*(fine?1:2);if(pulse[i].r>420)pulse.splice(i,1)}
      for(let x=GAP/2;x<W;x+=GAP)for(let y=GAP/2;y<H;y+=GAP){
        let k=.18+.1*Math.sin(t*2+x*.012+y*.01),s=1.1,dx=x-mx,dy=y-my,ox=0,oy=0;
        const d=Math.hypot(dx,dy);
        if(d<170){const f=1-d/170;k+=f*.8;s+=f*2.2;ox=dx/(d||1)*f*9;oy=dy/(d||1)*f*9}
        for(const p of pulse){const dd=Math.abs(Math.hypot(x-p.x,y-p.y)-p.r);if(dd<30){const f=1-dd/30;k+=f*.45*(1-p.r/420);s+=f*1.2}}
        c.fillStyle=`rgba(${d<170?"255,110,95":"170,185,235"},${Math.min(k,1).toFixed(2)})`;
        c.beginPath();c.arc(x+ox,y+oy,s,0,6.283);c.fill();
      }
    }
    requestAnimationFrame(draw);
  }

  // ---------- Parallax fade of copy on scroll ----------
  if(!calm)addEventListener("scroll",()=>{const f=Math.min(1,Math.max(0,scrollY/(hero.offsetHeight*.7)));hero.style.setProperty("--hs",f.toFixed(3))},{passive:true});
})();
