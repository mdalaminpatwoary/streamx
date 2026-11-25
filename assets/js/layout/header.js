/* Header: smooth scroll-spy and progress rail. */
// ===== Header: light and smooth (rAF + IntersectionObserver scroll-spy) =====
const nav=$("#nav"),ind=$("#ind"),links=[...document.querySelectorAll("#menu>a")];let lastY=0,ticking=false,curLink=links[0];
function setActive(a){if(!a)return;curLink=a;links.forEach(l=>l.classList.toggle("on",l===a));if(innerWidth>860){ind.style.width=a.offsetWidth+"px";ind.style.transform=`translateX(${a.offsetLeft}px)`}}
function frame(){
  ticking=false;const y=scrollY,dy=y-lastY,max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  nav.classList.toggle("scrolled",y>30);
  const menu=$("#menu");
  if(!(menu&&menu.classList.contains("open"))){if(y>140&&dy>4)nav.classList.add("pill");else if(dy<-4||y<60)nav.classList.remove("pill")}
  nav.classList.remove("hide");lastY=y;
  const sp=Math.min(1,y/max);document.documentElement.style.setProperty("--sp",sp.toFixed(4));
  if(y>=max-4)setActive(links[links.length-1]);
}
addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(frame)}},{passive:true});
const spy=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(links.find(a=>a.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-35% 0px -60% 0px"});
links.forEach(a=>{const h=a.getAttribute("href");const s=h[0]==="#"&&document.querySelector(h);s&&spy.observe(s)});
addEventListener("resize",()=>setActive(curLink));
if(window.ResizeObserver){const m=$("#menu");if(m)new ResizeObserver(()=>setActive(curLink)).observe(m)}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>setActive(curLink));
/* Width of the shrunk pill = logo + buttons (measured, so it follows the cart/bell/burger that are showing) */
const bar=nav.querySelector(".navbar"),lg=bar.querySelector(".logo"),nr=bar.querySelector(".nr");
function measure(){const c=getComputedStyle(bar),gap=parseFloat(c.columnGap)||14,ks=[...nr.children].filter(e=>e.id!=="burger"&&e.id!=="ntBell"&&getComputedStyle(e).display!=="none"),nw=ks.reduce((t,e)=>t+e.offsetWidth,0)+10*Math.max(0,ks.length-1);nav.style.setProperty("--pw",Math.ceil(14+lg.offsetWidth+gap+nw+(parseFloat(c.paddingRight)||10)+(parseFloat(c.borderLeftWidth)||0)*2)+"px")}
measure();addEventListener("resize",measure);addEventListener("load",measure);
if(window.ResizeObserver){new ResizeObserver(measure).observe(nr);new ResizeObserver(measure).observe(lg)}
setActive(links[0]);frame();

/* Opening the site with #section (e.g. from a service page): keep the section in view while images, fonts and the Trending block finish loading, until the visitor scrolls. */
(function(){const id=decodeURIComponent(location.hash.slice(1));if(!id||id.indexOf("plan=")===0)return;let on=true;
const stop=()=>{on=false};["wheel","touchstart","keydown","pointerdown"].forEach(e=>addEventListener(e,stop,{once:true,passive:true}));
const go=()=>{if(!on)return;const el=document.getElementById(id);if(el)el.scrollIntoView()};
window.realignHash=go;addEventListener("load",go);[400,1000,2000,3500].forEach(t=>setTimeout(go,t))})();
