/* Deep links: #plan=<slug> opens that plan. */
function openFromHash(){
  const m=location.hash.match(/^#plan=([^&]+)(?:&v=(\d+))?(?:&k=(\d+))?/);if(!m)return;
  const i=PRODUCTS.findIndex(p=>slug(p.name)===decodeURIComponent(m[1]));if(i<0)return;
  showPlans(i,true,+(m[2]||0));
  const c=document.querySelectorAll("#planTable .pcard")[+(m[3]||0)];if(c){c.classList.add("glow");setTimeout(()=>c.classList.remove("glow"),3400)}
}
addEventListener("hashchange",openFromHash);setTimeout(openFromHash,500);
