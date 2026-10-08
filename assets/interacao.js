/* Curtidas, comentários, página pública e compartilhar para as entregas da Área do Cliente.
   - Nas páginas /clientes/<empresa>/<pagina>/ o casco.js carrega este arquivo e o bloco aparece sozinho no fim da página.
   - No painel: UniqueSocial.montar(elemento, {slug, id}).
   Usa a API /api/area (a=social, curtir, comentar, comentar-del, publico). */
(function(){
  if(window.UniqueSocial) return;
  var css=''+
  '.social{border:1px solid var(--line);border-radius:var(--r,24px);padding:22px;background:var(--bg);margin-top:16px}'+
  '.social .sbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}'+
  '.social .sbt{display:inline-flex;align-items:center;gap:8px;font:inherit;font-size:.8rem;font-weight:600;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:999px;padding:9px 16px;cursor:pointer;text-decoration:none}'+
  '.social .sbt:hover{border-color:var(--fg)}'+
  '.social .sbt[aria-pressed="true"]{background:var(--fg);color:var(--bg);border-color:var(--fg)}'+
  '.social .sbt svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}'+
  '.social .sbt[aria-pressed="true"] .cor{fill:currentColor}'+
  '.social .esp{flex:1}'+
  '.social .pub{display:flex;align-items:center;gap:10px;font-size:.8rem;font-weight:600;cursor:pointer;user-select:none}'+
  '.social .pub input{position:absolute;opacity:0;width:1px;height:1px}'+
  '.social .trilho{width:40px;height:22px;border-radius:999px;background:var(--line);position:relative;transition:background .2s;flex-shrink:0}'+
  '.social .trilho::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--bg);transition:transform .2s;box-shadow:0 1px 2px rgba(0,0,0,.25)}'+
  '.social .pub input:checked + .trilho{background:var(--grifo)}'+
  '.social .pub input:checked + .trilho::after{transform:translateX(18px)}'+
  '.social .pub input:focus-visible + .trilho{outline:2px solid var(--focus);outline-offset:2px}'+
  '.social .nota{font-size:.78rem;color:var(--muted);margin:12px 0 0}'+
  '.social .coms{margin-top:18px;border-top:1px solid var(--line);padding-top:16px;display:grid;gap:14px}'+
  '.social .com{display:grid;grid-template-columns:34px 1fr;gap:12px}'+
  '.social .av{width:34px;height:34px;border-radius:50%;background:var(--soft);border:1px solid var(--line);display:grid;place-items:center;font-size:.78rem;font-weight:700}'+
  '.social .com.u .av{background:var(--fg);color:var(--bg);border-color:var(--fg)}'+
  '.social .com b{font-size:.84rem}'+
  '.social .com time{font-size:.72rem;color:var(--muted);margin-left:8px}'+
  '.social .com p{margin:2px 0 0;font-size:.9rem;white-space:pre-wrap;word-break:break-word}'+
  '.social .com button{font:inherit;font-size:.72rem;color:var(--muted);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;margin-top:4px}'+
  '.social form{display:grid;gap:10px;margin-top:4px}'+
  '.social textarea{font:inherit;font-size:.92rem;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:12px 14px;min-height:76px;resize:vertical;width:100%}'+
  '.social form .sbt{justify-self:end;background:var(--fg);color:var(--bg);border-color:var(--fg)}'+
  '.social .vaz{font-size:.86rem;color:var(--muted);margin:0}'+
  '.social .entra{font-size:.86rem;margin:14px 0 0}'+
  '.social .entra a{font-weight:600}'+
  '.social-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--fg);color:var(--bg);padding:12px 20px;border-radius:999px;font-size:.85rem;font-weight:600;z-index:50;max-width:calc(100vw - 32px);text-align:center}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var I={
    cor:'<svg viewBox="0 0 24 24"><path class="cor" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    com:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    sha:'<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M5 13v6h14v-6"/></svg>'
  };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function quando(d){ try{ return new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
  function ini(n){ return String(n||'?').trim().split(/\s+/).slice(0,2).map(function(x){return x.charAt(0);}).join('').toUpperCase(); }
  function toast(t){ var d=document.createElement('div'); d.className='social-toast'; d.textContent=t; document.body.appendChild(d); setTimeout(function(){d.remove();},2600); }
  function post(o){ return fetch('/api/area',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)}).then(function(r){return r.json();}); }

  function compartilhar(d){
    var url=d.url||location.href.split('?')[0].split('#')[0];
    var txt=d.titulo+(d.publico?'':' (acesso com login da área do cliente)');
    if(navigator.share){ navigator.share({title:d.titulo,text:d.titulo,url:url}).catch(function(){}); return; }
    var feito=function(){ toast(d.publico?'Link copiado. Quem receber abre direto.':'Link copiado. Quem receber entra com o login da empresa.'); };
    if(navigator.clipboard) navigator.clipboard.writeText(url).then(feito,function(){});
    window.open('https://wa.me/?text='+encodeURIComponent(txt+'\n'+url),'_blank','noopener');
  }

  function montar(el,o){
    var slug=o.slug, id=o.id, D=null, aberto=!!o.aberto;
    el.classList.add('social');
    el.innerHTML='<p class="vaz">Carregando…</p>';
    function carrega(){
      return fetch('/api/area?a=social&e='+encodeURIComponent(slug)+'&id='+encodeURIComponent(id),{credentials:'same-origin'})
        .then(function(r){return r.json();}).then(function(d){ if(!d.ok){ el.remove(); return; } D=d; if(!D.titulo) D.titulo=o.titulo||document.title; desenha(); if(o.onchange) o.onchange(D); })
        .catch(function(){ el.remove(); });
    }
    function desenha(){
      if(!D.logado){
        el.innerHTML='<div class="sbar"><span class="sbt" aria-hidden="true">'+I.cor+D.curtidas+'</span>'+
          '<button class="sbt" type="button" data-s="sha">'+I.sha+'Compartilhar</button></div>'+
          '<p class="entra">É cliente da Unique? <a href="/area/?volta='+encodeURIComponent(location.pathname)+'">Entre na área do cliente</a> para curtir e comentar.</p>';
        return;
      }
      var n=D.comentarios.length;
      var h='<div class="sbar">'+
        '<button class="sbt" type="button" data-s="cur" aria-pressed="'+D.curti+'">'+I.cor+(D.curti?'Curtiu':'Curtir')+' · '+D.curtidas+'</button>'+
        '<button class="sbt" type="button" data-s="com" aria-expanded="'+aberto+'">'+I.com+n+(n===1?' comentário':' comentários')+'</button>'+
        '<button class="sbt" type="button" data-s="sha">'+I.sha+'Compartilhar</button>'+
        '<span class="esp"></span>'+
        (D.pasta?'<label class="pub"><input type="checkbox" data-s="pub"'+(D.publico?' checked':'')+'><span class="trilho"></span>Página pública</label>':'')+
        '</div>';
      if(D.pasta) h+='<p class="nota">'+(D.publico?'Pública: qualquer pessoa com o link abre esta página, sem senha. Os comentários continuam só para a sua empresa.':'Fechada: quem receber o link entra com o login da empresa para ver.')+'</p>';
      if(aberto){
        h+='<div class="coms">'+(n?D.comentarios.map(function(c){
          return '<div class="com'+(c.unique?' u':'')+'"><span class="av">'+(c.unique?'U':esc(ini(c.nome)))+'</span><div><b>'+esc(c.nome)+'</b><time>'+quando(c.data)+'</time><p>'+esc(c.texto)+'</p>'+
            (c.meu?'<button type="button" data-del="'+esc(c.cid)+'">Apagar</button>':'')+'</div></div>';
        }).join(''):'<p class="vaz">Nenhum comentário ainda. Comece a conversa.</p>')+
        '<form><textarea maxlength="2000" placeholder="Escreva um comentário, uma dúvida ou o que aplicou…" aria-label="Comentário" required></textarea><button class="sbt" type="submit">Comentar</button></form></div>';
      }
      el.innerHTML=h;
      var f=el.querySelector('form');
      if(f) f.onsubmit=function(ev){
        ev.preventDefault(); var ta=f.querySelector('textarea'), b=f.querySelector('button'); if(!ta.value.trim()) return;
        b.disabled=true;
        post({a:'comentar',slug:slug,id:id,texto:ta.value}).then(function(r){ b.disabled=false; if(r.ok) carrega(); else toast(r.erro||'Não foi possível comentar.'); });
      };
    }
    el.onclick=function(ev){
      var b=ev.target.closest('[data-s],[data-del]'); if(!b||b.tagName==='INPUT') return;
      if(b.dataset.del){
        if(b.dataset.ok!=='1'){ b.dataset.ok='1'; b.textContent='Confirmar'; return; }
        post({a:'comentar-del',slug:slug,id:id,cid:b.dataset.del}).then(carrega); return;
      }
      if(b.dataset.s==='cur') post({a:'curtir',slug:slug,id:id}).then(function(r){ if(r.ok){ D.curti=r.curti; D.curtidas=r.curtidas; desenha(); if(o.onchange) o.onchange(D); } });
      if(b.dataset.s==='com'){ aberto=!aberto; desenha(); if(aberto){ var t=el.querySelector('textarea'); if(t) t.focus(); } }
      if(b.dataset.s==='sha') compartilhar(D);
    };
    el.onchange=function(ev){
      var c=ev.target; if(c.dataset.s!=='pub') return;
      c.disabled=true;
      post({a:'publico',slug:slug,id:id,publico:c.checked}).then(function(r){
        if(r.ok){ D.publico=r.publico; toast(r.publico?'Página pública: abre sem senha.':'Página fechada: só com login.'); }
        else { c.checked=!c.checked; toast(r.erro||'Não foi possível alterar.'); }
        desenha(); if(o.onchange) o.onchange(D);
      });
    };
    carrega();
  }
  window.UniqueSocial={montar:montar};

  // página de cliente: monta sozinho no fim do conteúdo
  var m=location.pathname.match(/^\/clientes\/([a-z0-9]+)\/([a-z0-9-]+)\/?/);
  if(m && !document.querySelector('[data-social-off]')){
    var ir=function(){
      var sec=document.createElement('section');
      sec.className='wrap'; sec.style.maxWidth='920px'; sec.style.paddingTop='48px';
      sec.innerHTML='<span class="spaced" style="color:var(--muted)">Conversa sobre esta entrega</span>';
      var box=document.createElement('div'); sec.appendChild(box);
      (document.querySelector('main')||document.body).appendChild(sec);
      montar(box,{slug:m[1],id:m[2],aberto:true,titulo:document.title});
    };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ir); else ir();
  }
})();
