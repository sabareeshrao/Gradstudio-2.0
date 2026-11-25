
"use strict";
const $=id=>document.getElementById(id);
const KVERT=[-1,2,-1,-1,2,-1,-1,2,-1];
const KHORZ=[-1,-1,-1,2,2,2,-1,-1,-1];
const captions=[
 ["1. Turn a picture into pixels","A computer sees numbers. Here, blue squares have value 1 and white squares have value 0."],
 ["2. A filter is a tiny pattern checker","This 3×3 filter adds the center column and subtracts the sides. It gives a high score to a bright vertical line."],
 ["3. Slide the filter across the image","The same filter checks all 16 possible 3×3 windows. Every calculation becomes one cell of a 4×4 feature map."],
 ["4. ReLU removes negative values","ReLU means Rectified Linear Unit: replace negative scores with 0, and keep positive scores unchanged."],
 ["5. Max pooling keeps the strongest values","Split the 4×4 map into 2×2 neighborhoods. Keep the largest number from each — making a 2×2 summary."],
 ["6. What did the filter find?","Compare how strongly a vertical-line filter and a horizontal-line filter respond. Real CNNs use many learned filters and layers."]
];
let step=0,picture="vertical",scan=1,block=0,playing=false,timer=null;
function inputValues(){return Array.from({length:36},(_,i)=>{const r=Math.floor(i/6),c=i%6;return +(picture==="vertical"?(c===2&&r<4):(r===2&&c>=1&&c<=4))})}
function conv(pix,filter){const out=[];for(let r=0;r<4;r++){for(let c=0;c<4;c++){let s=0;for(let j=0;j<9;j++)s+=pix[(r+Math.floor(j/3))*6+c+j%3]*filter[j];out.push(s)}}return out}
function relu(v){return v.map(x=>Math.max(0,x))}
function pool(v){return [0,2,8,10].map(start=>Math.max(v[start],v[start+1],v[start+4],v[start+5]))}
function cellHtml(value,kind,extra){return '<div class="cell '+(kind||'')+' '+(extra||'')+'">'+value+'</div>'}
function grid(size,arr,kind,focused,clickable){
 let html='<div class="matrix" data-size="'+size+'">';
 arr.forEach((v,i)=>{
  const r=Math.floor(i/size),c=i%size;
  let extra="";
  if(focused&&focused.type==="window6"){const wr=Math.floor(focused.n/4),wc=focused.n%4;if(r>=wr&&r<wr+3&&c>=wc&&c<wc+3)extra="window"}
  if(focused&&focused.type==="block4"){const br=Math.floor(focused.n/2)*2,bc=(focused.n%2)*2;if(r>=br&&r<br+2&&c>=bc&&c<bc+2)extra="window"}
  if(focused&&focused.type==="single"&&i===focused.n)extra="active";
  if(kind==="image")html+=cellHtml(v,v?"lit":"",extra);
  else if(kind==="kernel")html+=cellHtml(v,v>0?"plus":"minus",extra);
  else if(kind==="map")html+=cellHtml(v,v>0?"positive":v<0?"minus":"zero",extra);
  else if(kind==="relu")html+=cellHtml(v,v>0?"relus":"zero",extra);
  else if(kind==="pooled")html+=cellHtml(v,"relus",extra);
  else html+=cellHtml(v,"",extra);
 });
 return html+"</div>";
}
function sub(title,content,notes){return '<div class="mgroup"><div class="mtitle">'+title+'</div>'+content+(notes?'<div class="caption">'+notes+'</div>':'')+'</div>'}
function scene(title,description,html){return '<div class="lesson-title">'+title+'</div><p class="lesson-desc">'+description+'</p><div class="lesson-scene">'+html+'</div>'}
function note(text){return '<div class="instruction">'+text+'</div>'}
function pixPatch(p,idx){const rr=Math.floor(idx/4),cc=idx%4,out=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)out.push(p[(rr+r)*6+cc+c]);return out}
function selectionButtons(){return '<div class="scan-buttons"><button class="btn" data-scan="prev">‹ Move back</button><button class="btn primary" data-scan="next">Move next →</button><button class="btn" data-scan="auto">'+(playing?'❚❚ Pause':'▶ Auto scan')+'</button></div>'}
function render(){
 const p=inputValues(),result=conv(p,KVERT),active=relu(result),pooled=pool(active);
 $('stepCount').textContent='Step '+(step+1)+' of 6';
 $('prev').disabled=step===0;$('next').textContent=step===5?'↻ Start again':'Next step →';
 document.querySelectorAll('[data-picture]').forEach(b=>{const on=b.dataset.picture===picture;b.classList.toggle('primary',on);b.setAttribute('aria-pressed',on?'true':'false')});
 document.querySelectorAll('[data-step]').forEach(b=>{if(Number(b.dataset.step)===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
 $('progress').innerHTML=Array.from({length:6},(_,i)=>'<span class="'+(i<=step?'on':'')+'"></span>').join('');
 let view='';
 if(step===0){
  view='<div class="two">'+sub('Your 6×6 image',grid(6,p,'image'),"Blue = 1 · White = 0")+sub('What the numbers mean','<div class="center"><div class="large">0 & 1</div><p class="explain" style="margin:8px 0">1 = bright pixel<br>0 = dark pixel</p></div>','Real photos use many intensity values and often three color channels.')+'</div>'+note('<strong>Notice:</strong> The '+(picture==="vertical"?'vertical':'horizontal')+' line is just a pattern of blue squares.');
 }else if(step===1){
  const sample=1,patch=pixPatch(p,sample),sum=result[sample],center=patch[1]+patch[4]+patch[7],sides=patch.reduce((total,value,i)=>total+(i%3===1?0:value),0);
  view='<div class="two">'+sub('3×3 image patch',grid(3,patch,'image'),"A small piece of the original image")+sub('Vertical line filter',grid(3,KVERT,'kernel'),"Center: +2 · Sides: −1")+'</div>'+
  '<div class="sum"><div class="center subnumber">FILTER SCORE</div><div class="mathline">('+center+' center pixels × 2) − ('+sides+' side pixels × 1)</div><div class="center sum-answer">= '+sum+'</div></div>'+
  note('<strong>Why?</strong> When the middle column is bright and its sides are dark, the filter score is strongly positive.');
 }else if(step===2){
  const rr=Math.floor(scan/4),cc=scan%4;
  const img=grid(6,p,'image',{type:'window6',n:scan});
  const visible=result.map((v,i)=>i<=scan?v:'·');
  let feat='<div class="matrix" data-size="4">'+visible.map((v,i)=>cellHtml(v,i>scan?'dim':v>0?'positive':v<0?'minus':'zero',i===scan?'active':'')).join('')+'</div>';
  view='<div class="two">'+sub('Input · 6×6',img,'Yellow border = current 3×3 window')+sub('Feature map · 4×4',feat,'Each window produces one score')+'</div>'+
    '<div class="sum center"><span class="subnumber">WINDOW '+(scan+1)+' / 16 &nbsp; • &nbsp; ROW '+(rr+1)+', COLUMN '+(cc+1)+'</span><div class="large">'+result[scan]+'</div><span class="caption">Filter score at this location</span></div>'+selectionButtons()+
    note('<strong>Watch:</strong> As the window moves, a new score appears in the same position in the feature map.');
 }else if(step===3){
  const negativeCount=result.filter(x=>x<0).length;
  view='<div class="two">'+sub('Before ReLU',grid(4,result,'map'),'Negative scores are shown in gray')+sub('After ReLU',grid(4,active,'relu'),'Negative scores become zero')+'</div>'+
   '<div class="sum center"><div class="mathline">ReLU(x) = max(0, x)</div><div class="pills"><span class="pill negative">−3 → 0</span><span class="pill">6 → 6</span></div></div>'+
   note('<strong>'+negativeCount+' negative cells</strong> became zero. Positive scores stayed unchanged. Other patterns may produce different results.');
 }else if(step===4){
  const starts=[0,2,8,10],start=starts[block],values=[active[start],active[start+1],active[start+4],active[start+5]],max=Math.max(...values);
  view='<div class="two">'+sub('ReLU feature map · 4×4',grid(4,active,'relu',{type:'block4',n:block}),'Yellow border = selected 2×2 block')+sub('Pooled map · 2×2',grid(2,pooled,'pooled',{type:'single',n:block}),'One maximum from each block')+'</div>'+
   '<div class="sum center"><span class="subnumber">BLOCK '+(block+1)+' / 4</span><div class="mathline">max('+values.join(', ')+') = <span style="color:#147f51">'+max+'</span></div></div>'+
   '<div class="scan-buttons"><button class="btn" data-pool="prev">‹ Previous block</button><button class="btn primary" data-pool="next">Next block →</button></div>'+
   note('<strong>Key idea:</strong> Pooling keeps a strong response, not every pixel. The output is smaller and easier for later layers to process.');
 }else if(step===5){
  const v=Math.max(0,...result),h=Math.max(0,...conv(p,KHORZ)),winner=v>=h?'Vertical':'Horizontal';
  const bars=[{name:'Vertical detector',value:v},{name:'Horizontal detector',value:h}].map(x=>'<div style="margin-bottom:14px"><div class="resultline"><span>'+x.name+'</span><strong>'+x.value+'</strong></div><div class="bar '+(x.name.startsWith(winner)?'winner':'')+'"><i style="width:'+(100*x.value/6)+'%"></i></div></div>').join('');
  view='<div class="two">'+sub('Input image',grid(6,p,'image'),'The same example image')+sub('Filter responses','<div style="padding:10px 0">'+bars+'</div>','Larger peak means a stronger match')+'</div>'+
  '<div class="class-result"><b>Stronger pattern: '+winner.toLowerCase()+' line</b><small>This is a demonstration of two hand-built filters, NOT a trained CNN classification or probability.</small></div>'+
  note('<strong>In real life:</strong> A CNN learns many filters, stacks their outputs, and uses a prediction head to recognize complex objects.');
 }
 $('stepArea').innerHTML=scene(captions[step][0],captions[step][1],view);
}
function stop(){if(timer!==null){clearInterval(timer);timer=null}playing=false}
function setStep(n){stop();step=(n+6)%6;render()}
function advance(){scan=(scan+1)%16;render()}
$('prev').addEventListener('click',()=>setStep(Math.max(0,step-1)));
$('next').addEventListener('click',()=>setStep(step===5?0:step+1));
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>setStep(Number(b.dataset.step))));
document.querySelectorAll('[data-picture]').forEach(b=>b.addEventListener('click',()=>{stop();picture=b.dataset.picture;scan=1;block=0;render()}));
$('stepArea').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 const act=b.dataset.scan;
 if(act){if(act==='prev'){stop();scan=(scan+15)%16;render()}else if(act==='next'){stop();advance()}else if(act==='auto'){if(playing){stop();render()}else{playing=true;timer=setInterval(advance,550);render()}}}
 const p=b.dataset.pool;
 if(p){block=(block+(p==='next'?1:3))%4;render()}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(step===2)render()}});
render();
