"use strict";
const boxes=[...document.querySelectorAll(".checklist input")];
const progress=document.querySelector("progress");
const status=document.querySelector(".progress-label");
function update(){const count=boxes.filter(b=>b.checked).length;progress.value=count;status.textContent=count+"/"+boxes.length;}
boxes.forEach(b=>b.addEventListener("change",update));
update();
