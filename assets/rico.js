/* Texto formatado das ações (descrição).
   - UniqueRico.editor(caixa, html, aoSalvar): barra de formatação + área editável (admin).
   - Também injeta o CSS que mostra o texto formatado (cores da marca, marca-texto, checklist) no admin, no painel e no link público.
   O servidor limpa o HTML (api/_area/rico.js): só ficam as tags e cores da lista. */
(function(){
  if(window.UniqueRico) return;
  var css=''+
  '.c-magenta{color:#e0055e}.c-marinho{color:#1e2357}.c-verde{color:#00a854}.c-cinza{color:#6b6b72}'+
  '[data-theme="dark"] .c-marinho{color:#9aa1f0}[data-theme="dark"] .c-magenta{color:#ff4f93}[data-theme="dark"] .c-verde{color:#00e676}[data-theme="dark"] .c-cinza{color:#a1a1aa}'+
  'mark.m-verde{background:#b9f6ca;color:inherit;padding:0 .12em;border-radius:3px}mark.m-magenta{background:#ffd6e6;color:inherit;padding:0 .12em;border-radius:3px}mark.m-cinza{background:#e8e8ea;color:inherit;padding:0 .12em;border-radius:3px}'+
  '[data-theme="dark"] mark.m-verde{background:#0b5d33;color:#fff}[data-theme="dark"] mark.m-magenta{background:#6d0a33;color:#fff}[data-theme="dark"] mark.m-cinza{background:#3a3a40;color:#fff}'+
  '.rq-txt ul.ck,.rq-ed ul.ck{list-style:none;padding-left:0}.rq-txt ul.ck li,.rq-ed ul.ck li{position:relative;padding-left:30px}'+
  '.rq-txt ul.ck li::before,.rq-ed ul.ck li::before{content:"";position:absolute;left:0;top:.28em;width:16px;height:16px;border:1.5px solid currentColor;border-radius:5px;opacity:.6}'+
  '.rq-txt ul.ck li.ok::before,.rq-ed ul.ck li.ok::before{content:"✓";background:#00e676;border-color:#00e676;color:#000;opacity:1;font-size:12px;line-height:16px;text-align:center;font-weight:800}'+
  '.rq-txt ul.ck li.ok,.rq-ed ul.ck li.ok{text-decoration:line-through;opacity:.7}'+
  '.rq-txt blockquote,.rq-ed blockquote{border-left:3px solid #00e676;margin:1em 0;padding:.2em 0 .2em 16px;font-style:italic}'+
  '.rq-txt h3,.rq-ed h3{font-size:1.35em;letter-spacing:-.02em;margin:1.2em 0 .4em}.rq-txt h4,.rq-ed h4{font-size:1.1em;margin:1em 0 .3em}'+
  '.rq-txt p,.rq-ed p{margin:.5em 0}.rq-txt a,.rq-ed a{text-decoration:underline;text-decoration-color:#00e676;text-underline-offset:3px}'+
  '.rq{border:1px solid var(--line,#e4e4e7);border-radius:14px;background:var(--bg,#fff);overflow:hidden}'+
  '.rq-bar{display:flex;flex-wrap:wrap;gap:2px;align-items:center;padding:6px;border-bottom:1px solid var(--line,#e4e4e7);background:var(--soft,#f4f4f5);position:sticky;top:0;z-index:2}'+
  '.rq-bar button{font:inherit;font-size:.8rem;min-width:30px;height:30px;padding:0 8px;border:0;background:none;color:var(--fg,#0b0b0c);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px}'+
  '.rq-bar button:hover,.rq-bar button[aria-expanded="true"]{background:var(--bg,#fff)}.rq-bar i.sep{width:1px;height:20px;background:var(--line,#e4e4e7);margin:0 4px}'+
  '.rq-bar select{font:inherit;font-size:.78rem;height:30px;border:0;background:none;color:var(--fg,#0b0b0c);border-radius:8px;padding:0 6px;cursor:pointer}'+
  '.rq-pal{position:fixed;z-index:10000;background:var(--bg,#fff);border:1px solid var(--line,#e4e4e7);border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.14);padding:10px;display:grid;gap:8px;min-width:220px}'+
  '.rq-pal small{font-size:.66rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#6b6b72)}'+
  '.rq-pal div{display:flex;gap:6px;flex-wrap:wrap}.rq-pal button{width:28px;height:28px;border-radius:50%;border:2px solid var(--bg,#fff);box-shadow:0 0 0 1px var(--line,#e4e4e7);cursor:pointer;padding:0}'+
  '.rq-pal button.tx{width:auto;border-radius:999px;padding:0 10px;font:inherit;font-size:.74rem;background:var(--soft,#f4f4f5);color:var(--fg,#0b0b0c)}'+
  '.rq-ed{min-height:160px;padding:14px 16px;outline:none;font-size:.95rem;line-height:1.65;color:var(--fg,#0b0b0c);max-height:none}'+
  '.rq-ed:empty::before{content:attr(data-ph);color:var(--muted,#9a9aa2)}'+
  '.rq-st{font-size:.72rem;color:var(--muted,#6b6b72);padding:4px 12px 8px;text-align:right;min-height:1em}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var CORES=[['magenta','#e0055e','Magenta'],['marinho','#1e2357','Azul-marinho'],['verde','#00a854','Verde'],['cinza','#6b6b72','Cinza']];
  var MARCAS=[['verde','#b9f6ca','Verde'],['magenta','#ffd6e6','Rosa'],['cinza','#e8e8ea','Cinza']];
  var B=function(c,t,h){ return '<button type="button" data-c="'+c+'" title="'+t+'">'+h+'</button>'; };
  var BARRA=''+
    '<select data-c="bloco" title="Tamanho do texto"><option value="p">Texto</option><option value="h3">Título</option><option value="h4">Subtítulo</option></select><i class="sep"></i>'+
    B('bold','Negrito (Ctrl+B)','<b>B</b>')+B('italic','Itálico (Ctrl+I)','<i style="font-family:serif">I</i>')+B('underline','Sublinhado (Ctrl+U)','<u>U</u>')+B('strikeThrough','Riscado','<s>S</s>')+
    '<i class="sep"></i>'+B('cor','Cor do texto e marca-texto','<span style="border-bottom:3px solid #e0055e;line-height:1">A</span> ▾')+'<i class="sep"></i>'+
    B('insertUnorderedList','Lista com marcadores','• Lista')+B('insertOrderedList','Lista numerada','1. Lista')+B('ck','Checklist','☑ Checklist')+B('blockquote','Citação','❝')+
    '<i class="sep"></i>'+B('link','Link','🔗')+B('removeFormat','Limpar formatação','⌫');

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function deTexto(t){ t=String(t||'').trim(); if(!t) return ''; return t.split(/\n{2,}/).map(function(p){ return '<p>'+esc(p).replace(/\n/g,'<br>')+'</p>'; }).join(''); }

  function editor(caixa,html,aoSalvar,op){
    op=op||{};
    caixa.classList.add('rq');
    caixa.innerHTML='<div class="rq-bar" role="toolbar" aria-label="Formatação">'+BARRA+'</div><div class="rq-ed rq-txt" contenteditable="true" data-ph="'+esc(op.ph||'Escreva o contexto, o objetivo e o passo a passo…')+'"></div><div class="rq-st" aria-live="polite"></div>';
    var ed=caixa.querySelector('.rq-ed'), bar=caixa.querySelector('.rq-bar'), stt=caixa.querySelector('.rq-st'), sel=bar.querySelector('select');
    ed.innerHTML=html||'';
    try{ document.execCommand('styleWithCSS',false,false); document.execCommand('defaultParagraphSeparator',false,'p'); }catch(x){}
    var ult=ed.innerHTML, tm=null, salvo=null;
    function salva(){ clearTimeout(tm); if(ed.innerHTML===ult) return; ult=ed.innerHTML; stt.textContent='Salvando…'; var r=aoSalvar(ed.innerHTML); if(r&&r.then) r.then(function(){ stt.textContent='Salvo'; setTimeout(function(){ if(stt.textContent==='Salvo') stt.textContent=''; },1600); }); else stt.textContent=''; }
    function guardaSel(){ var s=window.getSelection(); if(s.rangeCount&&ed.contains(s.anchorNode)) salvo=s.getRangeAt(0).cloneRange(); }
    function voltaSel(){ ed.focus(); if(salvo){ var s=window.getSelection(); s.removeAllRanges(); s.addRange(salvo); } }
    function blocoAtual(){ var s=window.getSelection(); if(!s.rangeCount) return null; var n=s.anchorNode; while(n&&n!==ed){ if(n.nodeType===1&&/^(P|H3|H4|BLOCKQUOTE|LI)$/.test(n.tagName)) return n; n=n.parentNode; } return null; }
    function atualizaBloco(){ var b=blocoAtual(); sel.value=b&&(b.tagName==='H3'||b.tagName==='H4')?b.tagName.toLowerCase():'p'; }
    function envolve(tag,cls){
      voltaSel(); var s=window.getSelection(); if(!s.rangeCount) return; var r=s.getRangeAt(0); if(r.collapsed) return;
      var frag=r.extractContents();
      // tira cores antigas do mesmo tipo dentro do trecho
      [].forEach.call(frag.querySelectorAll(tag==='span'?'span[class^="c-"],font':'mark'),function(x){ while(x.firstChild) x.parentNode.insertBefore(x.firstChild,x); x.remove(); });
      if(cls){ var w=document.createElement(tag); w.className=cls; w.appendChild(frag); r.insertNode(w); s.removeAllRanges(); var nr=document.createRange(); nr.selectNodeContents(w); s.addRange(nr); }
      else { var t=document.createElement('span'); t.appendChild(frag); r.insertNode(t); while(t.firstChild) t.parentNode.insertBefore(t.firstChild,t); t.remove(); }
      ed.dispatchEvent(new Event('input'));
    }
    function paleta(btn){
      document.querySelectorAll('.rq-pal').forEach(function(p){p.remove();});
      var p=document.createElement('div'); p.className='rq-pal'; var r=btn.getBoundingClientRect();
      p.style.top=Math.min(r.bottom+6,window.innerHeight-170)+'px'; p.style.left=Math.max(8,Math.min(r.left,window.innerWidth-240))+'px';
      p.innerHTML='<small>Cor do texto</small><div>'+CORES.map(function(c){ return '<button type="button" data-cor="'+c[0]+'" title="'+c[2]+'" style="background:'+c[1]+'"></button>'; }).join('')+'<button type="button" class="tx" data-cor="">Padrão</button></div>'+
        '<small>Marca-texto</small><div>'+MARCAS.map(function(c){ return '<button type="button" data-marca="'+c[0]+'" title="'+c[2]+'" style="background:'+c[1]+'"></button>'; }).join('')+'<button type="button" class="tx" data-marca="">Sem</button></div>';
      document.body.appendChild(p); btn.setAttribute('aria-expanded','true');
      p.onmousedown=function(ev){ ev.preventDefault(); };
      p.onclick=function(ev){ var b=ev.target.closest('button'); if(!b) return;
        if(b.dataset.cor!==undefined) envolve('span',b.dataset.cor?'c-'+b.dataset.cor:'');
        if(b.dataset.marca!==undefined) envolve('mark',b.dataset.marca?'m-'+b.dataset.marca:'');
        p.remove(); btn.setAttribute('aria-expanded','false'); };
      setTimeout(function(){ document.addEventListener('mousedown',function fora(ev){ if(!p.contains(ev.target)){ p.remove(); btn.setAttribute('aria-expanded','false'); document.removeEventListener('mousedown',fora); } }); },0);
    }
    bar.onmousedown=function(ev){ if(ev.target.closest('button')) ev.preventDefault(); guardaSel(); };
    bar.onclick=function(ev){ var b=ev.target.closest('button[data-c]'); if(!b) return; var c=b.dataset.c; voltaSel();
      if(c==='cor'){ guardaSel(); paleta(b); return; }
      if(c==='link'){ var u=prompt('Endereço do link (https://…)'); if(u){ if(!/^(https?:\/\/|\/|mailto:)/i.test(u)) u='https://'+u; document.execCommand('createLink',false,u); } }
      else if(c==='blockquote'){ var bl=blocoAtual(); document.execCommand('formatBlock',false,bl&&bl.tagName==='BLOCKQUOTE'?'<p>':'<blockquote>'); }
      else if(c==='ck'){ var li=blocoAtual(), ul=li&&li.closest&&li.closest('ul'); if(!ul||!ed.contains(ul)){ document.execCommand('insertUnorderedList'); li=blocoAtual(); ul=li&&li.closest('ul'); } if(ul) ul.classList.toggle('ck'); }
      else document.execCommand(c,false,null);
      ed.dispatchEvent(new Event('input')); atualizaBloco(); };
    sel.onchange=function(){ voltaSel(); document.execCommand('formatBlock',false,'<'+sel.value+'>'); ed.dispatchEvent(new Event('input')); };
    ed.addEventListener('keyup',function(){ guardaSel(); atualizaBloco(); });
    ed.addEventListener('mouseup',function(){ guardaSel(); atualizaBloco(); });
    ed.addEventListener('input',function(){ stt.textContent='…'; clearTimeout(tm); tm=setTimeout(salva,1200); if(op.onInput) op.onInput(); });
    ed.addEventListener('blur',function(){ setTimeout(function(){ if(!caixa.contains(document.activeElement)) salva(); },150); });
    // checklist: clicar na caixinha marca/desmarca
    ed.addEventListener('click',function(ev){ var li=ev.target.closest&&ev.target.closest('ul.ck>li'); if(!li) return; var r=li.getBoundingClientRect(); if(ev.clientX-r.left<26){ li.classList.toggle('ok'); ed.dispatchEvent(new Event('input')); } });
    // colar: vira texto limpo (parágrafos), a formatação se faz pela barra
    ed.addEventListener('paste',function(ev){ var t=(ev.clipboardData||window.clipboardData).getData('text/plain'); if(t==null) return; ev.preventDefault(); var h=deTexto(t); if(/\n/.test(t)) document.execCommand('insertHTML',false,h); else document.execCommand('insertText',false,t); });
    ed.addEventListener('keydown',function(ev){ if((ev.ctrlKey||ev.metaKey)&&ev.key==='s'){ ev.preventDefault(); salva(); } });
    return { el:ed, html:function(){ return ed.innerHTML; }, salva:salva };
  }
  window.UniqueRico={editor:editor,deTexto:deTexto};
})();
