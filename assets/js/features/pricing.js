/* Pricing: pick a product, plan type and duration. */
// Pricing: choose a product, then the plan type, then how long
$("#pickProduct").innerHTML=[...CATS,"Bundle"].map(c=>`<optgroup label="${c==="Bundle"?"Premium Bundles":c==="18+"?"18+ (adults only)":c}">`+PRODUCTS.map((p,i)=>p.cat===c?`<option value="${i}">${p.name}</option>`:"").join("")+"</optgroup>").join("");
$("#pickProduct").onchange=e=>showPlans(+e.target.value);
// Horizontal product rail: drag, arrows, keyboard, auto-centres the chosen product
(function(){
  const sc=$("#prSc"),L=$("#prL"),R=$("#prR"),box=$("#prail");
  const logo=p=>p.packs?`<span class="stk">${PARTS[p.name].map(s=>tile(s,"")).join("")}</span>`:ptile(p);
  sc.innerHTML=[...CATS,"Bundle"].map(c=>{const list=PRODUCTS.map((p,i)=>[p,i]).filter(x=>x[0].cat===c);
    return list.length?`<span class="pr-cat">${c==="Bundle"?"Bundles":c==="18+"?"18+":c}</span>`+list.map(([p,i])=>`<button type="button" role="tab" class="pkchip" data-i="${i}" aria-selected="false"><i>${logo(p)}</i><span>${p.name}</span></button>`).join(""):""}).join("");
  const edge=()=>{const m=sc.scrollWidth-sc.clientWidth;box.classList.toggle("fl",sc.scrollLeft>8);box.classList.toggle("fr",sc.scrollLeft<m-8)};
  sc.addEventListener("scroll",edge,{passive:true});addEventListener("resize",edge);
  const by=d=>sc.scrollBy({left:d*Math.max(220,sc.clientWidth*.7),behavior:"smooth"});
  L.onclick=()=>by(-1);R.onclick=()=>by(1);
  let down=false,sx=0,sl=0,moved=false;
  sc.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse")return;down=true;moved=false;sx=e.clientX;sl=sc.scrollLeft});
  addEventListener("pointermove",e=>{if(!down)return;const d=e.clientX-sx;if(Math.abs(d)>5){moved=true;sc.classList.add("drag")}sc.scrollLeft=sl-d});
  addEventListener("pointerup",()=>{down=false;sc.classList.remove("drag")});
  sc.addEventListener("click",e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;return}const b=e.target.closest(".pkchip");if(b)showPlans(+b.dataset.i)},true);
  sc.addEventListener("keydown",e=>{if(e.key!=="ArrowRight"&&e.key!=="ArrowLeft")return;const c=[...sc.querySelectorAll(".pkchip")],k=c.indexOf(document.activeElement);if(k<0)return;e.preventDefault();const n=c[Math.max(0,Math.min(c.length-1,k+(e.key==="ArrowRight"?1:-1)))];n.focus();n.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"})});
  window.markRail=i=>{sc.querySelectorAll(".pkchip").forEach(b=>{const on=+b.dataset.i===i;b.classList.toggle("on",on);b.setAttribute("aria-selected",on);if(on){const x=b.offsetLeft-sc.clientWidth/2+b.offsetWidth/2;sc.scrollTo({left:x,behavior:"smooth"})}});setTimeout(edge,350)};
  edge();
})();
let cur={i:0,v:0};
function showPlans(i,scroll,v=0){
  const p=PRODUCTS[i];
  if(p.cat==="18+"&&!ageOK){$("#pickProduct").value=cur.i;askAge(()=>showPlans(i,scroll,v));return}
  const pk=!!p.packs,multi=p.variants.length>1,vr=p.variants[v]||p.variants[0];cur={i,v};typeof warmShareImg==="function"&&warmShareImg(i);$("#pickProduct").value=i;if(window.markRail)markRail(i);
  $("#pLogo").innerHTML=pk?`<span class="stk">${PARTS[p.name].map(s=>tile(s,"")).join("")}</span>`:ptile(p);$("#pName").textContent=p.name;
  $("#pDesc").textContent=pk?"Netflix and Prime Video. Choose the pack that fits how you watch.":p.desc;if(p.cat!=="18+"||ADULT_PAGES.includes(p.name))$("#pDesc").insertAdjacentHTML("beforeend",` <a class="pmore" href="/services/${slug(p.name)}/">Full details <span aria-hidden="true">→</span></a>`);
  document.querySelector("#pricing .note").textContent=pk?"* Every price is fixed in BDT, per month. Profile type and device access differ by pack.":"* Every price is fixed in BDT. What you see here is exactly what you pay, with no hidden charges.";
  const T=$("#planTable");T.className=pk?"packs":"vlay";
  if(pk){
    T.innerHTML=p.packs.map((k,n)=>`<div class="pcard${k.hot?" best":""}" style="animation-delay:${n*90}ms"><button class="pshare" onclick="sharePlan(${i},0,${n})" aria-label="Share ${p.name} ${k.n}" title="Share this plan">${SHARE}</button>${k.tag?`<span class="tag">${k.tag}</span>`:""}
    <span class="dur">${k.n}</span><small class="sub">${k.sub}</small><div class="amt"><span class="cur">৳</span><b data-to="${k.p}">0</b></div>
    <small class="pm">per month · regular <s>${taka(k.old)}</s></small><span class="save">Save ${taka(k.old-k.p)}</span>
    <ul>${k.f.map(f=>`<li>${f}</li>`).join("")}</ul>
    <div class="actions"><button class="btn ghost" onclick="addToCart(${i},0,${n})">${BAG} Add to Cart</button>
    <button type="button" class="btn grad-bg" onclick="buyNow(${i},0,${n})">Buy Now</button></div></div>`).join("");
  }else{
    const base=vr.plans.find(x=>x.m===1),many=vr.plans.length>1,label=p.name+(multi?" – "+vr.n:"");
    const tabs=multi?`<div class="vtabs" role="tablist">${p.variants.map((x,n)=>`<button class="vtab${n===v?" on":""}" role="tab" aria-selected="${n===v}" onclick="showPlans(${i},false,${n})">${x.n}</button>`).join("")}</div>`:"";
    const info=`<div class="vinfo">${vr.tag?`<span class="vtag">${vr.tag}</span>`:""}<h3>${multi?vr.n:"Plan details"}</h3><p>${vr.line}</p><ul class="vf">${vr.f.map(x=>`<li>${x}</li>`).join("")}</ul>${vr.notes.length?`<ul class="vn">${vr.notes.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}</div>`;
    const cards=vr.plans.map((pl,k)=>{
      const pct=base&&pl.m>1?Math.round((1-pl.p/(base.p*pl.m))*100):0,best=many&&!pl.u&&k===vr.plans.length-1;
      return `<div class="pcard${best?" best":""}" style="animation-delay:${k*90}ms"><button class="pshare" onclick="sharePlan(${i},${v},${k})" aria-label="Share ${label} ${pl.v}" title="Share this plan">${SHARE}</button>${best?'<span class="tag">Best value</span>':""}
      <span class="dur">${pl.v}</span><div class="amt"><span class="cur">৳</span><b data-to="${pl.p}">0</b></div>
      <small class="pm">${pl.u?"US region · redeem code":pl.m>1?taka(Math.round(pl.p/pl.m))+" / month":"per month"}</small>
      <span class="save${pct>0||pl.u?"":" mute"}">${pl.u?`${taka(GIFT.rate(pl.gc))} per $1`:pct>0?`Save ${pct}%`:(pl.m===1?"Monthly plan":"Fixed-term plan")}</span>
      <div class="actions"><button class="btn ghost" onclick="addToCart(${i},${v},${k})">${BAG} Add to Cart</button>
      <button type="button" class="btn grad-bg" onclick="buyNow(${i},${v},${k})">Buy Now</button></div></div>`}).join("");
    const custom=p.gift?`<div class="pcard gcc"><span class="dur">Any amount</span><div class="gc-step"><button type="button" id="gcMinus" aria-label="Decrease by $5">−</button><div class="gc-val"><span>$</span><b id="gcVal">25</b></div><button type="button" id="gcPlus" aria-label="Increase by $5">+</button></div><input id="gcAmt" class="gc-range" type="range" min="${GIFT.min}" max="${GIFT.max}" step="${GIFT.step}" value="25" aria-label="Gift card amount in US dollars"><div class="gc-ends"><span>$${GIFT.min}</span><span>$${GIFT.max}</span></div><div class="amt"><span class="cur">৳</span><b id="gcPrice">0</b></div><small class="pm" id="gcNote"></small><div class="actions"><button class="btn ghost" id="gcAdd" onclick="gcGo(false)">${BAG} Add to Cart</button><button type="button" class="btn grad-bg" id="gcBuy" onclick="gcGo(true)">Buy Now</button></div></div>`:"";
    T.innerHTML=tabs+`<div class="vbody">${info}<div class="vplans">${cards}${custom}</div></div>`;
    if(p.gift)gcInit();
  }
  document.querySelectorAll("#planTable .amt b[data-to]").forEach((b,k)=>setTimeout(()=>tween(b,0,+b.dataset.to,900),k*110));
  if(scroll)$("#pricing").scrollIntoView();
}
showPlans(0);

// Apple Gift Card: custom amount (price is re-checked on the server)
function gcInit(){
  const inp=$("#gcAmt");if(!inp)return;
  const val=$("#gcVal"),note=$("#gcNote"),price=$("#gcPrice");
  const set=a=>{a=Math.min(GIFT.max,Math.max(GIFT.min,Math.round(a/GIFT.step)*GIFT.step));inp.value=a;val.textContent=a;price.textContent=(a*GIFT.rate(a)).toLocaleString("en-US");note.textContent=`${taka(GIFT.rate(a))} per $1 · US region`;inp.style.setProperty("--f",((a-GIFT.min)/(GIFT.max-GIFT.min)*100)+"%")};
  inp.oninput=()=>set(+inp.value);
  $("#gcMinus").onclick=()=>set(+inp.value-GIFT.step);$("#gcPlus").onclick=()=>set(+inp.value+GIFT.step);
  set(25);
}
function gcGo(now){
  const a=Math.floor(+$("#gcAmt").value);if(!GIFT.ok(a))return;
  const vr=PRODUCTS[cur.i].variants[cur.v];let k=vr.plans.findIndex(x=>x.gc===a),tmp=false;
  if(k<0){vr.plans.push(GC(a));k=vr.plans.length-1;tmp=true}
  now?buyNow(cur.i,cur.v,k):addToCart(cur.i,cur.v,k);
  if(tmp)vr.plans.pop();
}
