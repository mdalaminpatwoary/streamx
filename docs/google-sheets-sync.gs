/**
 * StreamX -> "StreamX Live Data" sheet: writes a customer's phone number into the "Customers" tab.
 * Setup: open the sheet > Extensions > Apps Script > paste this > set SECRET below (same value as SHEETS_WEBHOOK_SECRET in Vercel)
 * > Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone > copy the URL into SHEETS_WEBHOOK_URL in Vercel.
 * Columns: A Email, B Name, C Phones, D First seen, E Last seen, F Events.
 */
var SECRET = "CHANGE-ME";

function doPost(e) {
  var out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents);
    if (!SECRET || d.secret !== SECRET) return out({ ok: false, error: "unauthorized" });
    var email = String(d.email || "").trim().toLowerCase(), phone = String(d.phone || "").trim();
    if (!email || !phone) return out({ ok: false, error: "missing" });
    lock.waitLock(10000);
    var sh = SpreadsheetApp.getActive().getSheetByName("Customers");
    var last = sh.getLastRow(), rows = last > 1 ? sh.getRange(2, 1, last - 1, 3).getValues() : [], r = -1;
    for (var i = 0; i < rows.length; i++) if (String(rows[i][0]).trim().toLowerCase() === email) { r = i + 2; break; }
    if (r < 0) { sh.appendRow([email, d.name || "", "'" + phone, new Date(), new Date(), 0]); return out({ ok: true, added: true }); }
    var cur = String(sh.getRange(r, 3).getValue() || "").split(/[,;\n]+/).map(function (x) { return x.trim(); }).filter(String);
    if (cur.indexOf(phone) < 0) cur.push(phone);
    sh.getRange(r, 3).setNumberFormat("@").setValue(cur.join(", "));
    if (d.name && !String(sh.getRange(r, 2).getValue() || "").trim()) sh.getRange(r, 2).setValue(d.name);
    return out({ ok: true, updated: true });
  } catch (err) { return out({ ok: false, error: String(err) }); }
  finally { try { lock.releaseLock(); } catch (x) {} }
}
