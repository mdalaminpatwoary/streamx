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
  var famOf = function (n) { return /truecaller/i.test(n) ? "Family number (plan is activated from this number)" : /spotify/i.test(n) ? "Family mail (plan is activated from this mail)" : ""; };

  /* ---------- Account access editor (used in the Add form and in the edit dialog) ---------- */
  var MODES = [
    ["email_pass", "Email + password", "✉️"], ["email_otp", "Email + OTP", "✉️"],
    ["phone_pass", "Number + password", "📱"], ["phone_otp", "Number + OTP", "📱"],
    ["number", "Number only", "📱"], ["own", "Customer's own email", "👤"], ["none", "Not set yet", "⏳"]
  ];
  var MODE_NAME = {}; MODES.forEach(function (m) { MODE_NAME[m[0]] = m[1]; });
  var cOpts = function (sel) { return '<option value="">Choose a country</option>' + COUNTRIES.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === sel ? " selected" : "") + ">" + esc(c[1]) + "</option>"; }).join(""); };
  var uid = 0;
  function accessHTML(a, svc) {
    a = a || {}; var g = a.gift || {}, v = a.vpn || {}, n = "m" + (++uid), mode = a.mode || "email_pass", fam = famOf(svc);
    return '<div class="ad-acc" data-svc="' + esc(svc) + '">' +
      '<div class="ad-sec" data-only="login"><div class="ad-lab">How does the customer sign in?</div><div class="ad-modes">' + MODES.map(function (m) { return '<label class="ad-mode"><input type="radio" name="' + n + '" value="' + m[0] + '"' + (m[0] === mode ? " checked" : "") + '><span><i>' + m[2] + "</i>" + m[1] + "</span></label>"; }).join("") + "</div>" +
      '<div class="ad-grid2">' +
        '<div data-m="email_pass email_otp own"><label>Account email <small data-own>(blank = customer\'s email)</small></label><input class="ac-in" data-a="acct_email" value="' + esc(a.email) + '" autocomplete="off"></div>' +
        '<div data-m="phone_pass phone_otp number"><label>Account number</label><input class="ac-in" data-a="acct_phone" value="' + esc(a.phone) + '" inputmode="tel" autocomplete="off"></div>' +
        '<div data-m="email_pass phone_pass"><label>Password</label><input class="ac-in" data-a="acct_pass" value="' + esc(a.password) + '" autocomplete="off"></div>' +
        '<div data-m="email_pass email_otp phone_pass phone_otp"><label>Profile name <small>(optional)</small></label><input class="ac-in" data-a="acct_profile" value="' + esc(a.profile) + '" autocomplete="off"></div>' +
        '<div data-m="email_pass email_otp phone_pass phone_otp"><label>Profile PIN <small>(optional)</small></label><input class="ac-in" data-a="acct_pin" value="' + esc(a.pin) + '" inputmode="numeric" autocomplete="off"></div>' +
        (fam ? '<div class="ad-wide"><label>' + esc(fam) + '</label><input class="ac-in" data-a="acct_family" value="' + esc(a.family) + '" autocomplete="off"></div>' : "") +
      "</div>" +
      '<div class="ad-vpn"><label class="ad-sw"><input type="checkbox" data-a="vpn_required"' + (v.required ? " checked" : "") + '><b></b><span>VPN required</span></label><div class="ad-vc" hidden><span class="ad-flag"></span><select class="ac-in" data-a="vpn_country">' + cOpts(v.country) + "</select></div></div></div>" +
      '<div class="ad-sec" data-only="gift" hidden><div class="ad-lab">Gift card</div><div class="ad-grid2">' +
        '<div class="ad-wide"><label>Redeem code</label><input class="ac-in" data-a="gift_code" value="' + esc(g.code) + '" autocomplete="off"></div>' +
        '<div><label>Region</label><select class="ac-in" data-a="gift_region">' + cOpts(g.region || "US") + '</select></div>' +
        '<div><label>Amount</label><input class="ac-in" data-a="gift_amount" value="' + esc(g.amount) + '" placeholder="$10" autocomplete="off"></div></div>' +
        '<p class="ac-note">Valid for 6 months from the start date.</p></div></div>';
  }
  function syncAccess(root) {
    var svc = root.dataset.svc, gift = isGift(svc), mode = (root.querySelector("input[type=radio]:checked") || {}).value || "none";
    root.querySelector('[data-only="login"]').hidden = gift; root.querySelector('[data-only="gift"]').hidden = !gift;
    root.querySelectorAll("[data-m]").forEach(function (d) { d.hidden = d.dataset.m.split(" ").indexOf(mode) < 0; });
    var vc = root.querySelector(".ad-vc"), on = root.querySelector('[data-a="vpn_required"]').checked; vc.hidden = !on;
    var cc = root.querySelector('[data-a="vpn_country"]').value; vc.querySelector(".ad-flag").innerHTML = cc ? flagImg(cc) : "";
  }
  function readAccess(root) {
    var q = function (k) { var e = root.querySelector('[data-a="' + k + '"]'); return e ? (e.type === "checkbox" ? e.checked : e.value.trim()) : ""; };
    if (isGift(root.dataset.svc)) return { gift_code: q("gift_code"), gift_region: q("gift_region"), gift_amount: q("gift_amount") };
    var m = (root.querySelector("input[type=radio]:checked") || {}).value || "none", em = /email|own/.test(m), ph = /phone|number/.test(m), pw = /_pass/.test(m);
    return { acct_mode: m, acct_email: em ? q("acct_email") : "", acct_phone: ph ? q("acct_phone") : "", acct_pass: pw ? q("acct_pass") : "", acct_profile: m === "none" || m === "own" || m === "number" ? "" : q("acct_profile"), acct_pin: m === "none" || m === "own" || m === "number" ? "" : q("acct_pin"), acct_family: q("acct_family"), vpn_required: q("vpn_required"), vpn_country: q("vpn_required") ? q("vpn_country") : "" };
  }
  document.addEventListener("change", function (e) { var r = e.target.closest(".ad-acc"); if (r) syncAccess(r); });

  /* ---------- Add form ---------- */
  var P = PROD;
  $("#svc").innerHTML = P.map(function (p) { return "<option>" + esc(p.name) + "</option>"; }).join("");
  function plans() {
    var name = $("#svc").value, p = P.filter(function (x) { return x.name === name; })[0], o = [], gift = isGift(name);
    $("#pwrap").hidden = gift; $("#gwrap").hidden = !gift;
    if (!gift) { p.variants.forEach(function (v) { v.plans.forEach(function (pl) { o.push({ t: (p.variants.length > 1 ? v.n + " · " : "") + pl.v, m: pl.m }); }); }); $("#pln").innerHTML = o.map(function (x) { return '<option data-m="' + x.m + '">' + esc(x.t) + "</option>"; }).join(""); }
    var box = $("#accbox"); box.innerHTML = accessHTML({ mode: /truecaller/i.test(name) ? "number" : /spotify/i.test(name) ? "own" : "email_pass" }, name); syncAccess(box.firstChild);
  }
  $("#svc").addEventListener("change", plans); plans();

  /* ---------- Subscriptions ---------- */
  function accSummary(s) {
    var a = s.access || {}, g = a.gift || {}, v = a.vpn || {}, h = "";
    if (isGift(s.service)) return '<span class="ad-pill ' + (g.code ? "ok" : "warn") + '">' + (g.code ? "Code added" : "Code needed") + "</span>" + (g.amount ? '<span class="ad-pill">' + esc(g.amount) + (g.region ? " · " + esc(g.region) : "") + "</span>" : "");
    var m = a.mode || "none"; h = '<span class="ad-pill ' + (m === "none" ? "warn" : "ok") + '">' + esc(MODE_NAME[m] || m) + "</span>";
    var who = /phone|number/.test(m) ? a.phone : a.email; if (who) h += '<small class="ad-who">' + esc(who) + "</small>";
    if (v.required) h += '<span class="ad-pill">VPN ' + (v.country ? flagImg(v.country) + " " + esc(v.country) : "") + "</span>";
    if (a.family) h += '<small class="ad-who">Family: ' + esc(a.family) + "</small>";
    return h;
  }
  function list() {
    api("?q=" + encodeURIComponent($("#q").value.trim())).then(function (d) {
      $("#gate").hidden = true; $("#panel").hidden = false; $("#lock").hidden = false; orders();
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
    e.preventDefault(); var f = e.target, m = $("#am"), name = f.service.value, gift = isGift(name), o = f.plan.selectedOptions[0];
    var body = Object.assign({ email: f.email.value, name: f.name.value, phone: f.phone.value, service: name, plan: gift ? (f.amount.value.trim() || "Gift card") : o.value, months: gift ? 6 : +o.dataset.m, start: f.start.value || null, notes: f.notes.value }, readAccess($("#accbox").firstChild));
    if (gift && !body.gift_amount) body.gift_amount = f.amount.value.trim();
    api("", { method: "POST", body: JSON.stringify(body) })
      .then(function (d) { m.className = "ac-msg ok"; m.textContent = d.warn ? "Added, but account details were not saved: " + d.warn : "Added. Expires " + d.row.end_date + "."; toast(d.warn ? "Added, but account details were not saved." : "Subscription added."); f.email.value = f.name.value = f.phone.value = f.start.value = f.notes.value = f.amount.value = ""; plans(); list(); })
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
    if (!cur) return; var b = this; b.disabled = true;
    api("?id=" + cur.id, { method: "PATCH", body: JSON.stringify(readAccess($("#dbody").firstChild)) })
      .then(function () { toast("Saved."); closeDlg(); list(); }).catch(function (er) { toast(er.message, 1); }).then(function () { b.disabled = false; });
  });
  $("#rows").addEventListener("change", function (e) { var i = e.target.closest("[data-end]"); if (i && i.value) api("?id=" + i.dataset.end, { method: "PATCH", body: JSON.stringify({ end_date: i.value }) }).then(function () { toast("Date saved."); list(); }).catch(function (er) { toast(er.message, 1); }); });
  if (key) list();
})();
