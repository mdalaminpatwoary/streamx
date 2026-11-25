/* Manual payment methods: mobile banking, mobile recharge and bank accounts, with copy buttons and a WhatsApp confirm form.
   Used by the checkout pop-up and by the shareable /pay/ page.
   Logo files (optional): put them in assets/img/pay/ named as in LOGO below. Without a file, a coloured badge shows. */
(function () {
  const WA = (typeof WA_NUMBER !== "undefined" && WA_NUMBER) || "8801312850241";
  const RECHARGE_FEE = 0.05;
  const LOGO = { bkash: "bkash.png", nagad: "nagad.png", rocket: "rocket.png", upay: "upay.png", gp: "gp.png", city: "bank-city.png", brac: "bank-brac.png", ific: "bank-ific.png", prime: "bank-prime.png" };
  const N1 = "01309009329", N2 = "01312850241", N3 = "01956476739";
  const BANKS = [
    { k: "prime", name: "Prime Bank", c: "#c8102e", ini: "PB", rows: [["Account name", "Md. Al-Amin Patwoary"], ["Account number", "2186213026702"], ["Type", "Prime Savings Account"], ["Branch", "Jatrabari"], ["Routing number", "170273220"]] },
    { k: "brac", name: "BRAC Bank", c: "#0072bc", ini: "BR", rows: [["Account name", "Md. Al-Amin Patwoary"], ["Account number", "1060251990001"], ["Type", "Savings"], ["Branch", "Dhaka South > Demra SME"], ["Routing number", "060271495"]] },
    { k: "ific", name: "IFIC Bank", c: "#00923f", ini: "IF", rows: [["Account name", "Md Al Amin Patwoary"], ["Account number", "0230143018811"], ["Type", "Savings"], ["Branch", "Konapara"], ["Routing number", "120273746"]] },
    { k: "city", name: "The City Bank", c: "#e30613", ini: "CB", rows: [["Account name", "MD. AL-AMIN PATWOARY"], ["Account number", "2104034777001"], ["Type", "General Savings A/C"], ["Branch", "Jatrabari Branch"], ["Routing number", "225273238"]] },
  ];
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tk = (n) => "৳" + Number(n).toLocaleString("en-US");
  const COPY = '<svg class="i-cp" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><svg class="i-ok" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const cp = (v, l) => `<button type="button" class="mp-cp" data-cp="${esc(v)}" aria-label="Copy ${esc(l)}" title="Copy">${COPY}</button>`;
  const lg = (k, ini, c, alt) => `<span class="mp-lg" style="--c:${c}"><img src="/assets/img/pay/${LOGO[k]}" alt="${esc(alt)}" loading="lazy" onerror="this.remove()"><i>${ini}</i></span>`;
  const row = (l, v) => `<div class="mp-r"><span>${esc(l)}</span><b>${esc(v)}</b>${cp(v, l)}</div>`;

  const amtNote = '<div class="mp-amt" data-amt hidden></div>';
  const opt = (k, ini, c, name, tag, via, body, logos, showT) => `<details class="mp-o" style="--c:${c}" data-via="${via}"><summary>${logos || lg(k, ini, c, name)}<span class="mp-ot${showT ? "" : " sr"}"><b>${name}</b><small>${tag}</small></span><i class="mp-chev" aria-hidden="true"></i></summary><div class="mp-ob">${body}${amtNote}</div></details>`;
  const bankBody = BANKS.map((b) => `<details class="mp-b" style="--c:${b.c}" data-via="${b.name}"><summary>${lg(b.k, b.ini, b.c, b.name)}<b class="sr">${b.name}</b><i class="mp-chev" aria-hidden="true"></i></summary><div class="mp-bd">${b.rows.map((r) => row(r[0], r[1])).join("")}</div></details>`).join("");
  function html() {
    return `<ol class="mp-steps"><li>Choose how you want to pay.</li><li>Send the exact total, then enter your Transaction ID.</li><li>Confirm on WhatsApp. We verify the payment and deliver.</li></ol>
<div class="mp-list">
${opt("bkash", "bK", "#e2136e", "bKash", "Personal or Merchant", "bKash", `<div class="mp-sub"><p>Personal · Send Money</p>${row("Number", N1)}</div><div class="mp-sub"><p>Merchant · Payment</p>${row("Number", N2)}</div>`)}
${opt("nagad", "NG", "#f6602b", "Nagad", "Send Money", "Nagad", row("Number", N3))}
${opt("rocket", "RK", "#8c3494", "Rocket", "Send Money", "Rocket", row("Number", N3))}
${opt("upay", "UP", "#f5b800", "Upay", "Send Money", "Upay", row("Number", N3))}
${opt("", "", "#4F6BFF", "Bank Transfer", BANKS.length + " banks", "Bank transfer", `<div class="mp-bl">${bankBody}</div>`, `<span class="mp-lgs">${BANKS.map((b) => lg(b.k, b.ini, b.c, b.name)).join("")}</span>`)}
${opt("gp", "GP", "#00a1e0", "Mobile Recharge", "Grameenphone · +5% extra", "Grameenphone recharge", row("Number", N1), "", false)}
</div>
<form class="mp-f" novalidate>
  <label><span class="pay-l">Your name</span><input class="pm-in" data-f="name" type="text" autocomplete="name" placeholder="e.g. Rafiq Ahmed" maxlength="60"></label>
  <div class="mp-fa" data-amtwrap hidden><label><span class="pay-l">Amount you paid (৳)</span><input class="pm-in" data-f="amt" type="number" inputmode="decimal" min="1" placeholder="e.g. 450"></label></div>
  <label><span class="pay-l">Transaction ID</span><input class="pm-in" data-f="tx" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. 9A7B6C5D4E" maxlength="40"></label>
  <p class="pay-err" data-err role="alert"></p>
  <button class="btn wa mp-go" type="submit">Confirm on WhatsApp ↗</button>
  <p class="pay-agree">Delivery starts after we verify the payment. If the amount or ID doesn't match, we will message you. See our <a href="/refund-policy/" target="_blank" rel="noopener">Refund Policy</a>.</p>
</form>`;
  }

  /* cfg: { getTotal(): number|null, getLines(): string[], askAmount: bool, onName(n) } */
  function mount(root, cfg) {
    cfg = cfg || {};
    root.classList.add("pm");
    root.innerHTML = html();
    const q = (s) => root.querySelector(s), f = (n) => q('[data-f="' + n + '"]');
    function refresh() {
      q("[data-amtwrap]").hidden = !cfg.askAmount;
      const t = cfg.getTotal && cfg.getTotal(), amt = f("amt"), v = t || (amt && Number(amt.value)) || 0;
      root.querySelectorAll("[data-amt]").forEach((p) => {
        p.hidden = !v; if (!v) return;
        const rc = p.closest(".mp-o").dataset.via === "Grameenphone recharge", pay = rc ? Math.ceil(v * (1 + RECHARGE_FEE)) : v;
        p.innerHTML = `<div class="mp-amt-r"><span>${rc ? "Recharge amount" : "Amount to pay"}</span><b>${tk(pay)}</b></div>${cp(String(pay), "amount")}` + (rc ? `<small>${tk(v)} + 5% recharge charge (${tk(pay - v)})</small>` : "");
      });
    }
    const setVia = (v) => { via = v || ""; };
    // One option open at a time; opening one fills "Paid with"
    root.addEventListener("toggle", (e) => {
      const d = e.target;
      if (!d.open) { if (!root.querySelector(".mp-o[open]")) setVia(""); else if (d.classList.contains("mp-b")) setVia(d.closest(".mp-o").dataset.via); return; }
      if (d.classList.contains("mp-o")) {
        root.querySelectorAll(".mp-o[open]").forEach((o) => { if (o !== d) o.open = false; });
        const b1 = d.querySelector(".mp-b[open]"); setVia(b1 ? b1.dataset.via : d.dataset.via);
        setTimeout(() => d.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
      } else if (d.classList.contains("mp-b")) {
        d.parentNode.querySelectorAll(".mp-b[open]").forEach((o) => { if (o !== d) o.open = false; });
        setVia(d.dataset.via);
      }
    }, true);
    refresh();
    if (f("amt")) f("amt").addEventListener("input", refresh);
    root.addEventListener("click", (e) => {
      const b = e.target.closest(".mp-cp"); if (!b) return;
      const v = b.dataset.cp, done = () => { b.classList.add("ok"); setTimeout(() => b.classList.remove("ok"), 1500); };
      const old = () => { const t = document.createElement("textarea"); t.value = v; t.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (x) {} t.remove(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, old); else old();
    });
    root.querySelector(".mp-f").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = f("name").value.trim(), tx = f("tx").value.trim().replace(/\s+/g, ""), er = q("[data-err]");
      const t = cfg.getTotal && cfg.getTotal(), amt = t || Number(f("amt") && f("amt").value) || 0;
      if (name.length < 2) return (er.textContent = "Please enter your name.");
      if (cfg.askAmount && !(amt > 0)) return (er.textContent = "Enter the amount you paid.");
      if (!via) return (er.textContent = "Tap the option you paid with above.");
      if (tx.length < 6) return (er.textContent = "Enter the Transaction ID from your payment.");
      er.textContent = ""; if (cfg.onName) cfg.onName(name);
      const lines = (cfg.getLines && cfg.getLines()) || [];
      const msg = "Hi StreamX! I paid manually.\n\n" + (lines.length ? lines.join("\n") + "\n" : "") + (amt ? (via === "Grameenphone recharge" ? "Order total: " + tk(amt) + "\nRecharged: " + tk(Math.ceil(amt * (1 + RECHARGE_FEE))) + " (incl. 5% recharge charge)\n" : "Amount paid: " + tk(amt) + "\n") : "") + "Paid with: " + via + "\nTransaction ID: " + tx + "\nName: " + name;
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
    return { refresh, setName: (n) => { if (n && !f("name").value) f("name").value = n; }, reset: () => { q("[data-err]").textContent = ""; } };
  }
  window.PayMethods = { mount };
})();
