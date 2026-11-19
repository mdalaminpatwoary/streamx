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
      $("#gate").hidden = true; $("#panel").hidden = false;
      $("#rows").innerHTML = d.rows.map(function (s) {
        var left = days(today, s.end_date), c = left < 0 ? "#ef4444" : left <= 7 ? "#f59e0b" : "#22c55e";
        return "<tr><td><b>" + esc(s.name || "") + "</b><br>" + esc(s.email) + "<br>" + esc(s.phone || "") + "</td><td>" + esc(s.service) + "<br><small style='color:#98a1bc'>" + esc(s.source) + "</small></td><td>" + esc(s.plan) + "</td><td>" + esc(s.start_date) + '</td><td><input class="ac-in" type="date" value="' + esc(s.end_date) + '" data-end="' + s.id + '" style="padding:6px 8px;width:150px"></td><td class="st" style="color:' + c + '">' + (left < 0 ? "Expired" : left + " d") + '</td><td><button class="ad-x" data-del="' + s.id + '">Delete</button></td></tr>';
      }).join("");
      $("#cnt").textContent = d.rows.length + " shown (latest 300). Change a date and click away to save.";
    }).catch(function (e) { if (e.status === 401) { key = ""; try { sessionStorage.removeItem("sx_admin"); } catch (x) {} $("#panel").hidden = true; $("#gate").hidden = false; $("#gm").textContent = e.message; } else { $("#cnt").textContent = e.message; $("#gm").textContent = e.message; } });
  }
  $("#gf").addEventListener("submit", function (e) { e.preventDefault(); key = $("#ak").value; try { sessionStorage.setItem("sx_admin", key); } catch (x) {} $("#gm").textContent = ""; list(); });
  $("#lock").addEventListener("click", function () { key = ""; try { sessionStorage.removeItem("sx_admin"); } catch (x) {} $("#panel").hidden = true; $("#gate").hidden = false; $("#ak").value = ""; });
  var t; $("#q").addEventListener("input", function () { clearTimeout(t); t = setTimeout(list, 300); });
  $("#af").addEventListener("submit", function (e) {
    e.preventDefault(); var f = e.target, m = $("#am"), o = f.plan.selectedOptions[0];
    api("", { method: "POST", body: JSON.stringify({ email: f.email.value, name: f.name.value, phone: f.phone.value, service: f.service.value, plan: o.value, months: +o.dataset.m, start: f.start.value || null, notes: f.notes.value }) })
      .then(function (d) { m.className = "ac-msg ok"; m.textContent = "Added. Expires " + d.row.end_date + "."; f.email.value = f.name.value = f.phone.value = f.start.value = f.notes.value = ""; list(); })
      .catch(function (er) { m.className = "ac-msg"; m.textContent = er.message; });
  });
  $("#rows").addEventListener("click", function (e) { var b = e.target.closest("[data-del]"); if (b && confirm("Delete this subscription?")) api("?id=" + b.dataset.del, { method: "DELETE" }).then(list).catch(function (er) { alert(er.message); }); });
  $("#rows").addEventListener("change", function (e) { var i = e.target.closest("[data-end]"); if (i && i.value) api("?id=" + i.dataset.end, { method: "PATCH", body: JSON.stringify({ end_date: i.value }) }).then(list).catch(function (er) { alert(er.message); }); });
  if (key) list();
})();
