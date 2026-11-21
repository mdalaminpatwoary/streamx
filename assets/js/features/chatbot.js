/* StreamX assistant: instant answers from the site's own catalog, FAQ and policies. No AI service, no API key, no cost.
   It matches what the visitor types against prices, plans and common questions, and hands over to a human on WhatsApp when unsure. */
(function(){
  const root=$("#cw");if(!root||typeof PRODUCTS==="undefined")return;
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const NAME="Muhammad Al-Amin";
  const LIST=PRODUCTS.filter(p=>p.cat!=="18+"&&p.variants&&p.variants.length);
  const pl0=v=>v.plans&&v.plans[0];
  const minOf=p=>{const a=p.variants.map(v=>pl0(v)&&pl0(v).p).filter(x=>x>0);return a.length?Math.min.apply(null,a):0};
  const norm=t=>(" "+String(t).toLowerCase().replace(/[^a-z0-9ঀ-৿]+/g," ").trim()+" ");
  const has=(q,k)=>/[^\x00-\x7f]/.test(k)?q.indexOf(k)>-1:k.length<=3?q.indexOf(" "+k+" ")>-1:q.indexOf(" "+k)>-1;
  const any=(q,ks)=>ks.reduce((n,k)=>n+(has(q,k)?1:0),0);

  /* ---------- product detection ---------- */
  const ALIAS={"prime":"Amazon Prime Video","yt":"YouTube Premium","youtube":"YouTube Premium","gpt":"ChatGPT","chat gpt":"ChatGPT","hotstar":"JioHotstar","disney":"Disney+","nord":"NordVPN","express vpn":"ExpressVPN","google drive":"Google One","gemini":"Gemini Pro","adobe":"Adobe Express","apple music":"Apple Music","icloud":"Apple Gift Card","itunes":"Apple Gift Card","app store":"Apple Gift Card"};
  const SKIP=["gift","the","one","pro","card","video"];
  const KEYS=[];
  LIST.forEach(p=>{const n=norm(p.name).trim();KEYS.push([n,p]);const f=n.split(" ")[0];if(f.length>=4&&f!==n&&SKIP.indexOf(f)<0)KEYS.push([f,p])});
  Object.keys(ALIAS).forEach(k=>{const p=LIST.find(x=>x.name===ALIAS[k]);if(p)KEYS.push([k,p])});
  function findProducts(q){const out=[];KEYS.forEach(k=>{if(q.indexOf(" "+k[0]+" ")>-1||q.indexOf(" "+k[0])>-1&&k[0].length>=5){if(out.indexOf(k[1])<0)out.push(k[1])}});return out.slice(0,3)}

  /* ---------- building blocks ---------- */
  const btn=(label,href,extra)=>`<a class="bt-btn${extra||""}" href="${esc(href)}"${/^https?:/.test(href)?' target="_blank" rel="noopener"':' data-close'}>${label}</a>`;
  const waBtn=t=>btn("Chat on WhatsApp",wa(t||"Hi StreamX!"),"  bt-wa");
  const chips=a=>`<div class="bt-chips">${a.map(x=>`<button type="button" class="bt-chip" data-q="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;
  const faq=i=>FAQS[i]?`<p>${esc(FAQS[i][1])}</p>`:"";
  const cheap=n=>LIST.map(p=>[p,minOf(p)]).filter(x=>x[1]>0&&(!n||x[1]<=n)).sort((a,b)=>a[1]-b[1]);

  function productCard(p){
    const rows=p.variants.slice(0,4).map(v=>{const x=pl0(v);return x?`<li><span>${esc(v.n)}</span><b>${taka(x.p)}<small> / ${esc(x.v.toLowerCase())}</small></b></li>`:""}).join("");
    const long=p.variants.map(v=>v.plans&&v.plans[v.plans.length-1]).filter(Boolean).sort((a,b)=>b.m-a.m)[0];
    const gift=/gift card$/i.test(p.name)&&typeof GIFT!=="undefined";
    return `<div class="bt-card"><div class="bt-ct">${esc(p.name)}<em>${esc(p.cat)}</em></div><p class="bt-cd">${esc(p.desc)}</p>`+
      (gift?`<p class="bt-cd">US region. ${taka(GIFT.rate(5))} per $1, any amount from $${GIFT.min} to $${GIFT.max} in steps of $${GIFT.step}.</p>`:rows?`<ul>${rows}</ul>`:"")+
      (!gift&&long&&long.m>1?`<p class="bt-cd">Longer plans cost less per month, up to ${esc(long.v.toLowerCase())}.</p>`:"")+
      `<div class="bt-row">${btn("View plans","#plan="+slug(p.name))}${btn("Order on WhatsApp",wa("Hi StreamX! I want "+p.name+"."),"  bt-wa")}</div></div>`;
  }
  function deviceLines(p){return `<ul class="bt-ul">`+p.variants.slice(0,4).map(v=>`<li><b>${esc(v.n)}</b>: ${esc(v.f[0]||v.line)}</li>`).join("")+`</ul>`}
  function budgetList(n){
    const r=cheap(n).slice(0,6);if(!r.length)return `<p>We do not have a plan that low yet. Our most affordable starts at ${taka(cheap()[0][1])}. Message us and we will look for the best match.</p>`+waBtn("Hi StreamX! My budget is "+taka(n||0)+". What do you suggest?");
    return `<p>${n?`Plans you can get for ${taka(n)} or less (1 month, from):`:"Our most affordable plans (1 month, from):"}</p><ul class="bt-mini">${r.map(x=>`<li><a href="#plan=${slug(x[0].name)}" data-close>${esc(x[0].name)}</a><b>${taka(x[1])}</b></li>`).join("")}</ul>`;
  }
  const catsHtml=()=>{const m={};LIST.forEach(p=>{m[p.cat]=(m[p.cat]||0)+1});return `<p>We have ${LIST.length} services. Pick a group or type a service name:</p>`+chips(Object.keys(m).map(c=>c==="Bundle"?"Bundles":c))};
  const byCat=c=>{const a=LIST.filter(p=>p.cat===c||(c==="Bundles"&&p.cat==="Bundle"));return a.length?`<p>${esc(c)}:</p><ul class="bt-mini">${a.map(p=>`<li><a href="#plan=${slug(p.name)}" data-close>${esc(p.name)}</a><b>${minOf(p)?"from "+taka(minOf(p)):"ask us"}</b></li>`).join("")}</ul>`:""};

  /* ---------- intents ---------- */
  const INT=[
   ["greet",["hi","hello","hey","salam","assalamu","assalamualaikum","good morning","good evening","হাই","হ্যালো","সালাম","আসসালামু"],()=>({h:`<p>Hi! I'm the StreamX assistant. Ask me about prices, plans, payment, delivery or your account.</p>`,c:["Prices & plans","How do I order?","Payment methods","My login details"]})],
   ["thanks",["thanks","thank","thx","shukriya","ধন্যবাদ","থ্যাংক"],()=>({h:`<p>You're welcome! Anything else I can help with?</p>`,c:["Prices & plans","Talk to a human"]})],
   ["human",["human","agent","real person","talk to","speak to","contact","customer support","need support","get support","call","phone number","whatsapp number","messenger","instagram","email","যোগাযোগ","সাপোর্ট","নাম্বার"],()=>({h:`<p>Our team is on WhatsApp 24/7: +880 1312-850241. You can also reach us here:</p><div class="bt-row">${waBtn("Hi StreamX!")}${btn("Messenger","https://m.me/streamx.com.bd")}${btn("Instagram","https://instagram.com/streamx.com.bd")}${btn("Email","mailto:streamx.com.bd@gmail.com")}</div>`,c:["Prices & plans","Payment methods"]})],
   ["order",["order","buy","purchase","checkout","cart","how to get","কিভাবে","কীভাবে","অর্ডার","কিনব","কিনতে"],()=>({h:faq(0)+`<div class="bt-row">${btn("Browse plans","#pricing")}</div>`,c:["Payment methods","Delivery time","Prices & plans"]})],
   ["delivery",["deliver","how long","how fast","instant","when will","wait","ডেলিভারি","কতক্ষণ","কত সময়"],()=>({h:faq(1),c:["How do I order?","Payment methods","My login details"]})],
   ["login",["login","log in","sign in","password","pin","otp","login code","verification code","my account","account details","days left","where do i find","লগইন","পাসওয়ার্ড","পিন","কোড"],()=>({h:faq(2)+`<div class="bt-row">${btn("Open My account","/account/")}</div>`,c:["It is not working","Renew my plan","Talk to a human"]})],
   ["payment",["pay","payment","bkash","nagad","rocket","upay","visa","mastercard","debit card","credit card","bank","transfer","eps","পেমেন্ট","বিকাশ","নগদ","রকেট","উপায়","টাকা পাঠ"],()=>({h:faq(3),c:["Is it safe?","How do I order?","Delivery time"]})],
   ["safe",["safe","secure","trust","legit","scam","fake","real","genuine","reliable","নিরাপদ","বিশ্বাস","ভুয়া"],()=>({h:faq(4),c:["Can I try before paying?","Payment methods"]})],
   ["trial",["trial","try","test","before pay","before paying","demo","delivery before"],()=>({h:faq(5)+waBtn("Hi StreamX! Can I get delivery before payment?"),c:["Is it safe?","Payment methods"]})],
   ["problem",["not working","doesn't work","does not work","stopped","problem","issue","error","wrong password","cannot","can't","cant","failed","expired","replace","refund","return","warranty","guarantee","fix","কাজ করছে না","সমস্যা","রিফান্ড","কাজ করে না"],q=>({h:faq(6)+`<p>Send us the service name, your email and a screenshot and we will sort it out.</p>`+waBtn("Hi StreamX! I need help: "+q),c:["My login details","Return policy","Renew my plan"]})],
   ["policy",["policy","terms","conditions","return policy","privacy"],()=>({h:`<p>${esc(POL.return[1][0])} ${esc(POL.return[1][1])}</p><div class="bt-row">${btn("Return policy","/return-policy/")}${btn("Terms","/terms/")}</div>`,c:["It is not working","Talk to a human"]})],
   ["vpn",["vpn","region","country","location block","geo"],()=>({h:faq(7),c:["NordVPN","Surfshark","ExpressVPN"]})],
   ["gift",["gift","redeem","itunes","app store","apple card","গিফট"],()=>({h:faq(8),c:["Apple Gift Card","Payment methods"]})],
   ["renew",["renew","renewal","extend","duration","validity","expire","how many month","1 year","6 month","long plan","auto","নবায়ন","রিনিউ","মেয়াদ"],()=>({h:faq(9)+`<p>Most plans do not renew by themselves. Plans that include automatic renewal say so on their plan card.</p><div class="bt-row">${btn("Open My account","/account/")}</div>`,c:["Prices & plans","Talk to a human"]})],
   ["devices",["device","tv","phone","mobile","tablet","laptop","android","ios","iphone","ipad","web","screen","smart tv","firestick","ডিভাইস","টিভি","মোবাইল"],()=>({h:`<p>Every plan lists the devices it supports, for example mobile, tablet, web or TV. Tell me the service and I'll show it.</p>`,c:["Netflix devices","Prime Video devices","Spotify devices"]})],
   ["bundle",["bundle","combo","together","discount","offer","deal","coupon","promo","ডিসকাউন্ট","অফার","কম্বো"],()=>({h:`<p>Bundles cost less than buying each service alone.</p>`+(byCat("Bundles")||"")+`<p>Looking for a custom combo? Message us.</p>`+waBtn("Hi StreamX! Can you suggest a combo for me?"),c:["Prices & plans","Talk to a human"]})],
   ["cheap",["cheap","cheapest","lowest","affordable","budget","under","below","less than","within","price list","দাম কম","সস্তা","বাজেট"],q=>{const m=q.match(/(\d{2,5})/);return{h:budgetList(m?+m[1]:0),c:["Under 200","Under 500","Bundles"]}}],
   ["catalog",["price","prices","cost","how much","plans","plan","services","service","products","product","what do you","list","দাম","প্রাইস","কত","প্ল্যান"],()=>({h:catsHtml()})],
   ["about",["who are you","about","who is","where are you","dhaka","located","company","owner","founder"],()=>({h:`<p>${esc(POL.about[1][0])}</p><p>${esc(POL.about[1][1])}</p>`,c:["Is it safe?","Talk to a human"]})]
  ];
  const CATNAMES={"streaming":"Streaming","ai tools":"AI Tools","music & audio":"Music & Audio","music":"Music & Audio","productivity":"Productivity","learning":"Learning","vpn":"VPN","gift cards":"Gift Cards","virtual cards":"Virtual Cards","bundles":"Bundles"};

  function answer(raw){
    const q=norm(raw),t=raw.trim(),ql=t.toLowerCase();
    if(CATNAMES[ql]&&ql!=="vpn"){const h=byCat(CATNAMES[ql]);if(h)return{h,c:["Prices & plans","Talk to a human"]}}
    const num=ql.match(/^under\s+(\d{2,5})$/);if(num)return{h:budgetList(+num[1]),c:["Under 200","Under 500","Talk to a human"]};
    const ps=findProducts(q);
    let best=null,bs=0;INT.forEach(i=>{const s=any(q,i[1]);if(s>bs){bs=s;best=i}});
    const lite=!best||["catalog","cheap","devices","renew","order","delivery","greet"].indexOf(best[0])>=0;
    if(ps.length&&(lite||best[0]==="catalog")){
      const dev=best&&best[0]==="devices";
      return{h:(dev?`<p>Supported devices:</p>`:"")+ps.map(p=>dev?`<div class="bt-card"><div class="bt-ct">${esc(p.name)}</div>${deviceLines(p)}<div class="bt-row">${btn("View plans","#plan="+slug(p.name))}</div></div>`:productCard(p)).join(""),c:["Payment methods","Delivery time","Talk to a human"]};
    }
    if(ps.length&&best&&best[0]==="problem"){const r=best[2](t+" ("+ps[0].name+")");return r}
    if(best)return best[2](t);
    if(ps.length)return{h:ps.map(productCard).join(""),c:["Payment methods","Delivery time"]};
    return{h:`<p>I'm not sure about that one. Send your question to our team and we will reply on WhatsApp.</p>`+waBtn("Hi StreamX! "+t),c:["Prices & plans","How do I order?","Payment methods"]};
  }

  /* ---------- UI ---------- */
  const panel=document.createElement("section");panel.className="bt";panel.id="bt";panel.setAttribute("aria-label","StreamX assistant");panel.hidden=true;
  panel.innerHTML=`<header class="bt-h"><span class="bt-av"><img src="/assets/img/brand/al-amin.webp" alt="" width="40" height="40"></span><div><b>StreamX assistant</b><small><i></i>Instant answers. Real people on WhatsApp.</small></div><button type="button" class="bt-x" aria-label="Close chat">&times;</button></header>
  <div class="bt-log" id="btLog" aria-live="polite"></div>
  <form class="bt-f" id="btF" autocomplete="off"><input id="btI" type="text" maxlength="200" placeholder="Ask about prices, plans, payment..." aria-label="Type your question"><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form>`;
  root.insertBefore(panel,root.firstChild);
  const log=panel.querySelector("#btLog"),inp=panel.querySelector("#btI");
  let started=false,busy=false;
  const down=()=>{log.scrollTop=log.scrollHeight};
  function add(cls,html,isText){const d=document.createElement("div");d.className="bt-m "+cls;if(isText)d.textContent=html;else d.innerHTML=html;log.appendChild(d);down();return d}
  function strip(){log.querySelectorAll(".bt-chips").forEach(n=>n.remove())}
  function bot(r){
    busy=true;const dots=add("bt-b bt-typing",'<i></i><i></i><i></i>');
    setTimeout(()=>{dots.remove();const el=add("bt-b",r.h+(r.c?chips(r.c):""));busy=false;down()},420);
  }
  function ask(text){
    text=text.trim();if(!text||busy)return;strip();add("bt-u",text,true);inp.value="";
    let r;try{r=answer(text)}catch(e){r={h:`<p>Sorry, something went wrong. Please message us on WhatsApp.</p>`+waBtn("Hi StreamX! "+text)}}
    if(/talk to a human/i.test(text))r=INT.find(i=>i[0]==="human")[2]();
    else if(/^(netflix|prime video|spotify) devices$/i.test(text)){const p=findProducts(norm(text))[0];if(p)r={h:`<div class="bt-card"><div class="bt-ct">${esc(p.name)}</div>${deviceLines(p)}<div class="bt-row">${btn("View plans","#plan="+slug(p.name))}</div></div>`,c:["Payment methods","Talk to a human"]}}
    bot(r);
  }
  function open(){panel.hidden=false;root.classList.add("cw-open");requestAnimationFrame(()=>panel.classList.add("on"));
    if(!started){started=true;add("bt-b",`<p>Hi, I'm the StreamX assistant. Ask me anything about prices, plans, payment, delivery or your account.</p>`+chips(["Prices & plans","How do I order?","Payment methods","Delivery time","My login details","Talk to a human"]))}
    setTimeout(()=>inp.focus({preventScroll:true}),250)}
  function close(){panel.classList.remove("on");root.classList.remove("cw-open");setTimeout(()=>{if(!panel.classList.contains("on"))panel.hidden=true},250)}
  panel.querySelector(".bt-x").onclick=close;
  panel.querySelector("#btF").addEventListener("submit",e=>{e.preventDefault();ask(inp.value)});
  panel.addEventListener("click",e=>{const c=e.target.closest(".bt-chip");if(c){ask(c.dataset.q);return}if(e.target.closest("[data-close]")&&window.innerWidth<=600)close()});
  addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close()});
  window.sxBot={open,close,toggle:()=>panel.hidden?open():close(),ask};
})();
