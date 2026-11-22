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
      $("#gate").hidden = true; $("#panel").hidden = false; $("#lock").hidden = false; orders(); notices(); reviews(); coupons(); custs();
      SUBS = d.rows;
      $("#rows").innerHTML = d.rows.map(function (s, i) {
        var left = days(today, s.end_date), c = left < 0 ? "#ef4444" : left <= 7 ? "#f59e0b" : "#22c55e";
        return '<tr><td data-l="Customer"><div><b>' + esc(s.name || "") + "</b><br>" + esc(s.email) + "<br>" + esc(s.phone || "") + (s.manual_id ? '<br><small class="ad-who">Manual ID ' + esc(s.manual_id) + "</small>" : "") + '</div></td><td data-l="Service"><div><b>' + esc(s.service) + "</b><br>" + esc(s.plan) + "<br><small>" + esc(s.source) + '</small></div></td><td data-l="Access"><div class="ad-accs">' + accSummary(s) + '</div></td><td data-l="Expires"><input class="ac-in" type="date" value="' + esc(s.end_date) + '" data-end="' + s.id + '" style="padding:6px 8px;width:150px"></td><td data-l="Left"><span class="ad-chip" style="color:' + c + '">' + (left < 0 ? "Expired" : left + " days") + '</span></td><td data-l=""><div class="ad-btns"><button class="ac-btn ac-sm" data-edit="' + i + '">Edit</button><button class="ad-x" data-del="' + s.id + '">Delete</button></div></td></tr>';
      }).join("");
      stats(); $("#cnt").textContent = d.rows.length + " shown (latest 300). Change a date and click away to save.";
    }).catch(function (e) { if (e.status === 401) { key = ""; try { sessionStorage.removeItem("sx_admin"); } catch (x) {} $("#panel").hidden = true; $("#gate").hidden = false; $("#gm").textContent = e.message; } else { $("#cnt").textContent = e.message; $("#gm").textContent = e.message; } });
  }
  var ORD = [], SUBS = [];
  function stats() {
    var p = ORD.filter(function (o) { return (o.delivery || "pending") === "pending"; }).length, dn = ORD.filter(function (o) { return o.delivery === "delivered"; }).length;
    var act = SUBS.filter(function (s) { return days(today, s.end_date) >= 0; }).length, soon = SUBS.filter(function (s) { var l = days(today, s.end_date); return l >= 0 && l <= 7; }).length;
    $("#s1").textContent = p; $("#s2").textContent = dn; $("#s3").textContent = act; $("#s4").textContent = soon; $("#tc1").textContent = p; $("#tc2").textContent = SUBS.length;
  }
  /* ---------- Notice board ---------- */
  var KIND = { info: "Update", price: "Price change", offer: "Offer", maintenance: "Maintenance", important: "Important" };
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
    api("?notice=new", { method: "POST", body: JSON.stringify({ title: f.title.value, message: f.message.value, kind: f.kind.value, link: f.link.value, link_label: f.link_label.value, pinned: f.pinned.checked, expires_at: f.expires_at.value ? f.expires_at.value + "T23:59:59+06:00" : "" }) })
      .then(function () { f.reset(); toast("Notice posted"); notices(); })
      .catch(function (er) { m.className = "ac-msg err"; m.textContent = er.message; }).then(function () { b.disabled = false; });
  });
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-ndel]"); if (!d || !confirm("Delete this notice?")) return;
    api("?notice=" + d.dataset.ndel, { method: "DELETE" }).then(function () { toast("Notice deleted"); notices(); }).catch(function (er) { toast(er.message, true); });
  });
  /* ---------- Reviews ---------- */
  var RPROOF = "";
  function stars(n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  (function () {
    var names = PROD.filter(function (p) { return p.cat !== "18+"; }).map(function (p) { return p.name; });
    $("#rsv").innerHTML = names.map(function (n) { return '<label class="ad-chip"><input type="checkbox" value="' + esc(n) + '"><span>' + esc(n) + "</span></label>"; }).join("");
  })();
  var CTRY = [["BD", "Bangladesh"], ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"], ["QA", "Qatar"], ["KW", "Kuwait"], ["OM", "Oman"], ["BH", "Bahrain"], ["MY", "Malaysia"], ["SG", "Singapore"], ["GB", "United Kingdom"], ["US", "United States"], ["CA", "Canada"], ["AU", "Australia"], ["IT", "Italy"], ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"], ["NL", "Netherlands"], ["SE", "Sweden"], ["NO", "Norway"], ["DK", "Denmark"], ["FI", "Finland"], ["IE", "Ireland"], ["PT", "Portugal"], ["GR", "Greece"], ["JP", "Japan"], ["KR", "South Korea"], ["CN", "China"], ["HK", "Hong Kong"], ["IN", "India"], ["NP", "Nepal"], ["LK", "Sri Lanka"], ["PK", "Pakistan"], ["TH", "Thailand"], ["TR", "Türkiye"], ["JO", "Jordan"], ["LB", "Lebanon"], ["ZA", "South Africa"], ["NZ", "New Zealand"], ["BN", "Brunei"], ["MV", "Maldives"], ["MU", "Mauritius"], ["RU", "Russia"], ["UA", "Ukraine"], ["PL", "Poland"], ["BR", "Brazil"], ["MX", "Mexico"], ["EG", "Egypt"], ["NG", "Nigeria"], ["KE", "Kenya"]];
  var RPHOTO = "";
  (function () {
    $("#rcc").innerHTML = '<option value="">Not specified</option>' + CTRY.map(function (c) { return '<option value="' + c[0] + '">' + esc(c[1]) + "</option>"; }).join("");
  })();
  function cropSquare(file, size) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(im.width, im.height), c = document.createElement("canvas"); c.width = c.height = size;
        c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, size, size); URL.revokeObjectURL(u);
        var q = 0.85, d = c.toDataURL("image/jpeg", q); while (d.length > 100000 && q > 0.45) { q -= 0.1; d = c.toDataURL("image/jpeg", q); } ok(d);
      };
      im.onerror = function () { no(new Error("That file could not be read as an image.")); }; im.src = u;
    });
  }
  function setPhoto(d) { RPHOTO = d || ""; var p = $("#rpv"); p.style.backgroundImage = d ? "url(" + d + ")" : ""; p.textContent = d ? "" : "?"; $("#rpx").hidden = !d; }
  document.addEventListener("change", function (e) {
    if (e.target.id === "rpf" && e.target.files[0]) cropSquare(e.target.files[0], 240).then(setPhoto).catch(function (er) { e.target.value = ""; toast(er.message, true); });
    if (e.target.name === "kind" && e.target.form && e.target.form.id === "rf") { var st = e.target.value === "student"; $("#rrl").textContent = st ? "Class / degree" : "Designation"; e.target.form.role.placeholder = st ? "e.g. BSc in CSE, Class 10" : "e.g. Software Engineer"; $("#rcow").hidden = st; $("#rinw").hidden = !st; }
    if (e.target.id === "rcc") $("#rxw").hidden = !e.target.value || e.target.value === "BD";
  });
  document.addEventListener("click", function (e) { if (e.target.id === "rpx") { setPhoto(""); $("#rpf").value = ""; } });
  function reviews() {
    api("?view=reviews").then(function (j) {
      var r = j.rows || []; $("#tc5").textContent = r.length;
      $("#rlist").innerHTML = r.length ? r.map(function (v) {
        var pf = v.proof_kind === "image" && v.has_img ? "Screenshot" : v.proof_kind === "link" ? "Link" : "";
        return '<div class="ad-rr"><span class="ad-av"' + (v.has_photo ? ' style="background:url(/api/catalog?a=rvimg&amp;w=photo&amp;id=' + v.id + ') center/cover"' : "") + ">" + (v.has_photo ? "" : esc(String(v.name).split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase())) + '</span><div><b>' + esc(v.name) + '</b> <span class="ad-st">' + stars(v.rating) + "</span>" + (v.popular ? ' <span class="ad-pill feat">Featured</span>' : "") + '<p>' + esc(v.body) + "</p><small>" + esc([v.role, v.kind === "student" ? v.institution : v.company, v.loc].filter(Boolean).join(" · ")) + (v.country ? " · " + flagImg(v.country) + " " + esc(v.country) + (v.expat ? " (expatriate)" : "") : "") + ((v.services || []).length ? " · " + esc(v.services.join(", ")) : "") + "</small>" + (pf ? '<span class="ad-pill ok">Proof: ' + pf + "</span>" : '<span class="ad-pill warn">No proof</span>') + '</div><div class="ad-ra"><button type="button" class="ac-btn ac-ghost ac-sm" data-rfeat="' + v.id + '" data-on="' + (v.popular ? 1 : 0) + '">' + (v.popular ? "Remove from featured" : "Feature") + '</button><button type="button" class="ac-btn ac-ghost ac-sm" data-rdel="' + v.id + '">Delete</button></div></div>';
      }).join("") : '<p class="ac-note">No reviews yet.</p>';
    }).catch(function (e) { $("#rlist").innerHTML = '<p class="ac-msg err" style="display:block">' + esc(/reviews|DB|relation/i.test(e.message) ? "Reviews are not set up yet. Run the new SQL in Supabase first." : e.message) + "</p>"; });
  }
  document.addEventListener("change", function (e) {
    if (e.target.name !== "proof") return; RPROOF = e.target.value; $("#pfImg").hidden = RPROOF !== "image"; $("#pfLink").hidden = RPROOF !== "link";
  });
  // Shrink a screenshot to a small JPEG so it stays light in the database
  function shrink(file) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var m = 900, k = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        var q = 0.8, d = c.toDataURL("image/jpeg", q); while (d.length > 300000 && q > 0.4) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
        d.length > 390000 ? no(new Error("That image is too large. Try a smaller screenshot.")) : ok(d);
      };
      im.onerror = function () { no(new Error("That file could not be read as an image.")); }; im.src = u;
    });
  }
  var SHOT = "";
  document.addEventListener("change", function (e) {
    if (e.target.id !== "pfFile" || !e.target.files[0]) return;
    shrink(e.target.files[0]).then(function (d) { SHOT = d; var p = $("#pfPrev"); p.src = d; p.hidden = false; }).catch(function (er) { SHOT = ""; e.target.value = ""; $("#pfPrev").hidden = true; toast(er.message, true); });
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "rf") return; e.preventDefault();
    var f = e.target, m = $("#rm"), b = f.querySelector("button[type=submit]"); m.className = "ac-msg"; m.textContent = "";
    var stu = f.kind.value === "student"; var err = stu && !f.institution.value.trim() ? "Please add the school or university." : !f.name.value.trim() || !f.body.value.trim() ? "Please add the customer's name and the review text." : RPROOF === "image" && !SHOT ? "Choose the screenshot of the original review." : RPROOF === "link" && !/^https?:\/\//i.test(f.proof_url.value.trim()) ? "The review link must start with https://" : "";
    if (err) { m.className = "ac-msg err"; m.textContent = err; return; }
    var sv = Array.prototype.map.call(f.querySelectorAll("#rsv input:checked"), function (i) { return i.value; });
    b.disabled = true;
    api("?review=new", { method: "POST", body: JSON.stringify({ name: f.name.value, kind: f.kind.value, role: f.role.value, company: f.company.value, institution: f.institution.value, country: f.country.value, expat: f.expat.checked, photo_img: RPHOTO, loc: f.loc.value, photo: f.photo.value, rating: f.rating.value, body: f.body.value, services: sv, popular: f.popular.checked, proof_kind: RPROOF, proof_url: f.proof_url.value, proof_img: RPROOF === "image" ? SHOT : "" }) })
      .then(function () { f.reset(); setPhoto(""); $("#rcow").hidden = false; $("#rinw").hidden = true; $("#rxw").hidden = true; $("#rrl").textContent = "Designation"; SHOT = ""; RPROOF = ""; $("#pfPrev").hidden = true; $("#pfImg").hidden = true; $("#pfLink").hidden = true; toast("Review posted"); reviews(); })
      .catch(function (er) { m.className = "ac-msg err"; m.textContent = er.message; }).then(function () { b.disabled = false; });
  });
  document.addEventListener("click", function (e) {
    var ft = e.target.closest("[data-rfeat]");
    if (ft) { ft.disabled = true; var on = ft.dataset.on !== "1"; api("?review=" + ft.dataset.rfeat, { method: "PATCH", body: JSON.stringify({ popular: on }) }).then(function () { toast(on ? "Added to featured reviews" : "Removed from featured reviews"); reviews(); }).catch(function (er) { ft.disabled = false; toast(er.message, true); }); return; }
    var d = e.target.closest("[data-rdel]"); if (!d || !confirm("Delete this review? This cannot be undone.")) return;
    api("?review=" + d.dataset.rdel, { method: "DELETE" }).then(function () { toast("Review deleted"); reviews(); }).catch(function (er) { toast(er.message, true); });
  });
  /* ---------- Coupons ---------- */
  (function () {
    var names = PROD.filter(function (p) { return p.cat !== "18+" && p.cat !== "Bundle"; }).map(function (p) { return p.name; });
    $("#csv").innerHTML = names.map(function (n) { return '<label class="ad-chip"><input type="checkbox" value="' + esc(n) + '"><span>' + esc(n) + "</span></label>"; }).join("");
  })();
  function coupons() {
    api("?view=coupons").then(function (j) {
      var r = j.rows || []; $("#tc6").textContent = r.filter(function (c) { return c.active; }).length;
      $("#clist").innerHTML = r.length ? r.map(function (c) {
        var gone = c.expires_at && Date.parse(c.expires_at) < Date.now(), full = c.max_uses > 0 && c.used >= c.max_uses, st = !c.active ? "Paused" : gone ? "Expired" : full ? "Fully used" : "Active";
        var rule = (c.kind === "fixed" ? "৳" + c.value + " off" : c.value + "% off" + (c.max_discount ? " (max ৳" + c.max_discount + ")" : "")) + (c.min_order ? " · min ৳" + c.min_order : "") + ((c.services || []).length ? " · " + esc(c.services.join(", ")) : " · whole cart") + (c.per_email ? " · once per email" : "") + (c.expires_at ? " · until " + esc(new Date(c.expires_at).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric" })) : "");
        return '<div class="ad-rr"><span class="ad-av ad-cd">%</span><div><b class="ad-code">' + esc(c.code) + '</b> <span class="ad-pill ' + (st === "Active" ? "ok" : "warn") + '">' + st + "</span><p>" + rule + "</p><small>Used " + c.used + (c.max_uses ? " / " + c.max_uses : "") + " times · customers saved ৳" + (c.saved || 0).toLocaleString("en-US") + (c.note ? " · " + esc(c.note) : "") + '</small></div><div class="ad-cb"><button type="button" class="ac-btn ac-ghost ac-sm" data-ctog="' + c.id + '" data-on="' + (c.active ? 1 : 0) + '">' + (c.active ? "Pause" : "Resume") + '</button><button type="button" class="ac-btn ac-ghost ac-sm" data-cdel="' + c.id + '">Delete</button></div></div>';
      }).join("") : '<p class="ac-note">No coupons yet.</p>';
    }).catch(function (e) { $("#clist").innerHTML = '<p class="ac-msg err" style="display:block">' + esc(/coupons|DB|relation/i.test(e.message) ? "Coupons are not set up yet. Run the new SQL in Supabase first." : e.message) + "</p>"; });
  }
  document.addEventListener("change", function (e) {
    if (e.target.name !== "kind" || !e.target.form || e.target.form.id !== "cf") return;
    var pc = e.target.value === "percent", f = e.target.form; $("#cvl").textContent = pc ? "Percent *" : "Taka off *"; f.value.max = pc ? 100 : 100000; f.value.placeholder = pc ? "10" : "100"; $("#cmaxw").hidden = !pc;
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "cf") return; e.preventDefault();
    var f = e.target, m = $("#cm"), b = f.querySelector("button[type=submit]"); m.className = "ac-msg"; m.textContent = "";
    if (f.code.value.trim().length < 3 || !(+f.value.value >= 1)) { m.className = "ac-msg err"; m.textContent = "Add a code (3+ characters) and the discount amount."; return; }
    var sv = Array.prototype.map.call(f.querySelectorAll("#csv input:checked"), function (i) { return i.value; });
    b.disabled = true;
    api("?coupon=new", { method: "POST", body: JSON.stringify({ code: f.code.value, kind: f.kind.value, value: f.value.value, max_discount: f.max_discount.value, min_order: f.min_order.value, max_uses: f.max_uses.value, per_email: f.per_email.checked, expires_at: f.expires_at.value ? f.expires_at.value + "T23:59:59+06:00" : "", note: f.note.value, services: sv }) })
      .then(function () { f.reset(); $("#cvl").textContent = "Percent *"; $("#cmaxw").hidden = false; toast("Coupon created"); coupons(); })
      .catch(function (er) { m.className = "ac-msg err"; m.textContent = er.message; }).then(function () { b.disabled = false; });
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-ctog]"), d = e.target.closest("[data-cdel]");
    if (t) { api("?coupon=" + t.dataset.ctog, { method: "PATCH", body: JSON.stringify({ active: t.dataset.on !== "1" }) }).then(function () { toast("Coupon updated"); coupons(); }).catch(function (er) { toast(er.message, true); }); }
    if (d && confirm("Delete this coupon? Past orders keep their discount.")) api("?coupon=" + d.dataset.cdel, { method: "DELETE" }).then(function () { toast("Coupon deleted"); coupons(); }).catch(function (er) { toast(er.message, true); });
  });
  function toast(m, bad) { var t = $("#toast"); t.textContent = m; t.className = "ad-toast on" + (bad ? " err" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = "ad-toast"; }, 3200); }
  document.querySelectorAll(".ad-tab").forEach(function (b) { b.addEventListener("click", function () { document.querySelectorAll(".ad-tab").forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); }); document.querySelectorAll(".ad-pane").forEach(function (p) { p.hidden = p.dataset.p !== b.dataset.t; }); }); });
  function orders() {
    api("?view=orders").then(function (d) { ORD = d.rows; drawOrders(); stats(); }).catch(function (e) { $("#ocnt").textContent = e.message; });
  }
  function drawOrders() {
    var f = $("#of").value, rows = ORD.filter(function (o) { return f === "all" || (o.delivery || "pending") === f; });
    $("#orows").innerHTML = rows.map(function (o) {
      var dn = o.delivery === "delivered", rf = o.delivery === "refunded", t = new Date(Date.parse(o.paid_at || o.created_at) + 6 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
      var items = (o.lines || []).map(function (l) { return esc(l.name) + " · " + esc(l.plan) + (l.q > 1 ? " ×" + l.q : ""); }).join("<br>");
      return '<tr><td data-l="Paid">' + esc(t) + '</td><td data-l="Customer"><div><b>' + esc(o.name || "") + "</b><br>" + esc(o.email) + "<br>" + esc(o.phone || "") + '</div></td><td data-l="Bought"><div>' + items + '</div></td><td data-l="Order ID" class="ad-id">' + esc(o.mtid) + '</td><td data-l="Delivery"><div class="ad-btns">' + (rf ? '<span class="ad-pill warn">Refunded</span><button class="ac-btn ac-sm ac-ghost" data-dv="' + esc(o.mtid) + '" data-to="pending">Undo</button>' : '<button class="ac-btn ac-sm' + (dn ? " ac-ghost" : "") + '" data-dv="' + esc(o.mtid) + '" data-to="' + (dn ? "pending" : "delivered") + '">' + (dn ? "Delivered ✓ (undo)" : "Mark delivered") + '</button><button class="ac-btn ac-sm ac-ghost" data-dv="' + esc(o.mtid) + '" data-to="refunded">Refunded</button>') + "</div></td></tr>";
    }).join("");
    $("#ocnt").textContent = rows.length + " order" + (rows.length === 1 ? "" : "s") + ". Only paid orders appear here.";
  }
  $("#of").addEventListener("change", drawOrders);
  var rdlg = $("#rdlg"), rcur = null;
  function openRefund(id) {
    var o = ORD.filter(function (x) { return x.mtid === id; })[0]; if (!o) return; rcur = o;
    var tot = (o.lines || []).reduce(function (t, l) { return t + (l.price > 0 ? l.price * (l.q || 1) : 0); }, 0);
    $("#rds").textContent = (o.name || "") + " · " + o.email; $("#rda").value = tot || ""; $("#rdf").value = ""; $("#rdc").value = o.phone || ""; $("#rdr").value = ""; $("#rdn").value = ""; $("#rdt").checked = true;
    if (rdlg.showModal) rdlg.showModal(); else rdlg.setAttribute("open", "");
  }
  var closeR = function () { if (rdlg.close) rdlg.close(); else rdlg.removeAttribute("open"); };
  $("#rdx").addEventListener("click", closeR);
  $("#rdsave").addEventListener("click", function () {
    if (!rcur) return; var b = this, id = rcur.mtid; b.disabled = true; b.textContent = "Saving…";
    var refund = { amount: +$("#rda").value || 0, fee: +$("#rdf").value || 0, method: $("#rdm").value, account: $("#rdc").value, ref: $("#rdr").value, note: $("#rdn").value, notify: $("#rdt").checked };
    api("?order=" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ delivery: "refunded", refund: refund }) })
      .then(function (d) {
        ORD.forEach(function (o) { if (o.mtid === id) { o.delivery = "refunded"; o.delivered_at = null; } });
        closeR(); drawOrders(); stats();
        toast(d.mailed ? "Marked as refunded. Email sent to the customer." : d.mailNote ? "Marked as refunded. " + d.mailNote : "Marked as refunded.", !d.mailed && !!d.mailNote);
      }).catch(function (er) { toast(er.message || "Could not update the order.", 1); }).then(function () { b.disabled = false; b.textContent = "Mark refunded"; });
  });
  $("#orows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-dv]"); if (!b || b.disabled) return;
    var id = b.dataset.dv, to = b.dataset.to;
    if (to === "pending" && !confirm("Move this order back to Not delivered?")) return;
    if (to === "refunded") { openRefund(id); return; }
    var label = b.textContent; b.disabled = true; b.textContent = "Saving…";
    api("?order=" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ delivery: to }) })
      .then(function (d) {
        ORD.forEach(function (o) { if (o.mtid === id) { o.delivery = to; o.delivered_at = d.row && d.row.delivered_at || null; } });
        drawOrders(); stats();
        toast(to === "delivered" ? (d.mailed ? "Marked delivered. Email sent to the customer." : d.mailNote ? "Marked delivered. " + d.mailNote : "Marked delivered.") : "Moved back to Not delivered.", to === "delivered" && !d.mailed && !!d.mailNote);
      })
      .catch(function (er) { b.disabled = false; b.textContent = label; toast(er.message || "Could not update the order.", 1); });
  });
  $("#gf").addEventListener("submit", function (e) { e.preventDefault(); key = $("#ak").value; try { sessionStorage.setItem("sx_admin", key); } catch (x) {} $("#gm").textContent = ""; list(); });
  $("#lock").addEventListener("click", function () { key = ""; try { sessionStorage.removeItem("sx_admin"); } catch (x) {} $("#panel").hidden = true; $("#gate").hidden = false; $("#lock").hidden = true; $("#ak").value = ""; });
  $("#sheetsync").addEventListener("click", function (e) { var b = e.currentTarget; b.disabled = true; api("?sheetsync=1", { method: "POST", body: "{}" }).then(function (d) { b.disabled = false; toast(d.ok ? "Sent " + d.count + " purchase" + (d.count === 1 ? "" : "s") + " to the sheet" : (d.error || "Could not reach the sheet"), !d.ok); }).catch(function (er) { b.disabled = false; toast(er.message, true); }); });
  var t; $("#q").addEventListener("input", function () { clearTimeout(t); t = setTimeout(list, 300); });

  $("#af").addEventListener("submit", function (e) {
    e.preventDefault(); var f = e.target, m = $("#am"), name = f.service.value, gift = isGift(name), o = f.plan.selectedOptions[0], box = $("#accbox").firstChild, er = accessError(box);
    if (er) { m.className = "ac-msg"; m.textContent = er; return; }
    var acc = readAccess(box);
    if (gift && !acc.gifts.length) { m.className = "ac-msg"; m.textContent = "Add at least one gift card with an amount."; return; }
    var body = Object.assign({ email: f.email.value, name: f.name.value, phone: f.phone.value, service: name, plan: gift ? "Gift card" : o.value, months: gift ? 6 : +o.dataset.m, start: f.start.value || null, notes: f.notes.value, price: f.price.value, pay_method: f.pay_method.value, txn_id: f.txn_id.value, channel: f.channel.value }, acc);
    api("", { method: "POST", body: JSON.stringify(body) })
      .then(function (d) { var n = (d.rows || [d.row]).length; m.className = "ac-msg ok"; m.textContent = d.warn ? "Added, but account details were not saved: " + d.warn : (gift && n > 1 ? n + " gift cards added. " : "Added. ") + "Expires " + d.row.end_date + "."; toast(d.warn ? "Added, but account details were not saved." : gift && n > 1 ? n + " gift cards added." : "Subscription added."); f.email.value = f.name.value = f.phone.value = f.start.value = f.notes.value = f.price.value = f.txn_id.value = ""; f.pay_method.value = ""; f.channel.value = ""; plans(); list(); })
      .catch(function (er) { m.className = "ac-msg"; m.textContent = er.message; });
  });

  /* Edit dialog: purchase details + login access */
  var PAYM = ["Cash", "bKash", "Nagad", "Rocket", "Upay", "Bank transfer", "Online (EPS)", "Other"], CHAN = ["WhatsApp", "Facebook", "Instagram", "Phone call", "Website", "Other"];
  function opts(list, val) { var l = list.slice(); if (val && l.indexOf(val) < 0) l.unshift(val); return '<option value="">Not recorded</option>' + l.map(function (o) { return "<option" + (o === val ? " selected" : "") + ">" + esc(o) + "</option>"; }).join(""); }
  function fld(label, inner, wide) { return "<div" + (wide ? ' style="grid-column:1/-1"' : "") + "><label>" + label + "</label>" + inner + "</div>"; }
  function inp(k, v, extra) { return '<input class="ac-in" data-d="' + k + '" value="' + esc(v == null ? "" : v) + '" ' + (extra || "") + ">"; }
  function detailsHTML(s) {
    return '<div class="ad-sec" id="ddet"><h4 style="margin:0 0 10px">Purchase details</h4><div class="ad-grid ad-grid2">' +
      fld("Customer name", inp("name", s.name, 'maxlength="60"')) + fld("Email", inp("email", s.email, 'type="email" maxlength="120"')) +
      fld("Mobile", inp("phone", s.phone, 'maxlength="25" inputmode="tel"')) + fld("Source", '<select class="ac-in" data-d="source"><option value="admin"' + (s.source !== "online" ? " selected" : "") + '>Added by you (admin)</option><option value="online"' + (s.source === "online" ? " selected" : "") + ">Website order (online)</option></select>") +
      fld("Service", inp("service", s.service, 'maxlength="80"')) + fld("Plan", inp("plan", s.plan, 'maxlength="80"')) +
      fld("Months", inp("months", s.months, 'type="number" min="1" max="60"')) + fld("Start date", inp("start_date", s.start_date, 'type="date"')) +
      fld("Expiry date", inp("end_date", s.end_date, 'type="date"')) + fld("Amount paid (৳)", inp("price", s.price == null ? "" : s.price, 'inputmode="decimal"')) +
      fld("Paid with", '<select class="ac-in" data-d="pay_method">' + opts(PAYM, s.pay_method) + "</select>") + fld("Transaction ID", inp("txn_id", s.txn_id, 'maxlength="60"')) +
      fld("Sold through", '<select class="ac-in" data-d="channel">' + opts(CHAN, s.channel) + "</select>") + fld("Notes", inp("notes", s.notes, 'maxlength="200"')) +
      "</div>" + (s.order_ref ? '<small style="display:block;margin-top:8px;color:var(--mut)">Order reference: ' + esc(s.order_ref) + "</small>" : "") + "</div>";
  }
  function readDetails() {
    var o = {}; [].forEach.call($("#dbody").querySelectorAll("[data-d]"), function (e) { o[e.dataset.d] = e.value.trim(); }); return o;
  }
  function detailsError(o) {
    if (!o.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) return "Enter a valid email address.";
    if (!o.service || !o.plan) return "Service and plan cannot be empty.";
    var m = parseInt(o.months, 10); if (!(m >= 1 && m <= 60)) return "Months must be between 1 and 60.";
    if (!o.start_date || !o.end_date) return "Start and expiry dates are required.";
    if (o.end_date < o.start_date) return "The expiry date is before the start date.";
    if (o.price && !(Number(o.price.replace(/[^0-9.]/g, "")) >= 0)) return "Amount paid is not valid.";
    return "";
  }
  /* Edit access dialog */
  var dlg = $("#dlg"), cur = null;
  $("#rows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-edit]"), d = e.target.closest("[data-del]");
    if (b) { cur = SUBS[+b.dataset.edit]; $("#dt").textContent = (cur.manual_id ? "Manual ID " + cur.manual_id + " · " : "") + cur.service + " · " + cur.plan; $("#ds").textContent = cur.email; $("#dbody").innerHTML = detailsHTML(cur) + accessHTML(cur.access, cur.service); syncAccess($("#ddet").nextSibling); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
    if (d && confirm("Delete this subscription?")) api("?id=" + d.dataset.del, { method: "DELETE" }).then(function () { toast("Deleted."); list(); }).catch(function (er) { toast(er.message, 1); });
  });
  var closeDlg = function () { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); };
  $("#dx").addEventListener("click", closeDlg);
  $("#dsave").addEventListener("click", function () {
    if (!cur) return; var acc = $("#ddet").nextSibling, det = readDetails(), er = detailsError(det) || accessError(acc); if (er) { toast(er, 1); return; } var b = this; b.disabled = true;
    api("?id=" + cur.id, { method: "PATCH", body: JSON.stringify(Object.assign(det, readAccess(acc))) })
      .then(function () { toast("Saved."); closeDlg(); list(); }).catch(function (er) { toast(er.message, 1); }).then(function () { b.disabled = false; });
  });
  $("#rows").addEventListener("change", function (e) { var i = e.target.closest("[data-end]"); if (i && i.value) api("?id=" + i.dataset.end, { method: "PATCH", body: JSON.stringify({ end_date: i.value }) }).then(function () { toast("Date saved."); list(); }).catch(function (er) { toast(er.message, 1); }); });

  /* ---------- Customers: edit name / mobile (never the email) ---------- */
  var CUS = [], cdlg = $("#cdlg"), ccur = null;
  function custs() {
    api("?view=customers&q=" + encodeURIComponent($("#cq").value.trim())).then(function (d) {
      CUS = d.rows; $("#tc4").textContent = CUS.length;
      $("#crows").innerHTML = CUS.map(function (c, i) {
        return '<tr><td data-l="Customer"><div><b>' + esc(c.name || "No name yet") + "</b><br>" + esc(c.email) + '</div></td><td data-l="Mobile"><div>' + (c.phone ? esc(c.phone) : '<span class="ad-who">Not added</span>') + '</div></td><td data-l="Subscriptions"><div><span class="ad-pill' + (c.active ? " on" : "") + '">' + c.active + " active</span> <small>" + c.subs + ' total</small></div></td><td><button class="ac-btn ac-ghost ac-sm" type="button" data-cedit="' + i + '">Edit</button></td></tr>';
      }).join("");
      $("#ccnt").textContent = CUS.length ? CUS.length + " shown. Pick Edit to change a name or mobile number." : "No customers found.";
    }).catch(function (e) { $("#ccnt").textContent = e.message; });
  }
  var ct; $("#cq").addEventListener("input", function () { clearTimeout(ct); ct = setTimeout(custs, 300); });
  /* What the customer will be told, built from the fields as they are now */
  function cDiff() {
    var nm = $("#cnm").value.trim().replace(/\s+/g, " "), ph = $("#cph").value.trim(), out = [];
    if (nm !== (ccur.name || "")) out.push(["Name", (ccur.name ? esc(ccur.name) : "not set") + " → <i>" + (nm ? esc(nm) : "removed") + "</i>"]);
    if (ph !== (ccur.phone || "")) out.push(["Mobile number", (ccur.phone ? esc(ccur.phone) : "not set") + " → <i>" + (ph ? esc(ph) : "removed") + "</i>"]);
    if ($("#crp").checked) out.push(["Profile photo", "<i>removed</i>"]);
    return out;
  }
  function cPaint() {
    if (!ccur) return; var d = cDiff(), on = $("#cnt").checked;
    $("#csave").disabled = !d.length;
    $("#cprev").className = "ad-prev" + (on ? "" : " off");
    $("#cprev").innerHTML = d.length ? "<b>" + (on ? "The customer will see" : "Silent change, no message sent") + "</b><ul>" + d.map(function (x) { return "<li>" + x[0] + ": " + x[1] + "</li>"; }).join("") + "</ul>" : "<b>Preview</b>Change a field to see what the customer will be told.";
  }
  $("#crows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cedit]"); if (!b) return; ccur = CUS[+b.dataset.cedit];
    $("#cds").textContent = ccur.email; $("#cem").value = ccur.email; $("#cnm").value = ccur.name || ""; $("#cph").value = ccur.phone || ""; $("#crp").checked = false; $("#cnt").checked = true; cPaint();
    if (cdlg.showModal) cdlg.showModal(); else cdlg.setAttribute("open", "");
  });
  ["#cnm", "#cph"].forEach(function (s) { $(s).addEventListener("input", cPaint); }); ["#crp", "#cnt"].forEach(function (s) { $(s).addEventListener("change", cPaint); });
  var closeC = function () { if (cdlg.close) cdlg.close(); else cdlg.removeAttribute("open"); };
  $("#cdx").addEventListener("click", closeC);
  $("#csave").addEventListener("click", function () {
    if (!ccur) return; var b = this; b.disabled = true;
    api("?customer=" + encodeURIComponent(ccur.email), { method: "PATCH", body: JSON.stringify({ name: $("#cnm").value, phone: $("#cph").value, remove_photo: $("#crp").checked, notify: $("#cnt").checked }) })
      .then(function (d) {
        closeC(); custs(); list();
        toast(d.warn || (d.mailed ? "Saved. The customer was emailed and notified in My account." : d.inapp ? "Saved. The customer was notified in My account." : "Saved."), !!d.warn);
      }).catch(function (er) { toast(er.message, 1); }).then(function () { cPaint(); });
  });
  if (key) list();
})();
