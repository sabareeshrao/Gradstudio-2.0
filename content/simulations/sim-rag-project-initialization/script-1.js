
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
