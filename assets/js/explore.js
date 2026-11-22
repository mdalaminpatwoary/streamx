/* Explore hub: sections load as they scroll into view; "Load 20 more" fetches the next TMDB page. Data from /api/catalog (a=hub, a=genres, a=births). */
(function(){
  var root=document.getElementById("exRoot"),nav=document.getElementById("exNav");if(!root)return;
  var esc=function(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var PLAT=[["netflix","Netflix"],["prime-video","Prime Video"],["disneyplus","Disney+"],["hbo-max","HBO Max"],["crunchyroll","Crunchyroll"],["jiohotstar","JioHotstar"],["paramountplus","Paramount+"],["hulu","Hulu"],["apple-tv","Apple TV+"],["peacock","Peacock"],["zee5","ZEE5"],["sonyliv","SonyLIV"],["viki","Rakuten Viki"],["mubi","MUBI"]];
  var KIND=[["movie","Movies"],["tv","Series"]];
  var SECS=[
    {id:"theaters",nav:"In theaters",eye:"Cinema",h:"In theaters <span class=\"grad\">now.</span>",sub:"Movies playing in cinemas right now, most popular first.",s:"nowplaying",k:"movie",rank:false},
    {id:"soon",nav:"Coming soon",eye:"Releases",h:"Coming <span class=\"grad\">soon.</span>",sub:"Every upcoming movie and series, with the release date on each poster.",s:"upcoming",kinds:true,date:true},
    {id:"platforms",nav:"By platform",eye:"Streaming",h:"Trending on <span class=\"grad\">every platform.</span>",sub:"Pick a platform to see its most popular movies and series. Get the matching plan from StreamX.",s:"platform",kinds:true,chips:PLAT},
    {id:"top",nav:"Top rated",eye:"Charts",h:"All-time <span class=\"grad\">top rated.</span>",sub:"The best-rated movies and series ever, ranked by TMDB user score.",s:"toprated",kinds:true,rank:true},
    {id:"genres",nav:"Genres",eye:"Categories",h:"Browse by <span class=\"grad\">genre.</span>",sub:"Choose a genre to explore every available title, most popular first.",s:"genre",kinds:true,genres:true},
    {id:"boxoffice",nav:"Box office",eye:"Earnings",h:"Box office <span class=\"grad\">hits.</span>",sub:"The highest-grossing movies of all time, ranked by worldwide revenue.",s:"boxoffice",k:"movie",rank:true},
    {id:"popular",nav:"Popular now",eye:"Right now",h:"Popular <span class=\"grad\">right now.</span>",sub:"What everyone is watching this week.",s:"popular",kinds:true},
    {id:"airing",nav:"Airing today",eye:"Series",h:"Series airing <span class=\"grad\">today.</span>",sub:"Episodes releasing today.",s:"airing",k:"tv"},
    {id:"birthdays",nav:"Birthdays",eye:"Celebrities",h:"Born <span class=\"grad\">today.</span>",sub:"Actors, singers, filmmakers and athletes celebrating a birthday today.",births:true}
  ];
  var q=function(o){return Object.keys(o).filter(function(k){return o[k]!==""&&o[k]!=null}).map(function(k){return k+"="+encodeURIComponent(o[k])}).join("&")};
  var get=function(p){return fetch("/api/catalog?"+q(p)).then(function(r){if(!r.ok)throw 0;return r.json()})};
  var idx={};
  function card(m,i,c){
    idx[m.k+":"+m.id]=m;
    var dt="";if(c.date&&m.d){var d=new Date(m.d+"T00:00:00");if(!isNaN(d))dt='<span class="ex-dt">'+d.getDate()+" "+MON[d.getMonth()]+(d.getFullYear()!==new Date().getFullYear()?" "+d.getFullYear():"")+"</span>"}
    return '<article class="ex-card" style="--i:'+(i%20)+'" tabindex="0" role="button" aria-label="'+esc(m.t)+': details and trailer" data-id="'+m.id+'" data-k="'+m.k+'"><div class="ex-po"><img src="https://image.tmdb.org/t/p/w342'+esc(m.p)+'" alt="'+esc(m.t)+' poster" loading="lazy" width="342" height="513">'+(c.rank?'<span class="ex-rk">#'+(c._n+i+1)+"</span>":"")+(m.v?'<span class="ex-v">★ '+m.v+"</span>":"")+dt+'</div><h3>'+esc(m.t)+"</h3><p>"+esc(m.y||"")+(m.g&&m.g.length?" · "+esc(m.g.slice(0,2).join(", ")):"")+"</p></article>";
  }
  function seg(opts,on,attr){return '<div class="tp-seg" role="group" data-seg="'+attr+'"><span class="tp-thumb" aria-hidden="true"></span>'+opts.map(function(o){return '<button type="button" data-v="'+o[0]+'"'+(o[0]===on?' class="on"':"")+">"+o[1]+"</button>"}).join("")+"</div>"}
  function thumbs(el){el.querySelectorAll(".tp-seg").forEach(function(s){var on=s.querySelector("button.on"),t=s.querySelector(".tp-thumb");if(on&&t){t.style.width=on.offsetWidth+"px";t.style.transform="translateX("+on.offsetLeft+"px)"}})}

  function build(c){
    var sec=document.createElement("section");sec.className="ex-sec";sec.id=c.id;sec.dataset.nav=c.nav;
    sec.innerHTML='<div class="ex-head"><div><div class="ac-eyebrow">'+c.eye+"</div><h2>"+c.h+"</h2></div>"+(c.sub?"<p>"+c.sub+"</p>":"")+"</div>";
    if(c.births){sec.insertAdjacentHTML("beforeend",'<div class="ex-bd" id="exBd"></div>');return sec}
    var bar="";
    if(c.kinds)bar+=seg(KIND,"movie","k");
    var st={k:c.k||"movie",page:0,pages:1,chip:c.chips?c.chips[0][0]:"",n:0,loading:false};
    c._st=st;
    sec.insertAdjacentHTML("beforeend",(bar||c.chips||c.genres?'<div class="ex-bar">'+bar+(c.chips||c.genres?'<div class="ex-chips" role="group" aria-label="Filter"></div>':"")+"</div>":"")+'<div class="ex-grid" aria-live="polite"></div><div class="ex-foot"><button type="button" class="ex-more" hidden>Load 20 more</button></div>');
    var grid=sec.querySelector(".ex-grid"),more=sec.querySelector(".ex-more"),chips=sec.querySelector(".ex-chips");
    function drawChips(list){chips.innerHTML=list.map(function(o){return '<button type="button" class="ex-chip'+(o[0]==st.chip?" on":"")+'" data-v="'+o[0]+'">'+esc(o[1])+"</button>"}).join("")}
    function skeleton(){grid.innerHTML='<div class="ex-sk">'+"<i></i>".repeat(10)+"</div>";more.hidden=true}
    function load(reset){
      if(st.loading)return;
      if(reset){st.page=0;st.n=0;skeleton()}
      var gid=c.genres?st.chip:"";
      if(c.genres&&!gid)return;
      st.loading=true;more.disabled=true;
      get({a:"hub",s:c.s,k:st.k,page:st.page+1,g:gid,p:c.chips?st.chip:""}).then(function(d){
        var sk=grid.querySelector(".ex-sk");if(sk)sk.remove();
        st.page=d.page;st.pages=d.pages;
        c._n=st.n;var rows=d.list||[];
        if(!rows.length&&!st.n){grid.innerHTML='<div class="ex-msg"><b>Nothing to show here yet</b>Try another filter or check back soon.</div>';more.hidden=true;return}
        grid.insertAdjacentHTML("beforeend",rows.map(function(m,i){return card(m,i,c)}).join(""));st.n+=rows.length;
        more.hidden=st.page>=st.pages;
      }).catch(function(){
        var sk=grid.querySelector(".ex-sk");if(sk)sk.remove();
        if(!st.n)grid.innerHTML='<div class="ex-msg"><b>Couldn\'t load this list right now</b>Please try again in a moment.</div>';
      }).then(function(){st.loading=false;more.disabled=false});
    }
    c._start=function(){
      if(c.chips)drawChips(c.chips);
      if(c.genres)get({a:"genres",k:st.k}).then(function(d){c._g=d.genres.map(function(g){return[String(g.id),g.n]});if(!st.chip||!c._g.some(function(x){return x[0]===st.chip}))st.chip=c._g[0][0];drawChips(c._g);load(true)}).catch(function(){grid.innerHTML='<div class="ex-msg"><b>Couldn\'t load genres</b>Please try again.</div>'});
      else load(true);
      thumbs(sec);
    };
    more.addEventListener("click",function(){load(false)});
    sec.addEventListener("click",function(e){
      var b=e.target.closest("button[data-v]");if(!b||!sec.contains(b))return;
      if(b.classList.contains("ex-chip")){st.chip=b.dataset.v;drawChips(c.genres?c._g:c.chips);load(true);return}
      var sg=b.closest(".tp-seg");if(sg){sg.querySelectorAll("button").forEach(function(x){x.classList.toggle("on",x===b)});st.k=b.dataset.v;thumbs(sec);
        if(c.genres)get({a:"genres",k:st.k}).then(function(d){c._g=d.genres.map(function(g){return[String(g.id),g.n]});st.chip=c._g[0][0];drawChips(c._g);load(true)});else load(true)}
    });
    sec.addEventListener("click",function(e){var el=e.target.closest(".ex-card");if(el&&window.sxSheet)sxSheet.open(el.dataset.id,el.dataset.k,el,idx[el.dataset.k+":"+el.dataset.id])});
    sec.addEventListener("keydown",function(e){if((e.key==="Enter"||e.key===" ")&&e.target.matches(".ex-card")){e.preventDefault();e.target.click()}});
    return sec;
  }
  function births(){
    var box=document.getElementById("exBd");if(!box)return;
    box.innerHTML='<div class="ex-msg" style="grid-column:1/-1">Loading…</div>';
    get({a:"births"}).then(function(d){
      var dt=new Date((d.date||"")+"T00:00:00"),sub=document.querySelector("#birthdays .ex-head p");
      if(sub&&!isNaN(dt))sub.textContent="Actors, singers, filmmakers and athletes celebrating a birthday on "+dt.getDate()+" "+MON[dt.getMonth()]+".";
      if(!d.list||!d.list.length){box.innerHTML='<div class="ex-msg" style="grid-column:1/-1"><b>No celebrity birthdays found for today</b>Check back tomorrow.</div>';return}
      box.innerHTML=d.list.map(function(p){var inner=(p.img?'<img src="'+esc(p.img)+'" alt="'+esc(p.n)+'" loading="lazy" width="64" height="64">':"<i>"+esc(p.n[0]||"?")+"</i>")+"<div><b>"+esc(p.n)+"</b><small>"+esc(p.d)+"</small><em>Turns "+p.age+" · born "+p.y+"</em></div>";
        return p.u?'<a class="ex-b" href="'+esc(p.u)+'" target="_blank" rel="noopener">'+inner+"</a>":'<div class="ex-b">'+inner+"</div>"}).join("");
    }).catch(function(){box.innerHTML='<div class="ex-msg" style="grid-column:1/-1"><b>Couldn\'t load birthdays right now</b>Please try again later.</div>'});
  }
  SECS.forEach(function(c){var s=build(c);root.appendChild(s);c._el=s});
  nav.innerHTML=SECS.map(function(c){return '<a href="#'+c.id+'">'+c.nav+"</a>"}).join("");
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);var c=SECS.filter(function(x){return x._el===e.target})[0];if(!c)return;if(c.births)births();else c._start()})},{rootMargin:"500px 0px"});
  SECS.forEach(function(c){io.observe(c._el)});
  /* highlight the section in view */
  var links=[].slice.call(nav.querySelectorAll("a")),so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.toggle("on",a.getAttribute("href")==="#"+e.target.id)});var on=nav.querySelector("a.on");if(on)nav.scrollTo({left:on.offsetLeft-16,behavior:"smooth"})}})},{rootMargin:"-45% 0px -50% 0px"});
  SECS.forEach(function(c){so.observe(c._el)});
  addEventListener("resize",function(){thumbs(root)});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){thumbs(root)});
})();
