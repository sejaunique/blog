/* Canivete de Vendas: grade de conteúdos (palestras, aulas, tutoriais, iscas, ferramentas, posts, vídeos).
   UniqueCanivete.grade(el, itens, {admin, nomeEmp(slug), aoEditar(i), aoLiberar(i, btn), aoExcluir(i), aoLeitura(i)}) */
(function(){
  if(window.UniqueCanivete) return;
  var css=''+
  '.cv-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}.cv-busca{flex:1;min-width:180px;font:inherit;font-size:.88rem;border:1px solid var(--line,#e4e4e7);border-radius:999px;padding:9px 16px;background:var(--bg,#fff);color:var(--fg,#0b0b0c)}'+
  '.cv-chips{display:flex;flex-wrap:wrap;gap:6px}.cv-chips button{font:inherit;font-size:.76rem;font-weight:700;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:6px 12px;cursor:pointer}.cv-chips button[aria-pressed="true"]{background:var(--fg,#0b0b0c);color:var(--bg,#fff);border-color:var(--fg,#0b0b0c)}.cv-chips small{opacity:.6;margin-left:3px}'+
  '.cv-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}'+
  '.cv-c{border:1px solid var(--line,#e4e4e7);border-radius:20px;overflow:hidden;background:var(--bg,#fff);display:flex;flex-direction:column;color:inherit;text-decoration:none}.cv-c:hover{border-color:var(--fg,#0b0b0c)}'+
  '.cv-capa{aspect-ratio:16/9;background:#0b0b0c;display:grid;place-items:center;color:#00e676;font-size:2rem;position:relative;overflow:hidden}.cv-capa img{width:100%;height:100%;object-fit:cover}.cv-capa .tp{position:absolute;left:10px;top:10px;font-size:.62rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;background:#fff;color:#000;border-radius:999px;padding:4px 9px}'+
  '.cv-capa.palestra{background:#1e2357}.cv-capa.aula{background:#0b0b0c}.cv-capa.tutorial{background:#2b6cdf}.cv-capa.isca{background:#e0055e;color:#fff}.cv-capa.ferramenta{background:#0f9d58;color:#fff}.cv-capa.post{background:#f4f4f5;color:#0b0b0c}'+
  '.cv-in{padding:14px 15px;display:grid;gap:6px;flex:1;align-content:start}.cv-in b{font-size:.98rem;line-height:1.3}.cv-in p{margin:0;font-size:.8rem;line-height:1.45;color:var(--muted,#6b6b72);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}'+
  '.cv-tags{display:flex;flex-wrap:wrap;gap:4px}.cv-tags span{font-size:.66rem;background:var(--soft,#f4f4f5);border-radius:999px;padding:2px 8px}'+
  '.cv-lib{font-size:.72rem;font-weight:700}.cv-lib.fechado{color:var(--muted,#6b6b72)}.cv-lib.aberto{color:#078a46}'+
  '.cv-acts{display:flex;flex-wrap:wrap;gap:5px;padding:0 15px 14px}.cv-acts button{font:inherit;font-size:.72rem;font-weight:700;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:5px 10px;cursor:pointer}.cv-acts button.lib{background:#00e676;border-color:#00e676;color:#000}'+
  '.cv-vz{border:1.5px dashed var(--line,#e4e4e7);border-radius:20px;padding:26px;text-align:center;color:var(--muted,#6b6b72)}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  var NOME={palestra:'Palestras',aula:'Aulas',tutorial:'Tutoriais',isca:'Iscas',ferramenta:'Ferramentas',video:'Vídeos',post:'Posts',material:'Materiais'};
  var UM={palestra:'Palestra',aula:'Aula',tutorial:'Tutorial',isca:'Isca',ferramenta:'Ferramenta',video:'Vídeo',post:'Post',material:'Material'};
  var IC={palestra:'🎤',aula:'🎓',tutorial:'🛠',isca:'🎯',ferramenta:'🧰',video:'▶',post:'✎',material:'📄'};
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function semAc(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
  function grade(el,itens,op){
    op=op||{}; var E={q:'',t:'',lib:''};
    function libTxt(i){ if(i.destino==='todos') return '<span class="cv-lib aberto">● Liberado para todos</span>'; var n=(i.destino||[]).length; return n?'<span class="cv-lib aberto">● Liberado para '+(n===1&&op.nomeEmp?esc(op.nomeEmp(i.destino[0])):n+' empresas')+'</span>':'<span class="cv-lib fechado">○ Fechado (ninguém vê)</span>'; }
    function desenha(){
      var q=semAc(E.q), cont={}; itens.forEach(function(i){ cont[i.tipo]=(cont[i.tipo]||0)+1; });
      var L=itens.filter(function(i){ return (!E.t||i.tipo===E.t)&&(!q||semAc(i.titulo+' '+(i.descricao||'')+' '+(i.tags||[]).join(' ')).indexOf(q)>=0)&&(!E.lib||(E.lib==='aberto'?(i.destino==='todos'||(i.destino||[]).length):!(i.destino==='todos'||(i.destino||[]).length))); });
      el.innerHTML='<div class="cv-bar"><input class="cv-busca" type="search" placeholder="Buscar no Canivete" value="'+esc(E.q)+'" aria-label="Buscar"><div class="cv-chips"><button type="button" data-t="" aria-pressed="'+(!E.t)+'">Tudo<small>'+itens.length+'</small></button>'+
        Object.keys(NOME).filter(function(k){return cont[k];}).map(function(k){ return '<button type="button" data-t="'+k+'" aria-pressed="'+(E.t===k)+'">'+NOME[k]+'<small>'+cont[k]+'</small></button>'; }).join('')+
        (op.admin?'<button type="button" data-lib="aberto" aria-pressed="'+(E.lib==='aberto')+'">Liberados</button><button type="button" data-lib="fechado" aria-pressed="'+(E.lib==='fechado')+'">Fechados</button>':'')+'</div></div>'+
        (L.length?'<div class="cv-g">'+L.map(function(i){ var k=itens.indexOf(i);
          var corpo='<div class="cv-capa '+esc(i.tipo)+'">'+(i.capa?'<img src="'+esc(i.capa)+'" alt="" loading="lazy">':IC[i.tipo]||'📄')+'<span class="tp">'+esc(UM[i.tipo]||'Material')+'</span></div><div class="cv-in"><b>'+esc(i.titulo)+'</b>'+(i.descricao?'<p>'+esc(i.descricao)+'</p>':'')+((i.tags||[]).length?'<div class="cv-tags">'+i.tags.map(function(t){return '<span>'+esc(t)+'</span>';}).join('')+'</div>':'')+(op.admin?libTxt(i):'')+'</div>';
          if(!op.admin) return '<a class="cv-c" href="'+esc(i.link)+'" target="_blank" rel="noopener">'+corpo+'</a>';
          return '<div class="cv-c" data-k="'+k+'">'+corpo+'<div class="cv-acts"><button type="button" class="lib" data-a="lib">Liberar</button><button type="button" data-a="ed">Editar</button>'+(op.aoLeitura?'<button type="button" data-a="leit">+ Leitura</button>':'')+'<button type="button" data-a="abrir">Abrir ↗</button>'+(i.origem!=='site'?'<button type="button" data-a="del">Excluir</button>':'')+'</div></div>'; }).join('')+'</div>':'<div class="cv-vz">'+(itens.length?'Nada com esse filtro.':(op.admin?'A biblioteca está vazia. Use “+ Adicionar” ou “Adicionar vários”.':'A Unique ainda não liberou conteúdos para a sua empresa.'))+'</div>');
      var b=el.querySelector('.cv-busca'); b.oninput=function(){ E.q=b.value; var p=b.selectionStart; desenha(); var n=el.querySelector('.cv-busca'); n.focus(); try{ n.setSelectionRange(p,p); }catch(x){} };
    }
    el.onclick=function(ev){ var c=ev.target.closest('[data-t]'); if(c){ E.t=c.dataset.t; desenha(); return; } var l=ev.target.closest('[data-lib]'); if(l){ E.lib=E.lib===l.dataset.lib?'':l.dataset.lib; desenha(); return; }
      var a=ev.target.closest('[data-a]'); if(!a) return; var i=itens[+a.closest('[data-k]').dataset.k];
      if(a.dataset.a==='lib'&&op.aoLiberar) op.aoLiberar(i,a); if(a.dataset.a==='ed'&&op.aoEditar) op.aoEditar(i); if(a.dataset.a==='leit'&&op.aoLeitura) op.aoLeitura(i,a);
      if(a.dataset.a==='abrir') window.open(i.link,'_blank','noopener');
      if(a.dataset.a==='del'){ if(a.dataset.ok!=='1'){ a.dataset.ok='1'; a.textContent='Confirmar'; return; } if(op.aoExcluir) op.aoExcluir(i); } };
    desenha();
  }
  window.UniqueCanivete={grade:grade,NOME:UM};
})();
