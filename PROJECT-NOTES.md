# StreamX website: project notes

Keep this file in your repo. When you start a new chat with Claude, upload the site files and this note, and Claude can continue from where you left off.

## Files
- `index.html`: page structure and fixed text (headings, footer, modals)
- `style.css`: all styling (colors, layout, animations)
- `script.js`: product data and all behavior (cart, filters, reviews, forms)
- `logos.js`: brand logo icons (generated, rarely edited)
- `logo.png`: your logo (used in the header and footer)

## Where to change things (all in `script.js` unless noted)
- **Products, plan types, prices:** the `CATALOG` list. Each plan type looks like `V("Share Profile","badge","summary",[features],[notes],{1:180,6:1000,12:1800})`. The numbers are months and prices in BDT.
- **Categories (filter buttons):** `CATS`
- **Entertainment Combo packs:** `PACKS`
- **Customer reviews:** `REVIEWS` (role, company, services, fb, ig, popular, photo)
- **"Try before you pay" quick services:** `TRY_LIST`
- **FAQ questions:** `FAQS`
- **About, Terms, Return Policy text:** `POL`
- **WhatsApp number:** `WA_NUMBER` at the top (also appears in the footer and a few links in `index.html`)
- **Numbers section (customers, satisfaction, year):** the `data-to` values in `index.html`
- **Social links:** footer in `index.html`
- **Accent color:** `--ac` in `style.css` (logo red `#ED3124`); main gradient: `--g`

## Image folders (create them next to index.html)
- `images/logos/<name>.svg` or `.png`: logos for services without a built-in logo (for example `jiohotstar.png`, `capcut.png`)
- `images/pay/bkash.png`, `nagad.png`, `rocket.png`, `upay.png`: payment logos
- `images/<name>.jpg`: customer photos (set `photo:"images/<name>.jpg"` in `REVIEWS`)

## Rules to remember
- Product names must match everywhere: `CATALOG`, `TRY_LIST`, the `services` and `p` fields in `REVIEWS`, and the `data-plan` links in the footer.
- The 18+ category is hidden from the main list and asks for age confirmation.
- Colors: dark navy background with the logo red as the accent.
