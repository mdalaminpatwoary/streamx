/* GET /api/catalog?l=top|soon&k=movie|tv : the 250 highest-rated titles (TMDB user rating, IMDb-style chart) or upcoming releases.
   GET /api/catalog?a=pv&k=movie|tv&ids=1,2,3 : streaming platforms for up to 12 titles (the chart loads them as rows come into view).
   GET /api/catalog?a=find&q=text : up to 4 matching titles, each with the platforms it streams on (used by the chat assistant).
   GET /api/catalog?a=on&p=netflix&k=movie|tv : popular titles currently on one platform (US catalogue), for "what is on Netflix".
   GET /api/catalog?a=web&q=text : a short answer searched online (Wikipedia), used by the chat assistant when none of its own answers fit.
   Where a platform is one StreamX sells, the reply carries its service page so the site can offer "Get <service>". */
const API = "https://api.themoviedb.org/3";
const HOUR = 3600 * 1000;

const { mapProviders } = require("./_providers");
const PROV_ID = { netflix: 8, "prime-video": 9, "amazon-prime-video": 9, disneyplus: 337, hulu: 15, "hbo-max": 1899, crunchyroll: 283, paramountplus: 531, "apple-tv": 350, peacock: 386, jiohotstar: 122 };
const cache = new Map(); // key -> { at, body }
const pvCache = new Map(); // "k:id" -> { at, v }
let genres = null;


// Online answer for the chat assistant: top Wikipedia match plus a short summary. No key needed; cached for 6 hours.
const webCache = new Map();
async function webAnswer(q) {
  const hit = webCache.get(q);
  if (hit && Date.now() - hit.at < 6 * HOUR) return hit.v;
  const H = { accept: "application/json", "user-agent": "StreamXBot/1.0 (https://streamx.com.bd)" };
  const s = await fetch("https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&srsearch=" + encodeURIComponent(q), { headers: H, signal: AbortSignal.timeout(5000) });
  if (!s.ok) throw new Error("search HTTP " + s.status);
  const first = (((await s.json()).query || {}).search || [])[0];
  let v = null;
  if (first) {
    const r = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(first.title.replace(/ /g, "_")), { headers: H, signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const j = await r.json();
      const text = String(j.extract || "").replace(/\s+/g, " ").trim();
      if (text && j.type !== "disambiguation") {
        const cut = text.length > 420 ? text.slice(0, 420).replace(/[^.!?]*$/, "") || text.slice(0, 420) + "…" : text;
        v = { title: j.title || first.title, text: cut, url: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || "https://en.wikipedia.org/wiki/" + encodeURIComponent(first.title.replace(/ /g, "_")), thumb: (j.thumbnail && j.thumbnail.source) || "" };
      }
    }
  }
  if (webCache.size > 300) webCache.clear();
  webCache.set(q, { at: Date.now(), v });
  return v;
}

async function tmdb(path, params = {}) {
  const key = (process.env.TMDB_API_KEY || "").trim();
  if (!key) throw Object.assign(new Error("TMDB is not configured"), { config: true });
  const url = new URL(API + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = { accept: "application/json" };
  if (key.startsWith("eyJ")) headers.authorization = "Bearer " + key;
  else url.searchParams.set("api_key", key);
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("TMDB HTTP " + res.status);
  return res.json();
}

async function genreMap() {
  if (genres) return genres;
  const [m, t] = await Promise.all([tmdb("/genre/movie/list"), tmdb("/genre/tv/list")]);
  genres = {};
  [...(m.genres || []), ...(t.genres || [])].forEach((g) => { genres[g.id] = g.name; });
  return genres;
}

const today = () => new Date(Date.now() + 6 * HOUR).toISOString().slice(0, 10); // Dhaka date

// Streaming platforms for a title: Bangladesh first, then the United States (TMDB has more data there).
async function platforms(kind, id) {
  try { return mapProviders((await tmdb(`/${kind}/${id}/watch/providers`)).results); }
  catch (e) { return { reg: "", list: [] }; }
}

async function platformsCached(kind, id) {
  const key = kind + ":" + id, hit = pvCache.get(key);
  if (hit && Date.now() - hit.at < 12 * HOUR) return hit.v;
  const v = await platforms(kind, id);
  if (v.list.length) pvCache.set(key, { at: Date.now(), v });
  return v;
}

const item = (r, k, g) => ({
  id: r.id, k,
  t: (k === "movie" ? r.title : r.name) || "",
  y: ((k === "movie" ? r.release_date : r.first_air_date) || "").slice(0, 4),
  d: (k === "movie" ? r.release_date : r.first_air_date) || "",
  p: r.poster_path || "",
  v: r.vote_average ? Math.round(r.vote_average * 10) / 10 : 0,
  vc: r.vote_count || 0,
  g: (r.genre_ids || []).map((x) => g[x]).filter(Boolean).slice(0, 3),
  o: (r.overview || "").slice(0, 170),
});

async function build(l, k) {
  const g = await genreMap();
  if (l === "top") {
    // TMDB lists 20 per page, so the top 250 is 13 pages.
    const pages = await Promise.all(Array.from({ length: 13 }, (_, i) => tmdb(`/${k}/top_rated`, { language: "en-US", page: i + 1 }).catch(() => ({ results: [] }))));
    const seen = new Set(), rows = [];
    for (const pg of pages) for (const r of pg.results || []) { if (r.poster_path && !seen.has(r.id)) { seen.add(r.id); rows.push(r); } }
    return rows.slice(0, 250).map((r) => item(r, k, g));
  }
  let data;
  if (k === "movie") data = await tmdb("/discover/movie", { language: "en-US", sort_by: "popularity.desc", "primary_release_date.gte": today(), with_release_type: "2|3", region: "US", page: 1 });
  else data = await tmdb("/discover/tv", { language: "en-US", sort_by: "popularity.desc", "first_air_date.gte": today(), page: 1 });
  const rows = (data.results || []).filter((r) => r.poster_path).slice(0, 20);
  const pl = await Promise.all(rows.map((r) => platformsCached(k, r.id)));
  return rows.map((r, i) => ({ ...item(r, k, g), pl: pl[i].list, reg: pl[i].reg }));
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const k = req.query.k === "tv" ? "tv" : "movie";
    if (req.query.a === "pv") {
      const ids = String(req.query.ids || "").split(",").map((x) => x.trim()).filter((x) => /^\d{1,9}$/.test(x)).slice(0, 12);
      const out = {};
      await Promise.all(ids.map(async (id) => { out[id] = await platformsCached(k, id); }));
      res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
      return res.status(200).json({ k, pv: out });
    }
    if (req.query.a === "find") {
      const q = String(req.query.q || "").replace(/\s+/g, " ").trim().slice(0, 80);
      if (q.length < 2) return res.status(400).json({ error: "Type a title to search." });
      // Typed titles are messy ("swapped movie", "the vampire of diaries"): search the text as typed and with filler words removed,
      // then rank by how well the title words match what was typed (popularity only breaks ties), so a famous near-match beats an unrelated hit.
      const STOP = new Set(["the", "of", "a", "an", "and", "in", "on", "to", "movie", "film", "series", "show", "tv", "anime", "cartoon", "animation", "full", "watch"]);
      const toks = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9\u00c0-\u024f ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).map((w) => (w.length > 3 ? w.replace(/s$/, "") : w));
      const near = (x, y) => x === y || (x.length >= 5 && y.length >= 5 && lev(x, y) <= 1);
      const lev = (x, y) => { const d = Array.from({ length: x.length + 1 }, (_, i) => [i]); for (let j = 1; j <= y.length; j++) d[0][j] = j; for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)); return d[x.length][y.length]; };
      const qt = toks(q), stripped = String(q).toLowerCase().replace(/[^a-z0-9\u00c0-\u024f ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).join(" ");
      const variants = [q.replace(/\b(the\s+)?(movie|film|series|tv\s+show|tv\s+series|show|anime|cartoon|animation)\b/gi, " ").replace(/\s+/g, " ").trim()];
      if (stripped && stripped !== variants[0].toLowerCase()) variants.push(stripped);
      if (!variants[0]) variants[0] = q;
      const seen = new Map();
      (await Promise.all(variants.filter((v) => v.length >= 2).map((v) => tmdb("/search/multi", { query: v, include_adult: "false", language: "en-US" }).catch(() => ({ results: [] }))))).forEach((r) => (r.results || []).forEach((x) => { if ((x.media_type === "movie" || x.media_type === "tv") && x.poster_path && !seen.has(x.media_type + x.id)) seen.set(x.media_type + x.id, x); }));
      const score = (x) => {
        const tt = toks(x.title || x.name).concat(toks(x.original_title || x.original_name)), tu = [...new Set(tt)];
        const hit = qt.filter((w) => tu.some((v) => near(w, v))).length, sim = qt.length && tu.length ? hit / Math.max(qt.length, Math.min(tu.length, qt.length + 2)) : 0;
        return sim * 10 + Math.log10(1 + (x.popularity || 0)) * 0.6 + Math.log10(1 + (x.vote_count || 0)) * 0.4;
      };
      const ranked = [...seen.values()].map((x) => [score(x), x]).sort((a, b) => b[0] - a[0]);
      const g = await genreMap();
      const rows = ranked.slice(0, 4).map((e) => e[1]);
      const list = await Promise.all(rows.map(async (x) => { const it = item(x, x.media_type, g); const pv = await platformsCached(it.k, it.id); return { ...it, pl: pv.list, reg: pv.reg }; }));
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).json({ q, list, close: !!ranked[0] && toks(ranked[0][1].title || ranked[0][1].name).join(" ") === qt.join(" ") });
    }
    if (req.query.a === "web") {
      const q = String(req.query.q || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
      if (q.length < 3 || /@|\d{7,}/.test(q)) return res.status(400).json({ error: "Please ask a longer question." });
      const hit = await webAnswer(q.toLowerCase());
      res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
      return res.status(200).json({ q, hit });
    }
    if (req.query.a === "on") {
      const id = PROV_ID[String(req.query.p || "").toLowerCase()];
      if (!id) return res.status(400).json({ error: "Unknown platform" });
      const g = await genreMap();
      const r = await tmdb(`/discover/${k}`, { with_watch_providers: id, watch_region: "US", with_watch_monetization_types: "flatrate", sort_by: "popularity.desc", "vote_count.gte": 200, language: "en-US" });
      res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
      return res.status(200).json({ p: req.query.p, k, list: (r.results || []).filter((x) => x.poster_path).slice(0, 6).map((x) => item(x, k, g)) });
    }
    const l = req.query.l === "soon" ? "soon" : "top", key = l + k;
    const hit = cache.get(key);
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    if (hit && Date.now() - hit.at < 3 * HOUR) return res.status(200).json(hit.body);
    const body = { l, k, list: await build(l, k), at: new Date().toISOString() };
    cache.set(key, { at: Date.now(), body });
    return res.status(200).json(body);
  } catch (e) {
    console.error("catalog error", e && e.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(424).json({ error: e && e.config ? "Catalog is not configured" : "Catalog is unavailable right now" });
  }
};
