/* FAQ accordion. */
// ===== FAQ (animated accordion) =====
$("#faqList").innerHTML=FAQS.map((f,k)=>`<div class="fq${k===0?" on":""}" style="--k:${k}"><button class="fqb" aria-expanded="${k===0}"><span class="fn">${String(k+1).padStart(2,"0")}</span><span class="fqq">${f[0]}</span><span class="fpl">+</span></button><div class="fqa"><div><p>${f[1]}</p></div></div></div>`).join("");
$("#faqList").onclick=e=>{
  const b=e.target.closest(".fqb");if(!b)return;const r=b.parentNode,open=r.classList.contains("on");
  document.querySelectorAll(".fq").forEach(x=>{x.classList.remove("on");x.firstChild.setAttribute("aria-expanded","false")});
  if(!open){r.classList.add("on");b.setAttribute("aria-expanded","true")}
};

// Show the first 6 questions; the rest open with "See all questions".
(function(){
  const L=$("#faqList"),rows=[...L.children],N=6;if(rows.length<=N+1)return;
  rows.slice(N).forEach(r=>r.hidden=true);
  const b=document.createElement("button");b.type="button";b.className="fq-more";b.textContent="See all "+rows.length+" questions";
  b.onclick=()=>{const open=rows[N].hidden;rows.slice(N).forEach(r=>r.hidden=!open);b.textContent=open?"Show fewer":"See all "+rows.length+" questions"};
  L.append(b);
})();
