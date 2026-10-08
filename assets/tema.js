/* Tema claro/escuro da Unique, igual em todas as páginas.
   Coloque no <head>, antes do CSS:  <script src="/assets/tema.js"></script>
   - Aplica o tema salvo antes da página aparecer (sem "piscar").
   - Sem escolha salva, segue o sistema (claro ou escuro do celular/computador).
   - Coloca o botão de sol/lua no cabeçalho da página (ou no canto, se a página não tiver cabeçalho).
   O casco.js (cabeçalho padrão) já cria o botão; aqui é para as páginas com cabeçalho próprio. */
(function(){
  var CHAVE='unique-tema', root=document.documentElement;
  function salvo(){ try{ return localStorage.getItem(CHAVE); }catch(e){ return null; } }
  function sistema(){ return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function atual(){ return root.getAttribute('data-theme') || sistema(); }
  function aplica(t){
    root.setAttribute('data-theme', t);
    root.style.colorScheme = t;
    var m=document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute('content', t==='dark' ? '#000000' : '#ffffff');
    document.querySelectorAll('.tema-bt').forEach(function(b){
      b.setAttribute('aria-label', t==='dark' ? 'Mudar para o modo claro' : 'Mudar para o modo escuro');
      b.setAttribute('aria-pressed', t==='dark');
    });
  }
  var s=salvo(); aplica(s==='dark'||s==='light' ? s : sistema());
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ if(!salvo()) aplica(sistema()); });

  var SVG='<svg class="t-sol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1 1M17.4 17.4l1 1M5.6 18.4l1-1M17.4 6.6l1-1"/></svg>'+
          '<svg class="t-lua" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>';
  var CSS='.tema-bt{display:inline-grid;place-items:center;width:38px;height:38px;flex:none;border-radius:50%;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;opacity:.85;transition:opacity .2s,transform .3s}'+
    '.tema-bt:hover{opacity:1}.tema-bt:active{transform:rotate(30deg)}'+
    '.tema-bt svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}'+
    '.tema-bt .t-lua{display:none}[data-theme="dark"] .tema-bt .t-sol{display:none}[data-theme="dark"] .tema-bt .t-lua{display:block}'+
    '.tema-bt.solto{position:fixed;right:16px;top:calc(16px + env(safe-area-inset-top,0px));z-index:60;background:var(--bg,#fff);color:var(--fg,#000);border-color:var(--line,#ddd);box-shadow:0 2px 10px rgba(0,0,0,.12)}'+
    '@media print{.tema-bt{display:none}}';

  function botao(){
    var b=document.createElement('button');
    b.type='button'; b.className='tema-bt'; b.innerHTML=SVG;
    b.addEventListener('click', function(){
      var n=atual()==='dark'?'light':'dark';
      try{ localStorage.setItem(CHAVE,n); }catch(e){}
      aplica(n);
    });
    return b;
  }
  window.UniqueTema={ botao:function(){ var b=botao(); setTimeout(function(){aplica(atual());}); return b; }, aplica:aplica };

  function monta(){
    var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    if(document.querySelector('.tema-bt')) return aplica(atual());
    if(document.body.hasAttribute('data-casco')) return; // o casco.js cria o botão
    // cabeçalho próprio da página: entra no fim da linha do topo
    var b=botao(), alvo=null;
    ['[data-tema-alvo]','header .social','header .top-in','header .wrap'].some(function(sel){ alvo=document.querySelector(sel); return !!alvo; });
    var cab=alvo && alvo.closest('header');
    if(alvo && cab && cab.getBoundingClientRect().height < 140){
      if(alvo.matches('[data-tema-alvo], header .social')){ alvo.appendChild(b); }
      else {
        // junta o último item do topo com o botão, para não desmontar o alinhamento da linha
        var ult=alvo.lastElementChild, g=document.createElement('div');
        g.style.cssText='display:flex;align-items:center;gap:14px;justify-content:flex-end';
        if(ult){ alvo.replaceChild(g,ult); g.appendChild(ult); }
        else alvo.appendChild(g);
        g.appendChild(b);
      }
    } else { b.classList.add('solto'); document.body.appendChild(b); }
    aplica(atual());
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', monta); else monta();
})();
