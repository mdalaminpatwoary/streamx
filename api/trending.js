/* GET /api/trending?p=<platform>&r=<region> : top 10 movies and series on a streaming platform in a region (TMDB). */
const API = "https://api.themoviedb.org/3";

// Platform -> name pattern (matched against TMDB's provider list for the region) and a known id as a fallback.
const PLATFORMS = {
  netflix: { re: /^netflix$/i, id: 8 },
  prime: { re: /^amazon prime video$/i, id: 9 },
  disney: { re: /^disney (plus|\+)$/i, id: 337 },
  hbomax: { re: /^(hbo max|max)$/i, id: 1899 },
  crunchyroll: { re: /^crunchyroll$/i, id: 283 },
  hotstar: { re: /hotstar/i, id: 122 },
  paramount: { re: /^paramount (plus|\+)$/i, id: 531 },
  hulu: { re: /^hulu$/i, id: 15 },
  appletv: { re: /^apple tv(\+| plus)?$/i, id: 350 },
  peacock: { re: /^peacock( premium)?$/i, id: 386 },
  zee5: { re: /^zee5$/i, id: 232 },
  sonyliv: { re: /^sony ?liv$/i, id: 237 },
  viki: { re: /viki/i, id: 344 },
  mubi: { re: /^mubi$/i, id: 11 },
};
const REGIONS = new Set(["CA", "CN", "CY", "FI", "FR", "DE", "HU", "IT", "KW", "MY", "MV", "NP", "OM", "PK", "QA", "SA", "SG", "KR", "ES", "SE", "CH", "TH", "AE", "GB", "US", "IN"]); // the 25 delivery countries + India (JioHotstar)

// Region used when the requested one has no data for that platform (default: US).
const FALLBACK = { hotstar: "IN", zee5: "IN", sonyliv: "IN" };

const providerCache = new Map(); // region -> { at, list }
const HOUR = 3600 * 1000;

async function tmdb(path, params = {}) {
  const key = (process.env.TMDB_API_KEY || "").trim();
  if (!key) throw Object.assign(new Error("TMDB is not configured"), { config: true });
  const url = new URL(API + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = { accept: "application/json" };
  if (key.startsWith("eyJ")) headers.authorization = "Bearer " + key; // v4 read access token
  else url.searchParams.set("api_key", key); // v3 API key
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("TMDB HTTP " + res.status);
  return res.json();
}

async function providerId(platform, region) {
  const def = PLATFORMS[platform];
  try {
    let hit = providerCache.get(region);
    if (!hit || Date.now() - hit.at > 6 * HOUR) {
      const [m, t] = await Promise.all([
        tmdb("/watch/providers/movie", { watch_region: region }),
        tmdb("/watch/providers/tv", { watch_region: region }),
      ]);
      hit = { at: Date.now(), list: [...(m.results || []), ...(t.results || [])] };
      providerCache.set(region, hit);
    }
    const found = hit.list.find((p) => def.re.test(p.provider_name || ""));
    if (found) return found.provider_id;
  } catch (e) {
    if (e.config) throw e;
  }
  return def.id;
}

const shape = (kind) => (r) => ({
  id: r.id,
  k: kind,
  t: (kind === "movie" ? r.title : r.name) || "",
  y: ((kind === "movie" ? r.release_date : r.first_air_date) || "").slice(0, 4),
  d: (kind === "movie" ? r.release_date : r.first_air_date) || "",
  p: r.poster_path || "",
  v: r.vote_average ? Math.round(r.vote_average * 10) / 10 : 0,
  o: (r.overview || "").slice(0, 200),
  pop: r.popularity || 0,
});

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    // The visitor's country, read from their IP address by the host (used to pick the default region).
    if (req.query.geo) {
      res.setHeader("Cache-Control", "no-store");
      const c = String(req.headers["x-vercel-ip-country"] || "").toUpperCase();
      return res.status(200).json({ c: /^[A-Z]{2}$/.test(c) ? c : "" });
    }
    const p = String(req.query.p || "");
    const r = p === "hotstar" ? "IN" : String(req.query.r || "US").toUpperCase(); // JioHotstar: India only
    if (!PLATFORMS[p] || !REGIONS.has(r)) return res.status(400).json({ error: "Unknown platform or region" });

    // Some regions (e.g. Bangladesh) have no availability data in TMDB: fall back to a region that does.
    const lists = async (region) => {
      const id = await providerId(p, region);
      const base = {
        watch_region: region,
        with_watch_providers: id,
        with_watch_monetization_types: "flatrate",
        sort_by: "popularity.desc",
        include_adult: "false",
        language: "en-US",
        page: 1,
      };
      const [mv, tv] = await Promise.all([tmdb("/discover/movie", base), tmdb("/discover/tv", base)]);
      const take = (j, kind) => (j.results || []).filter((x) => x.poster_path).slice(0, 10).map(shape(kind));
      return { movies: take(mv, "movie"), tv: take(tv, "tv") };
    };
    let out = await lists(r);
    let fallback = "";
    if (!out.movies.length && !out.tv.length) {
      const fb = FALLBACK[p] && FALLBACK[p] !== r ? FALLBACK[p] : r === "US" ? "" : "US";
      if (fb) {
        out = await lists(fb);
        if (out.movies.length || out.tv.length) fallback = fb;
      }
    }

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({ platform: p, region: r, fallback, movies: out.movies, tv: out.tv, at: new Date().toISOString() });
  } catch (e) {
    // 424 instead of 5xx: Cloudflare replaces 5xx bodies with its own error page.
    return res.status(424).json({ error: e.config ? "Trending is not configured" : "Trending is unavailable right now" });
  }
};
