/* Section dividers. */
// ===== Section dividers draw themselves =====
const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("seen");so.unobserve(e.target)}}),{threshold:.05});
document.querySelectorAll(".sec").forEach(s=>so.observe(s));
