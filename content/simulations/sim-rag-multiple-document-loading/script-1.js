
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
(()=>{const $=id=>document.getElementById(id),names=['ai.txt','llm.txt','rag.txt'],texts=['Artificial intelligence enables machines...','A large language model is trained...','Document chunking divides large documents...'];let n=0;function draw(){$('dict-count').textContent=n+'/3 files loaded';$('dict-files').innerHTML=names.map((x,i)=>'<div class="dict-file '+(i===n?'active':'')+'"><span style="color:'+(i<n?'#4ade80':'#aaa')+'">'+(i<n?'✓':'▤')+'</span>'+x+'</div>').join('');$('dict-records').innerHTML=n?names.slice(0,n).map((x,i)=>'<div class="dict-record"><strong style="color:#86efac">'+x+'</strong><small>'+texts[i]+'</small></div>').join(''):'<div class="dict-empty"><strong style="font-size:22px">{}</strong><br><small>Empty dictionary</small></div>';$('dict-desc').textContent=n?names[n-1]+' నుంచి text చదివి dictionary లో store చేశాం.':'Dictionary initialize అయింది. ఇంకా documents load కాలేదు.';$('dict-prev').disabled=n===0;$('dict-next').disabled=n===3;$('dict-next').textContent=n===3?'All documents loaded':'Load next document →';}$('dict-reset').onclick=()=>{n=0;draw()};$('dict-prev').onclick=()=>{if(n>0)n--;draw()};$('dict-next').onclick=()=>{if(n<3)n++;draw()};draw()})();