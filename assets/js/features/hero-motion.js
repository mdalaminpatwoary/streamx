/* Home hero: word reveal, rolling brand ticker, reactive dot-grid canvas and a draggable 3D service carousel. */
// ===== Home hero motion =====
(function(){
  const hero=$("#home"),title=$(".hx-title");
  if(!hero||!title)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine=matchMedia("(pointer:fine)").matches;
  if(!calm)splitWords(title);

  // Services shown in the carousel / ticker (key in LOGOS, label, regex to find the shop product for its price)
  // The original premium 12, plus six more popular services. Every tile opens its own service page.
  const PICK=["Netflix","Spotify","YouTube Premium","Amazon Prime Video","ChatGPT","Disney+","Apple Music","Canva","Claude","HBO Max","Udemy","Adobe Express","Gemini Pro","Crunchyroll"];
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
    const TK=(typeof PRODUCTS!=="undefined"?PRODUCTS:[]).filter(p=>OKC.includes(p.cat)&&p.name.length<=9&&LOGO_OF[p.name]&&LOGOS[LOGO_OF[p.name]]).map(p=>{
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
    function frame(){
      requestAnimationFrame(frame);
      if(!seen||document.hidden)return;
      if(!dragging){
        const auto=calm?0:(stage.matches(":hover")?-.05:-.18);
        vel+=(auto-vel)*.04;
      }
      ry+=vel;ty+=(tgtTy-ty)*.06;
      orbit.style.setProperty("--ry",ry.toFixed(2)+"deg");orbit.style.setProperty("--ty",ty.toFixed(2)+"deg");
      slots.forEach((e,i)=>{
        const a=((i*STEP+ry)%360+540)%360-180;        // -180..180, 0 = front
        const f=1-Math.min(1,Math.abs(a)/180);
        e.firstChild.style.opacity=(.35+.65*f).toFixed(2);
        e.firstChild.style.filter=`brightness(${(.55+.45*f).toFixed(2)})`;
        e.style.zIndex=Math.round(f*10);
      });
      paintFront();
    }
    requestAnimationFrame(frame);
    let sx=0;
    stage.addEventListener("pointerdown",e=>{dragging=true;sx=lx=e.clientX;stage.classList.add("drag");stage.setPointerCapture(e.pointerId)});
    stage.addEventListener("pointermove",e=>{
      const r=stage.getBoundingClientRect();tgtTy=((e.clientY-r.top)/r.height-.5)*-14;
      if(dragging){const dx=e.clientX-lx;lx=e.clientX;ry+=dx*.32;vel=dx*.32}
    });
    const up=()=>{dragging=false;stage.classList.remove("drag")};
    stage.addEventListener("pointerup",e=>{up();if(Math.abs(e.clientX-sx)<6){const el=document.elementFromPoint(e.clientX,e.clientY)||e.target;const t=el.closest&&el.closest(".hx-slot");const go=t?t.dataset.href:(el.closest&&el.closest("#hxInfo")?SV[front]&&SV[front].href:null);if(go)location.href=go}});stage.addEventListener("pointercancel",up);
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
    const pulse=[];let nextP=0;
    function draw(){
      requestAnimationFrame(draw);
      if(!vis||document.hidden)return;
      t+=.012;c.clearRect(0,0,W,H);
      if(t>nextP){pulse.push({x:Math.random()*W,y:Math.random()*H,r:0});nextP=t+1.1}
      for(let i=pulse.length-1;i>=0;i--){pulse[i].r+=3.2;if(pulse[i].r>420)pulse.splice(i,1)}
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
