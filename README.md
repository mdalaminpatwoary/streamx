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
| Customer reviews | `assets/js/data/reviews.js` |
| FAQ | `assets/js/data/faq.js` |
| About / Terms / Return Policy text | `assets/js/data/policies.js` |
| "Why StreamX" items | `assets/js/data/why.js` |
| "Try before you pay" quick list | `assets/js/features/trial.js` (`TRY_LIST`) |
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
