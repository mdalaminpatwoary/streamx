/* Owner page: orders, subscriptions, and how each customer signs in (account access). */
(function () {
  "use strict";
  var PROD = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var key = ""; try { key = sessionStorage.getItem("sx_admin") || ""; } catch (e) {}
  var api = function (qs, opt) { opt = opt || {}; opt.headers = Object.assign({ "x-admin-key": key, "Content-Type": "application/json" }, opt.headers || {}); return fetch("/api/admin" + (qs || ""), opt).then(function (r) { return r.json().catch(function () { return { error: "Server answered " + r.status + ". The API may not be deployed yet." }; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || "Error"); e.status = r.status; throw e; } return j; }); }); };
  var today = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
  var days = function (a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); };
  var isGift = function (n) { return /gift card$/i.test(n || ""); };
  var isStream = function (n) { return PROD.some(function (p) { return p.name === n && p.cat === "Streaming"; }); };

  /* ---------- Account access editor (used in the Add form and in the edit dialog) ---------- */
  var MODES = [
    ["email_pass", "Email + password", "✉️"], ["email_otp", "Email + OTP", "✉️"],
    ["phone_otp", "Number + OTP", "📱"], ["own", "Customer mail/number", "👤"]
  ];
  var MODE_NAME = { email_pass: "Email + password", email_otp: "Email + OTP", phone_otp: "Number + OTP", own: "Customer mail/number", phone_pass: "Number + password", number: "Number only", none: "Not set yet" };
  var VPN_C = [["IN", "India"], ["US", "United States"]];
  var CCS = [["BD", "+880", "Bangladesh"], ["IN", "+91", "India"]];
  var PLATS = [["web", "Web"], ["ios", "iOS"], ["android", "Android"], ["tablet", "Tablet"], ["tv", "TV"]];
  var vOpts = function (sel) { return '<option value="">Choose a country</option>' + VPN_C.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === sel ? " selected" : "") + ">" + esc(c[1]) + "</option>"; }).join(""); };
  var cOpts = function (sel) { return COUNTRIES.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === sel ? " selected" : "") + ">" + esc(c[1]) + "</option>"; }).join(""); };
  var uid = 0;
  /* "+8801712345678" -> {cc:"BD", local:"1712345678"} */
  function splitPhone(p) { p = String(p || "").replace(/[^\d+]/g, ""); if (/^\+?880/.test(p)) return { cc: "BD", local: p.replace(/^\+?880/, "") }; if (/^\+?91/.test(p)) return { cc: "IN", local: p.replace(/^\+?91/, "") }; return { cc: "BD", local: p.replace(/^\+/, "") }; }
  function giftRow(g, n) { return '<div class="ad-gr"><span class="ad-gn">' + n + '</span><input class="ac-in" data-g="amount" placeholder="Amount e.g. $10" value="' + esc(g.amount) + '" autocomplete="off"><input class="ac-in" data-g="code" placeholder="Redeem code" value="' + esc(g.code) + '" autocomplete="off"><button type="button" class="ad-x" data-grm aria-label="Remove card">✕</button></div>'; }
  function accessHTML(a, svc, multi) {
    a = a || {}; var g = a.gift || {}, v = a.vpn || {}, d = a.devices || {}, n = "m" + (++uid), mode = a.mode, ph = splitPhone(a.phone);
    if (mode === "phone_pass" || mode === "number") mode = "phone_otp"; else if (!MODE_NAME[mode] || mode === "none") mode = "email_pass";
    var stream = isStream(svc), devs = (d.items || []);
    return '<div class="ad-acc" data-svc="' + esc(svc) + '"' + (multi ? ' data-multi="1"' : "") + ">" +
      '<div class="ad-sec" data-only="login"><div class="ad-lab">How does the customer sign in?</div><div class="ad-modes">' + MODES.map(function (m) { return '<label class="ad-mode"><input type="radio" name="' + n + '" value="' + m[0] + '"' + (m[0] === mode ? " checked" : "") + '><span><i>' + m[2] + "</i>" + m[1] + "</span></label>"; }).join("") + "</div>" +
      '<div class="ad-grid2">' +
        '<div data-m="email_pass email_otp"><label>Account email</label><input class="ac-in" data-a="acct_email" value="' + esc(mode === "own" ? "" : a.email) + '" autocomplete="off"></div>' +
        '<div data-m="phone_otp"><label>Account number</label><div class="ad-ph"><select class="ac-in" data-a="acct_cc">' + CCS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === ph.cc ? " selected" : "") + ">" + c[0] + " " + c[1] + "</option>"; }).join("") + '</select><input class="ac-in" data-a="acct_local" value="' + esc(ph.local) + '" inputmode="tel" placeholder="1712345678" autocomplete="off"></div></div>' +
        '<div data-m="email_pass"><label>Password</label><input class="ac-in" data-a="acct_pass" value="' + esc(a.password) + '" autocomplete="off"></div>' +
        '<div data-m="own"><label>Activated on <small>(mail or number, blank = customer\'s email)</small></label><input class="ac-in" data-a="own_val" value="' + esc(a.email || a.phone) + '" autocomplete="off"></div>' +
        '<div data-m="own"><label>Family mail <small>(optional)</small></label><input class="ac-in" data-a="acct_family" value="' + esc(a.family) + '" autocomplete="off"></div>' +
        '<div data-m="email_pass email_otp phone_otp"><label>Profile name <small>(optional)</small></label><input class="ac-in" data-a="acct_profile" value="' + esc(a.profile) + '" autocomplete="off"></div>' +
        '<div data-m="email_pass email_otp phone_otp"><label>Profile PIN <small>(optional)</small></label><input class="ac-in" data-a="acct_pin" value="' + esc(a.pin) + '" inputmode="numeric" autocomplete="off"></div>' +
      "</div>" +
      '<div class="ad-vpn"><label class="ad-sw"><input type="checkbox" data-a="vpn_required"' + (v.required ? " checked" : "") + '><b></b><span>VPN required</span></label><div class="ad-vc" hidden><span class="ad-flag"></span><select class="ac-in" data-a="vpn_country">' + vOpts(v.country) + "</select></div></div></div>" +
      (stream ? '<div class="ad-sec" data-only="login"><div class="ad-lab">Devices <small>(optional, shown to the customer, up to 3)</small></div><div class="ad-devs">' + [0, 1, 2].map(function (i) { var x = devs[i] || {}; return '<div class="ad-dev"><select class="ac-in" data-dt="' + i + '" aria-label="Device ' + (i + 1) + ' type"><option value="">Type</option>' + PLATS.map(function (p) { return '<option value="' + p[0] + '"' + (x.type === p[0] ? " selected" : "") + ">" + p[1] + "</option>"; }).join("") + '</select><input class="ac-in" data-dn="' + i + '" maxlength="30" placeholder="Device name" value="' + esc(x.name || "") + '" autocomplete="off"></div>'; }).join("") + '</div><div class="ad-lab2">Device login limit <small>(optional)</small></div><input class="ac-in ad-lim" data-a="dev_limit" type="number" min="1" max="20" placeholder="e.g. 3" value="' + esc(d.limit || "") + '"></div>' : "") +
      '<div class="ad-sec" data-only="gift" hidden><div class="ad-lab">Gift card' + (multi ? "s <small>(one order can hold several cards with different amounts)</small>" : "") + "</div>" +
        (multi ? '<div class="ad-glist">' + giftRow({}, 1) + '</div><button type="button" class="ac-btn ac-ghost ac-sm" data-gadd>+ Add another card</button><div style="margin-top:14px;max-width:260px"><label>Region</label><select class="ac-in" data-a="gift_region">' + cOpts(g.region || "US") + "</select></div>"
               : '<div class="ad-grid2"><div class="ad-wide"><label>Redeem code</label><input class="ac-in" data-a="gift_code" value="' + esc(g.code) + '" autocomplete="off"></div><div><label>Region</label><select class="ac-in" data-a="gift_region">' + cOpts(g.region || "US") + '</select></div><div><label>Amount</label><input class="ac-in" data-a="gift_amount" value="' + esc(g.amount) + '" placeholder="$10" autocomplete="off"></div></div>') +
        '<p class="ac-note">Valid for 6 months from the start date.</p></div></div>';
  }
  function syncAccess(root) {
    var svc = root.dataset.svc, gift = isGift(svc), mode = (root.querySelector("input[type=radio]:checked") || {}).value || "email_pass";
    root.querySelectorAll('[data-only="login"]').forEach(function (s) { s.hidden = gift; }); root.querySelector('[data-only="gift"]').hidden = !gift;
    root.querySelectorAll("[data-m]").forEach(function (d) { d.hidden = d.dataset.m.split(" ").indexOf(mode) < 0; });
    var vc = root.querySelector(".ad-vc"), on = root.querySelector('[data-a="vpn_required"]').checked; vc.hidden = !on;
    var cc = root.querySelector('[data-a="vpn_country"]').value; vc.querySelector(".ad-flag").innerHTML = cc ? flagImg(cc) : "";
  }
  /* Returns a message if something typed is not usable, otherwise "". */
  function accessError(root) {
    if (isGift(root.dataset.svc)) return "";
    var m = (root.querySelector("input[type=radio]:checked") || {}).value;
    if (m === "phone_otp") { var l = root.querySelector('[data-a="acct_local"]').value.replace(/\D/g, "").replace(/^0/, ""); if (l && l.length !== 10) return "Enter the 10-digit mobile number without the country code."; }
    return "";
  }
  function readAccess(root) {
    var q = function (k) { var e = root.querySelector('[data-a="' + k + '"]'); return e ? (e.type === "checkbox" ? e.checked : e.value.trim()) : ""; };
    if (isGift(root.dataset.svc)) {
      if (root.dataset.multi) return { gift_region: q("gift_region"), gifts: [].map.call(root.querySelectorAll(".ad-gr"), function (r) { return { amount: r.querySelector('[data-g="amount"]').value.trim(), code: r.querySelector('[data-g="code"]').value.trim() }; }).filter(function (g) { return g.amount; }) };
      return { gift_code: q("gift_code"), gift_region: q("gift_region"), gift_amount: q("gift_amount") };
    }
    var m = (root.querySelector("input[type=radio]:checked") || {}).value || "email_pass", em = m === "email_pass" || m === "email_otp", ph = m === "phone_otp", own = m === "own", pw = m === "email_pass", lg = !own;
    var local = q("acct_local").replace(/\D/g, "").replace(/^0/, ""), cc = q("acct_cc") === "IN" ? "+91" : "+880", ov = q("own_val");
    var out = { acct_mode: m, acct_email: em ? q("acct_email") : own && ov.indexOf("@") > -1 ? ov : "", acct_phone: ph ? (local ? cc + local : "") : own && ov && ov.indexOf("@") < 0 ? ov : "", acct_pass: pw ? q("acct_pass") : "", acct_profile: lg ? q("acct_profile") : "", acct_pin: lg ? q("acct_pin") : "", acct_family: own ? q("acct_family") : "", vpn_required: q("vpn_required"), vpn_country: q("vpn_required") ? q("vpn_country") : "" };
    if (isStream(root.dataset.svc)) {
      var lim = parseInt(q("dev_limit"), 10), items = [0, 1, 2].map(function (i) { return { type: root.querySelector('[data-dt="' + i + '"]').value, name: root.querySelector('[data-dn="' + i + '"]').value.trim() }; }).filter(function (x) { return x.type || x.name; }).map(function (x) { return { type: x.type || "web", name: x.name }; });
      out.acct_devices = { items: items, limit: lim >= 1 && lim <= 20 ? lim : null };
    }
    return out;
  }
  document.addEventListener("change", function (e) { var r = e.target.closest(".ad-acc"); if (r) syncAccess(r); });
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-gadd]"), rm = e.target.closest("[data-grm]");
    if (add) { var l = add.parentNode.querySelector(".ad-glist"); if (l.children.length < 20) { l.insertAdjacentHTML("beforeend", giftRow({}, l.children.length + 1)); l.lastChild.querySelector("input").focus(); } }
    if (rm) { var list = rm.closest(".ad-glist"); if (list.children.length > 1) { rm.closest(".ad-gr").remove(); [].forEach.call(list.children, function (r, i) { r.querySelector(".ad-gn").textContent = i + 1; }); } }
  });

  /* ---------- Add form ---------- */
  var P = PROD;
  $("#svc").innerHTML = P.map(function (p) { return "<option>" + esc(p.name) + "</option>"; }).join("");
  function plans() {
    var name = $("#svc").value, p = P.filter(function (x) { return x.name === name; })[0], o = [], gift = isGift(name);
    $("#pwrap").hidden = gift;
    if (!gift) { p.variants.forEach(function (v) { v.plans.forEach(function (pl) { o.push({ t: (p.variants.length > 1 ? v.n + " · " : "") + pl.v, m: pl.m }); }); }); $("#pln").innerHTML = o.map(function (x) { return '<option data-m="' + x.m + '">' + esc(x.t) + "</option>"; }).join(""); }
    var box = $("#accbox"); box.innerHTML = accessHTML({ mode: "email_pass" }, name, true); syncAccess(box.firstChild);
  }
  $("#svc").addEventListener("change", plans); plans();

  /* ---------- Subscriptions ---------- */
  function accSummary(s) {
    var a = s.access || {}, g = a.gift || {}, v = a.vpn || {}, h = "";
    if (isGift(s.service)) return '<span class="ad-pill ' + (g.code ? "ok" : "warn") + '">' + (g.code ? "Code added" : "Code needed") + "</span>" + (g.amount ? '<span class="ad-pill">' + esc(g.amount) + (g.region ? " · " + esc(g.region) : "") + "</span>" : "");
    var m = a.mode || "none"; h = '<span class="ad-pill ' + (m === "none" ? "warn" : "ok") + '">' + esc(MODE_NAME[m] || m) + "</span>";
    var who = /phone|number/.test(m) ? a.phone : (a.email || a.phone); if (who) h += '<small class="ad-who">' + esc(who) + "</small>";
    if (v.required) h += '<span class="ad-pill">VPN ' + (v.country ? flagImg(v.country) + " " + esc(v.country) : "") + "</span>";
    if (a.family) h += '<small class="ad-who">Family mail: ' + esc(a.family) + "</small>";
    return h;
  }
  function list() {
    api("?q=" + encodeURIComponent($("#q").value.trim())).then(function (d) {
      $("#gate").hidden = true; $("#panel").hidden = false; $("#lock").hidden = false; orders(); notices();
      SUBS = d.rows;
      $("#rows").innerHTML = d.rows.map(function (s, i) {
        var left = days(today, s.end_date), c = left < 0 ? "#ef4444" : left <= 7 ? "#f59e0b" : "#22c55e";
        return '<tr><td data-l="Customer"><div><b>' + esc(s.name || "") + "</b><br>" + esc(s.email) + "<br>" + esc(s.phone || "") + '</div></td><td data-l="Service"><div><b>' + esc(s.service) + "</b><br>" + esc(s.plan) + "<br><small>" + esc(s.source) + '</small></div></td><td data-l="Access"><div class="ad-accs">' + accSummary(s) + '</div></td><td data-l="Expires"><input class="ac-in" type="date" value="' + esc(s.end_date) + '" data-end="' + s.id + '" style="padding:6px 8px;width:150px"></td><td data-l="Left"><span class="ad-chip" style="color:' + c + '">' + (left < 0 ? "Expired" : left + " days") + '</span></td><td data-l=""><div class="ad-btns"><button class="ac-btn ac-sm" data-edit="' + i + '">Edit access</button><button class="ad-x" data-del="' + s.id + '">Delete</button></div></td></tr>';
      }).join("");
      stats(); $("#cnt").textContent = d.rows.length + " shown (latest 300). Change a date and click away to save.";
    }).catch(function (e) { if (e.status === 401) { key = ""; try { sessionStorage.removeItem("sx_admin"); } catch (x) {} $("#panel").hidden = true; $("#gate").hidden = false; $("#gm").textContent = e.message; } else { $("#cnt").textContent = e.message; $("#gm").textContent = e.message; } });
  }
  var ORD = [], SUBS = [];
  function stats() {
    var p = ORD.filter(function (o) { return (o.delivery || "pending") === "pending"; }).length, dn = ORD.length - p;
    var act = SUBS.filter(function (s) { return days(today, s.end_date) >= 0; }).length, soon = SUBS.filter(function (s) { var l = days(today, s.end_date); return l >= 0 && l <= 7; }).length;
    $("#s1").textContent = p; $("#s2").textContent = dn; $("#s3").textContent = act; $("#s4").textContent = soon; $("#tc1").textContent = p; $("#tc2").textContent = SUBS.length;
  }
  /* ---------- Notice board ---------- */
  var KIND = { info: "Update", offer: "Offer", maintenance: "Maintenance", important: "Important" };
  function notices() {
    api("?view=notices").then(function (j) {
      var r = j.rows || [], now = Date.now(); $("#tc3").textContent = r.length;
      $("#nlist").innerHTML = r.length ? r.map(function (n) {
        var gone = n.expires_at && Date.parse(n.expires_at) < now;
        return '<div class="ad-nr' + (gone ? " old" : "") + '"><span class="ad-nk k-' + esc(n.kind) + '">' + esc(KIND[n.kind] || "Update") + '</span><div><b>' + esc(n.title) + "</b>" + (n.message ? "<p>" + esc(n.message) + "</p>" : "") + "<small>" + esc(new Date(n.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })) + (n.expires_at ? " · " + (gone ? "expired " : "hides ") + esc(n.expires_at.slice(0, 10)) : "") + '</small></div><button class="ad-x" data-ndel="' + n.id + '" aria-label="Delete notice">✕</button></div>';
      }).join("") : '<p class="ac-note">No notices yet.</p>';
    }).catch(function (e) { $("#nlist").innerHTML = '<p class="ac-msg err" style="display:block">' + esc(e.message.indexOf("notices") > -1 || e.message.indexOf("DB") > -1 ? "Notice board is not set up yet. Run the new SQL in Supabase first." : e.message) + "</p>"; });
  }
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "nf") return; e.preventDefault();
    var f = e.target, m = $("#nm"), b = f.querySelector("button"); m.className = "ac-msg"; m.textContent = "";
    if (!f.title.value.trim()) { m.className = "ac-msg err"; m.textContent = "Please add a title."; return; }
    b.disabled = true;
    api("?notice=new", { method: "POST", body: JSON.stringify({ title: f.title.value, message: f.message.value, kind: f.kind.value, expires_at: f.expires_at.value ? f.expires_at.value + "T23:59:59+06:00" : "" }) })
      .then(function () { f.reset(); toast("Notice posted"); notices(); })
      .catch(function (er) { m.className = "ac-msg err"; m.textContent = er.message; }).then(function () { b.disabled = false; });
  });
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-ndel]"); if (!d || !confirm("Delete this notice?")) return;
    api("?notice=" + d.dataset.ndel, { method: "DELETE" }).then(function () { toast("Notice deleted"); notices(); }).catch(function (er) { toast(er.message, true); });
  });
  function toast(m, bad) { var t = $("#toast"); t.textContent = m; t.className = "ad-toast on" + (bad ? " err" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = "ad-toast"; }, 3200); }
  document.querySelectorAll(".ad-tab").forEach(function (b) { b.addEventListener("click", function () { document.querySelectorAll(".ad-tab").forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); }); document.querySelectorAll(".ad-pane").forEach(function (p) { p.hidden = p.dataset.p !== b.dataset.t; }); }); });
  function orders() {
    api("?view=orders").then(function (d) { ORD = d.rows; drawOrders(); stats(); }).catch(function (e) { $("#ocnt").textContent = e.message; });
  }
  function drawOrders() {
    var f = $("#of").value, rows = ORD.filter(function (o) { return f === "all" || (o.delivery || "pending") === f; });
    $("#orows").innerHTML = rows.map(function (o) {
      var dn = o.delivery === "delivered", t = new Date(Date.parse(o.paid_at || o.created_at) + 6 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
      var items = (o.lines || []).map(function (l) { return esc(l.name) + " · " + esc(l.plan) + (l.q > 1 ? " ×" + l.q : ""); }).join("<br>");
      return '<tr><td data-l="Paid">' + esc(t) + '</td><td data-l="Customer"><div><b>' + esc(o.name || "") + "</b><br>" + esc(o.email) + "<br>" + esc(o.phone || "") + '</div></td><td data-l="Bought"><div>' + items + '</div></td><td data-l="Order ID" class="ad-id">' + esc(o.mtid) + '</td><td data-l="Delivery"><button class="ac-btn ac-sm' + (dn ? " ac-ghost" : "") + '" data-dv="' + esc(o.mtid) + '" data-to="' + (dn ? "pending" : "delivered") + '">' + (dn ? "Delivered ✓ (undo)" : "Mark delivered") + "</button></td></tr>";
    }).join("");
    $("#ocnt").textContent = rows.length + " order" + (rows.length === 1 ? "" : "s") + ". Only paid orders appear here.";
  }
  $("#of").addEventListener("change", drawOrders);
  $("#gf").addEventListener("submit", function (e) { e.preventDefault(); key = $("#ak").value; try { sessionStorage.setItem("sx_admin", key); } catch (x) {} $("#gm").textContent = ""; list(); });
  $("#lock").addEventListener("click", function () { key = ""; try { sessionStorage.removeItem("sx_admin"); } catch (x) {} $("#panel").hidden = true; $("#gate").hidden = false; $("#lock").hidden = true; $("#ak").value = ""; });
  var t; $("#q").addEventListener("input", function () { clearTimeout(t); t = setTimeout(list, 300); });

  $("#af").addEventListener("submit", function (e) {
    e.preventDefault(); var f = e.target, m = $("#am"), name = f.service.value, gift = isGift(name), o = f.plan.selectedOptions[0], box = $("#accbox").firstChild, er = accessError(box);
    if (er) { m.className = "ac-msg"; m.textContent = er; return; }
    var acc = readAccess(box);
    if (gift && !acc.gifts.length) { m.className = "ac-msg"; m.textContent = "Add at least one gift card with an amount."; return; }
    var body = Object.assign({ email: f.email.value, name: f.name.value, phone: f.phone.value, service: name, plan: gift ? "Gift card" : o.value, months: gift ? 6 : +o.dataset.m, start: f.start.value || null, notes: f.notes.value }, acc);
    api("", { method: "POST", body: JSON.stringify(body) })
      .then(function (d) { var n = (d.rows || [d.row]).length; m.className = "ac-msg ok"; m.textContent = d.warn ? "Added, but account details were not saved: " + d.warn : (gift && n > 1 ? n + " gift cards added. " : "Added. ") + "Expires " + d.row.end_date + "."; toast(d.warn ? "Added, but account details were not saved." : gift && n > 1 ? n + " gift cards added." : "Subscription added."); f.email.value = f.name.value = f.phone.value = f.start.value = f.notes.value = ""; plans(); list(); })
      .catch(function (er) { m.className = "ac-msg"; m.textContent = er.message; });
  });

  /* Edit access dialog */
  var dlg = $("#dlg"), cur = null;
  $("#rows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-edit]"), d = e.target.closest("[data-del]");
    if (b) { cur = SUBS[+b.dataset.edit]; $("#dt").textContent = cur.service + " · " + cur.plan; $("#ds").textContent = cur.email; $("#dbody").innerHTML = accessHTML(cur.access, cur.service); syncAccess($("#dbody").firstChild); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
    if (d && confirm("Delete this subscription?")) api("?id=" + d.dataset.del, { method: "DELETE" }).then(function () { toast("Deleted."); list(); }).catch(function (er) { toast(er.message, 1); });
  });
  var closeDlg = function () { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); };
  $("#dx").addEventListener("click", closeDlg);
  $("#dsave").addEventListener("click", function () {
    if (!cur) return; var er = accessError($("#dbody").firstChild); if (er) { toast(er, 1); return; } var b = this; b.disabled = true;
    api("?id=" + cur.id, { method: "PATCH", body: JSON.stringify(readAccess($("#dbody").firstChild)) })
      .then(function () { toast("Saved."); closeDlg(); list(); }).catch(function (er) { toast(er.message, 1); }).then(function () { b.disabled = false; });
  });
  $("#rows").addEventListener("change", function (e) { var i = e.target.closest("[data-end]"); if (i && i.value) api("?id=" + i.dataset.end, { method: "PATCH", body: JSON.stringify({ end_date: i.value }) }).then(function () { toast("Date saved."); list(); }).catch(function (er) { toast(er.message, 1); }); });
  if (key) list();
})();
