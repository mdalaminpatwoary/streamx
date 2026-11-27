/* Navbar search: icon opens a box that jumps straight to a service page. Works on home + service pages. */
(function(){
  if(window.__sxSearch)return;window.__sxSearch=1;
  var home=document.querySelector(".nr"),svc=document.querySelector(".sp-nr");
  var host=home||svc;if(!host)return;
  var before=home?document.getElementById("cartBtn"):document.getElementById("spCart");
  var SVG='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var b=document.createElement("button");b.type="button";b.id="sxSrchBtn";b.setAttribute("aria-label","Search services");b.title="Search";
  b.className=home?"cartbtn sx-sb":"sp-acct sx-sb";b.innerHTML=SVG;
  host.insertBefore(b,before||host.firstChild);
  var st=document.createElement("style");st.textContent=
   ".sx-sb{cursor:pointer;display:grid;place-items:center;padding:0}"+
   "@media(max-width:640px){html.sx-tb-on .sx-sb{display:none!important}}"+
   ".sxs-ov{position:fixed;inset:0;z-index:2147483000;display:none;align-items:flex-start;justify-content:center;padding:max(72px,env(safe-area-inset-top,0px)) 14px 14px;background:rgba(5,7,16,.45);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}"+
   ".sxs-ov.on{display:flex}"+
   ".sxs{width:min(560px,100%);max-height:min(560px,calc(100dvh - 100px));display:flex;flex-direction:column;position:relative;isolation:isolate;border-radius:22px;background:rgba(10,13,28,.6);-webkit-backdrop-filter:blur(26px) saturate(1.5);backdrop-filter:blur(26px) saturate(1.5);border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 80px rgba(0,0,0,.5);overflow:hidden;animation:sxsIn .28s cubic-bezier(.2,.9,.3,1.1)}"+
   ".sxs::before{content:\"\";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(420px circle at 100% 0%,rgba(79,107,255,.28),transparent 60%),radial-gradient(380px circle at 0% 100%,rgba(237,49,36,.2),transparent 60%)}"+
   "@keyframes sxsIn{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}"+
   ".sxs-h{display:flex;align-items:center;gap:10px;margin:14px 14px 6px;padding:12px 14px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.05);color:#aab4da}"+
   ".sxs-h input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font-weight:600;font-size:16px;line-height:1.2;font-family:inherit}"+
   ".sxs-h input::placeholder{color:#7f89ab}.sxs-h input::-webkit-search-cancel-button{-webkit-appearance:none;display:none}"+
   ".sxs-x{flex:none;border:0;background:rgba(255,255,255,.07);color:#cfd6ee;border-radius:99px;padding:6px 11px;font-weight:600;font-size:12px;font-family:inherit;cursor:pointer}"+
   ".sxs-l{overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:2px}"+
   ".sxs-i{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:14px;color:#e4e8f7;text-decoration:none}"+
   ".sxs-i.on,.sxs-i:hover{background:linear-gradient(90deg,rgba(79,107,255,.24),rgba(237,49,36,.18));box-shadow:inset 0 0 0 1px rgba(237,49,36,.3)}"+
   ".sxs-t{flex:none;position:relative;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:#fff;font-weight:800;overflow:hidden}"+
   ".sxs-t img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:inherit}"+
   ".sxs-n{font-weight:700;font-size:15px;line-height:1.2}.sxs-c{font-size:12px;color:#8f99bb;margin-top:2px}"+
   ".sxs-e{padding:26px 16px;text-align:center;color:#8f99bb;font-size:14px}";
  document.head.appendChild(st);
  var ov=document.createElement("div");ov.className="sxs-ov";ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Search services");
  ov.innerHTML='<div class="sxs"><div class="sxs-h">'+SVG+'<input type="search" id="sxsQ" placeholder="Search Netflix, Spotify, ChatGPT…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"><button type="button" class="sxs-x">Close</button></div><div class="sxs-l" id="sxsL"></div></div>';
  document.body.appendChild(ov);
  var q=ov.querySelector("#sxsQ"),L=ov.querySelector("#sxsL"),cur=0,rows=[];
  var sl=function(n){return typeof slug==="function"?slug(n):n.toLowerCase().replace(/\+/g,"plus").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")};
  var norm=function(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g," ").trim()};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
  function list(){return(typeof PRODUCTS!=="undefined"?PRODUCTS:[]).filter(function(p){return p.cat!=="18+"})}
  function render(){
    var t=norm(q.value),all=list(),out;
    if(!t)out=all.slice(0,8);
    else{out=all.map(function(p){var n=norm(p.name),c=norm(p.cat||""),s=n.indexOf(t)===0?0:n.indexOf(" "+t)>-1?1:n.indexOf(t)>-1?2:c.indexOf(t)>-1?3:-1;return{p:p,s:s}}).filter(function(x){return x.s>=0}).sort(function(a,b){return a.s-b.s}).map(function(x){return x.p}).slice(0,8)}
    rows=out;cur=0;
    L.innerHTML=out.length?out.map(function(p,i){var s=sl(p.name);return'<a class="sxs-i'+(i?'':' on')+'" href="/services/'+s+'/"><span class="sxs-t" style="background:'+esc(p.color||"#333")+'">'+esc(p.icon||p.name[0])+'<img src="/assets/img/logos/'+s+'.svg" alt="" loading="lazy" onerror="if(!this.dataset.t){this.dataset.t=1;this.src=this.src.replace(/\\.svg$/,\'.png\')}else this.remove()"></span><span><div class="sxs-n">'+esc(p.name)+'</div><div class="sxs-c">'+esc(p.cat||"")+'</div></span></a>'}).join(""):'<div class="sxs-e">No service found for “'+esc(q.value)+'”</div>';
  }
  function mark(){var a=L.querySelectorAll(".sxs-i");a.forEach(function(e,i){e.classList.toggle("on",i===cur)});if(a[cur])a[cur].scrollIntoView({block:"nearest"})}
  function open(){ov.classList.add("on");q.value="";render();setTimeout(function(){q.focus()},30)}
  function close(){ov.classList.remove("on");q.blur()}
  b.addEventListener("click",open);
  ov.addEventListener("click",function(e){if(e.target===ov||e.target.closest(".sxs-x"))close()});
  q.addEventListener("input",render);
  q.addEventListener("keydown",function(e){
    if(e.key==="ArrowDown"){e.preventDefault();cur=Math.min(cur+1,rows.length-1);mark()}
    else if(e.key==="ArrowUp"){e.preventDefault();cur=Math.max(cur-1,0);mark()}
    else if(e.key==="Enter"&&rows[cur]){e.preventDefault();location.href="/services/"+sl(rows[cur].name)+"/"}
  });
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"&&ov.classList.contains("on"))close();
    else if(e.key==="/"&&!ov.classList.contains("on")&&!/input|textarea|select/i.test((document.activeElement||{}).tagName||"")){e.preventDefault();open()}
  });
})();
