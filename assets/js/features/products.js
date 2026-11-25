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
const catSel=$("#catBy"),catN=c=>PRODUCTS.filter(p=>p.cat!=="Bundle"&&(c==="All"||p.cat===c)).length;
catSel.innerHTML=["All",...CATS].map(c=>`<option value="${c}">${c==="All"?"All":c} (${catN(c)})</option>`).join("");catSel.value=cat;
function setCat(c){cat=c;limit=PAGE;catSel.value=c;catSel._sync&&catSel._sync();renderProducts()}
catSel.onchange=()=>{const c=catSel.value;if(c==="18+"&&!ageOK){catSel.value=cat;catSel._sync&&catSel._sync();askAge(()=>setCat("18+"))}else setCat(c)};
$("#sortBy").onchange=e=>{sortKey=e.target.value;limit=PAGE;renderProducts()};
$("#search").oninput=e=>{q=e.target.value.toLowerCase().trim();limit=PAGE;renderProducts()};
renderProducts();
$("#bundleGrid").innerHTML=PRODUCTS.map((p,i)=>p.cat==="Bundle"?bcard(p,i):"").join("");
mq.onchange=()=>{limit=PAGE;renderProducts()};

/* Previous / next arrows (same as the Explore page) */
$("#prArr").addEventListener("click",e=>{const b=e.target.closest("button[data-dir]");if(!b)return;const g=$("#productGrid");g.scrollBy({left:(+b.dataset.dir)*Math.max(240,g.clientWidth*.8),behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})});

/* Desktop (mouse): a dark dropdown that matches the site. Phones and tablets keep the native picker, which is the better touch experience. */
function enhanceSelect(sel){
  if(!matchMedia("(hover:hover) and (pointer:fine)").matches)return;
  const box=sel.parentNode,btn=document.createElement("button"),list=document.createElement("ul");
  btn.type="button";btn.className="dd-b";btn.setAttribute("aria-haspopup","listbox");btn.setAttribute("aria-expanded","false");btn.setAttribute("aria-label",sel.getAttribute("aria-label")||"");
  list.className="dd-l";list.setAttribute("role","listbox");list.hidden=true;
  sel.classList.add("dd-native");sel.tabIndex=-1;sel.setAttribute("aria-hidden","true");box.append(btn,list);
  let hi=-1;
  const opts=()=>[...sel.options];
  const sync=()=>{const o=sel.selectedOptions[0];btn.textContent=o?o.text:"";[...list.children].forEach((li,i)=>{const on=i===sel.selectedIndex;li.classList.toggle("on",on);li.setAttribute("aria-selected",on)})};
  list.innerHTML=opts().map((o,i)=>`<li role="option" data-i="${i}">${o.text}</li>`).join("");
  const mark=i=>{hi=i;[...list.children].forEach((li,k)=>li.classList.toggle("hi",k===i));const li=list.children[i];if(li)li.scrollIntoView({block:"nearest"})};
  const open=()=>{list.hidden=false;btn.setAttribute("aria-expanded","true");mark(sel.selectedIndex)};
  const close=()=>{list.hidden=true;btn.setAttribute("aria-expanded","false")};
  const pick=i=>{close();if(i<0||i===sel.selectedIndex){btn.focus();return}sel.selectedIndex=i;sync();sel.dispatchEvent(new Event("change",{bubbles:true}));sync();btn.focus()};
  btn.onclick=()=>list.hidden?open():close();
  list.onclick=e=>{const li=e.target.closest("li");if(li)pick(+li.dataset.i)};
  btn.onkeydown=e=>{
    if(list.hidden){if(["ArrowDown","ArrowUp","Enter"," "].includes(e.key)){e.preventDefault();open()}return}
    if(e.key==="Escape"){e.preventDefault();close()}
    else if(e.key==="ArrowDown"){e.preventDefault();mark(Math.min(opts().length-1,hi+1))}
    else if(e.key==="ArrowUp"){e.preventDefault();mark(Math.max(0,hi-1))}
    else if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(hi)}
    else if(e.key==="Tab")close();
  };
  document.addEventListener("pointerdown",e=>{if(!list.hidden&&!box.contains(e.target))close()});
  sel._sync=sync;sync();
}
enhanceSelect(catSel);enhanceSelect($("#sortBy"));
