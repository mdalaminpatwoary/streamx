/* FAQ accordion. */
// ===== FAQ (animated accordion) =====
$("#faqList").innerHTML=FAQS.map((f,k)=>`<div class="fq${k===0?" on":""}" style="--k:${k}"><button class="fqb" aria-expanded="${k===0}"><span class="fn">0${k+1}</span><span class="fqq">${f[0]}</span><span class="fpl">+</span></button><div class="fqa"><div><p>${f[1]}</p></div></div></div>`).join("");
$("#faqList").onclick=e=>{
  const b=e.target.closest(".fqb");if(!b)return;const r=b.parentNode,open=r.classList.contains("on");
  document.querySelectorAll(".fq").forEach(x=>{x.classList.remove("on");x.firstChild.setAttribute("aria-expanded","false")});
  if(!open){r.classList.add("on");b.setAttribute("aria-expanded","true")}
};
