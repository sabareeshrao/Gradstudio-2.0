
"use strict";
const points=[
{t:"Dog",x:49,y:99,c:"animal"},{t:"Puppy",x:74,y:59,c:"animal"},{t:"Cat",x:98,y:133,c:"animal"},
{t:"Car",x:166,y:100,c:"vehicle"},{t:"Bus",x:190,y:59,c:"vehicle"},{t:"Train",x:221,y:132,c:"vehicle"},
{t:"Pizza",x:267,y:99,c:"food"},{t:"Pasta",x:291,y:58,c:"food"},{t:"Burger",x:311,y:132,c:"food"}];
const color={animal:"#2563eb",vehicle:"#7c3aed",food:"#16a34a"};
const $=id=>document.getElementById(id);
let query="Dog",step=0;
function renderMap(){
 const chosen=points.find(p=>p.t===query),sorted=points.filter(p=>p.t!==query).map(p=>Object.assign({},p,{d:Math.hypot(p.x-chosen.x,p.y-chosen.y)})).sort((a,b)=>a.d-b.d);
 let s='<rect x="5" y="7" width="110" height="164" rx="9" fill="#eff6ff"/><rect x="121" y="7" width="124" height="164" rx="9" fill="#f5f3ff"/><rect x="251" y="7" width="84" height="164" rx="9" fill="#f0fdf4"/><g font-size="10" font-weight="600" text-anchor="middle"><text x="59" y="24" fill="#2563eb">Animals</text><text x="183" y="24" fill="#7c3aed">Vehicles</text><text x="293" y="24" fill="#15803d">Food</text></g>';
 sorted.slice(0,2).forEach(p=>{s+='<line x1="'+chosen.x+'" y1="'+chosen.y+'" x2="'+p.x+'" y2="'+p.y+'" stroke="#edb130" stroke-width="2.5" stroke-dasharray="4 4"/>'});
 points.forEach(p=>{if(p.t===query)s+='<circle cx="'+p.x+'" cy="'+p.y+'" r="14" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>';s+='<circle cx="'+p.x+'" cy="'+p.y+'" r="'+(p.t===query?7:5)+'" fill="'+color[p.c]+'"/><text x="'+p.x+'" y="'+(p.y-13)+'" text-anchor="middle" font-size="10" font-weight="'+(p.t===query?'700':'500')+'" fill="#334155">'+p.t+'</text>'});
 $('semanticMap').innerHTML=s;$('nearTitle').textContent='Nearest to “'+query+'”';
 $('similarityResults').innerHTML=sorted.slice(0,3).map((p,i)=>{const v=Math.max(0,Math.round(100-p.d*.4));return '<div class="metricrow"><span>'+(i+1)+'. '+p.t+'</span><span>'+v+'%</span></div><div class="bar '+(i===0?'first':'')+'"><i style="width:'+v+'%"></i></div>'}).join('');
 document.querySelectorAll('[data-query]').forEach(b=>{const active=b.dataset.query===query;b.classList.toggle('primary',active);b.setAttribute('aria-pressed',String(active))});
}
document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{query=b.dataset.query;renderMap()}));
function renderStep(){
 document.querySelectorAll('[data-step]').forEach(b=>{if(Number(b.dataset.step)===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
 $('prevStep').disabled=step===0;$('nextStep').textContent=step===3?'↻ Restart':'Next step ›';
 const h=[
 '<div style="font-size:34px;color:#2563eb">▤</div><div class="quote">A puppy is playing</div><div class="caption">Input text</div>',
 '<div class="bigtoken"><span>A</span><span>puppy</span><span>is</span><span>playing</span></div><div class="caption">Simplified tokenization. Actual tokenizers may use subword pieces.</div>',
 '<div class="modelbox"><span class="glyph">◈</span><strong>Embedding model</strong></div><div class="caption">Combines token representations into a sentence vector.</div>',
 '<div class="nums"><span>0.82</span><span>0.15</span><span class="neg">−0.46</span><span>0.71</span><span>0.33</span><span class="neg">−0.19</span></div><div class="caption">One illustrative vector for the whole sentence.</div>'
 ];
 $('stepBody').innerHTML=h[step];
}
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);renderStep()}));
$('prevStep').addEventListener('click',()=>{step=Math.max(0,step-1);renderStep()});
$('nextStep').addEventListener('click',()=>{step=(step+1)%4;renderStep()});
function renderCos(){
 const angle=Number($('angle').value),rad=angle*Math.PI/180,x=170+98*Math.cos(rad),y=110-98*Math.sin(rad),bx=170+105*Math.cos(rad),by=110-105*Math.sin(rad)-8;
 const cos=Math.cos(rad);const label=cos>.7?'Aligned':cos>.15?'Partly aligned':cos>=-.15?'Orthogonal':cos>-.7?'Opposing':'Opposite';
 $('cosDiagram').innerHTML='<circle cx="170" cy="110" r="98" stroke="#e2e8f0" stroke-dasharray="4 4" fill="none"/><path d="M60 110 H286 M170 12 V163" stroke="#e2e8f0" stroke-width="1.2"/><line x1="170" y1="110" x2="268" y2="110" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/><circle cx="268" cy="110" r="5" fill="#2563eb"/><line x1="170" y1="110" x2="'+x+'" y2="'+y+'" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/><circle cx="'+x+'" cy="'+y+'" r="5" fill="#16a34a"/><circle cx="170" cy="110" r="4" fill="#64748b"/><text x="278" y="104" font-size="12" font-weight="700" fill="#2563eb">A</text><text x="'+bx+'" y="'+by+'" font-size="12" font-weight="700" text-anchor="middle" fill="#15803d">B</text><text x="170" y="172" font-size="10" text-anchor="middle" fill="#64748b">Illustrative unit vectors</text>';
 $('angleDisplay').textContent=angle+'°';$('cosValue').textContent=cos.toFixed(2);$('cosRelation').textContent=label;
}
$('angle').addEventListener('input',renderCos);
document.querySelectorAll('[data-angle]').forEach(b=>b.addEventListener('click',()=>{$('angle').value=b.dataset.angle;renderCos()}));
renderMap();renderStep();renderCos();
