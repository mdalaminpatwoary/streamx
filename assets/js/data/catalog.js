/* Product catalog: categories, durations, plan types, prices and combo packs. */
// ===== PRODUCT CATALOG (edit names, text and prices here) =====
// Popular products come first (the first 8 show on the page, 4 on phone).
const CATS=["Streaming","Music & Audio","AI Tools","Productivity","Learning","Gift Cards","Virtual Cards","Facebook","VPN","Dating","18+"];
const DUR={.25:"1 Week",1:"1 Month",3:"3 Months",6:"6 Months",12:"1 Year",18:"18 Months",36:"3 Years"},UNIT={.25:"week",1:"month",3:"3 months",6:"6 months",12:"year",18:"18 months",36:"3 years"};
// V(plan type, badge, one-line summary, [features], [notes], {months: price in BDT})
const V=(n,tag,line,f,notes,pr)=>({n,tag,line,f,notes,plans:Object.entries(pr).map(([m,p])=>({m:+m,v:DUR[m],p})).sort((a,b)=>a.m-b.m)});
const VPNN="VPN required for access",SHN="Shared profile, no customization",SLOW="Delivery takes some time",STOCK="Delivery depends on stock availability",ADULT="Adults only (18+)";
// Apple Gift Card (US region): price = dollars x ৳130, in steps of $5 from $5 to $500.
const GIFT={min:5,max:500,step:5,rate:()=>130,ok:a=>Number.isInteger(a)&&a>=5&&a<=500&&a%5===0};
const GC=a=>({m:1,v:"$"+a,p:a*GIFT.rate(a),u:"card",gc:a});
const PRIVF=["Profile name and PIN protected","Customizable profile","Instant delivery"];
const SH={1:180,6:800,12:1200},PR={1:250,6:1100,12:1900};
const ASKN="Price on request, we reply on WhatsApp";
const GEMB=["400 GB storage shared across Google Photos, Drive and Gmail","Gemini app with 2x the usage limits of a non-AI plan, plus Hydrogen models","Google Flow with higher access to Google's creative models, 200 Flow credits a month","Gemini in Gmail, Calendar and Meet","Gemini Notebook with higher limits and up to 100 sources per notebook","Share your storage with up to 5 others","No login access needed"];
const GEMI=[...GEMB,"Redeem link provided","No card required to activate"],GEMFM=[...GEMB,"Invite sent to your email address"];
const GEMV=()=>[
 V("Family Invite + Full warranty","Full warranty","Family invite sent to your email address, with a full 6-month warranty.",[...GEMFM,"Full warranty"],[],{6:400}),
 V("Family Invite + Activation warranty","Activation warranty","Family invite sent to your email address, with an activation warranty.",[...GEMFM,"Activation warranty"],["Activation warranty only"],{6:250}),
 V("Individual + Full warranty","Full warranty","Individual account activated with a redeem link, with a full 6-month warranty.",[...GEMI,"Full warranty"],[],{6:1000}),
 V("Individual + Activation warranty","Activation warranty","Individual account activated with a redeem link, with an activation warranty.",[...GEMI,"Activation warranty"],["Activation warranty only"],{6:500})];
// 18+ services that also get their own (age-gated, not search-indexed) page under /services/.
const ADULT_PAGES=[]; // 18+ services have no pages under /services/: they are sold from their own separate page
// [name, category, brand color, short description, [plan types]]
const CATALOG=[
["Netflix","Streaming","#e50914","Blockbusters and binge-worthy series in FHD / 4K, with four plan types to choose from.",[
 V("Share Profile","Most affordable","An affordable option for everyday streaming on mobile, tablet or web.",["Mobile, tablet and web","Single-device access","Automated household code","4K Ultra HD streaming","Instant delivery","Secure OTP-based login"],[SHN],{1:180,6:1000,12:1800}),
 V("Private Profile","Best value","A personalized, PIN-protected profile with customization options.",["Mobile, tablet and web","Profile and PIN protected","Customizable profile","Automated household code","4K Ultra HD streaming","Instant delivery","Secure OTP-based login"],[],{1:300,6:1700,12:3100}),
 V("Single Slot","Most flexible","The most flexible plan, with TV support and multi-device access.",["Mobile, tablet, web and TV","Profile and PIN protected","Multi-device access","Customizable profile","4K Ultra HD streaming","Password-based login"],[STOCK],{1:350,6:1900,12:3600}),
 V("Signature Edition","Premium","A premium private-profile experience with TV support, instant delivery and priority service.",["Mobile, tablet, web and TV","Profile and PIN protected","Multi-device access","Customizable profile","4K Ultra HD streaming","Instant delivery","Secure OTP-based login","Hassle-free priority service for signature clients"],[],{1:400,6:2240,12:4200})]],
["Amazon Prime Video","Streaming","#00a8e1","Prime originals, movies and series in FHD / 4K, on your own PIN-protected profile.",[
 V("Standard","","Prime Video with a personal, PIN-protected profile at an everyday price.",["Profile and PIN protected","Customizable profile","FHD / 4K quality","Instant delivery"],[],{1:100,6:400,12:600})]],
["Spotify","Music & Audio","#1db954","Ad-free music on your own email, with a Bangladesh or Global region plan.",[
 V("Bangladesh Region","Instant","Ad-free music for listeners in Bangladesh.",["Works in Bangladesh only","Activated on your own email","Instant delivery"],[],{1:135,6:780,12:1440}),
 V("Global Region","Any country","Ad-free music that works in any country.",["Works in any country","Activated on your own email"],[SLOW],{1:200,6:1000,12:1650})]],
["YouTube Premium","Streaming","#ff0000","Ad-free videos, background play and YouTube Music Premium included, on your own email, for Android, web or Apple.",[
 V("Android & Web","Auto renewal","Ad-free YouTube with background play and YouTube Music Premium, for Android and web.",["Includes YouTube Music Premium","Works on Android and web","Activated on your own email","Automatic renewal","Instant delivery"],[],{1:185,6:1000,12:1900}),
 V("Apple Users","iPhone & iPad","Ad-free YouTube with YouTube Music Premium for Apple users, activated on your own email.",["Includes YouTube Music Premium","Designed for Apple users","Activated on your own email"],["Invitation must be accepted every month",STOCK],{1:200,6:1100,12:2000}),
 V("Individual · Your Account","3 months","A 3-month YouTube Premium individual plan, activated directly on your own YouTube account.",["Individual plan for 3 months","Includes YouTube Music Premium","Works on Android, iOS and web","Ad-free videos, background play and offline downloads"],["Your account email and password are needed to activate it"],{3:600})]],
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
["Apple Music","Music & Audio","#fa243c","Over 100 million songs, ad-free, with lossless audio and Spatial Audio, activated on your own email.",[
 V("On Your Email","Your own email","Apple Music activated on your own email, for 6 months or a full year.",["Over 100 million songs, ad-free","Lossless audio and Spatial Audio with Dolby Atmos","Real-time lyrics and Apple Music Sing","Offline downloads","Works on iPhone, iPad, Mac, Android and PC","Activated on your own email"],[],{6:1000,12:1800})]],
["Adobe Express","Productivity","#eb1000","Design social posts, videos, flyers and more with premium templates, fonts and AI tools, activated on your own email.",[
 V("Premium · 1 Year","Your own email","A full year of Adobe Express Premium on your own email.",["All premium templates for posts, video and print","Adobe Stock photos, music and design elements","30,000+ Adobe Fonts","Generative AI credits with Adobe Firefly","Brand kits, one-click Resize and video tools","Works in your browser and on mobile","Activated on your own email"],[],{12:650})]],
["Apple Gift Card","Gift Cards","#1d1d1f","Add US-region credit to your Apple Account for apps, games, Apple Music, iCloud+ and more. Redeem code provided.",[
 (()=>{const v=V("US Region","Redeem code","An Apple Gift Card for a US-region Apple Account. Choose $5 or $10, or slide to any amount in steps of $5.",["US region Apple Gift Card","Redeem code provided after payment","Use it for App Store apps and games, in-app purchases, Apple Music, Apple TV+, iCloud+ and more","Credit goes straight to your Apple Account balance"],["Works only on an Apple Account set to the US region","Each code can be redeemed once; it can't be turned into cash","Every $1 is ৳130. Choose any amount in steps of $5"],{});v.plans=[5,10].map(GC);return v})()]],
["iTunes Gift Card","Gift Cards","#e84fb3","Add US-region credit to your Apple Account for iTunes Store music and films, apps, games, subscriptions and more. Redeem code provided.",[
 (()=>{const v=V("US Region","Redeem code","An iTunes gift card for a US-region Apple Account. Choose $5 or $10, or slide to any amount in steps of $5.",["US region iTunes gift card","Redeem code provided after payment","Spend it on iTunes Store music and films, App Store apps and games, Apple TV, Apple Books, Apple Music, iCloud+ and more","Credit goes straight to your Apple Account balance"],["Works only on an Apple Account set to the US region","Some purchases may still need a payment method on file; balance can't be used to send gifts","Each code can be redeemed once; it can't be turned into cash","Every $1 is ৳130. Choose any amount in steps of $5"],{});v.plans=[5,10].map(GC);return v})()]],
["Gamma AI","AI Tools","#6d5efc","Create presentations, documents and web pages with AI in minutes. Gamma Pro, activated on your own email.",[
 V("Pro · Your Email","Your own email","Gamma Pro activated on your own email, for one month or a full year.",["Gamma Pro plan, activated on your own email","Generate decks, documents and web pages from a prompt","Remove Gamma branding from your work","Export to PDF and PowerPoint","Brand kit with your own colors, logo and fonts","Viewer analytics for shared content","Priority support from Gamma"],["Features follow Gamma's current Pro plan and may change"],{1:1500,12:3500})]],
["Udemy","Learning","#a435f0","Thousands of top courses with certificates of completion, on a private ready-made account.",[
 V("Personal Plan · Ready-made","Private account","A private, ready-made Udemy account with the Personal Plan.",["Private ready-made account","Thousands of top courses across hundreds of topics","Certificates of completion on finished courses","Skill assessments and hands-on practice","Learn on desktop, mobile browser or the Udemy app"],["Not every Udemy course is part of the plan","Courses are mainly taught in English"],{1:300})]],
["Bybit Card","Virtual Cards","#f7a600","A ready-made virtual Visa card that spends your crypto balance online, valid for 3 years.",[
 V("Ready-made Virtual Visa","3 years","A ready-made Bybit virtual Visa card with 3 years of validity.",["Ready-made virtual Visa card","Valid for 3 years","Spend your crypto balance anywhere Visa is accepted online","Works with Apple Pay and Google Pay where supported","Top up from your own crypto balance"],["Spending limits, fees and supported regions are set by the card issuer","Please follow the issuer's terms and your local rules"],{36:1000})]],
["PokePay","Virtual Cards","#09bb8b","A ready-made virtual card for online payments and subscriptions, valid for 3 years.",[
 V("Ready-made Virtual Card","3 years","A ready-made PokePay virtual card with 3 years of validity.",["Ready-made virtual card","Valid for 3 years","Visa network, accepted by online merchants worldwide","Fund it with crypto such as USDT and USDC","Use it for online shopping, apps and subscriptions"],["Some merchants may restrict this card","Fees, limits and supported regions are set by the issuer; please follow its terms and your local rules"],{36:900})]],
["RedotPay","Virtual Cards","#eb0028","A ready-made Visa card for global online spending with your crypto balance, valid for 3 years.",[
 V("Ready-made Visa Card","3 years","A ready-made RedotPay Visa card with 3 years of validity.",["Ready-made Visa card","Valid for 3 years","Top up with stablecoins and major crypto","Online spending, plus Apple Pay and Google Pay where supported","Fast in-app setup and top-up"],["Hotels, fuel stations and car rentals that place holds may decline the card","Fees, limits and supported regions are set by the issuer; please follow its terms and your local rules"],{36:1000})]],
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
["Apple TV+","Streaming","#1d1d1f","Apple Originals like Ted Lasso and Severance in 4K HDR with Dolby Vision and Atmos, ad-free, on a shared login for a single device.",[
 V("Share · Single Device","Single device","Apple TV+ on a shared login that works on one device at a time, at a fixed BDT price.",["Single-device login","Ad-free streaming","4K HDR with Dolby Vision, and Dolby Atmos on most titles","Apple Originals, series and films","Works on iPhone, iPad, Mac, Apple TV, smart TVs and the web","Offline downloads on iPhone, iPad and Mac"],["Shared login, use on one device only","Do not change the account details"],{1:250,6:1000,12:1500})]],
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
["Gemini Plus","AI Tools","#4285f4","Google's Gemini plan with 400 GB storage, Google Flow and Gemini in Gmail, on 6-month plans. No login access needed.",GEMV()],
["Google One","Productivity","#4285f4","400 GB of shared Google storage with Gemini included, on 6-month plans. No login access needed.",GEMV()],
["CapCut","Productivity","#111827","Pro video editing, as a ready-made account or on your own email.",[
 V("Ready-made Account","Instant","A ready-to-use Pro account, delivered instantly.",["Pro plan","Instant delivery"],[],{1:450}),
 V("On Your Email","Pro","The Pro plan activated on your own email.",["Pro plan","Activated on your own email"],[SLOW],{1:800,6:2500,12:4500})]],
["Grammarly","Productivity","#15c39a","Write clearly and confidently with Grammarly Premium: advanced grammar, tone and style suggestions and a plagiarism detector.",[
 V("Share Account","Most affordable","Grammarly Premium on a shared account, at the lowest price.",["Shared account",...["Spelling, grammar and punctuation checks","Tone detector and conciseness suggestions","Suggestions to restructure long sentences","Tone, delivery, engagement and fluency suggestions","Plagiarism detector (web and academic databases)","Works in browsers, desktop apps, Google Docs, Microsoft Word and mobile keyboards"]],[],{1:100,6:400,12:600}),
 V("Personal · Your Email","Your own email","Grammarly Premium for a full year, activated on your own email.",["Activated on your own email","1 year of Premium",...["Spelling, grammar and punctuation checks","Tone detector and conciseness suggestions","Suggestions to restructure long sentences","Tone, delivery, engagement and fluency suggestions","Plagiarism detector (web and academic databases)","Works in browsers, desktop apps, Google Docs, Microsoft Word and mobile keyboards"]],["Features follow Grammarly's current Premium plan and may change"],{12:1700})]],
["Tinder Platinum","Dating","#fe3c72","Tinder's top tier, activated on your own email: see who likes you, send Priority Likes and message before you match.",[
 V("Personal · Your Email","Your own email","Tinder Platinum activated on your own email, from one week to a full year.",["Tinder Platinum, activated on your own email","Likes You: see everyone who has already liked you","Priority Likes so your Like can be seen sooner","Message before matching, up to 140 characters","See Sent Likes from the last 7 days","Top Picks, Passport and unlimited Likes","5 Super Likes a week and 1 free Boost a month","Works on Android and iPhone"],["Features follow Tinder's current Platinum plan and may change","Your Tinder account email is needed to activate it"],{.25:550,1:800,3:1200,6:2000,12:3000})]],
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
["Brazzers","18+","#374151","An adults-only (18+) premium video service, on a 1-device share account.",[
 V("Share Account · 1 Device","1 device","A shared account for one device at an affordable price.",["Share account","1-device access"],[ADULT],{1:300})]],
["Ullu","18+","#374151","An adults-only (18+) streaming service on an affordable plan.",[
 V("Standard","","An adults-only streaming service.",["Single-device access","Instant delivery"],[ADULT],{1:100,6:400,12:600})]],
["ALTT","18+","#374151","An adults-only (18+) streaming service on an affordable plan.",[
 V("Standard","","An adults-only streaming service.",["Single-device access","Instant delivery"],[ADULT],{1:120,6:500,12:750})]],
["Atrangii","18+","#374151","An adults-only (18+) streaming service on an affordable plan.",[
 V("Standard","","An adults-only streaming service.",["Single-device access","Instant delivery"],[ADULT],{1:120,6:500,12:800})]],
["FapHouse","18+","#374151","An adults-only (18+) service with a premium plan.",[
 V("Premium","","The premium plan of an adults-only service.",["Premium plan","Single-device access","Instant delivery"],[ADULT],{1:250,6:1000,12:1500})]],
["Facebook Services","Facebook","#1877f2","Grow your Facebook profile, page, group or videos: followers, views, shares, comments, reactions and more. Price on request.",[
  (()=>{const v=V("Followers · BD, Global or Mix","On request","Grow your Facebook followers with a Bangladesh, Global or Mixed audience.",["Choose Bangladesh, Global or Mix","Works on profiles and pages","Tell us your link and quantity"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Reels Views","On request","More views on your Facebook Reels.",["Works on public Reels","Tell us your Reel link and quantity"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Post Share","On request","More shares on your Facebook post.",["Works on public posts","Tell us your post link and quantity"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Star Gift","On request","Facebook Stars sent to your live or post.",["For creators and streamers","Tell us your link and quantity"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Comments","On request","Comments on your Facebook post or Reel.",["Works on public posts","Tell us your link and the comment style"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Page Comments","On request","Comments on your Facebook page content.",["Works on page posts","Tell us your page link and quantity"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Group Members","On request","Grow your Facebook group with new members.",["Works on public groups","Tell us your group link and quantity"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Reactions","On request","Likes and reactions on your Facebook post.",["Choose the reaction type","Tell us your post link and quantity"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Watch Time","On request","More watch time for your Facebook videos.",["For monetization goals","Tell us your video link and hours needed"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})(),
  (()=>{const v=V("Live Stream Views","On request","More viewers on your Facebook live stream.",["Works on public live streams","Tell us your live link and viewer count"],[ASKN],{1:0});v.plans=[{m:1,v:"Custom order",p:0,ask:1}];return v})()
]],
["Facebook BIN","Facebook","#1877f2","A Facebook Business Identification Number code, with no 15% government VAT. Lifetime validity, code delivered to you.",[
 (()=>{const v=V("BIN Code","Code delivered","A Facebook BIN code with lifetime validity. The code expires after activation.",["No 15% government VAT","Lifetime validity","Code provided after payment"],["Expires after activation"],{1:300});v.plans=[{m:1,v:"BIN Code",p:300,once:1}];return v})()]],
["Entertainment Combo","Bundle","#E50914","Netflix + Prime Video",[V("Packs","","",[],[],{1:230})]]
];
const PRODUCTS=CATALOG.map(([name,cat,color,desc,variants])=>({name,cat,color,desc,icon:name[0],variants}));
const entry=p=>{const a=p.variants.flatMap(v=>v.plans),b=a.filter(x=>x.p>0);return (b.length?b:a).reduce((x,y)=>y.p<x.p?y:x)}; // starting (cheapest) plan
// Entertainment Combo packs: shown when a customer opens the combo (monthly price, "old" = regular price)
const PACKS=[
 {n:"Pack 1",sub:"Best value. Shared Netflix profile, for phone and web.",p:230,old:280,tag:"Most affordable",f:["Netflix: shared profile, no customization","Prime Video: private PIN-protected profile","Watch on mobile, tablet and web (no TV)","Netflix login by secure OTP","Instant delivery"]},
 {n:"Pack 2",sub:"Your own private Netflix profile, for phone and web.",p:350,old:400,tag:"Private",f:["Netflix: private PIN-protected profile, customizable","Prime Video: private PIN-protected profile","Watch on mobile, tablet and web (no TV)","Netflix login by secure OTP","Instant delivery"]},
 {n:"Pack 3",sub:"Netflix on your TV, with multi-device access.",p:400,old:450,tag:"Best for TV",hot:true,f:["Netflix: single slot, PIN-protected, customizable","Prime Video: private PIN-protected profile","Watch on mobile, tablet, web and TV","Netflix login by password","Delivery depends on stock availability"]},
 {n:"Pack 4",sub:"Private profile on TV, with instant delivery and priority service.",p:450,old:500,tag:"Premium",f:["Netflix: Signature private profile, customizable","Prime Video: private PIN-protected profile","Watch on mobile, tablet, web and TV","Netflix login by secure OTP","Instant delivery and priority service"]}
];
PRODUCTS.forEach(p=>{if(p.variants.every(v=>v.plans.every(x=>x.ask)))p.ask=true;if(p.name==="Apple Gift Card"||p.name==="iTunes Gift Card")p.gift=true;if(p.name==="Entertainment Combo"){p.packs=PACKS;p.variants[0].plans=PACKS.map(k=>({m:1,v:k.n,p:k.p}))}});
