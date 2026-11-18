/* Four steps: highlight moves through each step. */
// ===== Four steps: the highlight moves through each step =====
(function(){
  const box=$("#steps"),st=[...box.querySelectorAll(".jn")];let k=-1,t;
  const go=n=>{k=n;st.forEach((s,x)=>s.classList.toggle("act",x===k));clearTimeout(t);t=setTimeout(()=>go((k+1)%st.length),2600)};
  new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){box.classList.add("play");if(k<0)go(0)}}),{threshold:.1}).observe(box);
  st.forEach((s,x)=>s.addEventListener("mouseenter",()=>go(x)));
})();
