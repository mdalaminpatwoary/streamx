/* Floating support avatar: faces swap every few seconds and each one pops up a short, helpful message. */
// ===== Chat avatar =====
(function(){
  const root=$("#cw");if(!root)return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Four original illustrated agents (flat style). skin/hair/shirt/bg colours, hair style, headset.
  const PEOPLE=[
    {name:"Ayesha",bg:["#ff8a5c","#ed3124"],skin:"#e8b98f",hair:"#2a1a14",shirt:"#4f6bff",style:"long",
     msgs:["Hi! 👋 Not sure which plan to pick? Ask me.","Want Netflix and Prime together? Our combo packs save you money."]},
    {name:"Rafi",bg:["#6f86ff","#4f6bff"],skin:"#c98f64",hair:"#15110f",shirt:"#ed3124",style:"short",
     msgs:["Pay with bKash, Nagad, Rocket or a card. I'll help you check out.","Prefer to chat? Tap me and we reply in minutes."]},
    {name:"Nusrat",bg:["#b58bff","#7a4dff"],skin:"#d9a67d",hair:"#3b2218",shirt:"#25d366",style:"bun",
     msgs:["Need Spotify, YouTube Premium or ChatGPT today?","Got a question about delivery or warranty? I'm here."]},
    {name:"Tanvir",bg:["#35d07f","#168a52"],skin:"#b97b54",hair:"#0f0d0c",shirt:"#ffbf5e",style:"cap",
     msgs:["Looking for a lower price? Longer plans cost less per month.","We're online 24/7. Say hi on WhatsApp! 💬"]}
  ];
  const hair={
    long:(c)=>`<path d="M14 40c-2-18 6-30 18-30s20 12 18 30c-2 6-6 8-8 8V30H22v18c-2 0-6-2-8-8z" fill="${c}"/>`,
    short:(c)=>`<path d="M17 28c0-11 7-17 15-17s15 6 15 17c-4-5-9-7-15-7s-11 2-15 7z" fill="${c}"/>`,
    bun:(c)=>`<circle cx="32" cy="9" r="6.5" fill="${c}"/><path d="M16 30c0-12 6-18 16-18s16 6 16 18c-4-6-9-8-16-8s-12 2-16 8z" fill="${c}"/>`,
    cap:(c)=>`<path d="M16 26c0-12 7-17 16-17s16 5 16 17z" fill="#1d2347"/><path d="M14 27h30c0 3-4 4-8 4H16z" fill="#1d2347"/><path d="M32 9v5" stroke="${c}" stroke-width="2"/>`
  };
  const face=(p,id)=>`<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient></defs>
    <rect width="64" height="64" fill="url(#g${id})"/>
    ${p.style==="long"?hair.long(p.hair):""}
    <path d="M8 68c0-12 10-18 24-18s24 6 24 18z" fill="${p.shirt}"/>
    <path d="M26 46h12v8c0 3-12 3-12 0z" fill="${p.skin}"/>
    <ellipse cx="32" cy="32" rx="12.5" ry="14" fill="${p.skin}"/>
    ${p.style!=="long"?hair[p.style](p.hair):`<path d="M19 30c3-9 9-12 14-12 6 0 11 4 12 12-4-3-8-5-13-5s-10 2-13 5z" fill="${p.hair}"/>`}
    <circle cx="27" cy="33" r="1.7" fill="#1a1230"/><circle cx="37" cy="33" r="1.7" fill="#1a1230"/>
    <path d="M27 39c2 2.6 8 2.6 10 0" fill="none" stroke="#1a1230" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M18 31a14 14 0 0 1 28 0" fill="none" stroke="#10142a" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="15.5" y="30" width="4.5" height="8" rx="2.2" fill="#10142a"/><rect x="44" y="30" width="4.5" height="8" rx="2.2" fill="#10142a"/>
    <path d="M46 37c0 6-5 9-10 9" fill="none" stroke="#10142a" stroke-width="1.6" stroke-linecap="round"/><circle cx="35.5" cy="46" r="1.8" fill="#10142a"/></svg>`;

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
