/* Policy pop-ups. */
// ===== Policy pop-ups (edit the text here) =====
document.addEventListener("click",e=>{const a=e.target.closest("[data-pol]");if(a){e.preventDefault();const d=POL[a.dataset.pol];$("#mdlt").textContent=d[0];$("#mdlc").innerHTML=d[1].map(t=>`<p>${t}</p>`).join("");$("#mdl").classList.add("show")}});
$("#mdl").onclick=e=>{if(e.target.id==="mdl"||e.target.closest(".mdlx"))$("#mdl").classList.remove("show")};
