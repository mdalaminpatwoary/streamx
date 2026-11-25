/* Cart and checkout card (saved in the browser). */
// ===== Cart / checkout card (saved in the browser) =====
let cart=[],shown=0,tip=0;try{cart=JSON.parse(localStorage.getItem("sx_cart"))||[]}catch(e){}
const saveCart=()=>{try{localStorage.setItem("sx_cart",JSON.stringify(cart))}catch(e){}};
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),2200)}
function openCart(o=true){const d=$("#drawer");d.classList.toggle("open",o);$("#overlay").classList.toggle("show",o);if(o){d.classList.add("opening");setTimeout(()=>d.classList.remove("opening"),1300)}}
function addToCart(i,v,k){
  const p=PRODUCTS[i],vr=p.variants[v],pl=vr.plans[k],vn=p.variants.length>1?vr.n:"",id=[p.name,vr.n,pl.v].join("|"),x=cart.find(c=>c.id===id);
  x?x.q++:cart.push({id,name:p.name,vr:vn,v:pl.v,p:pl.p,q:1,fresh:true});
  renderCart();toast(`✓ ${p.name}${vn?" – "+vn:""} (${pl.v}) added to cart`);
  const b=$("#cartBtn");b.classList.remove("bump");void b.offsetWidth;b.classList.add("bump");
}
// "Buy Now": put the plan in the cart (once) and go straight to the secure payment form.
function buyNow(i,v,k){
  const p=PRODUCTS[i],vr=p.variants[v],pl=vr.plans[k],id=[p.name,vr.n,pl.v].join("|");
  if(!cart.find(c=>c.id===id))addToCart(i,v,k);
  $("#payBtn").click();
}
function changeQty(j,d){cart[j].bump=true;cart[j].q+=d;if(cart[j].q<1)cart.splice(j,1);renderCart()}
function removeItem(j){const el=$("#cartItems").children[j];if(!el||el.classList.contains("out"))return;el.classList.add("out");setTimeout(()=>{cart.splice(j,1);renderCart()},380)}
function renderCart(){
  const n=cart.reduce((s,c)=>s+c.q,0),total=cart.reduce((s,c)=>s+c.q*c.p,0);
  var cc=$("#cartCount");if(cc.textContent!=String(n)){cc.textContent=n;cc.classList.remove("bump");void cc.offsetWidth;cc.classList.add("bump")}$("#cartCount").style.display=n?"grid":"none";
  $("#cartItems").innerHTML=cart.length?cart.map((c,j)=>`<div class="ci${c.fresh?" new":""}" style="--k:${j}">${ptile({name:c.name,color:"#1E2545",icon:c.name[0]})}<div class="cn"><b>${c.name}</b><small>${c.vr?c.vr+" · ":""}${c.v} · ${taka(c.p)}</small></div>
    <div class="qty"><button onclick="changeQty(${j},-1)">−</button><span${c.bump?' class="qbump"':""}>${c.q}</span><button onclick="changeQty(${j},1)">+</button></div><button class="rm" onclick="removeItem(${j})" aria-label="Remove ${c.name}">✕</button></div>`).join(""):`<div class="empty"><span class="eb">${BAG}</span><p>Your cart is empty.<br>Add a plan to get started.</p></div>`;
  const grand=total+tip;tween($("#cartTotal"),shown,grand,600,"৳");shown=grand;
  const msg="Hi StreamX! I want to order:\n"+cart.map((c,j)=>`${j+1}. ${c.name}${c.vr?" – "+c.vr:""} (${c.v}) x${c.q} - ${taka(c.p*c.q)}`).join("\n")+`\nTotal: ${taka(grand)}`;
  const co=$("#checkout");co.href=cart.length?wa(msg):"#";co.classList.toggle("off",!cart.length);
  const pb=$("#payBtn");if(pb)pb.classList.toggle("off",!cart.length);
  cart.forEach(c=>{c.fresh=false;c.bump=false});$("#cartItemsN").textContent=n;$("#clearCart").hidden=!n;$("#cartSub").textContent=n?`· ${n} item${n>1?"s":""}`:"";saveCart();
}
$("#cartBtn").onclick=()=>openCart(true);
$("#closeCart").onclick=$("#overlay").onclick=()=>openCart(false);
$("#clearCart").onclick=()=>{const prev=cart.slice();if(!prev.length)return;cart=[];renderCart();const t=$("#toast");t.innerHTML='Cart cleared <button type="button" class="tun">Undo</button>';t.classList.add("show","act");clearTimeout(t._t);const hide=()=>{t.classList.remove("show","act")};t._t=setTimeout(hide,5000);t.querySelector(".tun").onclick=()=>{cart=prev;renderCart();hide()}};
document.onkeydown=e=>{if(e.key==="Escape"){openCart(false);$("#mdl").classList.remove("show")}};
renderCart();
// Stay in sync when the cart changes on another tab or a service page (also when coming back with the Back button).
window.addEventListener("storage",e=>{if(e.key==="sx_cart"){try{cart=JSON.parse(e.newValue)||[]}catch(x){cart=[]}renderCart()}});
window.addEventListener("pageshow",e=>{if(e.persisted){try{cart=JSON.parse(localStorage.getItem("sx_cart"))||[]}catch(x){}renderCart()}});

