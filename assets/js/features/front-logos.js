/* Front page: real logos in hero cards and moving strip. */
// ===== Front page: real logos (hero cards + moving strip) =====
document.querySelectorAll(".hx-stage i[data-logo]").forEach(i=>{const L=LOGOS[i.dataset.logo];if(L){i.style.background=L.bg;i.innerHTML=`<svg viewBox="${L.vb}" fill="${L.fg}"><path d="${L.p}"/></svg>`}});
const MQ=PRODUCTS.filter(p=>p.cat!=="Bundle"&&p.cat!=="18+");
const mqItem=p=>{const L=LOGOS[LOGO_OF[p.name]],href="/services/"+slug(p.name)+"/";
  if(!L)return `<a class="mi" href="${href}" style="--c:${p.color}"><b class="mi-i" style="background:${p.color}">${p.name[0].toUpperCase()}</b>${p.name}</a>`;
  return `<a class="mi" href="${href}" style="--c:${L.bg==="#1E2545"?"#fff":L.bg}"><svg viewBox="${L.vb}" style="width:${Math.min(76,Math.round(22*L.a))}px;height:22px"><path d="${L.p}"/></svg>${p.name}</a>`};
$("#mqTrack").innerHTML=MQ.map(mqItem).join("")+MQ.map(mqItem).join("").replace(/<a class="mi"/g,'<a class="mi" tabindex="-1" aria-hidden="true"');
