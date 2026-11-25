
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
(()=>{const $=id=>document.getElementById(id);$('raw').value="  Artificial    Intelligence\r\n\t is powerful.\n\n\n\nMachine    Learning  ";const names=["Original text","Normalize line endings","Collapse whitespace","Trim around newlines","Collapse blank lines","Strip outer whitespace"];let stage=0;function draw(){const raw=$('raw').value;const v=[raw];v.push(v[0].replace(/\r\n/g,"\n").replace(/\r/g,"\n"));v.push(v[1].replace(/[^\S\n]+/g," "));v.push(v[2].replace(/ *\n */g,"\n"));v.push(v[3].replace(/\n{3,}/g,"\n\n"));v.push(v[4].trim());$('prep-title').textContent=names[stage];$('prep-step').textContent=stage+"/5";$('prep-out').textContent=v[stage].replace(/ /g,"·").replace(/\t/g,"⇥").replace(/\r/g,"␍").replace(/\n/g,"↵\n")||"(Empty string)";$('raw-count').textContent=raw.length;$('clean-count').textContent=v[stage].length;$('prep-prev').disabled=stage===0;$('prep-next').disabled=stage===5;$('prep-next').textContent=stage===5?"Completed":"Next operation →";}$('raw').oninput=()=>{stage=0;draw()};$('prep-reset').onclick=()=>{stage=0;draw()};$('prep-prev').onclick=()=>{if(stage>0)stage--;draw()};$('prep-next').onclick=()=>{if(stage<5)stage++;draw()};draw()})();