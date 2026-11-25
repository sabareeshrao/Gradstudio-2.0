
"use strict";
const $=id=>document.getElementById(id);
let requests=0,hits=0,cached=false,route="idle";
function renderCache(){
 $("requests").textContent=requests;$("hits").textContent=hits;$("queries").textContent=requests-hits;
 $("cacheValue").textContent=cached?"Laptop · $999":"Key not found";$("cacheValue").setAttribute("fill",cached?"#15803d":"#64748b");
 $("cacheBox").setAttribute("stroke",route==="hit"?"#dc2626":"#fca5a5");$("cacheBox").setAttribute("stroke-width",route==="hit"?"2":"1");
 $("requestPath").setAttribute("stroke",route==="idle"?"#94a3b8":"#2563eb");$("requestPath").setAttribute("stroke-width",route==="idle"?"1.5":"2.5");
 $("dbBox").setAttribute("stroke",route==="miss"?"#2563eb":"#93c5fd");
 document.querySelectorAll(".hit,.label-hit").forEach(n=>n.classList.toggle("active",route==="hit"));
 document.querySelectorAll(".miss,.label-miss").forEach(n=>n.classList.toggle("active",route==="miss"));
 const note=$("cacheNote");note.className=route==="hit"?"green":route==="miss"?"blue":"caption";note.textContent=route==="hit"?"Cache hit: Return the product directly from Redis.":route==="miss"?"Cache miss: Read from PostgreSQL and store the result in Redis.":"Send a request to begin. Send it again to observe a cache hit.";
}
$("sendRequest").addEventListener("click",()=>{requests++;route=cached?"hit":"miss";if(cached)hits++;cached=true;renderCache()});
$("clearCache").addEventListener("click",()=>{cached=false;route="idle";renderCache()});
$("resetCache").addEventListener("click",()=>{requests=0;hits=0;cached=false;route="idle";renderCache()});
const initial=()=>new Map([["user:101","Alex"],["product:101","Laptop"],["views","0"]]);let store=initial(),cmd="SET";
function renderStore(){
 const body=$("entries");body.replaceChildren();for(const [k,v] of store){const tr=document.createElement("tr");for(const [i,t] of [k,v].entries()){const td=document.createElement("td"),c=document.createElement("code");c.textContent=t;if(i===0)c.className="red";td.append(c);tr.append(td)}body.append(tr)}
 $("keyCount").textContent=store.size+" keys";
}
function preview(){const k=$("key").value,v=$("value").value;$("command").textContent="> "+cmd+" "+JSON.stringify(k)+(cmd==="SET"?" "+JSON.stringify(v):"");$("execute").disabled=!k.trim();$("valueGroup").hidden=cmd!=="SET"}
document.querySelectorAll("[data-cmd]").forEach(b=>b.addEventListener("click",()=>{cmd=b.dataset.cmd;document.querySelectorAll("[data-cmd]").forEach(n=>n.setAttribute("aria-pressed",String(n===b)));preview()}));
$("key").addEventListener("input",preview);$("value").addEventListener("input",preview);
$("execute").addEventListener("click",()=>{const k=$("key").value,v=$("value").value;if(!k.trim())return;let out="";if(cmd==="SET"){store.delete(k);store.set(k,v);out="OK"}else if(cmd==="GET"){out=store.has(k)?JSON.stringify(store.get(k)):"(nil)"}else if(cmd==="DEL"){out="(integer) "+(store.delete(k)?1:0)}else{const old=store.has(k)?store.get(k):"0",n=Number(old);if(!/^-?\d+$/.test(old)||!Number.isSafeInteger(n+1)){out="ERR value is not a supported integer"}else{store.delete(k);store.set(k,String(n+1));out="(integer) "+(n+1)}}$("result").textContent=out;renderStore()});
$("resetStore").addEventListener("click",()=>{store=initial();$("result").textContent="Ready";renderStore()});
let ttl=30,elapsed=0;
function renderTtl(){const remain=Math.max(0,ttl-elapsed),expired=remain===0;$("ttlCommand").textContent='SET session:101 "active" EX '+ttl;$("ttlLabel").textContent=ttl+" seconds";$("remaining").textContent=remain+"s";$("ttlRing").setAttribute("stroke-dasharray",370.71*remain/ttl+" 370.71");$("ttlRing").setAttribute("stroke",expired?"#cbd5e1":"#dc2626");$("ttlRing").setAttribute("stroke-opacity",expired?"0":"1");$("sessionValue").textContent=expired?"Key expired":"Value: active";$("sessionStatus").textContent=expired?"Expired":"Active";$("sessionStatus").classList.toggle("active",!expired);$("advance").disabled=expired}
$("ttl").addEventListener("input",()=>{ttl=Number($("ttl").value);elapsed=0;renderTtl()});$("resetTtl").addEventListener("click",()=>{elapsed=0;renderTtl()});$("advance").addEventListener("click",()=>{elapsed=Math.min(ttl,elapsed+5);renderTtl()});
renderCache();renderStore();preview();renderTtl();
