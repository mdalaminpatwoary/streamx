/* Floating support avatar: faces swap every few seconds and each one pops up a short, helpful message. */
// ===== Chat avatar =====
(function(){
  const root=$("#cw");if(!root)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Four original illustrated agents (soft-shaded, semi-realistic flat style).
  const PEOPLE=[
    {name:"Ayesha",bg:["#ffb28f","#ed3124"],skin:["#f1c7a3","#d9a07a"],hair:["#3a2218","#1b100b"],suit:["#2a3366","#171c3d"],top:"#f4f6ff",style:"long",lip:"#c2475a",
     msgs:["Not sure which plan? Ask me. 👋","Netflix + Prime combos save you money."]},
    {name:"Rafi",bg:["#8fa2ff","#4f6bff"],skin:["#d9a47c","#b8825a"],hair:["#1b1511","#0b0908"],suit:["#1f2a44","#0f1626"],top:"#ffffff",style:"short",lip:"#a8604c",
     msgs:["Pay with bKash, Nagad or card.","Tap me, we reply in minutes."]},
    {name:"Nusrat",bg:["#c9a8ff","#7a4dff"],skin:["#e6b48e","#c98e68"],hair:["#4a2a1c","#22110a"],suit:["#3b2a63","#1e1438"],top:"#fdf1ff",style:"bun",lip:"#b8455f",
     msgs:["Need Spotify or ChatGPT today?","Questions on delivery? I'm here."]},
    {name:"Tanvir",bg:["#6fe3a5","#168a52"],skin:["#c98f64","#a56e48"],hair:["#16110e","#080605"],suit:["#2b2f3a","#14161d"],top:"#eaf2ff",style:"crop",lip:"#98563f",
     msgs:["Longer plans cost less per month.","Online 24/7. Say hi! 💬"]}
  ];
  const hairBack=(s,id)=>s==="long"?`<path d="M13 52c-3-22 3-42 19-42s22 20 19 42c-4 3-9 3-11 1V30H24v23c-2 2-7 2-11-1z" fill="url(#h${id})"/>`:s==="bun"?`<circle cx="32" cy="8.5" r="6.5" fill="url(#h${id})"/>`:"";
  const hairFront=(s,id)=>({
    long:`<path d="M19 31c1-10 7-15 14-15 8 0 12 6 13 15-4-4-8-6-13-6-6 0-10 2-14 6z" fill="url(#h${id})"/>`,
    short:`<path d="M18 29c-1-12 6-18 15-18 9 0 14 6 13 18-3-5-7-8-13-8s-11 3-15 8z" fill="url(#h${id})"/><path d="M24 15c4-2 9-2 13 0" stroke="#fff" stroke-opacity=".18" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    bun:`<path d="M18 31c0-11 6-17 15-17 8 0 14 6 14 17-4-5-8-8-14-8s-11 3-15 8z" fill="url(#h${id})"/>`,
    crop:`<path d="M19 28c0-10 5-16 14-16s14 6 14 16c-3-4-7-6-14-6s-11 2-14 6z" fill="url(#h${id})"/><path d="M24 29c2.5-1.5 4.5-2 8-2" stroke="#000" stroke-opacity=".25" stroke-width="1" fill="none"/>`}[s]);
  const face=(p,id)=>`<svg viewBox="0 0 64 64" aria-hidden="true"><defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient>
    <linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.skin[0]}"/><stop offset="1" stop-color="${p.skin[1]}"/></linearGradient>
    <linearGradient id="h${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.hair[0]}"/><stop offset="1" stop-color="${p.hair[1]}"/></linearGradient>
    <linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.suit[0]}"/><stop offset="1" stop-color="${p.suit[1]}"/></linearGradient>
    <radialGradient id="l${id}" cx=".3" cy=".1" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="64" height="64" fill="url(#g${id})"/>
    ${hairBack(p.style,id)}
    <path d="M6 70c0-13 11-19 26-19s26 6 26 19z" fill="url(#b${id})"/>
    <path d="M25 51l7 9 7-9-3-1-4 5-4-5z" fill="${p.top}"/>
    <path d="M26 44h12v8c0 3.5-12 3.5-12 0z" fill="url(#s${id})"/><path d="M26 49c3 2.5 9 2.5 12 0v-3H26z" fill="#000" opacity=".14"/>
    <ellipse cx="32" cy="32" rx="12" ry="13.6" fill="url(#s${id})"/>
    <ellipse cx="20.2" cy="33" rx="1.8" ry="3" fill="${p.skin[1]}"/><ellipse cx="43.8" cy="33" rx="1.8" ry="3" fill="${p.skin[1]}"/>
    ${hairFront(p.style,id)}
    <path d="M25 29.2c1.3-1 3.2-1.2 4.6-.5M34.4 28.7c1.4-.7 3.3-.5 4.6.5" stroke="${p.hair[1]}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="27.2" cy="32.4" rx="1.9" ry="2.2" fill="#fff"/><ellipse cx="36.8" cy="32.4" rx="1.9" ry="2.2" fill="#fff"/>
    <circle cx="27.4" cy="32.6" r="1.35" fill="#2a1a12"/><circle cx="36.6" cy="32.6" r="1.35" fill="#2a1a12"/><circle cx="27.9" cy="32.1" r=".45" fill="#fff"/><circle cx="37.1" cy="32.1" r=".45" fill="#fff"/>
    <path d="M31 33.5c-.6 2.2-1 3 .3 3.4" stroke="#000" stroke-opacity=".2" stroke-width="1" fill="none" stroke-linecap="round"/>
    <path d="M27.6 39.4c2.6 2.2 6.2 2.2 8.8 0" fill="${p.lip}" stroke="${p.lip}" stroke-width="1" stroke-linecap="round"/>
    <circle cx="24.5" cy="37" r="2.4" fill="#ff6b6b" opacity=".12"/><circle cx="39.5" cy="37" r="2.4" fill="#ff6b6b" opacity=".12"/>
    <path d="M19 31a13 13 0 0 1 26 0" fill="none" stroke="#e9ecf8" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
    <rect x="16.8" y="30.5" width="4" height="7.5" rx="2" fill="#e9ecf8"/><rect x="43.2" y="30.5" width="4" height="7.5" rx="2" fill="#e9ecf8"/>
    <path d="M45 37c0 5.5-4.5 8.5-9.5 8.5" fill="none" stroke="#e9ecf8" stroke-width="1.3" stroke-linecap="round"/><circle cx="35" cy="45.5" r="1.5" fill="#e9ecf8"/>
    <rect width="64" height="64" fill="url(#l${id})"/></svg>`;

  const av=$("#cwAv"),bubble=$("#cwBubble"),nameEl=$("#cwName"),msgEl=$("#cwMsg");
  av.innerHTML=PEOPLE.map((p,i)=>face(p,i)).join("");
  const faces=[...av.querySelectorAll("svg")];
  let cur=-1,mi=0,paused=false,closed=false;
  try{closed=sessionStorage.getItem("sx_cw_x")==="1"}catch(e){}

  // setTimeout that waits while the visitor is hovering the widget
  const later=(fn,ms)=>setTimeout(function w(){paused?setTimeout(w,700):fn()},ms);
  function swap(n){
    faces.forEach(f=>f.classList.remove("on","off"));
    if(cur>=0)faces[cur].classList.add("off");
    cur=n;void faces[cur].getBoundingClientRect();faces[cur].classList.add("on");
    $("#cwBtn").setAttribute("aria-label",`Chat with ${PEOPLE[cur].name} on WhatsApp`);
  }
  function say(){
    const p=PEOPLE[cur];nameEl.textContent=p.name;
    bubble.classList.add("cw-typing","show");
    later(()=>{msgEl.textContent=p.msgs[mi%p.msgs.length];bubble.classList.remove("cw-typing")},calm?0:1100);
  }
  function run(first){
    if(!first)swap((cur+1)%PEOPLE.length);
    if(closed){later(()=>run(false),9000);return}
    const t0=first?3500:1200;
    later(say,t0);
    later(()=>bubble.classList.remove("show"),t0+1100+6500);
    later(()=>{mi++;run(false)},t0+1100+6500+3500);
  }
  swap(0);run(true);
  addEventListener("pointerover",e=>{if(e.target.closest&&e.target.closest("#cw"))paused=true});
  addEventListener("pointerout",e=>{if(e.target.closest&&e.target.closest("#cw"))paused=false});
  $("#cwX").onclick=e=>{e.preventDefault();bubble.classList.remove("show");closed=true;try{sessionStorage.setItem("sx_cw_x","1")}catch(x){}};
})();
