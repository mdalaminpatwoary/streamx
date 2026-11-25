/* Site basics: WhatsApp links, mobile menu, English/Bangla toggle. */
// WhatsApp links
document.querySelectorAll("[data-wa]").forEach(a=>{a.href=wa(a.dataset.wa);a.target="_blank"});

// Mobile menu
(function(){
  var ICO={home:'<path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',products:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',trending:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',pricing:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',how:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>',reviews:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.200 9.500l6.100-.9z"/>',faq:'<circle cx="12" cy="12" r="9"/><path d="M9.500 9.300a2.600 2.600 0 1 1 3.700 2.300c-.8.400-1.200 1-1.200 1.800M12 17h.01"/>',contact:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20a4 4 0 0 1-4 2h-2"/>'};
  var m=$("#menu"),b=$("#burger");
  m.querySelectorAll(":scope>a").forEach(function(a,i){var k=(a.getAttribute("href")||"").replace("#","");a.style.setProperty("--i",i);a.insertAdjacentHTML("afterbegin",'<i class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICO[k]||ICO.home)+'</svg></i>')});
  var bg=document.createElement("div");bg.className="mn-bg";document.body.appendChild(bg);
  var tr=$("#acctBtn");
  /* On phones the profile button is the menu button: it opens the glass menu sheet (which has My account and Order on WhatsApp at the bottom) */
  function set(o){m.classList.toggle("open",o);bg.classList.toggle("on",o);if(b){b.textContent=o?"\u2715":"\u2630";b.setAttribute("aria-expanded",o?"true":"false")}if(tr){tr.classList.toggle("mn-on",o);if(innerWidth<=860)tr.setAttribute("aria-expanded",o?"true":"false")}document.documentElement.classList.toggle("mn-lock",o)}
  if(b)b.onclick=function(){set(!m.classList.contains("open"))};
  if(tr){tr.addEventListener("click",function(e){if(innerWidth>860||e.metaKey||e.ctrlKey||e.shiftKey||e.button===1)return;e.preventDefault();set(!m.classList.contains("open"))});if(innerWidth<=860){tr.setAttribute("aria-label","Menu and account");tr.title="Menu"}}
  bg.onclick=function(){set(false)};
  m.onclick=function(e){if(e.target.closest("a"))set(false)};
  document.addEventListener("keydown",function(e){if(e.key==="Escape")set(false)});
})();

// Language toggle (English / Bangla)
let bn = false;
document.querySelectorAll("[data-bn]").forEach(e=>e.dataset.en=e.innerHTML);


/* Warm up My account: fetch the signed-in customer's data in the background so the page opens instantly. */
(function(){var K="sx_session",P="sx_acc_pre",busy=false;
function pre(){var t;try{t=localStorage.getItem(K)}catch(e){}if(!t||busy)return;try{var j=JSON.parse(sessionStorage.getItem(P)||"null");if(j&&j.t===t&&Date.now()-j.at<60000)return}catch(e){}
busy=true;fetch("/api/account?a=me",{headers:{Authorization:"Bearer "+t}}).then(function(r){return r.ok?r.json():null}).then(function(d){if(d)try{sessionStorage.setItem(P,JSON.stringify({t:t,at:Date.now(),d:d}));var pf=d.profile||{};if(pf.name)localStorage.setItem("sx_nm",pf.name);if(pf.picture)localStorage.setItem("sx_av",JSON.stringify({p:pf.picture}));else localStorage.removeItem("sx_av")}catch(e){}}).catch(function(){}).then(function(){busy=false})}
var b=document.getElementById("acctBtn");if(b)["pointerenter","touchstart","focus"].forEach(function(e){b.addEventListener(e,pre,{passive:true})});
(window.requestIdleCallback||function(f){setTimeout(f,2500)})(pre)})();
