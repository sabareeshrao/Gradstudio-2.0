
/* Paint the current slider value without changing any lesson calculation. */
document.querySelectorAll('.range-field input[type="range"]').forEach(function(el){
  function paint(){var min=Number(el.min||0),max=Number(el.max||100);el.style.setProperty('--range-fill',Math.max(0,Math.min(100,(Number(el.value)-min)/Math.max(1,max-min)*100))+'%');}
  el.addEventListener('input',paint);el.addEventListener('change',paint);paint();
});
