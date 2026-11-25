
(()=>{"use strict";
const get=id=>document.getElementById(id),click=id=>{const b=get(id);if(b&&!b.disabled&&!b.hidden)b.click()},range=(id,d)=>{const el=get(id);if(!el)return;d<0?el.stepDown():el.stepUp();el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))},select=(id,d)=>{const el=get(id);el.selectedIndex=Math.max(0,Math.min(el.options.length-1,el.selectedIndex+d));el.dispatchEvent(new Event('change',{bubbles:true}))};
const groups=[{ids:['angle'],run:d=>range('angle',d)},{ids:['topk'],run:d=>range('topk',d)}];let active=0;
const elements=g=>g.ids.map(get).filter(Boolean);
const container=g=>{const es=elements(g);if(!es.length)return null;let p=es[0].closest('section,article,.card,.panel,.simulator');while(p&&!es.every(e=>p.contains(e)))p=p.parentElement;return p};
function choose(t){if(!(t instanceof Element))return;let exact=groups.findIndex(g=>elements(g).some(e=>e===t||e.contains(t)));if(exact>=0){active=exact;return}let best=null;groups.forEach((g,i)=>{const p=container(g);if(p&&p.contains(t)&&(!best||best.p.contains(p)&&best.p!==p))best={p,i}});if(best)active=best.i}
document.addEventListener('pointerdown',e=>choose(e.target));document.addEventListener('focusin',e=>choose(e.target));
document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight'].includes(e.key))return;const t=e.target;if(t instanceof Element&&(t.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="textbox"]')||t.isContentEditable))return;let g=groups[active];if(!elements(g).length)g=groups[0];if(!elements(g).length)return;e.preventDefault();g.run(e.key==='ArrowLeft'?-1:1)});
const first=elements(groups[0])[0];if(first){const hint=document.createElement('small');hint.textContent=first.matches('input,select')?'Keyboard: select a slider, then use ← / →':'Keyboard: ← back · → forward';hint.style.cssText='display:block;font:11px/1.4 system-ui;opacity:.7;margin:4px 0 0';first.parentElement.insertAdjacentElement('afterend',hint);}
})();
