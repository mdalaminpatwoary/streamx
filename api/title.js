/* GET /api/title?id=<tmdb id>&k=movie|tv : details, cast, IMDb link and trailer for one title (TMDB).
   GET /api/title?q=<name>[&l=<original language>] : poster lookup by name -> { id, k, t, p }. */
const API = "https://api.themoviedb.org/3";
const { mapProviders } = require("./_providers");

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

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (req.query.q) {
      const q = String(req.query.q).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80);
      if (!q) return res.status(400).json({ error: "Bad query" });
      const r = await tmdb("/search/multi", { query: q, include_adult: "false", language: "en-US" });
      const lg = /^[a-z]{2}$/.test(String(req.query.l || "")) ? String(req.query.l) : "";
      const hit = ((r && r.results) || []).find((x) => (x.media_type === "movie" || x.media_type === "tv") && x.poster_path && (!lg || x.original_language === lg));
      res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=2592000");
      return res.status(200).json(hit ? { id: hit.id, k: hit.media_type, t: hit.title || hit.name || "", p: hit.poster_path } : { p: "" });
    }
    const id = String(req.query.id || "");
    const k = req.query.k === "tv" ? "tv" : "movie";
    if (!/^\d{1,9}$/.test(id)) return res.status(400).json({ error: "Bad id" });

    const d = await tmdb(`/${k}/${id}`, { append_to_response: "videos,credits,external_ids,watch/providers", language: "en-US", include_video_language: "en,null" });
    const vids = ((d.videos && d.videos.results) || []).filter((v) => v.site === "YouTube");
    const pick =
      vids.find((v) => v.type === "Trailer" && v.official) || vids.find((v) => v.type === "Trailer") || vids.find((v) => v.type === "Teaser") || vids[0];
    const imdb = d.imdb_id || (d.external_ids && d.external_ids.imdb_id) || "";
    const cast = ((d.credits && d.credits.cast) || []).slice(0, 8).map((c) => ({ n: c.name, c: c.character || "", p: c.profile_path || "" }));
    const crew = (d.credits && d.credits.crew) || [];
    const director = k === "movie" ? (crew.find((c) => c.job === "Director") || {}).name || "" : ((d.created_by || [])[0] || {}).name || "";

    const wp = mapProviders(d["watch/providers"] && d["watch/providers"].results, 8);
    res.setHeader("Cache-Control", "public, s-maxage=43200, stale-while-revalidate=604800");
    return res.status(200).json({
      id: d.id,
      k,
      t: (k === "movie" ? d.title : d.name) || "",
      tag: d.tagline || "",
      o: d.overview || "",
      y: ((k === "movie" ? d.release_date : d.first_air_date) || "").slice(0, 4),
      rt: k === "movie" ? d.runtime || 0 : (d.episode_run_time && d.episode_run_time[0]) || 0,
      seasons: d.number_of_seasons || 0,
      g: (d.genres || []).map((x) => x.name),
      v: d.vote_average ? Math.round(d.vote_average * 10) / 10 : 0,
      vc: d.vote_count || 0,
      imdb,
      yt: pick ? pick.key : "",
      bd: d.backdrop_path || "",
      p: d.poster_path || "",
      lang: (d.original_language || "").toUpperCase(),
      status: d.status || "",
      dir: director,
      cast,
      pl: wp.list, reg: wp.reg,
    });
  } catch (e) {
    return res.status(424).json({ error: e.config ? "Not configured" : "Details are unavailable right now" });
  }
};
