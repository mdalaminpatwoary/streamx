/* Shows the customer's profile photo in the header account button (home and service pages). The photo is cached by My account / the background warm-up in localStorage "sx_av". */
(function(){
  var b=document.getElementById("acctBtn")||document.querySelector("a.sp-acct");if(!b)return;
  var t,a;try{t=localStorage.getItem("sx_session");a=JSON.parse(localStorage.getItem("sx_av")||"null")}catch(e){}
  if(!t){try{localStorage.removeItem("sx_av")}catch(e){}return}
  if(!a||!a.p)return;
  var s=document.createElement("style");s.textContent=".has-av{padding:0!important;overflow:hidden}.has-av img{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}";document.head.appendChild(s);
  var im=new Image();im.alt="";im.referrerPolicy="no-referrer";
  im.onload=function(){b.classList.add("has-av");b.textContent="";b.appendChild(im)};
  im.src=a.p;
})();
