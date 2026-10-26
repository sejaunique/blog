// Juntar empresas duplicadas numa só (a "principal").
// Tudo o que é das outras passa para a principal: dados (preenche o que está vazio), contatos (mesmo e-mail vira um só),
// negócios, ações, entregas, leituras, vitórias, reuniões, anotações, comentários e curtidas, arquivos fixados,
// propostas e contratos. As outras ficam arquivadas e viram apelido da principal (login e links antigos continuam valendo).
// No Notion: contatos, negócios e tarefas passam a apontar para a página da principal; as páginas repetidas são arquivadas.

const ORDEM_ETAPA = { lead: 0, qualificado: 1, finalizado: 2, cliente: 3 };
const vazio = v => v == null || v === '' || (Array.isArray(v) && !v.length);

function cria(dep) {
  const { redis, lerPares, NOTION, json, slugify } = dep;
  const pares = h => lerPares(h);

  async function previa(P, outras) {
    const todos = [P].concat(outras);
    const r = await redis(todos.flatMap(s => [['GET', 'area:emp:' + s], ['SCARD', 'area:users:' + s], ['HLEN', 'area:neg:' + s], ['HLEN', 'area:acoes:' + s], ['HLEN', 'area:itens:' + s], ['HLEN', 'area:reun:' + s], ['HLEN', 'area:vit:' + s]]));
    return todos.map((s, i) => { const e = json(r[i * 7]) || {}; return { slug: s, nome: e.nome || s, etapa: e.etapa || 'lead', notion: !!e.notion, arquivada: !!e.arquivada, contatos: +r[i * 7 + 1] || 0, negocios: +r[i * 7 + 2] || 0, acoes: +r[i * 7 + 3] || 0, entregas: +r[i * 7 + 4] || 0, reunioes: +r[i * 7 + 5] || 0, vitorias: +r[i * 7 + 6] || 0 }; });
  }

  async function copiaHash(de, para, cmds, ids) {
    const [h] = await redis([['HGETALL', de]]);
    const L = pares(h);
    L.forEach(([k, v]) => { cmds.push(['HSETNX', para, k, v]); if (ids) ids.push(k); });
    if (L.length) cmds.push(['DEL', de]);
    return L;
  }

  async function junta(P, outras, nomeNovo) {
    P = slugify(P);
    outras = Array.from(new Set((outras || []).map(slugify))).filter(s => s && s !== P);
    if (!P || !outras.length) throw new Error('Escolha a empresa principal e pelo menos mais uma.');
    const [pv] = await redis([['GET', 'area:emp:' + P]]);
    const pe = json(pv);
    if (!pe) throw new Error('Empresa principal não encontrada.');
    const mov = { pessoas: [], negs: [], acoes: [], arquivar: [] };
    const resumo = { contatos: 0, repetidos: 0, negocios: 0, acoes: 0, entregas: 0, reunioes: 0, vitorias: 0, outros: 0 };
    const agora = new Date().toISOString();
    const [nm] = await redis([['HGETALL', 'area:nmap']]);
    const nmap = pares(nm);
    const [pUsers] = await redis([['SMEMBERS', 'area:users:' + P]]);
    const jaTem = new Set(pUsers || []);

    for (const D of outras) {
      const [dv, dUsers] = await redis([['GET', 'area:emp:' + D], ['SMEMBERS', 'area:users:' + D]]);
      const de = json(dv);
      if (!de) continue;
      const cmds = [];
      // dados da empresa: a principal só ganha o que não tem
      pe.dados = pe.dados || {};
      Object.keys(de.dados || {}).forEach(k => { if (vazio(pe.dados[k]) && !vazio(de.dados[k])) pe.dados[k] = de.dados[k]; });
      ['foto', 'fotoOrigem', 'diagnostico'].forEach(k => { if (vazio(pe[k]) && !vazio(de[k])) pe[k] = de[k]; });
      pe.tags = Array.from(new Set((pe.tags || []).concat(de.tags || [])));
      if ((ORDEM_ETAPA[de.etapa] || 0) > (ORDEM_ETAPA[pe.etapa] || 0)) pe.etapa = de.etapa;
      if (de.criado && (!pe.criado || de.criado < pe.criado)) pe.criado = de.criado;
      if (!pe.notion && de.notion) { pe.notion = de.notion; cmds.push(['HSET', 'area:nmap', de.notion, 'e|' + P]); }
      else if (de.notion && de.notion !== pe.notion) mov.arquivar.push(de.notion);
      if (!pe.drivePasta && de.drivePasta) { pe.drivePasta = de.drivePasta; pe.driveLink = de.driveLink; pe.driveCompart = de.driveCompart || []; }

      // contatos: mesmo e-mail vira um só (fica o da principal, completado com o que faltava)
      const uKeys = (dUsers || []).map(m => 'area:user:' + D + ':' + m);
      const pKeys = (dUsers || []).map(m => 'area:user:' + P + ':' + m);
      const us = uKeys.length ? await redis(uKeys.map(k => ['GET', k]).concat(pKeys.map(k => ['GET', k]))) : [];
      (dUsers || []).forEach((m, i) => {
        const u = json(us[i]); if (!u) return;
        const pu = json(us[uKeys.length + i]);
        let novo;
        if (pu) {
          novo = Object.assign({}, u, pu);
          Object.keys(u).forEach(k => { if (vazio(pu[k]) && !vazio(u[k])) novo[k] = u[k]; });
          ['dados', 'crm'].forEach(k => { if (u[k] || pu[k]) { novo[k] = Object.assign({}, u[k] || {}); Object.keys(pu[k] || {}).forEach(c => { if (!vazio(pu[k][c])) novo[k][c] = pu[k][c]; }); } });
          if (!pu.hash && u.hash) { novo.hash = u.hash; novo.sal = u.sal; novo.status = u.status; }
          if (pu.status !== 'ativo' && u.status === 'ativo') novo.status = 'ativo';
          if (u.notion && pu.notion && u.notion !== pu.notion) { mov.arquivar.push(u.notion); cmds.push(['HSET', 'area:nmap', u.notion, 'p|' + P + '|' + m]); }
          else if (u.notion && !pu.notion) novo.notion = u.notion;
          resumo.repetidos++;
        } else novo = u;
        novo.slug = P; novo.empresaNome = nomeNovo || pe.nome; delete novo.arquivada;
        cmds.push(['SET', 'area:user:' + P + ':' + m, JSON.stringify(novo)], ['SADD', 'area:users:' + P, m], ['DEL', 'area:user:' + D + ':' + m]);
        if (novo.notion) cmds.push(['HSET', 'area:nmap', novo.notion, 'p|' + P + '|' + m]);
        if (mov.pessoas.indexOf(m) < 0) mov.pessoas.push(m);
        jaTem.add(m); resumo.contatos++;
      });
      cmds.push(['DEL', 'area:users:' + D]);

      // registros em hash: negócios, ações, entregas, leituras, vitórias, reuniões e o resto
      const negs = await copiaHash('area:neg:' + D, 'area:neg:' + P, cmds, mov.negs);
      negs.forEach(([k, v]) => { const g = json(v); if (g) { g.slug = P; cmds.push(['HSET', 'area:neg:' + P, k, JSON.stringify(g)]); if (g.notion) cmds.push(['HSET', 'area:nmap', g.notion, 'n|' + P + '|' + k]); } });
      resumo.negocios += negs.length;
      const acoes = await copiaHash('area:acoes:' + D, 'area:acoes:' + P, cmds, mov.acoes);
      acoes.forEach(([k, v]) => { const a = json(v); if (a && a.notion) cmds.push(['HSET', 'area:nmap', a.notion, 'a|' + P + '|' + k]); });
      resumo.acoes += acoes.length;
      const itens = await copiaHash('area:itens:' + D, 'area:itens:' + P, cmds);
      resumo.entregas += itens.length;
      const reun = await copiaHash('area:reun:' + D, 'area:reun:' + P, cmds);
      if (reun.length) cmds.push(['SADD', 'area:reun:slugs', P]);
      resumo.reunioes += reun.length;
      const vit = await copiaHash('area:vit:' + D, 'area:vit:' + P, cmds);
      vit.forEach(([k, v]) => { const x = json(v); if (x && x.slug) { x.slug = P; cmds.push(['HSET', 'area:vit:' + P, k, JSON.stringify(x)]); } });
      resumo.vitorias += vit.length;
      let acpub = [];
      for (const f of ['leit', 'anot', 'publico', 'restrito', 'mst', 'arq-fix', 'neg-arq', 'acpub']) { const L = await copiaHash('area:' + f + ':' + D, 'area:' + f + ':' + P, cmds); if (f === 'acpub') acpub = L; resumo.outros += L.length; }
      // links públicos de ações apontam para a principal
      const toks = acpub.map(([, t]) => t);
      const tv = toks.length ? await redis(toks.map(t => ['GET', 'area:acpubt:' + t])) : [];
      toks.forEach((t, i) => { const o = json(tv[i]); if (o && o.slug === D) { o.slug = P; cmds.push(['SET', 'area:acpubt:' + t, JSON.stringify(o)]); } });
      // conjuntos e listas
      const [oc, cat, notas] = await redis([['SMEMBERS', 'area:arq-oculto:' + D], ['SMEMBERS', 'area:acoes-cat:' + D], ['LRANGE', 'area:notas:' + D, 0, -1]]);
      if ((oc || []).length) cmds.push(['SADD', 'area:arq-oculto:' + P].concat(oc));
      if ((cat || []).length) cmds.push(['SADD', 'area:acoes-cat:' + P].concat(cat));
      if ((notas || []).length) cmds.push(['RPUSH', 'area:notas:' + P].concat(notas));
      cmds.push(['DEL', 'area:arq-oculto:' + D], ['DEL', 'area:acoes-cat:' + D], ['DEL', 'area:notas:' + D], ['DEL', 'area:gdrive:' + D], ['DEL', 'area:gdrive:' + P]);
      // comentários, curtidas, páginas com IA e fotos de cada registro
      const ids = acoes.concat(itens).map(([k]) => k);
      const vids = vit.map(([k]) => k);
      const ped = [];
      ids.forEach(id => ped.push(['com', 'area:com:' + D + ':' + id, 'area:com:' + P + ':' + id], ['curt', 'area:curt:' + D + ':' + id, 'area:curt:' + P + ':' + id], ['str', 'area:ahtml:' + D + ':' + id, 'area:ahtml:' + P + ':' + id]));
      vids.forEach(id => ped.push(['com', 'area:com:' + D + ':v:' + id, 'area:com:' + P + ':v:' + id], ['curt', 'area:curt:' + D + ':v:' + id, 'area:curt:' + P + ':v:' + id], ['str', 'area:vitfoto:' + D + ':' + id, 'area:vitfoto:' + P + ':' + id]));
      if (ped.length) {
        const vals = await redis(ped.map(([t, k]) => t === 'com' ? ['LRANGE', k, 0, -1] : t === 'curt' ? ['SMEMBERS', k] : ['GET', k]));
        ped.forEach(([t, de, para], i) => {
          const v = vals[i];
          if (t === 'str') { if (v) cmds.push(['SET', para, v], ['DEL', de]); }
          else if ((v || []).length) cmds.push([t === 'com' ? 'RPUSH' : 'SADD', para].concat(v), ['DEL', de]);
        });
      }
      // propriedades do Notion que apontavam para a outra
      nmap.forEach(([id, v]) => {
        if (v === 'e|' + D) cmds.push(['HSET', 'area:nmap', id, 'e|' + P]); // a página repetida é arquivada no Notion logo abaixo
        if (v === 'r|' + D) cmds.push(['HSET', 'area:nmap', id, 'r|' + P]);
      });
      // a outra fica arquivada como apelido da principal
      de.arquivada = agora; de.juntadaEm = P; de.notion = '';
      cmds.push(['SET', 'area:emp:' + D, JSON.stringify(de)], ['SET', 'area:alias:' + D, P], ['SREM', 'area:emps', D]);
      await redis(cmds);
    }

    // propostas, contratos, modelos e conteúdos liberados que citavam as outras
    const [hp, hc, hm] = await redis([['HGETALL', 'area:propostas'], ['HGETALL', 'area:contratos'], ['HGETALL', 'area:modelos']]);
    const c2 = [];
    pares(hp).forEach(([k, v]) => { const x = json(v); if (x && outras.indexOf(x.slug) >= 0) { x.slug = P; x.empresa = nomeNovo || pe.nome; c2.push(['HSET', 'area:propostas', k, JSON.stringify(x)]); } });
    pares(hc).forEach(([k, v]) => { const x = json(v); if (x && outras.indexOf(x.slug) >= 0) { x.slug = P; x.empresa = nomeNovo || pe.nome; c2.push(['HSET', 'area:contratos', k, JSON.stringify(x)]); } });
    pares(hm).forEach(([k, v]) => { const x = json(v); if (x && Array.isArray(x.destino) && x.destino.some(s => outras.indexOf(s) >= 0)) { x.destino = Array.from(new Set(x.destino.map(s => outras.indexOf(s) >= 0 ? P : s))); c2.push(['HSET', 'area:modelos', k, JSON.stringify(x)]); } });
    const [hcv] = await redis([['HGETALL', 'area:canivete']]);
    pares(hcv).forEach(([k, v]) => { const x = json(v); if (x && Array.isArray(x.destino) && x.destino.some(s => outras.indexOf(s) >= 0)) { x.destino = Array.from(new Set(x.destino.map(s => outras.indexOf(s) >= 0 ? P : s))); c2.push(['HSET', 'area:canivete', k, JSON.stringify(x)]); } });
    if (nomeNovo) pe.nome = nomeNovo;
    pe.juntou = (pe.juntou || []).concat(outras.map(s => ({ slug: s, em: agora })));
    pe.editado = agora;
    c2.push(['SET', 'area:emp:' + P, JSON.stringify(pe)], ['SADD', 'area:emps', P]);
    await redis(c2);

    // Notion
    let notion = null;
    if (NOTION && NOTION.ligado() && pe.notion) {
      mov.arquivar = Array.from(new Set(mov.arquivar));
      notion = await NOTION.junta(redis, P, mov).catch(err => ({ ok: false, erros: [String(err.message)] }));
    }
    return { ok: true, principal: P, nome: pe.nome, resumo, notion };
  }

  return { previa, junta };
}

// nomes parecidos (palavra marcante em comum, mesmo CNPJ ou mesmo e-mail de contato) para sugerir junção
const COMUNS = new Set(['ltda', 'eireli', 'epp', 'comercio', 'industria', 'servicos', 'confeccoes', 'uniformes', 'design', 'grupo', 'empresa', 'brasil', 'distribuidora', 'loja', 'store', 'moda', 'solucoes', 'consultoria', 'textil', 'importacao', 'exportacao', 'representacoes', 'digital', 'center']);
function palavras(nome) { return String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !COMUNS.has(w)); }

module.exports = { cria, palavras };
