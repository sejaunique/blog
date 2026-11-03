(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top=document.getElementById('top'),lastY=scrollY;
  function hdr(){var y=scrollY;top.classList.toggle('scrolled',y>8);top.classList.toggle('hide',y>lastY&&y>400&&sheet.hidden);lastY=y}
  var sheet=document.getElementById('sheet'),btn=document.getElementById('menu-btn');
  if(btn){btn.addEventListener('click',function(){sheet.hidden=false;btn.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';sheet.querySelector('button').focus()});
    function close(){sheet.hidden=true;btn.setAttribute('aria-expanded','false');document.body.style.overflow=''}
    sheet.querySelector('button').addEventListener('click',close);
    sheet.querySelectorAll('nav a').forEach(function(a){a.addEventListener('click',close)});
    addEventListener('keydown',function(e){if(e.key==='Escape'&&!sheet.hidden)close()});}
  addEventListener('scroll',function(){requestAnimationFrame(hdr)},{passive:true});hdr();
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px'});
    document.querySelectorAll('[data-rv]').forEach(function(el,i){if(el.getBoundingClientRect().top<innerHeight)return;el.classList.add('rv','pre');el.style.transitionDelay=((i%3)*90)+'ms';io.observe(el)});
  }
  document.querySelectorAll('[data-copy]').forEach(function(b){b.addEventListener('click',function(){
    var el=document.getElementById(b.dataset.copy);
    function ok(){b.textContent='Copiado';setTimeout(function(){b.textContent='Copiar'},1600)}
    function sel(){var r=document.createRange();r.selectNodeContents(el);var x=getSelection();x.removeAllRanges();x.addRange(r)}
    try{navigator.clipboard.writeText(el.textContent.trim()).then(ok,sel)}catch(e){sel()}
  })});
})();
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* progresso de leitura */
  var bar=document.createElement('div');bar.className='progress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);
  function prog(){var h=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?scrollY/h:0)+')'}
  addEventListener('scroll',function(){requestAnimationFrame(prog)},{passive:true});addEventListener('resize',prog);prog();
  /* voltar ao topo */
  document.querySelectorAll('[data-top]').forEach(function(b){b.addEventListener('click',function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})})});
  /* links magnéticos */
  if(matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce){
    document.querySelectorAll('.link,.cta,.back').forEach(function(l){
      l.addEventListener('mousemove',function(e){var r=l.getBoundingClientRect();l.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18)+'px,'+((e.clientY-r.top-r.height/2)*.3)+'px)'});
      l.addEventListener('mouseleave',function(){l.style.transform=''});
      l.style.transition=(l.style.transition?l.style.transition+',':'')+'transform .5s cubic-bezier(.2,.7,.1,1)';
    });
  }
})();
