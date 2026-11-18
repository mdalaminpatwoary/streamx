/* Section dividers and floating chat button. */
// ===== Section dividers draw themselves; chat button shrinks to an icon =====
const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("seen");so.unobserve(e.target)}}),{threshold:.05});
document.querySelectorAll(".sec").forEach(s=>so.observe(s));
setTimeout(()=>{const f=$(".float");f&&f.classList.add("min")},6000);
