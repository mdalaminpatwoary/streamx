/* Title sheet: poster, rating, trailer, where to watch (StreamX services first), wishlist / watched, cast. Opens with sxSheet.open(id, kind, fromEl, hint). */
(function(){
  var esc=function(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var SHOP={netflix:"Netflix","amazon-prime-video":"Amazon Prime Video",disneyplus:"Disney+","hbo-max":"HBO Max",hulu:"Hulu",crunchyroll:"Crunchyroll",paramountplus:"Paramount+",jiohotstar:"JioHotstar",zee5:"ZEE5"};
  var NAME={"Prime Video":"Amazon Prime Video"};
  var cache={},tok=0,last=null,cur=null,hint=null;
  var dlg=document.createElement("div");dlg.className="ts";dlg.hidden=true;dlg.setAttribute("role","dialog");dlg.setAttribute("aria-modal","true");dlg.setAttribute("aria-label","Title details");
  dlg.innerHTML='<div class="ts-bg" data-x></div><div class="ts-box" tabindex="-1"><button class="ts-x" type="button" data-x aria-label="Close">&times;</button><div class="ts-in"></div></div>';
  document.body.appendChild(dlg);
  var box=dlg.querySelector(".ts-box"),inn=dlg.querySelector(".ts-in");
  var ICON={
    mark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
    check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.6 3.1 1.2-6.3L3 9.4l6.3-.8z"/></svg>',
    go:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
  };
  function logo(n){
    var key=NAME[n]||n,L=typeof LOGOS!=="undefined"&&typeof LOGO_OF!=="undefined"&&LOGOS[LOGO_OF[key]];
    return L&&L.p?'<span class="ts-lg" style="background:'+esc(L.bg)+';color:'+esc(L.fg||"#fff")+'"><svg viewBox="'+esc(L.vb)+'" aria-hidden="true"><path d="'+L.p+'"/></svg></span>':'<span class="ts-lg" style="background:#1d2347">'+esc((n||"?")[0])+'</span>';
  }
  function from(slug){
    try{var p=PRODUCTS.find(function(x){return x.name===SHOP[slug]});if(!p)return"";
      var m=Math.min.apply(null,p.variants.reduce(function(a,v){return a.concat(v.plans.map(function(x){return x.p}))},[]));
      return isFinite(m)?"from ৳"+m.toLocaleString("en-US"):""}catch(e){return""}
  }
  function close(){dlg.hidden=true;inn.innerHTML="";document.documentElement.classList.remove("ts-open");if(last&&last.focus)try{last.focus()}catch(e){}}
  dlg.addEventListener("click",function(e){if(e.target.closest("[data-x]"))close()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!dlg.hidden)close()});
  var mins=function(n){return n?(n>=60?Math.floor(n/60)+"h"+(n%60?" "+n%60+"m":""):n+"m"):""};
  function item(d){return{k:d.k,id:d.id,t:d.t,p:d.p,y:d.y,v:d.v}}
  function paintActs(){
    if(!cur)return;
    var s=window.sxList?sxList.get(cur.k,cur.id):"";
    var w=inn.querySelector('[data-act="wish"]'),v=inn.querySelector('[data-act="watched"]');
    if(w){w.classList.toggle("on",s==="wish");w.setAttribute("aria-pressed",s==="wish");w.querySelector("b").textContent=s==="wish"?"In your wishlist":"Add to wishlist"}
    if(v){v.classList.toggle("on",s==="watched");v.setAttribute("aria-pressed",s==="watched");v.querySelector("b").textContent=s==="watched"?"Watched":"Mark as watched"}
  }
  if(window.sxList)sxList.onChange(paintActs);
  function where(d){
    var own=(d.pl||[]).filter(function(p){return p.s}),oth=(d.pl||[]).filter(function(p){return!p.s});
    var h='<section class="ts-where"><div class="ts-sec"><h4>Where to watch</h4>'+(d.reg?'<small>Streaming in '+(d.reg==="BD"?"Bangladesh":"the United States")+'</small>':'')+'</div>';
    if(own.length){
      h+='<p class="ts-wsub">Available through StreamX. Fixed prices in BDT, paid with bKash, Nagad, Rocket or card.</p><div class="ts-svcs">'+own.map(function(p){
        var pr=from(p.s);return '<a class="ts-svc" href="/services/'+esc(p.s)+'/">'+logo(p.n)+'<span class="ts-svc-t"><b>Watch on '+esc(p.n)+'</b><small>'+(pr?esc(pr):"Get a plan")+'</small></span><i>'+ICON.go+'</i></a>'}).join("")+'</div>';
    }else{
      h+='<p class="ts-wsub">'+((d.pl&&d.pl.length)?'This title is not on a service StreamX sells yet.':(d.status&&d.status!=="Released"&&d.status!=="Returning Series"&&d.status!=="Ended"?'Not streaming yet. We will list it here once platforms are announced.':'No streaming platform is listed for this title right now.'))+'</p>';
    }
    if(oth.length)h+='<div class="ts-also"><span>Also on</span>'+oth.map(function(p){return '<em>'+logo(p.n)+esc(p.n)+'</em>'}).join("")+'</div>';
    return h+'</section>';
  }
  function paint(d){
    cur=d;
    var meta=[d.y,d.k==="tv"?(d.seasons?d.seasons+" season"+(d.seasons>1?"s":""):"Series"):mins(d.rt),d.lang].filter(Boolean).map(function(x){return'<span>'+esc(x)+'</span>'}).join("");
    var pct=Math.round((d.v||0)*10);
    inn.innerHTML=
    '<div class="ts-hero" id="tsHero" style="'+(d.bd?'--bd:url(https://image.tmdb.org/t/p/w780'+esc(d.bd)+')':'')+'">'+(d.yt?'<button class="ts-play" type="button" id="tsPlay" aria-label="Play trailer"><span>'+ICON.play+'</span><b>Play trailer</b></button>':'')+'</div>'+
    '<div class="ts-main"><div class="ts-poster">'+(d.p?'<img src="https://image.tmdb.org/t/p/w342'+esc(d.p)+'" alt="'+esc(d.t)+' poster">':'')+'</div>'+
    '<div class="ts-info"><div class="ts-top">'+(d.v?'<div class="ts-ring" style="--p:'+pct+'" title="TMDB user score"><b>'+d.v.toFixed(1)+'</b><small>TMDB</small></div>':'')+
    '<div class="ts-ttl"><h3>'+esc(d.t)+'</h3>'+(d.tag?'<p class="ts-tag">'+esc(d.tag)+'</p>':'')+'</div></div>'+
    '<div class="ts-facts">'+meta+(d.vc?'<span>'+d.vc.toLocaleString("en-US")+' votes</span>':'')+'</div>'+
    (d.g&&d.g.length?'<div class="ts-gen">'+d.g.map(function(g){return'<i>'+esc(g)+'</i>'}).join("")+'</div>':'')+
    '<div class="ts-acts"><button class="ts-btn" type="button" data-act="wish" aria-pressed="false">'+ICON.mark+'<b>Add to wishlist</b></button><button class="ts-btn" type="button" data-act="watched" aria-pressed="false">'+ICON.check+'<b>Mark as watched</b></button></div>'+
    (d.o?'<p class="ts-ov">'+esc(d.o)+'</p>':'')+(d.dir?'<p class="ts-dir"><small>'+(d.k==="tv"?"Created by":"Director")+'</small> '+esc(d.dir)+'</p>':'')+'</div></div>'+
    where(d)+
    (d.cast&&d.cast.length?'<section class="ts-cast-w"><div class="ts-sec"><h4>Top cast</h4></div><div class="ts-cast">'+d.cast.slice(0,8).map(function(c){return'<div>'+(c.p?'<img src="https://image.tmdb.org/t/p/w185'+esc(c.p)+'" alt="" loading="lazy">':'<span class="ts-ph">'+esc((c.n||"")[0]||"")+'</span>')+'<b>'+esc(c.n)+'</b><small>'+esc(c.c)+'</small></div>'}).join("")+'</div></section>':'')+
    '<div class="ts-foot">'+(d.imdb?'<a class="ts-link" href="https://www.imdb.com/title/'+esc(d.imdb)+'/" target="_blank" rel="noopener">View on IMDb &#8599;</a>':'<a class="ts-link" href="https://www.imdb.com/find/?q='+encodeURIComponent(d.t)+'" target="_blank" rel="noopener">Search on IMDb &#8599;</a>')+(d.yt?'<a class="ts-link" href="https://www.youtube.com/watch?v='+esc(d.yt)+'" target="_blank" rel="noopener">Open trailer on YouTube &#8599;</a>':'')+'</div>';
    var pb=inn.querySelector("#tsPlay");
    if(pb)pb.onclick=function(){var h=inn.querySelector("#tsHero");h.classList.add("on");h.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(d.yt)+'?autoplay=1&rel=0&modestbranding=1" title="'+esc(d.t)+' trailer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'};
    inn.querySelectorAll("[data-act]").forEach(function(b){b.onclick=function(){if(window.sxList)sxList.toggle(item(d),b.dataset.act)}});
    paintActs();box.scrollTop=0;
  }
  function open(id,k,from,h){
    last=from||null;hint=h||null;var my=++tok;dlg.hidden=false;document.documentElement.classList.add("ts-open");
    inn.innerHTML='<div class="ts-load"><i></i><span>Loading details&hellip;</span></div>';box.focus();
    var key=k+id;
    var p=cache[key]?Promise.resolve(cache[key]):fetch("/api/title?id="+encodeURIComponent(id)+"&k="+k).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(function(d){cache[key]=d;return d});
    p.then(function(d){if(my===tok&&!dlg.hidden)paint(d)}).catch(function(){if(my===tok)inn.innerHTML='<div class="ts-load"><span>Couldn\'t load details right now. Please try again.</span><button class="ts-btn" type="button" data-x>Close</button></div>'});
  }
  window.sxSheet={open:open};
})();
