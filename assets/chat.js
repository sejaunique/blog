/* Assistente com IA do admin (Unique workspace).
   - Botão fixo no canto (abre uma gaveta) e a página "Assistente" em tela cheia: UniqueChat.montar(el, {cheio:true})
   - Anexos: imagens (também colar e arrastar), PDF e arquivos de texto/CSV. Microfone: ditado em português (Chrome/Edge/Safari).
   - Mudanças viram cartões com Confirmar/Cancelar; nada muda sem o clique. Depois de confirmar chama UniqueChat.aoMudar(). */
(function(){
  if(window.UniqueChat) return;
  var css=''+
  '.uc-fab{position:fixed;right:22px;bottom:22px;z-index:70;width:58px;height:58px;border-radius:50%;border:0;background:#0b0b0c;color:#00e676;font-size:24px;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.25);display:grid;place-items:center}'+
  '[data-theme="dark"] .uc-fab{background:#00e676;color:#000}.uc-fab:hover{transform:scale(1.05)}'+
  '.uc-gav{position:fixed;right:16px;bottom:90px;z-index:71;width:min(440px,calc(100vw - 32px));height:min(680px,calc(100vh - 120px));background:var(--bg,#fff);color:var(--fg,#0b0b0c);border:1px solid var(--line,#e4e4e7);border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden}'+
  '.uc{display:flex;flex-direction:column;height:100%;min-height:0;font-size:.92rem}'+
  '.uc-top{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line,#e4e4e7)}.uc-top b{font-size:.95rem}.uc-top b i{font-style:normal;color:#00a854}.uc-top .sp{flex:1}'+
  '.uc-top button,.uc-top a{font:inherit;font-size:.76rem;font-weight:600;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:6px 11px;cursor:pointer;text-decoration:none}'+
  '.uc-hist{border-bottom:1px solid var(--line,#e4e4e7);max-height:40%;overflow:auto;padding:6px}.uc-hist button{display:block;width:100%;text-align:left;font:inherit;font-size:.82rem;border:0;background:none;color:var(--fg,#0b0b0c);padding:8px 10px;border-radius:10px;cursor:pointer}.uc-hist button:hover{background:var(--soft,#f4f4f5)}.uc-hist small{display:block;color:var(--muted,#6b6b72);font-size:.7rem}'+
  '.uc-msgs{flex:1;overflow:auto;padding:16px 14px;display:flex;flex-direction:column;gap:12px}'+
  '.uc-m{max-width:88%;line-height:1.55}.uc-m.eu{align-self:flex-end;background:#0b0b0c;color:#fff;border-radius:18px 18px 4px 18px;padding:10px 14px;white-space:pre-wrap}[data-theme="dark"] .uc-m.eu{background:#2a2a30}'+
  '.uc-m.ia{align-self:flex-start;background:var(--soft,#f4f4f5);border-radius:18px 18px 18px 4px;padding:10px 14px}.uc-m.ia p{margin:.35em 0}.uc-m.ia ul,.uc-m.ia ol{margin:.35em 0;padding-left:1.2em}.uc-m.ia a{color:inherit;text-decoration:underline;text-decoration-color:#00e676;text-underline-offset:3px}'+
  '.uc-m .anx{display:block;font-size:.72rem;opacity:.75;margin-top:4px}'+
  '.uc-card{align-self:stretch;border:1.5px solid var(--fg,#0b0b0c);border-radius:16px;padding:12px 14px;background:var(--bg,#fff)}.uc-card h5{margin:0 0 8px;font-size:.86rem}'+
  '.uc-card dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:.8rem}.uc-card dt{color:var(--muted,#6b6b72)}.uc-card dd{margin:0;word-break:break-word}'+
  '.uc-card .bts{display:flex;gap:6px;justify-content:flex-end;margin-top:10px}.uc-card .bts button{font:inherit;font-size:.78rem;font-weight:700;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:7px 14px;cursor:pointer}.uc-card .bts button.ok{background:#00e676;border-color:#00e676;color:#000}'+
  '.uc-card .est{font-size:.76rem;font-weight:700;margin-top:8px}.uc-card.feito{border-color:#00c853}.uc-card.feito .est{color:#078a46}.uc-card.cancelado{opacity:.6;border-style:dashed}.uc-card.erro{border-color:#e0055e}.uc-card.erro .est{color:#e0055e}'+
  '.uc-pensando{align-self:flex-start;font-size:.8rem;color:var(--muted,#6b6b72)}.uc-pensando i{display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:3px;animation:ucp 1s infinite}.uc-pensando i:nth-child(2){animation-delay:.15s}.uc-pensando i:nth-child(3){animation-delay:.3s}@keyframes ucp{50%{opacity:.2}}'+
  '.uc-vz{margin:auto;text-align:center;color:var(--muted,#6b6b72);font-size:.86rem;max-width:300px}.uc-vz b{display:block;color:var(--fg,#0b0b0c);font-size:1rem;margin-bottom:6px}.uc-sug{display:flex;flex-direction:column;gap:6px;margin-top:12px}.uc-sug button{font:inherit;font-size:.8rem;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:12px;padding:8px 10px;cursor:pointer;text-align:left}'+
  '.uc-in{border-top:1px solid var(--line,#e4e4e7);padding:10px;display:grid;gap:6px}.uc-anx{display:flex;flex-wrap:wrap;gap:6px}.uc-anx span{font-size:.72rem;background:var(--soft,#f4f4f5);border-radius:999px;padding:4px 6px 4px 10px;display:inline-flex;gap:6px;align-items:center}.uc-anx button{border:0;background:none;cursor:pointer;color:inherit;font-size:.9rem;padding:0}'+
  '.uc-linha{display:flex;gap:6px;align-items:flex-end}.uc-linha textarea{flex:1;font:inherit;font-size:.9rem;border:1px solid var(--line,#e4e4e7);border-radius:16px;padding:10px 12px;resize:none;min-height:44px;max-height:160px;background:var(--bg,#fff);color:var(--fg,#0b0b0c)}'+
  '.uc-linha button{width:42px;height:42px;border-radius:50%;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);cursor:pointer;font-size:1rem;flex-shrink:0;display:grid;place-items:center}.uc-linha button.env{background:#0b0b0c;color:#fff;border-color:#0b0b0c}.uc-linha button.ouvindo{background:#e0055e;color:#fff;border-color:#e0055e;animation:ucp 1s infinite}'+
  '.uc.cheio{height:calc(100vh - 230px);min-height:520px;border:1px solid var(--line,#e4e4e7);border-radius:24px;overflow:hidden;background:var(--bg,#fff)}.uc.cheio .uc-msgs{padding:24px max(16px,calc(50% - 380px))}.uc.cheio .uc-in{padding:12px max(12px,calc(50% - 380px))}'+
  '.uc-drop{outline:2px dashed #00e676;outline-offset:-8px}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function md(t){ // markdown simples: negrito, itálico, links, listas e parágrafos
    var linhas=esc(t||'').split('\n'), out='', lista='';
    var inl=function(x){ return x.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g,function(m,a,u){ return '<a href="'+u+'"'+(/^https?:/.test(u)?' target="_blank" rel="noopener"':'')+'>'+a+'</a>'; }); };
    linhas.forEach(function(l){ var m=l.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/);
      if(m){ var tp=/\d/.test(m[1])?'ol':'ul'; if(lista!==tp){ if(lista) out+='</'+lista+'>'; out+='<'+tp+'>'; lista=tp; } out+='<li>'+inl(m[2])+'</li>'; return; }
      if(lista){ out+='</'+lista+'>'; lista=''; }
      if(l.trim()) out+='<p>'+inl(l)+'</p>'; });
    if(lista) out+='</'+lista+'>';
    return out; }
  function api(q,b){ return fetch('/api/area'+(b?'':q),{method:b?'POST':'GET',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined}).then(function(r){return r.json();}); }
  function lerArquivo(f){ return new Promise(function(ok,erro){
    var fr=new FileReader();
    if(/^image\//.test(f.type)){ fr.onload=function(){ var img=new Image(); img.onload=function(){ var m=1600,k=Math.min(1,m/Math.max(img.naturalWidth,img.naturalHeight)); var cv=document.createElement('canvas'); cv.width=Math.round(img.naturalWidth*k); cv.height=Math.round(img.naturalHeight*k); cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height); ok({nome:f.name||'imagem.jpg',tipo:'image/jpeg',dados:cv.toDataURL('image/jpeg',0.85).split(',')[1]}); }; img.onerror=erro; img.src=fr.result; }; fr.onerror=erro; fr.readAsDataURL(f); return; }
    fr.onload=function(){ ok({nome:f.name,tipo:f.type||'text/plain',dados:String(fr.result).split(',')[1]||''}); }; fr.onerror=erro; fr.readAsDataURL(f); }); }

  function montar(el,op){
    op=op||{}; var conv='', anexos=[], ocupado=false, tela=[], rec=null;
    el.innerHTML='<div class="uc'+(op.cheio?' cheio':'')+'"><div class="uc-top"><b><i>✦</i> Assistente</b><span class="sp"></span><button type="button" data-uc="hist">Conversas</button><button type="button" data-uc="nova">Nova</button>'+(op.cheio?'':'<a href="#assistente" data-uc="tela" title="Abrir em tela cheia">⤢</a><button type="button" data-uc="fecha" aria-label="Fechar">×</button>')+'</div>'+
      '<div class="uc-hist" hidden></div><div class="uc-msgs" aria-live="polite"></div>'+
      '<div class="uc-in"><div class="uc-anx"></div><div class="uc-linha"><button type="button" data-uc="anexo" title="Anexar print, PDF ou planilha (CSV)">📎</button><button type="button" data-uc="mic" title="Falar">🎤</button><textarea rows="1" placeholder="Pergunte ou peça algo…" aria-label="Mensagem"></textarea><button type="button" class="env" data-uc="env" title="Enviar (Enter)">➤</button></div><input type="file" multiple hidden accept="image/*,application/pdf,.csv,.txt,.md,text/plain,text/csv"></div></div>';
    var R=el.querySelector('.uc'), M=el.querySelector('.uc-msgs'), T=el.querySelector('textarea'), F=el.querySelector('input[type=file]'), AX=el.querySelector('.uc-anx'), H=el.querySelector('.uc-hist');
    function auto(){ T.style.height='auto'; T.style.height=Math.min(160,T.scrollHeight)+'px'; }
    function vazio(){ M.innerHTML='<div class="uc-vz"><b>Como posso ajudar?</b>Eu consulto empresas, ações, reuniões, pessoas e resultados, e preparo mudanças para você confirmar.<div class="uc-sug">'+
      ['O que está atrasado em todos os clientes?','Resume a última reunião de cada cliente','Quem não entra na área do cliente há 15 dias?','Quais vitórias os clientes postaram este mês?'].map(function(s){ return '<button type="button" data-sug="'+esc(s)+'">'+esc(s)+'</button>'; }).join('')+'</div></div>'; }
    function cartao(c){ return '<div class="uc-card '+esc(c.estado||'pendente')+'" data-card="'+esc(c.id)+'"><h5>'+esc(c.titulo)+'</h5><dl>'+(c.linhas||[]).map(function(l){ return '<dt>'+esc(l[0])+'</dt><dd>'+esc(l[1])+'</dd>'; }).join('')+'</dl>'+
      (c.estado==='pendente'||!c.estado?'<div class="bts"><button type="button" data-dec="0">Cancelar</button><button type="button" class="ok" data-dec="1">Confirmar</button></div>':'<div class="est">'+(c.estado==='feito'?'✓ Feito'+(c.link?' · <a href="'+esc(c.link)+'">abrir</a>':''):c.estado==='cancelado'?'Cancelado':'Não deu certo'+(c.erro?': '+esc(c.erro):''))+'</div>')+'</div>'; }
    function desenha(){ if(!tela.length){ vazio(); return; }
      M.innerHTML=tela.map(function(m){ if(m.de==='eu') return '<div class="uc-m eu">'+esc(m.texto)+(m.anexos&&m.anexos.length?'<span class="anx">📎 '+esc(m.anexos.join(', '))+'</span>':'')+'</div>';
        return '<div class="uc-m ia">'+md(m.texto||'')+'</div>'+(m.cartoes||[]).map(cartao).join(''); }).join('')+(ocupado?'<div class="uc-pensando"><i></i><i></i><i></i> consultando o painel…</div>':'');
      M.scrollTop=M.scrollHeight; }
    function anx(){ AX.innerHTML=anexos.map(function(a,i){ return '<span>📎 '+esc(a.nome)+'<button type="button" data-tira="'+i+'" aria-label="Tirar">×</button></span>'; }).join(''); }
    function adiciona(files){ [].slice.call(files||[]).forEach(function(f){
      if(!/^image\//.test(f.type)&&f.type!=='application/pdf'&&!/\.(csv|txt|md)$/i.test(f.name)&&!/^text\//.test(f.type)){ alert('"'+f.name+'": envie como imagem, PDF ou CSV/TXT.'); return; }
      if(f.size>3.2*1024*1024&&!/^image\//.test(f.type)){ alert('"'+f.name+'" passa de 3 MB.'); return; }
      lerArquivo(f).then(function(a){ anexos.push(a); anx(); }); }); }
    function envia(){ var t=T.value.trim(); if(ocupado||(!t&&!anexos.length)) return;
      if(rec) try{ rec.stop(); }catch(x){}
      tela.push({de:'eu',texto:t,anexos:anexos.map(function(a){return a.nome;})}); var ax=anexos; anexos=[]; anx(); T.value=''; auto(); ocupado=true; desenha();
      api('',{a:'admin-chat',conv:conv,texto:t,anexos:ax}).then(function(r){ ocupado=false;
        if(!r||!r.ok){ tela.push({de:'ia',texto:'⚠️ '+((r&&r.erro)||'Não consegui responder agora.')}); desenha(); return; }
        conv=r.conv; tela.push({de:'ia',texto:r.resposta,cartoes:r.cartoes}); desenha(); }).catch(function(){ ocupado=false; tela.push({de:'ia',texto:'⚠️ A conexão caiu. Tente de novo.'}); desenha(); }); }
    function historico(){ if(!H.hidden){ H.hidden=true; return; } H.hidden=false; H.innerHTML='<small style="padding:6px 10px;display:block">Carregando…</small>';
      api('?a=admin-chat-lista').then(function(r){ var L=(r&&r.conversas)||[]; H.innerHTML=L.length?L.map(function(c){ return '<button type="button" data-conv="'+esc(c.id)+'">'+esc(c.titulo)+'<small>'+new Date(c.atualizado).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+'</small></button>'; }).join(''):'<small style="padding:6px 10px;display:block">Nenhuma conversa ainda.</small>'; }); }
    function microfone(b){ var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){ alert('Este navegador não tem ditado. Use o Chrome, o Edge ou o Safari.'); return; }
      if(rec){ try{ rec.stop(); }catch(x){} return; }
      var base=T.value?T.value.replace(/\s*$/,' '):''; rec=new SR(); rec.lang='pt-BR'; rec.interimResults=true; rec.continuous=true;
      rec.onresult=function(ev){ var fim='', meio=''; for(var i=0;i<ev.results.length;i++){ if(ev.results[i].isFinal) fim+=ev.results[i][0].transcript; else meio+=ev.results[i][0].transcript; } T.value=base+fim+meio; auto(); };
      rec.onend=function(){ rec=null; b.classList.remove('ouvindo'); b.title='Falar'; T.focus(); };
      rec.onerror=function(){ rec=null; b.classList.remove('ouvindo'); };
      rec.start(); b.classList.add('ouvindo'); b.title='Parar de ouvir'; }
    R.addEventListener('click',function(ev){
      var s=ev.target.closest('[data-sug]'); if(s){ T.value=s.dataset.sug; envia(); return; }
      var t=ev.target.closest('[data-tira]'); if(t){ anexos.splice(+t.dataset.tira,1); anx(); return; }
      var cv=ev.target.closest('[data-conv]'); if(cv){ api('?a=admin-chat-conv&id='+cv.dataset.conv).then(function(r){ if(r&&r.ok){ conv=r.id; tela=r.tela||[]; H.hidden=true; desenha(); } }); return; }
      var d=ev.target.closest('[data-dec]'); if(d){ var card=d.closest('[data-card]'), id=card.dataset.card; card.querySelectorAll('button').forEach(function(x){x.disabled=true;});
        api('',{a:'admin-chat-decide',id:id,ok:d.dataset.dec==='1'}).then(function(r){ tela.forEach(function(m){ (m.cartoes||[]).forEach(function(c){ if(c.id===id){ c.estado=d.dataset.dec!=='1'?'cancelado':(r&&r.ok&&r.feito!==false?'feito':'erro'); if(r&&r.erro) c.erro=r.erro; } }); });
          desenha(); if(d.dataset.dec==='1'&&r&&r.ok&&window.UniqueChat.aoMudar) window.UniqueChat.aoMudar(); }); return; }
      var b=ev.target.closest('[data-uc]'); if(!b) return; var a=b.dataset.uc;
      if(a==='env') envia(); if(a==='anexo') F.click(); if(a==='mic') microfone(b); if(a==='hist') historico();
      if(a==='nova'){ conv=''; tela=[]; anexos=[]; anx(); H.hidden=true; desenha(); T.focus(); }
      if(a==='fecha'&&op.aoFechar) op.aoFechar();
      if(a==='tela'&&op.aoFechar) op.aoFechar(); });
    F.onchange=function(){ adiciona(F.files); F.value=''; };
    T.addEventListener('input',auto);
    T.addEventListener('keydown',function(ev){ if(ev.key==='Enter'&&!ev.shiftKey){ ev.preventDefault(); envia(); } });
    T.addEventListener('paste',function(ev){ var fs=[].filter.call((ev.clipboardData||{}).files||[],function(f){return /^image\//.test(f.type);}); if(fs.length){ ev.preventDefault(); adiciona(fs); } });
    R.addEventListener('dragover',function(ev){ if([].some.call(ev.dataTransfer.types||[],function(t){return t==='Files';})){ ev.preventDefault(); R.classList.add('uc-drop'); } });
    R.addEventListener('dragleave',function(ev){ if(!R.contains(ev.relatedTarget)) R.classList.remove('uc-drop'); });
    R.addEventListener('drop',function(ev){ if(!ev.dataTransfer.files.length) return; ev.preventDefault(); R.classList.remove('uc-drop'); adiciona(ev.dataTransfer.files); });
    desenha();
    return { foco:function(){ T.focus(); } };
  }
  // botão fixo + gaveta
  function botao(){ if(document.querySelector('.uc-fab')) return;
    var b=document.createElement('button'); b.className='uc-fab'; b.type='button'; b.title='Assistente com IA'; b.setAttribute('aria-label','Abrir o assistente com IA'); b.textContent='✦'; document.body.appendChild(b);
    var g=null, inst=null;
    b.onclick=function(){ if(g&&!g.hidden){ g.hidden=true; return; } if(!g){ g=document.createElement('div'); g.className='uc-gav'; document.body.appendChild(g); inst=montar(g,{aoFechar:function(){ g.hidden=true; }}); } g.hidden=false; inst.foco(); };
    document.addEventListener('keydown',function(ev){ if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='j'){ ev.preventDefault(); b.click(); } if(ev.key==='Escape'&&g&&!g.hidden) g.hidden=true; });
  }
  window.UniqueChat={montar:montar,botao:botao,aoMudar:null};
})();
