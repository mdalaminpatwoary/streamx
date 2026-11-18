/* Wraps every word of an element in <span class="w" style="--i:n"> so words can animate one by one. Keeps inner markup (e.g. .grad). */
function splitWords(root){
  let i=0;
  (function walk(n){
    [...n.childNodes].forEach(c=>{
      if(c.nodeType===3){
        const f=document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t=>{
          if(!t)return;
          if(/^\s+$/.test(t)){f.appendChild(document.createTextNode(" "));return}
          const w=document.createElement("span");w.className="w";w.style.setProperty("--i",i++);w.textContent=t;f.appendChild(w);
        });
        c.replaceWith(f);
      }else if(c.nodeType===1)walk(c);
    });
  })(root);
  return i;
}
