
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

(()=>{
let phase=0;
const $=id=>document.getElementById(id);
const labels=['Path object','Open file','read_text()','Return str'];
const titles=['Locate the document','Open the document','Read the document','Return the string'];
const descriptions=['Path object ద్వారా file ఎక్కడ ఉందో గుర్తిస్తాం.','Python file ని reading కోసం open చేస్తుంది.','UTF-8 encoding ఉపయోగించి file లోని bytes ని text గా decode చేస్తుంది.','File close అవుతుంది. చదివిన text string రూపంలో మన program కి అందుతుంది.'];
function render(){
 const active=phase>=2;const color=active?'#16a34a':'#64748b';
 let s='<svg class="diagram" viewBox="0 0 340 195" role="img" aria-label="Document loading from ai.txt into RAM"><rect x="8" y="18" width="105" height="150" rx="7" stroke="#64748b" fill="#64748b" fill-opacity=".07"/><text x="60" y="36" text-anchor="middle" font-size="11" fill="#f5f5f5">ai.txt</text>';
 for(let i=0;i<3;i++)s+='<rect x="20" y="'+(52+i*32)+'" width="81" height="24" rx="3" fill="#3b82f6" fill-opacity="'+(active?.2:.07)+'" stroke="#3b82f6" stroke-opacity="'+(active?1:.4)+'"/><text x="60" y="'+(67+i*32)+'" text-anchor="middle" font-size="10" fill="#f5f5f5">'+['AI','ML','RAG'][i]+'</text>';
 s+='<path d="M117 93 H223" stroke="'+color+'" stroke-dasharray="'+(active?'0':'4 4')+'" stroke-width="1.5"/><path d="M216 88 L224 93 L216 98" fill="none" stroke="'+color+'"/><text x="170" y="78" font-size="10" text-anchor="middle" fill="#f5f5f5">'+labels[phase]+'</text>';
 if(phase===2)s+='<rect x="155" y="85" width="26" height="16" rx="3" fill="#16a34a"/>';
 s+='<rect x="228" y="18" width="104" height="150" rx="7" stroke="'+(phase===3?'#16a34a':'#64748b')+'" fill="'+(phase===3?'#16a34a':'#64748b')+'" fill-opacity=".06"/><text x="280" y="36" font-size="11" text-anchor="middle" fill="#f5f5f5">RAM</text>';
 if(phase===3){for(let i=0;i<3;i++)s+='<rect x="241" y="'+(52+i*32)+'" width="78" height="24" rx="3" fill="#16a34a" fill-opacity=".15" stroke="#16a34a"/><text x="280" y="'+(67+i*32)+'" text-anchor="middle" font-size="10" fill="#f5f5f5">'+['AI text','ML text','RAG text'][i]+'</text>';}else s+='<text x="280" y="100" text-anchor="middle" font-size="11" fill="#f5f5f5" opacity=".5">Empty</text>';
 $('sim-diagram').innerHTML=s+'</svg>';$('phase-count').textContent=(phase+1)+'/4';$('sim-title').textContent=titles[phase];$('sim-info').textContent=descriptions[phase];$('prev').disabled=phase===0;$('next').disabled=phase===3;
}
$('load-reset').onclick=()=>{phase=0;render()};$('prev').onclick=()=>{if(phase>0){phase--;render()}};$('next').onclick=()=>{if(phase<3){phase++;render()}};render();
})();
