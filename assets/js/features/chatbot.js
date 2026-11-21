/* StreamX assistant: instant answers from the site's own catalog, FAQ and policies. No AI service, no API key, no cost.
   It reads prices and plans, remembers what you asked about, compares services, guides a recommendation, lets you pick a plan and pay online
   from the chat, and hands over to a human on WhatsApp when it is unsure. */
(function(){
  const root=$("#cw");if(!root||typeof PRODUCTS==="undefined")return;
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches,NAME="Muhammad Al-Amin";
  const LIST=PRODUCTS.filter(p=>p.cat!=="18+"&&p.variants&&p.variants.length);
  const pl0=v=>v.plans&&v.plans[0];
  const minOf=p=>{const a=p.variants.map(v=>pl0(v)&&pl0(v).p).filter(x=>x>0);return a.length?Math.min.apply(null,a):0};
  const idx=p=>PRODUCTS.indexOf(p);
  const canPick=p=>!p.gift&&typeof buyNow==="function"&&p.variants.some(v=>v.plans&&v.plans.length);
  const norm=t=>(" "+String(t).toLowerCase().replace(/[^a-z0-9ঀ-৿]+/g," ").trim()+" ");
  const has=(q,k)=>/[^\x00-\x7f]/.test(k)?q.indexOf(k)>-1:k.length<=3?q.indexOf(" "+k+" ")>-1:q.indexOf(" "+k)>-1;
  const any=(q,ks)=>ks.reduce((n,k)=>n+(has(q,k)?(k.indexOf(" ")>0?2:1):0),0);
  const ctx={p:null,interest:null};

  /* ---------- product detection (with typo tolerance) ---------- */
  const ALIAS={"prime":"Amazon Prime Video","yt":"YouTube Premium","youtube":"YouTube Premium","gpt":"ChatGPT","chat gpt":"ChatGPT","hotstar":"JioHotstar","disney":"Disney+","nord":"NordVPN","express vpn":"ExpressVPN","google drive":"Google One","gemini":"Gemini Pro","adobe":"Adobe Express","apple music":"Apple Music","icloud":"Apple Gift Card","itunes":"Apple Gift Card","app store":"Apple Gift Card","bybit":"Bybit Card","redot":"RedotPay","poke pay":"PokePay"};
  const SKIP=["gift","the","one","pro","card","video"];
  const KEYS=[];
  LIST.forEach(p=>{const n=norm(p.name).trim();KEYS.push([n,p]);const f=n.split(" ")[0];if(f.length>=4&&f!==n&&SKIP.indexOf(f)<0)KEYS.push([f,p])});
  Object.keys(ALIAS).forEach(k=>{const p=LIST.find(x=>x.name===ALIAS[k]);if(p)KEYS.push([k,p])});
  function lev(a,b){if(Math.abs(a.length-b.length)>1)return 9;const m=[];for(let i=0;i<=a.length;i++){m[i]=[i];for(let j=1;j<=b.length;j++)m[i][j]=i?0:j}
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
  function findProducts(q){
    const out=[];KEYS.forEach(k=>{if(q.indexOf(" "+k[0]+" ")>-1||q.indexOf(" "+k[0])>-1&&k[0].length>=5){if(out.indexOf(k[1])<0)out.push(k[1])}});
    if(!out.length){const toks=q.trim().split(" ").filter(t=>t.length>=5);toks.forEach(t=>KEYS.forEach(k=>{if(k[0].indexOf(" ")<0&&k[0].length>=5&&lev(t,k[0])<=1&&out.indexOf(k[1])<0)out.push(k[1])}))}
    return out.slice(0,3);
  }

  /* ---------- building blocks ---------- */
  const btn=(label,href,extra)=>`<a class="bt-btn${extra||""}" href="${esc(href)}"${/^(https?|mailto):/.test(href)?' target="_blank" rel="noopener"':' data-close'}>${label}</a>`;
  const act=(label,a,d,extra)=>`<button type="button" class="bt-btn${extra||""}" data-act="${a}" ${d||""}>${label}</button>`;
  const waBtn=t=>btn("Chat on WhatsApp",wa(t||"Hi StreamX!"),"  bt-wa");
  const chips=a=>`<div class="bt-chips">${a.map((x,i)=>`<button type="button" class="bt-chip" style="--i:${i}" data-q="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;
  const faq=i=>FAQS[i]?`<p>${esc(FAQS[i][1])}</p>`:"";
  const cheap=n=>LIST.map(p=>[p,minOf(p)]).filter(x=>x[1]>0&&(!n||x[1]<=n)).sort((a,b)=>a[1]-b[1]);
  const logo=(f,a)=>`<img src="/assets/img/pay/${f}" alt="${a}" height="22" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:this.alt}))">`;
  const mini=a=>`<ul class="bt-mini">${a.map(x=>`<li><a href="#plan=${slug(x[0].name)}" data-close>${esc(x[0].name)}</a><b>${x[1]?"from "+taka(x[1]):"ask us"}</b></li>`).join("")}</ul>`;

  /* combo packs that include this service (e.g. Entertainment Combo = Netflix + Prime Video) */
  const comboOf=p=>{if(p.cat==="Bundle")return[];const n=norm(p.name).trim().replace(/^amazon /,"");return LIST.filter(b=>b.cat==="Bundle"&&b.packs&&norm(b.desc+" "+b.name).indexOf(" "+n)>-1)};
  const packRows=b=>`<ul>${b.packs.slice(0,4).map(k=>`<li><span>${esc(k.n)}<small class="bt-sm"> ${esc(k.tag||"")}</small></span><b>${taka(k.p)}${k.old>k.p?` <s>${taka(k.old)}</s>`:""}</b></li>`).join("")}</ul>`;
  function comboHtml(b){
    const best=b.packs.reduce((m,k)=>Math.max(m,(k.old||k.p)-k.p),0);
    return `<div class="bt-combo"><div class="bt-pt">Combo deal<em>${best?"Save up to "+taka(best):"Better together"}</em></div><p class="bt-cd">${esc(b.name)}: ${esc(b.desc)}, together in one pack (monthly price).</p>${packRows(b)}<div class="bt-row">${act("Choose combo &amp; pay online","pick",`data-i="${idx(b)}"`," bt-go")}${btn("View combo","#plan="+slug(b.name))}</div></div>`;
  }
  function productCard(p){
    if(p.packs)return `<div class="bt-card"><div class="bt-ct">${esc(p.name)}<em>${esc(p.cat)}</em></div><p class="bt-cd">${esc(p.desc)}, together in one pack (monthly price).</p>${packRows(p)}<p class="bt-pn"><i></i>Pay online with bKash, Nagad, Rocket, Upay or card</p><div class="bt-row">${act("Choose pack &amp; pay online","pick",`data-i="${idx(p)}"`," bt-go")}${btn("View combo","#plan="+slug(p.name))}${btn("WhatsApp",wa("Hi StreamX! I want the "+p.name+"."),"  bt-wa")}</div></div>`;
    const cb=comboOf(p).map(comboHtml).join("");
    return productCard1(p)+cb;
  }
  function productCard1(p){
    const rows=p.variants.slice(0,4).map(v=>{const x=pl0(v);return x?`<li><span>${esc(v.n)}</span><b>${taka(x.p)}<small> / ${esc(x.v.toLowerCase())}</small></b></li>`:""}).join("");
    const long=p.variants.map(v=>v.plans&&v.plans[v.plans.length-1]).filter(Boolean).sort((a,b)=>b.m-a.m)[0];
    const gift=p.gift&&typeof GIFT!=="undefined";
    return `<div class="bt-card"><div class="bt-ct">${esc(p.name)}<em>${esc(p.cat)}</em></div><p class="bt-cd">${esc(p.desc)}</p>`+
      (gift?`<p class="bt-cd">US region. ${taka(GIFT.rate(5))} per $1, any amount from $${GIFT.min} to $${GIFT.max} in steps of $${GIFT.step}.</p>`:rows?`<ul>${rows}</ul>`:"")+
      (!gift&&long&&long.m>1?`<p class="bt-cd">Longer plans cost less per month, up to ${esc(long.v.toLowerCase())}.</p>`:"")+
      (canPick(p)?`<p class="bt-pn"><i></i>Pay online with bKash, Nagad, Rocket, Upay or card</p>`:"")+
      `<div class="bt-row">${canPick(p)?act("Choose plan &amp; pay online","pick",`data-i="${idx(p)}"`," bt-go"):""}${btn("View plans","#plan="+slug(p.name))}${btn("WhatsApp",wa("Hi StreamX! I want "+p.name+"."),"  bt-wa")}</div></div>`;
  }
  const featOf=p=>{const f=p.variants[0].f||[];return f[0]||p.desc};
  function deviceLines(p){return `<ul class="bt-ul">`+p.variants.slice(0,4).map(v=>`<li><b>${esc(v.n)}</b>: ${esc((v.f||[]).find(x=>/mobile|tablet|web|tv|android|apple|device/i.test(x))||v.line)}</li>`).join("")+`</ul>`}
  function explainHtml(p){
    return `<div class="bt-card"><div class="bt-ct">${esc(p.name)}<em>Plan types</em></div><ul class="bt-ul">`+p.variants.map(v=>{const x=pl0(v);return `<li><b>${esc(v.n)}</b>${v.tag?` <em class="bt-tg">${esc(v.tag)}</em>`:""}<br><span class="bt-cd">${esc(v.line)}</span>${x?`<br><span class="bt-pr">from ${taka(x.p)} / ${esc(x.v.toLowerCase())}</span>`:""}</li>`}).join("")+`</ul>${canPick(p)?`<div class="bt-row">${act("Choose plan &amp; pay online","pick",`data-i="${idx(p)}"`," bt-go")}</div>`:""}</div>`;
  }
  function compareHtml(ps){
    const row=(k,f)=>`<tr><th>${k}</th>${ps.map(p=>`<td>${f(p)}</td>`).join("")}</tr>`;
    const long=p=>{const a=p.variants.map(v=>v.plans&&v.plans[v.plans.length-1]).filter(Boolean).sort((x,y)=>y.m-x.m)[0];return a?a.v:"-"};
    return `<div class="bt-card"><table class="bt-cmp"><thead><tr><th></th>${ps.map(p=>`<th>${esc(p.name)}</th>`).join("")}</tr></thead><tbody>`+
      row("From",p=>`<b>${minOf(p)?taka(minOf(p)):"ask"}</b>`)+row("Plan types",p=>p.variants.length)+row("Longest",long)+row("Highlight",p=>esc(featOf(p)))+`</tbody></table><div class="bt-row">${ps.map(p=>act(esc(p.name),"card",`data-i="${idx(p)}"`)).join("")}</div></div>`;
  }
  function budgetList(n,filter,label){
    const r=cheap(n).filter(x=>!filter||filter(x[0])).slice(0,6);
    if(!r.length)return `<p>I do not have a match${n?" under "+taka(n):""} there yet. Message us and we will find the best fit.</p>`+waBtn("Hi StreamX! "+(label||"Budget")+(n?" under "+taka(n):"")+". What do you suggest?");
    return `<p>${label?esc(label)+(n?" up to "+taka(n):""):n?"Plans you can get for "+taka(n)+" or less":"Our most affordable plans"} (1 month, from):</p>${mini(r)}`;
  }
  const I_WA='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97s-.47-.15-.67.15-.77.97-.94 1.16-.35.22-.64.08c-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06s-.02-.46.13-.6c.13-.13.3-.35.45-.52s.2-.3.3-.5.05-.37-.02-.52c-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41s.25-1.29.17-1.41c-.07-.13-.27-.2-.57-.35M12.05 21.8a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.9M20.5 3.49A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45c6.55 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.48-8.41"/></svg>';
  const I_MS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3C6.9 3 3 6.8 3 11.5c0 2.6 1.2 4.8 3.1 6.3V21l3-1.7c.9.2 1.8.4 2.9.4 5.1 0 9-3.8 9-8.5S17.1 3 12 3z"/><path d="m7.5 13.5 3.2-3.3 2.2 2 3.6-2.7"/></svg>';
  const I_IG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>';
  const agentHtml=()=>`<p>Sure. A real person is ready to help you.</p><div class="bt-agent"><div class="bt-ag-top"><span class="bt-ag-av"><img src="/assets/img/brand/al-amin.webp" alt="${NAME}" width="52" height="52"><i></i></span><div><b>${NAME}</b><small>StreamX &middot; available for help</small></div></div><a class="bt-ag-wa" href="${esc(wa("Hi Muhammad Al-Amin! I need help."))}" target="_blank" rel="noopener">${I_WA}<span>Chat on WhatsApp<small>+880 1312-850241 &middot; 24/7</small></span></a><div class="bt-ag-row"><a href="https://m.me/streamx.com.bd" target="_blank" rel="noopener">${I_MS}Messenger</a><a href="https://instagram.com/streamx.com.bd" target="_blank" rel="noopener">${I_IG}Instagram</a></div><a class="bt-ag-mail" href="mailto:streamx.com.bd@gmail.com">streamx.com.bd@gmail.com</a></div>`;
  const catsHtml=()=>{const m={};LIST.forEach(p=>{m[p.cat]=(m[p.cat]||0)+1});return `<p>We have ${LIST.length} services. Pick a group or type a service name:</p>`+chips(Object.keys(m).map(c=>c==="Bundle"?"Bundles":c).concat(["Help me choose"]))};
  const byCat=c=>{const a=LIST.filter(p=>p.cat===c||(c==="Bundles"&&p.cat==="Bundle"));return a.length?`<p>${esc(c)}:</p>${mini(a.map(p=>[p,minOf(p)]))}`:""};
  const payHtml=()=>`<p>You can pay online or manually. Online is the fastest.</p>
    <div class="bt-pay"><div class="bt-pt">Pay online<em>Recommended</em></div><div class="bt-logos">${logo("bkash.png","bKash")}${logo("nagad.png","Nagad")}${logo("rocket.png","Rocket")}${logo("upay.png","Upay")}${logo("visa.svg","Visa")}${logo("mastercard.svg","Mastercard")}</div>
    <ol class="bt-steps"><li>Choose a plan and tap <b>Pay online</b></li><li>Pick bKash, Nagad, Rocket, Upay or a card on EPS's secure page</li><li>Your payment is confirmed automatically</li><li>We send your delivery details</li></ol><div class="bt-row">${btn("Browse &amp; pay online","#pricing"," bt-go")}</div></div>
    <div class="bt-pay"><div class="bt-pt">Pay manually</div><p class="bt-cd">Send money by bKash, Nagad, Rocket, Upay or bank transfer, then share the Transaction ID on WhatsApp.</p><div class="bt-row">${waBtn("Hi StreamX! I want to pay manually.")}</div></div>`;

  /* ---------- plan picker: type, duration, then pay online / cart / WhatsApp ---------- */
  function typeHtml(p){
    const i=idx(p);
    if(p.variants.length<2)return durHtml(p,0);
    return `<p>Which plan type for ${esc(p.name)}?</p><div class="bt-opts">${p.variants.map((v,vi)=>`<button type="button" class="bt-opt" style="--i:${vi}" data-act="var" data-i="${i}" data-v="${vi}"><b>${esc(v.n)}</b><small>${esc(v.tag||v.line)}</small><span>${pl0(v)?"from "+taka(pl0(v).p):""}</span></button>`).join("")}</div>`;
  }
  function durHtml(p,vi){
    const v=p.variants[vi],b=pl0(v),i=idx(p);
    return `<p>${esc(p.name)}${p.variants.length>1?" · "+esc(v.n):""}: ${p.packs?"which pack?":"how long?"}</p><div class="bt-opts">${v.plans.map((x,k)=>{const mo=x.p/x.m,sv=Math.round((1-mo/(b.p/b.m))*100);return `<button type="button" class="bt-opt" style="--i:${k}" data-act="dur" data-i="${i}" data-v="${vi}" data-k="${k}"><b>${esc(x.v)}</b><small>${p.packs&&p.packs[k]?esc(p.packs[k].tag)+" · "+taka(x.p)+" / month":taka(Math.round(mo))+" / month"+(sv>=3&&k>0?" · save "+sv+"%":"")}</small><span>${taka(x.p)}</span></button>`}).join("")}</div>`;
  }
  function sumHtml(i,vi,k){
    const p=PRODUCTS[i],v=p.variants[vi],x=v.plans[k],d=`data-i="${i}" data-v="${vi}" data-k="${k}"`;
    return `<div class="bt-card bt-sum"><div class="bt-ct">${esc(p.name)}<em>${esc(x.v)}</em></div><p class="bt-cd">${p.variants.length>1?esc(v.n)+" · ":""}${esc(v.line)}</p><div class="bt-big">${taka(x.p)}</div>`+
      ((v.notes||[]).length?`<ul class="bt-notes">${v.notes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>`:"")+
      `<div class="bt-row">${act("Pay online","buy",d," bt-go")}${act("Add to cart","cart",d)}${btn("WhatsApp",wa(`Hi StreamX! I want ${p.name}${p.variants.length>1?" – "+v.n:""} (${x.v}) - ${taka(x.p)}.`),"  bt-wa")}</div><p class="bt-pn"><i></i>Secure payment on EPS: bKash, Nagad, Rocket, Upay or card</p></div>`;
  }

  /* ---------- guided recommendation ---------- */
  const INTERESTS={"Movies & series":p=>p.cat==="Streaming","Bangla shows":p=>["Hoichoi","Chorki"].indexOf(p.name)>-1,"Music":p=>p.cat==="Music & Audio","AI & study tools":p=>p.cat==="AI Tools","Design & editing":p=>p.cat==="Productivity","Learning":p=>p.cat==="Learning","VPN & privacy":p=>p.cat==="VPN"};

  /* ---------- knowledge base ---------- */
  const SHAREF=["Plans say whether they are single-device or multi-device, and whether the profile is shared or private."];
  const KB=[
   ["resetpw",["forgot","reset password","lost password","change password","password reset"],()=>({h:`<p>Your StreamX account has no password to remember: you sign in with a one-time code sent to your email.</p><p>For the password of a subscription we delivered, message us with the service name and your email and we will help.</p><div class="bt-row">${btn("Open My account","/account/")}${waBtn("Hi StreamX! I need help with my subscription password.")}</div>`,c:["My login details","Talk to a human"]})],
   ["changemail",["change email","change my email","wrong email","different email","update email","new email"],()=>({h:`<p>Plans activated on your own email cannot be moved by you. Message us with your order details and the correct email, and we will check what is possible.</p>`+waBtn("Hi StreamX! I need to change the email on my subscription."),c:["Talk to a human"]})],
   ["cancel",["cancel order","cancel my order","change order","wrong plan","wrong order","ordered by mistake","change my order"],()=>({h:`<p>Message us right away with your order details. Orders that are not delivered yet are the easiest to change.</p>`+waBtn("Hi StreamX! I want to change or cancel my order."),c:["Delivery time","Talk to a human"]})],
   ["paystuck",["payment failed","payment pending","paid but","deducted","money cut","paid twice","double payment","transaction id","trxid","txn","payment not","not confirmed"],()=>({h:`<p>Online payments are confirmed automatically, usually within moments. If money left your account but you got no confirmation, send your Transaction ID and order details on WhatsApp and we will check it.</p>`+waBtn("Hi StreamX! My payment needs checking. Transaction ID: "),c:["Delivery time","Talk to a human"]})],
   ["orders",["receipt","invoice","order history","purchase history","past order","my orders","order status","track order","where is my order"],()=>({h:`<p>Sign in to My account to see your subscriptions, days left, and your Purchase history with the status of each order.</p><div class="bt-row">${btn("Open My account","/account/")}</div>`,c:["My login details","Renew my plan"]})],
   ["late",["depends on stock","delivery depends","takes some time","why late","delayed","not delivered","not received my","still waiting","taking long"],()=>({h:`<p>Instant plans arrive right after payment is confirmed. Plans activated on your own email, or marked "Delivery depends on stock availability" or "Delivery takes some time", take longer.</p><p>Still waiting? Send your order details and we will check.</p>`+waBtn("Hi StreamX! I am waiting for my order. Order details: "),c:["Payment methods","Talk to a human"]})],
   ["ownmail",["own email","ready made","ready-made","readymade","my email","activated on","personal account","shared account","non renewable","renewable","what is share","shared profile"],()=>({h:`<p><b>On your own email:</b> we activate the plan on the email you give us, so the account is yours.</p><p><b>Ready-made:</b> we deliver an account with login details, shown in My account.</p><p><b>Shared or private profile:</b> a shared profile is a slot on a shared account with no customization, a private profile is yours with a PIN. Every plan card says which one it is.</p>`,c:["Prices & plans","Help me choose"]})],
   ["household",["household","netflix code","temporary access","tv code","automated household"],()=>({h:`<p>Plans marked "Automated household code" send the household or verification code automatically. For other plans, message us with the service name and your account email and we will send the code.</p>`+waBtn("Hi StreamX! I need a login or household code."),c:["My login details","Talk to a human"]})],
   ["profile",["profile name","pin lock","change pin","change profile","rename profile","customize"],()=>({h:`<p>On shared profiles, please do not change the profile name, PIN or email, so it keeps working. Plans marked "Customizable profile" let you personalize your own profile. Never share your PIN outside your household.</p>`,c:["Netflix devices","Talk to a human"]})],
   ["devlimit",["device limit","too many devices","how many devices","simultaneous","multi device","multiple devices","single device","logout","sign out of"],()=>({h:`<p>Each plan says whether it is single-device or multi-device. For example, Netflix Share Profile is single-device, while Single Slot is multi-device with TV support. My account lists the devices signed in, where we have added them.</p><p>Device limit reached? Message us.</p>`+waBtn("Hi StreamX! My device limit is reached."),c:["Netflix devices","Talk to a human"]})],
   ["quality",["4k","fhd","hd quality","resolution","ultra hd","video quality"],()=>({h:`<p>Quality is listed on every plan. For example, Netflix and Prime Video plans on StreamX are FHD / 4K. Slow or blurry video is usually the internet connection or the device; tell us the service and device and we will help.</p>`,c:["Netflix","Prime Video","Talk to a human"]})],
   ["region",["region","bangladesh region","global region","region plan","work in bangladesh","outside bangladesh","abroad","other country","which region"],()=>({h:`<p>Spotify comes in a Bangladesh Region plan (works in Bangladesh only) and a Global Region plan (works in any country). Check the region note on each plan card before you buy.</p>`,c:["Spotify","VPN"]})],
   ["redeem",["how to redeem","redeem code","redeem apple","where to redeem"],()=>({h:`<p>Redeem in the App Store or at apple.com/redeem. Each code works once, and gift cards are valid for 6 months. Your code appears in My account once it is delivered.</p><div class="bt-row">${btn("Open My account","/account/")}</div>`,c:["Apple Gift Card","Talk to a human"]})],
   ["giftrate",["gift card price","gift card rate","dollar rate","per dollar","usd rate","how much is $"],()=>{const r=typeof GIFT!=="undefined"?GIFT.rate(5):130;return{h:`<p>Apple Gift Cards are US region, at ${taka(r)} per $1. For example, a $10 card is ${taka(10*r)}. You can choose any amount from $5 to $500 in steps of $5.</p><div class="bt-row">${btn("View gift cards","#plan=apple-gift-card")}</div>`,c:["How to redeem","Payment methods"]}}],
   ["vcard",["virtual card","bybit","pokepay","redotpay","redot","dollar card","visa card online","international payment"],()=>({h:`<p>Virtual cards are ready-made online cards for subscriptions and international payments.</p>`+(byCat("Virtual Cards")||""),c:["Payment methods","Talk to a human"]})],
   ["student",["student","edu team","education plan","canva edu"],()=>({h:`<p>Canva is offered through an Edu Team invite, activated on your own email.</p>`,c:["Canva","Prices & plans"]})],
   ["hours",["working hours","opening hours","office time","timing","24/7","24 7","are you available","available now","open now"],()=>({h:`<p>Our WhatsApp support is available 24/7. Message anytime and we will reply as fast as we can.</p>`+waBtn("Hi StreamX!"),c:["Talk to a human","Prices & plans"]})],
   ["lang",["bangla support","speak bangla","bengali","language","বাংলা","বাংলায়"],()=>({h:`<p>You can message our team in Bangla or English. This chat replies in English and understands a few Bangla keywords.</p>`,c:["Talk to a human","Prices & plans"]})],
   ["official",["official","affiliated","authorized","partner","reseller","original account","legal","is this real"],()=>({h:`<p>StreamX is an independent reseller based in Dhaka. We are not affiliated with the brands we sell. Prices are shown before you pay, and online payments go through EPS's secure page.</p><div class="bt-row">${btn("About us","/about/")}${btn("Terms","/terms/")}</div>`,c:["Is it safe?","Return policy"]})],
   ["privacy",["privacy","personal information","my information","my data","data safe","cookie","cookies","tracking","track me"],()=>({h:`<p>We never see your card or wallet details, because online payments happen on EPS's secure page. We do not use advertising or tracking cookies. Your browser only keeps what the site needs, like your sign-in, cart and this chat, on your own device. Passwords and PINs stay hidden until you tap Show, and they are never saved in the chat history. Read the full details in the Privacy Policy.</p><div class="bt-row">${btn("Privacy Policy","/privacy/")}</div>`,c:["Is it safe?","Payment methods"]})],
   ["forother",["for my friend","for someone","for family","buy for","another person","as a gift for","for my brother","for my sister"],()=>({h:`<p>Yes, you can buy for someone else. For plans activated on an email, send us that person's email on WhatsApp when you order.</p>`+waBtn("Hi StreamX! I want to buy a subscription for someone else."),c:["How do I order?","Payment methods"]})],
   ["trending",["trending","what to watch","movie suggestion","popular movie","tv shows","what's new","whats new","what should i watch"],()=>({h:`<p>The Trending section shows what is popular right now by country, with a "Wanna watch it now?" button for each title.</p><div class="bt-row">${btn("See what's trending","#trending"," bt-go")}</div>`,c:["Movies & series","Prices & plans"]})],
   ["reviews",["reviews","testimonials","customers say","customer feedback","ratings"],()=>({h:`<p>Real customer reviews are in the Reviews section of the site.</p><div class="bt-row">${btn("Read reviews","#reviews"," bt-go")}</div>`,c:["Is it safe?","Prices & plans"]})],
   ["bulk",["bulk","wholesale","reseller price","resell","agency","many accounts","large order"],()=>({h:`<p>For bulk orders or reseller pricing, message us on WhatsApp with what you need.</p>`+waBtn("Hi StreamX! I want to ask about bulk or reseller pricing."),c:["Talk to a human"]})],
   ["policy",["policy","terms","refund","money back","return","replace","replacement","warranty","guarantee"],()=>({h:`<p>${esc(POL.return[1][0])}</p><p>${esc(POL.return[1][1])}</p><div class="bt-row">${btn("Return policy","/return-policy/")}${btn("Terms","/terms/")}${waBtn("Hi StreamX! I need help with a refund or replacement. Order details: ")}</div>`,c:["It is not working","Talk to a human"]})]
  ];

  /* ---------- intents ---------- */
  const INT=[
   ["greet",["hi","hello","hey","salam","assalamu","assalamualaikum","good morning","good evening","হাই","হ্যালো","সালাম","আসসালামু"],()=>({h:`<p>Hi! I'm the StreamX assistant. Ask me about prices, plans, payment, delivery or your account, or let me help you choose.</p>`,c:["Prices & plans","Help me choose","Payment methods","My login details"]})],
   ["thanks",["thanks","thank","thx","shukriya","ধন্যবাদ","থ্যাংক"],()=>({h:`<p>You're welcome! Anything else I can help with?</p>`,c:["Prices & plans","Talk to a human"]})],
   ["about_bot",["chat assistant","chatbot","this chat","this bot","what can you do","what can you help","how can you help","can you help"],()=>({h:`<p>I can answer questions about prices, plans, payment and delivery, compare plans, help you choose and take you to checkout. If you are signed in, I can also show your subscriptions, days left, login details and orders. For anything else, a real person is one tap away.</p>`,c:["Prices & plans","Help me choose","My subscriptions","Talk to a human"]})],
   ["human",["human","admin","real person","real assistant","talk to","speak to","speak with","contact","customer support","need support","get support","call","phone number","whatsapp number","messenger","instagram","email","owner","manager","যোগাযোগ","সাপোর্ট","নাম্বার","এডমিন","অ্যাডমিন"],()=>({h:agentHtml(),c:["Prices & plans","Payment methods"]})],
   ["choose",["help me choose","recommend","suggest","which service","what should i","not sure","confused","best for","suggestion","help me pick","which one should"],()=>({h:`<p>Happy to help. What will you mostly use it for?</p>`,c:Object.keys(INTERESTS)})],
   ["order",["order","buy","purchase","checkout","cart","how to get","কিভাবে","কীভাবে","অর্ডার","কিনব","কিনতে"],()=>({h:faq(0)+`<div class="bt-row">${btn("Browse plans","#pricing"," bt-go")}</div>`,c:["Payment methods","Delivery time","Prices & plans"]})],
   ["delivery",["deliver","how long","how fast","instant","when will","wait","ডেলিভারি","কতক্ষণ","কত সময়"],()=>({h:faq(1),c:["How do I order?","Payment methods","My login details"]})],
   ["login",["login","log in","sign in","password","pin","otp","login code","verification code","my account","account details","days left","where do i find","লগইন","পাসওয়ার্ড","পিন","কোড"],()=>({h:faq(2)+`<p>You sign in with a one-time code sent to your email, and you can renew in one tap from there.</p><div class="bt-row">${btn("Open My account","/account/"," bt-go")}</div>`,c:["It is not working","Renew my plan","Talk to a human"]})],
   ["payment",["pay","payment","bkash","nagad","rocket","upay","visa","mastercard","debit card","credit card","bank","transfer","eps","online payment","পেমেন্ট","বিকাশ","নগদ","রকেট","উপায়","টাকা পাঠ"],()=>({h:payHtml(),c:["Is it safe?","How do I order?","Delivery time"]})],
   ["safe",["safe","secure","trust","legit","scam","fake","real","genuine","reliable","নিরাপদ","বিশ্বাস","ভুয়া"],()=>({h:faq(4),c:["Can I try before paying?","Payment methods","Read reviews"]})],
   ["trial",["trial","try","test","before pay","before paying","demo","delivery before"],()=>({h:faq(5)+waBtn("Hi StreamX! Can I get delivery before payment?"),c:["Is it safe?","Payment methods"]})],
   ["problem",["not working","doesn't work","does not work","stopped","problem","issue","error","wrong password","cannot","can't","cant","failed","expired","কাজ করছে না","সমস্যা","কাজ করে না"],q=>({h:faq(6)+`<p>Send us the service name, your email and a screenshot and we will sort it out.</p>`+waBtn("Hi StreamX! I need help: "+q),c:["My login details","Return policy","Renew my plan"]})],
   ["vpn",["vpn","location block","geo"],()=>({h:faq(7),c:["NordVPN","Surfshark","ExpressVPN"]})],
   ["gift",["gift","redeem","itunes","app store","apple card","গিফট"],()=>({h:faq(8),c:["Apple Gift Card","How to redeem","Gift card price"]})],
   ["renew",["renew","renewal","extend","duration","validity","expire","how many month","1 year","6 month","long plan","auto","নবায়ন","রিনিউ","মেয়াদ"],()=>({h:faq(9)+`<p>Most plans do not renew by themselves. Plans that include automatic renewal say so on their plan card.</p><div class="bt-row">${btn("Open My account","/account/")}</div>`,c:["Prices & plans","Talk to a human"]})],
   ["devices",["device","tv","phone","mobile","tablet","laptop","android","ios","iphone","ipad","web","screen","smart tv","firestick","ডিভাইস","টিভি","মোবাইল"],()=>({h:`<p>Every plan lists the devices it supports, for example mobile, tablet, web or TV. Tell me the service and I'll show it.</p>`,c:["Netflix devices","Prime Video devices","Spotify devices"]})],
   ["bundle",["bundle","combo","together","discount","offer","deal","coupon","promo","ডিসকাউন্ট","অফার","কম্বো"],()=>({h:`<p>Bundles cost less than buying each service alone.</p>`+(byCat("Bundles")||"")+`<p>Looking for a custom combo? Message us.</p>`+waBtn("Hi StreamX! Can you suggest a combo for me?"),c:["Prices & plans","Talk to a human"]})],
   ["cheap",["cheap","cheapest","lowest","affordable","budget","under","below","less than","within","price list","দাম কম","সস্তা","বাজেট"],q=>{const m=q.match(/(\d{2,5})/);return{h:budgetList(m?+m[1]:0),c:["Under 200","Under 500","Bundles"]}}],
   ["catalog",["price","prices","cost","how much","plans","plan","services","service","products","product","what do you","list","দাম","প্রাইস","কত","প্ল্যান"],()=>({h:catsHtml()})],
   ["about",["who are you","about","who is","where are you","dhaka","located","company","owner","founder"],()=>({h:`<p>${esc(POL.about[1][0])}</p><p>${esc(POL.about[1][1])}</p>`,c:["Is it safe?","Talk to a human"]})]
  ];
  const RULES=KB.concat(INT);
  const CATNAMES={"streaming":"Streaming","ai tools":"AI Tools","music & audio":"Music & Audio","music":"Music & Audio","productivity":"Productivity","learning":"Learning","gift cards":"Gift Cards","virtual cards":"Virtual Cards","bundles":"Bundles"};
  const LITE=["bundle","catalog","cheap","devices","renew","order","delivery","greet","payment","login"];

  function ctxChips(p){return [p.name+" devices","How do I pay online?","Talk to a human"]}
  function answer(raw){
    const q=norm(raw),t=raw.trim(),ql=t.toLowerCase();
    /* quick flows and shortcuts */
    if(INTERESTS[t]){ctx.interest=t;return{h:`<p>${esc(t)}. What is your monthly budget?</p>`,c:["Under 200","Under 500","Any budget"]}}
    const num=ql.match(/^under\s+(\d{2,5})$/);
    if(num||ql==="any budget"){const n=num?+num[1]:0,f=ctx.interest?INTERESTS[ctx.interest]:null,lb=ctx.interest;ctx.interest=null;const r=cheap(n).filter(x=>!f||f(x[0])).slice(0,4);
      return{h:budgetList(n,f,lb),c:r.length?r.map(x=>x[0].name).concat(["Help me choose"]).slice(0,4):["Talk to a human"]}}
    if(ql==="how do i pay online?")return{h:payHtml(),c:["Is it safe?","Delivery time"]};
    if(ql==="read reviews")return KB.find(k=>k[0]==="reviews")[2]();
    if(ql==="gift card price")return KB.find(k=>k[0]==="giftrate")[2]();
    if(ql==="how to redeem")return KB.find(k=>k[0]==="redeem")[2]();
    if(ql==="return policy")return KB.find(k=>k[0]==="policy")[2]();
    if(CATNAMES[ql]){const h=byCat(CATNAMES[ql]);if(h)return{h,c:["Help me choose","Prices & plans","Talk to a human"]}}
    let ps=findProducts(q);
    const ar=acctRoute(q,ql,ps);if(ar)return ar;
    const scored=RULES.map(r=>[r,any(q,r[1])]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
    const best=scored.length?scored[0][0]:null;
    const explain=any(q,["difference","which plan","best plan","plan types","plan type","which one","better","what is the best","which is best"])>0;
    const cmp=/\b(vs|versus|compare|comparison)\b/.test(ql)||(ps.length>1&&/ or /.test(" "+ql+" "));
    if(ps.length>1&&(cmp||explain)){ctx.p=ps[0];return{h:compareHtml(ps),c:["Payment methods","Talk to a human"]}}
    if(ps.length===1&&explain){ctx.p=ps[0];return{h:explainHtml(ps[0]),c:ctxChips(ps[0])}}
    /* follow-ups about the product we were just discussing */
    if(!ps.length&&ctx.p){
      if(/(\d+\s*(month|year|m\b|y\b)|monthly|yearly|annual|duration|how long)/.test(ql)&&canPick(ctx.p))return{h:typeHtml(ctx.p),c:null};
      if(best&&["devices"].indexOf(best[0])>-1)return{h:`<div class="bt-card"><div class="bt-ct">${esc(ctx.p.name)}</div>${deviceLines(ctx.p)}</div>`,c:ctxChips(ctx.p)};
      if(!best&&/\b(it|this|that|price|plans?|cost)\b/.test(ql)){ps=[ctx.p]}
    }
    if(ps.length&&(!best||LITE.indexOf(best[0])>-1&&best[0]!=="payment"&&best[0]!=="login")){
      const dev=best&&best[0]==="devices";ctx.p=ps[0];
      return{h:(dev?`<p>Supported devices:</p>`:"")+ps.map(p=>dev?`<div class="bt-card"><div class="bt-ct">${esc(p.name)}</div>${deviceLines(p)}<div class="bt-row">${btn("View plans","#plan="+slug(p.name))}</div></div>`:productCard(p)).join(""),c:ctxChips(ps[0])};
    }
    if(ps.length&&best&&best[0]==="problem")return best[2](t+" ("+ps[0].name+")");
    if(best)return best[2](t);
    if(ps.length){ctx.p=ps[0];return{h:ps.map(productCard).join(""),c:ctxChips(ps[0])}}
    return{h:`<p>I'm not sure about that one. Send your question to our team and we will reply on WhatsApp.</p>`+waBtn("Hi StreamX! "+t),c:["Prices & plans","Help me choose","How do I order?","Payment methods"]};
  }

  /* acct block is added after the UI elements exist */
  /* ---------- UI ---------- */
  const panel=document.createElement("section");panel.className="bt";panel.id="bt";panel.setAttribute("aria-label","StreamX assistant");panel.hidden=true;
  panel.innerHTML=`<header class="bt-h"><span class="bt-av"><img src="/assets/img/brand/al-amin.webp" alt="" width="40" height="40"><i></i></span><div><b>StreamX assistant</b><small id="btS"><span>Instant answers. Real people on WhatsApp.</span></small></div><button type="button" class="bt-rs" aria-label="Start over" title="Start over"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg></button><button type="button" class="bt-x" aria-label="Close chat">&times;</button></header>
  <div class="bt-log" id="btLog" aria-live="polite"></div>
  <form class="bt-f" id="btF" autocomplete="off"><input id="btI" type="text" maxlength="200" placeholder="Ask about prices, plans, payment..." aria-label="Type your question"><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form>`;
  root.insertBefore(panel,root.firstChild);
  const log=panel.querySelector("#btLog"),inp=panel.querySelector("#btI"),stat=panel.querySelector("#btS");
  const IDLE="<span>Instant answers. Real people on WhatsApp.</span>";
  let started=false,busy=false,lastBtn=$("#cwBtn");

  /* ---------- signed-in customers: their own subscriptions, details and orders (secrets stay hidden until the customer taps Show) ---------- */
  const token=()=>{try{return localStorage.getItem("sx_session")}catch(e){return null}};
  let ACC=null,accAt=0;
  const dayN=(a,b)=>Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/864e5);
  const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fdate=iso=>{const d=new Date(iso+"T00:00:00Z");return d.getUTCDate()+" "+MON[d.getUTCMonth()]+" "+d.getUTCFullYear()};
  function loadAcc(force){
    const t=token();if(!t)return Promise.reject(new Error("signed out"));
    if(!force&&ACC&&ACC.t===t&&Date.now()-accAt<120000)return Promise.resolve(ACC);
    let pre=null;try{const j=JSON.parse(sessionStorage.getItem("sx_acc_pre")||"null");if(!force&&j&&j.t===t&&Date.now()-j.at<60000)pre=j.d}catch(e){}
    const fin=d=>{d.t=t;d.subscriptions.forEach(x=>{x._left=dayN(d.today,x.end_date)});ACC=d;accAt=Date.now();return d};
    if(pre)return Promise.resolve(fin(pre));
    return fetch("/api/account?a=me",{headers:{Authorization:"Bearer "+t}}).then(r=>r.json().then(j=>{if(!r.ok){const e=new Error(j.error||"error");e.status=r.status;throw e}return j})).then(d=>{try{sessionStorage.setItem("sx_acc_pre",JSON.stringify({t:t,at:Date.now(),d:d}))}catch(e){}return fin(d)});
  }
  const subById=id=>ACC&&ACC.subscriptions.find(x=>String(x.id)===String(id));
  const stOf=x=>x._left<0?["Expired","bad"]:x._left<=7?["Expires soon","warn"]:["Active","ok"];
  const colorOf=n=>{const p=PRODUCTS.find(x=>x.name===n);return p?p.color:"#1d2347"};
  const tileOf=n=>{const L=typeof LOGOS!=="undefined"&&typeof LOGO_OF!=="undefined"&&LOGOS[LOGO_OF[n]],p=PRODUCTS.find(q=>q.name===n);
    if(L&&L.p)return `<span class="bt-tile bt-logo" style="background:${esc(L.bg)};color:${esc(L.fg||"#fff")}"><svg viewBox="${esc(L.vb)}" aria-hidden="true"><path d="${L.p}"/></svg></span>`;
    return `<span class="bt-tile" style="background:${colorOf(n)}">${esc(((p&&p.icon)||n[0]||"?").toString().slice(0,2))}</span>`};
  const leftTxt=x=>x._left<0?(-x._left)+(x._left===-1?" day ago":" days ago"):x._left===0?"last day":x._left+(x._left===1?" day left":" days left");
  const owns=(x,p)=>{const a=norm(x.service),b=norm(p.name);return a===b||a.indexOf(b)>-1||b.indexOf(a)>-1};
  const I_EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const I_CP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  const I_OK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';
  const I_LK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const planPrice=x=>{const p=PRODUCTS.find(q=>q.name===x.service);if(!p||p.gift)return 0;const lb=x.plan.indexOf(" · ")>-1?x.plan.split(" · ")[0]:"",vr=lb?p.variants.find(v=>v.n===lb):p.variants[0],pl=vr&&vr.plans.find(y=>y.m===x.months);return pl?pl.p:0};
  const renewWa=x=>wa(`Hi StreamX! I want to renew ${x.service} (${x.plan}).\nMy StreamX email: ${ACC.email}`);
  const renewBtns=x=>{const pr=planPrice(x);return `<div class="bt-rn"><a class="bt-btn bt-go" href="/account/#renew=${x.id}" data-close>Renew online${pr?" · "+taka(pr):""}</a><a class="bt-rwa" href="${esc(renewWa(x))}" target="_blank" rel="noopener">or renew on WhatsApp</a></div>`};
  const helpWa=x=>wa(`Hi StreamX! I need help with ${x.service} (${x.plan}).\nMy StreamX email: ${ACC.email}\nSubscription ID: #${x.id}`);
  const signIn=()=>`<p>Sign in to My account and I can show your subscriptions, days left, login details and orders right here in the chat.</p><div class="bt-row">${btn("Sign in","/account/"," bt-go")}</div>`;
  function rowHtml(label,val,sid,key,secret){
    const mask="••••••••••";
    return `<div class="bt-kv"><span class="bt-k">${label}</span><span class="bt-v">${secret?`<span class="bt-sv" data-sv="${sid}:${key}" data-mask="${mask}">${mask}</span>`:esc(val)}</span><span class="bt-ib">${secret?`<button type="button" data-act="eye" data-sid="${sid}" data-k="${key}" aria-label="Show">${I_EYE}</button>`:""}<button type="button" data-act="cp" data-sid="${sid}" data-k="${key}" aria-label="Copy">${I_CP}</button></span></div>`;
  }
  function detailHtml(x){
    const lg=x.login||{},id=x.id,st=stOf(x),total=Math.max(1,dayN(x.start_date,x.end_date)),pct=Math.min(100,Math.max(0,Math.round(x._left/total*100)));
    const gift=/gift card$/i.test(x.service),mode=lg.mode||"none",rows=[];
    if(gift){const g=lg.gift||{};if(g.amount)rows.push(`<div class="bt-kv"><span class="bt-k">Card</span><span class="bt-v">${esc(g.amount)}${g.region?" · "+esc(g.region):""}</span></div>`);if(g.code)rows.push(rowHtml("Redeem code","",id,"gift",true));else rows.push(`<p class="bt-cd">Your code will appear here once it is ready.</p>`)}
    else{
      if((mode==="email_pass"||mode==="email_otp")&&lg.email)rows.push(rowHtml("Email",lg.email,id,"email"));
      if((mode==="phone_otp"||mode==="phone_pass"||mode==="number")&&lg.phone)rows.push(rowHtml("Number",lg.phone,id,"phone"));
      if(mode==="own"){const v=lg.email||lg.phone||ACC.email;rows.push(rowHtml("Activated on",v,id,lg.email?"email":lg.phone?"phone":"acct"))}
      if((mode==="email_pass"||mode==="phone_pass")&&lg.password)rows.push(rowHtml("Password","",id,"pass",true));
      if(lg.profile)rows.push(rowHtml("Profile",lg.profile,id,"profile"));
      if(lg.pin)rows.push(rowHtml("PIN","",id,"pin",true));
      if(lg.family)rows.push(rowHtml("Family mail",lg.family,id,"family"));
      if(mode==="email_otp"||mode==="phone_otp"||lg.otp)rows.push(`<p class="bt-cd">Login is OTP based. Ask us for your login code.</p><div class="bt-row">${btn(I_WA+" Get my login code",wa(`Hi StreamX! I need my login code for ${x.service}.\nMy StreamX email: ${ACC.email}`),"  bt-wa")}</div>`);
      if(lg.vpn&&lg.vpn.required)rows.push(`<div class="bt-kv"><span class="bt-k">VPN</span><span class="bt-v">Required${lg.vpn.country?" · connect to "+esc(lg.vpn.country):""}</span></div>`);
      const it=(lg.devices&&lg.devices.items)||[];if(it.length)rows.push(`<div class="bt-kv"><span class="bt-k">Devices</span><span class="bt-v">${it.map(d=>esc((d.name||d.type||"Device")+(d.type?" ("+d.type+")":""))).join(", ")}</span></div>`);
      if(!rows.length)rows.push(`<p class="bt-cd">Your login details will appear here once your account is ready. Need them now? Message us.</p>`);
    }
    return `<div class="bt-card bt-acct"><div class="bt-ct">${tileOf(x.service)}${esc(x.service)}<em class="bt-st ${st[1]}">${st[0]}</em></div><p class="bt-cd">${esc(x.plan)} · ${fdate(x.start_date)} to ${fdate(x.end_date)}</p>`+
      `<div class="bt-prog" title="${leftTxt(x)}"><i style="width:${x._left<0?0:pct}%"></i></div><p class="bt-left"><b>${x._left<0?"Expired":x._left}</b> ${x._left<0?leftTxt(x):x._left===0?"last day":x._left===1?"day left":"days left"}</p>`+
      `<div class="bt-kvs">${rows.join("")}</div><p class="bt-lock">${I_LK}<span>Only you can see this on this device. Secrets are hidden again after 20 seconds.</span></p>`+
      `${renewBtns(x)}<div class="bt-row">${btn("Need help",helpWa(x),"  bt-wa")}</div></div>`;
  }
  function listHtml(d,title){
    const live=d.subscriptions.filter(x=>x._left>=0).sort((a,b)=>a._left-b._left),gone=d.subscriptions.filter(x=>x._left<0);
    if(!live.length)return `<p>You do not have an active subscription right now${gone.length?" ("+gone.length+" expired)":""}.</p><div class="bt-row">${btn("Browse services","/services/"," bt-go")}${btn("Open My account","/account/")}</div>`;
    return `<p>${title||`You have ${live.length} active subscription${live.length>1?"s":""}. Tap one to see its details.`}</p><div class="bt-sublist">${live.map((x,i)=>{const st=stOf(x);return `<button type="button" class="bt-sub" style="--i:${i}" data-act="sub" data-sid="${x.id}">${tileOf(x.service)}<span class="bt-st-t"><b>${esc(x.service)}</b><small>${esc(x.plan)} · ${leftTxt(x)}</small></span><em class="bt-st ${st[1]}">${st[0]}</em></button>`}).join("")}</div>${gone.length?`<p class="bt-cd">${gone.length} expired subscription${gone.length>1?"s":""} are in My account.</p>`:""}`;
  }
  function ordersHtml(d){
    const os=(d.orders||[]).slice(0,3);if(!os.length)return `<p>I do not see any online orders on your account yet.</p><div class="bt-row">${btn("Browse services","/services/"," bt-go")}</div>`;
    const dt=iso=>fdate(new Date(Date.parse(iso)+6*3600000).toISOString().slice(0,10));
    return `<p>Your latest orders:</p>`+os.map(o=>{const ok=o.delivery==="delivered",pr=o.lines.length&&o.lines.every(l=>l.price>0),tot=pr?o.lines.reduce((t,l)=>t+l.price*(l.q||1),0):0;
      return `<div class="bt-card"><div class="bt-ct">Order #${esc(String(o.id).slice(-8).toUpperCase())}<em class="bt-st ${ok?"ok":"warn"}">${ok?"Delivered":"Processing"}</em></div><p class="bt-cd">${dt(o.date)}${ok&&o.delivered_at?" · delivered "+dt(o.delivered_at):""}</p><ul class="bt-ul">${o.lines.map(l=>`<li>${esc(l.name)}${l.plan?` <span class="bt-cd">${esc(l.plan)}</span>`:""} ×${l.q||1}</li>`).join("")}</ul>${tot?`<p class="bt-pr">Total ${taka(tot)}</p>`:""}</div>`}).join("")+`<div class="bt-row">${btn("All orders in My account","/account/")}</div>`;
  }
  function daysHtml(d){
    const a=d.subscriptions.slice().sort((x,y)=>x._left-y._left);if(!a.length)return listHtml(d);
    return `<p>Here is how long each plan has left:</p><ul class="bt-mini">${a.map(x=>`<li><span>${esc(x.service)} <small class="bt-sm">${esc(x.plan)}</small></span><b class="bt-dl ${stOf(x)[1]}">${x._left<0?"Expired":leftTxt(x)}</b></li>`).join("")}</ul><p class="bt-cd">Plans end on the date shown in My account, in Bangladesh time.</p>`;
  }
  function renewHtml(d){
    const a=d.subscriptions.filter(x=>x._left<=30).sort((x,y)=>x._left-y._left);
    if(!a.length)return `<p>None of your plans is close to ending. You can still renew any time from My account. The new period is added after your current expiry, so no days are lost.</p><div class="bt-row">${btn("Open My account","/account/")}</div>`;
    return `<p>${a.length>1?"These plans are":"This plan is"} ending soon. Renew online and your plan is extended automatically once payment is confirmed. You do not need to do anything else.</p>`+a.map(x=>`<div class="bt-card"><div class="bt-ct">${tileOf(x.service)}${esc(x.service)}<em class="bt-st ${stOf(x)[1]}">${leftTxt(x)}</em></div><p class="bt-cd">${esc(x.plan)}</p>${renewBtns(x)}</div>`).join("");
  }
  /* returns {p:Promise<reply>} for signed-in account questions, a sign-in prompt when signed out, or null */
  function acctRoute(q,ql,ps){
    const A=ks=>any(q,ks)>0;
    if(/forgot|reset|how (do|to|can)|change (my )?(password|email)/.test(ql))return null;
    const SUBS=A(["my subscription","my subscriptions","my plans","my plan","my services","active subscription","what do i have","my account","my active","my accounts"])||/^my subscriptions?$/.test(ql);
    const LOGIN=A(["login details","my login","my password","password","my pin","credentials","show my","copy my","my profile","login code","my email","my number","my devices","signed in devices"]);
    const DAYS=A(["days left","how many days","expire","expiry","when does","how long left","end date","valid until","time left"]);
    const ORD=A(["my order","my orders","order status","order history","purchase history","receipt","invoice","track my"]);
    const REN=A(["renew"])&&!A(["how"]);
    if(!(SUBS||LOGIN||DAYS||ORD||REN))return null;
    if(!token())return{h:signIn(),c:["Prices & plans","Talk to a human"]};
    const ch=["My subscriptions","My orders","Renew my plan","Talk to a human"];
    const run=f=>({p:loadAcc().then(f,e=>({h:`<p>${e.status===401?"Your session ended. Please sign in again to see your account here.":"I could not load your account just now. Please try again in a moment."}</p><div class="bt-row">${btn("Open My account","/account/"," bt-go")}</div>`}))});
    if(ORD)return run(d=>({h:ordersHtml(d),c:["My subscriptions","Renew my plan","Talk to a human"]}));
    if(REN)return run(d=>({h:renewHtml(d),c:ch}));
    if(DAYS&&!LOGIN)return run(d=>({h:daysHtml(d),c:["My subscriptions","Renew my plan","My orders"]}));
    if(LOGIN||(SUBS&&ps.length)){
      return run(d=>{const live=d.subscriptions.filter(x=>x._left>=0);let mine=ps.length?live.filter(x=>ps.some(p=>owns(x,p))):live;
        if(ps.length&&!mine.length)return{h:`<p>I do not see ${esc(ps[0].name)} on your account. Here is what you have:</p>`+listHtml(d,""),c:["Prices & plans","Talk to a human"]};
        if(mine.length===1)return{h:detailHtml(mine[0]),c:["My subscriptions","Renew my plan","My orders"]};
        return{h:listHtml({subscriptions:mine,email:d.email},mine.length?`Which one? Tap a subscription to see its login details.`:""),c:["My orders","Renew my plan"]}});
    }
    return run(d=>({h:listHtml(d),c:["My orders","Renew my plan","Talk to a human"]}));
  }
  function maskAll(){log.querySelectorAll(".bt-sv.shown").forEach(el=>{el.classList.remove("shown");el.textContent=el.dataset.mask;const b=el.closest(".bt-kv").querySelector('[data-act=eye]');if(b){b.classList.remove("on");b.setAttribute("aria-label","Show")}})}
  function secretOf(x,k){const l=(x&&x.login)||{};return({pass:l.password,pin:l.pin,gift:l.gift&&l.gift.code,email:l.email,phone:l.phone,profile:l.profile,family:l.family,acct:ACC&&ACC.email})[k]||""}
  function clip(txt){if(navigator.clipboard&&isSecureContext)return navigator.clipboard.writeText(txt);return new Promise((ok,no)=>{try{const t=document.createElement("textarea");t.value=txt;t.style.cssText="position:fixed;opacity:0";document.body.appendChild(t);t.select();document.execCommand("copy")?ok():no();t.remove()}catch(e){no(e)}})}
  function secretAct(el){
    const a=el.dataset.act,sid=el.dataset.sid,k=el.dataset.k;
    loadAcc().then(()=>{const x=subById(sid);if(!x)return;const v=secretOf(x,k);
      if(a==="eye"){const sp=el.closest(".bt-kv").querySelector(".bt-sv");const on=!sp.classList.contains("shown");sp.classList.toggle("shown",on);sp.textContent=on?v:sp.dataset.mask;el.classList.toggle("on",on);el.setAttribute("aria-label",on?"Hide":"Show");clearTimeout(sp._t);if(on)sp._t=setTimeout(()=>{sp.classList.remove("shown");sp.textContent=sp.dataset.mask;el.classList.remove("on");el.setAttribute("aria-label","Show")},20000)}
      else clip(v).then(()=>{const old=el.innerHTML;el.innerHTML=I_OK;el.classList.add("ok");setTimeout(()=>{el.innerHTML=old;el.classList.remove("ok")},1600)}).catch(()=>{el.classList.add("bad");setTimeout(()=>el.classList.remove("bad"),1600)})
    }).catch(()=>{})
  }

  const down=()=>{log.scrollTop=log.scrollHeight};
  const save=()=>{try{const c=log.cloneNode(true);c.querySelectorAll(".bt-typing").forEach(n=>n.remove());c.querySelectorAll(".bt-sv").forEach(n=>{n.classList.remove("shown");n.textContent=n.dataset.mask});sessionStorage.setItem("sx_bot",JSON.stringify({h:c.innerHTML.slice(0,90000),p:ctx.p?ctx.p.name:null}))}catch(e){}};
  function add(cls,html,isText){const d=document.createElement("div");d.className="bt-m "+cls;if(isText)d.textContent=html;else d.innerHTML=html;log.appendChild(d);down();return d}
  function strip(){log.querySelectorAll(".bt-chips").forEach(n=>n.remove())}
  function typeText(el,full){
    if(calm){el.textContent=full;return 0}
    let i=0;el.classList.add("bt-tw");const step=Math.max(1,Math.round(full.length/70));
    const iv=setInterval(()=>{i+=step;el.textContent=full.slice(0,i);down();if(i>=full.length){clearInterval(iv);el.classList.remove("bt-tw")}},16);
    return Math.ceil(full.length/step)*16;
  }
  function show(r){
    const wrap=add("bt-b","");wrap.innerHTML=r.h;
    const kids=[].slice.call(wrap.children);let delay=0;
    const f=kids[0];if(f&&f.tagName==="P"&&!f.children.length&&f.textContent.length<=240){const full=f.textContent;f.textContent="";delay=typeText(f,full)}
    kids.slice(f&&f.tagName==="P"?1:0).forEach((k,i)=>{k.classList.add("bt-rv");k.style.animationDelay=(delay+i*120)+"ms"});
    if(r.c){const ch=document.createElement("div");ch.innerHTML=chips(r.c);const c=ch.firstChild;c.classList.add("bt-rv");c.style.animationDelay=(delay+kids.length*120+120)+"ms";wrap.appendChild(c)}
    down();[300,700,1200,1800].forEach(t=>setTimeout(down,t));save();
  }
  function bot(r){
    busy=true;stat.innerHTML='<span class="bt-ty">typing<i></i><i></i><i></i></span>';
    const dots=add("bt-b bt-typing",'<i></i><i></i><i></i>');
    const go=x=>{dots.remove();show(x);busy=false;stat.innerHTML=IDLE};
    if(r.p){Promise.all([r.p,new Promise(ok=>setTimeout(ok,calm?0:650))]).then(a=>go(a[0]),()=>go({h:`<p>Sorry, something went wrong. Please message us on WhatsApp.</p>`+waBtn("Hi StreamX!")}));return}
    setTimeout(()=>go(r),calm?0:520+Math.min(500,(r.h||"").length/6));
  }
  function ask(text,silent){
    text=text.trim();if(!text||busy)return;strip();if(!silent)add("bt-u",text,true);inp.value="";
    let r;
    try{
      if(/^talk to a human$/i.test(text))r=INT.find(i=>i[0]==="human")[2]();
      else if(/^help me choose$/i.test(text))r=INT.find(i=>i[0]==="choose")[2]();
      else if(/ devices$/i.test(text)&&findProducts(norm(text))[0]){const p=findProducts(norm(text))[0];ctx.p=p;r={h:`<div class="bt-card"><div class="bt-ct">${esc(p.name)}</div>${deviceLines(p)}<div class="bt-row">${btn("View plans","#plan="+slug(p.name))}</div></div>`,c:ctxChips(p)}}
      else r=answer(text);
    }catch(e){r={h:`<p>Sorry, something went wrong. Please message us on WhatsApp.</p>`+waBtn("Hi StreamX! "+text)}}
    bot(r);
  }
  function reply(userText,r){strip();add("bt-u",userText,true);bot(r)}
  function doAct(el){
    const a=el.dataset.act,i=+el.dataset.i,v=+el.dataset.v,k=+el.dataset.k,p=PRODUCTS[i];
    if(a==="eye"||a==="cp"){secretAct(el);return}
    if(busy)return;
    if(a==="sub"){loadAcc().then(()=>{const x=subById(el.dataset.sid);if(x)reply(x.service,{h:detailHtml(x),c:["My subscriptions","Renew my plan","My orders"]})});return}
    if(a==="pick"){ctx.p=p;reply("Choose a plan for "+p.name,{h:typeHtml(p)});return}
    if(a==="card"){ctx.p=p;reply(p.name,{h:productCard(p),c:ctxChips(p)});return}
    if(a==="var"){reply(p.variants[v].n,{h:durHtml(p,v)});return}
    if(a==="dur"){reply(p.variants[v].plans[k].v,{h:sumHtml(i,v,k)});return}
    if(a==="cart"){addToCart(i,v,k);el.classList.add("done");el.textContent="Added ✓";strip();bot({h:`<p>Added to your cart. Ready to pay?</p><div class="bt-row">${act("Open cart","opencart","")}${act("Pay online","buy",`data-i="${i}" data-v="${v}" data-k="${k}"`," bt-go")}</div>`,c:["Prices & plans","Talk to a human"]});return}
    if(a==="opencart"){close();openCart(true);return}
    if(a==="buy"){close();setTimeout(()=>buyNow(i,v,k),260)}
  }
  function open(){
    panel.hidden=false;root.classList.add("cw-open");requestAnimationFrame(()=>panel.classList.add("on"));
    const u=root.querySelector(".cw-unread");if(u)u.remove();try{sessionStorage.setItem("sx_bot_seen","1")}catch(e){}
    if(!started){started=true;let s=null;try{s=JSON.parse(sessionStorage.getItem("sx_bot")||"null")}catch(e){}
      if(s&&s.h){log.innerHTML=s.h;log.querySelectorAll(".bt-m").forEach(m=>m.classList.add("rest"));if(s.p)ctx.p=LIST.find(x=>x.name===s.p)||null;down()}
      else if(token()){bot({p:loadAcc().then(d=>{const live=d.subscriptions.filter(x=>x._left>=0).length,nm=((d.profile&&d.profile.name)||"").trim();return{h:`<p>Hi${nm?" "+esc(nm):""}! You are signed in${live?` and have ${live} active subscription${live>1?"s":""}`:""}. I can show your plans, days left, login details and orders right here, and I can also help you buy.</p>`,c:live?["My subscriptions","My orders","Renew my plan","Prices & plans","Talk to a human"]:["Prices & plans","Help me choose","My orders","Talk to a human"]}},()=>({h:`<p>Hi, I'm the StreamX assistant. Ask me anything about prices, plans, payment, delivery or your account.</p>`,c:["Prices & plans","Help me choose","How do I pay online?","Delivery time","My login details","Talk to a human"]}))})}
      else show({h:`<p>Hi, I'm the StreamX assistant. Ask me anything about prices, plans, payment, delivery or your account.</p>`,c:["Prices & plans","Help me choose","How do I pay online?","Delivery time","My login details","Talk to a human"]})}
    setTimeout(()=>{down();inp.focus({preventScroll:true})},250)}
  function close(){maskAll();panel.classList.remove("on");root.classList.remove("cw-open");setTimeout(()=>{if(!panel.classList.contains("on"))panel.hidden=true},250)}
  function reset(){try{sessionStorage.removeItem("sx_bot")}catch(e){}ctx.p=null;ctx.interest=null;log.innerHTML="";busy=false;started=true;show({h:`<p>Fresh start. What would you like to know?</p>`,c:["Prices & plans","Help me choose","How do I pay online?","Talk to a human"]})}
  panel.querySelector(".bt-x").onclick=close;panel.querySelector(".bt-rs").onclick=reset;
  panel.querySelector("#btF").addEventListener("submit",e=>{e.preventDefault();ask(inp.value)});
  panel.addEventListener("click",e=>{
    const c=e.target.closest(".bt-chip");if(c){ask(c.dataset.q);return}
    const a=e.target.closest("[data-act]");if(a){doAct(a);return}
    if(e.target.closest("[data-close]")&&innerWidth<=600)close();
  });
  addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close()});
  /* a small unread dot on the photo until the assistant is opened */
  try{if(!sessionStorage.getItem("sx_bot_seen")&&lastBtn){const u=document.createElement("span");u.className="cw-unread";u.textContent="1";u.setAttribute("aria-hidden","true");lastBtn.appendChild(u)}}catch(e){}
  window.sxBot={open,close,toggle:()=>panel.hidden?open():close(),ask};
})();
