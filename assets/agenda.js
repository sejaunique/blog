/* Calendário da Unique: o mesmo no admin e na área do cliente, com Dia, Semana e Mês.
   UniqueCal.montar(el, {
     chave: 'cal-admin',                 // lembra o modo e a data no navegador
     eventos: [{id, dia:'AAAA-MM-DD', hora:'HH:MM', titulo, sub, tipo:'entrega'|'pedida'|'reuniao', status, atrasada, arrastavel, av}],
     semData: [{id, titulo, sub}],        // opcional: ações sem data, para arrastar para um dia
     aoClicar: function(ev){}, aoMover: function(id, dia){}
   }) */
(function(){
  if(window.UniqueCal) return;
  var css=''+
  '.ag{--ag-l:var(--line,var(--ws-line,#e4e4e7));--ag-s:var(--soft,#f4f4f5);--ag-m:var(--muted,#6b6b72)}'+
  '.ag-h{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}'+
  '.ag-h .ag-tit{font-size:1.1rem;font-weight:700;min-width:190px;text-align:center;text-transform:capitalize}'+
  '.ag-bt{font:inherit;font-size:.78rem;font-weight:600;border:1px solid var(--ag-l);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:7px 14px;cursor:pointer}.ag-bt:hover{border-color:var(--fg,#0b0b0c)}'+
  '.ag-modo{display:inline-flex;margin-left:auto;background:var(--fg,#0b0b0c);border-radius:999px;padding:3px;gap:2px}'+
  '.ag-modo button{font:inherit;font-size:.76rem;font-weight:700;border:0;background:none;color:var(--bg,#fff);opacity:.7;border-radius:999px;padding:6px 14px;cursor:pointer}.ag-modo button[aria-pressed="true"]{background:var(--bg,#fff);color:var(--fg,#0b0b0c);opacity:1}'+
  '.ag-leg{display:flex;flex-wrap:wrap;gap:14px;font-size:.72rem;color:var(--ag-m);margin:0 0 10px}.ag-leg span{display:inline-flex;align-items:center;gap:6px}.ag-leg i{width:10px;height:10px;border-radius:3px;display:inline-block}'+
  '.ag-mes{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--ag-l);border-left:1px solid var(--ag-l);border-radius:12px;overflow:hidden}'+
  '.ag-dow{font-size:.66rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ag-m);padding:8px;border-right:1px solid var(--ag-l);border-bottom:1px solid var(--ag-l);background:var(--ag-s)}'+
  '.ag-d{min-height:108px;padding:6px;border-right:1px solid var(--ag-l);border-bottom:1px solid var(--ag-l);display:flex;flex-direction:column;gap:3px;min-width:0;background:var(--bg,#fff)}'+
  '.ag-d.fora{background:var(--ag-s);opacity:.6}.ag-d.hoje .ag-n{background:#00e676;color:#000}.ag-d.sobre{outline:2px dashed #00c853;outline-offset:-3px}'+
  '.ag-n{font-size:.74rem;font-weight:700;width:24px;height:24px;border-radius:50%;display:inline-grid;place-items:center;cursor:pointer;align-self:flex-start}'+
  '.ag-ch{font-size:.72rem;line-height:1.25;padding:3px 7px;border-radius:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;border-left:3px solid transparent;background:var(--ag-s);color:var(--fg,#0b0b0c)}'+
  '.ag-ch.entrega{border-left-color:#1e2357}.ag-ch.pedida{border-left-color:#b9b9c4;background:transparent;color:var(--ag-m)}.ag-ch.reuniao{border-left-color:#e0055e;background:#fde4ee;color:#8a0336}'+
  '.ag-ch.st-fazendo{border-left-color:#f59e0b}.ag-ch.st-feito{border-left-color:#00c853;text-decoration:line-through;opacity:.7}.ag-ch.st-cancelado{opacity:.5;text-decoration:line-through}.ag-ch.atr{background:#fde4ee;color:#b0043f;border-left-color:#e0055e}'+
  '[data-theme="dark"] .ag-ch.reuniao,[data-theme="dark"] .ag-ch.atr{background:#3a0c20;color:#ff8fb6}'+
  '.ag-ch[draggable="true"]{cursor:grab}.ag-ch b{font-weight:700;margin-right:4px}'+
  '.ag-mais{font:inherit;font-size:.7rem;font-weight:700;background:none;border:0;color:var(--ag-m);cursor:pointer;text-align:left;padding:2px 4px}'+
  '.ag-sem{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:1px solid var(--ag-l);border-radius:12px;overflow:hidden}'+
  '.ag-sem>div{border-right:1px solid var(--ag-l);min-height:300px;display:flex;flex-direction:column;min-width:0}.ag-sem>div:last-child{border-right:0}'+
  '.ag-sem .ag-sh{padding:10px;border-bottom:1px solid var(--ag-l);background:var(--ag-s);text-align:center;cursor:pointer}.ag-sem .ag-sh small{display:block;font-size:.64rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ag-m)}.ag-sem .ag-sh b{font-size:1.3rem}'+
  '.ag-sem .hoje .ag-sh{background:#00e676;color:#000}.ag-sem .hoje .ag-sh small{color:#000}'+
  '.ag-sem .ag-sb{padding:6px;display:flex;flex-direction:column;gap:4px;flex:1}.ag-sem .ag-ch{white-space:normal}'+
  '.ag-dia{border:1px solid var(--ag-l);border-radius:16px;padding:8px}.ag-dia .ag-it{display:grid;grid-template-columns:70px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 12px;border-radius:12px;cursor:pointer}.ag-dia .ag-it:hover{background:var(--ag-s)}'+
  '.ag-it .ag-hr{font-weight:800;font-size:.95rem}.ag-it .ag-hr small{display:block;font-size:.62rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ag-m)}'+
  '.ag-it b{display:block;font-size:1rem}.ag-it span.sub{font-size:.8rem;color:var(--ag-m)}.ag-it .ag-tag{font-size:.66rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;border-radius:999px;padding:4px 10px;background:var(--ag-s)}'+
  '.ag-it .ag-tag.reuniao{background:#fde4ee;color:#b0043f}.ag-it .ag-tag.atr{background:#e0055e;color:#fff}'+
  '.ag-vz{padding:40px 10px;text-align:center;color:var(--ag-m);font-size:.9rem}'+
  '.ag-semdata{margin-top:14px;border:1px dashed var(--ag-l);border-radius:12px;padding:12px}.ag-semdata b{font-size:.8rem}.ag-semdata div{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.ag-semdata .ag-ch{max-width:280px}'+
  '@media(max-width:760px){.ag-h .ag-tit{min-width:0;flex:0 0 100%!important;order:-1;text-align:left}.ag-mes .ag-d{min-height:64px}.ag-mes .ag-ch{font-size:0;padding:0;height:6px;border-radius:3px;border-left-width:0}.ag-mes .ag-ch.entrega{background:#1e2357}.ag-mes .ag-ch.reuniao,.ag-mes .ag-ch.atr{background:#e0055e}.ag-mes .ag-ch.pedida{background:#b9b9c4}.ag-sem{grid-template-columns:1fr}.ag-sem>div{min-height:0;border-right:0;border-bottom:1px solid var(--ag-l)}.ag-modo{margin-left:0}.ag-h .ag-tit{min-width:0;flex:1}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var DOW=['seg','ter','qua','qui','sex','sáb','dom'], MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var TIPO={entrega:'Entrega',pedida:'Pedida',reuniao:'Reunião'};
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function dataDe(s){ var p=String(s).split('-'); return new Date(+p[0],+p[1]-1,+p[2],12); }
  function hojeIso(){ return iso(new Date()); }
  function segunda(d){ var x=new Date(d); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }

  function montar(el,op){
    var S={modo:'mes',ref:hojeIso()};
    try{ var g=JSON.parse(localStorage.getItem(op.chave||'cal')||'null'); if(g&&g.modo) S.modo=g.modo; }catch(x){}
    var EV=op.eventos||[], SD=op.semData||[], arrasta='';
    function guarda(){ try{ localStorage.setItem(op.chave||'cal',JSON.stringify({modo:S.modo})); }catch(x){} }
    function porDia(){ var m={}; EV.forEach(function(e){ if(e.dia) (m[e.dia]=m[e.dia]||[]).push(e); }); Object.keys(m).forEach(function(k){ m[k].sort(function(a,b){ var o={reuniao:0,entrega:1,pedida:2}; return String(a.hora||'99').localeCompare(String(b.hora||'99'))||(o[a.tipo]-o[b.tipo]); }); }); return m; }
    function chip(e,longo){ return '<div class="ag-ch '+esc(e.tipo)+(e.status?' st-'+esc(e.status):'')+(e.atrasada?' atr':'')+'" data-ev="'+esc(e.id)+'"'+(e.arrastavel?' draggable="true"':'')+' title="'+esc(TIPO[e.tipo]+' · '+e.titulo+(e.sub?' · '+e.sub:''))+'">'+(e.hora?'<b>'+esc(e.hora)+'</b>':'')+(e.tipo==='pedida'?'↳ ':'')+esc(e.titulo)+(longo&&e.sub?'<br><small style="opacity:.7">'+esc(e.sub)+'</small>':'')+'</div>'; }
    function titulo(){ var r=dataDe(S.ref);
      if(S.modo==='mes') return MES[r.getMonth()]+' '+r.getFullYear();
      if(S.modo==='semana'){ var a=segunda(r), b=new Date(a); b.setDate(a.getDate()+6); return a.getDate()+(a.getMonth()!==b.getMonth()?' '+MES[a.getMonth()].slice(0,3):'')+' – '+b.getDate()+' '+MES[b.getMonth()].slice(0,3)+' '+b.getFullYear(); }
      return ['domingo','segunda','terça','quarta','quinta','sexta','sábado'][r.getDay()]+', '+r.getDate()+' de '+MES[r.getMonth()]; }
    function desenha(){
      var M=porDia(), h=hojeIso(), out='';
      out+='<div class="ag-h"><button type="button" class="ag-bt" data-nav="-1" aria-label="Anterior">‹</button><span class="ag-tit">'+esc(titulo())+'</span><button type="button" class="ag-bt" data-nav="1" aria-label="Próximo">›</button><button type="button" class="ag-bt" data-nav="0">Hoje</button>'+
        '<div class="ag-modo" role="group" aria-label="Visão do calendário">'+[['dia','Dia'],['semana','Semana'],['mes','Mês']].map(function(m){ return '<button type="button" data-modo="'+m[0]+'" aria-pressed="'+(S.modo===m[0])+'">'+m[1]+'</button>'; }).join('')+'</div></div>'+
        '<div class="ag-leg"><span><i style="background:#1e2357"></i>Entrega</span><span><i style="background:#b9b9c4"></i>Pedida</span><span><i style="background:#e0055e"></i>Reunião / atrasada</span><span><i style="background:#00c853"></i>Feita</span></div>';
      var r=dataDe(S.ref);
      if(S.modo==='mes'){
        var ini=new Date(r.getFullYear(),r.getMonth(),1,12), a=segunda(ini), fimM=new Date(r.getFullYear(),r.getMonth()+1,0,12), n=Math.ceil((((ini.getDay()+6)%7)+fimM.getDate())/7)*7;
        out+='<div class="ag-mes">'+DOW.map(function(d){return '<div class="ag-dow">'+d+'</div>';}).join('');
        for(var i=0;i<n;i++){ var d=new Date(a); d.setDate(a.getDate()+i); var k=iso(d), L=M[k]||[];
          out+='<div class="ag-d'+(d.getMonth()!==r.getMonth()?' fora':'')+(k===h?' hoje':'')+'" data-dia="'+k+'"><span class="ag-n" data-ir="'+k+'" title="Ver o dia">'+d.getDate()+'</span>'+L.slice(0,4).map(function(e){return chip(e);}).join('')+(L.length>4?'<button type="button" class="ag-mais" data-ir="'+k+'">+'+(L.length-4)+' mais</button>':'')+'</div>'; }
        out+='</div>';
      } else if(S.modo==='semana'){
        var s0=segunda(r); out+='<div class="ag-sem">';
        for(var j=0;j<7;j++){ var dd=new Date(s0); dd.setDate(s0.getDate()+j); var kk=iso(dd), LL=M[kk]||[];
          out+='<div class="'+(kk===h?'hoje':'')+'"><div class="ag-sh" data-ir="'+kk+'"><small>'+DOW[j]+'</small><b>'+dd.getDate()+'</b></div><div class="ag-sb" data-dia="'+kk+'">'+(LL.length?LL.map(function(e){return chip(e,1);}).join(''):'')+'</div></div>'; }
        out+='</div>';
      } else {
        var L1=M[S.ref]||[];
        out+='<div class="ag-dia" data-dia="'+S.ref+'">'+(L1.length?L1.map(function(e){ return '<div class="ag-it" data-ev="'+esc(e.id)+'"><span class="ag-hr">'+(e.hora?esc(e.hora):'—')+'<small>'+(e.hora?'horário':'dia todo')+'</small></span><span><b>'+esc(e.titulo)+'</b>'+(e.sub?'<span class="sub">'+esc(e.sub)+'</span>':'')+'</span><span class="ag-tag '+esc(e.tipo)+(e.atrasada?' atr':'')+'">'+(e.atrasada?'Atrasada':TIPO[e.tipo])+'</span></div>'; }).join(''):'<div class="ag-vz">Nada marcado para este dia.</div>')+'</div>';
      }
      if(SD.length&&op.aoMover) out+='<div class="ag-semdata"><b>Sem data</b><span style="font-size:.74rem;opacity:.7"> · arraste para um dia</span><div>'+SD.map(function(e){ return '<div class="ag-ch entrega" draggable="true" data-ev="'+esc(e.id)+'">'+esc(e.titulo)+(e.sub?' · '+esc(e.sub):'')+'</div>'; }).join('')+'</div></div>';
      el.innerHTML=out;
    }
    el.classList.add('ag');
    el.onclick=function(ev){
      var n=ev.target.closest('[data-nav]'); if(n){ var v=+n.dataset.nav, r=dataDe(S.ref); if(!v) S.ref=hojeIso(); else { if(S.modo==='mes') r.setMonth(r.getMonth()+v,1); else r.setDate(r.getDate()+(S.modo==='semana'?7:1)*v); S.ref=iso(r); } desenha(); return; }
      var m=ev.target.closest('[data-modo]'); if(m){ S.modo=m.dataset.modo; guarda(); desenha(); return; }
      var ir=ev.target.closest('[data-ir]'); if(ir){ S.ref=ir.dataset.ir; S.modo='dia'; guarda(); desenha(); return; }
      var e=ev.target.closest('[data-ev]'); if(e&&op.aoClicar){ var x=EV.concat(SD).filter(function(y){return String(y.id)===e.dataset.ev;})[0]; if(x) op.aoClicar(x); }
    };
    el.ondragstart=function(ev){ var c=ev.target.closest('[data-ev][draggable]'); if(!c) return; arrasta=c.dataset.ev; try{ ev.dataTransfer.setData('text/plain',arrasta); }catch(x){} };
    el.ondragover=function(ev){ var c=ev.target.closest('[data-dia]'); if(!c||!arrasta) return; ev.preventDefault(); el.querySelectorAll('.sobre').forEach(function(x){ if(x!==c) x.classList.remove('sobre'); }); c.classList.add('sobre'); };
    el.ondragleave=function(ev){ var c=ev.target.closest&&ev.target.closest('[data-dia]'); if(c&&!c.contains(ev.relatedTarget)) c.classList.remove('sobre'); };
    el.ondrop=function(ev){ var c=ev.target.closest('[data-dia]'); if(!c||!arrasta) return; ev.preventDefault(); var id=arrasta; arrasta=''; c.classList.remove('sobre'); var x=EV.concat(SD).filter(function(y){return String(y.id)===id;})[0]; if(x&&x.dia!==c.dataset.dia&&op.aoMover) op.aoMover(id,c.dataset.dia); };
    el.ondragend=function(){ arrasta=''; el.querySelectorAll('.sobre').forEach(function(x){x.classList.remove('sobre');}); };
    desenha();
    return { atualiza:function(ev,sd){ EV=ev||[]; SD=sd||[]; desenha(); } };
  }
  window.UniqueCal={montar:montar};
})();
