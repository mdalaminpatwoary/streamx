/* Explore hub: sections load as they scroll into view; "Load 20 more" fetches the next TMDB page. Data from /api/catalog (a=hub, a=genres, a=births). */
(function(){
  var root=document.getElementById("exRoot"),nav=document.getElementById("exNav");if(!root)return;
  var esc=function(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var PLAT=[["netflix","Netflix"],["prime-video","Prime Video"],["disneyplus","Disney+"],["hbo-max","HBO Max"],["crunchyroll","Crunchyroll"],["jiohotstar","JioHotstar"],["paramountplus","Paramount+"],["hulu","Hulu"],["apple-tv","Apple TV+"],["peacock","Peacock"],["zee5","ZEE5"],["sonyliv","SonyLIV"],["viki","Rakuten Viki"],["mubi","MUBI"]];
  var ANIME=[["popular","Popular"],["top","Top rated"],["new","New releases"],["crunchyroll","On Crunchyroll"]];
  var KDRAMA=[["popular","Popular"],["top","Top rated"],["new","New releases"],["netflix","On Netflix"]];
  var BOLLY=[["popular","Popular"],["top","Top rated"],["new","New releases"],["netflix","On Netflix"],["jiohotstar","On JioHotstar"]];
  var OSCAR=[["winners","2026 winners"],["nominees","2026 nominees"],["bestpicture","Best Picture winners"]];
  var BANGLA=[["bn_pop","Popular"],["bn_top","Top rated"],["bn_new","New releases"]];
  var SOUTH=[["te","Telugu"],["ta","Tamil"],["ml","Malayalam"],["kn","Kannada"]];
  var WORLD=[["tr","Turkish"],["es","Spanish"],["fr","French"],["ja","Japanese"],["th","Thai"]];
  var PICKS=[["gems","Hidden gems"],["truth","True stories"],["classics","Classics"],["hero","Superheroes"]];
  var KIND=[["movie","Movies"],["tv","Series"]];
  var NEWSC=[["all","All"],["movies","Movies"],["tv","TV & series"],["people","Stars"],["boxoffice","Box office"]];
  var SECS=[
    {id:"theaters",nav:"In theaters",eye:"Cinema",h:"In theaters <span class=\"grad\">now.</span>",sub:"Movies playing in cinemas right now, most popular first.",s:"nowplaying",k:"movie",rank:false},
    {id:"soon",nav:"Coming soon",eye:"Releases",h:"Coming <span class=\"grad\">soon.</span>",sub:"Every upcoming movie and series, with the release date on each poster.",s:"upcoming",kinds:true,date:true},
    {id:"trailers",nav:"Trailers",eye:"Trailers",h:"Latest <span class=\"grad\">trailers.</span>",sub:"The newest official trailers for upcoming and currently airing movies and series. Tap to watch here.",s:"trailers",kinds:true,video:true},
    {id:"news",nav:"News",eye:"Entertainment news",h:"Entertainment <span class=\"grad\">news.</span>",sub:"Headlines on movies, series, actors and actresses, box office and the wider industry, from leading trade publications. Each story opens at the source.",chips:NEWSC,news:true},
    {id:"platforms",nav:"By platform",eye:"Streaming",h:"Trending on <span class=\"grad\">every platform.</span>",sub:"Pick a platform to see its most popular movies and series. Get the matching plan from StreamX.",s:"platform",kinds:true,chips:PLAT},
    {id:"top",nav:"Top rated",eye:"Charts",h:"All-time <span class=\"grad\">top rated.</span>",sub:"The best-rated movies and series ever, ranked by TMDB user score.",s:"toprated",kinds:true,rank:true},
    {id:"anime",nav:"Anime",eye:"Anime",h:"Anime <span class=\"grad\">worldwide.</span>",sub:"Japanese anime series and films: what is popular, best rated, newly released and streaming on Crunchyroll.",s:"anime",kinds:true,chips:ANIME,mode:true},
    {id:"kdrama",nav:"K-drama",eye:"Korean",h:"K-drama <span class=\"grad\">and Korean cinema.</span>",sub:"Korean series and films: what is popular, best rated, newly released and streaming on Netflix where you are.",s:"kdrama",k:"tv",kinds:true,chips:KDRAMA,mode:true},
    {id:"bollywood",nav:"Bollywood",eye:"Hindi",h:"Bollywood <span class=\"grad\">and Hindi cinema.</span>",sub:"Hindi movies and series: what is popular, best rated, newly released and streaming on Netflix or JioHotstar.",s:"bollywood",k:"movie",kinds:true,chips:BOLLY,mode:true},
    {id:"oscars",nav:"Oscars",eye:"Academy Awards",h:"The <span class=\"grad\">Oscars.</span>",sub:"The 98th Academy Awards (March 2026): this year's winners and nominees, and every Best Picture winner since 1990.",s:"oscars",k:"movie",chips:OSCAR,mode:true},
    {id:"globes",nav:"Golden Globes",eye:"Awards",h:"Golden <span class=\"grad\">Globes.</span>",sub:"Best Motion Picture – Drama winners, newest first.",s:"awards",k:"movie",m:"goldenglobes"},
    {id:"bafta",nav:"BAFTA",eye:"Awards",h:"BAFTA <span class=\"grad\">Best Film.</span>",sub:"The British Academy Film Awards: every Best Film winner of the last 20 years, newest first.",s:"awards",k:"movie",m:"bafta"},
    {id:"cannes",nav:"Cannes",eye:"Awards",h:"Cannes <span class=\"grad\">Palme d'Or.</span>",sub:"The top prize of the Cannes Film Festival, newest first.",s:"awards",k:"movie",m:"cannes"},
    {id:"filmfare",nav:"Filmfare",eye:"Awards",h:"Filmfare <span class=\"grad\">Best Film.</span>",sub:"India's Filmfare Awards: the Best Film winners of the last 20 years, newest first.",s:"awards",k:"movie",m:"filmfare"},
    {id:"nfa",nav:"National Film Awards",eye:"Awards",h:"National Film Awards <span class=\"grad\">(India).</span>",sub:"Best Feature Film winners of India's National Film Awards, newest first.",s:"awards",k:"movie",m:"national"},
    {id:"bdfa",nav:"Bangladesh Awards",eye:"Awards",h:"Bangladesh National <span class=\"grad\">Film Awards.</span>",sub:"Best Film winners of the Bangladesh National Film Awards, newest first.",s:"awards",k:"movie",m:"bangladesh"},
    {id:"bangla",nav:"Bangla",eye:"Bangla",h:"Bangla <span class=\"grad\">cinema.</span>",sub:"Bengali-language movies and series: what is popular, best rated and newly released.",s:"disc",k:"movie",kinds:true,chips:BANGLA,mode:true},
    {id:"south",nav:"South Indian",eye:"South India",h:"South Indian <span class=\"grad\">cinema.</span>",sub:"Telugu, Tamil, Malayalam and Kannada movies and series, most popular first.",s:"disc",k:"movie",kinds:true,chips:SOUTH,mode:true},
    {id:"world",nav:"World cinema",eye:"World",h:"World <span class=\"grad\">cinema.</span>",sub:"Turkish, Spanish, French, Japanese and Thai titles that people are watching right now.",s:"disc",k:"tv",kinds:true,chips:WORLD,mode:true},
    {id:"picks",nav:"Curated picks",eye:"Curated",h:"Curated <span class=\"grad\">picks.</span>",sub:"Hidden gems, true stories, timeless classics and superhero hits.",s:"disc",k:"movie",kinds:true,chips:PICKS,mode:true},
    {id:"genres",nav:"Genres",eye:"Categories",h:"Browse by <span class=\"grad\">genre.</span>",sub:"Choose a genre to explore every available title, most popular first.",s:"genre",kinds:true,genres:true},
    {id:"boxoffice",nav:"Box office",eye:"Earnings",h:"Box office <span class=\"grad\">hits.</span>",sub:"The highest-grossing movies of all time, ranked by worldwide revenue.",s:"boxoffice",k:"movie",rank:true},
    {id:"popular",nav:"Popular now",eye:"Right now",h:"Popular <span class=\"grad\">right now.</span>",sub:"What everyone is watching this week.",s:"popular",kinds:true},
    {id:"airing",nav:"Airing today",eye:"Series",h:"Series airing <span class=\"grad\">today.</span>",sub:"Episodes releasing today.",s:"airing",k:"tv"},
    {id:"birthdays",nav:"Birthdays",eye:"Celebrities",h:"Born <span class=\"grad\">today.</span>",sub:"Actors, actresses, singers and filmmakers celebrating a birthday today.",births:true}
  ];
  SECS.forEach(function(c){c.rail=true});
  function arrows(sec,sc){var a=sec.querySelector(".ex-arr");if(!a)return;a.addEventListener("click",function(e){var b=e.target.closest("button[data-dir]");if(!b)return;sc.scrollBy({left:(+b.dataset.dir)*Math.max(240,sc.clientWidth*.8),behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})});
    function fade(){var l=sc.scrollLeft<4,r=sc.scrollLeft+sc.clientWidth>=sc.scrollWidth-4,bs=a.querySelectorAll("button");bs[0].disabled=l;bs[1].disabled=r}sc.addEventListener("scroll",fade,{passive:true});fade();new MutationObserver(fade).observe(sc,{childList:true})}
  var q=function(o){return Object.keys(o).filter(function(k){return o[k]!==""&&o[k]!=null}).map(function(k){return k+"="+encodeURIComponent(o[k])}).join("&")};
  var get=function(p){return fetch("/api/catalog?"+q(p)).then(function(r){if(!r.ok)throw 0;return r.json()})};
  var idx={};
  function ago(t){var m=Math.round((Date.now()-t)/6e4);return !t?"":m<1?"just now":m<60?m+" min ago":m<1440?Math.round(m/60)+" h ago":Math.round(m/1440)+" d ago"}
  function ncard(m,i){
    return '<a class="ex-card ex-nc" style="--i:'+(i%12)+'" href="'+esc(m.u)+'" target="_blank" rel="noopener noreferrer"><div class="ex-po">'+(m.i?'<img src="'+esc(m.i)+'" alt="" loading="lazy" width="640" height="360" referrerpolicy="no-referrer">':'<span class="ex-nph" aria-hidden="true">'+esc((m.s||"N")[0])+"</span>")+'<span class="ex-src">'+esc(m.s)+'</span></div><h3>'+esc(m.t)+"</h3><p>"+(m.x?esc(m.x):"")+"</p><small>"+ago(m.d)+" · Read at "+esc(m.s)+" ↗</small></a>";
  }
  function vcard(m,i){
    idx[m.k+":"+m.id]=m;
    var img=m.b?"https://image.tmdb.org/t/p/w780"+esc(m.b):"https://image.tmdb.org/t/p/w342"+esc(m.p);
    return '<article class="ex-card ex-vc" style="--i:'+(i%20)+'" tabindex="0" role="button" aria-label="Play trailer: '+esc(m.t)+'" data-yt="'+esc(m.yt)+'" data-t="'+esc(m.t)+'"><div class="ex-po"><img src="'+img+'" alt="'+esc(m.t)+' trailer thumbnail" loading="lazy" width="780" height="439"><span class="ex-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>'+(m.v?'<span class="ex-v">★ '+m.v+"</span>":"")+'</div><h3>'+esc(m.t)+"</h3><p>"+esc(m.vt||"Official trailer")+"</p></article>";
  }
  function player(key,title,img){
    var d=document.createElement("div");d.className="ex-pl";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-label",title+" trailer");
    d.innerHTML='<div class="ex-plbg" data-x></div><div class="ex-plbox"><button type="button" class="ex-plx" data-x aria-label="Close trailer">&times;</button><div class="ex-plv"><iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(key)+'?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist='+encodeURIComponent(key)+'&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0" title="'+esc(title)+' trailer" allow="autoplay; encrypted-media" tabindex="-1"></iframe>'+(img?'<div class="ex-plc" style="background:#000 url(\''+esc(img)+'\') center/cover no-repeat"></div>':"")+'</div><p>'+esc(title)+"</p></div>";
    var prev=document.activeElement;
    function close(){document.removeEventListener("keydown",key_);d.remove();document.body.style.overflow="";if(prev&&prev.focus)prev.focus()}
    function key_(e){if(e.key==="Escape")close()}
    d.addEventListener("click",function(e){if(e.target.closest("[data-x]"))close()});
    if(window.sxSwipe)sxSwipe(d.querySelector(".ex-plbox"),{bg:d.querySelector(".ex-plbg"),close:close});
    var cv=d.querySelector(".ex-plc");if(cv)setTimeout(function(){cv.style.opacity="0";setTimeout(function(){cv.remove()},950)},4000);   /* cover image stays 4s, then the trailer fades in */
    document.addEventListener("keydown",key_);document.body.style.overflow="hidden";document.body.appendChild(d);d.querySelector(".ex-plx").focus();
  }
  var ACTS='<div class="tp-acts"><button class="tp-act" type="button" data-act="wish" aria-pressed="false" aria-label="Add to wishlist" title="Wishlist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg></button><button class="tp-act" type="button" data-act="watched" aria-pressed="false" aria-label="Mark as watched" title="Watched"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></button></div>';
  function paintStates(){
    if(!window.sxList)return;
    document.querySelectorAll(".ex-card[data-k]").forEach(function(c){
      var st=sxList.get(c.dataset.k,c.dataset.id);
      c.classList.toggle("is-wish",st==="wish");c.classList.toggle("is-seen",st==="watched");
      c.querySelectorAll(".tp-act").forEach(function(b){var on=b.dataset.act===st;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.setAttribute("aria-label",b.dataset.act==="wish"?(on?"Remove from wishlist":"Add to wishlist"):(on?"Unmark as watched":"Mark as watched"))});
    });
  }
  function act(e){
    var a=e.target.closest(".tp-act");if(!a)return false;
    var el=a.closest(".ex-card"),m=el&&idx[el.dataset.k+":"+el.dataset.id];
    e.preventDefault();e.stopPropagation();
    if(window.sxList&&m)sxList.toggle({k:m.k,id:m.id,t:m.t,p:m.p,y:m.y,v:m.v},a.dataset.act);
    return true;
  }
  var pt;new MutationObserver(function(){clearTimeout(pt);pt=setTimeout(paintStates,60)}).observe(document.body,{childList:true,subtree:true});
  if(window.sxList){sxList.onChange(paintStates);sxList.load().then(paintStates)}
  function card(m,i,c){
    if(c.news)return ncard(m,i);
    if(c.video)return vcard(m,i);
    idx[m.k+":"+m.id]=m;
    var dt="";if(c.date&&m.d){var d=new Date(m.d+"T00:00:00");if(!isNaN(d))dt='<span class="ex-dt">'+d.getDate()+" "+MON[d.getMonth()]+(d.getFullYear()!==new Date().getFullYear()?" "+d.getFullYear():"")+"</span>"}
    return '<article class="ex-card" style="--i:'+(i%20)+'" tabindex="0" role="button" aria-label="'+esc(m.t)+': details and trailer" data-id="'+m.id+'" data-k="'+m.k+'"><div class="ex-po"><img src="https://image.tmdb.org/t/p/w342'+esc(m.p)+'" alt="'+esc(m.t)+' poster" loading="lazy" width="342" height="513">'+(c.rank?'<span class="ex-rk">#'+(c._n+i+1)+"</span>":"")+(m.v?'<span class="ex-v">★ '+m.v+"</span>":"")+(m.aw?'<span class="ex-aw">\u{1F3C6} '+esc(m.aw)+"</span>":"")+dt+'<span class="tp-seen">Watched</span>'+ACTS+'</div><h3>'+esc(m.t)+"</h3><p>"+esc(m.y||"")+(m.g&&m.g.length?" · "+esc(m.g.slice(0,2).join(", ")):"")+"</p></article>";
  }
  function seg(opts,on,attr){return '<div class="tp-seg" role="group" data-seg="'+attr+'"><span class="tp-thumb" aria-hidden="true"></span>'+opts.map(function(o){return '<button type="button" data-v="'+o[0]+'"'+(o[0]===on?' class="on"':"")+">"+o[1]+"</button>"}).join("")+"</div>"}
  function thumbs(el){el.querySelectorAll(".tp-seg").forEach(function(s){var on=s.querySelector("button.on"),t=s.querySelector(".tp-thumb");if(on&&t){t.style.width=on.offsetWidth+"px";t.style.transform="translateX("+on.offsetLeft+"px)"}})}

  function build(c){
    var sec=document.createElement("section");sec.className="ex-sec";sec.id=c.id;sec.dataset.nav=c.nav;
    sec.className="ex-sec"+(c.video?" ex-vsec":"")+(c.news?" ex-nsec":"")+(c.rail?" ex-rail":"");sec.innerHTML='<div class="ex-head"><div><div class="ac-eyebrow">'+c.eye+"</div><h2>"+c.h+"</h2></div>"+(c.sub?"<p>"+c.sub+"</p>":"")+(c.rail?'<div class="ex-arr"><button type="button" data-dir="-1" aria-label="Scroll left">&#8592;</button><button type="button" data-dir="1" aria-label="Scroll right">&#8594;</button></div>':"")+"</div>";
    if(c.births){sec.insertAdjacentHTML("beforeend",'<div class="ex-bd" id="exBd"></div>');arrows(sec,sec.querySelector("#exBd"));return sec}
    var bar="";
    if(c.kinds)bar+=seg(KIND,c.k||"movie","k");
    var st={k:c.k||"movie",page:0,pages:1,chip:c.chips?c.chips[0][0]:"",n:0,loading:false};
    c._st=st;
    sec.insertAdjacentHTML("beforeend",(bar||c.chips||c.genres?'<div class="ex-bar">'+bar+(c.chips||c.genres?'<div class="ex-chips" role="group" aria-label="Filter"></div>':"")+"</div>":"")+'<div class="ex-grid" aria-live="polite"></div>');
    var grid=sec.querySelector(".ex-grid"),more={hidden:true,disabled:false},chips=sec.querySelector(".ex-chips");
    function drawChips(list){chips.innerHTML=list.map(function(o){return '<button type="button" class="ex-chip'+(o[0]==st.chip?" on":"")+'" data-v="'+o[0]+'">'+esc(o[1])+"</button>"}).join("")}
    function skeleton(){grid.innerHTML='<div class="ex-sk">'+"<i></i>".repeat(10)+"</div>";more.hidden=true}
    function load(reset){
      if(st.loading)return;
      if(reset){st.page=0;st.n=0;skeleton()}
      var gid=c.genres?st.chip:"";
      if(c.genres&&!gid)return;
      st.loading=true;more.disabled=true;
      if(!reset&&!grid.querySelector(".ex-sk"))grid.insertAdjacentHTML("beforeend",'<div class="ex-sk ex-skm" aria-hidden="true">'+"<i></i>".repeat(4)+"</div>");
      (c.news?get({a:"news",c:st.chip,page:st.page+1}):get({a:"hub",s:c.s,k:st.k,page:st.page+1,g:gid,p:c.chips&&!c.mode?st.chip:"",m:c.mode?st.chip:(c.m||"")})).then(function(d){
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
    if(c.rail){arrows(sec,grid);grid.addEventListener("scroll",function(){if(!more.hidden&&!st.loading&&grid.scrollLeft+grid.clientWidth>grid.scrollWidth-320)load(false)},{passive:true})}
    sec.addEventListener("click",function(e){
      var b=e.target.closest("button[data-v]");if(!b||!sec.contains(b))return;
      if(b.classList.contains("ex-chip")){st.chip=b.dataset.v;drawChips(c.genres?c._g:c.chips);load(true);return}
      var sg=b.closest(".tp-seg");if(sg){sg.querySelectorAll("button").forEach(function(x){x.classList.toggle("on",x===b)});st.k=b.dataset.v;thumbs(sec);
        if(c.genres)get({a:"genres",k:st.k}).then(function(d){c._g=d.genres.map(function(g){return[String(g.id),g.n]});st.chip=c._g[0][0];drawChips(c._g);load(true)});else load(true)}
    });
    sec.addEventListener("click",function(e){if(act(e))return;var el=e.target.closest(".ex-card");if(el&&el.dataset.yt){var im=el.querySelector("img");player(el.dataset.yt,el.dataset.t,im&&im.getAttribute("src"));return}if(el&&window.sxSheet)sxSheet.open(el.dataset.id,el.dataset.k,el,idx[el.dataset.k+":"+el.dataset.id])});
    sec.addEventListener("keydown",function(e){if((e.key==="Enter"||e.key===" ")&&e.target.matches(".ex-card")){e.preventDefault();e.target.click()}});
    return sec;
  }
  function births(){
    var box=document.getElementById("exBd");if(!box)return;
    box.innerHTML='<div class="ex-msg" style="grid-column:1/-1">Loading…</div>';
    get({a:"births"}).then(function(d){
      var dt=new Date((d.date||"")+"T00:00:00"),sub=document.querySelector("#birthdays .ex-head p");
      if(sub&&!isNaN(dt))sub.textContent="Actors, actresses, singers and filmmakers celebrating a birthday on "+dt.getDate()+" "+MON[dt.getMonth()]+".";
      if(!d.list||!d.list.length){box.innerHTML='<div class="ex-msg" style="grid-column:1/-1"><b>No celebrity birthdays found for today</b>Check back tomorrow.</div>';return}
      var CAKE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21v-7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v7"/><path d="M5 17c1.5 1 2.5 1 4 0s2.5-1 4 0 2.5 1 4 0"/><path d="M12 13V9.5"/><path d="M12 9.5c-.9 0-1.4-.6-1.4-1.4 0-1 1.4-2.4 1.4-2.4s1.4 1.4 1.4 2.4c0 .8-.5 1.4-1.4 1.4z"/></svg>';
      box.innerHTML=d.list.map(function(p){var inner='<div class="ex-bp">'+(p.img?'<img src="'+esc(p.img)+'" alt="'+esc(p.n)+'" loading="lazy" width="320" height="427" referrerpolicy="no-referrer">':"<i>"+esc(p.n[0]||"?")+"</i>")+'</div><span class="ex-bage">'+CAKE+"Turns "+p.age+'</span><div class="ex-bi"><b>'+esc(p.n)+"</b><small>"+esc(p.d)+"</small><em>Born "+p.y+"</em></div>";
        return p.u?'<a class="ex-b" href="'+esc(p.u)+'" target="_blank" rel="noopener">'+inner+"</a>":'<div class="ex-b">'+inner+"</div>"}).join("");
    }).catch(function(){box.innerHTML='<div class="ex-msg" style="grid-column:1/-1"><b>Couldn\'t load birthdays right now</b>Please try again later.</div>'});
  }
  /* search: results rail above the sections */
  (function(){
    var f=document.getElementById("exForm"),inp=document.getElementById("exQ"),clr=document.getElementById("exClr"),res=document.getElementById("exRes"),g=document.getElementById("exResG"),t=document.getElementById("exResT"),more={hidden:true},st={q:"",page:0,pages:1,loading:false,n:0},timer,seq=0;
    if(!f)return;
    arrows(res,g);
    var CARD={rank:false};
    function run(reset){
      var qq=inp.value.replace(/\s+/g," ").trim();
      if(qq.length<2){res.hidden=true;g.innerHTML="";more.hidden=true;st.q="";return}
      if(reset){st.q=qq;st.page=0;st.n=0;g.innerHTML='<div class="ex-sk">'+"<i></i>".repeat(8)+"</div>";g.scrollLeft=0}
      if(st.loading&&!reset)return;
      if(!reset&&!g.querySelector(".ex-sk"))g.insertAdjacentHTML("beforeend",'<div class="ex-sk ex-skm" aria-hidden="true">'+"<i></i>".repeat(4)+"</div>");
      var my=++seq;st.loading=true;res.hidden=false;t.textContent="Results for \u201c"+qq+"\u201d";
      get({a:"search",q:st.q,page:st.page+1}).then(function(d){
        if(my!==seq)return;
        var sk=g.querySelector(".ex-sk");if(sk)sk.remove();
        st.page=d.page;st.pages=d.pages;var rows=d.list||[];
        if(!rows.length&&!st.n){g.innerHTML='<div class="ex-msg"><b>No matches for \u201c'+esc(st.q)+'\u201d</b>Check the spelling or try another title.</div>';more.hidden=true;return}
        CARD._n=st.n;g.insertAdjacentHTML("beforeend",rows.map(function(m,i){return card(m,i,CARD)}).join(""));st.n+=rows.length;more.hidden=st.page>=st.pages;
      }).catch(function(){if(my===seq){var sk=g.querySelector(".ex-sk");if(sk)sk.remove();if(!st.n)g.innerHTML='<div class="ex-msg"><b>Search is unavailable right now</b>Please try again in a moment.</div>'}}).then(function(){if(my===seq)st.loading=false});
    }
    inp.addEventListener("input",function(){clr.hidden=!inp.value;clearTimeout(timer);timer=setTimeout(function(){run(true)},350)});
    f.addEventListener("submit",function(e){e.preventDefault();clearTimeout(timer);run(true)});
    clr.addEventListener("click",function(){inp.value="";clr.hidden=true;run(true);inp.focus()});
    g.addEventListener("scroll",function(){if(!more.hidden&&!st.loading&&g.scrollLeft+g.clientWidth>g.scrollWidth-320)run(false)},{passive:true});
    res.addEventListener("click",function(e){if(act(e))return;var el=e.target.closest(".ex-card");if(el&&window.sxSheet)sxSheet.open(el.dataset.id,el.dataset.k,el,idx[el.dataset.k+":"+el.dataset.id])});
    res.addEventListener("keydown",function(e){if((e.key==="Enter"||e.key===" ")&&e.target.matches(".ex-card")){e.preventDefault();e.target.click()}});
    document.addEventListener("keydown",function(e){if(e.key==="/"&&!/input|textarea/i.test((e.target.tagName||""))){e.preventDefault();inp.focus()}});
    /* My list badge */
    var badge=document.getElementById("exMyN");
    function mine(){if(!badge||!window.sxList)return;var n=sxList.all().length;badge.hidden=!n;badge.textContent=n}
    if(window.sxList){sxList.onChange(mine);sxList.load().then(mine)}
  })();
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
