/* Site basics: WhatsApp links, mobile menu, English/Bangla toggle. */
// WhatsApp links
document.querySelectorAll("[data-wa]").forEach(a=>{a.href=wa(a.dataset.wa);a.target="_blank"});

// Mobile menu
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").onclick = e => { if(e.target.tagName==="A") $("#menu").classList.remove("open"); };

// Language toggle (English / Bangla)
let bn = false;
document.querySelectorAll("[data-bn]").forEach(e=>e.dataset.en=e.innerHTML);

