/* GET /api/catalog?l=top|soon&k=movie|tv : the 250 highest-rated titles (TMDB user rating, IMDb-style chart) or upcoming releases.
   GET /api/catalog?a=pv&k=movie|tv&ids=1,2,3 : streaming platforms for up to 12 titles (the chart loads them as rows come into view).
   Where a platform is one StreamX sells, the reply carries its service page so the site can offer "Get <service>". */
const API = "https://api.themoviedb.org/3";
const HOUR = 3600 * 1000;

const { mapProviders } = require("./_providers");
const cache = new Map(); // key -> { at, body }
const pvCache = new Map(); // "k:id" -> { at, v }
let genres = null;

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
