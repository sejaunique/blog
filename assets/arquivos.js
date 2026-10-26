/* Pasta compartilhada: lista de arquivos com busca e filtro por tipo (área do cliente e admin).
   UniqueArquivos.lista(el, arquivos, {admin, quem(email)->nome, aoOcultar(arq, oculto), aoTirarFixo(arq), max}) */
(function(){
  if(window.UniqueArquivos) return;
  var css=''+
  '.uf-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}'+
  '.uf-busca{flex:1;min-width:160px;font:inherit;font-size:.86rem;border:1px solid var(--line,#e4e4e7);border-radius:999px;padding:8px 14px;background:var(--bg,#fff);color:var(--fg,#0b0b0c)}'+
  '.uf-chips{display:flex;flex-wrap:wrap;gap:6px}.uf-chips button{font:inherit;font-size:.74rem;font-weight:600;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:5px 11px;cursor:pointer}'+
  '.uf-chips button[aria-pressed="true"]{background:var(--fg,#0b0b0c);color:var(--bg,#fff);border-color:var(--fg,#0b0b0c)}.uf-chips button small{opacity:.6;margin-left:3px}'+
  '.uf-l{display:grid;gap:6px}.uf-i{display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--line,#e4e4e7);border-radius:14px;background:var(--bg,#fff);color:inherit;text-decoration:none}'+
  '.uf-i:hover{border-color:var(--fg,#0b0b0c)}.uf-i.oc{opacity:.45}'+
  '.uf-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-size:.6rem;font-weight:800;letter-spacing:.04em;color:#fff;background:#6b6b72}.uf-ic img{width:18px;height:18px}'+
  '.uf-ic.doc{background:#2b6cdf}.uf-ic.planilha{background:#0f9d58}.uf-ic.apres{background:#f4b400;color:#000}.uf-ic.pdf{background:#e0055e}.uf-ic.imagem{background:#7c3aed}.uf-ic.video{background:#1e2357}.uf-ic.pasta{background:#8a8a92}.uf-ic.link{background:#0b0b0c}'+
  '.uf-i b{display:block;font-size:.88rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.uf-i small{display:block;font-size:.72rem;color:var(--muted,#6b6b72);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
  '.uf-acts{display:flex;gap:4px}.uf-acts button{font:inherit;font-size:.7rem;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:4px 9px;cursor:pointer}'+
  '.uf-vz{font-size:.84rem;color:var(--muted,#6b6b72);padding:8px 2px}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  var CAT=[['','Todos'],['doc','Docs'],['planilha','Planilhas'],['apres','Apresentações'],['pdf','PDFs'],['imagem','Imagens'],['video','Vídeos'],['pasta','Pastas'],['link','Links']];
  var ROT={doc:'DOC',planilha:'XLS',apres:'PPT',pdf:'PDF',imagem:'IMG',video:'VÍD',pasta:'📁',link:'🔗',outro:'ARQ'};
  function cat(a){ var t=String(a.tipo||''), n=String(a.nome||'').toLowerCase();
    if(a.origem==='fixo'||t==='link') return 'link';
    if(a.pasta||/folder/.test(t)) return 'pasta';
    if(/google-apps\.document|wordprocessing|msword|^text\//.test(t)||/\.(docx?|txt|rtf|odt)$/.test(n)) return 'doc';
    if(/spreadsheet|excel|sheet|csv/.test(t)||/\.(xlsx?|csv|ods)$/.test(n)) return 'planilha';
    if(/presentation|powerpoint/.test(t)||/\.(pptx?|key|odp)$/.test(n)) return 'apres';
    if(/pdf/.test(t)||/\.pdf$/.test(n)) return 'pdf';
    if(/^image\//.test(t)) return 'imagem';
    if(/^video\//.test(t)) return 'video';
    return 'outro'; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function semAc(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
  function lista(el,arquivos,op){
    op=op||{}; var E={q:'',c:''};
    var L=(arquivos||[]).map(function(a){ a._c=cat(a); return a; });
    function quando(d){ try{ return new Date(d).toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'}).replace(/\./g,''); }catch(x){ return ''; } }
    function desenha(){
      var q=semAc(E.q), F=L.filter(function(a){ return (!E.c||a._c===E.c)&&(!q||semAc(a.nome).indexOf(q)>=0); });
      var cont={}; L.forEach(function(a){ cont[a._c]=(cont[a._c]||0)+1; });
      var M=op.max&&!E.q&&!E.c?F.slice(0,op.max):F;
      el.innerHTML='<div class="uf-bar"><input class="uf-busca" type="search" placeholder="Buscar arquivo pelo nome" value="'+esc(E.q)+'" aria-label="Buscar arquivo"><div class="uf-chips" role="group" aria-label="Tipo de arquivo">'+
        CAT.filter(function(c){ return !c[0]||cont[c[0]]; }).map(function(c){ return '<button type="button" data-c="'+c[0]+'" aria-pressed="'+(E.c===c[0])+'">'+c[1]+(c[0]?'<small>'+cont[c[0]]+'</small>':'')+'</button>'; }).join('')+'</div></div>'+
        (M.length?'<div class="uf-l">'+M.map(function(a){ var i=L.indexOf(a);
          var meta=[a.data?quando(a.data):'', a.origem==='compart'?('Compartilhado com '+(a.quem||[]).map(function(m){ return op.quem?op.quem(m):m; }).join(', ')):a.origem==='fixo'?'Link fixado pela Unique':'Pasta da empresa', a.por&&a.origem!=='fixo'?'editado por '+a.por:''].filter(Boolean).join(' · ');
          return '<a class="uf-i'+(a.oculto?' oc':'')+'" href="'+esc(a.link)+'" target="_blank" rel="noopener"><span class="uf-ic '+a._c+'">'+ROT[a._c]+'</span><span style="min-width:0"><b>'+esc(a.nome)+'</b><small>'+esc(meta)+'</small></span>'+
            (op.admin?'<span class="uf-acts">'+(a.origem==='fixo'?'<button type="button" data-tira="'+i+'">Tirar</button>':'<button type="button" data-oc="'+i+'">'+(a.oculto?'Mostrar':'Esconder')+'</button>')+'</span>':'<span class="uf-acts"><small>Abrir ↗</small></span>')+'</a>'; }).join('')+'</div>'+(M.length<F.length?'<p class="uf-vz">+'+(F.length-M.length)+' arquivos · use a busca ou os filtros</p>':''):'<p class="uf-vz">'+(L.length?'Nenhum arquivo com esse filtro.':'Nenhum arquivo ainda.')+'</p>');
      var b=el.querySelector('.uf-busca'); b.oninput=function(){ E.q=b.value; var p=b.selectionStart; desenha(); var n=el.querySelector('.uf-busca'); n.focus(); try{ n.setSelectionRange(p,p); }catch(x){} };
    }
    el.onclick=function(ev){ var c=ev.target.closest('[data-c]'); if(c){ ev.preventDefault(); E.c=E.c===c.dataset.c?'':c.dataset.c; desenha(); return; }
      var o=ev.target.closest('[data-oc]'); if(o){ ev.preventDefault(); var a=L[+o.dataset.oc]; a.oculto=!a.oculto; desenha(); if(op.aoOcultar) op.aoOcultar(a,a.oculto); return; }
      var t=ev.target.closest('[data-tira]'); if(t){ ev.preventDefault(); var x=L[+t.dataset.tira]; L.splice(+t.dataset.tira,1); desenha(); if(op.aoTirarFixo) op.aoTirarFixo(x); } };
    desenha();
  }
  window.UniqueArquivos={lista:lista,cat:cat};
})();
