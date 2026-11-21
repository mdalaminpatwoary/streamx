/* Account page: "My list" (Wishlist / Watched). Needs window.sxList and window.sxSheet. */
(function(){
  const box=document.getElementById("mylist");if(!box||!window.sxList)return;
  const grid=box.querySelector(".ml-grid"),tabs=box.querySelector(".ml-tabs"),cnt=box.querySelector("small");
  let tab="wish";
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function paint(){
    const all=sxList.all(),w=all.filter(x=>x.s==="wish"),s=all.filter(x=>x.s==="watched");
    tabs.querySelector('[data-t="wish"] i').textContent=w.length;tabs.querySelector('[data-t="watched"] i').textContent=s.length;
    cnt.textContent=all.length?"":"";
    const rows=tab==="wish"?w:s;
    if(!rows.length){grid.innerHTML=`<div class="ml-empty"><b>${tab==="wish"?"Your wishlist is empty":"Nothing marked as watched yet"}</b>Browse the <a href="/top/">Top 250</a> and tap the ${tab==="wish"?"bookmark":"tick"} on any poster.</div>`;return}
    grid.innerHTML=rows.map(x=>`<button type="button" class="ml-it" data-id="${x.id}" data-k="${x.k}"><span class="ml-p">${x.p?`<img src="https://image.tmdb.org/t/p/w185${esc(x.p)}" alt="" loading="lazy" width="185" height="278">`:""}</span><b>${esc(x.t)}</b><small>${[x.y,x.v?"★ "+Number(x.v).toFixed(1):""].filter(Boolean).join(" · ")}</small></button>`).join("");
  }
  tabs.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;tab=b.dataset.t;tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));paint()});
  grid.addEventListener("click",e=>{const b=e.target.closest(".ml-it");if(b&&window.sxSheet)sxSheet.open(b.dataset.id,b.dataset.k,b)});
  sxList.onChange(paint);
  sxList.load().then(paint);
})();
