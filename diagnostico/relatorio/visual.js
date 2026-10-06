/* Camada visual do relatório Unique: ilustrações de colagem com retícula (desenhadas em SVG, originais)
   e animações de rolagem, mouse e clique. Tudo é aprimoramento: sem este arquivo o relatório funciona igual. */
(function(){
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COR = { y:'#f5b335', o:'#f08a3c', b:'#3d7cc9', g:'#36a467', r:'#e0565b', ink:'#1d1d1f', paper:'#fbfaf7', cinza:'#9a9aa0' };

  /* ---------- peças de desenho ---------- */
  // esfera em retícula: pontos maiores no lado escuro (luz vindo de cima à esquerda)
  function esfera(cx,cy,r,passo){
    passo=passo||7; var s='';
    for(var y=cy-r;y<=cy+r;y+=passo){ for(var x=cx-r+((y/passo)%2?passo/2:0);x<=cx+r;x+=passo){
      var dx=(x-cx)/r, dy=(y-cy)/r, d2=dx*dx+dy*dy; if(d2>1) continue;
      var nz=Math.sqrt(1-d2), luz=Math.max(0,(-dx*.55-dy*.6+nz*.58)), rr=passo*.48*(1-luz*.92);
      if(rr>.35) s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rr.toFixed(2)+'"/>';
    } }
    return '<g fill="currentColor">'+s+'</g>';
  }
  // retalho de pontos que somem numa direção (como nos cantos da referência)
  function pontos(x,y,w,h,passo,dir){
    passo=passo||9; var s='';
    for(var j=0;j<=h;j+=passo){ for(var i=0;i<=w;i+=passo){
      var t=dir==='x'?i/w:dir==='-x'?1-i/w:dir==='y'?j/h:1-j/h, rr=passo*.32*(1-t);
      if(rr>.3) s+='<circle cx="'+(x+i)+'" cy="'+(y+j)+'" r="'+rr.toFixed(2)+'"/>';
    } }
    return '<g fill="currentColor" opacity=".9">'+s+'</g>';
  }
  function estrela(cx,cy,ro,ri,n,fill,extra){
    var p=[]; for(var i=0;i<n*2;i++){ var a=Math.PI*i/n-Math.PI/2, r=i%2?ri*(0.8+((i*37)%7)/20):ro*(0.85+((i*53)%9)/40); p.push((cx+Math.cos(a)*r).toFixed(1)+','+(cy+Math.sin(a)*r).toFixed(1)); }
    return '<polygon points="'+p.join(' ')+'" fill="'+fill+'" '+(extra||'')+'/>';
  }
  function engrenagem(cx,cy,r,dentes,fill){
    var p='', n=dentes*2;
    for(var i=0;i<n;i++){ var a0=i*Math.PI*2/n, a1=(i+1)*Math.PI*2/n, rr=i%2?r*.8:r;
      p+=(i?'L':'M')+(cx+Math.cos(a0)*rr).toFixed(1)+' '+(cy+Math.sin(a0)*rr).toFixed(1)+'L'+(cx+Math.cos(a1)*rr).toFixed(1)+' '+(cy+Math.sin(a1)*rr).toFixed(1); }
    return '<g class="gira"><path d="'+p+'Z" fill="'+fill+'"/><circle cx="'+cx+'" cy="'+cy+'" r="'+(r*.42)+'" fill="'+COR.paper+'"/><circle cx="'+cx+'" cy="'+cy+'" r="'+(r*.42)+'" fill="none" stroke="'+COR.ink+'" stroke-width="1.5" opacity=".25"/></g>';
  }
  function lampada(x,y,s,cor){
    return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
      '<circle cx="0" cy="0" r="34" fill="'+(cor||COR.y)+'"/><path d="M-16 24 Q0 40 16 24 L14 44 L-14 44 Z" fill="'+(cor||COR.y)+'"/>'+
      '<rect x="-15" y="42" width="30" height="20" rx="4" fill="#2c3440"/><path d="M-15 48h30M-15 54h30" stroke="#55606e" stroke-width="2"/>'+
      '<path d="M-8 30 L-6 4 Q-12 -6 -4 -8 Q2 -6 0 2 Q-2 -6 4 -8 Q12 -6 6 4 L8 30" fill="none" stroke="#7a4a10" stroke-width="2" stroke-linecap="round"/>'+
      '<path d="M-20 -14 Q-16 -24 -6 -26" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/></g>';
  }
  function seta(pts,cor,larg){
    var u=pts[pts.length-1], a=pts[pts.length-2], ang=Math.atan2(u[1]-a[1],u[0]-a[0]), L=18;
    var p1=[u[0]-Math.cos(ang-.5)*L,u[1]-Math.sin(ang-.5)*L], p2=[u[0]-Math.cos(ang+.5)*L,u[1]-Math.sin(ang+.5)*L];
    return '<g class="traca"><polyline points="'+pts.map(function(p){return p.join(',');}).join(' ')+'" fill="none" stroke="'+cor+'" stroke-width="'+(larg||7)+'" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/>'+
      '<polygon points="'+u.join(',')+' '+p1.join(',')+' '+p2.join(',')+'" fill="'+cor+'"/></g>';
  }
  function nota(x,y,w,h,cor,rot){
    return '<g transform="rotate('+(rot||0)+' '+(x+w/2)+' '+(y+h/2)+')"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="2" fill="'+cor+'"/>'+
      '<rect x="'+(x+w/2-5)+'" y="'+(y-4)+'" width="10" height="8" fill="#c9b38a" opacity=".8"/>'+
      '<path d="M'+(x+6)+' '+(y+h*.42)+'h'+(w-12)+'M'+(x+6)+' '+(y+h*.62)+'h'+(w-16)+'M'+(x+6)+' '+(y+h*.82)+'h'+(w-20)+'" stroke="'+COR.ink+'" stroke-width="1.6" opacity=".55"/></g>';
  }
  function lay(d,inner,cls){ return '<g class="lay '+(cls||'')+'" data-d="'+d+'">'+inner+'</g>'; }
  function svg(inner,label){ return '<svg class="ilustra" viewBox="0 0 360 240" role="img" aria-label="'+label+'">'+inner+'</svg>'; }

  /* ---------- ilustrações por seção ---------- */
  var ILUSTRA = {
    ideia: function(){ return svg(
      lay(.3,'<g style="color:'+COR.ink+'">'+pontos(250,10,100,70,9,'-x')+'</g>')+
      lay(.5,estrela(250,120,105,70,14,'#ffffff','class="pulsa" opacity=".95"'))+
      lay(.8,esfera(92,150,62,7))+
      lay(1.2,seta([[150,200],[190,150],[215,170],[262,95],[300,62]],COR.y,8))+
      lay(1.6,lampada(250,112,1.05)),'Lâmpada acesa com seta de crescimento'); },
    placar: function(){ return svg(
      lay(.3,'<g style="color:'+COR.ink+'">'+pontos(14,150,90,80,9,'y')+'</g>')+
      lay(.6,esfera(285,165,58,7))+
      lay(1,'<g class="sobe"><rect x="70" y="140" width="34" height="70" rx="4" fill="'+COR.r+'"/><rect x="116" y="110" width="34" height="100" rx="4" fill="'+COR.y+'"/><rect x="162" y="80" width="34" height="130" rx="4" fill="'+COR.b+'"/><rect x="208" y="50" width="34" height="160" rx="4" fill="'+COR.g+'"/></g><path d="M55 210h205" stroke="'+COR.ink+'" stroke-width="3" stroke-linecap="round"/>')+
      lay(1.5,seta([[60,120],[110,92],[150,104],[230,30],[262,20]],COR.o,6)),'Gráfico de barras subindo'); },
    retrato: function(){ return svg(
      lay(.3,'<g style="color:'+COR.ink+'">'+pontos(260,8,92,60,9,'-y')+'</g>')+
      lay(.5,estrela(178,118,112,84,16,'#ffffff','opacity=".9" class="pulsa"'))+
      lay(.8,'<circle cx="178" cy="112" r="78" fill="none" stroke="'+COR.y+'" stroke-width="10"/><path d="M150 186 h56 l-4 26 h-48 z" fill="#2c3440"/>')+
      lay(1.2,nota(130,60,42,40,COR.b,-6)+nota(176,52,44,42,COR.y,4)+nota(150,104,44,40,COR.r,-3)+nota(196,100,40,40,COR.g,7))+
      lay(1.7,'<g class="lupa"><circle cx="92" cy="150" r="30" fill="#cfe3f7" fill-opacity=".55" stroke="'+COR.o+'" stroke-width="8"/><path d="M70 172 L36 210" stroke="'+COR.o+'" stroke-width="12" stroke-linecap="round"/></g>'),'Lupa sobre ideias em notas coloridas'); },
    pilar: function(){ return svg(
      lay(.3,'<g style="color:'+COR.ink+'">'+pontos(10,10,110,80,10,'x')+'</g>')+
      lay(.6,esfera(260,150,66,7))+
      lay(1,engrenagem(120,140,52,10,COR.cinza))+
      lay(1.3,'<g class="gira-r">'+engrenagem(196,90,34,8,COR.b).replace('class="gira"','')+'</g>')+
      lay(1.7,lampada(262,72,.72,COR.y)),'Engrenagens em movimento e uma ideia'); },
    gargalos: function(){ return svg(
      lay(.3,'<g style="color:'+COR.ink+'">'+pontos(250,150,100,80,9,'-y')+'</g>')+
      lay(.6,esfera(90,92,58,7))+
      lay(1,'<path d="M150 40 h150 l-55 80 v60 l-40 20 v-80 z" fill="'+COR.b+'"/><path d="M150 40 h150" stroke="'+COR.ink+'" stroke-width="3"/>')+
      lay(1.4,'<g class="pinga"><circle cx="225" cy="214" r="7" fill="'+COR.y+'"/><circle cx="214" cy="232" r="5" fill="'+COR.r+'"/></g>'+
        '<g class="cai"><rect x="168" y="12" width="16" height="16" rx="2" fill="'+COR.y+'" transform="rotate(12 176 20)"/><rect x="236" y="4" width="14" height="14" rx="2" fill="'+COR.g+'" transform="rotate(-10 243 11)"/><rect x="270" y="18" width="15" height="15" rx="2" fill="'+COR.r+'"/></g>')+
      lay(1.8,'<g class="balanca"><path d="M40 210 L74 150 L108 210 Z" fill="'+COR.r+'"/><path d="M74 172 v18 M74 198 v4" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>'),'Funil apertado com alerta'); },
    olhar: function(){ return svg(
      lay(.3,'<g style="color:'+COR.ink+'">'+pontos(10,150,100,80,9,'y')+'</g>')+
      lay(.5,estrela(190,120,100,76,14,'#ffffff','opacity=".9"'))+
      lay(.9,'<path d="M80 120 Q190 30 300 120 Q190 210 80 120 Z" fill="#ffffff" stroke="'+COR.ink+'" stroke-width="4"/>'+
        '<clipPath id="iris"><circle cx="190" cy="120" r="44"/></clipPath><g clip-path="url(#iris)">'+esfera(190,120,44,6)+'</g><circle cx="190" cy="120" r="44" fill="none" stroke="'+COR.ink+'" stroke-width="3"/><circle cx="176" cy="104" r="9" fill="#fff"/>')+
      lay(1.5,'<g><path d="M262 22 h82 a10 10 0 0 1 10 10 v36 a10 10 0 0 1 -10 10 h-50 l-18 16 v-16 h-14 a10 10 0 0 1 -10 -10 v-36 a10 10 0 0 1 10 -10z" fill="'+COR.y+'"/><path d="M272 44h60M272 58h40" stroke="'+COR.ink+'" stroke-width="3" opacity=".6" stroke-linecap="round"/></g>'),'Olho atento e balão de fala'); },
    plano: function(){ return svg(
      lay(.3,'<g style="color:'+COR.ink+'">'+pontos(260,10,92,70,9,'-x')+'</g>')+
      lay(.6,esfera(290,170,54,7))+
      lay(1,'<rect x="96" y="26" width="140" height="190" rx="12" fill="#ffffff" stroke="'+COR.ink+'" stroke-width="3"/><rect x="136" y="16" width="60" height="22" rx="6" fill="#2c3440"/>'+
        [0,1,2,3].map(function(i){ var y=66+i*36; return '<rect x="114" y="'+y+'" width="20" height="20" rx="4" fill="none" stroke="'+COR.ink+'" stroke-width="2.5"/>'+(i<3?'<path class="tique" d="M118 '+(y+10)+' l5 5 l9 -11" fill="none" stroke="'+COR.g+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="--i:'+i+'"/>':'')+'<path d="M144 '+(y+10)+' h'+(70-i*8)+'" stroke="'+COR.ink+'" stroke-width="3" opacity=".35" stroke-linecap="round"/>'; }).join(''))+
      lay(1.5,'<g class="lapis" transform="rotate(38 60 120)"><rect x="40" y="40" width="22" height="130" rx="3" fill="'+COR.y+'"/><path d="M40 170 h22 l-11 24 z" fill="#f0d9b0"/><path d="M48 186 h6 l-3 8z" fill="'+COR.ink+'"/><rect x="40" y="32" width="22" height="12" rx="3" fill="'+COR.r+'"/></g>')+
      lay(1.9,'<g class="bandeira"><path d="M262 30 v80" stroke="'+COR.ink+'" stroke-width="4" stroke-linecap="round"/><path d="M264 32 h46 l-10 16 l10 16 h-46 z" fill="'+COR.r+'"/></g>'),'Prancheta com checklist e lápis'); },
    proximo: function(){ return svg(
      lay(.3,'<g style="color:#f5f5f5">'+pontos(10,10,110,80,10,'x')+'</g>')+
      lay(.6,estrela(220,120,108,78,16,COR.y,'class="pulsa"'))+
      lay(1,'<g class="foguete"><path d="M220 46 q34 30 24 96 h-48 q-10 -66 24 -96z" fill="#ffffff"/><circle cx="220" cy="96" r="13" fill="'+COR.b+'" stroke="'+COR.ink+'" stroke-width="3"/><path d="M196 120 l-22 30 h24z M244 120 l22 30 h-24z" fill="'+COR.r+'"/><path class="fogo" d="M204 144 q16 40 32 0z" fill="'+COR.o+'"/></g>')+
      lay(1.4,seta([[40,210],[90,170],[120,186],[170,120]],COR.g,7)),'Foguete decolando'); }
  };

  /* ---------- montagem ---------- */
  var TEMAS = { resumo:['ideia','papel'], pilares:['placar','amarelo'], retrato:['retrato','azul'], 'pilar-detalhe':['pilar','verde'], travando:['gargalos','rosa'], olhar:['olhar','lilas'], plano:['plano','laranja'] };

  function montar(){
    var main=document.getElementById('app'); if(!main) return;
    document.documentElement.classList.add('vis');
    // cada seção vira uma faixa de cor própria
    [].slice.call(main.children).forEach(function(el){
      if(el.classList.contains('banda')) return;
      var id=el.id||'', tema=(TEMAS[id]||[null, el.classList.contains('kpis')?'papel':el.classList.contains('cta')?'escuro':el.classList.contains('assina')?'escuro':'papel'])[1];
      var banda=document.createElement('div'); banda.className='banda t-'+tema+(id?' b-'+id:'');
      var wrap=document.createElement('div'); wrap.className='wrap';
      main.insertBefore(banda,el); wrap.appendChild(el); banda.appendChild(wrap);
    });
    // junta indicadores na faixa do resumo e a assinatura na faixa escura
    var bResumo=main.querySelector('.b-resumo'), kp=main.querySelector('.kpis');
    if(bResumo&&kp){ var old=kp.closest('.banda'); bResumo.querySelector('.wrap').appendChild(kp); old.remove(); }
    var cta=main.querySelector('.cta'), ass=main.querySelector('.assina'), alda=main.querySelector('.alda');
    if(cta&&alda){ var o3=cta.closest('.banda'); alda.closest('.banda').querySelector('.wrap').appendChild(cta); o3.remove(); alda.closest('.banda').className='banda t-escuro'; }
    if(cta&&ass){ var o2=ass.closest('.banda'); cta.closest('.wrap').appendChild(ass); o2.remove(); }
    // ilustração em cada cabeçalho de seção
    Object.keys(TEMAS).forEach(function(id){
      var sec=document.getElementById(id); if(!sec) return;
      var art=document.createElement('div'); art.className='arte'; art.setAttribute('aria-hidden','true'); art.innerHTML=ILUSTRA[TEMAS[id][0]]();
      var head=sec.querySelector('.sec-head');
      if(head){ head.classList.add('com-arte'); var txt=document.createElement('div'); txt.className='sec-txt'; while(head.firstChild) txt.appendChild(head.firstChild); head.appendChild(txt); head.appendChild(art); }
      else if(id==='resumo'){ var h=sec.querySelector('.hero-txt'); if(h){ art.classList.add('arte-hero'); h.insertBefore(art,h.firstChild); } }
    });
    // fitas de pontos nos cantos das faixas
    main.querySelectorAll('.banda:not(.t-papel):not(.t-escuro)').forEach(function(b,i){ var d=document.createElement('div'); d.className='canto '+(i%2?'dir':'esq'); d.setAttribute('aria-hidden','true'); b.insertBefore(d,b.firstChild); });

    revelar(); contadores(); barras(); parallax(); cliques(); progressoTopo(); inclinar();
  }

  /* rolagem: cartões entram em sequência; ilustrações se desenham ao aparecer */
  function revelar(){
    var alvos=document.querySelectorAll('.card, .sec-head, .cta, .barras .barra, .acao, .tabs, .plano-top');
    if(RM || !('IntersectionObserver' in window)){ alvos.forEach(function(a){a.classList.add('visto');}); document.querySelectorAll('.arte').forEach(function(a){a.classList.add('viva');}); return; }
    alvos.forEach(function(a){ a.classList.add('entra'); });
    var io=new IntersectionObserver(function(en){ en.forEach(function(x){ if(!x.isIntersecting) return;
      var irmaos=[].slice.call(x.target.parentNode.children).filter(function(c){return c.classList.contains('entra');}), k=Math.max(0,irmaos.indexOf(x.target));
      x.target.style.transitionDelay=Math.min(k,6)*70+'ms'; x.target.classList.add('visto'); io.unobserve(x.target);
      x.target.querySelectorAll('.arte').forEach(function(a){ a.classList.add('viva'); });
    }); },{rootMargin:'0px 0px -8% 0px'});
    alvos.forEach(function(a){ io.observe(a); });
    var io2=new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('viva'); io2.unobserve(x.target);} }); },{threshold:.25});
    document.querySelectorAll('.arte').forEach(function(a){ io2.observe(a); });
    // segurança: nada fica escondido se o observador falhar
    setTimeout(function(){ document.querySelectorAll('.entra:not(.visto)').forEach(function(a){ var r=a.getBoundingClientRect(); if(r.top<innerHeight) a.classList.add('visto'); }); },1800);
  }

  /* números contam do zero quando aparecem */
  function contadores(){
    var nums=document.querySelectorAll('.kpi .v .num, .p-nota .num, .barra .val .num, .ring .v b');
    function conta(el){ var fim=parseInt(el.textContent,10); if(isNaN(fim)||RM) return; var t0=null;
      (function f(ts){ if(!t0) t0=ts; var k=Math.min(1,(ts-t0)/900); el.textContent=Math.round(fim*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(f); else el.textContent=fim; })(performance.now());
      setTimeout(function(){ el.textContent=fim; },1200); }
    if(!('IntersectionObserver' in window)) return;
    var io=new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting){ conta(x.target); io.unobserve(x.target);} }); },{threshold:.6});
    nums.forEach(function(n){ io.observe(n); });
    // o painel por pilar é redesenhado ao trocar de aba: conta de novo
    var painel=document.getElementById('painel');
    if(painel) new MutationObserver(function(){ painel.querySelectorAll('.p-nota .num').forEach(conta); }).observe(painel,{childList:true});
  }

  /* barras crescem quando entram na tela */
  function barras(){
    var bs=document.querySelectorAll('.trilho i[data-w]');
    bs.forEach(function(i){ i.style.width='0'; });
    if(!('IntersectionObserver' in window)){ bs.forEach(function(i){ i.style.width=i.dataset.w+'%'; }); return; }
    var io=new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting){ var i=x.target; setTimeout(function(){ i.style.width=i.dataset.w+'%'; },120); io.unobserve(i);} }); },{threshold:.4});
    bs.forEach(function(i){ io.observe(i); });
    setTimeout(function(){ bs.forEach(function(i){ var r=i.getBoundingClientRect(); if(r.top<innerHeight && !i.style.width.replace('0','')) i.style.width=i.dataset.w+'%'; }); },2000);
  }

  /* mouse e rolagem movem as camadas das ilustrações em profundidades diferentes */
  function parallax(){
    if(RM) return;
    var artes=[].slice.call(document.querySelectorAll('.arte')), mx=0, my=0, pend=false;
    function aplicar(){
      pend=false;
      artes.forEach(function(a){ var r=a.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return;
        var sc=((r.top+r.height/2)-innerHeight/2)/innerHeight;
        a.querySelectorAll('.lay').forEach(function(l){ var d=+l.dataset.d; l.style.transform='translate('+(mx*d*10).toFixed(1)+'px,'+(my*d*8+sc*d*-26).toFixed(1)+'px)'; });
      });
    }
    function pedir(){ if(!pend){ pend=true; requestAnimationFrame(aplicar); } }
    addEventListener('scroll',pedir,{passive:true});
    if(matchMedia('(pointer:fine)').matches) addEventListener('mousemove',function(e){ mx=e.clientX/innerWidth-.5; my=e.clientY/innerHeight-.5; pedir(); },{passive:true});
    aplicar();
  }

  /* cartões inclinam levemente seguindo o mouse */
  function inclinar(){
    if(RM || !matchMedia('(pointer:fine)').matches) return;
    document.querySelectorAll('.kpi, .lt, .acao, .fala, .radar-card').forEach(function(c){
      c.classList.add('inclina');
      c.addEventListener('mousemove',function(e){ var r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
        c.style.setProperty('--rx',(-y*5).toFixed(2)+'deg'); c.style.setProperty('--ry',(x*6).toFixed(2)+'deg'); });
      c.addEventListener('mouseleave',function(){ c.style.setProperty('--rx','0deg'); c.style.setProperty('--ry','0deg'); });
    });
  }

  /* clique: onda nos botões e chuva de papeizinhos ao concluir uma ação */
  function cliques(){
    document.addEventListener('pointerdown',function(e){
      var b=e.target.closest('.tab, .filtro, .barra, .btn, .item button:not([disabled])'); if(!b||RM) return;
      var r=b.getBoundingClientRect(), o=document.createElement('span'); o.className='onda';
      var s=Math.max(r.width,r.height)*1.4; o.style.width=o.style.height=s+'px'; o.style.left=(e.clientX-r.left-s/2)+'px'; o.style.top=(e.clientY-r.top-s/2)+'px';
      if(getComputedStyle(b).position==='static') b.style.position='relative'; b.style.overflow='hidden';
      b.appendChild(o); setTimeout(function(){ o.remove(); },650);
    });
    document.addEventListener('change',function(e){
      var c=e.target; if(!c.matches('.feito input') || !c.checked || RM) return;
      var r=c.getBoundingClientRect(); confete(r.left+r.width/2, r.top+r.height/2);
      var todos=document.querySelectorAll('.feito input'), n=[].filter.call(todos,function(x){return x.checked;}).length;
      if(n===todos.length) setTimeout(function(){ confete(innerWidth/2, innerHeight/3, 80); },250);
    });
  }
  function confete(x,y,qtd){
    var cores=[COR.y,COR.b,COR.g,COR.r,COR.o], cx=document.createElement('canvas'), dpr=Math.min(2,devicePixelRatio||1);
    cx.className='confete'; cx.width=innerWidth*dpr; cx.height=innerHeight*dpr; document.body.appendChild(cx);
    var g=cx.getContext('2d'); g.scale(dpr,dpr);
    var ps=Array.from({length:qtd||36},function(){ var a=-Math.PI/2+(Math.random()-.5)*2.2, v=4+Math.random()*7; return {x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,w:6+Math.random()*7,h:4+Math.random()*6,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cores[Math.floor(Math.random()*5)]}; });
    var t=0;
    (function f(){ g.clearRect(0,0,innerWidth,innerHeight); t++;
      ps.forEach(function(p){ p.vy+=.28; p.vx*=.985; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; g.save(); g.translate(p.x,p.y); g.rotate(p.r); g.globalAlpha=Math.max(0,1-t/90); g.fillStyle=p.c; g.fillRect(-p.w/2,-p.h/2,p.w,p.h); g.restore(); });
      if(t<90) requestAnimationFrame(f); else cx.remove(); })();
  }

  /* barra fina de leitura no topo */
  function progressoTopo(){
    var b=document.createElement('div'); b.className='leitura-bar'; b.setAttribute('aria-hidden','true'); document.querySelector('.top').appendChild(b);
    function f(){ var h=document.documentElement, k=h.scrollTop/(h.scrollHeight-h.clientHeight||1); b.style.transform='scaleX('+Math.min(1,Math.max(0,k))+')'; }
    addEventListener('scroll',f,{passive:true}); f();
  }

  window.UniqueVisual={ montar:montar, ILUSTRA:ILUSTRA };
})();
