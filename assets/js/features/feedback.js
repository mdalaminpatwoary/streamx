/* Feedback form (opens in WhatsApp). */
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
