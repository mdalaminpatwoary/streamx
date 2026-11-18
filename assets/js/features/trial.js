/* Try before you pay: choose service, plan type and duration. */
// ===== Try before you pay: customer chooses the service, plan type and duration =====
const TRY_LIST=["Netflix","Spotify","YouTube Premium","Amazon Prime Video","ChatGPT","Canva","NordVPN","Disney+"]; // quick choices (edit this list)
const TRY_SHORT={"Amazon Prime Video":"Prime Video","YouTube Premium":"YouTube"};
const tpIdx=n=>PRODUCTS.findIndex(p=>p.name===n),tp={i:Math.max(0,tpIdx(TRY_LIST[0])),v:0,k:0};
$("#tpGrid").innerHTML=TRY_LIST.map(n=>{const i=tpIdx(n);return i<0?"":`<button class="tpb" data-i="${i}" aria-pressed="false">${ptile(PRODUCTS[i])}<span>${TRY_SHORT[n]||n}</span><i class="tpk">✓</i></button>`}).join("");
$("#tpSel").innerHTML='<option value="">Or choose another service…</option>'+[...CATS.filter(c=>c!=="18+"),"Bundle"].map(c=>`<optgroup label="${c==="Bundle"?"Bundles":c}">`+PRODUCTS.map((p,i)=>p.cat===c?`<option value="${i}">${p.name}</option>`:"").join("")+"</optgroup>").join("");
function tpPick(i,v=0,k=0){tp.i=i;tp.v=v;tp.k=k;tpDraw()}
function tpDraw(){
  const p=PRODUCTS[tp.i],vr=p.variants[tp.v],pl=vr.plans[tp.k],multi=p.variants.length>1,quick=TRY_LIST.some(n=>tpIdx(n)===tp.i);
  document.querySelectorAll(".tpb").forEach(b=>{const on=+b.dataset.i===tp.i;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
  $("#tpSel").value=quick?"":tp.i;
  $("#tpPlans").innerHTML=(multi?`<div class="tp-sub">Plan type</div><div class="tp-row">${p.variants.map((x,n)=>`<button class="tpp tv${n===tp.v?" on":""}" data-v="${n}"><b>${x.n}</b></button>`).join("")}</div>`:"")+`<div class="tp-sub">Duration</div><div class="tp-row">${vr.plans.map((x,n)=>`<button class="tpp${n===tp.k?" on":""}" data-k="${n}"><b>${x.v}</b><small>${taka(x.p)}</small></button>`).join("")}</div>`;
  $("#tpSum").innerHTML=`<span class="tps">${ptile(p)}<span><b>${p.name}</b><small>${multi?vr.n+" · ":""}${pl.v}</small></span></span><span class="tpv">${taka(pl.p)}<small>Plan price</small></span>`;
  $("#tpGo").href=wa(`Hi StreamX! I'd like to try before paying: ${p.name}${multi?" – "+vr.n:""} (${pl.v}, ${taka(pl.p)}). Is this plan eligible?`);
}
$("#tryPick").addEventListener("click",e=>{const b=e.target.closest(".tpb"),t=e.target.closest(".tpp");if(b)tpPick(+b.dataset.i);else if(t&&t.dataset.v!==undefined)tpPick(tp.i,+t.dataset.v,0);else if(t)tpPick(tp.i,tp.v,+t.dataset.k)});
$("#tpSel").onchange=e=>{if(e.target.value!=="")tpPick(+e.target.value)};
document.querySelector(".try-link a").addEventListener("click",()=>{if(PRODUCTS[cur.i].cat!=="18+")tpPick(cur.i,cur.v)});
tpDraw();
