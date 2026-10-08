/* Casco Unique: injeta o cabeçalho (com o botão claro/escuro) e o rodapé do site em qualquer página.
   Na página: <script src="/assets/tema.js"></script> no <head>, <link rel="stylesheet" href="/assets/casco.css">
   e <script src="/assets/casco.js"></script> logo depois de <body>.
   <body data-casco="area|blog|cases|inicio"> marca o item ativo do menu. */
(function(){
  var LOGO='<svg viewBox="0 0 2696 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unique"><path fill="currentColor" fill-rule="evenodd" d="M2304 50L2300 56L2301 60L2309 66L2329 73L2338 83L2343 97L2343 395L2338 411L2326 422L2304 430L2301 440L2309 445L2629 444L2635 436L2647 391L2645 380L2637 383L2598 423L2585 430L2564 433L2525 434L2484 430L2458 417L2441 396L2434 363L2435 244L2440 241L2532 241L2554 246L2575 265L2596 301L2603 301L2605 173L2596 171L2568 215L2561 222L2545 229L2438 230L2434 226L2433 69L2441 60L2571 60L2591 63L2605 71L2624 91L2641 116L2647 119L2652 116L2641 52L2636 49ZM1801 52L1801 61L1820 72L1831 90L1833 334L1848 371L1871 399L1899 421L1932 437L1963 446L2007 450L2075 447L2118 438L2155 422L2183 399L2198 379L2206 361L2212 325L2215 85L2225 72L2245 60L2245 53L2242 50L2163 49L2158 53L2159 62L2181 76L2187 92L2189 307L2182 339L2160 366L2128 383L2093 390L2055 392L2004 391L1973 383L1949 368L1936 354L1927 338L1922 314L1922 53L1917 49L1805 49ZM1027 49L1024 53L1025 62L1048 77L1054 92L1055 381L1054 401L1049 414L1042 422L1025 431L1024 440L1029 445L1170 445L1175 440L1175 433L1151 415L1145 394L1145 99L1152 76L1175 61L1175 52L1172 49ZM548 50L545 55L548 63L578 74L592 86L591 405L578 423L562 432L562 441L565 444L642 445L648 440L647 431L624 415L619 400L615 123L620 118L904 435L917 445L927 443L930 438L936 92L944 75L967 61L967 52L964 49L884 49L880 54L883 64L903 75L909 85L911 98L912 288L906 292L682 50ZM51 52L50 60L73 77L79 90L81 333L89 358L98 374L119 399L149 422L183 438L211 446L255 450L323 447L366 438L403 422L431 399L446 379L454 361L460 328L463 85L473 72L493 60L493 53L490 50L411 49L406 55L407 61L413 67L430 77L435 92L437 310L430 339L422 352L408 366L376 383L340 390L303 392L252 391L221 383L197 368L184 354L175 338L170 313L170 53L165 49L56 49ZM1248 158L1232 201L1227 256L1233 298L1249 339L1271 370L1300 398L1350 430L1440 478L1512 510L1579 534L1669 557L1702 560L1796 559L1824 550L1866 524L1915 483L1907 481L1899 487L1870 495L1777 498L1676 496L1588 486L1485 463L1465 453L1459 445L1427 439L1388 416L1362 386L1344 352L1336 328L1328 287L1327 222L1336 172L1353 132L1380 96L1414 71L1432 63L1462 56L1505 56L1537 63L1560 73L1581 87L1605 110L1623 135L1639 172L1648 215L1647 288L1639 322L1615 371L1585 404L1560 422L1522 438L1494 442L1485 446L1498 449L1540 447L1609 430L1659 405L1703 367L1725 337L1742 297L1748 255L1742 196L1725 155L1703 124L1675 98L1634 73L1592 57L1552 48L1466 46L1407 50L1357 65L1310 90L1273 122Z"/></svg>';
  var WA='https://wa.me/5562996007574?text=Ol%C3%A1%2C%20Carlos%21%20Vim%20pelo%20site%20da%20Unique.';
  var ativo=document.body.getAttribute('data-casco')||'';
  var home=location.pathname==='/'||location.pathname==='/index.html';
  var h=function(id){ return home?'#'+id:'/#'+id; };
  var cur=function(k){ return ativo===k?' aria-current="page"':''; };

  var top=document.createElement('header');
  top.className='top'; top.id='top';
  top.innerHTML='<div class="wrap">'+
    '<a class="brand" href="/" aria-label="Unique, início">'+LOGO+'</a>'+
    '<nav class="menu" aria-label="Principal">'+
      '<a href="'+h('metodo')+'">Método</a>'+
      '<a href="'+h('servicos')+'">Serviços</a>'+
      '<a href="/cases/clinica-brasil/"'+cur('cases')+'>Cases</a>'+
      '<a href="/blog/"'+cur('blog')+'>Blog</a>'+
      '<a href="/area/"'+cur('area')+'>Área do cliente</a>'+
      '<a class="btn" href="/diagnostico/">Faça seu diagnóstico</a>'+
    '</nav>'+
    '<div class="acoes"><span data-tema></span>'+
    '<button class="burger" type="button" aria-label="Abrir menu" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div>'+
    '</div>';
  document.body.insertBefore(top, document.body.firstChild);
  var slot=top.querySelector('[data-tema]');
  if(window.UniqueTema) slot.replaceWith(window.UniqueTema.botao()); else slot.remove();

  var b=top.querySelector('.burger'), m=top.querySelector('.menu');
  b.onclick=function(){ var o=m.classList.toggle('open'); b.setAttribute('aria-expanded',o); };
  m.addEventListener('click',function(e){ if(e.target.closest('a')){ m.classList.remove('open'); b.setAttribute('aria-expanded','false'); } });

  var foot=document.createElement('footer');
  foot.className='foot';
  foot.innerHTML='<div class="wrap"><div class="grade">'+
    '<div class="marca">'+LOGO+'<p>Consultoria comercial que transforma vendas em processo: previsível, organizado e escalável.</p>'+
      '<div class="tres" aria-hidden="true"><span class="I mag"></span><span class="I mar"></span><span class="I ver"></span></div></div>'+
    '<div><h4>Navegação</h4><ul>'+
      '<li><a href="'+h('metodo')+'">Método</a></li><li><a href="'+h('servicos')+'">Serviços</a></li>'+
      '<li><a href="/cases/clinica-brasil/">Cases</a></li><li><a href="/blog/">Blog</a></li><li><a href="/diagnostico/">Diagnóstico</a></li></ul></div>'+
    '<div><h4>Contato</h4><ul>'+
      '<li><a href="'+WA+'" target="_blank" rel="noopener"><i class="ic" style="--i:var(--ic-whatsapp)"></i>WhatsApp</a></li>'+
      '<li><a href="https://www.instagram.com/sejauniqueoficial" target="_blank" rel="noopener"><i class="ic" style="--i:var(--ic-instagram)"></i>Instagram</a></li>'+
      '<li><a href="https://www.youtube.com/@carlosribeiroconsultoria" target="_blank" rel="noopener"><i class="ic" style="--i:var(--ic-youtube)"></i>YouTube</a></li>'+
      '<li><a href="https://www.linkedin.com/in/ribeiro-carlos" target="_blank" rel="noopener"><i class="ic" style="--i:var(--ic-linkedin)"></i>LinkedIn</a></li>'+
      '<li><a href="mailto:contato@sejaunique.com"><i class="ic" style="--i:var(--ic-mail)"></i>contato@sejaunique.com</a></li></ul></div>'+
    '<div><h4>Clientes</h4><ul>'+
      '<li><a href="/area/"><i class="ic" style="--i:var(--ic-login)"></i>Área do cliente</a></li>'+
      '<li><a href="/area/#cadastro"><i class="ic" style="--i:var(--ic-user)"></i>Solicitar acesso</a></li></ul></div>'+
    '</div><div class="base"><span>© 2018–'+new Date().getFullYear()+' Seja Unique · Goiânia, GO</span><span>Let’s made f*ck <b>UN1QUE</b> things for u</span></div></div>';
  function poeRodape(){ document.body.appendChild(foot); }
  // páginas de cliente ganham curtidas, comentários, compartilhar e o botão de página pública
  if(/^\/clientes\/[a-z0-9]+\/[a-z0-9-]+\/?/.test(location.pathname)){
    var sc=document.createElement('script'); sc.src='/assets/interacao.js'; sc.defer=true; document.head.appendChild(sc);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',poeRodape); else poeRodape();
  // botão flutuante de WhatsApp (fora da área do cliente)
  if(ativo!=='area'){ var w=document.createElement('script'); w.src='/assets/whats.js'; w.defer=true; document.head.appendChild(w); }
})();
