/* Explore: "My list" opens a frosted-glass drawer on the same page (Wishlist / Watched), using window.sxList. */
(function(){
  var btn=document.querySelector("a.ex-my");if(!btn||!window.sxList)return;
  var esc=function(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var d=document.createElement("div");d.className="ml";d.hidden=true;d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-label","My list");
  d.innerHTML='<div class="ml-bg" data-x></div><section class="ml-box" tabindex="-1"><div class="ml-grab" aria-hidden="true"></div><div class="ml-h"><b>My list</b><button type="button" class="ml-x" data-x aria-label="Close">&#10005;</button></div><div class="ml-tabs" role="tablist"><button type="button" role="tab" data-s="wish" class="on">Wishlist<i>0</i></button><button type="button" role="tab" data-s="watched">Watched<i>0</i></button></div><div class="ml-l" id="mlL"></div></section>';
  document.body.appendChild(d);
  var box=d.querySelector(".ml-box"),L=d.querySelector("#mlL"),tab="wish",last=null;
  function items(s){return sxList.all().filter(function(i){return i.s===s}).sort(function(a,b){return String(b.at||"").localeCompare(String(a.at||""))})}
  function paint(){
    d.querySelectorAll(".ml-tabs button").forEach(function(b){b.classList.toggle("on",b.dataset.s===tab);b.setAttribute("aria-selected",b.dataset.s===tab);b.querySelector("i").textContent=items(b.dataset.s).length});
    if(!sxList.authed()){L.innerHTML='<div class="ml-e"><b>Sign in to see your list</b>Save titles to a wishlist and track what you have watched. Your lists follow you on every device.<br><a href="/account/">Sign in</a></div>';return}
    var a=items(tab);
    if(!a.length){L.innerHTML='<div class="ml-e"><b>'+(tab==="wish"?"Your wishlist is empty":"Nothing marked as watched yet")+'</b>Open any poster and tap '+(tab==="wish"?"Wishlist":"Watched")+' to save it here.</div>';return}
    L.innerHTML=a.map(function(m){
      return '<div class="ml-i" data-k="'+esc(m.k)+'" data-id="'+esc(m.id)+'" tabindex="0" role="button" aria-label="'+esc(m.t)+': details">'+(m.p?'<img src="https://image.tmdb.org/t/p/w154'+esc(m.p)+'" alt="" width="58" height="87" loading="lazy">':'<span class="ml-ph"></span>')+
        '<div class="ml-t"><b>'+esc(m.t)+'</b><small>'+[m.y,m.v?"★ "+Number(m.v).toFixed(1):"",m.k==="tv"?"Series":"Movie"].filter(Boolean).join(" · ")+'</small><div class="ml-a">'+
        (tab==="wish"?'<button type="button" data-a="watched">Mark watched</button>':'<button type="button" data-a="wish">Back to wishlist</button>')+'<button type="button" class="rm" data-a="rm">Remove</button></div></div></div>';
    }).join("");
  }
  function open(){last=document.activeElement;d.hidden=false;document.documentElement.style.overflow="hidden";sxList.load().then(paint);paint();box.focus()}
  function close(){d.hidden=true;document.documentElement.style.overflow="";if(last&&last.focus)try{last.focus()}catch(e){}}
  btn.addEventListener("click",function(e){e.preventDefault();open()});
  d.addEventListener("click",function(e){
    if(e.target.closest("[data-x]")){close();return}
    var t=e.target.closest(".ml-tabs button");if(t){tab=t.dataset.s;paint();return}
    var row=e.target.closest(".ml-i");if(!row)return;
    var m=sxList.all().filter(function(i){return String(i.id)===row.dataset.id&&i.k===row.dataset.k})[0];
    var a=e.target.closest("[data-a]");
    if(a&&m){a.disabled=true;sxList.set(m,a.dataset.a==="rm"?"":a.dataset.a);return}
    if(window.sxSheet&&m)sxSheet.open(m.id,m.k,row,{t:m.t,p:m.p,y:m.y,v:m.v,k:m.k,id:m.id});
  });
  d.addEventListener("keydown",function(e){if((e.key==="Enter"||e.key===" ")&&e.target.matches(".ml-i")){e.preventDefault();e.target.click()}});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!d.hidden&&!document.documentElement.classList.contains("ts-open"))close()});
  sxList.onChange(function(){if(!d.hidden)paint()});
  if(window.sxSwipe)sxSwipe(box,{bg:d.querySelector(".ml-bg"),close:close});
  if(location.hash==="#list")open();
})();
