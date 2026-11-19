/* Policy pop-ups. */
// ===== Policy pop-ups (edit the text here) =====
document.addEventListener("click",e=>{const a=e.target.closest("[data-pol]");if(a){e.preventDefault();const d=POL[a.dataset.pol];$("#mdlt").textContent=d[0];$("#mdlc").innerHTML=d[1].map(t=>`<p>${t}</p>`).join("");$("#mdl").classList.add("show")}});
$("#mdl").onclick=e=>{if(e.target.id==="mdl"||e.target.closest(".mdlx"))$("#mdl").classList.remove("show")};
// Footer links on service pages open a policy via /#terms, /#return or /#about
(()=>{const h=location.hash.slice(1);if(["terms","return","about"].includes(h)&&POL[h]){const a=document.querySelector('[data-pol="'+h+'"]');a&&setTimeout(()=>a.click(),400)}})();
