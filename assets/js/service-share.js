/* Share button on service pages: phone share sheet (with the service card image when supported), else copy link. */
(function(){
  var b=document.querySelectorAll(".sp-share");if(!b.length)return;
  function toast(m){var t=document.createElement("div");t.className="sp-toast";t.textContent=m;document.body.appendChild(t);requestAnimationFrame(function(){t.classList.add("on")});setTimeout(function(){t.classList.remove("on");setTimeout(function(){t.remove()},300)},2200)}
  var cache={};
  function img(u){if(!u)return Promise.resolve(null);if(!cache[u])cache[u]=fetch(u).then(function(r){return r.ok?r.blob():null}).then(function(x){return x?new File([x],u.split("/").pop(),{type:"image/jpeg"}):null}).catch(function(){return null});return cache[u]}
  b.forEach(function(el){
    var u=el.getAttribute("data-img");if(u)img(u);
    el.addEventListener("click",function(){
      var url=location.origin+location.pathname,name=el.getAttribute("data-name"),text=el.getAttribute("data-text"),title="StreamX · "+name;
      var done=function(){var l=el.querySelector("span");if(!l)return;var o=l.textContent;l.textContent="Shared";setTimeout(function(){l.textContent=o},1800)};
      var copy=function(){var full=text+" "+url;(navigator.clipboard?navigator.clipboard.writeText(full):Promise.reject()).then(function(){toast("Link copied. Paste it anywhere to share.");done()}).catch(function(){var t=document.createElement("textarea");t.value=full;document.body.appendChild(t);t.select();try{document.execCommand("copy");toast("Link copied. Paste it anywhere to share.")}catch(e){}t.remove()})};
      if(!navigator.share){copy();return}
      Promise.race([img(u),new Promise(function(r){setTimeout(function(){r(null)},1200)})]).then(function(f){
        var wf=f&&navigator.canShare&&navigator.canShare({files:[f]});
        return navigator.share(wf?{files:[f],title:title,text:text+" "+url}:{title:title,text:text,url:url});
      }).then(done).catch(function(e){if(e&&e.name==="AbortError")return;navigator.share({title:title,text:text,url:url}).then(done).catch(copy)});
    });
  });
})();
