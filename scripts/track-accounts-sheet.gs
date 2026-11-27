/* StreamX: keeps the "Netflix" tab of the "Track Accounts" Google Sheet in step with the admin panel.
   Paste this into Extensions > Apps Script of that spreadsheet, set SECRET, then Deploy > New deployment > Web app
   (Execute as: Me, Who has access: Anyone). Put the web app URL in Vercel as TRACK_SHEET_WEBHOOK_URL and the same secret as TRACK_SHEET_WEBHOOK_SECRET.

   Layout of the tab: 20 blocks of 10 rows, one block per Netflix account. Slot 1 = Signature, slots 2-4 = Private, slots 5-10 = Shared.
   Column A of slot 1 holds the account email, B/C/L/M are formulas, N holds the panel's subscription id (that is how a row is found again).
   The panel sends: upsert {rows:[...]} when a user is added or changed, delete {ids:[...]} when a user is deleted.
   A delete clears the customer details of that slot and keeps the account email. */

var SECRET = "CHANGE_ME";
var SHEET_NAME = "Netflix";
var FIRST_ROW = 2, BLOCKS = 20, BLOCK_SIZE = 10, COLS = 14;

function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);
    if (!SECRET || SECRET === "CHANGE_ME" || p.secret !== SECRET) return out_({ ok: false, error: "wrong secret" });
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
      if (!sh) return out_({ ok: false, error: "tab '" + SHEET_NAME + "' not found" });
      var res = p.event === "delete" ? remove_(sh, p.ids || []) : p.event === "sort" ? { ok: true, sorted: sortBlocks_(sh) } : upsert_(sh, p.rows || []);
      SpreadsheetApp.flush();
      return out_(res);
    } finally { lock.releaseLock(); }
  } catch (err) { return out_({ ok: false, error: String(err) }); }
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function norm_(s) { return String(s || "").trim().toLowerCase(); }
function plain_(s) { return String(s == null ? "" : s).replace(/^'/, ""); }
function date_(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : ""; }
function read_(sh) { return sh.getRange(FIRST_ROW, 1, BLOCKS * BLOCK_SIZE, COLS).getValues(); }
function findId_(data, id) { for (var i = 0; i < data.length; i++) if (String(data[i][13]) === String(id)) return i; return -1; }

/* Changes are made in memory ("data") and written back once at the end, which keeps a batch of 100 rows to a few seconds. */
function clearRow_(data, i) {
  for (var c = 3; c <= 10; c++) data[i][c] = "";   // profile name .. device (D:K). The account email in column A stays.
  data[i][13] = "";                                // subscription id
}

function fill_(data, i, r) {
  var device = r.devices === undefined ? data[i][10] : plain_(r.devices);   // the panel's devices; kept as typed if the panel sends none
  var vals = [plain_(r.acct_profile), plain_(r.phone), plain_(r.channel) || "Website", r.plan, date_(r.start_date), date_(r.end_date), plain_(r.email), device];
  for (var c = 0; c < 8; c++) data[i][3 + c] = vals[c];
  data[i][13] = String(r.id);
}

function save_(sh, data) {
  var d = [], n = [];
  for (var i = 0; i < data.length; i++) { d.push(data[i].slice(3, 11)); n.push([data[i][13]]); }
  sh.getRange(FIRST_ROW, 4, data.length, 8).setValues(d);
  sh.getRange(FIRST_ROW, 14, data.length, 1).setValues(n);
}

function upsert_(sh, rows) {
  var data = read_(sh), done = 0, skipped = 0, errors = [], created = false;
  rows.forEach(function (r) {
    var acct = String(r.acct_email || "").trim();
    var at = findId_(data, r.id);
    if (at >= 0) {
      var bs = at - (at % BLOCK_SIZE);
      if ((!acct || norm_(data[bs][0]) === norm_(acct)) && data[at][2] === r.type) { fill_(data, at, r); done++; return; }
      if (!acct) { fill_(data, at, r); done++; return; }
      clearRow_(data, at);   // the account or the plan type changed: free the old slot and place it again
    }
    if (!acct) { skipped++; return; }   // no Netflix account assigned yet; it is placed when the account email is saved
    var block = -1, b;
    for (b = 0; b < BLOCKS; b++) if (norm_(data[b * BLOCK_SIZE][0]) === norm_(acct)) { block = b; break; }
    if (block < 0) {
      for (b = 0; b < BLOCKS; b++) if (!String(data[b * BLOCK_SIZE][0]).trim()) { block = b; break; }
      if (block < 0) { errors.push("no free account block for " + acct); return; }
      sh.getRange(FIRST_ROW + block * BLOCK_SIZE, 1).setValue(acct);
      data[block * BLOCK_SIZE][0] = acct;
      created = true;
    }
    var slot = -1;
    for (var k = 0; k < BLOCK_SIZE; k++) {
      var j = block * BLOCK_SIZE + k;
      if (data[j][2] === r.type && !String(data[j][13])) { slot = j; break; }
    }
    if (slot < 0) { errors.push(acct + " has no free " + r.type + " slot (id " + r.id + ")"); return; }
    fill_(data, slot, r); done++;
  });
  save_(sh, data);
  if (created) sortBlocks_(sh);   // a new account goes into its A-Z place
  return errors.length ? { ok: false, error: errors.join("; "), done: done } : { ok: true, done: done, skipped: skipped };
}

function remove_(sh, ids) {
  var data = read_(sh), n = 0;
  ids.forEach(function (id) {
    var i;
    while ((i = findId_(data, id)) >= 0) { clearRow_(data, i); n++; }
  });
  if (n) save_(sh, data);
  return { ok: true, cleared: n };
}

/* Puts the account blocks in A-Z order of the account email (case does not matter). Blocks without an email stay at the bottom.
   A block moves as a whole: its slot-1 email, profile names, customers, dates, devices and subscription ids. */
function sortBlocks_(sh) {
  var data = read_(sh), items = [], b, k;
  for (b = 0; b < BLOCKS; b++) items.push({ b: b, key: norm_(data[b * BLOCK_SIZE][0]) });
  items.sort(function (x, y) {
    if (!x.key && !y.key) return x.b - y.b;
    if (!x.key) return 1;
    if (!y.key) return -1;
    return nat_(x.key, y.key) || x.b - y.b;
  });
  var moved = false;
  items.forEach(function (it, i) { if (it.b !== i) moved = true; });
  if (!moved) return false;
  var out = [];
  items.forEach(function (it) { for (k = 0; k < BLOCK_SIZE; k++) out.push(data[it.b * BLOCK_SIZE + k]); });
  save_(sh, out);
  items.forEach(function (it, i) {
    if (it.b !== i) sh.getRange(FIRST_ROW + i * BLOCK_SIZE, 1).setValue(data[it.b * BLOCK_SIZE][0]);
  });
  return true;
}

/* A-Z compare where numbers inside the text count by value, so ...bd.6 comes before ...bd.12. */
function nat_(a, b) {
  var x = a.match(/\d+|\D+/g) || [], y = b.match(/\d+|\D+/g) || [], n = Math.min(x.length, y.length);
  for (var i = 0; i < n; i++) {
    if (x[i] === y[i]) continue;
    var dx = /^\d/.test(x[i]), dy = /^\d/.test(y[i]);
    if (dx && dy) { var d = +x[i] - +y[i]; if (d) return d < 0 ? -1 : 1; continue; }
    return x[i] < y[i] ? -1 : 1;
  }
  return x.length - y.length;
}
