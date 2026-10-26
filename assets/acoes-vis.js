/* Visões das ações: Kanban e Tabela — o mesmo componente no admin, na ficha da empresa e na área do cliente.
   UniqueAcoes.kanban(el, {rows, colunas:[[status,rótulo,cor]], cartao(row), mover(row,status)->Promise, abre(row)})
   UniqueAcoes.tabela(el, {rows, cols:[{k,t,v(row),s(row),w,fixa}], padrao:[k...], filtros:[{k,t,ops:[[v,t]],f(row,v)}],
                           chave:'nome-para-guardar', abre(row), busca(row), ordem:{k,d}, topo:html, aoMudar(estado)})
   A tabela guarda colunas, ordem e filtros no navegador (chave) e aceita um estado inicial (op.estado) vindo do link. */
(function(){
  if(window.UniqueAcoes) return;
  var css=''+
  '.ua-kb{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(250px,1fr);gap:14px;overflow-x:auto;padding-bottom:8px;align-items:start}'+
  '.ua-col{background:var(--soft,#f4f4f5);border-radius:18px;padding:12px;min-height:120px;transition:outline-color .15s;outline:2px dashed transparent;outline-offset:-2px}'+
  '.ua-col.sobre{outline-color:var(--fg,#0b0b0c)}'+
  '.ua-col-h{display:flex;align-items:center;gap:8px;margin:2px 4px 10px;font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}'+
  '.ua-col-h i{width:9px;height:9px;border-radius:50%;background:#b9b9c4}.ua-col-h .n{margin-left:auto;font-size:.72rem;background:var(--bg,#fff);border-radius:999px;padding:1px 8px;letter-spacing:0}'+
  '.ua-col-h i.am{background:#f59e0b}.ua-col-h i.vd{background:#00c853}.ua-col-h i.vm{background:#e0055e}.ua-col-h i.az{background:#1e2357}'+
  '.ua-card{display:block;width:100%;text-align:left;font:inherit;color:inherit;background:var(--bg,#fff);border:1px solid var(--line,#e4e4e7);border-radius:14px;padding:12px 13px;margin-bottom:8px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.03)}'+
  '.ua-card:hover{border-color:var(--fg,#0b0b0c)}.ua-card[draggable="true"]{cursor:grab}.ua-card.arrasta{opacity:.4}'+
  '.ua-card .k{font-size:.62rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#6b6b72);display:flex;gap:6px;flex-wrap:wrap}'+
  '.ua-card b{display:block;font-size:.92rem;line-height:1.3;margin:5px 0 4px}'+
  '.ua-card p{margin:0 0 8px;font-size:.8rem;line-height:1.45;color:var(--muted,#6b6b72);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}'+
  '.ua-card .pe{display:flex;align-items:center;gap:8px;font-size:.74rem;color:var(--muted,#6b6b72)}.ua-card .pe .atr{color:#e0055e;font-weight:700}.ua-card .pe .dir{margin-left:auto}'+
  '.ua-vz{font-size:.8rem;color:var(--muted,#6b6b72);padding:6px 4px}'+
  '.ua-tb-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}'+
  '.ua-tb-bar .ua-busca{flex:1;min-width:180px;font:inherit;font-size:.86rem;border:1px solid var(--line,#e4e4e7);border-radius:999px;padding:9px 16px;background:var(--bg,#fff);color:var(--fg,#0b0b0c)}'+
  '.ua-bt{font:inherit;font-size:.8rem;font-weight:600;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:8px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}'+
  '.ua-bt:hover,.ua-bt[aria-expanded="true"]{border-color:var(--fg,#0b0b0c)}.ua-bt .n{background:var(--fg,#0b0b0c);color:var(--bg,#fff);border-radius:999px;font-size:.66rem;padding:0 6px}'+
  '.ua-tw{overflow-x:auto;border:1px solid var(--line,#e4e4e7);border-radius:16px;background:var(--bg,#fff)}'+
  '.ua-t{width:100%;border-collapse:collapse;font-size:.86rem}.ua-t th{text-align:left;font-size:.66rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#6b6b72);padding:12px 12px;border-bottom:1px solid var(--line,#e4e4e7);white-space:nowrap;cursor:pointer;user-select:none;background:var(--soft,#f4f4f5);position:sticky;top:0}'+
  '.ua-t th:hover{color:var(--fg,#0b0b0c)}.ua-t th .sx{margin-left:4px;color:var(--fg,#0b0b0c)}'+
  '.ua-t td{padding:11px 12px;border-bottom:1px solid var(--line,#e4e4e7);vertical-align:middle}.ua-t tr:last-child td{border-bottom:0}'+
  '.ua-t tbody tr{cursor:pointer}.ua-t tbody tr:hover td{background:var(--soft,#f4f4f5)}'+
  '.ua-t td.tit b{display:block;font-weight:600}.ua-t td.tit small{display:block;color:var(--muted,#6b6b72);font-size:.76rem;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '.ua-pop{position:absolute;z-index:60;background:var(--bg,#fff);color:var(--fg,#0b0b0c);border:1px solid var(--line,#e4e4e7);border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.16);padding:12px;min-width:260px;max-height:440px;overflow:auto;font-size:.86rem}'+
  '.ua-pop h5{margin:2px 2px 8px;font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#6b6b72)}'+
  '.ua-pop label.op{display:flex;align-items:center;gap:8px;padding:6px 6px;border-radius:10px;cursor:pointer}.ua-pop label.op:hover{background:var(--soft,#f4f4f5)}'+
  '.ua-pop label.op .mv{margin-left:auto;display:flex;gap:2px}.ua-pop label.op .mv button{font:inherit;border:0;background:none;cursor:pointer;color:var(--muted,#6b6b72);padding:0 4px;font-size:.9rem}'+
  '.ua-pop .lin{display:grid;gap:4px;margin-bottom:10px}.ua-pop select,.ua-pop input[type=date]{font:inherit;font-size:.84rem;border:1px solid var(--line,#e4e4e7);border-radius:10px;padding:7px 9px;background:var(--bg,#fff);color:var(--fg,#0b0b0c);width:100%}'+
  '.ua-pop .dupla{display:grid;grid-template-columns:1fr 1fr;gap:6px}.ua-pop .rod{display:flex;justify-content:space-between;gap:8px;margin-top:6px}'+
  '.ua-pop label.op[draggable="true"]{cursor:grab}.ua-pop label.op.sobre{background:var(--soft,#f4f4f5);outline:1px dashed var(--fg,#0b0b0c)}'+
  '.ua-chips{display:flex;flex-wrap:wrap;gap:6px;margin:-4px 0 12px}.ua-chip{font-size:.74rem;background:var(--soft,#f4f4f5);border-radius:999px;padding:4px 6px 4px 11px;display:inline-flex;gap:6px;align-items:center}.ua-chip button{font:inherit;border:0;background:var(--line,#e4e4e7);border-radius:50%;width:18px;height:18px;line-height:18px;padding:0;cursor:pointer;color:var(--fg,#0b0b0c)}'+
  '@media(max-width:700px){.ua-kb{grid-auto-columns:82%}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function semAc(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
  function ler(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(x){ return null; } }
  function grava(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(x){} }
  function fechaPops(){ document.querySelectorAll('.ua-pop').forEach(function(p){ if(p._dono) p._dono.setAttribute('aria-expanded','false'); p.remove(); }); }
  function pop(btn,html){
    fechaPops(); var p=document.createElement('div'); p.className='ua-pop'; p.innerHTML=html; p._dono=btn; document.body.appendChild(p);
    var r=btn.getBoundingClientRect(); p.style.top=(r.bottom+window.scrollY+6)+'px'; p.style.left=Math.max(8,Math.min(r.left+window.scrollX,window.scrollX+document.documentElement.clientWidth-p.offsetWidth-8))+'px';
    btn.setAttribute('aria-expanded','true');
    setTimeout(function(){ document.addEventListener('mousedown',function fora(ev){ if(!p.contains(ev.target)&&!btn.contains(ev.target)){ p.remove(); btn.setAttribute('aria-expanded','false'); document.removeEventListener('mousedown',fora); } }); },0);
    return p;
  }

  // ---------- KANBAN ----------
  function kanban(el,op){
    var rows=op.rows||[], col=op.colunas;
    el.innerHTML='<div class="ua-kb">'+col.map(function(c){ var L=rows.filter(function(r){ return (op.statusDe?op.statusDe(r):r.status)===c[0]; });
      return '<section class="ua-col" data-st="'+esc(c[0])+'"><div class="ua-col-h"><i class="'+esc(c[2]||'')+'"></i>'+esc(c[1])+'<span class="n">'+L.length+'</span></div>'+
        (L.length?L.map(function(r,i){ return '<div class="ua-card" role="button" tabindex="0"'+(op.mover?' draggable="true"':'')+' data-i="'+rows.indexOf(r)+'">'+op.cartao(r)+'</div>'; }).join(''):'<div class="ua-vz">Nada aqui.</div>')+'</section>'; }).join('')+'</div>';
    var arrastado=null;
    el.onclick=function(ev){ var c=ev.target.closest('.ua-card'); if(c&&!ev.target.closest('a')) op.abre(rows[+c.dataset.i]); };
    el.onkeydown=function(ev){ if(ev.key==='Enter'){ var c=ev.target.closest('.ua-card'); if(c) op.abre(rows[+c.dataset.i]); } };
    if(!op.mover) return;
    el.ondragstart=function(ev){ var c=ev.target.closest('.ua-card'); if(!c) return; arrastado=rows[+c.dataset.i]; c.classList.add('arrasta'); ev.dataTransfer.effectAllowed='move'; try{ ev.dataTransfer.setData('text/plain',c.dataset.i); }catch(x){} };
    el.ondragend=function(ev){ var c=ev.target.closest('.ua-card'); if(c) c.classList.remove('arrasta'); el.querySelectorAll('.sobre').forEach(function(x){x.classList.remove('sobre');}); };
    el.ondragover=function(ev){ var s=ev.target.closest('.ua-col'); if(!s||!arrastado) return; ev.preventDefault(); el.querySelectorAll('.ua-col.sobre').forEach(function(x){ if(x!==s) x.classList.remove('sobre'); }); s.classList.add('sobre'); };
    el.ondrop=function(ev){ var s=ev.target.closest('.ua-col'); if(!s||!arrastado) return; ev.preventDefault(); var st=s.dataset.st, r=arrastado; arrastado=null; s.classList.remove('sobre');
      if((op.statusDe?op.statusDe(r):r.status)===st) return; op.mover(r,st); };
  }

  // ---------- TABELA ----------
  function tabela(el,op){
    var COL={}; op.cols.forEach(function(c){ COL[c.k]=c; });
    var salvo=op.estado||ler(op.chave)||{};
    var E={ cols:(salvo.cols||op.padrao).filter(function(k){return COL[k]&&!COL[k].fixa;}), ordem:salvo.ordem||op.ordem||null, f:salvo.f||{}, q:'' };
    function guarda(){ grava(op.chave,{cols:E.cols,ordem:E.ordem,f:E.f}); if(op.aoMudar) op.aoMudar({cols:E.cols,ordem:E.ordem,f:E.f}); }
    var fixas=op.cols.filter(function(c){return c.fixa;}).map(function(c){return c.k;});
    function nFiltros(){ return Object.keys(E.f).filter(function(k){return E.f[k]!==''&&E.f[k]!=null&&E.f[k]!==false;}).length; }
    function filtra(){ var q=semAc(E.q); return (op.rows||[]).filter(function(r){
      if(q&&semAc(op.busca?op.busca(r):'').indexOf(q)<0) return false;
      return (op.filtros||[]).every(function(f){ var v=E.f[f.k]; return v===''||v==null||v===false||f.f(r,v); }); }); }
    function ordena(L){ if(!E.ordem||!COL[E.ordem.k]) return L; var c=COL[E.ordem.k], d=E.ordem.d==='desc'?-1:1;
      return L.slice().sort(function(a,b){ var x=c.s?c.s(a):'', y=c.s?c.s(b):''; var vx=(x===''||x==null), vy=(y===''||y==null); if(vx&&vy) return 0; if(vx) return 1; if(vy) return -1; return (x<y?-1:x>y?1:0)*d; }); }
    function monta(){
      var vis=fixas.concat(E.cols), L=ordena(filtra()), nf=nFiltros();
      el.innerHTML='<div class="ua-tb-bar"><input class="ua-busca" type="search" placeholder="Buscar" value="'+esc(E.q)+'" aria-label="Buscar">'+
        ((op.filtros||[]).length?'<button type="button" class="ua-bt" data-ua="filtros" aria-expanded="false">Filtros'+(nf?' <span class="n">'+nf+'</span>':'')+'</button>':'')+
        '<button type="button" class="ua-bt" data-ua="ordem" aria-expanded="false">Ordenar'+(E.ordem&&COL[E.ordem.k]?': '+esc(COL[E.ordem.k].t)+(E.ordem.d==='desc'?' ↓':' ↑'):'')+'</button>'+
        '<button type="button" class="ua-bt" data-ua="cols" aria-expanded="false">Colunas</button>'+(op.topo||'')+'</div>'+
        (nf?'<div class="ua-chips">'+(op.filtros||[]).filter(function(f){ var v=E.f[f.k]; return !(v===''||v==null||v===false); }).map(function(f){ var v=E.f[f.k], o=(f.ops||[]).filter(function(x){return x[0]===v;})[0]; return '<span class="ua-chip">'+esc(f.t)+': '+esc(f.tipo==='chk'?'sim':f.tipo==='data'?v:(o?o[1]:v))+'<button type="button" data-tira="'+esc(f.k)+'" aria-label="Tirar filtro">×</button></span>'; }).join('')+'</div>':'')+
        '<div class="ua-tw"><table class="ua-t"><thead><tr>'+vis.map(function(k){ var c=COL[k]; return '<th data-k="'+k+'"'+(c.w?' style="'+(c.fixa?'min-width':'width')+':'+c.w+'"':'')+' title="Ordenar por '+esc(c.t)+'">'+esc(c.t)+(E.ordem&&E.ordem.k===k?'<span class="sx">'+(E.ordem.d==='desc'?'↓':'↑')+'</span>':'')+'</th>'; }).join('')+'</tr></thead><tbody>'+
        (L.length?L.map(function(r){ return '<tr tabindex="0" data-i="'+op.rows.indexOf(r)+'">'+vis.map(function(k){ return '<td'+(k===fixas[0]?' class="tit"':'')+'>'+COL[k].v(r)+'</td>'; }).join('')+'</tr>'; }).join(''):'<tr><td colspan="'+vis.length+'"><div class="ua-vz" style="padding:18px">Nada com esses filtros.</div></td></tr>')+
        '</tbody></table></div>';
      var bu=el.querySelector('.ua-busca'); bu.oninput=function(){ E.q=bu.value; var p=bu.selectionStart; monta(); var n=el.querySelector('.ua-busca'); n.focus(); try{ n.setSelectionRange(p,p); }catch(x){} };
    }
    el.onclick=function(ev){
      var th=ev.target.closest('th[data-k]'); if(th){ var k=th.dataset.k; E.ordem=E.ordem&&E.ordem.k===k?(E.ordem.d==='asc'?{k:k,d:'desc'}:null):{k:k,d:'asc'}; guarda(); monta(); return; }
      var tira=ev.target.closest('[data-tira]'); if(tira){ delete E.f[tira.dataset.tira]; guarda(); monta(); return; }
      var tr=ev.target.closest('tbody tr[data-i]'); if(tr&&!ev.target.closest('a,button,select,input')){ op.abre(op.rows[+tr.dataset.i]); return; }
      var b=ev.target.closest('[data-ua]'); if(!b) return;
      if(b.dataset.ua==='cols') popCols(b); if(b.dataset.ua==='ordem') popOrdem(b); if(b.dataset.ua==='filtros') popFiltros(b);
    };
    el.onkeydown=function(ev){ if(ev.key!=='Enter') return; var tr=ev.target.closest('tbody tr[data-i]'); if(tr) op.abre(op.rows[+tr.dataset.i]); };
    function popCols(b){
      var todas=E.cols.concat(op.cols.filter(function(c){return !c.fixa&&E.cols.indexOf(c.k)<0;}).map(function(c){return c.k;}));
      var p=pop(b,'<h5>Colunas</h5><p style="margin:0 2px 8px;font-size:.74rem;color:var(--muted)">Marque o que quer ver. Arraste ou use as setas para mudar a ordem.</p>'+todas.map(function(k){ return '<label class="op" draggable="true" data-col="'+k+'"><input type="checkbox" value="'+k+'"'+(E.cols.indexOf(k)>=0?' checked':'')+'> '+esc(COL[k].t)+'<span class="mv"><button type="button" data-up="'+k+'" title="Subir">↑</button><button type="button" data-dn="'+k+'" title="Descer">↓</button></span></label>'; }).join('')+
        '<div class="rod"><button type="button" class="ua-bt" data-padrao>Padrão</button><button type="button" class="ua-bt" data-fecha>Pronto</button></div>');
      var ordemAtual=function(){ return [].map.call(p.querySelectorAll('label.op'),function(l){return l.dataset.col;}); };
      var aplica=function(){ var ord=ordemAtual(); E.cols=ord.filter(function(k){ return p.querySelector('input[value="'+k+'"]').checked; }); guarda(); monta(); };
      p.onchange=aplica;
      p.onclick=function(ev){ var u=ev.target.closest('[data-up],[data-dn]'); if(u){ ev.preventDefault(); var l=u.closest('label'); if(u.dataset.up&&l.previousElementSibling&&l.previousElementSibling.matches('label.op')) l.parentNode.insertBefore(l,l.previousElementSibling); if(u.dataset.dn&&l.nextElementSibling&&l.nextElementSibling.matches('label.op')) l.parentNode.insertBefore(l.nextElementSibling,l); aplica(); return; }
        if(ev.target.closest('[data-padrao]')){ E.cols=op.padrao.slice(); guarda(); monta(); fechaPops(); }
        if(ev.target.closest('[data-fecha]')) fechaPops(); };
      var arr=null;
      p.ondragstart=function(ev){ arr=ev.target.closest('label.op'); };
      p.ondragover=function(ev){ var l=ev.target.closest('label.op'); if(!l||!arr||l===arr) return; ev.preventDefault(); p.querySelectorAll('.sobre').forEach(function(x){x.classList.remove('sobre');}); l.classList.add('sobre'); };
      p.ondrop=function(ev){ var l=ev.target.closest('label.op'); if(!l||!arr) return; ev.preventDefault(); l.classList.remove('sobre'); var r=l.getBoundingClientRect(); l.parentNode.insertBefore(arr,ev.clientY>r.top+r.height/2?l.nextSibling:l); arr=null; aplica(); };
    }
    function popOrdem(b){
      var p=pop(b,'<h5>Ordenar por</h5><div class="lin"><select data-ok>'+'<option value="">Padrão</option>'+op.cols.filter(function(c){return c.s;}).map(function(c){ return '<option value="'+c.k+'"'+(E.ordem&&E.ordem.k===c.k?' selected':'')+'>'+esc(c.t)+'</option>'; }).join('')+'</select>'+
        '<select data-d><option value="asc"'+(E.ordem&&E.ordem.d==='desc'?'':' selected')+'>Crescente (A→Z, mais cedo primeiro)</option><option value="desc"'+(E.ordem&&E.ordem.d==='desc'?' selected':'')+'>Decrescente (Z→A, mais tarde primeiro)</option></select></div>'+
        (op.atalhos||[]).map(function(a,i){ return '<button type="button" class="ua-bt" style="margin:0 6px 6px 0" data-at="'+i+'">'+esc(a[0])+'</button>'; }).join(''));
      p.onchange=function(){ var k=p.querySelector('[data-ok]').value; E.ordem=k?{k:k,d:p.querySelector('[data-d]').value}:null; guarda(); monta(); };
      p.onclick=function(ev){ var a=ev.target.closest('[data-at]'); if(a){ E.ordem=op.atalhos[+a.dataset.at][1]; guarda(); monta(); fechaPops(); } };
    }
    function popFiltros(b){
      var p=pop(b,'<h5>Filtros</h5>'+(op.filtros||[]).map(function(f){ var v=E.f[f.k];
        if(f.tipo==='chk') return '<label class="op"><input type="checkbox" data-f="'+f.k+'"'+(v?' checked':'')+'> '+esc(f.t)+'</label>';
        if(f.tipo==='data') return '<div class="lin"><small>'+esc(f.t)+'</small><input type="date" data-f="'+f.k+'" value="'+esc(v||'')+'"></div>';
        return '<div class="lin"><small>'+esc(f.t)+'</small><select data-f="'+f.k+'"><option value="">Todos</option>'+f.ops.map(function(o){ return '<option value="'+esc(o[0])+'"'+(o[0]===v?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select></div>'; }).join('')+
        '<div class="rod"><button type="button" class="ua-bt" data-limpa>Limpar filtros</button><button type="button" class="ua-bt" data-fecha>Pronto</button></div>');
      p.onchange=function(ev){ var c=ev.target; if(!c.dataset.f) return; E.f[c.dataset.f]=c.type==='checkbox'?c.checked:c.value; guarda(); monta(); };
      p.onclick=function(ev){ if(ev.target.closest('[data-limpa]')){ E.f={}; guarda(); monta(); fechaPops(); } if(ev.target.closest('[data-fecha]')) fechaPops(); };
    }
    monta();
    return { estado:function(){ return {cols:E.cols,ordem:E.ordem,f:E.f}; } };
  }
  window.UniqueAcoes={kanban:kanban,tabela:tabela,esc:esc};
})();
