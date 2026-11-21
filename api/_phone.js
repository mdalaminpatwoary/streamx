/* Mobile number cleaner shared by My account and the admin page. Bangladesh numbers are kept as 01XXXXXXXXX; others as +<country code><digits>. Returns "" when unusable. */
function cleanPhone(v) {
  const raw = String(v || "").trim(); let d = raw.replace(/\D/g, "");
  if (/^(?:880|0)?1[3-9]\d{8}$/.test(d)) return "0" + d.replace(/^(?:880|0)/, "");
  if (raw.startsWith("+") && d.length >= 8 && d.length <= 15) return "+" + d;
  return "";
}
module.exports = { cleanPhone };
