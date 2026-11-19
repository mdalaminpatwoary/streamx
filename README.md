# StreamX website

Static website for StreamX (digital subscriptions, Bangladesh). Plain HTML, CSS and JavaScript. There is no build step: open `index.html` or upload the folder to any static host.

## Folder structure

```
index.html                      Page structure and fixed text
favicon.ico                     Browser tab icon (root, for old browsers)
assets/
  css/
    base/        tokens (colors), base styles, motion (animations)
    layout/      section headers, header/navbar, footer
    components/  buttons, logo tiles, modals, toast, chat widget, cart
    sections/    one file per page section (hero, products, pricing, reviews ...)
  js/
    data/        EDIT HERE: config, catalog, reviews, faq, policies, why, logos
    utils/       helpers and shared icons
    components/  logo tile renderer
    features/    one file per feature (products, pricing, cart, reviews, trial ...)
    layout/      header, scroll motion, page effects, reveal-on-scroll
  img/
    brand/       logo.png
    favicon/     favicon and app icons
    logos/       your own service logos: <slug>.svg or .png (e.g. jiohotstar.png)
    pay/         bkash.png, nagad.png, rocket.png, upay.png
    reviews/     customer photos
```

## Where to change things

| What | File |
| --- | --- |
| WhatsApp number | `assets/js/data/config.js` (also in footer and a few links in `index.html`) |
| Products, plan types, prices, combo packs | `assets/js/data/catalog.js` |
| Customer reviews | `assets/js/data/reviews.js` (set `popular:true` for the rotating spotlight; add `photo` for a real portrait) |
| Review spotlight look and 10 s timer | `assets/css/sections/reviews-spotlight.css` and `POP_MS` in `assets/js/features/reviews.js` |
| WhatsApp avatar widget (names, messages) | `assets/js/features/chat-avatar.js` and `assets/css/components/chat-widget.css` |
| Payment logos | `assets/img/pay/*.png` |
| FAQ | `assets/js/data/faq.js` |
| About / Terms / Return Policy text | `assets/js/data/policies.js` |
| "Try before you pay" quick list | `assets/js/features/trial.js` (`TRY_LIST`) |
| Home hero text and order-card steps | `<section id="home">` in `index.html` (English text plus `data-bn` for Bangla) |
| Home hero (3D service carousel, rolling brand, dot-grid canvas) | `assets/css/sections/hero-modern.css` and `assets/js/features/hero-motion.js` (services: `SV` list) |
| Trending platforms and regions | `PLATFORMS` / `REGIONS` in `assets/js/features/trending.js` (and `api/trending.js`) |
| Site-wide motion (progress bar, glow, tilt) | `assets/js/layout/premium-motion.js` and `assets/css/base/premium-motion.css` |
| Colors (accent `--ac`, gradient `--g`) | `assets/css/base/tokens.css` |
| Numbers section values | `data-to` attributes in `index.html` |
| Social links | footer in `index.html` |

Plan line in the catalog: `V("Share Profile","badge","summary",[features],[notes],{1:180,6:1000,12:1800})`. The numbers are months and the price in BDT.

## Rules

- Scripts are plain `<script>` files that share one global scope, so load order matters. The order is set in `index.html`: data, utils, components, then features and layout.
- CSS files are also linked in `index.html`. Within a file, later rules override earlier ones; keep that in mind when adding rules.
- Product names must match everywhere: catalog, `TRY_LIST`, reviews (`p` and `services`) and the `data-plan` links in the footer.
- The 18+ category is hidden from the main list and asks for age confirmation.
- Brand logos come from Simple Icons (CC0) in `assets/js/data/logos.js`. A service without one uses your file in `assets/img/logos/`, otherwise a letter tile.

## Formatting

`.prettierrc.json` and `.editorconfig` are included. Format with `npx prettier --write "assets/**/*.{js,css}"`.

## Online payment (EPS) - Vercel setup

The site pays through EPS. Secrets stay on the server in `api/`, never in the website files.

```
api/_eps.js       EPS login, hash (HMAC-SHA512), prices the cart from assets/js/data/catalog.js
api/checkout.js   POST: creates the EPS payment and returns the payment page link
api/verify.js     GET: asks EPS if a payment succeeded (used by payment-result.html)
api/title.js      GET: details, cast, IMDb link and YouTube trailer for one title (TMDB), cached for a day
api/trending.js   GET: top 10 movies and series per platform and region (TMDB), cached for an hour
payment-result.html   Page customers land on after paying, cancelling or failing
vercel.json       Makes sure the catalog file is available to the API
```

Vercel > your project > Settings > Environment Variables (add to Production, Preview and Development), then redeploy:

| Name | Test (sandbox) | Live |
| --- | --- | --- |
| `EPS_ENV` | `sandbox` | `live` |
| `EPS_MERCHANT_ID` | sandbox value | live value |
| `EPS_STORE_ID` | sandbox value | live value |
| `EPS_USERNAME` | sandbox value | live value |
| `EPS_PASSWORD` | sandbox value | live value |
| `EPS_HASH_KEY` | sandbox value | live value |

Order e-mails: after a **confirmed** payment a copy of the order (customer, phone, email, items, amount, transaction ID) is e-mailed to `streamx.com.bd@gmail.com`. Create a free account at resend.com **with that same Gmail address**, make an API key and add it as `RESEND_API_KEY`. Optional: `ORDER_EMAIL_TO` to change the address.

Mark the password, hash key and API key as Sensitive. Test a sandbox payment first, then switch to the live values and `EPS_ENV=live`. Prices are always taken from `catalog.js` on the server, so changing a price there changes what is charged.

## Trending section (TMDB)

The "What's trending" section shows the top 10 movies and series per streaming platform and region. It stays hidden until data loads, so nothing looks broken without a key.

1. Create a free account at themoviedb.org, then Settings > API, and copy the **API Key** (or the **API Read Access Token**).
2. In Vercel add `TMDB_API_KEY` (mark it Sensitive) for all environments, then redeploy.
3. Reload the site. The section and its menu link appear.

Platforms and regions are listed at the top of `assets/js/features/trending.js` and `api/trending.js`. Rankings are TMDB popularity on each platform per region (not official viewing charts). TMDB asks for the attribution line, which is already shown under the section.

## SEO
- `index.html` head: title, description, canonical (`https://streamx.com.bd/`, change if your main domain differs), Open Graph, Twitter, JSON-LD (Organization, WebSite, ItemList of products with BDT prices, FAQPage) and a `<noscript>` product list.
- `robots.txt` and `sitemap.xml` in the root. If you add pages, add them to the sitemap. If the domain changes, update the canonical/og:url/JSON-LD/sitemap URLs.
- Product prices in the JSON-LD are static; regenerate them after big price changes.

## Catalog notes
- New categories: Virtual Cards. 3-year plans use duration key `36` in `catalog.js`.
- Apple Gift Card: ৳130 per $1, $5 to $500 in steps of $5 (`GIFT` in `catalog.js`; the server re-checks the price).


## Service pages and share images
- Every service has its own SEO page at `/services/<slug>/` (plus the hub `/services/`). They are generated from the catalog, so prices always match.
- After changing `assets/js/data/catalog.js` or the copy in `scripts/service-content.js`, run `node scripts/build-services.js` (pages + `sitemap.xml`) and `node scripts/build-og.js` (1200x630 share images in `assets/img/og/`, needs Playwright), then commit the output.
- Shared product links (`/services/<slug>/`) show a branded logo preview on WhatsApp, Facebook, Messenger, Telegram and X. 18+ services have no public page.
