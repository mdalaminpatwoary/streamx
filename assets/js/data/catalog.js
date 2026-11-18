/* Product catalog: categories, durations, plan types, prices and combo packs. */
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
["IPTV","Streaming","#2563eb","Live TV streaming on iOS, Android and TV, with single-device login.",[
 V("Standard","","Live TV streaming across your phone, tablet and TV.",["Supported on iOS, Android and TV","Single-device login"],[],{1:250,6:1200,12:1900})]],
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
 {n:"Pack 1",sub:"Best value. Shared Netflix profile, for phone and web.",p:230,old:280,tag:"Most affordable",f:["Netflix: shared profile, no customization","Prime Video: private PIN-protected profile","Watch on mobile, tablet and web (no TV)","Netflix login by secure OTP","Instant delivery"]},
 {n:"Pack 2",sub:"Your own private Netflix profile, for phone and web.",p:350,old:400,tag:"Private",f:["Netflix: private PIN-protected profile, customizable","Prime Video: private PIN-protected profile","Watch on mobile, tablet and web (no TV)","Netflix login by secure OTP","Instant delivery"]},
 {n:"Pack 3",sub:"Netflix on your TV, with multi-device access.",p:400,old:450,tag:"Best for TV",hot:true,f:["Netflix: single slot, PIN-protected, customizable","Prime Video: private PIN-protected profile","Watch on mobile, tablet, web and TV","Netflix login by password","Delivery depends on stock availability"]},
 {n:"Pack 4",sub:"Private profile on TV, with instant delivery and priority service.",p:450,old:500,tag:"Premium",f:["Netflix: Signature private profile, customizable","Prime Video: private PIN-protected profile","Watch on mobile, tablet, web and TV","Netflix login by secure OTP","Instant delivery and priority service"]}
];
PRODUCTS.forEach(p=>{if(p.name==="Entertainment Combo"){p.packs=PACKS;p.variants[0].plans=PACKS.map(k=>({m:1,v:k.n,p:k.p}))}});
