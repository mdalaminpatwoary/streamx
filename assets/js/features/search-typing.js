/* Typing placeholder animation in the search box. */
// ===== Typing text in the search box (soft blinking caret, no "|" character) =====
(function(){
  const inp=$("#search"),box=$("#sbox"),out=$("#typedTxt"),words=["Netflix","Prime Video","Spotify","ChatGPT","YouTube Premium","Canva","NordVPN","Claude"];
  inp.addEventListener("input",()=>box.classList.toggle("has",!!inp.value));
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){box.classList.add("still");return}
  let w=0,i=0,del=false;
  (function tick(){
    if(document.activeElement===inp||inp.value){setTimeout(tick,600);return}
    const word=words[w];let d=del?40:90;
    if(!del){i++;if(i>=word.length){i=word.length;del=true;d=1600}}
    else{i--;if(i<=0){i=0;del=false;w=(w+1)%words.length;d=500}}
    out.textContent="Search "+word.slice(0,i);
    setTimeout(tick,d);
  })();
})();
