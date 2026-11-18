/* Online checkout: collects name, phone and email, then sends the cart to /api/checkout.
   The server prices the cart from the catalog and returns the EPS payment page link.
   No keys or secrets exist in this file. */
(function () {
  const m = $("#paymodal"), f = $("#payForm"), err = $("#payErr"), go = $("#payGo");
  const KEY = "sx_buyer";
  const PHONE = /^(?:\+?88)?01[3-9]\d{8}$/, EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const total = () => cart.reduce((s, c) => s + c.q * c.p, 0) + tip;

  function open() {
    if (!cart.length) return;
    try { const b = JSON.parse(localStorage.getItem(KEY) || "{}"); $("#payName").value = b.n || ""; $("#payPhone").value = b.p || ""; $("#payEmail").value = b.e || ""; } catch (e) {}
    $("#paySum").innerHTML = cart.map((c) => `<div><span>${c.name}${c.vr ? " · " + c.vr : ""} · ${c.v} <em>×${c.q}</em></span><b>${taka(c.p * c.q)}</b></div>`).join("") + (tip ? `<div><span>Tip</span><b>${taka(tip)}</b></div>` : "") + `<div class="pay-tot"><span>Total</span><b>${taka(total())}</b></div>`;
    $("#payGo").textContent = "Pay " + taka(total()) + " securely";
    const wl = $("#checkout"); if (wl) $("#payWa").href = wl.href;
    err.textContent = ""; go.disabled = false;
    m.classList.add("show"); openCart(false); setTimeout(() => $("#payName").focus(), 300);
  }
  const close = () => m.classList.remove("show");

  $("#payBtn").onclick = open;
  m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".mdlx")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#payName").value.trim(), phone = $("#payPhone").value.replace(/[\s-]/g, ""), email = $("#payEmail").value.trim();
    if (name.length < 2) return (err.textContent = "Please enter your name.");
    if (!PHONE.test(phone)) return (err.textContent = "Enter a valid mobile number, e.g. 01712345678.");
    if (!EMAIL.test(email)) return (err.textContent = "Enter a valid email address.");
    err.textContent = ""; go.disabled = true; go.classList.add("busy"); go.textContent = "Opening secure payment…";
    try { localStorage.setItem(KEY, JSON.stringify({ n: name, p: phone, e: email })); } catch (x) {}
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, tip, comment: $("#cmIn").value.trim(), items: cart.map((c) => ({ name: c.name, vr: c.vr, v: c.v, q: c.q })) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.redirectUrl) throw new Error(j.error || "Online payment is unavailable right now. Please order on WhatsApp.");
      location.href = j.redirectUrl;
    } catch (x) {
      err.textContent = x.message || "Online payment is unavailable right now. Please order on WhatsApp.";
      go.disabled = false; go.classList.remove("busy"); go.textContent = "Pay " + taka(total()) + " securely";
    }
  });
})();
