/* Why StreamX: interactive list and animated panel. */
// ===== Why StreamX (interactive list + animated panel) =====
$("#whyList").innerHTML=WHY.map((d,k)=>`<div class="wi" style="--k:${k}" data-k="${k}"><div class="wic">${ic(d[0])}</div><div><h3>${d[1]}</h3><p>${d[2]}</p></div><span class="wn">0${k+1}</span></div>`).join("");
let wi=-1,wt,paused=false;
function setWhy(i){
  if(i===wi)return;wi=i;const d=WHY[i];
  $("#wc").textContent=`0${i+1}—0${WHY.length}`;$("#wg").innerHTML=ic(d[0]);$("#wh").textContent=d[3];$("#wd").textContent=d[4];
  document.querySelectorAll(".wi").forEach((e,k)=>e.classList.toggle("on",k===i));
  const p=$("#whyPanel");p.classList.remove("sw");void p.offsetWidth;p.classList.add("sw");
  clearTimeout(wt);wt=setTimeout(function tick(){paused?wt=setTimeout(tick,1000):setWhy((wi+1)%WHY.length)},4500);
}
$("#whyList").onmouseover=$("#whyList").onclick=e=>{const r=e.target.closest(".wi");if(r)setWhy(+r.dataset.k)};
$(".why").onmouseenter=()=>paused=true;$(".why").onmouseleave=()=>paused=false;
setWhy(0);
