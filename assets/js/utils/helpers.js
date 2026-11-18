/* Small shared helpers: WhatsApp link, selectors, price format, count tween, slug. */
const wa = t => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const $ = s => document.querySelector(s);
const taka = n => "৳" + n.toLocaleString("en-US");
function tween(el,from,to,ms=700,pre=""){const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);el.textContent=pre+Math.round(from+(to-from)*e).toLocaleString("en-US");if(k<1)requestAnimationFrame(f)})(t0)}
const slug=n=>n.toLowerCase().replace(/\+/g,"plus").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
