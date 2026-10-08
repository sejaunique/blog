/* Botão flutuante de WhatsApp da Unique. Basta incluir <script src="/assets/whats.js" defer></script>.
   A mensagem já diz de qual página a pessoa veio. */
(function(){
  if(document.querySelector('.wpp-flut')) return;
  var pg=(document.title||'').split('·')[0].trim()||'site';
  var txt='Olá, Carlos! Vim pelo site da Unique ('+pg+') e quero conversar.';
  var a=document.createElement('a');
  a.className='wpp-flut'; a.target='_blank'; a.rel='noopener'; a.setAttribute('aria-label','Falar com o Carlos no WhatsApp');
  a.href='https://wa.me/5562996007574?text='+encodeURIComponent(txt);
  a.innerHTML='<span class="wpp-txt">Fale com o Carlos</span><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.1c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.2c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.2 1.2-4-.3-.4a10.4 10.4 0 0 1-1.6-5.6C5.4 9.9 10.1 5.3 16 5.3s10.6 4.6 10.6 10.4S21.8 26.2 16 26.2zm5.8-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.8 1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5.1 2.1.9 3 1 4 .8.7-.1 1.9-.8 2.2-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.6-.3z"/></svg>';
  var st=document.createElement('style');
  st.textContent='.wpp-flut{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:70;display:flex;align-items:center;gap:10px;text-decoration:none;font-family:"Montserrat",system-ui,sans-serif}'+
    '.wpp-flut svg{width:58px;height:58px;padding:13px;border-radius:50%;background:#25d366;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:transform .2s}'+
    '.wpp-flut:hover svg{transform:scale(1.08)}'+
    '.wpp-txt{background:#fff;color:#0b0b0c;font-size:.86rem;font-weight:700;padding:10px 14px;border-radius:999px;box-shadow:0 4px 16px rgba(0,0,0,.18);opacity:0;transform:translateX(8px);transition:opacity .2s,transform .2s;pointer-events:none;white-space:nowrap}'+
    '.wpp-flut:hover .wpp-txt,.wpp-flut:focus-visible .wpp-txt{opacity:1;transform:none}'+
    '@media print{.wpp-flut{display:none}}';
  document.head.appendChild(st);
  function poe(){ document.body.appendChild(a); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',poe); else poe();
})();
