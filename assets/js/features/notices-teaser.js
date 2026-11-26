/* Home: the latest announcements (pinned first). The section and its menu link stay hidden until there is something to show.
   (No pop-up in the nav pill any more: announcements live in this section, the profile card and /notices/.) */
(function(){
  const sec=document.getElementById("notices");if(!sec)return;
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const KIND={info:"Update",price:"Price change",offer:"Offer",maintenance:"Maintenance",important:"Important"};
  const fmt=d=>new Date(d).toLocaleDateString("en-GB",{timeZone:"Asia/Dhaka",day:"numeric",month:"short",year:"numeric"});
  const run=()=>fetch("/api/catalog?a=notices").then(r=>r.ok?r.json():null).then(d=>{
    const all=((d&&d.list)||[]).sort((a,b)=>(b.pin-a.pin)||(Date.parse(b.at)-Date.parse(a.at))),l=all.slice(0,3);
    if(!l.length)return;
    /* A row you scroll sideways: the first few updates appear with a soft stagger, and more load in (with a shimmer placeholder) as you reach the end */
    const row=document.getElementById("ntRow"),STEP=4;let shown=0,busy=false;
    const card=(n,i)=>{const k=KIND[n.k]?n.k:"info";return `<a class="nt-card k-${k} nt-in" style="--i:${i}" href="/notices/#${k}"><span class="nt-kind">${n.pin?"\u{1F4CC} ":""}${KIND[k]}</span><h3>${esc(n.t)}</h3>${n.m?`<p>${esc(n.m)}</p>`:""}<small>${fmt(n.at)}</small></a>`};
    const skel=()=>{const s=document.createElement("div");s.className="nt-card nt-sk";s.setAttribute("aria-hidden","true");s.innerHTML="<i></i><i></i><i></i><i></i>";return s};
    const add=()=>{const part=all.slice(shown,shown+STEP);row.insertAdjacentHTML("beforeend",part.map((n,i)=>card(n,i)).join(""));shown+=part.length};
    const more=()=>{if(busy||shown>=all.length)return;busy=true;const s1=skel(),s2=skel();row.append(s1,s2);
      setTimeout(()=>{s1.remove();s2.remove();add();busy=false;if(row.scrollWidth-row.clientWidth-row.scrollLeft<80)more()},650)};
    row.addEventListener("scroll",()=>{if(row.scrollWidth-row.clientWidth-row.scrollLeft<140)more()},{passive:true});
    row.innerHTML="";add();
    if(row.scrollWidth<=row.clientWidth+4&&shown<all.length)more();
    sec.hidden=false;const nl=document.getElementById("ntNav");if(nl)nl.hidden=false;
  }).catch(()=>{});
  setTimeout(run,900);
})();
