/* Online checkout: collects name, phone and email, then sends the cart to /api/checkout.
   The server prices the cart from the catalog and returns the EPS payment page link.
   No keys or secrets exist in this file. */
(function () {
  const m = $("#paymodal"), f = $("#payForm"), err = $("#payErr"), go = $("#payGo");
  const DIAL = [["BD","Bangladesh","880"],["CA","Canada","1"],["CN","China","86"],["CY","Cyprus","357"],["FI","Finland","358"],["FR","France","33"],["DE","Germany","49"],["HU","Hungary","36"],["IN","India","91"],["IT","Italy","39"],["KW","Kuwait","965"],["MY","Malaysia","60"],["MV","Maldives","960"],["NP","Nepal","977"],["OM","Oman","968"],["PK","Pakistan","92"],["QA","Qatar","974"],["SA","Saudi Arabia","966"],["SG","Singapore","65"],["KR","South Korea","82"],["ES","Spain","34"],["SE","Sweden","46"],["CH","Switzerland","41"],["TH","Thailand","66"],["AE","United Arab Emirates","971"],["GB","United Kingdom","44"],["US","United States","1"]];
  const ccSel = $("#payCc");
  ccSel.innerHTML = DIAL.map((d) => `<option value="${d[0]}">${d[1]} (+${d[2]})</option>`).join("");
  const dialOf = (c) => (DIAL.find((d) => d[0] === c) || DIAL[0])[2];
  const setCc = (c) => { ccSel.value = c; $("#payCcF").src = "https://flagcdn.com/w40/" + c.toLowerCase() + ".png"; $("#payCcT").textContent = "+" + dialOf(c); $("#payPhone").placeholder = c === "BD" ? "01XXXXXXXXX" : "Phone number"; };
  ccSel.addEventListener("change", () => setCc(ccSel.value));
  // Full number the server expects: Bangladesh as 01XXXXXXXXX, others as +<code><digits>.
  const fullPhone = () => {
    const raw = $("#payPhone").value.trim(), d = raw.replace(/\D/g, ""), c = ccSel.value;
    if (raw.startsWith("+")) { return "+" + d; }
    if (c === "BD") { const n = d.replace(/^880/, "").replace(/^0+/, ""); return n ? "0" + n : ""; }
    const n = d.replace(/^0+/, ""); return n ? "+" + dialOf(c) + n : "";
  };
  const splitPhone = (v) => {
    v = String(v || "");
    if (v.startsWith("+")) { const d = v.slice(1); const m = DIAL.filter((x) => d.startsWith(x[2])).sort((a, b) => b[2].length - a[2].length)[0]; if (m) { setCc(m[0]); return d.slice(m[2].length); } setCc("BD"); return v; }
    setCc("BD"); return v;
  };
  const LOCK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const lab = (t) => { go.innerHTML = LOCK + "<span>" + t + "</span>"; };
  const cpToggle = (on) => { $("#payCpBox").hidden = !on; $("#payCpT").hidden = on; $("#payCpT").setAttribute("aria-expanded", on ? "true" : "false"); };
  $("#payCpT").onclick = () => { cpToggle(true); setTimeout(() => $("#payCp").focus(), 50); };
  const KEY = "sx_buyer";
  const PHONE = /^(?:(?:\+?88)?01[3-9]\d{8}|\+[1-9]\d{7,14})$/, EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  try { const q = new URLSearchParams(location.search).get("coupon"); if (q) sessionStorage.setItem("sx_cp", q.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24)); } catch (e) {}
  let cp = null; // applied coupon {code, discount, label}; the server re-checks it when you pay
  const total = () => Math.max(1, cart.reduce((s, c) => s + c.q * c.p, 0) - (cp ? cp.discount : 0)) + tip;
  const itemsOf = () => cart.map((c) => ({ name: c.name, vr: c.vr, v: c.v, q: c.q }));
  const hdrs = (se) => se ? { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("sx_session") } : { "Content-Type": "application/json" };
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function sessEmail(){try{var t=localStorage.getItem("sx_session");if(!t)return "";var o=JSON.parse(atob(t.split(".")[0].replace(/-/g,"+").replace(/_/g,"/")));return o&&o.t==="sess"&&o.exp>Date.now()&&o.e?String(o.e):""}catch(e){return ""}}
  /* Signed in: the account email is fixed for the order (the server enforces it too). */
  function lockEmail() {
    const el = $("#payEmail"), se = sessEmail(); let h = $("#payLock");
    if (se) { el.value = se; el.readOnly = true; el.classList.add("is-lock"); if (!h) { h = document.createElement("small"); h.id = "payLock"; h.className = "pay-lock"; el.parentNode.appendChild(h); } h.textContent = "You are signed in, so your order uses your account email."; }
    else { el.readOnly = false; el.classList.remove("is-lock"); if (h) h.remove(); }
    return se;
  }
  function paintSum() {
    $("#paySum").innerHTML = cart.map((c) => `<div><span>${c.name}${c.vr ? " · " + c.vr : ""} · ${c.v} <em>×${c.q}</em></span><b>${taka(c.p * c.q)}</b></div>`).join("") + (cp ? `<div class="pay-disc"><span>Coupon ${esc(cp.code)} <em>${esc(cp.label)}</em></span><b>−${taka(cp.discount)}</b></div>` : "") + (tip ? `<div><span>Tip</span><b>${taka(tip)}</b></div>` : "") + `<div class="pay-tot"><span>Total</span><b>${taka(total())}</b></div>`;
    lab("Pay " + taka(total()) + " securely");
    const g = $("#payCp"), b = $("#payCpGo"); g.readOnly = !!cp; b.textContent = cp ? "Remove" : "Apply"; b.classList.toggle("on", !!cp);
  }
  async function applyCp() {
    const msg = $("#payCpM"), g = $("#payCp"), b = $("#payCpGo");
    if (cp) { cp = null; g.value = ""; msg.textContent = ""; msg.className = "pay-cpm"; paintSum(); return; }
    const code = g.value.trim();
    if (!code) { msg.className = "pay-cpm bad"; msg.textContent = "Enter a coupon code."; return; }
    b.disabled = true; msg.className = "pay-cpm"; msg.textContent = "Checking…";
    try {
      const se = sessEmail(), em = se || $("#payEmail").value.trim();
      const r = await fetch("/api/checkout", { method: "POST", headers: hdrs(se), body: JSON.stringify({ check: true, coupon: code, email: EMAIL.test(em) ? em : "", items: itemsOf() }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.discount) throw new Error(j.error || "Couldn't check the coupon. Please try again.");
      cp = { code: j.coupon, discount: j.discount, label: j.label }; g.value = j.coupon; msg.className = "pay-cpm ok"; msg.textContent = "Coupon applied. You save " + taka(j.discount) + "."; paintSum();
    } catch (x) { msg.className = "pay-cpm bad"; msg.textContent = x.message; }
    b.disabled = false;
  }
  $("#payCpGo").onclick = applyCp;
  $("#payCp").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); applyCp(); } });
  function open() {
    if (!cart.length) return;
    try { const b = JSON.parse(localStorage.getItem(KEY) || "{}"); $("#payName").value = b.n || ""; $("#payPhone").value = splitPhone(b.p); $("#payEmail").value = b.e || ""; } catch (e) {}
    lockEmail();
    cp = null; paintSum();
    const wl = $("#checkout"); if (wl) $("#payWa").href = wl.href;
    $("#payCpM").textContent = ""; $("#payCpM").className = "pay-cpm"; $("#payCp").value = (function () { try { return (new URLSearchParams(location.search).get("coupon") || sessionStorage.getItem("sx_cp") || "").toUpperCase().slice(0, 24); } catch (e) { return ""; } })();
    cpToggle(!!$("#payCp").value);
    err.textContent = ""; go.disabled = false;
    m.classList.add("show"); openCart(false); setTimeout(() => $("#payName").focus(), 300);
  }
  const close = () => m.classList.remove("show");

  m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".mdlx")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = "", name = $("#payName").value.trim(), phone = fullPhone(), se = sessEmail(), email = se || $("#payEmail").value.trim();
    if (name.length < 2) return (err.textContent = "Please enter your name.");
    if (!PHONE.test(phone)) return (err.textContent = "Enter a valid mobile number for the selected country.");
    if (!EMAIL.test(email)) return (err.textContent = "Enter a valid email address.");
    err.textContent = ""; go.disabled = true; go.classList.add("busy"); lab("Opening secure payment…");
    try { localStorage.setItem(KEY, JSON.stringify({ n: name, p: phone, e: se ? "" : email })); } catch (x) {}
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: se ? { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("sx_session") } : { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, tip, coupon: cp ? cp.code : "", comment: note.slice(0, 300), items: itemsOf() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.redirectUrl) throw new Error(j.error || "Online payment is unavailable right now. Please order on WhatsApp.");
      location.href = j.redirectUrl;
    } catch (x) {
      err.textContent = x.message || "Online payment is unavailable right now. Please order on WhatsApp.";
      if (/coupon/i.test(x.message || "")) { cp = null; paintSum(); }
      go.disabled = false; go.classList.remove("busy"); lab("Pay " + taka(total()) + " securely");
    }
  });

  /* Pay manually: show our accounts, then confirm the Transaction ID on WhatsApp. */
  const pf=$("#payForm"),pman=$("#payManual"),tabs=m.querySelectorAll(".pay-tabs button");
  const sumHtml=()=>$("#paySum").innerHTML;
  function showTab(t){
    const man=t==="manual";
    pf.hidden=man;pman.hidden=!man;
    tabs.forEach(b=>{const on=b.dataset.pt===t;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
    if(man){$("#paySumM").innerHTML=sumHtml();try{const b=JSON.parse(localStorage.getItem(KEY)||"{}");if(!$("#pmName").value)$("#pmName").value=b.n||""}catch(e){}$("#pmErr").textContent=""}
    m.querySelector(".mdlb").scrollTop=0;
  }
  tabs.forEach(b=>b.onclick=()=>showTab(b.dataset.pt));
  const _open=open;
  $("#payBtn").onclick=()=>{_open();showTab("online")};
  pman.addEventListener("click",e=>{
    const b=e.target.closest(".mp-cp");if(!b)return;
    const v=b.dataset.cp,done=()=>{b.textContent="Copied";b.classList.add("ok");setTimeout(()=>{b.textContent="Copy";b.classList.remove("ok")},1400)};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(v).then(done,()=>{});else{const t=document.createElement("textarea");t.value=v;document.body.appendChild(t);t.select();try{document.execCommand("copy");done()}catch(x){}t.remove()}
  });
  $("#payManF").addEventListener("submit",e=>{
    e.preventDefault();
    const name=$("#pmName").value.trim(),tx=$("#pmTx").value.trim().replace(/\s+/g,""),via=$("#pmVia").value,er=$("#pmErr");
    if(name.length<2)return(er.textContent="Please enter your name.");
    if(tx.length<6)return(er.textContent="Enter the Transaction ID from your payment.");
    er.textContent="";
    try{const b=JSON.parse(localStorage.getItem(KEY)||"{}");b.n=name;localStorage.setItem(KEY,JSON.stringify(b))}catch(x){}
    const lines=cart.map((c,i)=>(i+1)+". "+c.name+(c.vr?" · "+c.vr:"")+" · "+c.v+" ×"+c.q+" = "+taka(c.p*c.q));
    const msg="Hi StreamX! I paid manually.\n\n"+lines.join("\n")+(cp?"\nCoupon: "+cp.code+" (−"+taka(cp.discount)+")":"")+"\nTotal paid: "+taka(total())+"\nPaid with: "+via+"\nTransaction ID: "+tx+"\nName: "+name;
    window.open("https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(msg),"_blank","noopener");
  });
})();
