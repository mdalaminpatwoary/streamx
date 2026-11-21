/* Digital receipt: draws a branded A4 receipt on a canvas and saves it as a one-page PDF (no libraries). */
(function () {
  "use strict";
  var W = 1240, H = 1754, RED = "#ed3124", INK = "#12162b", MUT = "#6b7390", LINE = "#e6e8f0", BG = "#f6f7fb";
  var FONT = "Manrope, 'Segoe UI', system-ui, -apple-system, Arial, sans-serif";
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var taka = function (n) { return "BDT " + Number(n).toLocaleString("en-US"); };
  var dBD = function (iso) { var d = new Date(Date.parse(iso) + 6 * 3600000); return d.getUTCDate() + " " + MON[d.getUTCMonth()] + " " + d.getUTCFullYear(); };
  var dDay = function (iso) { var d = new Date(iso + "T00:00:00Z"); return d.getUTCDate() + " " + MON[d.getUTCMonth()] + " " + d.getUTCFullYear(); };

  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit(c, t, max) { t = String(t); if (c.measureText(t).width <= max) return t; while (t.length > 2 && c.measureText(t + "…").width > max) t = t.slice(0, -1); return t.replace(/\s+$/, "") + "…"; }
  function txt(c, t, x, y, o) { o = o || {}; c.font = (o.w || 500) + " " + (o.s || 26) + "px " + FONT; c.fillStyle = o.c || INK; c.textAlign = o.a || "left"; c.textBaseline = "alphabetic"; c.fillText(o.m ? fit(c, t, o.m) : t, x, y); }

  function draw(o, who, logo) {
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H; var c = cv.getContext("2d");
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    // header band
    var g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "#0f1226"); g.addColorStop(1, "#2a1030"); c.fillStyle = g; c.fillRect(0, 0, W, 250);
    c.fillStyle = RED; c.fillRect(0, 250, W, 8);
    if (logo) { c.save(); rr(c, 80, 62, 96, 96, 22); c.clip(); c.drawImage(logo, 80, 62, 96, 96); c.restore(); }
    txt(c, "StreamX", 200, 112, { w: 800, s: 44, c: "#fff" });
    txt(c, "Digital subscriptions · streamx.bd", 200, 152, { s: 23, c: "#b9c0e0" });
    txt(c, "RECEIPT", W - 80, 112, { w: 800, s: 54, c: "#fff", a: "right" });
    txt(c, "Digital receipt", W - 80, 152, { s: 23, c: "#b9c0e0", a: "right" });

    var off = o.kind === "offline", ok = o.delivery === "delivered";
    var no = "#" + String(o.id).slice(-8).toUpperCase();
    // meta row
    var y = 340;
    var meta = [["RECEIPT NO.", no], ["DATE", dBD(o.date)], ["CHANNEL", off ? (o.channel || "StreamX") : "Online"]];
    meta.forEach(function (m, i) { var x = 80 + i * 330; txt(c, m[0], x, y, { w: 700, s: 20, c: MUT }); txt(c, m[1], x, y + 40, { w: 800, s: 32, m: 300 }); });
    // status pill
    var st = off || ok ? "PAID" : "PAYMENT RECEIVED", sw = 40 + st.length * 15;
    rr(c, W - 80 - sw, y - 28, sw, 56, 28); c.fillStyle = "#e3f8ee"; c.fill();
    txt(c, st, W - 80 - sw / 2, y + 8, { w: 800, s: 22, c: "#0f9d58", a: "center" });
    c.fillStyle = LINE; c.fillRect(80, 420, W - 160, 2);

    // billed to
    y = 490;
    txt(c, "BILLED TO", 80, y, { w: 700, s: 20, c: MUT });
    var line = y + 44;
    if (who.name) { txt(c, who.name, 80, line, { w: 800, s: 32, m: 520 }); line += 40; }
    txt(c, who.email, 80, line, { s: 26, c: INK, m: 520 }); line += 36;
    if (who.phone) txt(c, who.phone, 80, line, { s: 26, c: MUT });
    // payment box
    var pay = [];
    if (off) { pay.push(["Payment method", o.pay_method || "—"]); if (o.txn_id) pay.push(["Transaction ID", o.txn_id]); }
    else { pay.push(["Payment", "Paid online"]); pay.push(["Delivery", ok ? "Delivered" + (o.delivered_at ? " · " + dBD(o.delivered_at) : "") : "Processing"]); }
    pay.forEach(function (p, i) { var yy = y + i * 76; txt(c, p[0].toUpperCase(), 680, yy, { w: 700, s: 20, c: MUT }); txt(c, p[1], 680, yy + 36, { w: 700, s: 28, m: 480 }); });

    // table
    var ty = 740;
    rr(c, 80, ty, W - 160, 64, 14); c.fillStyle = BG; c.fill();
    txt(c, "ITEM", 108, ty + 41, { w: 800, s: 20, c: MUT }); txt(c, "QTY", 800, ty + 41, { w: 800, s: 20, c: MUT, a: "center" }); txt(c, "AMOUNT", W - 108, ty + 41, { w: 800, s: 20, c: MUT, a: "right" });
    var ry = ty + 64, total = 0, priced = o.lines.length > 0;
    o.lines.forEach(function (l) {
      var q = l.q || 1, amt = l.price > 0 ? l.price * q : 0; if (!(l.price > 0)) priced = false; total += amt;
      txt(c, l.name, 108, ry + 50, { w: 800, s: 30, m: 560 });
      if (l.plan) txt(c, l.plan, 108, ry + 86, { s: 23, c: MUT, m: 560 });
      txt(c, "× " + q, 800, ry + 50, { w: 600, s: 26, c: MUT, a: "center" });
      txt(c, amt ? taka(amt) : "—", W - 108, ry + 50, { w: 800, s: 28, a: "right" });
      c.fillStyle = LINE; c.fillRect(108, ry + 112, W - 216, 2); ry += 124;
    });
    // total
    ry += 20;
    if (priced && total) {
      rr(c, W - 80 - 460, ry, 460, 96, 18); var tg = c.createLinearGradient(W - 540, ry, W - 80, ry + 96); tg.addColorStop(0, "#ed3124"); tg.addColorStop(1, "#b81d14"); c.fillStyle = tg; c.fill();
      txt(c, "TOTAL PAID", W - 80 - 430, ry + 58, { w: 800, s: 22, c: "#ffd9d5" }); txt(c, taka(total), W - 80 - 30, ry + 61, { w: 800, s: 38, c: "#fff", a: "right" });
      ry += 96;
    } else { txt(c, "Amount not recorded for this purchase.", W - 80, ry + 30, { s: 23, c: MUT, a: "right" }); ry += 30; }
    if (off && o.end) { ry += 70; txt(c, "VALID UNTIL", 80, ry, { w: 700, s: 20, c: MUT }); txt(c, dDay(o.end), 80, ry + 40, { w: 800, s: 30 }); }

    // footer
    var fy = H - 250;
    c.fillStyle = LINE; c.fillRect(80, fy, W - 160, 2);
    txt(c, "Thank you for choosing StreamX.", 80, fy + 62, { w: 800, s: 32 });
    txt(c, "Need help with this order? Message us on WhatsApp +880 1312-850241 or visit streamx.bd.", 80, fy + 106, { s: 24, c: MUT });
    txt(c, "This is a computer-generated receipt and does not need a signature. It is proof of purchase, not a tax invoice.", 80, fy + 150, { s: 21, c: MUT });
    txt(c, "Generated " + dBD(new Date().toISOString()), 80, fy + 188, { s: 20, c: "#9aa1bd" });
    c.fillStyle = RED; c.fillRect(0, H - 14, W, 14);
    return cv;
  }

  /* One-page A4 PDF holding the receipt as a JPEG. */
  function pdf(cv) {
    var b64 = cv.toDataURL("image/jpeg", 0.92).split(",")[1], bin = atob(b64), n = bin.length, img = new Uint8Array(n);
    for (var i = 0; i < n; i++) img[i] = bin.charCodeAt(i);
    var enc = new TextEncoder(), parts = [], off = [], len = 0;
    var push = function (d) { var u = typeof d === "string" ? enc.encode(d) : d; parts.push(u); len += u.length; };
    var obj = function (s) { off.push(len); push(s); };
    push("%PDF-1.4\n");
    obj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    obj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
    obj("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
    off.push(len); push("4 0 obj\n<< /Type /XObject /Subtype /Image /Width " + cv.width + " /Height " + cv.height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + n + " >>\nstream\n"); push(img); push("\nendstream\nendobj\n");
    var cs = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q";
    obj("5 0 obj\n<< /Length " + cs.length + " >>\nstream\n" + cs + "\nendstream\nendobj\n");
    var xr = len; push("xref\n0 6\n0000000000 65535 f \n");
    off.forEach(function (o) { push(("0000000000" + o).slice(-10) + " 00000 n \n"); });
    push("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xr + "\n%%EOF");
    return new Blob(parts, { type: "application/pdf" });
  }

  function loadLogo() { return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = "/assets/img/brand/logo.png"; }); }

  function run(btn) {
    var o = (window.sxOrders || [])[+btn.dataset.rc], who = window.sxWho || {}; if (!o) return;
    var label = btn.querySelector("span"), old = label.textContent; btn.disabled = true; label.textContent = "Preparing…";
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([loadLogo(), fontsReady]).then(function (r) {
      var blob = pdf(draw(o, who, r[0])), a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "StreamX-receipt-" + String(o.id).slice(-8).toUpperCase() + ".pdf";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      label.textContent = "Saved"; btn.classList.add("ok");
    }).catch(function () { label.textContent = "Try again"; }).then(function () { setTimeout(function () { label.textContent = old; btn.disabled = false; btn.classList.remove("ok"); }, 1800); });
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-rc]"); if (b) run(b); });
})();
