/* Black Zona · lógica das páginas (geral, por segmento e a da área do cliente).
   Os dados de cada página vêm em window.BZ, escritos por tools/black_zona.py:
   { mat: id do material em /api/material (null na página de cliente), modo: 'geral'|'seg'|'cliente',
     pilar: {P,N,F,R}, segs: [...], url } */
(function(){
  var BZ = window.BZ || {}, SEGS = BZ.segs || [], PILAR = BZ.pilar || {};
  var KM = 'ua_mat_' + BZ.mat, KF = 'bz_feito_' + (BZ.mat || BZ.chave || 'cliente');
  var ls = { get: function(k){ try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return null; } },
             set: function(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} } };
  var $ = function(s,el){ return (el||document).querySelector(s); }, $$ = function(s,el){ return [].slice.call((el||document).querySelectorAll(s)); };
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var ph = function(t){ return esc(t).replace(/\{([^}]+)\}/g,'<span class="ph">{$1}</span>'); };
  var pchip = function(p){ return '<span class="chip" style="--pc:var(--p-'+p+')"><i></i>'+esc(PILAR[p])+'</span>'; };
  var feito = ls.get(KF) || {};

  /* dias até a Black */
  try { var bf = new Date(2026,10,27), hj = new Date(); hj.setHours(0,0,0,0); var d = Math.round((bf-hj)/864e5); $('#dias').textContent = d > 0 ? d : '0'; } catch(e){}

  /* calendário */
  function calendario(){
    var st = [['02–06/11','Preparar','Listas, kits, ofertas e scripts'],['09–13/11','Esquentar','Lista VIP, kits e pré-venda'],['16–19/11','Atacar','Reativação, orçamentos, nicho'],['23–30/11','Black Week','27/11 Black · 30/11 Cyber'],['01–04/12','Colher','Crédito, depoimentos, janeiro']];
    var w = 136, out = '';
    st.forEach(function(s,i){
      var x = 8 + i*w, hot = i === 3, fg = hot ? '#000' : 'var(--fg)';
      out += '<g transform="translate('+x+',0)"><text x="10" y="18" font-size="12" font-weight="700" fill="var(--muted)">'+s[0]+'</text>'+
        '<rect x="0" y="28" width="'+(w-16)+'" height="100" rx="14" fill="'+(hot?'var(--verde)':'var(--soft)')+'" stroke="var(--line)"/>'+
        '<text x="12" y="60" font-size="19" font-weight="900" letter-spacing="-.5" fill="'+fg+'">'+s[1]+'</text>'+
        quebra(s[2],12,84,hot?'#000':'var(--muted)')+
        (i < st.length-1 ? '<path d="M'+(w-14)+' 78 H'+(w-4)+'" stroke="var(--fg)" stroke-width="2"/><path d="M'+(w-9)+' 73 L'+(w-3)+' 78 L'+(w-9)+' 83" fill="none" stroke="var(--fg)" stroke-width="2"/>' : '')+'</g>';
    });
    var y = 150;
    SEGS.forEach(function(s){
      var f = s.faixa; out += '<rect x="'+(8+f[0]*w)+'" y="'+y+'" width="'+((f[1]-f[0]+1)*w-16)+'" height="10" rx="5" fill="var('+s.cor+')"/>'+
        '<text x="'+(8+f[0]*w)+'" y="'+(y+28)+'" font-size="12" font-weight="600" fill="var(--muted)">'+esc(s.curto+': '+f[2])+'</text>'; y += 44;
    });
    return '<svg viewBox="0 0 '+(8+w*5)+' '+(y+2)+'" role="img" aria-label="Calendário de novembro: preparar, esquentar, atacar, Black Week e colher" font-family="Montserrat,system-ui,sans-serif">'+out+'</svg>';
  }
  function quebra(t,x,y,fill){ var ws=t.split(' '), ls2=[], c=''; ws.forEach(function(p){ if((c+' '+p).trim().length>17){ ls2.push(c.trim()); c=p; } else c+=' '+p; }); ls2.push(c.trim());
    return ls2.map(function(l,i){ return '<text x="'+x+'" y="'+(y+i*16)+'" font-size="12.5" fill="'+fill+'">'+esc(l)+'</text>'; }).join(''); }

  /* segmento */
  function card(s,a,i){ var k = s.id+'-'+i;
    return '<article class="ac'+(feito[k]?' feita':'')+'" id="'+k+'">'+
      '<div class="chips">'+pchip(a.p)+'<span class="chip">Esforço '+esc(a.e.toLowerCase())+'</span><span class="chip data">'+esc(a.d)+'</span></div>'+
      '<h3>'+esc(a.t)+'</h3><p class="res">'+esc(a.s)+'</p>'+
      '<ol>'+a.passos.map(function(p){ return '<li>'+ph(p)+'</li>'; }).join('')+'</ol>'+
      '<details class="zap"><summary><span>Mensagem pronta para o WhatsApp</span></summary><blockquote>'+ph(a.sc)+'</blockquote><button class="copia" type="button" data-k="'+k+'">Copiar mensagem</button></details>'+
      '<div class="meta"><small>Meta</small><span>'+esc(a.m)+'</span></div>'+
      '<label class="feito"><input type="checkbox" data-f="'+k+'"'+(feito[k]?' checked':'')+'> Ação feita</label></article>'; }
  function segHtml(s){
    return '<section class="seg" id="seg-'+s.id+'" style="--c:var('+s.cor+')">'+
      '<div class="seg-cab"><span class="k">'+esc(s.nome)+'</span><h2>'+esc(s.tese)+'</h2>'+
      '<div class="aviso">'+esc(s.janela)+'</div>'+
      '<div class="prog"><div class="barra"><span id="bar-'+s.id+'"></span></div><b id="pg-'+s.id+'"></b></div></div>'+
      '<div class="acoes">'+s.acoes.map(function(a,i){ return card(s,a,i); }).join('')+'</div>'+
      '<div class="naofaca"><span class="k">Não faça</span>'+s.naofaca.map(function(t){ return '<div>'+esc(t)+'</div>'; }).join('')+'</div></section>'; }
  function progresso(){ SEGS.forEach(function(s){ var n = s.acoes.filter(function(a,i){ return feito[s.id+'-'+i]; }).length, b = $('#bar-'+s.id), t = $('#pg-'+s.id);
    if(b) b.style.width = (n/s.acoes.length*100)+'%'; if(t) t.textContent = n+' de '+s.acoes.length+' feitas'; }); }

  /* monta o conteúdo */
  var cx = $('#cal'); if(cx) cx.innerHTML = calendario();
  var alvo = $('#segmentos');
  if(alvo){
    if(BZ.modo === 'geral'){
      alvo.innerHTML = '<div class="abas-w"><div class="abas" role="group" aria-label="Segmento">'+SEGS.map(function(s){ return '<button type="button" data-aba="'+s.id+'" style="--c:var('+s.cor+')"><i></i>'+esc(s.nome)+'</button>'; }).join('')+'</div></div>'+SEGS.map(segHtml).join('');
    } else alvo.innerHTML = SEGS.map(segHtml).join('');
  }
  progresso();

  function aba(id){ if(BZ.modo !== 'geral') return; if(!SEGS.some(function(s){ return s.id === id; })) id = SEGS[0].id;
    SEGS.forEach(function(s){ $('#seg-'+s.id).hidden = s.id !== id; });
    $$('[data-aba]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.aba === id ? 'true' : 'false'); }); }
  var h0 = location.hash.slice(1); aba(SEGS.some(function(s){ return s.id === h0; }) ? h0 : SEGS[0] && SEGS[0].id);
  window.addEventListener('hashchange', function(){ var h = location.hash.slice(1); if(SEGS.some(function(s){ return s.id === h; })) aba(h); });

  /* tabela (geral) */
  var tb = $('#tb');
  if(tb){
    var ROWS = []; SEGS.forEach(function(s){ s.acoes.forEach(function(a,i){ ROWS.push({s:s,a:a,k:s.id+'-'+i}); }); });
    var fs = 'todos', fp = 'todos', norm = function(t){ return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); };
    $('#fseg').innerHTML = [['todos','Todos os segmentos']].concat(SEGS.map(function(s){ return [s.id,s.curto]; })).map(function(x){ return '<button type="button" data-fs="'+x[0]+'" aria-pressed="'+(x[0]===fs)+'">'+esc(x[1])+'</button>'; }).join('');
    $('#fpil').innerHTML = [['todos','Todos os pilares']].concat(Object.keys(PILAR).map(function(k){ return [k,PILAR[k]]; })).map(function(x){ return '<button type="button" data-fp="'+x[0]+'" aria-pressed="'+(x[0]===fp)+'">'+esc(x[1])+'</button>'; }).join('');
    var tabela = function(){ var q = norm($('#busca').value||'');
      var r = ROWS.filter(function(o){ return (fs==='todos'||o.s.id===fs) && (fp==='todos'||o.a.p===fp) && (!q || norm(o.a.t+' '+o.a.s+' '+o.s.nome).indexOf(q) > -1); });
      tb.innerHTML = r.map(function(o){ return '<tr class="lin" data-k="'+o.k+'"><td><b>'+esc(o.a.t)+'</b><small>'+esc(o.a.s)+'</small></td><td><span class="sg-n" style="--c:var('+o.s.cor+')">'+esc(o.s.curto)+'</span></td><td>'+pchip(o.a.p)+'</td><td class="dt">'+esc(o.a.d)+'</td><td>'+esc(o.a.e)+'</td></tr>'; }).join('') || '<tr><td colspan="5">Nenhuma ação com esse filtro.</td></tr>';
      $('#conta').textContent = r.length+' de '+ROWS.length+' ações'; };
    $('#busca').addEventListener('input', tabela);
    $('#fseg').addEventListener('click', function(e){ var b = e.target.closest('[data-fs]'); if(!b) return; fs = b.dataset.fs; $$('[data-fs]').forEach(function(x){ x.setAttribute('aria-pressed', x===b); }); tabela(); });
    $('#fpil').addEventListener('click', function(e){ var b = e.target.closest('[data-fp]'); if(!b) return; fp = b.dataset.fp; $$('[data-fp]').forEach(function(x){ x.setAttribute('aria-pressed', x===b); }); tabela(); });
    tb.addEventListener('click', function(e){ var tr = e.target.closest('tr.lin'); if(!tr) return; var k = tr.dataset.k, sid = k.split('-')[0]; aba(sid); history.replaceState(null,'','#'+sid); var c = document.getElementById(k); if(c) c.scrollIntoView({block:'start'}); });
    tabela();
  }

  /* eventos */
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-aba]');
    if(b){ aba(b.dataset.aba); history.replaceState(null,'','#'+b.dataset.aba); var s = $('#seg-'+b.dataset.aba); if(s) s.scrollIntoView({block:'start'}); return; }
    var c = e.target.closest('.copia[data-k]');
    if(c){ var p = c.dataset.k.split('-'), sg = SEGS.filter(function(s){ return s.id === p[0]; })[0], txt = sg ? sg.acoes[+p[1]].sc : '';
      var ok = function(){ c.textContent = 'Copiada!'; setTimeout(function(){ c.textContent = 'Copiar mensagem'; }, 1600); };
      var fb = function(){ var a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok(); } catch(er){} a.remove(); };
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fb); else fb(); }
  });
  document.addEventListener('change', function(e){ var k = e.target.dataset && e.target.dataset.f; if(!k) return;
    if(e.target.checked) feito[k] = 1; else delete feito[k]; ls.set(KF, feito);
    var c = document.getElementById(k); if(c) c.classList.toggle('feita', e.target.checked); progresso(); });

  /* página de cliente: já abre liberada (o login é feito pelo site) */
  if(BZ.modo === 'cliente'){ document.body.classList.add('liberado'); return; }

  /* liberação por cadastro */
  function libera(d, novo){
    document.body.classList.add('liberado');
    var pn = (d && d.nome || '').split(' ')[0];
    if(novo){ $('#ok-t').textContent = (pn ? pn+', as' : 'As')+' ações estão liberadas!';
      $('#ok-p').textContent = (d.nl === 'ja' ? 'Você já estava na newsletter Unique: continua recebendo' : 'E você já está na newsletter Unique: vai receber')+' cada post novo do blog direto no seu e-mail.'; }
    else { $('#ok-t').textContent = 'Bem-vindo de volta'+(pn ? ', '+pn : '')+'!'; $('#ok-p').textContent = 'As ações que você marcou como feitas continuam marcadas.'; }
  }
  var salvo = ls.get(KM); if(salvo) libera(salvo, false);
  var f = $('#f-lib');
  if(f){ var msg = $('.msg', f), bt = $('button[type=submit]', f);
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var d = { nome: f.nome.value.trim(), empresa: f.empresa.value.trim(), whatsapp: f.whatsapp.value.trim(), email: f.email.value.trim() };
      if(d.nome.length < 2){ msg.textContent = 'Informe o seu nome.'; f.nome.focus(); return; }
      if(d.empresa.length < 2){ msg.textContent = 'Informe o nome da empresa.'; f.empresa.focus(); return; }
      if(d.whatsapp.replace(/\D/g,'').length < 10){ msg.textContent = 'Confira o seu WhatsApp com DDD.'; f.whatsapp.focus(); return; }
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)){ msg.textContent = 'Confira o seu e-mail.'; f.email.focus(); return; }
      if(!f.aceite.checked){ msg.textContent = 'Para liberar, marque que concorda em receber os conteúdos e com a LGPD.'; f.aceite.focus(); return; }
      bt.disabled = true; msg.textContent = '';
      fetch('/api/material', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'liberar', material: BZ.mat, nome: d.nome, empresa: d.empresa, whatsapp: d.whatsapp, email: d.email, aceite: true, site: f.site.value }) })
        .then(function(r){ return r.json().catch(function(){ return {}; }); })
        .then(function(r){
          if(!r || !r.ok){ bt.disabled = false; msg.textContent = (r && r.erro) || 'Não deu certo agora. Tente de novo em instantes.'; return; }
          var v = { nome: d.nome, empresa: d.empresa, nl: r.newsletter, data: new Date().toISOString() };
          ls.set(KM, v); libera(v, true); var ok = $('.ok'); if(ok && ok.scrollIntoView) ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .catch(function(){ bt.disabled = false; msg.textContent = 'Sem conexão. Tente de novo.'; });
    });
  }

  /* visualização ADM (logado no workspace) e cliente logado */
  function dt(x){ try { return new Date(x).toLocaleString('pt-BR',{ timeZone:'America/Sao_Paulo', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); } catch(e){ return ''; } }
  fetch('/api/material?a=adm&material='+encodeURIComponent(BZ.mat), { credentials: 'same-origin', cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(r){
    if(r && r.cliente){ document.body.classList.add('liberado'); return; }
    if(!r || !r.admin) return;
    document.body.classList.add('modo-adm','liberado');
    var visitante = false, el = document.createElement('section'); el.className = 'admbar'; el.setAttribute('aria-label','Visualização ADM');
    var linhas = (r.ultimos||[]).map(function(x){ var w = String(x.whatsapp||'').replace(/\D/g,''); if(w.length >= 10 && w.length <= 11) w = '55'+w;
      return '<tr><td>'+dt(x.data)+'</td><td>'+esc(x.nome)+'</td><td><a href="/area/admin/#empresas/'+encodeURIComponent(x.slug||'')+'">'+esc(x.empresa)+'</a></td><td>'+(w ? '<a href="https://wa.me/'+w+'" target="_blank" rel="noopener">'+esc(x.whatsapp)+'</a>' : '')+'</td><td>'+esc(x.email)+'</td></tr>'; }).join('');
    el.innerHTML = '<div class="wrap"><div><span class="sel"><i></i>Visualização ADM</span><p class="tx">Você vê o material completo porque está logado no workspace. O visitante precisa se cadastrar.</p></div>'+
      '<div class="num2"><div><b>'+(r.total||0)+'</b><small>cadastros</small></div><div><b>'+(r.hoje||0)+'</b><small>hoje</small></div></div>'+
      '<div class="acs"><button class="btn sm verde" type="button" data-adm="lista">Ver cadastros</button><button class="btn sm" type="button" data-adm="vis">Ver como visitante</button><a class="btn sm" href="/area/admin/#crm">Abrir CRM</a></div></div>'+
      '<div class="wrap lista">'+(linhas ? '<div style="overflow-x:auto"><table><thead><tr><th>Quando</th><th>Nome</th><th>Empresa</th><th>WhatsApp</th><th>E-mail</th></tr></thead><tbody>'+linhas+'</tbody></table></div>' : '<p class="vazio">Nenhum cadastro ainda.</p>')+'</div>';
    var main = document.querySelector('main'); main.insertBefore(el, main.firstChild);
    el.addEventListener('click', function(e){ var b = e.target.closest('[data-adm]'); if(!b) return;
      if(b.dataset.adm === 'lista'){ var a = el.classList.toggle('aberta'); b.textContent = a ? 'Fechar cadastros' : 'Ver cadastros'; }
      if(b.dataset.adm === 'vis'){ visitante = !visitante; document.body.classList.toggle('liberado', !visitante); b.textContent = visitante ? 'Ver como ADM' : 'Ver como visitante'; } });
  }).catch(function(){});
})();
