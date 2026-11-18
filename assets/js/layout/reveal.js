/* Fade-in on scroll. */
// Fade-in on scroll (with small stagger)
document.querySelectorAll(".card:not(.pc):not(.rc),details,.final,.sec>h2").forEach(e=>e.classList.add("rv"));
const io = new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");setTimeout(()=>e.target.style.transitionDelay="0ms",1200)}}),{threshold:.1});
document.querySelectorAll(".rv").forEach(el=>{el.style.transitionDelay=([...el.parentNode.children].indexOf(el)%4*80)+"ms";io.observe(el)});
