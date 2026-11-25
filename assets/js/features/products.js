/* Products grid: search, sort, category filter, load more, 18+ age check. */
const mq=matchMedia("(max-width:600px)");let PAGE=20,MORE=20; // 20 first; the row loads 20 more near its end
let cat="All",q="",limit=PAGE,view=[],sortKey="rec";
// Sort factors: popularity (list order), price, name, newest (added last), category
const SORTS={rec:(a,b)=>a[1]-b[1],pa:(a,b)=>entry(a[0]).p-entry(b[0]).p||a[1]-b[1],pd:(a,b)=>entry(b[0]).p-entry(a[0]).p||a[1]-b[1],az:(a,b)=>a[0].name.localeCompare(b[0].name),za:(a,b)=>b[0].name.localeCompare(a[0].name),new:(a,b)=>b[1]-a[1],cat:(a,b)=>a[0].cat.localeCompare(b[0].cat)||a[1]-b[1]};
const NOPAGE=["Brazzers","FapHouse"]; // 18+ items without a service page keep the plan picker
const openSvc=i=>{const p=PRODUCTS[i];if(NOPAGE.includes(p.name)){showPlans(i,true);return}if(p.cat==="18+"&&!ageOK){askAge(()=>{location.href="/services/"+slug(p.name)+"/"});return}location.href="/services/"+slug(p.name)+"/"};
const card=(p,i,d=0)=>`<div class="card pc" style="animation-delay:${d}ms" onclick="openSvc(${i})">
  <div class="ph">${ptile(p)}<span class="cat">${p.cat}</span></div>
  <h3>${p.name}</h3><p>${p.desc}</p>
  <div class="pf"><div class="pr">${p.ask?"<b>Price on request</b>":`<small>From</small> <b>${taka(entry(p).p)}</b> <small>/ ${entry(p).u||(entry(p).once?"lifetime":UNIT[entry(p).m])}</small>`}</div><button class="go" aria-label="Open ${p.name} page">→</button></div></div>`;
const bcard=(p,i)=>`<div class="card bd" onclick="openSvc(${i})">
  <div class="bl2"><span class="sv">Save up to ${taka(Math.max(...p.packs.map(k=>k.old-k.p)))} / month</span>
  <div class="stk">${PARTS[p.name].map(s=>tile(s,`<span class="lg" style="background:#1E2545">${s[0].toUpperCase()}</span>`)).join("")}</div>
  <h3>${p.name}</h3><ul class="inc">${p.desc.split(" + ").map(x=>`<li>${x}</li>`).join("")}<li>${p.packs.length} packs: shared or private Netflix profile</li><li>Packs 3 and 4 add TV access</li></ul></div>
  <div class="br"><div class="pr"><small>From</small> <b>${taka(entry(p).p)}</b> <small>/ month</small> <s>${taka(p.packs[0].old)}</s></div>
  <div class="pks">${p.packs.map(k=>`<span class="pk">${k.n} <b>${taka(k.p)}</b></span>`).join("")}</div>
  <button class="btn grad-bg">View ${p.packs.length} packs →</button></div></div>`;
function endCard(){const g=$("#productGrid");if(limit>=view.length&&view.length>PAGE&&!g.querySelector(".pr-endc"))g.insertAdjacentHTML("beforeend",`<a class="pr-endc" href="/services/"><b>See everything</b><span>All services with full details</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg></a>`)}
function renderProducts(){
  view=PRODUCTS.map((p,i)=>[p,i]).filter(([p])=>p.cat!=="Bundle"&&(cat==="All"||p.cat===cat)&&(p.name+" "+p.variants.map(v=>v.n).join(" ")).toLowerCase().includes(q)).sort(SORTS[sortKey]);
  const g=$("#productGrid");loading=false;g.scrollLeft=0;
  g.innerHTML=view.slice(0,limit).map(([p,i],n)=>card(p,i,n%8*60)).join("")||'<p class="empty">No product found.</p>';
  syncMore();endCard();setTimeout(railSync,50);
}
function syncMore(){}
// Horizontal row: near the end a loading card shows, then the next products are added (no button).
let loading=false;
function moreCards(){
  if(loading||limit>=view.length)return;loading=true;const g=$("#productGrid");
  g.insertAdjacentHTML("beforeend",'<div class="pr-ldc" role="status" aria-label="Loading more services"><i class="tp-spin"></i><span>Loading more…</span></div>');
  setTimeout(()=>{
    if(!loading)return;const l=g.querySelector(".pr-ldc");if(l)l.remove();
    const from=limit;limit=Math.min(view.length,limit+MORE);
    g.insertAdjacentHTML("beforeend",view.slice(from,limit).map(([p,i],n)=>card(p,i,n%8*60)).join(""));
    syncMore();endCard();loading=false;railSync();
  },650);
}
const rail=document.createElement("div");rail.className="pr-rail";
{const g=$("#productGrid");g.parentNode.insertBefore(rail,g);rail.appendChild(g)}
function railSync(){const g=$("#productGrid"),bs=document.querySelectorAll("#prArr button");if(bs.length){bs[0].disabled=g.scrollLeft<4;bs[1].disabled=g.scrollLeft+g.clientWidth>=g.scrollWidth-4&&limit>=view.length}if(!loading&&limit<view.length&&g.scrollLeft+g.clientWidth>=g.scrollWidth-500)moreCards()}
$("#productGrid").addEventListener("scroll",railSync,{passive:true});addEventListener("resize",railSync);
// 18+ category: adults-only confirmation (remembered for this visit)
let ageOK=false,agCb=null;try{ageOK=sessionStorage.getItem("sx_18")==="1"}catch(e){}
function askAge(cb){if(ageOK){cb();return}agCb=cb;$("#agate").classList.add("show")}
$("#agYes").onclick=()=>{ageOK=true;try{sessionStorage.setItem("sx_18","1")}catch(e){}$("#agate").classList.remove("show");const f=agCb;agCb=null;f&&f()};
$("#agNo").onclick=()=>{agCb=null;$("#agate").classList.remove("show")};
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#agate").classList.remove("show")});
function setCat(c){cat=c;limit=PAGE;document.querySelectorAll("#chips button").forEach(b=>b.classList.toggle("on",b.dataset.c===c));renderProducts()}
$("#chips").innerHTML=["All",...CATS].map(c=>`<button class="${c===cat?"on":""}" data-c="${c}">${c}</button>`).join("");
$("#chips").onclick=e=>{const c=e.target.dataset.c;if(!c)return;if(c==="18+"&&!ageOK)askAge(()=>setCat("18+"));else setCat(c)};
$("#sortBy").onchange=e=>{sortKey=e.target.value;limit=PAGE;renderProducts()};
$("#search").oninput=e=>{q=e.target.value.toLowerCase().trim();limit=PAGE;renderProducts()};
renderProducts();
$("#bundleGrid").innerHTML=PRODUCTS.map((p,i)=>p.cat==="Bundle"?bcard(p,i):"").join("");
mq.onchange=()=>{limit=PAGE;renderProducts()};

/* Previous / next arrows (same as the Explore page) */
$("#prArr").addEventListener("click",e=>{const b=e.target.closest("button[data-dir]");if(!b)return;const g=$("#productGrid");g.scrollBy({left:(+b.dataset.dir)*Math.max(240,g.clientWidth*.8),behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})});
