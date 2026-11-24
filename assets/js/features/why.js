/* Why StreamX: bento cards with cursor spotlight, 3D tilt, scroll-triggered animations and live starting prices. */
(function(){
  const grid=$("#bwGrid");if(!grid)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches,fine=matchMedia("(pointer:fine)").matches;
  // My Account preview: a compact copy of the account page's subscription card, animated through access, expiry date, auto renew and receipt
  const pr=$("#bwPrices");
  const fd=d=>d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  const now=new Date(),st=new Date(now.getTime()-6*864e5),en=new Date(now.getTime()+24*864e5);
  const ic=p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  pr.innerHTML=`<div class="mc">
    <div class="mc-rail"><i class="mc-hl"></i><span>${ic('<rect x="3" y="11" width="18" height="9" rx="2"/><path d="M7 11V8a5 5 0 0 1 10 0v3"/>')}Access</span><span>${ic('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>')}Expiry date</span><span>${ic('<path d="M21 12a8.5 8.5 0 0 1-14.6 5.9M3 12A8.5 8.5 0 0 1 17.6 6.1M17.6 3v3.1h-3.1M6.4 21v-3.1h3.1"/>')}Auto renew</span><span>${ic('<path d="M7 3h10v18l-2.5-1.7L12 21l-2.5-1.7L7 21zM10 8h4M10 12h4"/>')}Receipt</span></div>
    <article class="mc-card">
      <div class="mc-hd">${ptile({name:"Netflix"})}<div class="mc-id"><b>Netflix<em>Active</em></b><small>Share Profile</small></div>
        <div class="mc-ring"><svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="27"/><circle class="fg" cx="32" cy="32" r="27"/></svg><div><b>24</b><small>days left</small></div></div></div>
      <div class="mc-m"><span>Started<b>${fd(st)}</b></span><span class="ex">Expires<b>${fd(en)}</b></span><span>Order<b>#SX-2810</b></span></div>
      <div class="mc-login"><div class="mc-r"><small>Email</small><b>name@example.com</b></div><div class="mc-r mc-pw"><small>Password</small><b><s class="m">\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022</s><s class="v">Nx7pR2mQ</s></b><i>${ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>')}</i></div></div>
      <div class="mc-ft"><div class="mc-ar"><span class="mc-tg"><u></u></span><span class="mc-at">Auto renew<small class="mc-rn">Renews ${en.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</small></span></div>
        <button type="button" class="mc-rc" tabindex="-1">${ic('<path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M5 21h14"/>')}<span class="a">Download receipt</span><span class="b">Receipt saved</span><u class="mc-p"></u></button></div>
      <div class="mc-sheet"><b>RECEIPT</b><span>#SX-2810</span><i></i><i></i><i class="s"></i><em>Paid \u2713</em></div>
    </article></div>`;
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
