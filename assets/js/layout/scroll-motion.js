/* Apple-style scroll motion. */
// ===== Apple-style scroll motion (hero fade/parallax + zoom-in sections) =====
const zooms=[...document.querySelectorAll(".zoom")],heroEl=$("#home");let tk=false;
function motion(){
  tk=false;const vh=innerHeight;
  heroEl.style.setProperty("--hs",Math.min(1,scrollY/(vh*.8)).toFixed(3));
  zooms.forEach(el=>{const r=el.getBoundingClientRect(),p=Math.min(1,Math.max(0,(vh-r.top)/(vh*.55)));el.style.transform=`scale(${(.9+.1*p).toFixed(3)})`;el.style.opacity=(.2+.8*p).toFixed(3)});
}
addEventListener("scroll",()=>{if(!tk){tk=true;requestAnimationFrame(motion)}},{passive:true});motion();
