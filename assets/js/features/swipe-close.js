/* Swipe down to close, for pop-ups on touch screens. sxSwipe(box, {bg, close}):
   the pop-up follows the finger, then slides away (and calls close) or springs back. Only starts when the content is scrolled to the top. */
(function(){
  function bind(box,o){
    if(!box||box._sxSw)return;box._sxSw=1;o=o||{};
    var bg=o.bg||null,d=null;
    function rest(){box.style.transition=box.style.transform=box.style.animation="";if(bg){bg.style.transition=bg.style.opacity=""}}
    function out(){
      box.style.animation="none";box.style.transition="transform .28s cubic-bezier(.4,0,1,1)";
      var r=box.getBoundingClientRect();box.style.transform="translateY("+(innerHeight-r.top+30)+"px)";
      if(bg){bg.style.transition="opacity .28s";bg.style.opacity="0"}
      setTimeout(function(){try{o.close&&o.close()}catch(e){}setTimeout(rest,60)},270);
    }
    function atTop(t){for(var n=t;n&&n!==box.parentNode;n=n.parentNode){if(n.nodeType===1&&n.scrollTop>0)return false;if(n===box)break}return true}
    box.addEventListener("touchstart",function(e){
      d=null;if(e.touches.length!==1||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||!atTop(e.target))return;
      d={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now(),dy:0,on:false,no:false};
    },{passive:true});
    box.addEventListener("touchmove",function(e){
      if(!d||d.no)return;
      var dx=e.touches[0].clientX-d.x,dy=e.touches[0].clientY-d.y;
      if(!d.on){
        if(Math.abs(dx)<8&&Math.abs(dy)<8)return;
        if(dy<=0||Math.abs(dx)>dy||!atTop(e.target)){d.no=true;return}
        d.on=true;box.style.animation="none";box.style.transition="none";if(bg)bg.style.transition="none";
      }
      d.dy=Math.max(0,dy);if(e.cancelable)e.preventDefault();
      box.style.transform="translateY("+d.dy+"px)";
      if(bg)bg.style.opacity=String(Math.max(.25,1-d.dy/(box.offsetHeight||600)));
    },{passive:false});
    function end(){
      var s=d;d=null;if(!s||!s.on)return;
      var v=s.dy/Math.max(1,Date.now()-s.t);
      if(s.dy>110||(v>.5&&s.dy>40))out();
      else{box.style.transition="transform .3s cubic-bezier(.16,1,.3,1)";box.style.transform="translateY(0)";if(bg){bg.style.transition="opacity .3s";bg.style.opacity="1"}setTimeout(rest,310)}
    }
    box.addEventListener("touchend",end);box.addEventListener("touchcancel",end);
  }
  window.sxSwipe=bind;
  /* Pop-ups that are already in the page: their own close buttons do the closing. */
  function click(sel,root){return function(){var b=(root||document).querySelector(sel);if(b)b.click()}}
  function auto(){
    var m=document.querySelector("#mdl .mdlb");if(m)bind(m,{close:click(".mdlx",document.getElementById("mdl"))});
    var r=document.getElementById("rmb");if(r)bind(r,{close:click(".rm-x",r)});
    var f=document.querySelector("#fdk .fdk-box");if(f)bind(f,{close:click(".fdk-x",f)});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",auto);else auto();
})();
