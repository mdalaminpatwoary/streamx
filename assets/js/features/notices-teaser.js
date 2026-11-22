/* Home: the latest 3 notices (pinned first). The section and its menu link stay hidden until there is something to show. */
(function(){
  const sec=document.getElementById("notices");if(!sec)return;
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const KIND={info:"Update",price:"Price change",offer:"Offer",maintenance:"Maintenance",important:"Important"};
  const fmt=d=>new Date(d).toLocaleDateString("en-GB",{timeZone:"Asia/Dhaka",day:"numeric",month:"short",year:"numeric"});
  const run=()=>fetch("/api/catalog?a=notices").then(r=>r.ok?r.json():null).then(d=>{
    const l=((d&&d.list)||[]).sort((a,b)=>(b.pin-a.pin)||(Date.parse(b.at)-Date.parse(a.at))).slice(0,3);
    if(!l.length)return;
    document.getElementById("ntRow").innerHTML=l.map(n=>{const k=KIND[n.k]?n.k:"info";return `<a class="nt-card k-${k}" href="/notices/#${k}"><span class="nt-kind">${n.pin?"📌 ":""}${KIND[k]}</span><h3>${esc(n.t)}</h3>${n.m?`<p>${esc(n.m)}</p>`:""}<small>${fmt(n.at)}</small></a>`}).join("");
    sec.hidden=false;const nl=document.getElementById("ntNav");if(nl)nl.hidden=false;
  }).catch(()=>{});
  if("IntersectionObserver" in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();run()}},{rootMargin:"800px"});io.observe(document.getElementById("reviews")||sec)}else run();
})();
