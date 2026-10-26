/* Resultados: mural de vitórias da empresa (área do cliente e admin).
   UniqueVitorias.mural(el, {slug, admin, todas, pessoas:[{email,nome,foto}], acoes:[{id,titulo}], nomeEmp(slug)})
   - Cada vitória é assinada (foto, nome, cargo e data), pode ter número, foto/print e a ação que gerou.
   - Curtir e comentar usam o UniqueSocial (tipo 'vit'). "Virar case": o admin pede, o cliente autoriza. */
(function(){
  if(window.UniqueVitorias) return;
  var css=''+
  '.vt-topo{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:16px}'+
  '.vt-n{display:flex;gap:18px;flex-wrap:wrap}.vt-n div b{display:block;font-size:2rem;font-weight:800;letter-spacing:-.04em;line-height:1}.vt-n div span{font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#6b6b72)}'+
  '.vt-bt{font:inherit;font-size:.86rem;font-weight:700;border:0;background:#00e676;color:#000;border-radius:999px;padding:11px 18px;cursor:pointer}'+
  '.vt-form{border:1.5px solid var(--fg,#0b0b0c);border-radius:22px;padding:18px;display:grid;gap:10px;margin-bottom:18px;background:var(--bg,#fff)}'+
  '.vt-form input,.vt-form textarea,.vt-form select{font:inherit;font-size:.92rem;border:1px solid var(--line,#e4e4e7);border-radius:12px;padding:10px 12px;background:var(--bg,#fff);color:var(--fg,#0b0b0c);width:100%;box-sizing:border-box}'+
  '.vt-form textarea{min-height:80px;resize:vertical}.vt-form .l2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.vt-form label small{display:block;font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#6b6b72);margin-bottom:4px}'+
  '.vt-form .rod{display:flex;gap:8px;justify-content:flex-end;align-items:center}.vt-form .rod span{margin-right:auto;font-size:.8rem;color:var(--muted,#6b6b72)}'+
  '.vt-mes{font-size:.72rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--muted,#6b6b72);margin:18px 0 10px;display:flex;align-items:center;gap:10px}.vt-mes:after{content:"";flex:1;height:1px;background:var(--line,#e4e4e7)}'+
  '.vt-l{display:grid;gap:14px}'+
  '.vt-c{border:1px solid var(--line,#e4e4e7);border-radius:22px;background:var(--bg,#fff);overflow:hidden}'+
  '.vt-c-in{padding:18px 20px;display:grid;gap:10px}'+
  '.vt-as{display:flex;align-items:center;gap:10px}.vt-as .av{width:38px;height:38px;border-radius:50%;overflow:hidden;background:#1e2357;color:#fff;display:grid;place-items:center;font-size:.72rem;font-weight:800;flex-shrink:0}.vt-as .av img{width:100%;height:100%;object-fit:cover}'+
  '.vt-as b{display:block;font-size:.9rem}.vt-as small{display:block;font-size:.74rem;color:var(--muted,#6b6b72)}.vt-as .emp{margin-left:auto;font-size:.7rem;font-weight:700;background:var(--soft,#f4f4f5);border-radius:999px;padding:4px 10px}'+
  '.vt-c h4{margin:0;font-size:1.2rem;letter-spacing:-.02em;line-height:1.25}.vt-c p{margin:0;font-size:.92rem;line-height:1.6;white-space:pre-wrap}'+
  '.vt-num{display:inline-block;font-size:1.6rem;font-weight:800;letter-spacing:-.03em;background:#00e676;color:#000;border-radius:14px;padding:4px 12px;justify-self:start}'+
  '.vt-foto{display:block;width:100%;max-height:420px;object-fit:cover;background:var(--soft,#f4f4f5)}'+
  '.vt-acao{font-size:.78rem;color:var(--muted,#6b6b72)}.vt-acao b{color:var(--fg,#0b0b0c)}'+
  '.vt-case{font-size:.8rem;border-radius:14px;padding:10px 12px;background:var(--soft,#f4f4f5);display:flex;gap:8px;align-items:center;flex-wrap:wrap}.vt-case.ok{background:#d8f8e6;color:#06603a}.vt-case.no{background:#ffe0ec;color:#a3043f}'+
  '.vt-case button,.vt-acts button{font:inherit;font-size:.76rem;font-weight:700;border:1px solid var(--line,#e4e4e7);background:var(--bg,#fff);color:var(--fg,#0b0b0c);border-radius:999px;padding:6px 12px;cursor:pointer}.vt-case button.sim{background:#0b0b0c;color:#fff;border-color:#0b0b0c}'+
  '.vt-acts{display:flex;gap:6px;flex-wrap:wrap}.vt-soc .social{margin-top:0;border:0;border-top:1px solid var(--line,#e4e4e7);border-radius:0;padding:14px 20px}'+
  '.vt-vz{border:1.5px dashed var(--line,#e4e4e7);border-radius:22px;padding:28px;text-align:center;color:var(--muted,#6b6b72)}'+
  '@media(max-width:640px){.vt-form .l2{grid-template-columns:1fr}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  var MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function api(q,b){ return fetch('/api/area'+(b?'':q),{method:b?'POST':'GET',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined}).then(function(r){return r.json();}); }
  function toast(t){ var d=document.createElement('div'); d.className='social-toast'; d.textContent=t; document.body.appendChild(d); setTimeout(function(){d.remove();},2600); }
  function reduz(arq){ return new Promise(function(ok,erro){ var fr=new FileReader(); fr.onload=function(){ var img=new Image(); img.onload=function(){ var m=1400, w=img.naturalWidth, h=img.naturalHeight, k=Math.min(1,m/Math.max(w,h)); var cv=document.createElement('canvas'); cv.width=Math.round(w*k); cv.height=Math.round(h*k); cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height); ok(cv.toDataURL('image/jpeg',0.82)); }; img.onerror=erro; img.src=fr.result; }; fr.onerror=erro; fr.readAsDataURL(arq); }); }
  function quando(d){ try{ return new Date(d).toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'}).replace(/\./g,''); }catch(x){ return ''; } }
  function mural(el,op){
    var V=[], papel='', eu='', abreForm=false, foto='';
    function pes(m){ return (op.pessoas||[]).filter(function(x){return x.email===m;})[0]; }
    function avatar(v){ if(v.autor==='unique') return '<span class="av"><img src="/assets/carlos-hero.jpg" alt=""></span>'; var p=pes(v.autor), ini=String(v.nome||'?').split(/\s+/).slice(0,2).map(function(x){return x[0];}).join('').toUpperCase();
      return '<span class="av">'+(p&&p.foto?'<img src="/api/area?a=foto&k='+encodeURIComponent('p:'+v.slug+':'+v.autor)+'&v='+p.foto+'" alt="">':esc(ini))+'</span>'; }
    function carrega(){ api('?a=vitorias'+(op.todas?'&todas=1':'&e='+encodeURIComponent(op.slug||''))).then(function(r){ V=(r&&r.vitorias)||[]; papel=r.papel||''; eu=r.eu||''; desenha(); }); }
    function desenha(){
      var agora=new Date(), mesAt=agora.toISOString().slice(0,7), noMes=V.filter(function(v){return String(v.data).slice(0,7)===mesAt;}).length;
      var h='<div class="vt-topo"><div class="vt-n"><div><b>'+noMes+'</b><span>vitórias em '+MES[agora.getMonth()]+'</span></div><div><b>'+V.length+'</b><span>no total</span></div>'+(op.todas?'<div><b>'+Object.keys(V.reduce(function(o,v){o[v.slug]=1;return o;},{})).length+'</b><span>empresas</span></div>':'')+'</div>'+
        (op.todas?'':'<button type="button" class="vt-bt" data-vt="nova">+ Nova vitória</button>')+'</div>';
      if(abreForm&&!op.todas){
        h+='<form class="vt-form"><label><small>O que aconteceu</small><input name="titulo" maxlength="160" required placeholder="Ex.: Fechamos o maior pedido do ano"></label>'+
          '<label><small>Conte mais (opcional)</small><textarea name="texto" maxlength="3000" placeholder="Como foi, quem ajudou, o que mudou…"></textarea></label>'+
          '<div class="l2"><label><small>Número (opcional)</small><input name="numero" maxlength="40" placeholder="+R$ 18 mil · 3 contratos · 40%"></label>'+
          '<label><small>Veio de qual ação? (opcional)</small><select name="acao"><option value="">—</option>'+(op.acoes||[]).map(function(a){ return '<option value="'+esc(a.id)+'">'+esc(a.titulo)+'</option>'; }).join('')+'</select></label></div>'+
          '<label><small>Foto ou print (opcional)</small><input type="file" name="foto" accept="image/*"></label>'+
          '<div class="rod"><span>'+(op.admin?'Vai assinada como Carlos · Unique':'Vai assinada com o seu nome')+'</span><button type="button" class="vt-acts" data-vt="cancela" style="border:0;background:none;cursor:pointer">Cancelar</button><button class="vt-bt">Publicar vitória</button></div></form>';
      }
      if(!V.length) h+='<div class="vt-vz">Nenhuma vitória ainda. Pequenas vitórias contam: um cliente recuperado, uma meta batida, um processo que finalmente rodou.</div>';
      else {
        var ult='';
        h+='<div class="vt-l">';
        V.forEach(function(v,i){ var m=String(v.data).slice(0,7); if(m!==ult){ ult=m; var d=new Date(v.data); h+='<div class="vt-mes">'+MES[d.getMonth()]+' de '+d.getFullYear()+'</div>'; }
          var ac=v.acao&&(op.acoes||[]).filter(function(a){return a.id===v.acao;})[0];
          var podeAut=!op.admin&&(v.autor===eu||papel==='adm');
          h+='<article class="vt-c" data-i="'+i+'">'+(v.foto?'<img class="vt-foto" loading="lazy" alt="" src="/api/area?a=vitfoto&e='+encodeURIComponent(v.slug)+'&id='+encodeURIComponent(v.id)+'&v='+esc(v.foto)+'">':'')+
            '<div class="vt-c-in"><div class="vt-as">'+avatar(v)+'<div><b>'+esc(v.nome)+'</b><small>'+esc([v.cargo,quando(v.data)].filter(Boolean).join(' · '))+'</small></div>'+(op.todas&&op.nomeEmp?'<span class="emp">'+esc(op.nomeEmp(v.slug))+'</span>':'')+'</div>'+
            (v.numero?'<span class="vt-num">'+esc(v.numero)+'</span>':'')+'<h4>'+esc(v.titulo)+'</h4>'+(v.texto?'<p>'+esc(v.texto)+'</p>':'')+
            (ac?'<span class="vt-acao">Veio da ação <b>'+esc(ac.titulo)+'</b></span>':'')+
            (v.caso==='pedido'?'<div class="vt-case">📣 A Unique pediu para usar esta vitória como case (site e redes).'+(podeAut?' <button type="button" class="sim" data-vt="aut">Autorizar</button><button type="button" data-vt="nao">Agora não</button>':' Aguardando autorização do cliente.')+'</div>':
              v.caso==='autorizado'?'<div class="vt-case ok">✓ Autorizado para virar case'+(v.casoPor?' por '+esc(v.casoPor):'')+'</div>':v.caso==='recusado'?'<div class="vt-case no">Case não autorizado</div>':'')+
            '<div class="vt-acts">'+(op.admin&&!v.caso?'<button type="button" data-vt="case">Pedir para usar como case</button>':'')+((op.admin||v.autor===eu)?'<button type="button" data-vt="del">Apagar</button>':'')+'</div></div>'+
            '<div class="vt-soc" data-soc="'+i+'"></div></article>'; });
        h+='</div>';
      }
      el.innerHTML=h;
      if(window.UniqueSocial) el.querySelectorAll('[data-soc]').forEach(function(box){ var v=V[+box.dataset.soc]; window.UniqueSocial.montar(box,{slug:v.slug,id:v.id,tipo:'vit',titulo:v.titulo}); });
      var f=el.querySelector('.vt-form');
      if(f){ f.titulo.focus();
        f.foto.onchange=function(){ var a=f.foto.files[0]; foto=''; if(!a) return; reduz(a).then(function(d){ foto=d; }).catch(function(){ toast('Não consegui ler essa imagem.'); }); };
        f.onsubmit=function(ev){ ev.preventDefault(); var b=f.querySelector('button.vt-bt'); b.disabled=true; b.textContent='Publicando…';
          api('',{a:'vitoria',slug:op.slug,titulo:f.titulo.value,texto:f.texto.value,numero:f.numero.value,acao:f.acao.value,foto:foto}).then(function(r){ b.disabled=false; b.textContent='Publicar vitória'; if(!r.ok){ toast(r.erro||'Não foi possível publicar.'); return; } abreForm=false; foto=''; toast('Vitória publicada! 🏆'); carrega(); }); }; }
    }
    el.onclick=function(ev){ var b=ev.target.closest('[data-vt]'); if(!b) return; var a=b.dataset.vt;
      if(a==='nova'){ abreForm=!abreForm; desenha(); return; } if(a==='cancela'){ abreForm=false; desenha(); return; }
      var v=V[+b.closest('[data-i]').dataset.i]; if(!v) return;
      if(a==='del'){ if(b.dataset.ok!=='1'){ b.dataset.ok='1'; b.textContent='Confirmar'; return; } api('',{a:'vitoria-del',slug:v.slug,id:v.id}).then(carrega); }
      if(a==='case') api('',{a:'vitoria-case',slug:v.slug,id:v.id}).then(function(r){ toast(r.ok?'Pedido enviado ao cliente.':'Erro.'); carrega(); });
      if(a==='aut'||a==='nao') api('',{a:'vitoria-case-resp',slug:v.slug,id:v.id,autoriza:a==='aut'}).then(function(r){ toast(r.ok?(a==='aut'?'Obrigado! Autorizado.':'Tudo bem, fica só aqui.'):(r.erro||'Erro.')); carrega(); });
    };
    carrega();
    return { recarrega:carrega, lista:function(){ return V; } };
  }
  window.UniqueVitorias={mural:mural};
})();
