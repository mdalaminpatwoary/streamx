/* Wishlist and Watched. Needs a signed-in customer (same session as My account). Exposes window.sxList. */
(function(){
  var K="sx_session",items={},subs=[],loading=null,toastT;
  var key=function(k,id){return k+":"+id};
  var tok=function(){try{return localStorage.getItem(K)||""}catch(e){return""}};
  var authed=function(){return !!tok()};
  function api(method,body){
    return fetch("/api/account?a=list",{method:method,headers:{Authorization:"Bearer "+tok(),"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined})
      .then(function(r){if(r.status===401){var e=new Error("auth");e.auth=true;throw e}return r.ok?r.json():Promise.reject(new Error("HTTP "+r.status))});
  }
  function emit(){subs.forEach(function(f){try{f()}catch(e){}})}
  function toast(msg){
    var t=document.getElementById("sxToast");
    if(!t){t=document.createElement("div");t.id="sxToast";t.className="sx-toast";t.setAttribute("role","status");document.body.appendChild(t)}
    t.textContent=msg;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove("on")},2600);
  }
  function nudge(why){
    var d=document.getElementById("sxNudge");
    if(!d){
      d=document.createElement("div");d.id="sxNudge";d.className="sx-nudge";d.hidden=true;d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-labelledby","sxNudgeT");
      d.innerHTML='<div class="sx-nudge-bg" data-x></div><div class="sx-nudge-box"><div class="sx-nudge-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg></div><h3 id="sxNudgeT">Sign in to save titles</h3><p id="sxNudgeP"></p><div class="sx-nudge-act"><a class="ts-btn pri" href="/account/">Sign in</a><button class="ts-btn" type="button" data-x>Not now</button></div></div>';
      document.body.appendChild(d);if(window.sxSwipe)sxSwipe(d.querySelector(".sx-nudge-box"),{bg:d.querySelector(".sx-nudge-bg"),close:function(){d.hidden=true}});
      d.addEventListener("click",function(e){if(e.target.closest("[data-x]"))d.hidden=true});
      document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!d.hidden)d.hidden=true});
    }
    d.querySelector("#sxNudgeP").textContent=why||"Sign in to keep a wishlist and track what you have watched. It only takes a few seconds, and your lists follow you on every device.";
    d.hidden=false;var b=d.querySelector("a");if(b)b.focus();
  }
  function load(){
    if(!authed())return Promise.resolve();
    if(loading)return loading;
    loading=api("GET").then(function(d){items={};(d.items||[]).forEach(function(i){items[key(i.k,i.id)]=i});emit()}).catch(function(e){if(e&&e.auth)try{localStorage.removeItem("sx_session")}catch(x){}}).then(function(){});
    return loading;
  }
  function get(k,id){var i=items[key(k,id)];return i?i.s:""}
  function set(t,s){
    if(!authed()){nudge(s==="watched"?"Sign in to mark titles as watched and keep track of what you have seen.":"Sign in to add titles to your wishlist. It only takes a few seconds.");return Promise.resolve(false)}
    var kk=key(t.k,t.id),prev=items[kk];
    if(s)items[kk]={k:t.k,id:+t.id,s:s,t:t.t||"",p:t.p||"",y:t.y||"",v:t.v||0,at:new Date().toISOString()};else delete items[kk];
    emit();
    return api("POST",{k:t.k,id:t.id,s:s,t:t.t,p:t.p,y:t.y,v:t.v}).then(function(){
      toast(s==="wish"?"Added to your wishlist":s==="watched"?"Marked as watched":"Removed from your lists");return true;
    }).catch(function(e){
      if(prev)items[kk]=prev;else delete items[kk];emit();
      if(e&&e.auth){try{localStorage.removeItem("sx_session")}catch(x){}nudge("Your session has ended. Please sign in again to use your lists.")}else toast("Couldn't save that right now. Please try again.");
      return false;
    });
  }
  window.sxList={authed:authed,load:load,get:get,set:set,toggle:function(t,s){return set(t,get(t.k,t.id)===s?"":s)},all:function(){return Object.keys(items).map(function(x){return items[x]})},onChange:function(f){subs.push(f)},toast:toast,nudge:nudge};
  load();
})();
