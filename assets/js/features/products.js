/* Products grid: search, sort, category filter, load more, 18+ age check. */
const mq=matchMedia("(max-width:600px)");let PAGE=mq.matches?4:8,MORE=8; // phone shows 4 first; every "Load more" adds 8
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
function renderProducts(){
  view=PRODUCTS.map((p,i)=>[p,i]).filter(([p])=>p.cat!=="Bundle"&&(cat==="All"||p.cat===cat)&&(p.name+" "+p.variants.map(v=>v.n).join(" ")).toLowerCase().includes(q)).sort(SORTS[sortKey]);
  $("#productGrid").innerHTML=view.slice(0,limit).map(([p,i],n)=>card(p,i,n%8*60)).join("")||'<p class="empty">No product found.</p>';
  syncMore();
}
function syncMore(){
  $("#count").innerHTML=`Showing ${Math.min(limit,view.length)} of ${view.length} products<div class="prog"><i style="width:${Math.min(100,limit/Math.max(view.length,1)*100)}%"></i></div>`;
  const b=$("#loadMore");b.style.display=view.length>PAGE?"":"none";
  b.textContent=limit>=view.length?"Show less ↑":`Load ${Math.min(MORE,view.length-limit)} more · ${view.length-limit} left ↓`;
}
$("#loadMore").onclick=()=>{
  if(limit>=view.length){limit=PAGE;renderProducts();$("#products").scrollIntoView();return}
  const from=limit;limit=Math.min(view.length,limit+MORE);
  $("#productGrid").insertAdjacentHTML("beforeend",view.slice(from,limit).map(([p,i],n)=>card(p,i,n%8*60)).join(""));syncMore();
};
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
mq.onchange=()=>{PAGE=mq.matches?4:8;limit=PAGE;renderProducts()};
