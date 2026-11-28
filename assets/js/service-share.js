/* Share button on service pages: phone share sheet (with the service card image when supported), else copy link. */
(function(){
  var b=document.querySelectorAll(".sp-share");if(!b.length)return;
  function toast(m){var t=document.createElement("div");t.className="sp-toast";t.textContent=m;document.body.appendChild(t);requestAnimationFrame(function(){t.classList.add("on")});setTimeout(function(){t.classList.remove("on");setTimeout(function(){t.remove()},300)},2200)}
  var cache={};
  /* Desktop: the card share icon opens a small menu (WhatsApp, Facebook, Telegram, Copy link). Phones keep the native share sheet. */
  var fine=window.matchMedia&&matchMedia("(hover:hover) and (pointer:fine)").matches,openM=null;
  var IC={wa:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.4 2 2 3.6 4 4.2l1.2-1.1 1.6.8c-.3 1.1-1.2 1.6-2.3 1.5-2.7-.4-5-2.7-5.4-5.4-.1-1.1.5-2 1.5-2.3l.8 1.6z"/></svg>',fb:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h2.5V4.5H14C11.8 4.5 10.5 6 10.5 8.2V10H8v3.5h2.5V21H14v-7.5h2.4l.6-3.5H14V8.6c0-.4.2-.6.6-.6z"/></svg>',tg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4 3 11l6 2.2L11 20l3-4.2 4.5 3.4z"/><path d="m9 13.2 9-7"/></svg>',cp:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'};
  function closeM(){if(openM){openM.classList.remove("on");var m=openM;openM=null;setTimeout(function(){m.remove()},180)}}
  document.addEventListener("click",function(e){if(openM&&!e.target.closest(".nfp-menu")&&!e.target.closest(".nfp-sh"))closeM()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeM()});
  function menu(el){
    var wasOpen=openM&&openM.parentNode===el.parentNode;closeM();if(wasOpen)return;
    var url=location.origin+location.pathname+(el.getAttribute("data-url")||""),text=el.getAttribute("data-text"),enc=encodeURIComponent;
    var m=document.createElement("div");m.className="nfp-menu";m.setAttribute("role","menu");
    m.innerHTML='<a role="menuitem" target="_blank" rel="noopener" href="https://wa.me/?text='+enc(text+" "+url)+'">'+IC.wa+'WhatsApp</a>'+
      '<a role="menuitem" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u='+enc(url)+'">'+IC.fb+'Facebook</a>'+
      '<a role="menuitem" target="_blank" rel="noopener" href="https://t.me/share/url?url='+enc(url)+'&text='+enc(text)+'">'+IC.tg+'Telegram</a>'+
      '<button type="button" role="menuitem" class="nfp-mc">'+IC.cp+'<span>Copy link</span></button>';
    el.parentNode.appendChild(m);requestAnimationFrame(function(){m.classList.add("on")});openM=m;
    var cb=m.querySelector(".nfp-mc");
    cb.addEventListener("click",function(){
      var full=text+" "+url;
      var ok=function(){cb.classList.add("ok");cb.innerHTML=IC.ok+"<span>Copied</span>";el.classList.add("ok");el.innerHTML=IC.ok;setTimeout(function(){el.classList.remove("ok");el.innerHTML=SH;closeM()},1400)};
      (navigator.clipboard?navigator.clipboard.writeText(full):Promise.reject()).then(ok).catch(function(){var x=document.createElement("textarea");x.value=full;document.body.appendChild(x);x.select();try{document.execCommand("copy");ok()}catch(e){}x.remove()});
    });
    m.addEventListener("click",function(e){if(e.target.closest("a"))setTimeout(closeM,150)});
  }
  var SH='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>';
  function img(u){if(!u)return Promise.resolve(null);if(!cache[u])cache[u]=fetch(u).then(function(r){return r.ok?r.blob():null}).then(function(x){return x?new File([x],u.split("/").pop(),{type:"image/jpeg"}):null}).catch(function(){return null});return cache[u]}
  b.forEach(function(el){
    var u=el.getAttribute("data-img");if(u)img(u);
    el.addEventListener("click",function(){
      if(fine&&el.classList.contains("nfp-sh")){menu(el);return}
      var url=location.origin+location.pathname+(el.getAttribute("data-url")||""),name=el.getAttribute("data-name"),text=el.getAttribute("data-text"),title="StreamX · "+name;
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
