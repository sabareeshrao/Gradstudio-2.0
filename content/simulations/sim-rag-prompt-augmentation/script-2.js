
(()=>{const b=document.getElementById('copy-prompt-json'),p=document.getElementById('payload'),status=document.getElementById('status');function sync(){b.disabled=p.textContent==='No prompt generated';}new MutationObserver(sync).observe(p,{childList:true,characterData:true,subtree:true});sync();b.onclick=()=>copyText(p.textContent,b);})();
