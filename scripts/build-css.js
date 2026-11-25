// Combines the home page's many small stylesheets into two files (fewer requests = faster first visit).
//   node scripts/build-css.js
// Edit the source files as usual, then run this once: it rewrites assets/css/bundle-*.css and the ?v= hash in index.html.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = path.join(__dirname, "..");
const css = (f) => path.join("assets/css", f);
const CORE = ["base/tokens", "base/base", "base/motion", "layout/section", "layout/header", "components/buttons", "components/logo-tile", "components/modal", "components/toast", "components/chat-widget", "components/panel-pause", "components/cart", "components/checkout", "sections/hero", "sections/hero-modern", "sections/marquee", "sections/products"];
const REST = ["sections/notices", "sections/bundles", "sections/pricing", "sections/why", "sections/stats", "sections/world", "sections/how-it-works", "sections/trial", "sections/payments", "sections/reviews", "sections/reviews-spotlight", "sections/faq", "sections/cta", "layout/footer"];
const build = (name, list) => {
  const out = list.map((f) => "/* " + f + ".css */\n" + fs.readFileSync(path.join(root, css(f + ".css")), "utf8").trim() + "\n").join("\n");
  fs.writeFileSync(path.join(root, css(name + ".css")), out);
  return crypto.createHash("md5").update(out).digest("hex").slice(0, 8);
};
const vCore = build("bundle-core", CORE), vRest = build("bundle-rest", REST);
let h = fs.readFileSync(path.join(root, "index.html"), "utf8");
h = h.replace(/bundle-core\.css\?v=\w+/g, "bundle-core.css?v=" + vCore).replace(/bundle-rest\.css\?v=\w+/g, "bundle-rest.css?v=" + vRest);
fs.writeFileSync(path.join(root, "index.html"), h);
console.log("core", vCore, "rest", vRest);
