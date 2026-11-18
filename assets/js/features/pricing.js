/* Pricing: pick a product, plan type and duration. */
// Pricing: choose a product, then the plan type, then how long
$("#pickProduct").innerHTML=[...CATS,"Bundle"].map(c=>`<optgroup label="${c==="Bundle"?"Premium Bundles":c==="18+"?"18+ (adults only)":c}">`+PRODUCTS.map((p,i)=>p.cat===c?`<option value="${i}">${p.name}</option>`:"").join("")+"</optgroup>").join("");
$("#pickProduct").onchange=e=>showPlans(+e.target.value);
let cur={i:0,v:0};
function showPlans(i,scroll,v=0){
  const p=PRODUCTS[i];
  if(p.cat==="18+"&&!ageOK){$("#pickProduct").value=cur.i;askAge(()=>showPlans(i,scroll,v));return}
  const pk=!!p.packs,multi=p.variants.length>1,vr=p.variants[v]||p.variants[0];cur={i,v};$("#pickProduct").value=i;
  $("#pLogo").innerHTML=pk?`<span class="stk">${PARTS[p.name].map(s=>tile(s,"")).join("")}</span>`:ptile(p);$("#pName").textContent=p.name;
  $("#pDesc").textContent=pk?"Netflix and Prime Video. Choose the pack that fits how you watch.":p.desc;
  document.querySelector("#pricing .note").textContent=pk?"* Prices are per month. Profile type and device access differ by pack. Please confirm availability on WhatsApp before you pay.":"* Prices are in BDT and may change. Please confirm your plan and availability on WhatsApp before you pay.";
  const T=$("#planTable");T.className=pk?"packs":"vlay";
  if(pk){
    T.innerHTML=p.packs.map((k,n)=>`<div class="pcard${k.hot?" best":""}" style="animation-delay:${n*90}ms"><button class="pshare" onclick="sharePlan(${i},0,${n})" aria-label="Share ${p.name} ${k.n}" title="Share this plan">${SHARE}</button>${k.tag?`<span class="tag">${k.tag}</span>`:""}
    <span class="dur">${k.n}</span><small class="sub">${k.sub}</small><div class="amt"><span class="cur">৳</span><b data-to="${k.p}">0</b></div>
    <small class="pm">per month · regular <s>${taka(k.old)}</s></small><span class="save">Save ${taka(k.old-k.p)}</span>
    <ul>${k.f.map(f=>`<li>${f}</li>`).join("")}</ul>
    <div class="actions"><button class="btn ghost" onclick="addToCart(${i},0,${n})">${BAG} Add to Cart</button>
    <a class="btn grad-bg" target="_blank" href="${wa(`Hi StreamX! I want to buy ${p.name} (${k.n}) - ${taka(k.p)} / month.`)}">Buy Now</a></div></div>`).join("");
  }else{
    const base=vr.plans.find(x=>x.m===1),many=vr.plans.length>1,label=p.name+(multi?" – "+vr.n:"");
    const tabs=multi?`<div class="vtabs" role="tablist">${p.variants.map((x,n)=>`<button class="vtab${n===v?" on":""}" role="tab" aria-selected="${n===v}" onclick="showPlans(${i},false,${n})">${x.n}</button>`).join("")}</div>`:"";
    const info=`<div class="vinfo">${vr.tag?`<span class="vtag">${vr.tag}</span>`:""}<h3>${multi?vr.n:"Plan details"}</h3><p>${vr.line}</p><ul class="vf">${vr.f.map(x=>`<li>${x}</li>`).join("")}</ul>${vr.notes.length?`<ul class="vn">${vr.notes.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}</div>`;
    const cards=vr.plans.map((pl,k)=>{
      const pct=base&&pl.m>1?Math.round((1-pl.p/(base.p*pl.m))*100):0,best=many&&k===vr.plans.length-1;
      return `<div class="pcard${best?" best":""}" style="animation-delay:${k*90}ms"><button class="pshare" onclick="sharePlan(${i},${v},${k})" aria-label="Share ${label} ${pl.v}" title="Share this plan">${SHARE}</button>${best?'<span class="tag">Best value</span>':""}
      <span class="dur">${pl.v}</span><div class="amt"><span class="cur">৳</span><b data-to="${pl.p}">0</b></div>
      <small class="pm">${pl.m>1?taka(Math.round(pl.p/pl.m))+" / month":"per month"}</small>
      <span class="save${pct>0?"":" mute"}">${pct>0?`Save ${pct}%`:(pl.m===1?"Monthly plan":"Fixed-term plan")}</span>
      <div class="actions"><button class="btn ghost" onclick="addToCart(${i},${v},${k})">${BAG} Add to Cart</button>
      <a class="btn grad-bg" target="_blank" href="${wa(`Hi StreamX! I want to buy ${label} (${pl.v}) - ${taka(pl.p)}.`)}">Buy Now</a></div></div>`}).join("");
    T.innerHTML=tabs+`<div class="vbody">${info}<div class="vplans">${cards}</div></div>`;
  }
  document.querySelectorAll("#planTable .amt b").forEach((b,k)=>setTimeout(()=>tween(b,0,+b.dataset.to,900),k*110));
  if(scroll)$("#pricing").scrollIntoView();
}
showPlans(0);
