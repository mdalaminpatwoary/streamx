/* Logo tiles: real brand logo from logos.js, custom file, or a coloured letter. */
// Logo tiles (real brand logo from logos.js, else colored letter)
const tile=(slug,fb)=>{const L=LOGOS[slug];return L?`<span class="lg${L.a>2.4?" wide":""}" style="background:${L.bg};--c:${L.bg}"><svg viewBox="${L.vb}" fill="${L.fg}" aria-hidden="true"><path d="${L.p}"/></svg></span>`:fb};
// No built-in logo? Put your own file in assets/img/logos/<name>.svg or .png (see slug()) and it shows automatically.
const logoImg=n=>{const s=slug(n);return `<img class="limg" src="assets/img/logos/${s}.svg" alt="" onerror="if(!this.dataset.t){this.dataset.t=1;this.src='assets/img/logos/${s}.png'}else this.remove()">`};
const ptile=p=>tile(LOGO_OF[p.name],`<span class="lg" style="background:${p.color};--c:${p.color}">${p.icon}${logoImg(p.name)}</span>`);
