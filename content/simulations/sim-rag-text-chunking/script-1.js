
(()=>{
 const icon='<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
 document.querySelectorAll('.copy').forEach(button=>{
  button.innerHTML=icon+'<span class="copy-status" aria-live="polite"></span>';button.setAttribute('aria-label','Copy code');
  button.addEventListener('click',async()=>{
   const text=button.closest('.codeblock').querySelector('code').textContent;
   let copied=false;
   try{await navigator.clipboard.writeText(text);copied=true;}catch(e){
    const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(area);area.focus();area.select();try{copied=document.execCommand('copy')}catch(e2){}area.remove();button.focus();
   }
   if(!copied){const r=document.createRange();r.selectNodeContents(button.closest('.codeblock').querySelector('code'));const s=getSelection();s.removeAllRanges();s.addRange(r);}
   button.querySelector('span').textContent=copied?'Copied':'Selected';setTimeout(()=>button.querySelector('span').textContent='',1200);
  });
 });

})();
(()=>{const $=id=>document.getElementById(id);const words='Artificial intelligence enables machines to learn from data and make predictions while improving their performance over time through training'.split(' ');let wi=0;function draw(){const size=+$('size').value;$('overlap').max=size-1;if(+$('overlap').value>=size)$('overlap').value=size-1;const overlap=+$('overlap').value,step=size-overlap,windows=[];for(let i=0;i<words.length;i+=step){windows.push([i,Math.min(i+size,words.length)]);if(i+size>=words.length)break;}wi=Math.max(0,Math.min(wi,windows.length-1));const [a,b]=windows[wi];$('size-val').textContent=size+' words';$('overlap-val').textContent=overlap+' words';$('stride').textContent=step;$('nchunks').textContent=windows.length;$('current').textContent=wi+1;$('window-index').textContent=(wi+1)+' / '+windows.length;$('tokens').innerHTML=words.map((t,j)=>'<span class="chunk-token '+(j>=a&&j<b?(wi>0&&j<a+overlap?'overlap':'active'):'')+'">'+t+' <small>'+j+'</small></span>').join('');$('current-text').textContent=words.slice(a,b).join(' ')+' · words['+a+':'+b+']';$('window-prev').disabled=wi===0;$('window-next').disabled=wi===windows.length-1;}for(const id of ['size','overlap'])$(id).oninput=()=>{wi=0;draw()};$('window-prev').onclick=()=>{wi--;draw()};$('window-next').onclick=()=>{wi++;draw()};$('window-reset').onclick=()=>{wi=0;$('size').value=6;$('overlap').value=2;draw()};draw()})();