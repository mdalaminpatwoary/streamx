/* Stats: counters, reviewer faces, service logos and footer shortcuts. */
// ===== Stats: count up when visible (services counted automatically) =====
const svcEl=document.querySelector("[data-svc]");if(svcEl)svcEl.dataset.to=PRODUCTS.filter(p=>p.cat!=="Bundle").length;
const sio=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;sio.unobserve(e.target);e.target.classList.add("on");
  const b=e.target.querySelector("b"),to=+b.dataset.to,suf=b.dataset.suf||"",plain=b.dataset.plain,from=plain?to-25:0,t0=performance.now();
  (function f(t){const k=Math.min(1,(t-t0)/1600),v=Math.round(from+(to-from)*(1-Math.pow(1-k,4)));b.innerHTML=(plain?v:v.toLocaleString("en-US"))+(suf?`<em>${suf}</em>`:"");if(k<1)requestAnimationFrame(f)})(t0);
}),{threshold:.4});
document.querySelectorAll(".stat").forEach(s=>sio.observe(s));

// ===== Stats extras (real reviewers, service logos, years) + footer shortcuts =====
(function(){
  const f=$("#faces"),paintFaces=()=>{f.hidden=!REVIEWS.length;f.innerHTML=`<div class="fcs">${REVIEWS.slice(0,5).map(r=>`<span><i>${initials(r.n)}</i>${ph(r)}</span>`).join("")}</div><div class="frt"><strong>Recommended</strong><small>by StreamX customers</small></div>`};
  f.hidden=true;document.addEventListener("sx-reviews",paintFaces);
  const shown=MQ.slice(0,6),total=PRODUCTS.filter(p=>p.cat!=="Bundle").length;
  $("#slogos").innerHTML=shown.map(m=>tile(m[0],"")).join("")+`<span class="more">+${total-shown.length} more</span>`;
  const since=+document.querySelector(".yr b").dataset.to,y=new Date().getFullYear()-since;
})();
document.addEventListener("click",e=>{const a=e.target.closest("[data-plan]");if(!a)return;e.preventDefault();const i=PRODUCTS.findIndex(p=>p.name===a.dataset.plan);if(i>-1)showPlans(i,true)});
