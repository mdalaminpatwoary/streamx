/* Streaming-provider helper shared by /api/catalog and /api/title.
   Maps TMDB provider names to the StreamX services we sell (s = service page slug, null = shown as a name only). */
const SERVICES = [
  [/^netflix$/i, "Netflix", "netflix"],
  [/^amazon prime video$/i, "Prime Video", "amazon-prime-video"],
  [/^disney (plus|\+)$/i, "Disney+", "disneyplus"],
  [/^(hbo max|max)$/i, "HBO Max", "hbo-max"],
  [/^hulu$/i, "Hulu", "hulu"],
  [/^crunchyroll$/i, "Crunchyroll", "crunchyroll"],
  [/^paramount (plus|\+)$/i, "Paramount+", "paramountplus"],
  [/hotstar/i, "JioHotstar", "jiohotstar"],
  [/^zee5$/i, "ZEE5", "zee5"],
  [/^apple tv(\+| plus)?$/i, "Apple TV+", null],
  [/^peacock( premium)?$/i, "Peacock", null],
  [/^mubi$/i, "MUBI", null],
];

// TMDB "watch/providers" results -> { reg, list }. Bangladesh first, then the United States; services StreamX sells come first.
function mapProviders(results, max = 4) {
  const r = results || {};
  for (const reg of ["BD", "US"]) {
    const list = (r[reg] && r[reg].flatrate) || [];
    if (!list.length) continue;
    const out = [], seen = new Set();
    for (const p of list) {
      const hit = SERVICES.find((s) => s[0].test(p.provider_name || ""));
      const name = hit ? hit[1] : p.provider_name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ n: name, s: hit ? hit[2] : null });
    }
    out.sort((a, b) => (b.s ? 1 : 0) - (a.s ? 1 : 0));
    return { reg, list: out.slice(0, max) };
  }
  return { reg: "", list: [] };
}
module.exports = { SERVICES, mapProviders };
