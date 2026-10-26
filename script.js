/* ===== EDIT HERE ===== */
const WA_NUMBER = "8801312850241"; // WhatsApp number (no + or spaces)
// ===== PRODUCT CATALOG (edit names, text and prices here) =====
// Popular products come first (the first 8 show on the page, 4 on phone).
const CATS=["Streaming","Music & Audio","AI Tools","Productivity","Learning","VPN","18+"];
const DUR={1:"1 Month",6:"6 Months",12:"1 Year",18:"18 Months"},UNIT={1:"month",6:"6 months",12:"year",18:"18 months"};
// V(plan type, badge, one-line summary, [features], [notes], {months: price in BDT})
const V=(n,tag,line,f,notes,pr)=>({n,tag,line,f,notes,plans:Object.entries(pr).map(([m,p])=>({m:+m,v:DUR[m],p}))});
const VPNN="VPN required for access",SHN="Shared profile, no customization",SLOW="Delivery takes some time",STOCK="Delivery depends on stock availability",ADULT="Adults only (18+)";
const PRIVF=["Profile name and PIN protected","Customizable profile","Instant delivery"];
const SH={1:180,6:800,12:1200},PR={1:250,6:1100,12:1900};
const GEMF=["5 TB Google storage","Activated on your own email"];
// [name, category, brand color, short description, [plan types]]
const CATALOG=[
["Netflix","Streaming","#e50914","Blockbusters and binge-worthy series in FHD / 4K, with four plan types to choose from.",[
 V("Share Profile","Most affordable","An affordable option for everyday streaming on mobile, tablet or web.",["Mobile, tablet and web","Single-device access","Automated household code","FHD / 4K quality","Instant delivery","Secure OTP-based login"],[SHN],{1:180,6:1000,12:1800}),
 V("Private Profile","Private","A personalized, PIN-protected profile with customization options.",["Mobile, tablet and web","Profile and PIN protected","Customizable profile","Single-device access","Automated household code","FHD / 4K quality","Instant delivery","Secure OTP-based login"],[],{1:300,6:1700,12:3100}),
 V("Single Slot","Most flexible","The most flexible plan, with TV support and multi-device access.",["Mobile, tablet, web and TV","Profile and PIN protected","Multi-device access","Customizable profile","FHD / 4K quality","Password-based login"],[STOCK],{1:350,6:1900,12:3600}),
 V("Signature Edition","Premium","A premium private-profile experience with TV support, instant delivery and priority service.",["Mobile, tablet, web and TV","Profile and PIN protected","Customizable profile","Single-device access","FHD / 4K quality","Instant delivery","Secure OTP-based login","Hassle-free priority service for signature clients"],[],{1:400,6:2240,12:4200})]],
["Amazon Prime Video","Streaming","#00a8e1","Prime originals, movies and series in FHD / 4K, on your own PIN-protected profile.",[
 V("Standard","","Prime Video with a personal, PIN-protected profile at an everyday price.",["Profile and PIN protected","Customizable profile","FHD / 4K quality","Instant delivery"],[],{1:100,6:400,12:600})]],
["Spotify","Music & Audio","#1db954","Ad-free music on your own email, with a Bangladesh or Global region plan.",[
 V("Bangladesh Region","Instant","Ad-free music for listeners in Bangladesh.",["Works in Bangladesh only","Activated on your own email","Instant delivery"],[],{1:135,6:780,12:1440}),
 V("Global Region","Any country","Ad-free music that works in any country.",["Works in any country","Activated on your own email"],[SLOW],{1:200,6:1000,12:1650})]],
["YouTube Premium","Streaming","#ff0000","Ad-free videos and background play on your own email, for Android, web or Apple.",[
 V("Android & Web","Auto renewal","Ad-free YouTube with background play, for Android and web.",["Works on Android and web","Activated on your own email","Automatic renewal","Instant delivery"],[],{1:185,6:1000,12:1900}),
 V("Apple Users","iPhone & iPad","Ad-free YouTube for Apple users, activated on your own email.",["Designed for Apple users","Activated on your own email"],["Invitation must be accepted every month",STOCK],{1:200,6:1100,12:2000})]],
["ChatGPT","AI Tools","#10a37f","Your everyday AI assistant, as a shared or personal account, renewable or ready-made.",[
 V("Share · Non-renewable","Lowest price","A shared account at the lowest price.",["Shared account","Single-device access"],["Non-renewable"],{1:250,6:1200,12:2000}),
 V("Share · Renewable","Renewable","A shared account that you can renew.",["Shared account","Single-device access","Renewable"],[],{1:350,6:1800,12:3000}),
 V("Personal · Ready-made","Personal","A personal, ready-made account with multi-device access.",["Personal account","Ready-made account","Multi-device access"],["Non-renewable"],{1:1800}),
 V("Personal · Your Email","Renewable","A personal plan activated on your own email.",["Activated on your own email","Renewable","Multi-device access"],[],{1:2550})]],
["Canva","Productivity","#00c4cc","Design posts, logos and presentations with premium tools via an Edu Team invite.",[
 V("Edu Team","","Premium design tools through an Edu Team invite plan.",["Edu Team invite plan","Activated on your own email","Instant delivery"],[],{1:50,6:100,12:150})]],
["HBO Max","Streaming","#5b2bd6","Prestige series and blockbuster films, on a shared or private profile.",[
 V("Share Profile","Most affordable","A shared profile for everyday viewing.",["Instant delivery"],[SHN],SH),
 V("Private Profile","Private","Your own profile, name and PIN.",PRIVF,[],PR)]],
["Disney+","Streaming","#113ccf","Disney, Pixar, Marvel and Star Wars favorites, on a shared or private profile.",[
 V("Share Profile","Most affordable","A shared profile for everyday viewing.",["Single-device access","Instant delivery"],[SHN,VPNN],SH),
 V("Private Profile","Private","Your own profile, name and PIN.",PRIVF,[VPNN],PR)]],
["Paramount+","Streaming","#0064ff","Hit series and movies from Paramount, on a shared or private profile.",[
 V("Share Profile","Most affordable","A shared profile for everyday viewing.",["Single-device access","Instant delivery"],[SHN,VPNN],SH),
 V("Private Profile","Private","Your own profile, name and PIN.",PRIVF,[VPNN],PR)]],
["Hulu","Streaming","#1ce783","Popular series and originals, on a shared or private profile.",[
 V("Share Profile","Most affordable","A shared profile for everyday viewing.",["Single-device access","Instant delivery"],[SHN,VPNN],SH),
 V("Private Profile","Private","Your own profile, name and PIN.",PRIVF,[VPNN],PR)]],
["JioHotstar","Streaming","#1f4fb4","Movies, series and live sports in HD or FHD / 4K quality.",[
 V("HD Plan","HD","Everyday viewing in HD quality.",["HD quality","Single-device access"],[VPNN,SLOW],{1:300,6:1400,12:2200}),
 V("FHD / 4K Plan","FHD / 4K","The sharpest quality for bigger screens.",["FHD / 4K quality","Single-device access"],[VPNN,SLOW],{1:400,6:1800,12:2600})]],
["Crunchyroll","Streaming","#f47521","The world of anime on your own private, PIN-protected profile.",[
 V("Private Profile","","Your own profile, name and PIN.",PRIVF,[],{1:100,6:400,12:700})]],
["ZEE5","Streaming","#8230c6","Series, movies and originals on an affordable ad-supported plan.",[
 V("With Ads","","An ad-supported plan at an everyday price.",["Single-device access","Instant delivery"],["Ad-supported plan",VPNN],{1:160,6:675,12:1100})]],
["Hoichoi","Streaming","#e11d48","Bangla originals, series and films with simple OTP-based login.",[
 V("OTP Login","","Bangla originals with simple, secure OTP-based login.",["Single-device access","Secure OTP-based login"],[],{1:80,6:360,12:580})]],
["Chorki","Streaming","#0ea5e9","Bangla series, films and originals on a PIN-protected profile.",[
 V("Profile & PIN","","Bangla originals on a PIN-protected profile.",["Single-device access","Profile and PIN protected"],[],{1:80,6:360,12:580})]],
["NordVPN","VPN","#4687ff","A fast, secure VPN for private browsing, with OTP-based login.",[
 V("Standard","","A fast, secure VPN for private browsing.",["Single-device access","Secure OTP-based login"],[],{1:200,6:1000,12:1500})]],
["Surfshark","VPN","#1ebfbf","A secure VPN for everyday privacy, with simple code-based login.",[
 V("Standard","","A secure VPN for everyday privacy.",["Single-device access","Code-based login"],[],{1:100,6:500,12:800})]],
["ExpressVPN","VPN","#da3940","A premium VPN for private, secure browsing on a single device.",[
 V("Standard","","A premium VPN for private, secure browsing.",["Single-device access"],[],{1:300,6:1500,12:2000})]],
["Claude","AI Tools","#d97757","Claude AI on your own email, renewable and ready for multiple devices.",[
 V("Pro","","Claude activated on your own email.",["Activated on your own email","Renewable","Multi-device access"],[],{1:2700})]],
["Gemini Pro","AI Tools","#4285f4","Gemini Pro with 5 TB Google storage, on long-lasting 18-month plans.",[
 V("Family","No warranty","Family plan activated on your own email.",GEMF,["No warranty"],{18:250}),
 V("Family + Warranty","6-month warranty","Family plan with a 6-month warranty.",[...GEMF,"6-month warranty"],[],{18:500}),
 V("Individual","No warranty","Individual plan that can be shared with up to 5 people.",[...GEMF,"Can be shared with up to 5 people"],["No warranty"],{18:500}),
 V("Individual + Warranty","6-month warranty","Individual plan with a 6-month warranty.",[...GEMF,"Can be shared with up to 5 people","6-month warranty"],[],{18:1000})]],
["Google One","Productivity","#4285f4","5 TB of cloud storage with Gemini Pro included, on your own email.",[
 V("Family","No warranty","Family plan with 5 TB storage and Gemini Pro.",[...GEMF,"Includes Gemini Pro"],["No warranty"],{18:250}),
 V("Family + Warranty","6-month warranty","Family plan with a 6-month warranty.",[...GEMF,"Includes Gemini Pro","6-month warranty"],[],{18:500}),
 V("Individual","No warranty","Individual plan that can be shared with up to 5 people.",[...GEMF,"Includes Gemini Pro","Can be shared with up to 5 people"],["No warranty"],{18:500}),
 V("Individual + Warranty","6-month warranty","Individual plan with a 6-month warranty.",[...GEMF,"Includes Gemini Pro","Can be shared with up to 5 people","6-month warranty"],[],{18:1000})]],
["CapCut","Productivity","#111827","Pro video editing, as a ready-made account or on your own email.",[
 V("Ready-made Account","Instant","A ready-to-use Pro account, delivered instantly.",["Pro plan","Instant delivery"],[],{1:450}),
 V("On Your Email","Pro","The Pro plan activated on your own email.",["Pro plan","Activated on your own email"],[SLOW],{1:800,6:2500,12:4500})]],
["Quetext","Productivity","#0ea5e9","A plagiarism checker and writing tool, activated on your own email.",[
 V("Essential Plan","","Essential plan activated on your own email.",["Activated on your own email"],[SLOW],{1:750}),
 V("Professional Plan","","Professional plan activated on your own email.",["Activated on your own email"],[SLOW],{1:1550})]],
["Truecaller","Productivity","#0099ff","Premium caller ID and spam protection, activated on your own number.",[
 V("Premium","","Premium caller ID, activated on your own number.",["Activated on your own number","Instant delivery"],[],{1:100,6:400,12:700})]],
["Audible","Music & Audio","#f8991d","Audiobooks and originals to enjoy anywhere, activated on your own email.",[
 V("Standard","","Audiobooks and originals on your own email.",["Activated on your own email"],[SLOW],{1:200})]],
["Scribd","Learning","#1e7b85","Books, audiobooks and documents to read, activated on your own email.",[
 V("Standard","","Unlimited reading on your own email.",["Activated on your own email"],[SLOW],{1:200})]],
["Skillshare","Learning","#0f766e","A full year of creative classes, activated on your own email.",[
 V("Annual","","A full year of creative classes.",["Activated on your own email"],[SLOW],{12:2000})]],
["Ullu","18+","#374151","An adults-only (18+) streaming service on an affordable plan.",[
 V("Standard","","An adults-only streaming service.",["Single-device access","Instant delivery"],[ADULT],{1:100,6:400,12:600})]],
["ALTT","18+","#374151","An adults-only (18+) streaming service on an affordable plan.",[
 V("Standard","","An adults-only streaming service.",["Single-device access","Instant delivery"],[ADULT],{1:120,6:500,12:750})]],
["Atrangii","18+","#374151","An adults-only (18+) streaming service on an affordable plan.",[
 V("Standard","","An adults-only streaming service.",["Single-device access","Instant delivery"],[ADULT],{1:120,6:500,12:800})]],
["FapHouse","18+","#374151","An adults-only (18+) service with a premium plan.",[
 V("Premium","","The premium plan of an adults-only service.",["Premium plan","Single-device access","Instant delivery"],[ADULT],{1:250,6:1000,12:1500})]],
["Entertainment Combo","Bundle","#E50914","Netflix + Prime Video",[V("Packs","","",[],[],{1:230})]]
];
const PRODUCTS=CATALOG.map(([name,cat,color,desc,variants])=>({name,cat,color,desc,icon:name[0],variants}));
const entry=p=>p.variants.flatMap(v=>v.plans).reduce((a,b)=>b.p<a.p?b:a); // starting (cheapest) plan
// Entertainment Combo packs: shown when a customer opens the combo (monthly price, "old" = regular price)
const PACKS=[
 {n:"Pack 1",sub:"Entry pack with a shared Netflix profile",p:230,old:280,f:["Netflix: shared profile","Prime Video: private profile","Phone and web access"]},
 {n:"Pack 2",sub:"Private profiles with full control",p:350,old:400,f:["Netflix: private profile","Prime Video: private profile","Phone and web access","Custom profile name and PIN"]},
 {n:"Pack 3",sub:"Built for the big screen",p:400,old:450,tag:"Popular for TV",hot:true,f:["Netflix: private profile","Prime Video: private profile","Phone, web and TV access","Dedicated TV pack","Custom profile name and PIN"]},
 {n:"Pack 4",sub:"The complete, worry-free experience",p:450,old:500,tag:"Signature",f:["Netflix: private profile","Prime Video: private profile","Phone, web and TV access","Custom profile name and PIN","Reliable, hassle-free service"]}
];
PRODUCTS.forEach(p=>{if(p.name==="Entertainment Combo"){p.packs=PACKS;p.variants[0].plans=PACKS.map(k=>({m:1,v:k.n,p:k.p}))}});
// Reviews: replace with your real customer reviews
const REVIEWS = [
  // company, loc, services, fb, ig = shown in the details card (leave "" to hide). popular:true = shown in the "Popular review" spotlight. Use each customer's own Facebook / Instagram link.
// role = designation shown under the name (e.g. "Student", "Business Owner"). photo = profile picture. cover = optional wide cover image (if empty, the photo is used as a blurred cover). Example: photo:"images/rafiq.jpg", cover:"images/rafiq-cover.jpg"
  {n:"Rafiq Hasan", role:"Software Engineer", company:"CodeNest Technologies", loc:"Dhaka", services:["Netflix", "Spotify"], fb:"https://www.facebook.com/", ig:"https://www.instagram.com/", popular:true, s:5, t:"Got my Netflix in 5 minutes. Very fast and honest service. Highly recommended!", p:"Netflix", photo:""},
  {n:"Tania Akter", role:"University Student", company:"", loc:"Chattogram", services:["Spotify"], fb:"https://www.facebook.com/", ig:"https://www.instagram.com/", s:5, t:"Spotify price is great and support replied quickly on WhatsApp. Smooth payment with bKash.", p:"Spotify", photo:""},
  {n:"Sabbir Mahmud", role:"Video Editor", company:"FrameLab Studio", loc:"Dhaka", services:["YouTube Premium", "CapCut"], fb:"https://www.facebook.com/", ig:"https://www.instagram.com/", popular:true, s:5, t:"YouTube Premium works perfectly. I renewed for 12 months and saved a lot.", p:"YouTube Premium", photo:""},
  {n:"Nusrat Jahan", role:"Medical Student", company:"", loc:"Sylhet", services:["ChatGPT"], fb:"https://www.facebook.com/", ig:"https://www.instagram.com/", popular:true, s:5, t:"Bought ChatGPT for my studies. Delivery was instant and the team is very polite.", p:"ChatGPT", photo:""},
  {n:"Imran Khan", role:"Business Owner", company:"Khan Traders", loc:"Dhaka", services:["Entertainment Combo"], fb:"https://www.facebook.com/", ig:"https://www.instagram.com/", s:4, t:"Good prices and clear process. Had a small issue, they replaced it within minutes.", p:"Entertainment Combo", photo:""},
  {n:"Mehjabin Sultana", role:"Boutique Owner", company:"Mehjabin's Boutique", loc:"Khulna", services:["Canva"], fb:"https://www.facebook.com/", ig:"https://www.instagram.com/", popular:true, s:5, t:"Canva for my small business. Trusted seller, 24/7 support is real.", p:"Canva", photo:""},
  {n:"Fahim Rahman", role:"Graphic Designer", company:"Studio Fahim", loc:"Rajshahi", services:["CapCut", "Canva"], fb:"https://www.facebook.com/", ig:"https://www.instagram.com/", s:5, t:"Bought Canva and CapCut together. Genuine service and very fair price.", p:"Canva", photo:""},
  {n:"Sadia Islam", role:"Digital Marketer", company:"GrowMore Agency", loc:"Dhaka", services:["Disney+"], fb:"https://www.facebook.com/", ig:"https://www.instagram.com/", s:5, t:"Fast reply even late at night. My Disney+ account was ready in minutes.", p:"Disney+", photo:""}
];
/* ===================== */

const wa = t => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const $ = s => document.querySelector(s);
const taka = n => "৳" + n.toLocaleString("en-US");

// Products grid + search + category filter
// Helpers: bag icon + number count animation
const BAG='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';
const SHARE='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>',CHECK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';
function tween(el,from,to,ms=700,pre=""){const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);el.textContent=pre+Math.round(from+(to-from)*e).toLocaleString("en-US");if(k<1)requestAnimationFrame(f)})(t0)}
// Logo tiles (real brand logo from logos.js, else colored letter)
const tile=(slug,fb)=>{const L=LOGOS[slug];return L?`<span class="lg${L.a>2.4?" wide":""}" style="background:${L.bg};--c:${L.bg}"><svg viewBox="${L.vb}" fill="${L.fg}" aria-hidden="true"><path d="${L.p}"/></svg></span>`:fb};
const slug=n=>n.toLowerCase().replace(/\+/g,"plus").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
// No built-in logo? Put your own file in images/logos/<name>.svg or .png (see slug()) and it shows automatically.
const logoImg=n=>{const s=slug(n);return `<img class="limg" src="images/logos/${s}.svg" alt="" onerror="if(!this.dataset.t){this.dataset.t=1;this.src='images/logos/${s}.png'}else this.remove()">`};
const ptile=p=>tile(LOGO_OF[p.name],`<span class="lg" style="background:${p.color};--c:${p.color}">${p.icon}${logoImg(p.name)}</span>`);
const mq=matchMedia("(max-width:600px)");let PAGE=mq.matches?4:8; // phone shows 4 first
let cat="All",q="",limit=PAGE,view=[],sortKey="rec";
// Sort factors: popularity (list order), price, name, newest (added last), category
const SORTS={rec:(a,b)=>a[1]-b[1],pa:(a,b)=>entry(a[0]).p-entry(b[0]).p||a[1]-b[1],pd:(a,b)=>entry(b[0]).p-entry(a[0]).p||a[1]-b[1],az:(a,b)=>a[0].name.localeCompare(b[0].name),za:(a,b)=>b[0].name.localeCompare(a[0].name),new:(a,b)=>b[1]-a[1],cat:(a,b)=>a[0].cat.localeCompare(b[0].cat)||a[1]-b[1]};
const card=(p,i,d=0)=>`<div class="card pc" style="animation-delay:${d}ms" onclick="showPlans(${i},true)">
  <div class="ph">${ptile(p)}<span class="cat">${p.cat}</span></div>
  <h3>${p.name}</h3><p>${p.desc}</p>
  <div class="pf"><div class="pr"><small>From</small> <b>${taka(entry(p).p)}</b> <small>/ ${UNIT[entry(p).m]}</small></div><button class="go" aria-label="View plans">→</button></div></div>`;
const bcard=(p,i)=>`<div class="card bd" onclick="showPlans(${i},true)">
  <div class="bl2"><span class="sv">Save up to ${taka(Math.max(...p.packs.map(k=>k.old-k.p)))} / month</span>
  <div class="stk">${PARTS[p.name].map(s=>tile(s,`<span class="lg" style="background:#1E2545">${s[0].toUpperCase()}</span>`)).join("")}</div>
  <h3>${p.name}</h3><ul class="inc">${p.desc.split(" + ").map(x=>`<li>${x}</li>`).join("")}<li>${p.packs.length} packs: shared or private profiles</li><li>Phone, web and TV access options</li></ul></div>
  <div class="br"><div class="pr"><small>From</small> <b>${taka(entry(p).p)}</b> <small>/ month</small> <s>${taka(p.packs[0].old)}</s></div>
  <div class="pks">${p.packs.map(k=>`<span class="pk">${k.n} <b>${taka(k.p)}</b></span>`).join("")}</div>
  <button class="btn grad-bg">View ${p.packs.length} packs →</button></div></div>`;
function renderProducts(){
  view=PRODUCTS.map((p,i)=>[p,i]).filter(([p])=>p.cat!=="Bundle"&&(cat==="All"||p.cat===cat)&&(p.name+" "+p.variants.map(v=>v.n).join(" ")).toLowerCase().includes(q)).sort(SORTS[sortKey]);
  $("#productGrid").innerHTML=view.slice(0,limit).map(([p,i],n)=>card(p,i,n%8*60)).join("")||'<p class="empty">No product found.</p>';
  syncMore();
}
function syncMore(){
  $("#count").innerHTML=`Showing ${Math.min(limit,view.length)} of ${view.length} products<div class="prog"><i style="width:${Math.min(100,limit/Math.max(view.length,1)*100)}%"></i></div>`;
  const b=$("#loadMore");b.style.display=view.length>PAGE?"":"none";
  b.textContent=limit>=view.length?"Show less ↑":`Load more · ${view.length-limit} more ↓`;
}
$("#loadMore").onclick=()=>{
  if(limit>=view.length){limit=PAGE;renderProducts();$("#products").scrollIntoView();return}
  const from=limit;limit=view.length;
  $("#productGrid").insertAdjacentHTML("beforeend",view.slice(from).map(([p,i],n)=>card(p,i,n%8*60)).join(""));syncMore();
};
// 18+ category: adults-only confirmation (remembered for this visit)
let ageOK=false,agCb=null;try{ageOK=sessionStorage.getItem("sx_18")==="1"}catch(e){}
function askAge(cb){if(ageOK){cb();return}agCb=cb;$("#agate").classList.add("show")}
$("#agYes").onclick=()=>{ageOK=true;try{sessionStorage.setItem("sx_18","1")}catch(e){}$("#agate").classList.remove("show");const f=agCb;agCb=null;f&&f()};
$("#agNo").onclick=()=>{agCb=null;$("#agate").classList.remove("show")};
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#agate").classList.remove("show")});
function setCat(c){cat=c;limit=PAGE;document.querySelectorAll("#chips button").forEach(b=>b.classList.toggle("on",b.dataset.c===c));renderProducts()}
$("#chips").innerHTML=["All",...CATS].map(c=>`<button class="${c===cat?"on":""}" data-c="${c}">${c}</button>`).join("");
$("#chips").onclick=e=>{const c=e.target.dataset.c;if(!c)return;if(c==="18+"&&!ageOK)askAge(()=>setCat("18+"));else setCat(c)};
$("#sortBy").onchange=e=>{sortKey=e.target.value;limit=PAGE;renderProducts()};
$("#search").oninput=e=>{q=e.target.value.toLowerCase().trim();limit=PAGE;renderProducts()};
renderProducts();
$("#bundleGrid").innerHTML=PRODUCTS.map((p,i)=>p.cat==="Bundle"?bcard(p,i):"").join("");
mq.onchange=()=>{PAGE=mq.matches?4:8;limit=PAGE;renderProducts()};

// Pricing: choose a product, then the plan type, then how long
$("#pickProduct").innerHTML=[...CATS,"Bundle"].map(c=>`<optgroup label="${c==="Bundle"?"Premium Bundles":c==="18+"?"18+ (adults only)":c}">`+PRODUCTS.map((p,i)=>p.cat===c?`<option value="${i}">${p.name}</option>`:"").join("")+"</optgroup>").join("");
$("#pickProduct").onchange=e=>showPlans(+e.target.value);
let cur={i:0,v:0};
function showPlans(i,scroll,v=0){
  const p=PRODUCTS[i];
  if(p.cat==="18+"&&!ageOK){$("#pickProduct").value=cur.i;askAge(()=>showPlans(i,scroll,v));return}
  const pk=!!p.packs,multi=p.variants.length>1,vr=p.variants[v]||p.variants[0];cur={i,v};$("#pickProduct").value=i;
  $("#pLogo").innerHTML=pk?`<span class="stk">${PARTS[p.name].map(s=>tile(s,"")).join("")}</span>`:ptile(p);$("#pName").textContent=p.name;
  $("#pDesc").textContent=pk?"Netflix and Prime Video. Choose the pack that fits how you watch.":p.desc;
  document.querySelector("#pricing .note").textContent=pk?"* Prices are per month. Profile type and device access differ by pack. Please confirm availability on WhatsApp before you pay.":"* Prices are in BDT and may change. Please confirm your plan and availability on WhatsApp before you pay.";
  const T=$("#planTable");T.className=pk?"packs":"vlay";
  if(pk){
    T.innerHTML=p.packs.map((k,n)=>`<div class="pcard${k.hot?" best":""}" style="animation-delay:${n*90}ms"><button class="pshare" onclick="sharePlan(${i},0,${n})" aria-label="Share ${p.name} ${k.n}" title="Share this plan">${SHARE}</button>${k.tag?`<span class="tag">${k.tag}</span>`:""}
    <span class="dur">${k.n}</span><small class="sub">${k.sub}</small><div class="amt"><span class="cur">৳</span><b data-to="${k.p}">0</b></div>
    <small class="pm">per month · regular <s>${taka(k.old)}</s></small><span class="save">Save ${taka(k.old-k.p)}</span>
    <ul>${k.f.map(f=>`<li>${f}</li>`).join("")}</ul>
    <div class="actions"><button class="btn ghost" onclick="addToCart(${i},0,${n})">${BAG} Add to Cart</button>
    <a class="btn grad-bg" target="_blank" href="${wa(`Hi StreamX! I want to buy ${p.name} (${k.n}) - ${taka(k.p)} / month.`)}">Buy Now</a></div></div>`).join("");
  }else{
    const base=vr.plans.find(x=>x.m===1),many=vr.plans.length>1,label=p.name+(multi?" – "+vr.n:"");
    const tabs=multi?`<div class="vtabs" role="tablist">${p.variants.map((x,n)=>`<button class="vtab${n===v?" on":""}" role="tab" aria-selected="${n===v}" onclick="showPlans(${i},false,${n})">${x.n}</button>`).join("")}</div>`:"";
    const info=`<div class="vinfo">${vr.tag?`<span class="vtag">${vr.tag}</span>`:""}<h3>${multi?vr.n:"Plan details"}</h3><p>${vr.line}</p><ul class="vf">${vr.f.map(x=>`<li>${x}</li>`).join("")}</ul>${vr.notes.length?`<ul class="vn">${vr.notes.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}</div>`;
    const cards=vr.plans.map((pl,k)=>{
      const pct=base&&pl.m>1?Math.round((1-pl.p/(base.p*pl.m))*100):0,best=many&&k===vr.plans.length-1;
      return `<div class="pcard${best?" best":""}" style="animation-delay:${k*90}ms"><button class="pshare" onclick="sharePlan(${i},${v},${k})" aria-label="Share ${label} ${pl.v}" title="Share this plan">${SHARE}</button>${best?'<span class="tag">Best value</span>':""}
      <span class="dur">${pl.v}</span><div class="amt"><span class="cur">৳</span><b data-to="${pl.p}">0</b></div>
      <small class="pm">${pl.m>1?taka(Math.round(pl.p/pl.m))+" / month":"per month"}</small>
      <span class="save${pct>0?"":" mute"}">${pct>0?`Save ${pct}%`:(pl.m===1?"Monthly plan":"Fixed-term plan")}</span>
      <div class="actions"><button class="btn ghost" onclick="addToCart(${i},${v},${k})">${BAG} Add to Cart</button>
      <a class="btn grad-bg" target="_blank" href="${wa(`Hi StreamX! I want to buy ${label} (${pl.v}) - ${taka(pl.p)}.`)}">Buy Now</a></div></div>`}).join("");
    T.innerHTML=tabs+`<div class="vbody">${info}<div class="vplans">${cards}</div></div>`;
  }
  document.querySelectorAll("#planTable .amt b").forEach((b,k)=>setTimeout(()=>tween(b,0,+b.dataset.to,900),k*110));
  if(scroll)$("#pricing").scrollIntoView();
}
showPlans(0);

// Reviews: popular spotlight (one after another), moving rows, click for full story
const initials=n=>n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const ph=r=>r.photo?`<img src="${r.photo}" alt="${r.n}" loading="lazy" onerror="this.remove()">`:"";
const THUMB='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
const FBI='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>',IGI='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>';
const GR=[["#ED3124","#B4233C"],["#4F6BFF","#1E2F8F"],["#FF6F61","#D9363E"],["#2DD4BF","#0E6E80"],["#8B9DFF","#3B4BC8"],["#FF5B4D","#8E2A5C"],["#34D399","#0B6B4B"],["#60A5FA","#1D4ED8"]];
const grad=i=>`--c1:${GR[i%GR.length][0]};--c2:${GR[i%GR.length][1]}`;
const subLine=r=>[r.role,r.company].filter(Boolean).join(" · ");
const svcOf=r=>r.services&&r.services.length?r.services:[r.p];
const svcTiles=(r,cls)=>svcOf(r).map(n=>{const p=PRODUCTS.find(x=>x.name===n);return `<span class="${cls}">${p?ptile(p):""}<em>${n}</em></span>`}).join("");
const rcard=(r,dup)=>{const i=REVIEWS.indexOf(r),p=PRODUCTS.find(x=>x.name===r.p);return `<figure class="rk2${dup?" dup":""}" data-r="${i}" tabindex="${dup?-1:0}" role="button" aria-label="Open ${r.n}'s story"${dup?' aria-hidden="true"':""}><div class="rk2-top"><span class="av4"><i>${initials(r.n)}${ph(r)}</i></span><div class="who2"><b>${r.n}</b><small>${r.role||"Customer"}</small></div><span class="rec">${THUMB}Recommends</span></div>
  <blockquote>${r.t}</blockquote><figcaption>${p?ptile(p):""}<span>${r.p}</span><span class="rk2-more">Details ↗</span></figcaption></figure>`};
(function(){
  const half=Math.ceil(REVIEWS.length/2),rows=[REVIEWS.slice(0,half),REVIEWS.slice(half)];
  rows.forEach((row,x)=>{if(!row.length)return;$("#rrow"+(x+1)).innerHTML=[0,1,2,3].map(c=>row.map(r=>rcard(r,c>0)).join("")).join("")});
})();
// popular spotlight: highlights one review after another
const POP=(()=>{const a=REVIEWS.map((r,i)=>i).filter(i=>REVIEWS[i].popular);return a.length?a:REVIEWS.slice(0,4).map((r,i)=>i)})();
let pk=0,pt,pPause=false;
function setPop(n){
  pk=(n+POP.length)%POP.length;const i=POP[pk],r=REVIEWS[i];
  $("#pop").innerHTML=`<div class="pstage" style="${grad(i)}" onclick="openReview(${i})"><div class="pimg"><span>${initials(r.n)}</span>${ph(r)}</div>${svcOf(r).slice(0,2).map((s,x)=>{const p=PRODUCTS.find(y=>y.name===s);return p?`<span class="pchip p${x}">${ptile(p)}<em>${s}</em></span>`:""}).join("")}</div>
  <div class="ptxt"><span class="eyebrow">Popular review</span>
  <blockquote>${r.t.split(" ").map((w,k)=>`<span class="w" style="animation-delay:${k*55+250}ms">${w}</span>`).join(" ")}</blockquote>
  <div class="pby"><b>${r.n}</b><span>${subLine(r)}</span></div><div class="psvc">${svcTiles(r,"sv")}</div>
  <button class="btn grad-bg" onclick="openReview(${i})">View full story →</button></div>
  <div class="ptabs">${POP.map((j,x)=>`<button class="ptab${x===pk?" on":""}" onclick="setPop(${x})"><b>${REVIEWS[j].n}</b><small>${REVIEWS[j].role}</small></button>`).join("")}</div>`;
  clearTimeout(pt);pt=setTimeout(function t(){pPause?pt=setTimeout(t,1000):setPop(pk+1)},7500);
}
$("#pop").onmouseenter=()=>pPause=true;$("#pop").onmouseleave=()=>pPause=false;
setPop(0);
// full story card
function openReview(i){
  const r=REVIEWS[i],info=[["Designation",r.role],["Company",r.company],["Location",r.loc]].filter(x=>x[1]);
  $("#rmb").innerHTML=`<button class="rm-x" aria-label="Close">✕</button><div class="rm-cover" style="${grad(i)}"></div>
  <div class="rm-body" style="${grad(i)}"><div class="rm-av"><i>${initials(r.n)}</i>${ph(r)}</div>
  <div class="rm-head rm-i" style="--n:0"><h3>${r.n}</h3><p>${subLine(r)||"Customer"}</p><span class="rec">${THUMB}Recommends StreamX</span></div>
  <blockquote class="rm-i" style="--n:1">“${r.t}”</blockquote>
  ${info.length?`<div class="rm-grid rm-i" style="--n:2">${info.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join("")}</div>`:""}
  <h4 class="rm-i" style="--n:3">Services taken</h4><div class="rm-svc rm-i" style="--n:3">${svcTiles(r,"sv2")}</div>
  ${r.fb||r.ig?`<div class="rm-soc rm-i" style="--n:4">${r.fb?`<a class="s-fb" href="${r.fb}" target="_blank" rel="noopener">${FBI}Facebook</a>`:""}${r.ig?`<a class="s-ig" href="${r.ig}" target="_blank" rel="noopener">${IGI}Instagram</a>`:""}</div>`:""}</div>`;
  $("#rmodal").classList.add("show");document.documentElement.style.overflow="hidden";
}
function closeReview(){$("#rmodal").classList.remove("show");document.documentElement.style.overflow=""}
document.addEventListener("click",e=>{
  const c=e.target.closest(".rk2[data-r]");if(c)openReview(+c.dataset.r);
  if(e.target.id==="rmodal"||e.target.closest(".rm-x"))closeReview();
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape")closeReview();
  if(e.key==="Enter"&&e.target.matches&&e.target.matches(".rk2[data-r]"))openReview(+e.target.dataset.r);
});

// WhatsApp links
document.querySelectorAll("[data-wa]").forEach(a=>{a.href=wa(a.dataset.wa);a.target="_blank"});

// Mobile menu
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").onclick = e => { if(e.target.tagName==="A") $("#menu").classList.remove("open"); };

// Language toggle (English / Bangla)
let bn = false;
document.querySelectorAll("[data-bn]").forEach(e=>e.dataset.en=e.innerHTML);
$("#lang").onclick = () => {
  bn = !bn;
  document.querySelectorAll("[data-bn]").forEach(e=>e.innerHTML = bn ? e.dataset.bn : e.dataset.en);
  $("#lang").textContent = bn ? "English" : "বাংলা";
};

// ===== Cart / checkout card (saved in the browser) =====
let cart=[],shown=0,tip=0;try{cart=JSON.parse(localStorage.getItem("sx_cart"))||[]}catch(e){}
const saveCart=()=>{try{localStorage.setItem("sx_cart",JSON.stringify(cart))}catch(e){}};
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),2200)}
function openCart(o=true){const d=$("#drawer");d.classList.toggle("open",o);$("#overlay").classList.toggle("show",o);if(o){d.classList.add("opening");setTimeout(()=>d.classList.remove("opening"),1300)}}
function addToCart(i,v,k){
  const p=PRODUCTS[i],vr=p.variants[v],pl=vr.plans[k],vn=p.variants.length>1?vr.n:"",id=[p.name,vr.n,pl.v].join("|"),x=cart.find(c=>c.id===id);
  x?x.q++:cart.push({id,name:p.name,vr:vn,v:pl.v,p:pl.p,q:1,fresh:true});
  renderCart();toast(`✓ ${p.name}${vn?" – "+vn:""} (${pl.v}) added to cart`);
  const b=$("#cartBtn");b.classList.remove("bump");void b.offsetWidth;b.classList.add("bump");
}
function changeQty(j,d){cart[j].bump=true;cart[j].q+=d;if(cart[j].q<1)cart.splice(j,1);renderCart()}
function removeItem(j){const el=$("#cartItems").children[j];if(!el||el.classList.contains("out"))return;el.classList.add("out");setTimeout(()=>{cart.splice(j,1);renderCart()},380)}
function renderCart(){
  const n=cart.reduce((s,c)=>s+c.q,0),total=cart.reduce((s,c)=>s+c.q*c.p,0);
  $("#cartCount").textContent=n;$("#cartCount").style.display=n?"grid":"none";
  $("#cartItems").innerHTML=cart.length?cart.map((c,j)=>`<div class="ci${c.fresh?" new":""}" style="--k:${j}">${ptile({name:c.name,color:"#1E2545",icon:c.name[0]})}<div class="cn"><b>${c.name}</b><small>${c.vr?c.vr+" · ":""}${c.v} · ${taka(c.p)}</small></div>
    <div class="qty"><button onclick="changeQty(${j},-1)">−</button><span${c.bump?' class="pop"':""}>${c.q}</span><button onclick="changeQty(${j},1)">+</button></div><button class="rm" onclick="removeItem(${j})" aria-label="Remove ${c.name}">✕</button></div>`).join(""):`<div class="empty"><span class="eb">${BAG}</span><p>Your cart is empty.<br>Add a plan to get started.</p></div>`;
  const grand=total+tip;tween($("#cartTotal"),shown,grand,600,"৳");shown=grand;$("#tipRow").classList.toggle("show",tip>0&&cart.length>0);$("#tipVal").textContent=taka(tip);
  const msg="Hi StreamX! I want to order:\n"+cart.map((c,j)=>`${j+1}. ${c.name}${c.vr?" – "+c.vr:""} (${c.v}) x${c.q} - ${taka(c.p*c.q)}`).join("\n")+(tip>0?`\nSubtotal: ${taka(total)}\nTip: ${taka(tip)}`:"")+`\nTotal: ${taka(grand)}`+($("#cmIn").value.trim()?`\nComment: ${$("#cmIn").value.trim()}`:"");
  const co=$("#checkout");co.href=cart.length?wa(msg):"#";co.classList.toggle("off",!cart.length);
  cart.forEach(c=>{c.fresh=false;c.bump=false});$("#cartItemsN").textContent=n;$("#cartSub").textContent=n?`· ${n} item${n>1?"s":""}`:"";saveCart();
}
$("#cartBtn").onclick=()=>openCart(true);
$("#closeCart").onclick=$("#overlay").onclick=()=>openCart(false);
$("#clearCart").onclick=()=>{cart=[];resetTip();renderCart()};
document.onkeydown=e=>{if(e.key==="Escape"){openCart(false);$("#mdl").classList.remove("show")}};
renderCart();
// Optional tip (default ৳0) and optional comment
const TIPS=[0,20,50,100];
$("#tipChips").innerHTML=TIPS.map(v=>`<button type="button" class="tc${v?"":" on"}" data-v="${v}">${taka(v)}</button>`).join("")+'<button type="button" class="tc" data-v="c">Custom</button>';
function setTip(v){tip=Math.max(0,Math.min(5000,Math.floor(+v)||0));renderCart()}
function resetTip(){tip=0;$("#tipIn").value="";$("#tipIn").classList.remove("show");$("#cmIn").value="";document.querySelectorAll("#tipChips .tc").forEach((x,i)=>x.classList.toggle("on",i===0))}
$("#tipChips").onclick=e=>{const b=e.target.closest(".tc");if(!b)return;document.querySelectorAll("#tipChips .tc").forEach(x=>x.classList.toggle("on",x===b));const c=b.dataset.v==="c";$("#tipIn").classList.toggle("show",c);if(c){$("#tipIn").focus();setTip($("#tipIn").value)}else{$("#tipIn").value="";setTip(b.dataset.v)}};
$("#tipIn").oninput=e=>setTip(e.target.value);
$("#cmT").onclick=()=>{const o=$("#cmBox").classList.toggle("open");$("#cmT").setAttribute("aria-expanded",o);if(o)$("#cmIn").focus()};
$("#cmIn").oninput=()=>renderCart();

// ===== Why StreamX (interactive list + animated panel) =====
// [icon, title, row text, panel headline, panel text]
const ICONS={"bolt": "<path d=\"M13 2 3 14h9l-1 8 10-12h-9l1-8z\"/>", "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\"/><circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/>", "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/><path d=\"m9 12 2 2 4-4\"/>", "chat": "<path d=\"M7.9 20A9 9 0 1 0 4 16.1L2 22Z\"/>", "card": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\"/><path d=\"M2 10h20\"/>", "heart": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\"/>", "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>", "done": "<path d=\"M21.801 10A10 10 0 1 1 17 3.335\"/><path d=\"m9 11 3 3L22 4\"/>", "pin": "<path d=\"M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>"};
const ic=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const WHY=[
 ["bolt","Quick delivery","Once your order and payment are confirmed, we get your subscription moving.","Fast, from the first message.","Message us, pay, and your subscription starts moving without the long wait."],
 ["tag","Affordable plans","Choose the duration that makes sense for you, with sample pricing shown clearly.","Prices that make sense.","Pick 1, 6 or 12 months and see the price clearly before you order."],
 ["shield","Replacement warranty","If an eligible subscription has an issue during its stated period, message us for help.","Covered when it counts.","If an eligible plan has a problem, message us and we help you sort it out."],
 ["chat","WhatsApp support","Talk to a person about plans, payment or delivery—any time you need to reach us.","A real person replies.","Ask about plans, payment or delivery directly on WhatsApp."],
 ["card","Local payment options","Pay via bKash, Nagad, Rocket, Upay or bank transfer.","Local when it matters.","Payment, ordering and support shaped around how you actually want to buy."],
 ["heart","Customer-first service","Clear steps, direct communication and help when you need it.","Made for you.","Clear steps and direct help from the first message to your renewal."]
];
$("#whyList").innerHTML=WHY.map((d,k)=>`<div class="wi" style="--k:${k}" data-k="${k}"><div class="wic">${ic(d[0])}</div><div><h3>${d[1]}</h3><p>${d[2]}</p></div><span class="wn">0${k+1}</span></div>`).join("");
let wi=-1,wt,paused=false;
function setWhy(i){
  if(i===wi)return;wi=i;const d=WHY[i];
  $("#wc").textContent=`0${i+1}—0${WHY.length}`;$("#wg").innerHTML=ic(d[0]);$("#wh").textContent=d[3];$("#wd").textContent=d[4];
  document.querySelectorAll(".wi").forEach((e,k)=>e.classList.toggle("on",k===i));
  const p=$("#whyPanel");p.classList.remove("sw");void p.offsetWidth;p.classList.add("sw");
  clearTimeout(wt);wt=setTimeout(function tick(){paused?wt=setTimeout(tick,1000):setWhy((wi+1)%WHY.length)},4500);
}
$("#whyList").onmouseover=$("#whyList").onclick=e=>{const r=e.target.closest(".wi");if(r)setWhy(+r.dataset.k)};
$(".why").onmouseenter=()=>paused=true;$(".why").onmouseleave=()=>paused=false;
setWhy(0);

// ===== FAQ (animated accordion) =====
const FAQS=[
 ["How long does delivery take?","Many plans are delivered instantly after we confirm your payment. Plans activated on your own email, or marked as depending on stock, can take longer. Each plan lists its delivery type."],
 ["Can I try the service before I pay?","StreamX offers delivery before payment on select subscriptions. Message us on WhatsApp and we'll let you know if your chosen plan is eligible."],
 ["Is it safe to buy from StreamX?","We are an independent reseller. You message us directly on WhatsApp, see the price first and pay with local methods you already use."],
 ["What if my account stops working?","Message us on WhatsApp. If it is an eligible subscription within its stated period, we will fix or replace it."],
 ["Can I choose how long I subscribe?","Yes. Most products come in 1 month, 6 month and 1 year plans, and some in 18 month plans. Longer plans usually cost less per month."],
 ["Can I renew?","Yes. Message us before your validity ends and we will help you renew."],
 ["Which payment methods do you accept?","bKash, Nagad, Rocket, Upay and bank transfer. Send the payment, then share the Transaction ID on WhatsApp."],
 ["How do I order?","Choose a plan, tap Buy Now or add items to your cart, then send the order on WhatsApp. We reply with payment details."]
];
$("#faqList").innerHTML=FAQS.map((f,k)=>`<div class="fq${k===0?" on":""}" style="--k:${k}"><button class="fqb" aria-expanded="${k===0}"><span class="fn">0${k+1}</span><span class="fqq">${f[0]}</span><span class="fpl">+</span></button><div class="fqa"><div><p>${f[1]}</p></div></div></div>`).join("");
$("#faqList").onclick=e=>{
  const b=e.target.closest(".fqb");if(!b)return;const r=b.parentNode,open=r.classList.contains("on");
  document.querySelectorAll(".fq").forEach(x=>{x.classList.remove("on");x.firstChild.setAttribute("aria-expanded","false")});
  if(!open){r.classList.add("on");b.setAttribute("aria-expanded","true")}
};

// ===== Header: light and smooth (rAF + IntersectionObserver scroll-spy) =====
const nav=$("#nav"),ind=$("#ind"),links=[...document.querySelectorAll("#menu a")];const rail=$("#rail"),pct=$("#pct");let rt,lastY=0,ticking=false,curLink=links[0];
function setActive(a){if(!a)return;curLink=a;links.forEach(l=>l.classList.toggle("on",l===a));if(innerWidth>860){ind.style.width=a.offsetWidth+"px";ind.style.transform=`translateX(${a.offsetLeft}px)`}}
function frame(){
  ticking=false;const y=scrollY,dy=y-lastY,max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  nav.classList.toggle("scrolled",y>30);
  nav.classList.remove("hide");lastY=y;
  const sp=Math.min(1,y/max);document.documentElement.style.setProperty("--sp",sp.toFixed(4));pct.textContent=Math.round(sp*100)+"%";rail.classList.add("show");clearTimeout(rt);rt=setTimeout(()=>rail.classList.remove("show"),1100);
  if(y>=max-4)setActive(links[links.length-1]);
}
addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(frame)}},{passive:true});
const spy=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(links.find(a=>a.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-35% 0px -60% 0px"});
links.forEach(a=>{const s=document.querySelector(a.getAttribute("href"));s&&spy.observe(s)});
addEventListener("resize",()=>setActive(curLink));
$("#lang").addEventListener("click",()=>setTimeout(()=>setActive(curLink),40));
setActive(links[0]);frame();

// ===== Policy pop-ups (edit the text here) =====
const POL={
 about:["About StreamX",["StreamX is an independent digital subscription reseller based in Dhaka, Bangladesh.","We help people get premium streaming, music, AI and productivity subscriptions at local prices, with simple ordering and support on WhatsApp.","You can pay with bKash, Nagad, Rocket, Upay or bank transfer."]],
 terms:["Terms & Condition",["By placing an order with StreamX you agree to these terms.","1. Orders are confirmed on WhatsApp. Please check the product, plan, validity and price before you pay.","2. Prices on the website are examples and can change. The price confirmed on WhatsApp is the final price.","3. Your subscription is valid for the period you chose. Renewal needs a new order.","4. StreamX is an independent reseller and is not affiliated with the brands shown. Brand names and logos belong to their owners.","5. Please follow each service's own rules and use the subscription only for yourself.","Questions? Message us on WhatsApp +880 1312-850241."]],
 return:["Return Policy",["Digital subscriptions are delivered electronically, so they cannot be returned like physical goods.","If an eligible subscription has a problem during its stated validity, message us on WhatsApp with your order details and Transaction ID. We will help fix or replace it.","Any refund is reviewed case by case after we check the order.","Contact: WhatsApp +880 1312-850241 · Dogair, Demra, Dhaka - 1361."]]
};
document.addEventListener("click",e=>{const a=e.target.closest("[data-pol]");if(a){e.preventDefault();const d=POL[a.dataset.pol];$("#mdlt").textContent=d[0];$("#mdlc").innerHTML=d[1].map(t=>`<p>${t}</p>`).join("");$("#mdl").classList.add("show")}});
$("#mdl").onclick=e=>{if(e.target.id==="mdl"||e.target.closest(".mdlx"))$("#mdl").classList.remove("show")};

// ===== Apple-style scroll motion (hero fade/parallax + zoom-in sections) =====
const zooms=[...document.querySelectorAll(".zoom")],heroEl=$("#home");let tk=false;
function motion(){
  tk=false;const vh=innerHeight;
  heroEl.style.setProperty("--hs",Math.min(1,scrollY/(vh*.8)).toFixed(3));
  zooms.forEach(el=>{const r=el.getBoundingClientRect(),p=Math.min(1,Math.max(0,(vh-r.top)/(vh*.55)));el.style.transform=`scale(${(.9+.1*p).toFixed(3)})`;el.style.opacity=(.2+.8*p).toFixed(3)});
}
addEventListener("scroll",()=>{if(!tk){tk=true;requestAnimationFrame(motion)}},{passive:true});motion();

// ===== Typing text in the search box (soft blinking caret, no "|" character) =====
(function(){
  const inp=$("#search"),box=$("#sbox"),out=$("#typedTxt"),words=["Netflix","Prime Video","Spotify","ChatGPT","YouTube Premium","Canva","NordVPN","Claude"];
  inp.addEventListener("input",()=>box.classList.toggle("has",!!inp.value));
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){box.classList.add("still");return}
  let w=0,i=0,del=false;
  (function tick(){
    if(document.activeElement===inp||inp.value){setTimeout(tick,600);return}
    const word=words[w];let d=del?40:90;
    if(!del){i++;if(i>=word.length){i=word.length;del=true;d=1600}}
    else{i--;if(i<=0){i=0;del=false;w=(w+1)%words.length;d=500}}
    out.textContent="Search "+word.slice(0,i);
    setTimeout(tick,d);
  })();
})();

// ===== Section dividers draw themselves; chat button shrinks to an icon =====
const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("seen");so.unobserve(e.target)}}),{threshold:.05});
document.querySelectorAll(".sec").forEach(s=>so.observe(s));
setTimeout(()=>{const f=$(".float");f&&f.classList.add("min")},6000);

// ===== Front page: real logos (hero cards + moving strip) =====
document.querySelectorAll(".fc i[data-logo]").forEach(i=>{const L=LOGOS[i.dataset.logo];if(L){i.style.background=L.bg;i.innerHTML=`<svg viewBox="${L.vb}" fill="${L.fg}"><path d="${L.p}"/></svg>`}});
const MQ=[["netflix","Netflix"],["primevideo","Prime Video"],["spotify","Spotify"],["youtube","YouTube"],["openai","ChatGPT"],["canva","Canva"],["hbomax","HBO Max"],["paramountplus","Paramount+"],["hulu","Hulu"],["crunchyroll","Crunchyroll"],["claude","Claude"],["googlegemini","Gemini"],["nordvpn","NordVPN"],["surfshark","Surfshark"],["expressvpn","ExpressVPN"],["audible","Audible"],["scribd","Scribd"],["skillshare","Skillshare"]].filter(m=>LOGOS[m[0]]);
const mqItem=m=>{const L=LOGOS[m[0]];return `<span class="mi" style="--c:${L.bg==="#1E2545"?"#fff":L.bg}"><svg viewBox="${L.vb}" style="width:${Math.min(76,Math.round(22*L.a))}px;height:22px"><path d="${L.p}"/></svg>${m[1]}</span>`};
$("#mqTrack").innerHTML=MQ.map(mqItem).join("")+MQ.map(mqItem).join("");

// ===== Stats: count up when visible (services counted automatically) =====
const svcEl=document.querySelector("[data-svc]");if(svcEl)svcEl.dataset.to=PRODUCTS.filter(p=>p.cat!=="Bundle").length;
const sio=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;sio.unobserve(e.target);e.target.classList.add("on");
  const b=e.target.querySelector("b"),to=+b.dataset.to,suf=b.dataset.suf||"",plain=b.dataset.plain,from=plain?to-25:0,t0=performance.now();
  (function f(t){const k=Math.min(1,(t-t0)/1600),v=Math.round(from+(to-from)*(1-Math.pow(1-k,4)));b.innerHTML=(plain?v:v.toLocaleString("en-US"))+(suf?`<em>${suf}</em>`:"");if(k<1)requestAnimationFrame(f)})(t0);
}),{threshold:.4});
document.querySelectorAll(".stat").forEach(s=>sio.observe(s));

// ===== Stats extras (real reviewers, service logos, years) + footer shortcuts =====
(function(){
  const f=$("#faces");
  f.innerHTML=`<div class="fcs">${REVIEWS.slice(0,5).map(r=>`<span><i>${initials(r.n)}</i>${ph(r)}</span>`).join("")}</div><div class="frt"><strong>Recommended</strong><small>by customers on Facebook</small></div>`;
  const shown=MQ.slice(0,6),total=PRODUCTS.filter(p=>p.cat!=="Bundle").length;
  $("#slogos").innerHTML=shown.map(m=>tile(m[0],"")).join("")+`<span class="more">+${total-shown.length} more</span>`;
  const since=+document.querySelector(".yr b").dataset.to,y=new Date().getFullYear()-since;
  $("#yrs").textContent=y>=1?`Serving Bangladesh for ${y} year${y>1?"s":""} with local payment options.`:"Just getting started, serving Bangladesh with local payments.";
})();
document.addEventListener("click",e=>{const a=e.target.closest("[data-plan]");if(!a)return;e.preventDefault();const i=PRODUCTS.findIndex(p=>p.name===a.dataset.plan);if(i>-1)showPlans(i,true)});

// ===== Four steps: the highlight moves through each step =====
(function(){
  const box=$("#steps"),st=[...box.querySelectorAll(".jn")];let k=-1,t;
  const go=n=>{k=n;st.forEach((s,x)=>s.classList.toggle("act",x===k));clearTimeout(t);t=setTimeout(()=>go((k+1)%st.length),2600)};
  new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){box.classList.add("play");if(k<0)go(0)}}),{threshold:.1}).observe(box);
  st.forEach((s,x)=>s.addEventListener("mouseenter",()=>go(x)));
})();

// ===== Try before you pay: customer chooses the service, plan type and duration =====
const TRY_LIST=["Netflix","Spotify","YouTube Premium","Amazon Prime Video","ChatGPT","Canva","NordVPN","Disney+"]; // quick choices (edit this list)
const TRY_SHORT={"Amazon Prime Video":"Prime Video","YouTube Premium":"YouTube"};
const tpIdx=n=>PRODUCTS.findIndex(p=>p.name===n),tp={i:Math.max(0,tpIdx(TRY_LIST[0])),v:0,k:0};
$("#tpGrid").innerHTML=TRY_LIST.map(n=>{const i=tpIdx(n);return i<0?"":`<button class="tpb" data-i="${i}" aria-pressed="false">${ptile(PRODUCTS[i])}<span>${TRY_SHORT[n]||n}</span><i class="tpk">✓</i></button>`}).join("");
$("#tpSel").innerHTML='<option value="">Or choose another service…</option>'+[...CATS.filter(c=>c!=="18+"),"Bundle"].map(c=>`<optgroup label="${c==="Bundle"?"Bundles":c}">`+PRODUCTS.map((p,i)=>p.cat===c?`<option value="${i}">${p.name}</option>`:"").join("")+"</optgroup>").join("");
function tpPick(i,v=0,k=0){tp.i=i;tp.v=v;tp.k=k;tpDraw()}
function tpDraw(){
  const p=PRODUCTS[tp.i],vr=p.variants[tp.v],pl=vr.plans[tp.k],multi=p.variants.length>1,quick=TRY_LIST.some(n=>tpIdx(n)===tp.i);
  document.querySelectorAll(".tpb").forEach(b=>{const on=+b.dataset.i===tp.i;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
  $("#tpSel").value=quick?"":tp.i;
  $("#tpPlans").innerHTML=(multi?`<div class="tp-sub">Plan type</div><div class="tp-row">${p.variants.map((x,n)=>`<button class="tpp tv${n===tp.v?" on":""}" data-v="${n}"><b>${x.n}</b></button>`).join("")}</div>`:"")+`<div class="tp-sub">Duration</div><div class="tp-row">${vr.plans.map((x,n)=>`<button class="tpp${n===tp.k?" on":""}" data-k="${n}"><b>${x.v}</b><small>${taka(x.p)}</small></button>`).join("")}</div>`;
  $("#tpSum").innerHTML=`<span class="tps">${ptile(p)}<span><b>${p.name}</b><small>${multi?vr.n+" · ":""}${pl.v}</small></span></span><span class="tpv">${taka(pl.p)}<small>Plan price</small></span>`;
  $("#tpGo").href=wa(`Hi StreamX! I'd like to try before paying: ${p.name}${multi?" – "+vr.n:""} (${pl.v}, ${taka(pl.p)}). Is this plan eligible?`);
}
$("#tryPick").addEventListener("click",e=>{const b=e.target.closest(".tpb"),t=e.target.closest(".tpp");if(b)tpPick(+b.dataset.i);else if(t&&t.dataset.v!==undefined)tpPick(tp.i,+t.dataset.v,0);else if(t)tpPick(tp.i,tp.v,+t.dataset.k)});
$("#tpSel").onchange=e=>{if(e.target.value!=="")tpPick(+e.target.value)};
document.querySelector(".try-link a").addEventListener("click",()=>{if(PRODUCTS[cur.i].cat!=="18+")tpPick(cur.i,cur.v)});
tpDraw();

// ===== Feedback form (message opens in WhatsApp, ready to send) =====
(function(){
  const L=["Poor","Fair","Okay","Good","Great"],d='<circle cx="12" cy="12" r="10"/>',eyes='<path d="M9 9h.01M15 9h.01"/>';
  const FACES=[d+'<path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M7.5 8 10 9"/><path d="m14 9 2.5-1"/>',d+'<path d="M16 16s-1.5-2-4-2-4 2-4 2"/>'+eyes,d+'<path d="M8 15h8"/>'+eyes,d+'<path d="M8 14s1.5 2 4 2 4-2 4-2"/>'+eyes,d+'<path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z"/>'+eyes];
  const m=$("#fdk"),faces=$("#fdkFaces"),chips=$("#fdkChips"),sel=$("#fdkSvc"),msg=$("#fdkMsg"),nm=$("#fdkName"),hint=$("#fdkHint"),form=$("#fdkForm"),st={r:0,t:"Suggestion"};
  faces.innerHTML=FACES.map((s,i)=>`<button type="button" class="fdk-face" data-r="${i+1}" aria-label="${L[i]}"><svg viewBox="0 0 24 24" aria-hidden="true">${s}</svg><small>${L[i]}</small></button>`).join("");
  chips.innerHTML=["Suggestion","Problem","Compliment","Question"].map((t,i)=>`<button type="button" class="fdk-chip${i?"":" on"}" data-t="${t}">${t}</button>`).join("");
  sel.innerHTML='<option value="">Not specified</option>'+[...CATS.filter(c=>c!=="18+"),"Bundle"].map(c=>`<optgroup label="${c==="Bundle"?"Bundles":c}">`+PRODUCTS.filter(p=>p.cat===c).map(p=>`<option>${p.name}</option>`).join("")+"</optgroup>").join("");
  const open=()=>{m.classList.remove("sent");m.classList.add("show");document.documentElement.style.overflow="hidden"};
  const close=()=>{m.classList.remove("show");document.documentElement.style.overflow=""};
  faces.onclick=e=>{const b=e.target.closest(".fdk-face");if(!b)return;st.r=+b.dataset.r;faces.querySelectorAll(".fdk-face").forEach(x=>x.classList.toggle("on",x===b));hint.textContent=""};
  chips.onclick=e=>{const b=e.target.closest(".fdk-chip");if(!b)return;st.t=b.dataset.t;chips.querySelectorAll(".fdk-chip").forEach(x=>x.classList.toggle("on",x===b))};
  const warn=t=>{hint.textContent=t;hint.classList.remove("shake");void hint.offsetWidth;hint.classList.add("shake")};
  form.onsubmit=e=>{
    e.preventDefault();
    if(!st.r)return warn("Please choose how your experience was.");
    if(msg.value.trim().length<5)return warn("Please write a short message.");
    const text=`Hi StreamX! Here is my feedback.\nExperience: ${st.r}/5 (${L[st.r-1]})\nTopic: ${st.t}\n`+(sel.value?`Service: ${sel.value}\n`:"")+(nm.value.trim()?`Name: ${nm.value.trim()}\n`:"")+`Message: ${msg.value.trim()}`;
    window.open(wa(text),"_blank","noopener");hint.textContent="";m.classList.add("sent");
  };
  document.addEventListener("click",e=>{
    if(e.target.closest("[data-fdk]")){e.preventDefault();open()}
    else if(e.target===m||e.target.closest(".fdk-x,.fdk-close"))close();
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
})();

// ===== Share a plan: phone share sheet, or copy link. The link opens that plan. =====
function planLink(i,v,k){return location.href.split("#")[0]+"#plan="+slug(PRODUCTS[i].name)+"&v="+v+"&k="+k}
function sharePlan(i,v,k){
  const p=PRODUCTS[i],vr=p.variants[v],pl=vr.plans[k],url=planLink(i,v,k),btn=document.querySelectorAll("#planTable .pshare")[k];
  const text=`${p.name}${p.variants.length>1?" – "+vr.n:""} · ${pl.v} · ${taka(pl.p)}${p.packs?" / month":""} on StreamX. Prices may change, check the latest here:`;
  const ok=()=>{if(!btn)return;btn.classList.add("done");btn.innerHTML=CHECK;setTimeout(()=>{btn.classList.remove("done");btn.innerHTML=SHARE},1800)};
  if(navigator.share){navigator.share({title:"StreamX · "+p.name,text,url}).then(ok).catch(()=>{});return}
  const full=text+" "+url,done=()=>{toast("Link copied. Paste it anywhere to share.");ok()};
  (navigator.clipboard?navigator.clipboard.writeText(full):Promise.reject()).then(done).catch(()=>{const t=document.createElement("textarea");t.value=full;document.body.appendChild(t);t.select();try{document.execCommand("copy");done()}catch(e){toast("Could not copy the link.")}t.remove()});
}
function openFromHash(){
  const m=location.hash.match(/^#plan=([^&]+)(?:&v=(\d+))?(?:&k=(\d+))?/);if(!m)return;
  const i=PRODUCTS.findIndex(p=>slug(p.name)===decodeURIComponent(m[1]));if(i<0)return;
  showPlans(i,true,+(m[2]||0));
  const c=document.querySelectorAll("#planTable .pcard")[+(m[3]||0)];if(c){c.classList.add("glow");setTimeout(()=>c.classList.remove("glow"),3400)}
}
addEventListener("hashchange",openFromHash);setTimeout(openFromHash,500);

// Fade-in on scroll (with small stagger)
document.querySelectorAll(".card:not(.pc):not(.rc),details,.final,.sec>h2").forEach(e=>e.classList.add("rv"));
const io = new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");setTimeout(()=>e.target.style.transitionDelay="0ms",1200)}}),{threshold:.1});
document.querySelectorAll(".rv").forEach(el=>{el.style.transitionDelay=([...el.parentNode.children].indexOf(el)%4*80)+"ms";io.observe(el)});
