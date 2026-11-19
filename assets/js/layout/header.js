/* Header: smooth scroll-spy and progress rail. */
// ===== Header: light and smooth (rAF + IntersectionObserver scroll-spy) =====
const nav=$("#nav"),ind=$("#ind"),links=[...document.querySelectorAll("#menu a")];let lastY=0,ticking=false,curLink=links[0];
function setActive(a){if(!a)return;curLink=a;links.forEach(l=>l.classList.toggle("on",l===a));if(innerWidth>860){ind.style.width=a.offsetWidth+"px";ind.style.transform=`translateX(${a.offsetLeft}px)`}}
function frame(){
  ticking=false;const y=scrollY,dy=y-lastY,max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  nav.classList.toggle("scrolled",y>30);
  nav.classList.remove("hide");lastY=y;
  const sp=Math.min(1,y/max);document.documentElement.style.setProperty("--sp",sp.toFixed(4));
  if(y>=max-4)setActive(links[links.length-1]);
}
addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(frame)}},{passive:true});
const spy=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(links.find(a=>a.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-35% 0px -60% 0px"});
links.forEach(a=>{const h=a.getAttribute("href");const s=h[0]==="#"&&document.querySelector(h);s&&spy.observe(s)});
addEventListener("resize",()=>setActive(curLink));
$("#lang").addEventListener("click",()=>setTimeout(()=>setActive(curLink),40));
setActive(links[0]);frame();
