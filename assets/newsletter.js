/* Newsletter do Blog Seja Unique: formulário de inscrição.
   Uso: <div data-newsletter="origem" data-variante="faixa|cartao"></div> + <script src="/assets/newsletter.js" defer></script>
   faixa  = bloco largo e verde (rodapé do site e do blog)
   cartao = bloco compacto (página de links do Instagram)
   Quem assina só recebe e-mail quando sai post novo no blog (api/newsletter.js). */
(function(){
  if(window.__uniqueNews) return; window.__uniqueNews=1;
  var CSS=''+
  '.nl{--nl-bg:#00e676;--nl-fg:#0a0a0a;background:var(--nl-bg);color:var(--nl-fg);font-family:"Montserrat",system-ui,sans-serif;position:relative;overflow:hidden}'+
  '.nl *{box-sizing:border-box}'+
  '.nl-faixa{padding:64px 0}'+
  '.nl-w{max-width:1240px;margin:0 auto;padding:0 clamp(20px,4vw,40px);display:grid;grid-template-columns:1.15fr 1fr;gap:48px;align-items:center;position:relative;z-index:1}'+
  '.nl-sel{display:inline-flex;align-items:center;gap:10px;font-size:.68rem;font-weight:800;letter-spacing:.3em;text-transform:uppercase;margin-bottom:18px}'+
  '.nl-sel i{width:8px;height:8px;border-radius:50%;background:var(--nl-fg);display:block;animation:nlp 1.8s ease-in-out infinite}'+
  '@keyframes nlp{50%{opacity:.25}}'+
  '.nl h2{font-size:clamp(2rem,4.4vw,3.4rem);line-height:1.02;font-weight:800;letter-spacing:-.035em;margin:0}'+
  '.nl h2 em{font-style:italic;font-weight:200;display:block}'+
  '.nl-sub{font-size:1rem;line-height:1.55;font-weight:500;margin:18px 0 0;max-width:46ch;opacity:.85}'+
  '.nl form{display:grid;gap:10px}'+
  '.nl-l{display:grid;grid-template-columns:1fr 1fr;gap:10px}'+
  '.nl input{font:inherit;font-size:1rem;font-weight:500;color:#0a0a0a;background:#fff;border:2px solid #0a0a0a;border-radius:999px;padding:15px 22px;width:100%;outline:none}'+
  '.nl input::placeholder{color:#6b6b72}'+
  '.nl input:focus{box-shadow:0 0 0 4px rgba(10,10,10,.18)}'+
  '.nl button{font:inherit;font-size:1rem;font-weight:800;cursor:pointer;background:#0a0a0a;color:#fff;border:2px solid #0a0a0a;border-radius:999px;padding:16px 26px;display:inline-flex;align-items:center;justify-content:center;gap:12px;transition:transform .15s}'+
  '.nl button:hover{transform:translateY(-2px)}'+
  '.nl button:disabled{opacity:.6;transform:none;cursor:wait}'+
  '.nl button svg{width:20px;height:20px}'+
  '.nl-ok{font-size:.82rem;font-weight:600;opacity:.8;margin:4px 0 0;display:flex;gap:8px;align-items:center}'+
  '.nl-ok svg{width:16px;height:16px;flex:none}'+
  '.nl-msg{font-weight:700;font-size:.95rem;margin:0}.nl-msg:empty{display:none}'+
  '.nl-fim{background:#0a0a0a;color:#fff;border-radius:22px;padding:26px 28px}'+
  '.nl-fim b{display:block;font-size:1.3rem;font-weight:800;margin-bottom:6px;color:#00e676}'+
  '.nl-fim p{margin:0;opacity:.85;line-height:1.5}'+
  '.nl-isca{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}'+
  '.nl-is{position:absolute;right:-30px;bottom:-60px;display:flex;gap:14px;opacity:.14;z-index:0;pointer-events:none}'+
  '.nl-is svg{width:58px;height:160px;color:#0a0a0a}'+
  '.nl-cartao{border-radius:24px;padding:26px 22px;margin:28px 0}'+
  '.nl-cartao .nl-w{display:block;padding:0}'+
  '.nl-cartao h2{font-size:1.75rem}'+
  '.nl-cartao .nl-sub{font-size:.92rem;margin:12px 0 18px}'+
  '.nl-cartao .nl-l{grid-template-columns:1fr}'+
  '.nl-cartao .nl-is{right:-20px;bottom:-40px}'+
  '.nl-cartao .nl-is svg{width:40px;height:110px}'+
  '@media (max-width:860px){.nl-w{grid-template-columns:1fr;gap:28px}.nl-faixa{padding:52px 0}}'+
  '@media (max-width:520px){.nl-l{grid-template-columns:1fr}}';
  var I='<svg viewBox="0 0 318 879" aria-hidden="true"><path fill="currentColor" d="M3 0L0 3L1 30L36 48L49 60L56 72L61 102L62 761L54 812L36 831L1 849L0 876L3 879L313 879L318 875L317 851L272 825L261 810L255 789L254 111L257 79L265 61L278 49L317 28L318 4L313 0Z"/></svg>';
  var SETA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';

  function monta(el){
    if(el.__nl) return; el.__nl=1;
    var origem=el.getAttribute('data-newsletter')||'site', v=el.getAttribute('data-variante')||'faixa';
    el.className=(el.className?el.className+' ':'')+'nl nl-'+v;
    el.setAttribute('aria-labelledby','nl-t-'+origem);
    el.innerHTML='<div class="nl-w"><div>'+
        '<span class="nl-sel"><i></i>Newsletter Unique</span>'+
        '<h2 id="nl-t-'+origem+'">Cada post novo, <em>direto no seu e-mail.</em></h2>'+
        '<p class="nl-sub">Opiniões curtas sobre vender, do jeito que eu vejo no dia a dia com empresários. Você só recebe quando sai post novo no blog.</p>'+
      '</div><div class="nl-f">'+
        '<form novalidate>'+
          '<div class="nl-l"><input name="nome" autocomplete="given-name" placeholder="Seu nome" aria-label="Seu nome" maxlength="80">'+
          '<input name="email" type="email" autocomplete="email" placeholder="Seu melhor e-mail" aria-label="Seu e-mail" required maxlength="120"></div>'+
          '<input class="nl-isca" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">'+
          '<button type="submit">Quero receber os posts'+SETA+'</button>'+
          '<p class="nl-msg" role="status" aria-live="polite"></p>'+
          '<p class="nl-ok">'+CHECK+'Sem spam. Cancele quando quiser, com um clique.</p>'+
        '</form>'+
      '</div></div><div class="nl-is">'+I+I+I+'</div>';
    var f=el.querySelector('form'), msg=el.querySelector('.nl-msg'), bt=f.querySelector('button');
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var email=f.email.value.trim(), nome=f.nome.value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ msg.textContent='Confira o seu e-mail.'; f.email.focus(); return; }
      bt.disabled=true; msg.textContent='Enviando…';
      fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({a:'assinar',nome:nome,email:email,origem:origem,site:f.site.value})})
        .then(function(r){ return r.json().catch(function(){ return {}; }); })
        .then(function(r){
          if(!r||!r.ok){ bt.disabled=false; msg.textContent=(r&&r.erro)||'Não deu certo agora. Tente de novo em instantes.'; return; }
          el.querySelector('.nl-f').innerHTML='<div class="nl-fim"><b>'+(r.ja?'Você já está na lista!':'Pronto, inscrição feita!')+'</b><p>'+(nome?nome.split(' ')[0]+', o':'O')+' próximo post do blog chega direto no seu e-mail.</p></div>';
        })
        .catch(function(){ bt.disabled=false; msg.textContent='Sem conexão. Tente de novo.'; });
    });
  }
  function init(){
    if(!document.getElementById('nl-css')){ var s=document.createElement('style'); s.id='nl-css'; s.textContent=CSS; document.head.appendChild(s); }
    document.querySelectorAll('[data-newsletter]').forEach(monta);
  }
  window.UniqueNews={montar:init};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
