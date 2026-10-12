/* Formulários do CRM (workspace e app): monta os campos a partir de R.campos (api/_area/campos.js),
   aplica máscaras (CNPJ, CPF, CEP, telefone), valida, e preenche sozinho pelo CNPJ (Receita), pelo CEP
   e a lista de cidades do IBGE conforme o estado. */
(function(){
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function so(v){ return String(v||'').replace(/\D/g,''); }
  function brl(v){ return (+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  function cnpjOk(n){ if(n.length!==14||/^(\d)\1+$/.test(n)) return false; function dv(p){ var t=0; for(var i=0;i<p.length;i++) t+=(+n[i])*p[i]; t%=11; return t<2?0:11-t; } var p1=[5,4,3,2,9,8,7,6,5,4,3,2]; return dv(p1)===+n[12]&&dv([6].concat(p1))===+n[13]; }
  function cpfOk(n){ if(n.length!==11||/^(\d)\1+$/.test(n)) return false; function dv(k){ var t=0; for(var i=0;i<k;i++) t+=(+n[i])*(k+1-i); t=(t*10)%11; return t===10?0:t; } return dv(9)===+n[9]&&dv(10)===+n[10]; }
  var FMT={
    cnpj:function(n){ n=n.slice(0,14); return n.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2'); },
    cpf:function(n){ n=n.slice(0,11); return n.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'); },
    cep:function(n){ n=n.slice(0,8); return n.replace(/^(\d{5})(\d)/,'$1-$2'); },
    tel:function(n){ if(n.length>11&&n.indexOf('55')===0) n=n.slice(2); n=n.slice(0,11); if(n.length<3) return n; if(n.length<=6) return '('+n.slice(0,2)+') '+n.slice(2); var m=n.length===11?7:6; return '('+n.slice(0,2)+') '+n.slice(2,m)+'-'+n.slice(m); }
  };
  var ERRO={cnpj:'CNPJ inválido. Confira os números.',cpf:'CPF inválido. Confira os números.',cep:'CEP precisa ter 8 números.',tel:'Telefone precisa ter DDD + número.',insta:'Use @perfil.',site:'Endereço inválido.'};
  function valido(mask,v){ var n=so(v); if(!v) return true;
    if(mask==='cnpj') return cnpjOk(n); if(mask==='cpf') return cpfOk(n); if(mask==='cep') return n.length===8; if(mask==='tel') return n.length>=10&&n.length<=13;
    if(mask==='insta') return /^@?[A-Za-z0-9._]{1,30}$/.test(String(v).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/[/?#].*$/,''));
    if(mask==='site') return /^(https?:\/\/)?[^.\s]+\.[^\s]+$/i.test(String(v).trim());
    return true; }
  var CIDADES={};

  window.CRMF=function(op){
    var app=op.estilo==='app';
    function vazio(v){ return v==null||v===''||(Array.isArray(v)&&!v.length); }
    function valTxt(c,v,pess){ if(vazio(v)) return ''; if(c.t==='moeda') return brl(v); if(c.t==='pct') return v+'%'; if(c.t==='data') return new Date(v+'T12:00').toLocaleDateString('pt-BR');
      if(c.t==='contatos') return v.map(function(m){ var u=(pess||[]).filter(function(x){return x.email===m;})[0]; return u?u.nome:m; }).join(', ');
      return Array.isArray(v)?v.join(', '):String(v); }
    function normSel(c,v){ if(!v||c.op.indexOf(v)>=0) return v; if(c.alias&&c.alias[v]) return c.alias[v]; var i=c.op.map(function(x){return x.toLowerCase();}).indexOf(String(v).toLowerCase()); return i>=0?c.op[i]:v; }
    function caixa(c,inner,larga){
      var d='<small class="dica" data-dica="'+c.k+'">'+(c.dica?esc(c.dica):'')+'</small>';
      if(app) return c.t==='multi'||c.t==='contatos'?'<div><div class="grp" style="margin:0 0 6px;letter-spacing:0;text-transform:none;font-size:.76rem">'+esc(c.r)+'</div>'+inner+'</div>':'<label>'+esc(c.r)+inner+d+'</label>';
      return '<div class="campo"'+(larga?' style="grid-column:1/-1"':'')+'><label>'+esc(c.r)+'</label>'+inner+d+'</div>';
    }
    function campoForm(c,v,pess){
      var n=' name="'+c.k+'"', val=vazio(v)?'':v;
      if(c.t==='longo') return caixa(c,'<textarea'+n+(app?'':' style="min-height:60px"')+'>'+esc(val)+'</textarea>',true);
      if(c.t==='sel'){ val=normSel(c,val); var o=c.op.slice(); if(val&&o.indexOf(val)<0) o.unshift(val);
        return caixa(c,'<select'+n+(c.k==='uf'?' data-uf':'')+'><option value="">Selecione…</option>'+o.map(function(x){return '<option'+(x===val?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select>'); }
      if(c.t==='cidade') return caixa(c,'<select'+n+' data-cidade><option value="">'+(val?'':'Escolha o estado primeiro')+'</option>'+(val?'<option selected>'+esc(val)+'</option>':'')+'</select>');
      if(c.t==='multi'||c.t==='contatos'){ var L=c.t==='contatos'?(pess||[]).map(function(u){return [u.email,u.nome];}):c.op.map(function(x){return [x,x];}), sel=val||[];
        return caixa(c,'<div class="'+(app?'mch':'multi')+'" data-multi="'+c.k+'">'+(L.length?L.map(function(x){return '<label><input type="checkbox" value="'+esc(x[0])+'"'+(sel.indexOf(x[0])>=0?' checked':'')+'>'+esc(x[1])+'</label>';}).join(''):'<small class="muted">Vincule pessoas à empresa primeiro.</small>')+'</div>',true); }
      var tp={data:'date',email:'email',pct:'number'}[c.t]||'text';
      var im={cnpj:'numeric',cpf:'numeric',cep:'numeric',tel:'tel',site:'url'}[c.mask]||{moeda:'decimal',email:'email',url:'url'}[c.t]||'';
      var ph={cnpj:'00.000.000/0000-00',cpf:'000.000.000-00',cep:'00000-000',tel:'(00) 00000-0000',insta:'@perfil',site:'site.com.br'}[c.mask]||(c.t==='moeda'?'0,00':'');
      if(c.mask&&val!==''){ if(FMT[c.mask]&&so(val).length>=8) val=FMT[c.mask](so(val)); else if(c.mask==='insta'&&valido('insta',val)) val='@'+String(val).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/[/?#].*$/,'').replace(/^@+/,'').toLowerCase(); }
      if(c.t==='moeda'&&val!=='') val=(+val).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
      return caixa(c,'<input type="'+tp+'"'+n+(im?' inputmode="'+im+'"':'')+(ph?' placeholder="'+ph+'"':'')+(c.mask?' data-mask="'+c.mask+'"':'')+(c.t==='moeda'?' data-moeda':'')+(c.t==='pct'?' min="0" max="100" step="5"':'')+(c.obrig?' required':'')+' value="'+esc(val)+'" autocomplete="off">');
    }
    function formCampos(defs,d,pess,grupos){ var g='', h=''; defs.forEach(function(c){ if(grupos&&c.g!==g){ g=c.g; h+='<p class="grp" style="grid-column:1/-1">'+esc(g)+'</p>'; } h+=campoForm(c,d[c.k],pess); }); return h; }
    function leForm(fm,defs){ var o={}; defs.forEach(function(c){ if(c.t==='multi'||c.t==='contatos') o[c.k]=[].map.call(fm.querySelectorAll('[data-multi="'+c.k+'"] :checked'),function(i){return i.value;}); else { var el=fm.elements[c.k]; if(el) o[c.k]=el.value; } }); return o; }

    function dica(fm,k,txt,tipo){ var d=fm.querySelector('[data-dica="'+k+'"]'); if(!d) return; d.textContent=txt||''; d.className='dica'+(tipo?' '+tipo:''); }
    function poe(fm,k,v,soVazio){ var el=fm.elements[k]; if(!el||v==null||v==='') return; if(soVazio&&el.value) return;
      if(el.tagName==='SELECT'&&!el.hasAttribute('data-cidade')){ var ok=[].some.call(el.options,function(o){return o.value===v||o.text===v;}); if(!ok){ var o=document.createElement('option'); o.textContent=v; el.appendChild(o); } }
      el.value=v; el.classList.add('auto'); setTimeout(function(){el.classList.remove('auto');},1600); }
    function cidades(fm,uf,quer){
      var sel=fm.querySelector('[data-cidade]'); if(!sel) return Promise.resolve();
      var atual=quer||sel.value;
      function monta(L){ sel.innerHTML='<option value="">Selecione a cidade…</option>'+L.map(function(c){return '<option'+(c===atual?' selected':'')+'>'+esc(c)+'</option>';}).join('');
        if(atual&&L.indexOf(atual)<0){ var i=L.map(function(x){return x.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();}).indexOf(atual.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()); if(i>=0) sel.value=L[i]; else { var o=document.createElement('option'); o.textContent=atual; o.selected=true; sel.insertBefore(o,sel.options[1]); } } }
      if(!uf){ sel.innerHTML='<option value="">Escolha o estado primeiro</option>'+(atual?'<option selected>'+esc(atual)+'</option>':''); return Promise.resolve(); }
      if(CIDADES[uf]){ monta(CIDADES[uf]); return Promise.resolve(); }
      sel.innerHTML='<option>Carregando cidades…</option>';
      return op.get('?a=admin-cidades&v='+uf).then(function(r){ if(r&&r.ok){ CIDADES[uf]=r.cidades; monta(r.cidades); } else monta(atual?[atual]:[]); }).catch(function(){ monta(atual?[atual]:[]); });
    }
    function aplica(fm,d,fixos){ // fixos: campos oficiais que sobrescrevem; o resto só preenche se vazio
      var uf=d.uf, cid=d.cidade;
      Object.keys(d).forEach(function(k){ if(k==='uf'||k==='cidade') return; poe(fm,k,d[k],fixos.indexOf(k)<0); });
      if(uf&&fm.elements.uf){ fm.elements.uf.value=uf; return cidades(fm,uf,cid); }
      return Promise.resolve();
    }
    function liga(fm,cfg){
      cfg=cfg||{};
      var ufEl=fm.querySelector('[data-uf]');
      if(ufEl){ cidades(fm,ufEl.value); ufEl.addEventListener('change',function(){ var s=fm.querySelector('[data-cidade]'); if(s) s.value=''; cidades(fm,ufEl.value,''); }); }
      var ultimoCnpj='', ultimoCep='';
      fm.addEventListener('input',function(ev){
        var el=ev.target, m=el.dataset&&el.dataset.mask; if(!m) return;
        if(FMT[m]){ var n=so(el.value), f=FMT[m](n); if(f!==el.value) el.value=f; }
        dica(fm,el.name,'');
        if(m==='cep'&&so(el.value).length===8&&so(el.value)!==ultimoCep){ ultimoCep=so(el.value); dica(fm,el.name,'Buscando endereço…');
          op.get('?a=admin-cep&v='+ultimoCep).then(function(r){ if(!r||!r.ok){ dica(fm,el.name,(r&&r.erro)||'CEP não encontrado.','erro'); return; }
            aplica(fm,r.dados,['endereco','bairro']).then(function(){ dica(fm,el.name,'✓ Endereço preenchido. Complete o número.','ok'); var nu=fm.elements.numero; if(nu&&!nu.value) nu.focus(); }); }); }
        if(m==='cnpj'){ var c=so(el.value); if(c.length===14){ if(!cnpjOk(c)){ dica(fm,el.name,ERRO.cnpj,'erro'); return; } if(c===ultimoCnpj) return; ultimoCnpj=c; dica(fm,el.name,'Consultando a Receita…');
          op.get('?a=admin-cnpj&v='+c).then(function(r){ if(!r||!r.ok){ dica(fm,el.name,(r&&r.erro)||'Não foi possível consultar.','erro'); return; }
            var d=r.dados; if(cfg.nome&&fm.elements[cfg.nome]&&(!fm.elements[cfg.nome].value||cfg.nomeTrocavel)) poe(fm,cfg.nome,r.fantasia||r.razao);
            aplica(fm,d,['razao','situacao','abertura','cnae','cep','endereco','numero','complemento','bairro','porte']).then(function(){
              dica(fm,el.name,'✓ Dados da Receita preenchidos'+(d.situacao?' · situação '+d.situacao.toLowerCase():'')+'. Confira.',d.situacao&&d.situacao!=='Ativa'?'erro':'ok'); }); }); } }
      });
      fm.addEventListener('blur',function(ev){ var el=ev.target, m=el.dataset&&el.dataset.mask; if(!m||!el.value) return;
        if(!valido(m,el.value)) dica(fm,el.name,ERRO[m],'erro');
        else if(m==='insta'){ el.value='@'+String(el.value).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/[/?#].*$/,'').replace(/^@+/,'').toLowerCase(); } },true);
      fm.addEventListener('blur',function(ev){ var el=ev.target; if(!el.hasAttribute||!el.hasAttribute('data-moeda')||!el.value) return; var n=parseFloat(String(el.value).replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,'')); if(isFinite(n)) el.value=n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); },true);
    }
    // confere antes de salvar; devolve a mensagem do primeiro erro (ou '')
    function confere(fm){ var erro='';
      [].forEach.call(fm.querySelectorAll('[data-mask]'),function(el){ if(el.value&&!valido(el.dataset.mask,el.value)){ dica(fm,el.name,ERRO[el.dataset.mask],'erro'); if(!erro){ erro=(el.closest('label,.campo').querySelector('label')||el.closest('label')).firstChild.textContent+': '+ERRO[el.dataset.mask]; el.focus(); } } });
      var em=fm.querySelector('input[type=email]'); if(!erro&&em&&em.value&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)){ erro='E-mail inválido.'; em.focus(); }
      if(erro&&op.toast) op.toast(erro); return erro; }
    /* ---- fotos de empresa e contato ---- */
    function fotoUrl(slug,email,v){ return v?'/api/area?a=foto&k='+encodeURIComponent(email?'p:'+slug+':'+email:'emp:'+slug)+'&v='+v:''; }
    function avatar(nome,slug,email,v,cls){ var u=fotoUrl(slug,email,v), ini=String(nome||'?').split(/\s+/).filter(Boolean).slice(0,2).map(function(x){return x[0];}).join('').toUpperCase();
      return '<span class="'+(cls||'')+' tem-foto"'+(u?'':' data-sem')+'>'+(u?'<img src="'+u+'" alt="" loading="lazy">':esc(ini))+'</span>'; }
    // recorta no centro em quadrado e reduz para 320px (JPEG), para guardar leve
    function reduz(fonte){ return new Promise(function(ok,erro){
      var img=new Image(); img.onload=function(){ var l=Math.min(img.naturalWidth,img.naturalHeight); if(!l){ erro(); return; } var cv=document.createElement('canvas'); cv.width=cv.height=320;
        var cx=cv.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,320,320); cx.drawImage(img,(img.naturalWidth-l)/2,(img.naturalHeight-l)/2,l,l,0,0,320,320); ok(cv.toDataURL('image/jpeg',0.85)); };
      img.onerror=function(){ erro(); };
      if(typeof fonte==='string') img.src=fonte; else { var fr=new FileReader(); fr.onload=function(){ img.src=fr.result; }; fr.onerror=erro; fr.readAsDataURL(fonte); } }); }
    /* editor de enquadramento: arrastar para posicionar, zoom pela barra, roda do mouse ou pinça */
    function estiloEditor(){ if(document.getElementById('crop-css')) return; var st=document.createElement('style'); st.id='crop-css';
      st.textContent='.crop-veu{position:fixed;inset:0;z-index:90;background:rgba(5,8,25,.72);display:grid;place-items:center;padding:16px}'+
        '.crop-box{background:var(--bg,#fff);color:var(--fg,#000);border-radius:24px;padding:18px;width:min(340px,100%);display:grid;gap:14px;box-shadow:0 20px 60px rgba(0,0,0,.35)}'+
        '.crop-box h3{margin:0;font-size:1.05rem}.crop-box p{margin:-8px 0 0;font-size:.78rem;opacity:.7}'+
        '.crop-palco{position:relative;width:280px;height:280px;margin:0 auto;overflow:hidden;border-radius:18px;background:#111;touch-action:none;cursor:grab;user-select:none}'+
        '.crop-palco img{position:absolute;left:0;top:0;transform-origin:0 0;max-width:none;pointer-events:none;-webkit-user-drag:none}'+
        '.crop-palco i{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 400px rgba(0,0,0,.55);border:2px solid rgba(255,255,255,.9);pointer-events:none}'+
        '.crop-zoom{display:flex;align-items:center;gap:10px;font-size:.8rem}.crop-zoom input{flex:1;accent-color:#00c46a}'+
        '.crop-bts{display:flex;gap:8px;justify-content:flex-end}.crop-bts button{font:inherit;font-weight:700;font-size:.86rem;border-radius:999px;padding:11px 18px;cursor:pointer;border:1px solid rgba(128,128,128,.35);background:transparent;color:inherit}'+
        '.crop-bts .ok{background:var(--fg,#000);color:var(--bg,#fff);border-color:transparent}.solta{outline:2px dashed #00c46a;outline-offset:6px;border-radius:16px}';
      document.head.appendChild(st); }
    function editor(fonte){ estiloEditor(); return new Promise(function(fim){
      var L=280, veu=document.createElement('div'); veu.className='crop-veu';
      veu.innerHTML='<div class="crop-box" role="dialog" aria-label="Ajustar foto"><h3>Ajustar foto</h3><p>Arraste para posicionar e use o zoom para enquadrar na bolinha.</p><div class="crop-palco"><img alt=""><i></i></div>'+
        '<label class="crop-zoom"><span>−</span><input type="range" min="1" max="8" step="0.01" value="1" aria-label="Zoom"><span>+</span></label><div class="crop-bts"><button type="button" data-x>Cancelar</button><button type="button" class="ok" data-ok>Salvar foto</button></div></div>';
      document.body.appendChild(veu);
      var palco=veu.querySelector('.crop-palco'), img=veu.querySelector('img'), rg=veu.querySelector('input'), w=0,h=0,base=1,z=1,x=0,y=0, pts={}, pinca=null;
      function S(){ return base*z; }
      function prende(){ var s=S(); x=Math.min(0,Math.max(L-w*s,x)); y=Math.min(0,Math.max(L-h*s,y)); }
      function desenha(){ prende(); img.style.transform='translate('+x+'px,'+y+'px) scale('+S()+')'; }
      function zoom(nz,cx,cy){ nz=Math.max(1,Math.min(8,nz)); if(cx==null){cx=L/2;cy=L/2;} var s0=S(); z=nz; var s1=S(); x=cx-(cx-x)*s1/s0; y=cy-(cy-y)*s1/s0; rg.value=z; desenha(); }
      img.onload=function(){ w=img.naturalWidth; h=img.naturalHeight; base=L/Math.min(w,h); z=1; x=(L-w*base)/2; y=(L-h*base)/2; desenha(); };
      img.onerror=function(){ op.toast('Não consegui abrir essa imagem.'); sai(null); };
      if(typeof fonte==='string') img.src=fonte; else { var fr=new FileReader(); fr.onload=function(){ img.src=fr.result; }; fr.readAsDataURL(fonte); }
      rg.oninput=function(){ zoom(+rg.value); };
      palco.addEventListener('wheel',function(ev){ ev.preventDefault(); var r=palco.getBoundingClientRect(); zoom(z*(ev.deltaY<0?1.08:1/1.08),ev.clientX-r.left,ev.clientY-r.top); },{passive:false});
      palco.addEventListener('pointerdown',function(ev){ palco.setPointerCapture(ev.pointerId); pts[ev.pointerId]={x:ev.clientX,y:ev.clientY}; palco.style.cursor='grabbing'; });
      palco.addEventListener('pointermove',function(ev){ var p=pts[ev.pointerId]; if(!p) return; var ids=Object.keys(pts);
        if(ids.length>=2){ var a=pts[ids[0]], b=pts[ids[1]]; p.x=ev.clientX; p.y=ev.clientY; var d=Math.hypot(a.x-b.x,a.y-b.y), r=palco.getBoundingClientRect();
          if(pinca){ zoom(pinca.z*d/pinca.d,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top); } else pinca={d:d,z:z}; return; }
        x+=ev.clientX-p.x; y+=ev.clientY-p.y; p.x=ev.clientX; p.y=ev.clientY; desenha(); });
      function solta(ev){ delete pts[ev.pointerId]; if(Object.keys(pts).length<2) pinca=null; palco.style.cursor='grab'; }
      palco.addEventListener('pointerup',solta); palco.addEventListener('pointercancel',solta);
      function sai(v){ document.removeEventListener('keydown',tecla); veu.remove(); fim(v); }
      function tecla(ev){ if(ev.key==='Escape') sai(null); }
      document.addEventListener('keydown',tecla);
      veu.querySelector('[data-x]').onclick=function(){ sai(null); };
      veu.onclick=function(ev){ if(ev.target===veu) sai(null); };
      veu.querySelector('[data-ok]').onclick=function(){ if(!w){ sai(null); return; } var cv=document.createElement('canvas'), k=320/L; cv.width=cv.height=320; var cx=cv.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,320,320);
        cx.drawImage(img,x*k,y*k,w*S()*k,h*S()*k); try{ sai(cv.toDataURL('image/jpeg',0.86)); }catch(e){ op.toast('Não foi possível usar essa imagem.'); sai(null); } };
    }); }
    function fotoBotoes(tem){ var c=app?'bt peq':'pill';
      return '<div class="foto-acoes"><button type="button" class="'+c+'" data-foto-insta>Puxar do Instagram</button>'+(app?'':'<button type="button" class="'+c+'" data-foto-abre>Abrir Instagram</button><button type="button" class="'+c+'" data-foto-cola>Colar imagem</button>')+
        '<label class="'+c+'" style="cursor:pointer">Enviar foto<input type="file" accept="image/*" data-foto-arq hidden></label>'+(tem?'<button type="button" class="'+c+'" data-foto-ajusta>Ajustar</button><button type="button" class="'+c+'" data-foto-del>Remover</button>':'')+'</div>'+
        (app&&!tem?'<small class="foto-dica">Perfil pessoal? Tire um print do perfil no Instagram, toque em Enviar foto e aproxime na bolinha.</small>':''); }
    var TENTOU={};
    function limpaInsta(v){ return String(v||'').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/[/?#].*$/,'').replace(/^@+/,'').toLowerCase(); }
    // liga os botões de foto dentro de "raiz". cfg: {slug, email?, insta(): @ atual, estado(): {foto, origem}, campo: input do Instagram (opcional), depois(v)}
    function ligaFoto(raiz,cfg){
      var chave=cfg.slug+'|'+(cfg.email||'');
      function salva(d,origem,quieto){ return op.post({a:'admin-foto',slug:cfg.slug,email:cfg.email||'',dados:d,origem:origem||'upload'}).then(function(r){ if(!r.ok){ if(!quieto) op.toast(r.erro||'Não foi possível salvar a foto.'); return; } op.toast(quieto?'Foto do Instagram puxada.':'Foto atualizada.'); cfg.depois(r.foto,origem||'upload'); }); }
      function doInsta(h,quieto,btn){ h=limpaInsta(h); if(!/^[a-z0-9._]{1,30}$/.test(h)){ if(!quieto) op.toast('Informe um @ do Instagram válido.'); return; }
        TENTOU[chave+'@'+h]=1; var t=btn&&btn.textContent; if(btn){ btn.disabled=true; btn.textContent='Buscando…'; }
        op.get('?a=admin-foto-insta&u='+encodeURIComponent(h)).then(function(r){ if(btn){ btn.disabled=false; btn.textContent=t; }
          if(!r||!r.ok){ if(!quieto) op.toast((op.meta&&!op.meta()&&!(r&&r.pessoal))?'O Instagram bloqueia a busca sem a conexão oficial. Conecte em Site → Instagram (no computador) ou use Enviar foto.':((r&&r.erro)||'Não consegui puxar a foto.')); return; }
          return reduz(r.dados).then(function(d){ return salva(d,'@'+h,quieto); },function(){ if(!quieto) op.toast('A imagem do Instagram veio com problema. Use "Enviar foto".'); }); }).catch(function(){ if(btn){ btn.disabled=false; btn.textContent=t; } }); }
      // automático: quando o @ muda (e a foto atual não foi enviada à mão) ou ao abrir uma ficha com @ e sem foto
      function podeAuto(h){ var e=cfg.estado?cfg.estado():{}; h='@'+limpaInsta(h); if(h==='@') return false; if(!e.foto) return true; return /^@/.test(e.origem||'')&&e.origem!==h; }
      if(cfg.campo) cfg.campo.addEventListener('change',function(){ var v=cfg.campo.value; if(valido('insta',v)&&podeAuto(v)) doInsta(v,true); });
      estiloEditor();
      var ini=cfg.insta&&cfg.insta(); if(op.meta&&op.meta()&&ini&&valido('insta',ini)&&!(cfg.estado&&cfg.estado().foto)&&!TENTOU[chave+'@'+limpaInsta(ini)]) doInsta(ini,true);
      raiz.addEventListener('click',function(ev){
        var b=ev.target.closest('[data-foto-insta],[data-foto-del],[data-foto-ajusta],[data-foto-abre],[data-foto-cola]'); if(!b||!raiz.contains(b)) return; ev.preventDefault();
        if(b.hasAttribute('data-foto-abre')){ var hh=limpaInsta((cfg.insta&&cfg.insta())||''); if(!hh){ hh=limpaInsta(prompt('Qual o @ do Instagram?')||''); if(!hh) return; }
          window.open('https://www.instagram.com/'+hh+'/','_blank','noopener'); op.toast('No perfil, copie a foto (botão direito ou segure o dedo → Copiar imagem) e volte aqui em "Colar imagem".'); return; }
        if(b.hasAttribute('data-foto-cola')){ b.focus();
          if(navigator.clipboard&&navigator.clipboard.read){ navigator.clipboard.read().then(function(itens){ for(var i=0;i<itens.length;i++){ var tp=itens[i].types.filter(function(t){return /^image\//.test(t);})[0]; if(tp) return itens[i].getType(tp); } throw 0; })
            .then(function(blob){ return editor(blob).then(function(d){ if(d) salva(d,'upload'); }); })
            .catch(function(){ op.toast('Não achei imagem copiada. Copie a foto e aperte Ctrl+V (ou toque em Colar de novo).'); }); }
          else op.toast('Aperte Ctrl+V para colar a imagem copiada.');
          return; }
        if(b.hasAttribute('data-foto-del')){ op.post({a:'admin-foto',slug:cfg.slug,email:cfg.email||'',remover:true}).then(function(r){ if(r.ok){ op.toast('Foto removida.'); cfg.depois('',''); } }); return; }
        if(b.hasAttribute('data-foto-ajusta')){ var e=cfg.estado?cfg.estado():{}; if(!e.foto) return; editor(fotoUrl(cfg.slug,cfg.email,e.foto)).then(function(d){ if(d) salva(d,e.origem||'upload'); }); return; }
        var h=(cfg.insta&&cfg.insta())||''; if(!h){ h=prompt('Qual o @ do Instagram?'); if(!h) return; }
        doInsta(h,false,b);
      });
      function deArquivo(arq){ if(!arq||!/^image\//.test(arq.type)) return false; editor(arq).then(function(d){ if(d) salva(d,'upload'); }); return true; }
      raiz.addEventListener('paste',function(ev){ var it=[].filter.call((ev.clipboardData||{}).items||[],function(x){return /^image\//.test(x.type);})[0]; if(it){ ev.preventDefault(); deArquivo(it.getAsFile()); } });
      raiz.addEventListener('dragover',function(ev){ ev.preventDefault(); raiz.classList.add('solta'); });
      raiz.addEventListener('dragleave',function(){ raiz.classList.remove('solta'); });
      raiz.addEventListener('drop',function(ev){ ev.preventDefault(); raiz.classList.remove('solta'); var f=ev.dataTransfer&&ev.dataTransfer.files&&ev.dataTransfer.files[0];
        if(!deArquivo(f)){ var u=ev.dataTransfer&&(ev.dataTransfer.getData('text/uri-list')||''); op.toast(u?'O Instagram não deixa arrastar direto. Copie a imagem e use "Colar imagem".':'Solte uma imagem.'); } });
      raiz.addEventListener('change',function(ev){ var i=ev.target; if(!i.hasAttribute||!i.hasAttribute('data-foto-arq')||!i.files[0]) return;
        var arq=i.files[0]; i.value=''; if(!/^image\//.test(arq.type)){ op.toast('Escolha uma imagem.'); return; }
        editor(arq).then(function(d){ if(d) salva(d,'upload'); }); });
    }
    return { vazio:vazio, fotoUrl:fotoUrl, avatar:avatar, fotoBotoes:fotoBotoes, ligaFoto:ligaFoto, reduz:reduz, editor:editor, valTxt:valTxt, campoForm:campoForm, formCampos:formCampos, leForm:leForm, liga:liga, confere:confere, normSel:normSel };
  };
})();
