/* Share a plan: share sheet or copy link. */
// ===== Share a plan: phone share sheet, or copy link. The link opens that plan. =====
function planLink(i,v,k){const n=PRODUCTS[i].name;return PRODUCTS[i].cat==="18+"?location.href.split("#")[0]+"#plan="+slug(n)+"&v="+v+"&k="+k:location.origin+"/services/"+slug(n)+"/"}
function sharePlan(i,v,k){
  const p=PRODUCTS[i],vr=p.variants[v],pl=vr.plans[k],url=planLink(i,v,k),btn=document.querySelectorAll("#planTable .pshare")[k];
  const text=`${p.name}${p.variants.length>1?" – "+vr.n:""} · ${pl.v} · ${taka(pl.p)}${p.packs?" / month":""} on StreamX. Prices are fixed. See the plan here:`;
  const ok=()=>{if(!btn)return;btn.classList.add("done");btn.innerHTML=CHECK;setTimeout(()=>{btn.classList.remove("done");btn.innerHTML=SHARE},1800)};
  if(navigator.share){navigator.share({title:"StreamX · "+p.name,text,url}).then(ok).catch(()=>{});return}
  const full=text+" "+url,done=()=>{toast("Link copied. Paste it anywhere to share.");ok()};
  (navigator.clipboard?navigator.clipboard.writeText(full):Promise.reject()).then(done).catch(()=>{const t=document.createElement("textarea");t.value=full;document.body.appendChild(t);t.select();try{document.execCommand("copy");done()}catch(e){toast("Could not copy the link.")}t.remove()});
}
