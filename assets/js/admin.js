/* Owner page: add, search, extend and remove subscriptions. */
(function () {
  "use strict";
  var PROD = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var key = ""; try { key = sessionStorage.getItem("sx_admin") || ""; } catch (e) {}
  var api = function (qs, opt) { opt = opt || {}; opt.headers = Object.assign({ "x-admin-key": key, "Content-Type": "application/json" }, opt.headers || {}); return fetch("/api/admin" + (qs || ""), opt).then(function (r) { return r.json().catch(function () { return { error: "Server answered " + r.status + ". The API may not be deployed yet." }; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || "Error"); e.status = r.status; throw e; } return j; }); }); };
  var today = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
  var days = function (a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); };

  var P = PROD.filter(function (p) { return !p.gift; });
  $("#svc").innerHTML = P.map(function (p) { return "<option>" + esc(p.name) + "</option>"; }).join("");
  function plans() {
    var p = P.filter(function (x) { return x.name === $("#svc").value; })[0], o = [];
    p.variants.forEach(function (v) { v.plans.forEach(function (pl) { o.push({ t: (p.variants.length > 1 ? v.n + " · " : "") + pl.v, m: pl.m }); }); });
    $("#pln").innerHTML = o.map(function (x) { return '<option data-m="' + x.m + '">' + esc(x.t) + "</option>"; }).join("");
  }
  $("#svc").addEventListener("change", plans); plans();

  function list() {
    api("?q=" + encodeURIComponent($("#q").value.trim())).then(function (d) {
      $("#gate").hidden = true; $("#panel").hidden = false; $("#lock").hidden = false; orders();
      $("#rows").innerHTML = d.rows.map(function (s) {
        var left = days(today, s.end_date), c = left < 0 ? "#ef4444" : left <= 7 ? "#f59e0b" : "#22c55e";
        return '<tr><td data-l="Customer"><div><b>' + esc(s.name || "") + "</b><br>" + esc(s.email) + "<br>" + esc(s.phone || "") + '</div></td><td data-l="Service"><div>' + esc(s.service) + "<br><small>" + esc(s.source) + '</small></div></td><td data-l="Plan">' + esc(s.plan) + '</td><td data-l="Start">' + esc(s.start_date) + '</td><td data-l="Expires"><input class="ac-in" type="date" value="' + esc(s.end_date) + '" data-end="' + s.id + '" style="padding:6px 8px;width:150px"></td><td data-l="Left"><span class="ad-chip" style="color:' + c + '">' + (left < 0 ? "Expired" : left + " days") + '</span></td><td data-l=""><button class="ad-x" data-del="' + s.id + '">Delete</button></td></tr>';
      }).join("");
      SUBS = d.rows; stats(); $("#cnt").textContent = d.rows.length + " shown (latest 300). Change a date and click away to save.";
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
  $("#orows").addEventListener("click", function (e) { var b = e.target.closest("[data-dv]"); if (b) api("?order=" + encodeURIComponent(b.dataset.dv), { method: "PATCH", body: JSON.stringify({ delivery: b.dataset.to }) }).then(function (r) { toast(b.dataset.to === "delivered" ? (r && r.mailed ? "Marked delivered. Customer emailed." : "Marked delivered. No email sent.") : "Moved back to not delivered."); orders(); }).catch(function (er) { toast(er.message, 1); }); });
  $("#gf").addEventListener("submit", function (e) { e.preventDefault(); key = $("#ak").value; try { sessionStorage.setItem("sx_admin", key); } catch (x) {} $("#gm").textContent = ""; list(); });
  $("#lock").addEventListener("click", function () { key = ""; try { sessionStorage.removeItem("sx_admin"); } catch (x) {} $("#panel").hidden = true; $("#gate").hidden = false; $("#lock").hidden = true; $("#ak").value = ""; });
  var t; $("#q").addEventListener("input", function () { clearTimeout(t); t = setTimeout(list, 300); });
  $("#af").addEventListener("submit", function (e) {
    e.preventDefault(); var f = e.target, m = $("#am"), o = f.plan.selectedOptions[0];
    api("", { method: "POST", body: JSON.stringify({ email: f.email.value, name: f.name.value, phone: f.phone.value, service: f.service.value, plan: o.value, months: +o.dataset.m, start: f.start.value || null, notes: f.notes.value }) })
      .then(function (d) { m.className = "ac-msg ok"; m.textContent = "Added. Expires " + d.row.end_date + "."; f.email.value = f.name.value = f.phone.value = f.start.value = f.notes.value = ""; list(); })
      .catch(function (er) { m.className = "ac-msg"; m.textContent = er.message; });
  });
  $("#rows").addEventListener("click", function (e) { var b = e.target.closest("[data-del]"); if (b && confirm("Delete this subscription?")) api("?id=" + b.dataset.del, { method: "DELETE" }).then(function () { toast("Deleted."); list(); }).catch(function (er) { toast(er.message, 1); }); });
  $("#rows").addEventListener("change", function (e) { var i = e.target.closest("[data-end]"); if (i && i.value) api("?id=" + i.dataset.end, { method: "PATCH", body: JSON.stringify({ end_date: i.value }) }).then(function () { toast("Date saved."); list(); }).catch(function (er) { toast(er.message, 1); }); });
  if (key) list();
})();
