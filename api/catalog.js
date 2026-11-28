/* GET /api/catalog?l=top|soon&k=movie|tv : the 250 highest-rated titles (TMDB user rating, IMDb-style chart) or upcoming releases.
   GET /api/catalog?a=pv&k=movie|tv&ids=1,2,3 : streaming platforms for up to 12 titles (the chart loads them as rows come into view).
   GET /api/catalog?a=find&q=text : up to 4 matching titles, each with the platforms it streams on (used by the chat assistant).
   GET /api/catalog?a=on&p=netflix&k=movie|tv : popular titles currently on one platform (US catalogue), for "what is on Netflix".
   GET /api/catalog?a=web&q=text : a short answer searched online (Wikipedia), used by the chat assistant when none of its own answers fit.
   Where a platform is one StreamX sells, the reply carries its service page so the site can offer "Get <service>". */
const API = "https://api.themoviedb.org/3";
const HOUR = 3600 * 1000;

const { mapProviders } = require("./_providers");
/* Reviews show the customer's country (not the city). Older reviews saved only a Bangladeshi city: those count as Bangladesh. */
const BD_CITY = /^(dhaka|dacca|chattogram|chittagong|sylhet|rajshahi|khulna|barishal|barisal|rangpur|mymensingh|cumilla|comilla|gazipur|narayanganj|cox'?s bazar|bogura|bogra|jessore|jashore|savar|tangail|narsingdi|feni|noakhali|dinajpur|pabna|kushtia|tongi|bangladesh)\b/i;
const countryName = (c) => { if (!c) return ""; try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c) || c; } catch (e) { return c; } };
/* The visitor's country (2 letters) from the host's IP lookup; US when unknown. */
/* Everyone gets the same US lists, so the edge can cache one answer for all visitors (no per-visitor country lookup). */
const countryOf = () => "US";
/* Runs fn(region) for the visitor's country; when that gives fewer than 5 titles with posters (no data there), runs it for the US instead. */
async function withUS(cc, fn) {
  let d = null;
  if (cc !== "US") { try { d = await fn(cc); } catch (e) { d = null; } }
  if (d && (d.results || []).filter((r) => r.poster_path).length >= 5) return { data: d, reg: cc };
  return { data: await fn("US"), reg: "US" };
}
const db = require("./_db");
const PROV_ID = { netflix: 8, "prime-video": 9, "amazon-prime-video": 9, disneyplus: 337, hulu: 15, "hbo-max": 1899, crunchyroll: 283, paramountplus: 531, "apple-tv": 350, peacock: 386, jiohotstar: 122, zee5: 232, sonyliv: 237, viki: 344, mubi: 11 };
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

// Adds pl: the StreamX-sold services that carry each title (movie/series cards only).
async function attachPl(list) {
  const rows = (list || []).filter((x) => x && x.id && (x.k === "movie" || x.k === "tv") && !x.pl);
  const pv = await Promise.all(rows.map((x) => platformsCached(x.k, x.id)));
  rows.forEach((x, i) => { x.pl = pv[i].list.filter((q) => q.s); });
  return list;
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

async function build(l, k, cc) {
  const g = await genreMap();
  if (l === "top") {
    // TMDB lists 20 per page, so the top 250 is 13 pages.
    const pages = await Promise.all(Array.from({ length: 13 }, (_, i) => tmdb(`/${k}/top_rated`, { language: "en-US", page: i + 1 }).catch(() => ({ results: [] }))));
    const seen = new Set(), rows = [];
    for (const pg of pages) for (const r of pg.results || []) { if (r.poster_path && !seen.has(r.id)) { seen.add(r.id); rows.push(r); } }
    return rows.slice(0, 250).map((r) => item(r, k, g));
  }
  // Upcoming releases from every industry: each source is one TMDB discover query tagged with a category (c).
  const td = today(), mv = k === "movie";
  const base = mv ? { language: "en-US", sort_by: "popularity.desc", "primary_release_date.gte": td, with_release_type: "2|3", page: 1 }
    : { language: "en-US", sort_by: "popularity.desc", "first_air_date.gte": td, page: 1 };
  const path = mv ? "/discover/movie" : "/discover/tv";
  const IN = ["hi", "ta", "te", "ml", "kn", "bn", "mr", "pa"];
  const WORLD = ["fr", "es", "zh", "de", "it", "tr", "th", "pt", "id", "ru", "ar", "pl", "ja"];
  const cat = (r) => { const o = r.original_language, an = (r.genre_ids || []).includes(16); return o === "ja" && an ? "anime" : o === "ko" ? "korea" : IN.includes(o) ? "india" : o === "en" ? "hollywood" : "world"; };
  const CAP = { hollywood: 260, india: 160, korea: 100, anime: 100, world: 200 };
  // The same depth as Explore's Coming soon (popularity ranked, several pages), plus language-specific lists so every industry is covered.
  const calls = [];
  for (let pg = 1; pg <= 25; pg++) calls.push({ ...(mv ? { region: cc } : {}), page: pg });
  [["en", 3], ...IN.map((l) => [l, 2]), ["ko", 3], ...WORLD.map((l) => [l, 1])].forEach(([l, n]) => { for (let pg = 1; pg <= n; pg++) calls.push({ with_original_language: l, page: pg }); });
  calls.push({ with_original_language: "ja", with_genres: "16", page: 1 }, { with_original_language: "ja", with_genres: "16", page: 2 }, { with_original_language: "ja", with_genres: "16", page: 3 });
  const pages = await Promise.all(calls.map((x) => tmdb(path, { ...base, ...x }).catch(() => ({ results: [] }))));
  const seen = new Set(), rows = [], cnt = {};
  for (const pg of pages) for (const r of pg.results || []) {
    if (!r.poster_path || seen.has(r.id)) continue;
    const c = cat(r);
    if ((cnt[c] = (cnt[c] || 0) + 1) > CAP[c]) continue;
    seen.add(r.id);
    rows.push({ ...item(r, k, g), c });
  }
  rows.sort((a, b) => (a.d ? Date.parse(a.d) : 9e15) - (b.d ? Date.parse(b.d) : 9e15));
  // platforms for the nearest releases now; the page asks for the rest as they come into view
  const head = rows.slice(0, 40);
  const pl = await Promise.all(head.map((r) => platformsCached(k, r.id)));
  head.forEach((r, i) => { r.pl = pl[i].list; r.reg = pl[i].reg; });
  return rows;
}


/* ---------- Explore hub: GET /api/catalog?a=hub&s=<section>&k=movie|tv&page=1[&g=<genre id>][&p=<platform>] and a=genres, a=births ---------- */
const hubCache = new Map(); // key -> { at, body }
const HUB = new Set(["today", "nowplaying", "upcoming", "toprated", "boxoffice", "popular", "airing", "genre", "platform", "anime", "kdrama", "bollywood", "oscars", "awards", "disc", "trailers"]);
/* Language and curated collections for the Explore hub (sec "disc"). Each key is a TMDB discover recipe. */
const DISC = {
  bn_pop: { lang: "bn" }, bn_top: { lang: "bn", top: 1, vc: 30 }, bn_new: { lang: "bn", fresh: 1 },
  te: { lang: "te" }, ta: { lang: "ta" }, ml: { lang: "ml" }, kn: { lang: "kn" },
  tr: { lang: "tr" }, es: { lang: "es" }, fr: { lang: "fr" }, ja: { lang: "ja", noanim: 1 }, th: { lang: "th" },
  gems: { gem: 1 }, truth: { kw: "9672", top: 1, vc: 300 }, classics: { old: 1 }, hero: { kw: "9715" },
};
const oscarCache = new Map(); // "title|year" -> item (titles never change)
async function oscarItem(row, g) {
  const key = row[0] + "|" + row[1];
  let it = oscarCache.get(key);
  if (!it) {
    const find = async (extra) => { const r = await tmdb("/search/movie", { query: row[0], include_adult: "false", language: "en-US", ...extra }).catch(() => null); return r && (r.results || []).filter((x) => x.poster_path).sort((a, b) => b.vote_count - a.vote_count)[0]; };
    // film year first; a festival premiere and a theatrical release can fall in different years, so retry within a year either side
    let hit;
    if (row[3] === "bn") { // Bengali-language films: titles are romanised in many ways, so accept only a Bengali film released within a year of the award year
      const r = await tmdb("/search/movie", { query: row[0], include_adult: "false", language: "en-US" }).catch(() => null);
      hit = r && (r.results || []).filter((x) => x.poster_path && x.original_language === "bn" && Math.abs(parseInt((x.release_date || "0").slice(0, 4), 10) - row[1]) <= 1).sort((a, b) => b.vote_count - a.vote_count)[0];
    } else hit = (await find({ year: row[1] })) || (await find({ primary_release_year: row[1] + 1 })) || (await find({ primary_release_year: row[1] - 1 }));
    if (!hit) return null;
    it = item(hit, "movie", g);
    oscarCache.set(key, it);
  }
  return { ...it, aw: row[2] };
}
async function hubList(sec, k, page, genre, plat, mode, cc) {
  const g = await genreMap();
  const base = { language: "en-US", page, include_adult: "false" };
  let data, reg = "";
  const rgn = async (fn) => { const r = await withUS(cc, fn); reg = r.reg; return r.data; }; // region-aware: visitor's country, else US
  if (sec === "today") data = await rgn((rg) => tmdb("/discover/movie", { ...base, sort_by: "popularity.desc", "primary_release_date.gte": today(), "primary_release_date.lte": today(), with_release_type: "2|3|4", region: rg }));
  else if (sec === "nowplaying") data = await rgn((rg) => tmdb("/movie/now_playing", { ...base, region: rg }));
  else if (sec === "upcoming") data = k === "tv"
    ? await tmdb("/discover/tv", { ...base, sort_by: "popularity.desc", "first_air_date.gte": today() })
    : await rgn((rg) => tmdb("/discover/movie", { ...base, sort_by: "popularity.desc", "primary_release_date.gte": today(), with_release_type: "2|3", region: rg }));
  else if (sec === "toprated") data = await tmdb(`/${k}/top_rated`, base);
  else if (sec === "boxoffice") data = await tmdb("/discover/movie", { ...base, sort_by: "revenue.desc", "vote_count.gte": 500 });
  else if (sec === "popular") data = await rgn((rg) => k === "tv"
    ? tmdb("/discover/tv", { ...base, sort_by: "popularity.desc", watch_region: rg, with_watch_monetization_types: "flatrate|free|ads|rent|buy" })
    : tmdb("/movie/popular", { ...base, region: rg }));
  else if (sec === "airing") data = await tmdb("/tv/airing_today", base);
  else if (sec === "genre") data = await tmdb(`/discover/${k}`, { ...base, sort_by: "popularity.desc", with_genres: genre, "vote_count.gte": 50 });
  else if (sec === "trailers") {
    // Latest trailers: new and upcoming titles, each with its newest official YouTube trailer.
    data = k === "tv" ? await tmdb("/tv/on_the_air", base) : await rgn((rg) => tmdb("/movie/upcoming", { ...base, region: rg }));
    const rows = (data.results || []).filter((r) => r.poster_path || r.backdrop_path);
    const vids = await Promise.all(rows.map((r) => tmdb(`/${k}/${r.id}/videos`, { language: "en-US" }).catch(() => ({ results: [] }))));
    const out = [];
    rows.forEach((r, i) => {
      const t = (vids[i].results || []).filter((v) => v.site === "YouTube" && /trailer|teaser/i.test(v.type || "")).sort((a, b) => (/trailer/i.test(b.type) - /trailer/i.test(a.type)) || String(b.published_at).localeCompare(String(a.published_at)))[0];
      if (t) out.push({ ...item(r, k, g), yt: t.key, vt: String(t.name || "").slice(0, 80), vd: String(t.published_at || "").slice(0, 10), b: r.backdrop_path || "" });
    });
    out.sort((a, b) => b.vd.localeCompare(a.vd));
    return { page: data.page || page, pages: Math.min(data.total_pages || 1, 25), list: out, reg };
  } else if (sec === "anime") {
    // Anime = Japanese-language animation. Modes: popular, top (best rated), new (latest releases), crunchyroll.
    const A = { ...base, with_genres: "16", with_original_language: "ja" };
    const dk = k === "tv" ? "first_air_date" : "primary_release_date";
    if (mode === "top") Object.assign(A, { sort_by: "vote_average.desc", "vote_count.gte": k === "tv" ? 300 : 500 });
    else if (mode === "new") Object.assign(A, { sort_by: dk + ".desc", [dk + ".lte"]: today(), "vote_count.gte": 10 });
    else if (mode === "crunchyroll") Object.assign(A, { sort_by: "popularity.desc", with_watch_providers: 283, with_watch_monetization_types: "flatrate" });
    else A.sort_by = "popularity.desc";
    data = mode === "crunchyroll" ? await rgn((rg) => tmdb(`/discover/${k}`, { ...A, watch_region: rg })) : await tmdb(`/discover/${k}`, A);
  } else if (sec === "oscars") {
    const O = require("./_oscars");
    const rows = mode === "bestpicture" ? O.BEST_PICTURE : mode === "nominees" ? O.NOMINEES_2026 : O.WINNERS_2026;
    const part = rows.slice((page - 1) * 20, page * 20);
    const list = (await Promise.all(part.map((r) => oscarItem(r, g)))).filter(Boolean);
    return { page, pages: Math.max(1, Math.ceil(rows.length / 20)), list, reg };
  } else if (sec === "awards") {
    const rows = require("./_awards")[mode] || require("./_awards").goldenglobes;
    const part = rows.slice((page - 1) * 20, page * 20);
    const list = (await Promise.all(part.map((r) => oscarItem(r, g)))).filter(Boolean);
    return { page, pages: Math.max(1, Math.ceil(rows.length / 20)), list, reg };
  } else if (sec === "disc") {
    const D = DISC[mode] || DISC.gems, dk = k === "tv" ? "first_air_date" : "primary_release_date";
    const A = { ...base, sort_by: "popularity.desc", "vote_count.gte": 10 };
    if (D.lang) A.with_original_language = D.lang;
    if (D.kw) A.with_keywords = D.kw;
    if (D.noanim) A.without_genres = "16";
    if (D.top) Object.assign(A, { sort_by: "vote_average.desc", "vote_count.gte": D.vc || (k === "tv" ? 200 : 500) });
    if (D.gem) Object.assign(A, { sort_by: "vote_average.desc", "vote_average.gte": 7.4, "vote_count.gte": 150, "vote_count.lte": 2500 });
    if (D.old) Object.assign(A, { [dk + ".lte"]: "1989-12-31", sort_by: "vote_average.desc", "vote_count.gte": k === "tv" ? 200 : 1000 });
    if (D.fresh) Object.assign(A, { sort_by: dk + ".desc", [dk + ".lte"]: today(), "vote_count.gte": 3 });
    data = await tmdb(`/discover/${k}`, A);
  } else if (sec === "kdrama" || sec === "bollywood") {
    // Korean (K-drama) or Hindi (Bollywood) titles. Modes: popular, top (best rated), new (latest releases), netflix (on Netflix in the visitor's country), jiohotstar (on JioHotstar, India catalogue).
    const A = { ...base, with_original_language: sec === "kdrama" ? "ko" : "hi" };
    const dk = k === "tv" ? "first_air_date" : "primary_release_date";
    if (mode === "top") Object.assign(A, { sort_by: "vote_average.desc", "vote_count.gte": k === "tv" ? 200 : 400 });
    else if (mode === "new") Object.assign(A, { sort_by: dk + ".desc", [dk + ".lte"]: today(), "vote_count.gte": 5 });
    else if (mode === "netflix") Object.assign(A, { sort_by: "popularity.desc", with_watch_providers: 8, with_watch_monetization_types: "flatrate" });
    else if (mode === "jiohotstar") Object.assign(A, { sort_by: "popularity.desc", with_watch_providers: 122, with_watch_monetization_types: "flatrate", watch_region: "IN" });
    else Object.assign(A, { sort_by: "popularity.desc", "vote_count.gte": 20 });
    if (mode === "jiohotstar") { reg = "IN"; data = await tmdb(`/discover/${k}`, A); }
    else data = mode === "netflix" ? await rgn((rg) => tmdb(`/discover/${k}`, { ...A, watch_region: rg })) : await tmdb(`/discover/${k}`, A);
  } else data = await (plat === 122 ? (async () => { reg = "IN"; return tmdb(`/discover/${k}`, { ...base, sort_by: "popularity.desc", with_watch_providers: plat, watch_region: "IN", with_watch_monetization_types: "flatrate" }); })() : rgn((rg) => tmdb(`/discover/${k}`, { ...base, sort_by: "popularity.desc", with_watch_providers: plat, watch_region: rg, with_watch_monetization_types: "flatrate" })));
  const kind = sec === "today" || sec === "nowplaying" || sec === "boxoffice" ? "movie" : sec === "airing" ? "tv" : k;
  const out = (data.results || []).filter((r) => r.poster_path).map((r) => item(r, kind, g));
  return { page: data.page || page, pages: Math.min(data.total_pages || 1, 25), list: out, reg };
}

const PEOPLE = /\b(actor|actress|actors|singer|singers|songwriter|rapper|musician|pop star|film|filmmaker|movie|comedian|stand-up|entertainer|performer|producer|screenwriter|television|tv (host|presenter|personality)|presenter|dancer|choreographer|composer|cinematographer|animator|voice actor|stunt)\b/i;
const NOT_ENT = /\b(footballer|cricketer|athlete|sprinter|swimmer|boxer|wrestler|tennis|golfer|politician|statesman|prime minister|president|general|soldier|physicist|chemist|mathematician|economist|philosopher|astronaut|scientist|businessman|banker|bishop|priest|racing driver|basketball|baseball|hockey|rugby|olympic)\b/i;
/* Entertainment only: a film, TV or music role must come before any sport, politics or science role in the description. */
const isEntertainer = (desc) => { const a = desc.search(PEOPLE), b = desc.search(NOT_ENT); return a >= 0 && (b < 0 || a < b); };
const birthCache = new Map(); // "MM/DD" -> { at, list }
async function birthdays() {
  const d = today(), mm = d.slice(5, 7), dd = d.slice(8, 10), key = mm + "/" + dd;
  const hit = birthCache.get(key);
  if (hit && Date.now() - hit.at < 6 * HOUR) return hit.list;
  const r = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/${mm}/${dd}`, { headers: { accept: "application/json", "user-agent": "StreamXBot/1.0 (https://streamx.bd)" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("births HTTP " + r.status);
  const yr = new Date(Date.now() + 6 * HOUR).getUTCFullYear();
  const seen = new Set(), list = [];
  for (const b of (await r.json()).births || []) {
    const pg = (b.pages || [])[0];
    if (!pg || !pg.title || seen.has(pg.title) || !b.year || !isEntertainer(pg.description || "")) continue;
    seen.add(pg.title);
    list.push({ n: String(pg.titles && pg.titles.normalized || pg.title).slice(0, 80), y: b.year, age: yr - b.year, d: String(pg.description || "").slice(0, 90), img: (pg.thumbnail && pg.thumbnail.source) || "", u: (pg.content_urls && pg.content_urls.desktop && pg.content_urls.desktop.page) || "" });
  }
  list.sort((a, b) => b.y - a.y);
  const out = list.filter((x) => x.age < 100).slice(0, 30);
  birthCache.set(key, { at: Date.now(), list: out });
  return out;
}

/* ---------- Entertainment news: GET /api/catalog?a=news&c=all|movies|tv|people|boxoffice&page=1 (headlines from trade-press RSS feeds; each card links to the original article) ---------- */
const FEEDS = [["Variety", "https://variety.com/feed/"], ["Deadline", "https://deadline.com/feed/"], ["The Hollywood Reporter", "https://www.hollywoodreporter.com/feed/"], ["IndieWire", "https://www.indiewire.com/feed/"]];
const NEWS_C = {
  boxoffice: /box office|opening weekend|grosses|\bgross(es)?\b|ticket sales|global debut|domestic debut/,
  tv: /\b(series|tv|season|episode|episodes|streaming|netflix|hbo|disney\+|prime video|apple tv|showrunner|renewed|canceled|cancelled|sitcom|emmy|anime)\b/,
  people: /\b(actor|actress|star|stars|cast|casts|joins|dies|dead|wedding|engaged|director|singer|couple|interview|biopic|oscar|oscars|emmys|golden globes|rapper|comedian|celebrity)\b/,
  movies: /\b(film|films|movie|movies|trailer|release|premiere|sequel|franchise|studio|festival|cinema|theatrical|oscars|animated|blockbuster)\b/,
};
const newsCache = { at: 0, list: [] };
const decode = (t) => String(t || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&nbsp;/g, " ");
const tagOf = (b, n) => { const m = b.match(new RegExp("<" + n + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + n + ">", "i")); return m ? m[1] : ""; };
const attrOf = (b, n, a) => { const m = b.match(new RegExp("<" + n + "\\s[^>]*?" + a + '="([^"]+)"', "i")); return m ? decode(m[1]) : ""; };
const httpUrl = (u) => (/^https?:\/\//i.test(u) ? u : "");
function parseFeed(xml, source) {
  return xml.split(/<item[\s>]/).slice(1).map((it) => {
    const body = it.split(/<\/item>/)[0];
    const title = decode(tagOf(body, "title")).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    const link = httpUrl(decode(tagOf(body, "link")).trim());
    const raw = decode(tagOf(body, "content:encoded") || tagOf(body, "description"));
    const img = httpUrl(attrOf(body, "media:content", "url") || attrOf(body, "media:thumbnail", "url") || (/image/i.test(attrOf(body, "enclosure", "type")) ? attrOf(body, "enclosure", "url") : "") || ((raw.match(/<img[^>]+src="([^"]+)"/i) || [])[1] || ""));
    const desc = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const cats = [...body.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) => decode(m[1]).toLowerCase()).join(" ");
    const t = Date.parse(tagOf(body, "pubDate"));
    return { t: title, u: link, s: source, d: isNaN(t) ? 0 : t, i: img, x: desc.length > 170 ? desc.slice(0, 170).replace(/\s+\S*$/, "") + "…" : desc, _c: (title + " " + cats).toLowerCase() };
  }).filter((x) => x.t && x.u);
}
async function newsAll() {
  if (newsCache.list.length && Date.now() - newsCache.at < 15 * 60 * 1000) return newsCache.list;
  const got = await Promise.allSettled(FEEDS.map(async ([name, url]) => {
    const r = await fetch(url, { headers: { accept: "application/rss+xml, application/xml, text/xml", "user-agent": "StreamXBot/1.0 (https://streamx.bd)" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(name + " HTTP " + r.status);
    return parseFeed(await r.text(), name);
  }));
  const seen = new Set(), list = [];
  got.filter((g) => g.status === "fulfilled").flatMap((g) => g.value).sort((a, b) => b.d - a.d).forEach((x) => { const k = x.t.toLowerCase().slice(0, 60); if (!seen.has(k)) { seen.add(k); list.push(x); } });
  if (!list.length) throw new Error("no news");
  newsCache.at = Date.now(); newsCache.list = list.slice(0, 120);
  return newsCache.list;
}

/* Customer review sent from a service page: saved as PENDING (never shown or counted until approved in Admin).
   Needs the review columns from supabase/schema.sql (source, approved, contact). */
const rvHits = new Map();
const rvClean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
async function submitReview(req, res) {
  if (!db.enabled()) return res.status(503).json({ error: "off" });
  const b = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; } })() : req.body || {};
  if (b.website) return res.status(200).json({ ok: true }); // hidden field filled in: a bot, pretend it worked
  const ip = String(req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0] || "unknown").trim().slice(0, 64), now = Date.now();
  const hits = (rvHits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (hits.length >= 3) return res.status(429).json({ error: "You have sent a few reviews already. Please try again later." });
  const name = rvClean(b.name, 60), text = rvClean(b.body, 600), service = rvClean(b.service, 60);
  const contact = rvClean(b.contact, 80), rating = Math.min(5, Math.max(1, parseInt(b.rating, 10) || 0));
  if (!name) return res.status(400).json({ error: "Please add your name." });
  if (text.length < 15) return res.status(400).json({ error: "Please write a little more about your experience." });
  if (!service || !(b.rating >= 1)) return res.status(400).json({ error: "Please choose a star rating." });
  if (/https?:\/\/|www\./i.test(text + " " + name)) return res.status(400).json({ error: "Please leave out links." });
  try {
    await db.rest("POST", "reviews", { name, role: "", company: "", loc: "", services: [service], rating, body: text, source: "site", approved: false, contact, popular: false }, "return=minimal");
  } catch (e) { return res.status(503).json({ error: "off" }); }
  hits.push(now); rvHits.set(ip, hits);
  return res.status(200).json({ ok: true });
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    if (req.method === "POST" && req.query.a === "review") return await submitReview(req, res);
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const k = req.query.k === "tv" ? "tv" : "movie";
    const cc = countryOf(req);
    // Reviews (managed in Admin): public list, and the screenshot of one review's original
    if (req.query.a === "reviews") {
      if (!db.enabled()) return res.status(503).json({ error: "off" });
      const base = "id,name,role,company,loc,services,rating,body,photo,proof_kind,proof_url,has_img,popular,created_at";
      let rows;
      try { rows = (await db.rest("GET", `reviews?select=${base},kind,institution,country,expat,has_photo,source&approved=eq.true&order=created_at.desc&limit=100`)) || []; }
      catch (e0) {
        try { rows = (await db.rest("GET", `reviews?select=${base},kind,institution,country,expat,has_photo&order=created_at.desc&limit=100`)) || []; }
        catch (e) { rows = (await db.rest("GET", `reviews?select=${base}&order=created_at.desc&limit=100`)) || []; } // new columns not added yet
      }
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
      return res.status(200).json({ list: rows.map((r) => { const cc = r.country || (BD_CITY.test(r.loc || "") ? "BD" : ""); return ({ id: r.id, src: r.source === "site" ? "site" : "", n: r.name, role: r.role, company: r.company, loc: countryName(cc), services: r.services || [], s: r.rating, t: r.body, photo: r.has_photo ? "/api/catalog?a=rvimg&w=photo&id=" + r.id : r.photo, kind: r.kind || "pro", inst: r.institution || "", cc, x: !!r.expat, pk: r.proof_kind === "image" && !r.has_img ? "" : r.proof_kind, pu: r.proof_kind === "link" ? r.proof_url : "", popular: !!r.popular }); }) });
    }
    if (req.query.a === "rvimg") {
      const id = parseInt(req.query.id, 10);
      if (!(id > 0) || !db.enabled()) return res.status(404).end();
      const ph = req.query.w === "photo";
      const row = ((await db.rest("GET", `reviews?id=eq.${id}&select=${ph ? "photo_img,has_photo" : "proof_img,proof_kind"}`)) || [])[0];
      const m = row && (ph ? row.has_photo : row.proof_kind === "image") && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec((ph ? row.photo_img : row.proof_img) || "");
      if (!m) return res.status(404).end();
      res.setHeader("Content-Type", m[1]); res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
      return res.status(200).send(Buffer.from(m[2], "base64"));
    }
    // Public notice board (/notices/)
    if (req.query.a === "notices") {
      if (!db.enabled()) return res.status(503).json({ error: "off" });
      let rows;
      try { rows = await db.rest("GET", "notices?select=id,title,message,kind,pinned,link,link_label,created_at,expires_at&order=created_at.desc&limit=100"); }
      catch (e) { rows = await db.rest("GET", "notices?select=id,title,message,kind,created_at,expires_at&order=created_at.desc&limit=100"); }
      const now = Date.now();
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
      return res.status(200).json({ list: (rows || []).filter((n) => !n.expires_at || Date.parse(n.expires_at) > now).map((n) => ({ id: n.id, t: n.title, m: n.message, k: n.kind, pin: !!n.pinned, l: n.link || "", ll: n.link_label || "", at: n.created_at })) });
    }
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
    if (req.query.a === "search") {
      const text = String(req.query.q || "").replace(/\s+/g, " ").trim().slice(0, 80), page = Math.min(10, Math.max(1, parseInt(req.query.page, 10) || 1));
      if (text.length < 2) return res.status(200).json({ q: text, page: 1, pages: 1, list: [] });
      const g = await genreMap();
      const j = await tmdb("/search/multi", { query: text, page, include_adult: "false", language: "en-US" });
      res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
      const list = (j.results || []).filter((r) => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path).map((r) => item(r, r.media_type, g)) ;
      await attachPl(list);
      return res.status(200).json({ q: text, page: j.page || page, pages: Math.min(j.total_pages || 1, 10), list });
    }
    if (req.query.a === "news") {
      const c = ["movies", "tv", "people", "boxoffice"].includes(req.query.c) ? req.query.c : "all", page = Math.min(10, Math.max(1, parseInt(req.query.page, 10) || 1));
      const all = (await newsAll()).filter((x) => c === "all" || NEWS_C[c].test(x._c));
      res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
      return res.status(200).json({ c, page, pages: Math.max(1, Math.ceil(all.length / 12)), list: all.slice((page - 1) * 12, page * 12).map(({ _c, ...x }) => x) });
    }
    if (req.query.a === "genres") {
      const j = await tmdb(`/genre/${k}/list`, { language: "en-US" });
      res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
      return res.status(200).json({ k, genres: (j.genres || []).map((x) => ({ id: x.id, n: x.name })) });
    }
    if (req.query.a === "births") {
      res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
      return res.status(200).json({ date: today(), list: await birthdays() });
    }
    if (req.query.a === "hub") {
      const sec = String(req.query.s || ""), page = Math.min(25, Math.max(1, parseInt(req.query.page, 10) || 1));
      if (!HUB.has(sec)) return res.status(400).json({ error: "Unknown section" });
      const genre = String(req.query.g || "").replace(/[^0-9]/g, "").slice(0, 6), plat = PROV_ID[String(req.query.p || "").toLowerCase()];
      if (sec === "genre" && !genre) return res.status(400).json({ error: "Pick a genre" });
      if (sec === "platform" && !plat) return res.status(400).json({ error: "Unknown platform" });
      const mode = ["popular", "top", "new", "crunchyroll", "netflix", "jiohotstar", "winners", "nominees", "bestpicture", "goldenglobes", "bafta", "cannes", "filmfare", "national", "bangladesh", ...Object.keys(DISC)].includes(req.query.m) ? req.query.m : "popular", regional = ["nowplaying", "upcoming", "popular", "trailers", "platform"].includes(sec) || (sec === "anime" && mode === "crunchyroll") || ((sec === "kdrama" || sec === "bollywood") && mode === "netflix"), key = [sec, k, page, genre, plat, mode, regional ? cc : ""].join("|"), hit = hubCache.get(key);
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400"); // region lists differ per visitor
      if (hit && Date.now() - hit.at < HOUR) return res.status(200).json(hit.body);
      const body = { s: sec, k, ...(await hubList(sec, k, page, genre, plat, mode, cc)) };
      if (sec !== "trailers") await attachPl(body.list);
      if (hubCache.size > 400) hubCache.clear();
      hubCache.set(key, { at: Date.now(), body });
      return res.status(200).json(body);
    }
    const l = req.query.l === "soon" ? "soon" : "top", key = l + k + (l === "soon" ? cc : "");
    const hit = cache.get(key);
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    if (hit && Date.now() - hit.at < 3 * HOUR) return res.status(200).json(hit.body);
    // Stale-while-revalidate: an older copy (up to 7 days) is served at once while a fresh one is built; if the rebuild fails the old copy still answers.
    const fresh = () => build(l, k, cc).then((list) => { const body = { l, k, list, at: new Date().toISOString() }; cache.set(key, { at: Date.now(), body }); return body; });
    if (hit && Date.now() - hit.at < 7 * 24 * HOUR) {
      if (!hit.busy) { hit.busy = 1; fresh().catch(() => { hit.busy = 0; }); }
      return res.status(200).json(hit.body);
    }
    try { return res.status(200).json(await fresh()); }
    catch (e) { if (hit) return res.status(200).json(hit.body); throw e; }
  } catch (e) {
    console.error("catalog error", e && e.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(424).json({ error: e && e.config ? "Catalog is not configured" : "Catalog is unavailable right now" });
  }
};
