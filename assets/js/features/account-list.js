/* Account page: summary stats, tabs, and "My list" (Wishlist / Watched). Needs window.sxList and window.sxSheet. */
(function(){
  const $=s=>document.querySelector(s);
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  /* ---- tabs ---- */
  const tabs=$("#tabs");
  function go(name,push){
    if(!tabs)return;
    tabs.querySelectorAll("button").forEach(b=>{const on=b.dataset.tab===name;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
    ["subs","list","orders"].forEach(n=>{const el=$("#pn-"+n);if(el)el.hidden=n!==name});
    if(push)try{history.replaceState(null,"",name==="subs"?location.pathname:"#"+(name==="list"?"mylist":name))}catch(e){}
  }
  if(tabs){
    tabs.addEventListener("click",e=>{const b=e.target.closest("button");if(b)go(b.dataset.tab,true)});
    const fromHash=()=>{const h=location.hash;if(/mylist|list/.test(h))go("list");else if(/orders/.test(h))go("orders")};
    fromHash();addEventListener("hashchange",fromHash);
  }
  /* ---- stats from the account data ---- */
  document.addEventListener("ac:data",e=>{
    const d=e.detail||{};$("#stA").textContent=d.live||0;
    const n=$("#stN"),l=$("#stNl");
    if(d.next==null){n.textContent="–";l.textContent="Next expiry"}else{n.textContent=d.next;l.textContent=d.next===1?"Day until expiry":"Days until expiry"}
    const hi=$("#hist");if(hi){const no=$("#noord");const sync=()=>{if(no)no.hidden=!hi.hidden};sync();new MutationObserver(sync).observe(hi,{attributes:true,attributeFilter:["hidden"]})}
  });
  /* ---- my list ---- */
  const box=$("#mylist");if(!box||!window.sxList)return;
  const grid=box.querySelector(".ml-grid"),lt=box.querySelector(".ml-tabs"),lk=box.querySelector(".ml-kind");
  let tab="wish",kind="";
  function paint(){
    const all=sxList.all(),w=all.filter(x=>x.s==="wish"),s=all.filter(x=>x.s==="watched");
    lt.querySelector('[data-t="wish"] i').textContent=w.length;lt.querySelector('[data-t="watched"] i').textContent=s.length;
    $("#stW").textContent=w.length;$("#stV").textContent=s.length;
    let rows=(tab==="wish"?w:s);if(kind)rows=rows.filter(x=>x.k===kind);
    if(!rows.length){grid.innerHTML=`<div class="ml-empty"><b>${tab==="wish"?"Your wishlist is empty":"Nothing marked as watched yet"}</b>${kind?"Nothing here for this filter.":`Browse the <a href="/top/">Top 250</a> and tap the ${tab==="wish"?"bookmark":"tick"} on any poster.`}</div>`;return}
    grid.innerHTML=rows.map(x=>`<div class="ml-it" data-id="${x.id}" data-k="${x.k}"><button type="button" class="ml-p" aria-label="${esc(x.t)}: details">${x.p?`<img src="https://image.tmdb.org/t/p/w342${esc(x.p)}" alt="" loading="lazy" width="342" height="513">`:`<span class="ml-ph">${esc((x.t||"?")[0])}</span>`}<em>${x.k==="tv"?"Series":"Movie"}</em></button><div class="ml-q"><button type="button" data-q="move" title="${tab==="wish"?"Mark as watched":"Move back to wishlist"}" aria-label="${tab==="wish"?"Mark as watched":"Move back to wishlist"}">${tab==="wish"?'<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>':'<svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>'}</button><button type="button" data-q="rm" title="Remove" aria-label="Remove from list"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><b>${esc(x.t)}</b><small>${[x.y,x.v?"★ "+Number(x.v).toFixed(1):""].filter(Boolean).join(" · ")}</small></div>`).join("");
  }
  lt.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;tab=b.dataset.t;lt.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));paint()});
  lk.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;kind=b.dataset.k;lk.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));paint()});
  document.addEventListener("click",e=>{const g=e.target.closest(".ac-stat[data-go]");if(!g)return;tab=g.dataset.t;lt.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x.dataset.t===tab));go("list",true);paint()});
  grid.addEventListener("click",e=>{
    const it=e.target.closest(".ml-it");if(!it)return;
    const x=sxList.get&&sxList.all().find(y=>String(y.id)===it.dataset.id&&y.k===it.dataset.k);if(!x)return;
    const q=e.target.closest("[data-q]");
    if(q){sxList.toggle(x,q.dataset.q==="rm"?x.s:(x.s==="wish"?"watched":"wish"));return}
    if(e.target.closest(".ml-p")&&window.sxSheet)sxSheet.open(it.dataset.id,it.dataset.k,e.target.closest(".ml-p"));
  });
  sxList.onChange(paint);
  sxList.load().then(paint);paint();
})();
