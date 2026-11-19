/* Share a plan: share sheet or copy link. */
// ===== Share a plan: phone share sheet, or copy link. The link opens that plan. =====
function planLink(i,v,k){const n=PRODUCTS[i].name;return PRODUCTS[i].cat==="18+"?location.href.split("#")[0]+"#plan="+slug(n)+"&v="+v+"&k="+k:location.origin+"/services/"+slug(n)+"/"}
// The service card image (the same 1200x630 picture used for link previews) is attached to the share when the phone supports sharing files.
const SHIMG={};
function shareImgUrl(p){return p.cat==="18+"?null:"/assets/img/og/"+slug(p.name)+".jpg"}
function warmShareImg(i){const p=PRODUCTS[i],u=shareImgUrl(p);if(!u||SHIMG[u]!==undefined)return;SHIMG[u]=fetch(u).then(r=>r.ok?r.blob():null).then(b=>b?new File([b],slug(p.name)+".jpg",{type:"image/jpeg"}):null).catch(()=>null)}
function sharePlan(i,v,k){
  const p=PRODUCTS[i],vr=p.variants[v],pl=vr.plans[k],url=planLink(i,v,k),btn=document.querySelectorAll("#planTable .pshare")[k];
  const text=`${p.name}${p.variants.length>1?" – "+vr.n:""} · ${pl.v} · ${taka(pl.p)}${p.packs?" / month":""} on StreamX. Prices are fixed. See the plan here:`;
  const ok=()=>{if(!btn)return;btn.classList.add("done");btn.innerHTML=CHECK;setTimeout(()=>{btn.classList.remove("done");btn.innerHTML=SHARE},1800)};
  if(navigator.share){
    const title="StreamX · "+p.name,iu=shareImgUrl(p);warmShareImg(i);
    const img=iu?Promise.race([SHIMG[iu],new Promise(r=>setTimeout(()=>r(null),1200))]):Promise.resolve(null);
    img.then(f=>{
      const withFile=f&&navigator.canShare&&navigator.canShare({files:[f]});
      return navigator.share(withFile?{files:[f],title,text:text+" "+url}:{title,text,url});
    }).then(ok).catch(e=>{if(e&&e.name==="AbortError")return;navigator.share({title:"StreamX · "+p.name,text,url}).then(ok).catch(()=>{})});
    return}
  const full=text+" "+url,done=()=>{toast("Link copied. Paste it anywhere to share.");ok()};
  (navigator.clipboard?navigator.clipboard.writeText(full):Promise.reject()).then(done).catch(()=>{const t=document.createElement("textarea");t.value=full;document.body.appendChild(t);t.select();try{document.execCommand("copy");done()}catch(e){toast("Could not copy the link.")}t.remove()});
}
