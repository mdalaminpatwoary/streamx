/* Front page: real logos in hero cards and moving strip. */
// ===== Front page: real logos (hero cards + moving strip) =====
document.querySelectorAll(".fc i[data-logo]").forEach(i=>{const L=LOGOS[i.dataset.logo];if(L){i.style.background=L.bg;i.innerHTML=`<svg viewBox="${L.vb}" fill="${L.fg}"><path d="${L.p}"/></svg>`}});
const MQ=[["netflix","Netflix"],["primevideo","Prime Video"],["spotify","Spotify"],["youtube","YouTube"],["openai","ChatGPT"],["canva","Canva"],["hbomax","HBO Max"],["paramountplus","Paramount+"],["hulu","Hulu"],["crunchyroll","Crunchyroll"],["claude","Claude"],["googlegemini","Gemini"],["nordvpn","NordVPN"],["surfshark","Surfshark"],["expressvpn","ExpressVPN"],["audible","Audible"],["scribd","Scribd"],["skillshare","Skillshare"]].filter(m=>LOGOS[m[0]]);
const mqItem=m=>{const L=LOGOS[m[0]];return `<span class="mi" style="--c:${L.bg==="#1E2545"?"#fff":L.bg}"><svg viewBox="${L.vb}" style="width:${Math.min(76,Math.round(22*L.a))}px;height:22px"><path d="${L.p}"/></svg>${m[1]}</span>`};
$("#mqTrack").innerHTML=MQ.map(mqItem).join("")+MQ.map(mqItem).join("");
