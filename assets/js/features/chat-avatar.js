/* Floating support avatar: faces swap every few seconds and each one pops up a short, helpful message. */
// ===== Chat avatar =====
(function(){
  const root=$("#cw");if(!root)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;

  // One real person: the founder. Each popup asks a different question.
  const NAME="Muhammad Al-Amin";
  const QUESTIONS=[
    "Which subscription are you looking for today? 👋",
    "Want Netflix + Prime together and save more?",
    "Watching on TV, phone or both? I'll pick the right plan.",
    "Tell me your budget and I'll suggest the best plan.",
    "Prefer bKash, Nagad or card? I'll guide you.",
    "First time buying here? Ask me anything.",
    "Looking for Spotify, ChatGPT or Canva?",
    "Need a longer plan? It costs less per month.",
    "Want YouTube Premium without ads? Ask me about plans.",
    "Looking for ChatGPT, Claude or Gemini?",
    "Need an App Store or iTunes gift card?",
    "Not sure which plan fits? Tell me what you watch.",
    "Want Disney+, Hoichoi or Chorki? I have them.",
    "Need a VPN like NordVPN or Surfshark?",
    "Learning something? Ask me about Udemy and Skillshare.",
    "Want to renew your subscription? I'll help.",
    "Payment question? bKash, Nagad, Rocket and Upay all work.",
    "Prefer Messenger? You can message me there too."
  ];
  // Start at a random question, then go through the rest without repeating.
  const order=QUESTIONS.map((q,i)=>i).sort(()=>Math.random()-.5);

  const av=$("#cwAv"),bubble=$("#cwBubble"),nameEl=$("#cwName"),msgEl=$("#cwMsg");
  av.innerHTML=`<img src="/assets/img/brand/al-amin.webp" alt="${NAME}" width="160" height="160" decoding="async">`;
  // The small logo on the photo rotates WhatsApp, Messenger and Instagram; tapping the photo opens the one shown.
  const PL=[["wa","WhatsApp",()=>wa("Hi StreamX!")],["ms","Messenger",()=>"https://m.me/streamx.com.bd"],["ig","Instagram",()=>"https://instagram.com/streamx.com.bd"]];
  const badge=$("#cwBadge"),btn=$("#cwBtn");let pi=0;
  function plat(i){pi=i;const p=PL[i];badge.dataset.p=p[0];btn.href=p[2]();btn.setAttribute("aria-label",`Chat with ${NAME} on ${p[1]}`)}
  plat(0);if(!calm)setInterval(()=>{if(!document.hidden)plat((pi+1)%PL.length)},3200);
  let mi=0,paused=false,closed=false;
  try{closed=sessionStorage.getItem("sx_cw_x")==="1"}catch(e){}

  // setTimeout that waits while the visitor is hovering the widget
  const later=(fn,ms)=>setTimeout(function w(){paused?setTimeout(w,700):fn()},ms);
  function say(){
    nameEl.textContent=NAME;msgEl.classList.remove("cw-in");
    bubble.classList.add("cw-typing","show");
    later(()=>{msgEl.textContent=QUESTIONS[order[mi%order.length]];void msgEl.offsetWidth;msgEl.classList.add("cw-in");bubble.classList.remove("cw-typing")},calm?0:1100);
  }
  function run(first){
    if(closed){later(()=>run(false),9000);return}
    const t0=first?3500:1200;
    later(say,t0);
    later(()=>bubble.classList.remove("show"),t0+1100+6500);
    later(()=>{mi++;run(false)},t0+1100+6500+3500);
  }
  run(true);
  addEventListener("pointerover",e=>{if(e.target.closest&&e.target.closest("#cw"))paused=true});
  addEventListener("pointerout",e=>{if(e.target.closest&&e.target.closest("#cw"))paused=false});
  $("#cwX").onclick=e=>{e.preventDefault();bubble.classList.remove("show");closed=true;try{sessionStorage.setItem("sx_cw_x","1")}catch(x){}};
})();
