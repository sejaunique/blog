// Sincronização painel <-> Notion (Fase 1: Empresa, Contato e Lead/Negócio).
// O Notion é a base principal; o painel é a vitrine. Token da integração interna em NOTION_TOKEN.
//
// Redis:
//   area:nmap               hash idNotion -> "e|slug" | "p|slug|email" | "n|slug|id"
//   area:notion:estado      {carga:ISO, ultimo:ISO, erro, puxadas}
//   area:notion:painel      lista de idNotion que ainda precisam do link "Painel" (preenchido aos poucos)
//   area:notion:fila        envios que falharam (repetidos na próxima sincronização)
//   area:neg-arq:<slug>     negócios arquivados no Notion (cópia de segurança)
// Cada registro do painel guarda .notion (id da página) e .nEd (last_edited_time visto por último).

const CAMPOS = require('./campos.js');

const NV = '2022-06-28';
const DB = { emp: '20e94b57fed881a08c1eeb85fbb99700', pessoa: '25394b57fed88154bb5df25b63ac14e5', lead: '25394b57fed881e09ac8ef513a9a4e3f' };
const SITE = 'https://sejaunique.vercel.app';
const ligado = () => !!process.env.NOTION_TOKEN;
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const idc = id => String(id || '').replace(/-/g, '');
const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
const dorme = ms => new Promise(r => setTimeout(r, ms));
const so = v => String(v || '').replace(/\D/g, '');
const agora = () => new Date().toISOString();

// contato do Notion sem e-mail: o painel guarda com um e-mail interno (nunca exibido nem usado para login)
const emailInterno = id => 'n' + idc(id) + '@contato.notion';
const ehInterno = e => /@contato\.notion$/.test(String(e || ''));

async function api(metodo, caminho, corpo) {
  for (let t = 0; t < 5; t++) {
    const r = await fetch('https://api.notion.com/v1/' + caminho, {
      method: metodo,
      headers: { Authorization: 'Bearer ' + process.env.NOTION_TOKEN, 'Notion-Version': NV, 'Content-Type': 'application/json' },
      body: corpo ? JSON.stringify(corpo) : undefined
    });
    if (r.status === 429 || r.status >= 500) { await dorme(Math.min(8, +r.headers.get('retry-after') || (t + 1)) * 1000); continue; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.message || ('Notion ' + r.status)); e.status = r.status; e.code = j.code; throw e; }
    return j;
  }
  throw new Error('O Notion está ocupado. Tente de novo em instantes.');
}
async function todas(db, filtro) {
  let out = [], cursor;
  do {
    const j = await api('POST', 'databases/' + db + '/query', Object.assign({ page_size: 100 }, cursor ? { start_cursor: cursor } : {}, filtro ? { filter: filtro } : {}));
    out = out.concat(j.results || []);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}

// ---------- leitura e escrita de propriedades ----------
const txt = arr => (arr || []).map(x => x.plain_text || '').join('').trim();
function ler(props, nome) {
  const p = props[nome];
  if (!p) return undefined;
  switch (p.type) {
    case 'title': return txt(p.title);
    case 'rich_text': return txt(p.rich_text);
    case 'email': return p.email || '';
    case 'phone_number': return p.phone_number || '';
    case 'url': return p.url || '';
    case 'number': return p.number;
    case 'select': return p.select ? p.select.name : '';
    case 'status': return p.status ? p.status.name : '';
    case 'multi_select': return p.multi_select.map(o => o.name);
    case 'date': return p.date ? String(p.date.start).slice(0, 10) : '';
    case 'relation': return p.relation.map(r => idc(r.id));
    case 'people': return p.people.map(u => u.name).filter(Boolean);
    default: return undefined;
  }
}
const nomeOp = v => String(v).replace(/,/g, ' ').trim().slice(0, 100);
const W = {
  title: v => ({ title: [{ text: { content: String(v || 'Sem nome').slice(0, 2000) } }] }),
  text: v => ({ rich_text: v ? [{ text: { content: String(v).slice(0, 2000) } }] : [] }),
  email: v => ({ email: v || null }),
  tel: v => ({ phone_number: v || null }),
  url: v => ({ url: v || null }),
  num: v => ({ number: v === '' || v == null || !isFinite(+v) ? null : +v }),
  sel: v => ({ select: v ? { name: nomeOp(v) } : null }),
  multi: v => ({ multi_select: (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean).map(n => ({ name: nomeOp(n) })) }),
  data: v => ({ date: v ? { start: v } : null }),
  rel: ids => ({ relation: (ids || []).map(id => ({ id })) })
};

// [chave no painel, propriedade no Notion, tipo]
const MAP = {
  emp: [
    ['cnpj', 'CNPJ', 'text'], ['razao', 'Razão Social', 'text'], ['fantasia', 'Nome fantasia', 'text'], ['situacao', 'Situação', 'sel'],
    ['abertura', 'Abertura', 'data'], ['cnae', 'Atividade principal', 'text'], ['natureza', 'Natureza jurídica', 'sel'], ['porte', 'Porte', 'sel'],
    ['simples', 'Simples / MEI', 'sel'], ['capital', 'Capital social', 'num'], ['socios', 'Sócios', 'text'], ['segmento', 'Segmento', 'sel'],
    ['tempo', 'Tempo de mercado', 'sel'], ['faturamento', 'Faturamento mensal', 'sel'], ['colaboradores', 'Colaboradores', 'sel'],
    ['responsavel', 'Responsável', 'text'], ['tipoCliente', 'Tipo de cliente', 'sel'], ['grupo', 'Grupo estratégico', 'sel'],
    ['frequencia', 'Frequência', 'sel'], ['statusCliente', 'Status do cliente', 'sel'], ['rating', 'Rating', 'sel'], ['resumo', 'Resumo Empresa', 'text'],
    ['telefone', 'Telefone', 'tel'], ['email', 'Email', 'email'], ['site', 'Site', 'url'], ['instagram', 'Instagram', 'text'],
    ['linkedin', 'LinkedIn', 'url'], ['obs', 'Observações', 'text']
  ],
  pessoa: [
    ['telComercial', 'Telefone Comercial', 'tel'], ['cpf', 'CPF', 'text'], ['nascimento', 'Data de nascimento', 'data'], ['cargo', 'Cargo', 'multi'],
    ['ativa', 'Ativa na empresa?', 'sel'], ['tipoContato', 'Tipo de contato', 'sel'], ['influencia', 'Grau de influência', 'sel'], ['sexo', 'Sexo', 'sel'],
    ['avaliouGoogle', 'Avaliou no Google', 'sel'], ['pedimosIndicacao', 'Pedimos indicação', 'sel'], ['indicacoes', 'Indicações', 'text'],
    ['responsavel', 'Responsável', 'text'], ['daOnde', 'Da onde', 'text'], ['hobbie', 'Hobbie', 'text'], ['bebida', 'Bebida', 'text'],
    ['comida', 'Comida', 'sel'], ['presente', 'Presente', 'multi']
  ],
  lead: [
    ['etapa', 'Etapa Funil', 'sel'], ['origem', 'Canal de origem', 'multi'], ['produtos', 'Serviço / Produto', 'multi'], ['tipoContato', 'Tipo de Contato', 'sel'],
    ['valor', 'Valor', 'num'], ['probabilidade', 'Probabilidade (%)', 'num'], ['campanhas', 'Campanha ofertada', 'multi'], ['fechouPela', 'Fechou pela', 'sel'],
    ['vendidoEm', 'Vendido em', 'data'], ['perdaEm', 'Perdido em', 'data'], ['ultimoContato', 'Último contato', 'data'], ['orcamentoEm', 'Orçamento enviado em', 'data'],
    ['fechamentoEsperado', 'Fechamento esperado', 'data'], ['proximaAtividade', 'Próxima atividade', 'data'], ['entregaEm', 'Data de entrega', 'data'], ['obs', 'Observações', 'text']
  ]
};

// endereço: no painel em partes, no Notion num texto só
const END = ['cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf'];
function juntaEnd(d) {
  const rua = [d.endereco, d.numero].filter(Boolean).join(', ') + (d.complemento ? ' - ' + d.complemento : '');
  const cid = [d.cidade, d.uf].filter(Boolean).join('/');
  return [rua, d.bairro, cid, d.cep ? 'CEP ' + d.cep : ''].filter(x => x && x.trim()).join(' · ');
}
function separaEnd(t, atual) {
  const out = {};
  if (!t) return out;
  if (juntaEnd(atual || {}) === t) { END.forEach(k => { if ((atual || {})[k]) out[k] = atual[k]; }); return out; }
  const cep = (t.match(/\b(\d{5})-?(\d{3})\b/) || []);
  if (cep[1]) out.cep = cep[1] + '-' + cep[2];
  const partes = t.split(' · ').map(x => x.trim()).filter(x => x && !/^CEP\b/i.test(x));
  if (partes.length >= 2) {
    const ult = partes[partes.length - 1].match(/^(.+?)\/([A-Z]{2})$/);
    if (ult) { out.cidade = ult[1]; out.uf = ult[2]; partes.pop(); }
    const rua = partes.shift() || '';
    const m = rua.match(/^(.*?)(?:,\s*([^-]+?))?(?:\s-\s(.+))?$/);
    if (m) { out.endereco = m[1].trim(); if (m[2]) out.numero = m[2].trim(); if (m[3]) out.complemento = m[3].trim(); }
    if (partes.length) out.bairro = partes.join(' · ');
  } else out.endereco = t.replace(/,?\s*CEP\s*\d{5}-?\d{3}/i, '').trim();
  return out;
}

// valores vindos do Notion: normaliza pelo painel, mas não descarta o que o painel não entende (ex.: CNPJ sem dígito certo)
function leve(defs, bruto) {
  const d = CAMPOS.limpa(defs, bruto);
  defs.forEach(c => { if (d[c.k] === undefined && bruto[c.k] !== undefined && bruto[c.k] !== '' && bruto[c.k] !== null && !(Array.isArray(bruto[c.k]) && !bruto[c.k].length)) d[c.k] = bruto[c.k]; });
  return d;
}
const insta = v => { const h = String(v || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@+/, ''); return h ? '@' + h.toLowerCase() : ''; };

// ---------- Notion -> objeto ----------
function deEmp(p) {
  const pr = p.properties, b = {};
  MAP.emp.forEach(([k, n]) => { const v = ler(pr, n); if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) b[k] = v; });
  if (b.cnpj && so(b.cnpj).length === 14) b.cnpj = so(b.cnpj);
  if (b.instagram) b.instagram = insta(b.instagram);
  return { id: idc(p.id), ed: p.last_edited_time, nome: ler(pr, 'Nome') || b.fantasia || b.razao || 'Sem nome', endTxt: ler(pr, 'Endereço') || '', bruto: b, contatos: ler(pr, 'Contatos') || [], leads: ler(pr, 'Lead') || [] };
}
function dePessoa(p) {
  const pr = p.properties, b = {};
  MAP.pessoa.forEach(([k, n]) => { const v = ler(pr, n); if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) b[k] = v; });
  const ig = insta(ler(pr, 'Instagram'));
  if (ig) b.instagram = ig;
  if (b.cpf && so(b.cpf).length === 11) b.cpf = so(b.cpf);
  return { id: idc(p.id), ed: p.last_edited_time, nome: ler(pr, 'Nome') || 'Sem nome', email: String(ler(pr, 'Email') || '').trim().toLowerCase(), whatsapp: ler(pr, 'Telefone Pessoal') || '', endTxt: ler(pr, 'Endereço') || '', bruto: b, empresas: ler(pr, 'Empresa') || [] };
}
function deLead(p) {
  const pr = p.properties, b = {};
  MAP.lead.forEach(([k, n]) => { const v = ler(pr, n); if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) b[k] = v; });
  const resp = ler(pr, 'Responsável') || [];
  if (resp.length) b.responsavel = resp[0];
  b.nome = ler(pr, 'Lead') || 'Sem nome';
  return { id: idc(p.id), ed: p.last_edited_time, empresa: (ler(pr, 'Empresa') || [])[0] || '', contatos: ler(pr, 'Contatos') || [], bruto: b };
}

// ---------- objeto do painel -> propriedades do Notion ----------
function props(lista, dados, extra) {
  const o = extra || {};
  lista.forEach(([k, n, t]) => { o[n] = W[t](dados[k]); });
  return o;
}
function propsEmp(e) {
  const d = Object.assign({}, e.dados || {});
  if (d.cnpj) d.cnpj = CAMPOS.limpa(CAMPOS.empresa, { cnpj: d.cnpj }).cnpj || d.cnpj;
  return props(MAP.emp, d, { Nome: W.title(e.nome), 'Endereço': W.text(juntaEnd(d)), Painel: W.url(SITE + '/area/admin/#empresas/' + e.slug) });
}
function propsPessoa(u, empId) {
  const d = Object.assign({}, u.crm || {});
  const o = props(MAP.pessoa, d, {
    Nome: W.title(u.nome), 'Telefone Pessoal': W.tel(u.whatsapp), 'Endereço': W.text(juntaEnd(d)),
    Instagram: W.url(d.instagram ? 'https://instagram.com/' + String(d.instagram).replace(/^@/, '') : ''),
    Painel: W.url(SITE + '/area/admin/#contatos/' + u.slug)
  });
  if (!ehInterno(u.email)) o.Email = W.email(u.email);
  if (empId) o.Empresa = W.rel([empId]);
  return o;
}
function propsLead(n, empId, contatoIds) {
  const o = props(MAP.lead, n.dados || {}, { Lead: W.title((n.dados || {}).nome), Painel: W.url(SITE + '/area/admin/#empresas/' + n.slug) });
  if (empId) o.Empresa = W.rel([empId]);
  if (contatoIds) o.Contatos = W.rel(contatoIds);
  return o;
}

// etapa do Kanban de empresas <-> Etapa Funil do lead
const ETAPA_DE = { 'Cadastrado': 'lead', 'Qualificação': 'qualificado', 'Orçamento': 'qualificado', 'Negociação': 'qualificado', 'Objeção': 'qualificado', 'Fazer Contrato': 'cliente', 'Sucesso: Ativo': 'cliente', 'Sucesso: Inativo': 'finalizado', 'Perdido': 'finalizado' };
const ETAPA_PARA = { lead: 'Cadastrado', qualificado: 'Qualificação', cliente: 'Sucesso: Ativo', finalizado: 'Sucesso: Inativo' };

// ---------- leitura do painel ----------
async function painel(redis, slugsExtras) {
  const [slugsDb, mapH] = await redis([['SMEMBERS', 'area:emps'], ['HGETALL', 'area:nmap']]);
  const slugs = Array.from(new Set((slugsDb || []).concat(slugsExtras || [])));
  const nmap = {};
  const pares = Array.isArray(mapH) ? mapH : [];
  for (let i = 0; i < pares.length; i += 2) nmap[pares[i]] = pares[i + 1];
  if (!Array.isArray(mapH) && mapH) Object.assign(nmap, mapH);
  const r = slugs.length ? await redis(slugs.flatMap(s => [['GET', 'area:emp:' + s], ['SMEMBERS', 'area:users:' + s], ['HGETALL', 'area:neg:' + s]])) : [];
  const emps = {};
  const pedU = [];
  slugs.forEach((s, i) => {
    const e = json(r[i * 3]) || null;
    const negs = [];
    const h = r[i * 3 + 2];
    const hp = Array.isArray(h) ? h : Object.keys(h || {}).flatMap(k => [k, h[k]]);
    for (let j = 0; j < hp.length; j += 2) { const n = json(hp[j + 1]); if (n) negs.push(n); }
    emps[s] = { slug: s, e, emails: r[i * 3 + 1] || [], negs, users: [] };
    (r[i * 3 + 1] || []).forEach(m => pedU.push([s, m]));
  });
  const us = pedU.length ? await redis(pedU.map(([s, m]) => ['GET', 'area:user:' + s + ':' + m])) : [];
  pedU.forEach(([s, m], i) => { const u = json(us[i]); if (u) emps[s].users.push(u); });
  return { emps, nmap };
}

function slugLivre(base, ocupados) {
  let s = slugify(base) || 'empresa', n = 2;
  if (s.length < 2) s = 'empresa' + s;
  const b = s.slice(0, 36);
  while (ocupados[s]) s = b + (n++);
  ocupados[s] = 1;
  return s;
}

// ---------- plano da carga inicial (nada é gravado) ----------
async function monta(redis, catalogo) {
  const [E, P, L] = await Promise.all([todas(DB.emp), todas(DB.pessoa), todas(DB.lead)]);
  const { emps, nmap } = await painel(redis, Object.keys(catalogo || {}));
  Object.keys(catalogo || {}).forEach(s => { if (!emps[s].e) emps[s].e = { slug: s, nome: catalogo[s].nome, catalogo: true }; });
  const ne = E.map(deEmp), np = P.map(dePessoa), nl = L.map(deLead);
  const ocupados = {}; Object.keys(emps).forEach(s => { if (emps[s].e) ocupados[s] = 1; });
  const ligSlug = {};        // idNotion empresa -> slug
  const usado = {};          // slug já ligado
  Object.keys(nmap).forEach(id => { const v = nmap[id]; if (v.indexOf('e|') === 0) { ligSlug[id] = v.slice(2); usado[v.slice(2)] = 1; } });
  const plano = { empresas: [], pessoas: [], negocios: [], semEmpresa: [] };
  // 1) empresas
  ne.forEach(n => {
    let slug = ligSlug[n.id], como = slug ? 'ligada' : '';
    if (!slug && n.bruto.cnpj) { const c = so(n.bruto.cnpj); const s = Object.keys(emps).find(k => !usado[k] && emps[k].e && so(((emps[k].e.dados || {}).cnpj)) === c && c.length === 14); if (s) { slug = s; como = 'cnpj'; } }
    if (!slug) {
      const cand = [n.nome, n.bruto.fantasia].filter(Boolean).map(slugify).filter(x => x.length >= 4);
      const s = Object.keys(emps).find(k => !usado[k] && emps[k].e && cand.some(c => c === k || (k.length >= 5 && c.indexOf(k) === 0) || (c.length >= 5 && k.indexOf(c) === 0)));
      if (s) { slug = s; como = 'nome'; }
    }
    if (slug) usado[slug] = 1; else { slug = slugLivre(n.nome, ocupados); como = 'nova'; }
    ligSlug[n.id] = slug;
    plano.empresas.push({ id: n.id, nome: n.nome, slug, como, n });
  });
  Object.keys(emps).forEach(s => { if (emps[s].e && !emps[s].e.arquivada && !usado[s]) plano.empresas.push({ id: '', nome: emps[s].e.nome, slug: s, como: 'paraNotion' }); });
  // 2) pessoas
  const usadoU = {};
  np.forEach(n => {
    const sl = n.empresas.map(id => ligSlug[id]).filter(Boolean)[0];
    if (!sl) { plano.semEmpresa.push({ tipo: 'contato', nome: n.nome }); return; }
    const lig = nmap[n.id];
    let email = n.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n.email) ? n.email : '', como = '';
    const us = (emps[sl] || { users: [] }).users;
    let u = null;
    if (lig && lig.indexOf('p|') === 0) { const [, s2, m2] = lig.split('|'); u = ((emps[s2] || {}).users || []).find(x => x.email === m2); if (u) como = 'ligada'; }
    if (!u && email) { u = us.find(x => x.email === email); if (u) como = 'email'; }
    if (!u) { const nm = slugify(n.nome); u = us.find(x => !usadoU[sl + '|' + x.email] && slugify(x.nome) === nm && nm.length >= 3); if (u) como = 'nome'; }
    if (u) usadoU[(u.slug || sl) + '|' + u.email] = 1;
    plano.pessoas.push({ id: n.id, nome: n.nome, slug: sl, email: u ? u.email : (email || emailInterno(n.id)), como: como || 'nova', semEmail: !email, n });
  });
  Object.keys(emps).forEach(s => emps[s].users.forEach(u => { if (!u.arquivada && !(emps[s].e || {}).arquivada && !usadoU[s + '|' + u.email] && !(u.notion && nmap[u.notion])) plano.pessoas.push({ id: '', nome: u.nome, slug: s, email: u.email, como: 'paraNotion' }); }));
  // 3) negócios
  const usadoN = {};
  nl.forEach(n => {
    const sl = ligSlug[n.empresa];
    if (!sl) { plano.semEmpresa.push({ tipo: 'lead', nome: n.bruto.nome }); return; }
    const negs = (emps[sl] || { negs: [] }).negs;
    let x = negs.find(g => g.notion === n.id), como = x ? 'ligada' : '';
    if (!x) { const nm = slugify(n.bruto.nome); x = negs.find(g => !usadoN[g.id] && !g.notion && slugify((g.dados || {}).nome) === nm); if (x) como = 'nome'; }
    if (x) usadoN[x.id] = 1;
    plano.negocios.push({ id: n.id, nome: n.bruto.nome, slug: sl, negId: x ? x.id : '', como: como || 'nova', n });
  });
  Object.keys(emps).forEach(s => emps[s].negs.forEach(g => { if (!(emps[s].e || {}).arquivada && !usadoN[g.id] && !g.notion) plano.negocios.push({ id: '', nome: (g.dados || {}).nome, slug: s, negId: g.id, como: 'paraNotion' }); }));
  return { plano, emps, nmap };
}

function resumo(plano) {
  const conta = (lista, c) => lista.filter(x => x.como === c).length;
  const nomes = (lista, cs) => lista.filter(x => cs.indexOf(x.como) >= 0).map(x => x.nome + (x.como === 'cnpj' ? ' (pelo CNPJ)' : x.como === 'nome' ? ' → ' + x.slug : '')).slice(0, 400);
  return {
    empresas: { juntar: conta(plano.empresas, 'cnpj') + conta(plano.empresas, 'nome'), jaLigadas: conta(plano.empresas, 'ligada'), novasNoPainel: conta(plano.empresas, 'nova'), novasNoNotion: conta(plano.empresas, 'paraNotion'), listaJuntar: nomes(plano.empresas, ['cnpj', 'nome']), listaParaNotion: nomes(plano.empresas, ['paraNotion']) },
    pessoas: { juntar: conta(plano.pessoas, 'email') + conta(plano.pessoas, 'nome'), jaLigadas: conta(plano.pessoas, 'ligada'), novasNoPainel: conta(plano.pessoas, 'nova'), semEmail: plano.pessoas.filter(x => x.semEmail).length, novasNoNotion: conta(plano.pessoas, 'paraNotion'), listaParaNotion: nomes(plano.pessoas, ['paraNotion']) },
    negocios: { juntar: conta(plano.negocios, 'nome'), jaLigados: conta(plano.negocios, 'ligada'), novosNoPainel: conta(plano.negocios, 'nova'), novosNoNotion: conta(plano.negocios, 'paraNotion'), listaParaNotion: nomes(plano.negocios, ['paraNotion']) },
    semEmpresa: plano.semEmpresa.slice(0, 200)
  };
}

async function verifica() {
  if (!ligado()) return { ok: false, erro: 'Falta a variável NOTION_TOKEN na Vercel.' };
  const falta = [];
  for (const [k, id] of Object.entries(DB)) {
    try { await api('GET', 'databases/' + id); } catch (e) { falta.push({ emp: '(EMP) Empresa', pessoa: '(EMP) Contato', lead: '(EMP) Leads' }[k]); }
  }
  return falta.length ? { ok: false, erro: 'Conecte a integração a: ' + falta.join(', ') + ' (no Notion: ••• → Conexões).', falta } : { ok: true };
}

async function plano(redis, catalogo) {
  const v = await verifica();
  if (!v.ok) return v;
  const { plano: p } = await monta(redis, catalogo);
  const [est] = await redis([['GET', 'area:notion:estado']]);
  return { ok: true, estado: json(est) || {}, resumo: resumo(p) };
}

// ---------- aplicar: grava nos dois lados ----------
function novoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
const vazio = v => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
function mescla(painelD, notionD) { const o = Object.assign({}, painelD || {}); Object.keys(notionD).forEach(k => { if (!vazio(notionD[k])) o[k] = notionD[k]; }); return o; }
const ordena = o => Array.isArray(o) ? o.map(ordena) : o && typeof o === 'object' ? Object.keys(o).sort().reduce((r, k) => { if (!vazio(o[k])) r[k] = ordena(o[k]); return r; }, {}) : o;
const mesmo = (a, b) => JSON.stringify(ordena(a)) === JSON.stringify(ordena(b));

async function cria(db, propsObj) { return api('POST', 'pages', { parent: { database_id: db }, properties: propsObj }); }
async function atualiza(id, propsObj) { return api('PATCH', 'pages/' + id, { properties: propsObj }); }

async function aplica(redis, catalogo) {
  const v = await verifica();
  if (!v.ok) return v;
  const t0 = Date.now();
  const { plano: pl, emps } = await monta(redis, catalogo);
  const cmds = [], mapa = [], cont = { empresas: 0, pessoas: 0, negocios: 0, notion: 0 };
  const empId = {};       // slug -> id Notion
  const pesId = {};       // slug|email -> id Notion
  const flush = async () => { if (cmds.length) { await redis(cmds.splice(0)); } if (mapa.length) { await redis([['HSET', 'area:nmap'].concat(mapa.splice(0))]); } };
  // 1) empresas
  for (const it of pl.empresas) {
    const atual = (emps[it.slug] || {}).e;
    if (it.como === 'paraNotion') {
      const p = await cria(DB.emp, propsEmp(atual)); cont.notion++;
      const e = Object.assign({}, atual, { notion: idc(p.id), nEd: p.last_edited_time }); delete e.catalogo;
      cmds.push(['SET', 'area:emp:' + it.slug, JSON.stringify(e)], ['SADD', 'area:emps', it.slug]); mapa.push(idc(p.id), 'e|' + it.slug);
      empId[it.slug] = idc(p.id); continue;
    }
    const n = it.n;
    const daNotion = Object.assign(leve(CAMPOS.empresa, n.bruto), separaEnd(n.endTxt, (atual || {}).dados));
    const junto = mescla(atual && atual.dados, daNotion);
    const e = Object.assign({ slug: it.slug, criado: agora() }, atual || {}, { nome: n.nome, dados: junto, notion: n.id, nEd: n.ed });
    delete e.catalogo;
    if (!mesmo(junto, daNotion)) { const p = await atualiza(n.id, propsEmp(e)); e.nEd = p.last_edited_time; cont.notion++; }
    else cmds.push(['RPUSH', 'area:notion:painel', n.id]);
    cmds.push(['SET', 'area:emp:' + it.slug, JSON.stringify(e)], ['SADD', 'area:emps', it.slug]); mapa.push(n.id, 'e|' + it.slug);
    empId[it.slug] = n.id; cont.empresas++;
    if (cmds.length > 200) await flush();
    if (Date.now() - t0 > 50000) { await flush(); return { ok: true, parcial: true, cont }; }
  }
  await flush();
  // 2) pessoas
  for (const it of pl.pessoas) {
    const atual = ((emps[it.slug] || {}).users || []).find(u => u.email === it.email);
    const k = 'area:user:' + it.slug + ':' + it.email;
    if (it.como === 'paraNotion') {
      if (!empId[it.slug]) continue;
      const p = await cria(DB.pessoa, propsPessoa(Object.assign({ slug: it.slug }, atual), empId[it.slug])); cont.notion++;
      cmds.push(['SET', k, JSON.stringify(Object.assign({}, atual, { notion: idc(p.id), nEd: p.last_edited_time }))]); mapa.push(idc(p.id), 'p|' + it.slug + '|' + it.email);
      pesId[it.slug + '|' + it.email] = idc(p.id); continue;
    }
    const n = it.n;
    const daNotion = Object.assign(leve(CAMPOS.pessoa, n.bruto), separaEnd(n.endTxt, (atual || {}).crm));
    const junto = mescla(atual && atual.crm, daNotion);
    const u = Object.assign({ email: it.email, slug: it.slug, empresaNome: ((emps[it.slug] || {}).e || {}).nome || '', status: 'convite', criado: agora(), origem: 'notion' }, atual || {}, {
      nome: n.nome, whatsapp: n.whatsapp || (atual && atual.whatsapp) || '', crm: junto, notion: n.id, nEd: n.ed
    });
    const precisa = !mesmo(junto, daNotion) || (!n.whatsapp && u.whatsapp) || (!n.email && !ehInterno(u.email));
    if (precisa) { const p = await atualiza(n.id, propsPessoa(u)); u.nEd = p.last_edited_time; cont.notion++; } else cmds.push(['RPUSH', 'area:notion:painel', n.id]);
    cmds.push(['SET', k, JSON.stringify(u)], ['SADD', 'area:users:' + it.slug, it.email], ['SADD', 'area:emps', it.slug]); mapa.push(n.id, 'p|' + it.slug + '|' + it.email);
    pesId[it.slug + '|' + it.email] = n.id; cont.pessoas++;
    if (cmds.length > 200) await flush();
    if (Date.now() - t0 > 52000) { await flush(); return { ok: true, parcial: true, cont }; }
  }
  await flush();
  // 3) negócios
  const idsPorNotion = {}; Object.keys(pesId).forEach(k => { idsPorNotion[pesId[k]] = k.split('|')[1]; });
  for (const it of pl.negocios) {
    const negs = (emps[it.slug] || {}).negs || [];
    const atual = negs.find(g => g.id === it.negId);
    if (it.como === 'paraNotion') {
      if (!empId[it.slug]) continue;
      const cids = ((atual.dados || {}).contatos || []).map(m => pesId[it.slug + '|' + m]).filter(Boolean);
      const p = await cria(DB.lead, propsLead(Object.assign({ slug: it.slug }, atual), empId[it.slug], cids)); cont.notion++;
      cmds.push(['HSET', 'area:neg:' + it.slug, atual.id, JSON.stringify(Object.assign({}, atual, { notion: idc(p.id), nEd: p.last_edited_time, nContatos: cids }))]); mapa.push(idc(p.id), 'n|' + it.slug + '|' + atual.id);
      continue;
    }
    const n = it.n;
    const daNotion = leve(CAMPOS.negocio, n.bruto);
    daNotion.contatos = n.contatos.map(id => idsPorNotion[id]).filter(Boolean);
    const junto = mescla(atual && atual.dados, daNotion);
    const g = Object.assign({ id: novoId(), slug: it.slug, criado: agora(), historico: [{ data: agora(), texto: 'Negócio trazido do Notion na etapa ' + (junto.etapa || '—') + '.' }] }, atual || {}, { dados: junto, notion: n.id, nEd: n.ed, nContatos: n.contatos, atualizado: agora() });
    if (!mesmo(Object.assign({}, junto, { contatos: undefined }), Object.assign({}, daNotion, { contatos: undefined }))) {
      const cids = Array.from(new Set(n.contatos.concat((junto.contatos || []).map(m => pesId[it.slug + '|' + m]).filter(Boolean))));
      const p = await atualiza(n.id, propsLead(g, null, cids)); g.nEd = p.last_edited_time; cont.notion++;
    } else cmds.push(['RPUSH', 'area:notion:painel', n.id]);
    cmds.push(['HSET', 'area:neg:' + it.slug, g.id, JSON.stringify(g)], ['SADD', 'area:emps', it.slug]); mapa.push(n.id, 'n|' + it.slug + '|' + g.id);
    cont.negocios++;
    if (cmds.length > 200) await flush();
    if (Date.now() - t0 > 54000) { await flush(); return { ok: true, parcial: true, cont }; }
  }
  await flush();
  await etapasDasEmpresas(redis);
  await redis([['SET', 'area:notion:estado', JSON.stringify({ carga: agora(), ultimo: agora(), erro: '' })]]);
  return { ok: true, cont };
}

// Kanban de empresas acompanha a Etapa Funil do lead editado por último
async function etapasDasEmpresas(redis, soSlugs) {
  const { emps } = await painel(redis);
  const cmds = [];
  Object.keys(emps).forEach(s => {
    if (soSlugs && soSlugs.indexOf(s) < 0) return;
    const x = emps[s]; if (!x.e) return;
    const ln = x.negs.filter(g => g.notion && (g.dados || {}).etapa).sort((a, b) => String(b.nEd || '').localeCompare(String(a.nEd || '')))[0];
    if (!ln) return;
    const et = ETAPA_DE[ln.dados.etapa];
    if (et && x.e.etapa !== et) { x.e.etapa = et; cmds.push(['SET', 'area:emp:' + s, JSON.stringify(x.e)]); }
  });
  if (cmds.length) await redis(cmds);
}

// ---------- puxar do Notion o que mudou ----------
async function puxa(redis, op) {
  op = op || {};
  if (!ligado()) return { ok: false };
  const [est0] = await redis([['GET', 'area:notion:estado']]);
  const est = json(est0) || {};
  if (!est.carga) return { ok: true, semCarga: true };
  const desde = op.tudo ? null : (est.ultimo ? new Date(new Date(est.ultimo).getTime() - 120000).toISOString() : null);
  const filtro = desde ? { timestamp: 'last_edited_time', last_edited_time: { on_or_after: desde } } : null;
  const inicio = agora();
  const [E, P, L] = await Promise.all([todas(DB.emp, filtro), todas(DB.pessoa, filtro), todas(DB.lead, filtro)]);
  const { emps, nmap } = await painel(redis);
  const ocupados = {}; Object.keys(emps).forEach(s => { if (emps[s].e) ocupados[s] = 1; });
  const cmds = [], mapa = [], mud = { empresas: 0, pessoas: 0, negocios: 0 };
  const slugDe = id => { const v = nmap[id]; return v && v.indexOf('e|') === 0 ? v.slice(2) : ''; };
  const tocadas = {};
  // empresas
  E.map(deEmp).forEach(n => {
    let slug = slugDe(n.id), e = slug ? (emps[slug] || {}).e : null;
    if (e && e.nEd && n.ed < e.nEd) return;
    if (!slug) { slug = slugLivre(n.nome, ocupados); nmap[n.id] = 'e|' + slug; mapa.push(n.id, 'e|' + slug); cmds.push(['RPUSH', 'area:notion:painel', n.id]); emps[slug] = { slug, e: null, users: [], negs: [], emails: [] }; }
    const dados = Object.assign(leve(CAMPOS.empresa, n.bruto), separaEnd(n.endTxt, (e || {}).dados));
    if (e && e.nEd === n.ed && e.nome === n.nome && mesmo(e.dados || {}, dados)) return;
    e = Object.assign({ slug, criado: agora(), origem: 'notion' }, e || {}, { nome: n.nome, dados, notion: n.id, nEd: n.ed, editado: n.ed });
    emps[slug].e = e;
    cmds.push(['SET', 'area:emp:' + slug, JSON.stringify(e)], ['SADD', 'area:emps', slug]); mud.empresas++;
  });
  // pessoas
  P.map(dePessoa).forEach(n => {
    const sl = n.empresas.map(slugDe).filter(Boolean)[0];
    if (!sl) return;
    const lig = nmap[n.id];
    let velho = null, vs = '', vm = '';
    if (lig && lig.indexOf('p|') === 0) { [, vs, vm] = lig.split('|'); velho = ((emps[vs] || {}).users || []).find(u => u.email === vm) || null; }
    if (velho && velho.nEd && n.ed < velho.nEd) return;
    const emailOk = n.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n.email);
    const email = emailOk ? n.email : (velho && !ehInterno(velho.email) ? velho.email : emailInterno(n.id));
    const crm = Object.assign(leve(CAMPOS.pessoa, n.bruto), separaEnd(n.endTxt, (velho || {}).crm));
    if (velho && velho.nEd === n.ed && velho.nome === n.nome && (velho.whatsapp || '') === (n.whatsapp || '') && vs === sl && vm === email && mesmo(velho.crm || {}, crm)) return;
    const u = Object.assign({ email, slug: sl, empresaNome: ((emps[sl] || {}).e || {}).nome || '', status: 'convite', criado: agora(), origem: 'notion' }, velho || {}, { email, slug: sl, nome: n.nome, whatsapp: n.whatsapp || '', crm, notion: n.id, nEd: n.ed, editado: n.ed });
    if (velho && (vs !== sl || vm !== email)) cmds.push(['DEL', 'area:user:' + vs + ':' + vm], ['SREM', 'area:users:' + vs, vm]);
    else if (!velho) cmds.push(['RPUSH', 'area:notion:painel', n.id]);
    cmds.push(['SET', 'area:user:' + sl + ':' + email, JSON.stringify(u)], ['SADD', 'area:users:' + sl, email]);
    nmap[n.id] = 'p|' + sl + '|' + email; mapa.push(n.id, 'p|' + sl + '|' + email); mud.pessoas++;
  });
  if (cmds.length || mapa.length) { await redis(cmds.splice(0).concat(mapa.length ? [['HSET', 'area:nmap'].concat(mapa.splice(0))] : [])); }
  // negócios
  L.map(deLead).forEach(n => {
    const sl = slugDe(n.empresa);
    if (!sl) return;
    const lig = nmap[n.id];
    let velho = null, vs = '';
    if (lig && lig.indexOf('n|') === 0) { const pz = lig.split('|'); vs = pz[1]; velho = ((emps[vs] || {}).negs || []).find(g => g.id === pz[2]) || null; }
    if (velho && velho.nEd && n.ed < velho.nEd) return;
    const dados = leve(CAMPOS.negocio, n.bruto);
    dados.contatos = n.contatos.map(id => { const v = nmap[id]; return v && v.indexOf('p|' + sl + '|') === 0 ? v.split('|')[2] : ''; }).filter(Boolean);
    if (velho && velho.nEd === n.ed && vs === sl && mesmo(Object.assign({}, velho.dados, { contatos: (velho.dados || {}).contatos || [] }), Object.assign({}, dados, { contatos: dados.contatos }))) return;
    const g = Object.assign({ id: novoId(), slug: sl, criado: agora(), historico: [] }, velho || {}, { slug: sl, dados, notion: n.id, nEd: n.ed, nContatos: n.contatos, atualizado: agora() });
    const antes = velho && velho.dados ? velho.dados.etapa : '';
    if (!velho) g.historico = [{ data: agora(), texto: 'Negócio criado no Notion na etapa ' + (dados.etapa || '—') + '.' }];
    else if (antes !== dados.etapa) g.historico = [{ data: agora(), texto: 'Etapa (Notion): ' + (antes || '—') + ' → ' + (dados.etapa || '—') }].concat(g.historico || []).slice(0, 60);
    if (velho && vs !== sl) cmds.push(['HDEL', 'area:neg:' + vs, velho.id]);
    cmds.push(['HSET', 'area:neg:' + sl, g.id, JSON.stringify(g)]);
    mapa.push(n.id, 'n|' + sl + '|' + g.id); tocadas[sl] = 1; mud.negocios++;
  });
  if (cmds.length || mapa.length) await redis(cmds.splice(0).concat(mapa.length ? [['HSET', 'area:nmap'].concat(mapa.splice(0))] : []));
  if (Object.keys(tocadas).length) await etapasDasEmpresas(redis, Object.keys(tocadas));
  if (op.tudo) await arquivados(redis, E, P, L);
  await redis([['SET', 'area:notion:estado', JSON.stringify(Object.assign(est, { ultimo: inicio, erro: '' }))]]);
  await pendencias(redis);
  return { ok: true, mud, total: mud.empresas + mud.pessoas + mud.negocios };
}

// sincronização completa: o que sumiu do Notion (arquivado/apagado) some do painel
async function arquivados(redis, E, P, L) {
  const vivos = {}; E.concat(P, L).forEach(p => { vivos[idc(p.id)] = 1; });
  const [mapH] = await redis([['HGETALL', 'area:nmap']]);
  const pares = Array.isArray(mapH) ? mapH : Object.keys(mapH || {}).flatMap(k => [k, mapH[k]]);
  const cmds = [];
  for (let i = 0; i < pares.length; i += 2) {
    const id = pares[i], v = pares[i + 1];
    if (vivos[id]) continue;
    const pz = v.split('|');
    if (pz[0] === 'n') {
      const [g] = await redis([['HGET', 'area:neg:' + pz[1], pz[2]]]);
      if (g) cmds.push(['HSET', 'area:neg-arq:' + pz[1], pz[2], g], ['HDEL', 'area:neg:' + pz[1], pz[2]]);
    } else if (pz[0] === 'e') {
      const [e] = await redis([['GET', 'area:emp:' + pz[1]]]);
      const o = json(e); if (o) { o.arquivada = agora(); cmds.push(['SET', 'area:emp:' + pz[1], JSON.stringify(o)]); }
    } else if (pz[0] === 'p') {
      const [u] = await redis([['GET', 'area:user:' + pz[1] + ':' + pz[2]]]);
      const o = json(u); if (o) { o.arquivada = agora(); cmds.push(['SET', 'area:user:' + pz[1] + ':' + pz[2], JSON.stringify(o)]); }
    }
    cmds.push(['HDEL', 'area:nmap', id]);
  }
  if (cmds.length) await redis(cmds);
}

// fila: links "Painel" no Notion (aos poucos) e envios que falharam
async function pendencias(redis) {
  const [lst, fila] = await redis([['LRANGE', 'area:notion:painel', 0, 29], ['LRANGE', 'area:notion:fila', 0, 9]]);
  for (const f of (fila || []).map(json).filter(Boolean)) {
    try { await envia(redis, f.tipo, f.slug, f.chave, true); await redis([['LREM', 'area:notion:fila', 1, JSON.stringify(f)]]); } catch (e) { break; }
  }
  if (!lst || !lst.length) return;
  const [mapH] = await redis([['HMGET', 'area:nmap'].concat(lst)]);
  for (let i = 0; i < lst.length; i++) {
    const v = (mapH || [])[i]; if (!v) continue;
    const pz = v.split('|');
    const url = SITE + '/area/admin/#' + (pz[0] === 'p' ? 'contatos/' : 'empresas/') + pz[1];
    try {
      const p = await atualiza(lst[i], { Painel: W.url(url) });
      await guardaEd(redis, v, p.last_edited_time);
    } catch (e) { if (e.status !== 404) break; }
  }
  await redis([['LTRIM', 'area:notion:painel', lst.length, -1]]);
}
async function guardaEd(redis, v, ed) {
  const pz = v.split('|');
  if (pz[0] === 'e') { const [x] = await redis([['GET', 'area:emp:' + pz[1]]]); const o = json(x); if (o) { o.nEd = ed; await redis([['SET', 'area:emp:' + pz[1], JSON.stringify(o)]]); } }
  if (pz[0] === 'p') { const k = 'area:user:' + pz[1] + ':' + pz[2]; const [x] = await redis([['GET', k]]); const o = json(x); if (o) { o.nEd = ed; await redis([['SET', k, JSON.stringify(o)]]); } }
  if (pz[0] === 'n') { const [x] = await redis([['HGET', 'area:neg:' + pz[1], pz[2]]]); const o = json(x); if (o) { o.nEd = ed; await redis([['HSET', 'area:neg:' + pz[1], pz[2], JSON.stringify(o)]]); } }
}

// ---------- enviar uma alteração do painel para o Notion ----------
// tipo: 'emp' (chave ignorada) | 'pessoa' (chave = e-mail) | 'neg' (chave = id do negócio) | 'neg-del' | 'etapa'
async function envia(redis, tipo, slug, chave, repetindo) {
  if (!ligado()) return null;
  const [est0] = await redis([['GET', 'area:notion:estado']]);
  if (!(json(est0) || {}).carga) return null;
  try {
    const [ev] = await redis([['GET', 'area:emp:' + slug]]);
    let e = json(ev);
    if (!e) return null;
    if (!e.notion) {   // empresa nova no painel: cria no Notion
      const p = await cria(DB.emp, propsEmp(e));
      e.notion = idc(p.id); e.nEd = p.last_edited_time;
      await redis([['SET', 'area:emp:' + slug, JSON.stringify(e)], ['HSET', 'area:nmap', e.notion, 'e|' + slug]]);
      if (tipo === 'emp') return true;
    } else if (tipo === 'emp') {
      const p = await atualiza(e.notion, propsEmp(e)); e.nEd = p.last_edited_time;
      await redis([['SET', 'area:emp:' + slug, JSON.stringify(e)]]);
      return true;
    }
    if (tipo === 'pessoa') {
      const k = 'area:user:' + slug + ':' + chave;
      const [uv] = await redis([['GET', k]]);
      const u = json(uv); if (!u) return null;
      u.slug = slug;
      const p = u.notion ? await atualiza(u.notion, propsPessoa(u)) : await cria(DB.pessoa, propsPessoa(u, e.notion));
      const novo = !u.notion;
      u.notion = idc(p.id); u.nEd = p.last_edited_time;
      await redis([['SET', k, JSON.stringify(u)]].concat(novo ? [['HSET', 'area:nmap', u.notion, 'p|' + slug + '|' + chave]] : []));
      return true;
    }
    if (tipo === 'neg' || tipo === 'neg-del') {
      if (tipo === 'neg-del') { if (chave) await api('PATCH', 'pages/' + chave, { archived: true }); if (chave) await redis([['HDEL', 'area:nmap', chave]]); return true; }
      const [gv] = await redis([['HGET', 'area:neg:' + slug, chave]]);
      const g = json(gv); if (!g) return null;
      g.slug = slug;
      const emails = (g.dados || {}).contatos || [];
      const us = emails.length ? await redis(emails.map(m => ['GET', 'area:user:' + slug + ':' + m])) : [];
      const daqui = us.map(json).filter(Boolean).map(u => u.notion).filter(Boolean);
      const meus = {}; us.map(json).filter(Boolean).forEach(u => { if (u.notion) meus[u.notion] = 1; });
      // mantém no Notion os contatos de outras empresas que já estavam ligados ao lead
      const [mapH] = (g.nContatos || []).length ? await redis([['HMGET', 'area:nmap'].concat(g.nContatos)]) : [[]];
      const outros = (g.nContatos || []).filter((id, i) => { const v = (mapH || [])[i]; return !(v && v.indexOf('p|' + slug + '|') === 0); });
      const cids = Array.from(new Set(daqui.concat(outros)));
      const p = g.notion ? await atualiza(g.notion, propsLead(g, null, cids)) : await cria(DB.lead, propsLead(g, e.notion, cids));
      const novo = !g.notion;
      g.notion = idc(p.id); g.nEd = p.last_edited_time; g.nContatos = cids;
      await redis([['HSET', 'area:neg:' + slug, g.id, JSON.stringify(g)]].concat(novo ? [['HSET', 'area:nmap', g.notion, 'n|' + slug + '|' + g.id]] : []));
      return true;
    }
    if (tipo === 'etapa') {
      const [h] = await redis([['HGETALL', 'area:neg:' + slug]]);
      const pares = Array.isArray(h) ? h : Object.keys(h || {}).flatMap(k => [k, h[k]]);
      const negs = []; for (let i = 0; i < pares.length; i += 2) { const g = json(pares[i + 1]); if (g && g.notion) negs.push(g); }
      const g = negs.sort((a, b) => String(b.nEd || '').localeCompare(String(a.nEd || '')))[0];
      if (!g || ETAPA_DE[(g.dados || {}).etapa] === e.etapa || !ETAPA_PARA[e.etapa]) return null;
      const antes = g.dados.etapa;
      g.dados.etapa = ETAPA_PARA[e.etapa];
      g.historico = [{ data: agora(), texto: 'Etapa: ' + antes + ' → ' + g.dados.etapa }].concat(g.historico || []).slice(0, 60);
      const p = await atualiza(g.notion, { 'Etapa Funil': W.sel(g.dados.etapa) });
      g.nEd = p.last_edited_time;
      await redis([['HSET', 'area:neg:' + slug, g.id, JSON.stringify(g)]]);
      return true;
    }
  } catch (err) {
    if (!repetindo) await redis([['RPUSH', 'area:notion:fila', JSON.stringify({ tipo, slug, chave, erro: String(err.message).slice(0, 200), data: agora() })], ['LTRIM', 'area:notion:fila', -200, -1]]);
    else throw err;
    return false;
  }
  return null;
}

// diagnóstico respondido no site: empresa, contato e um lead "Cadastrado" com canal Diagnóstico
async function diagnostico(redis, slug, email, empresaNome) {
  if (!ligado()) return;
  const [est0, h] = await redis([['GET', 'area:notion:estado'], ['HGETALL', 'area:neg:' + slug]]);
  if (!(json(est0) || {}).carga) return;
  await envia(redis, 'emp', slug);
  const emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (emailOk) await envia(redis, 'pessoa', slug, email);
  if (h && (Array.isArray(h) ? h.length : Object.keys(h).length)) return;   // já tem negócio: não duplica
  const g = { id: novoId(), slug, criado: agora(), atualizado: agora(), historico: [{ data: agora(), texto: 'Lead criado pelo diagnóstico do site.' }],
    dados: { nome: String(empresaNome || slug).slice(0, 80) + ' · Diagnóstico', etapa: 'Cadastrado', origem: ['Diagnóstico'], tipoContato: 'Lead', contatos: emailOk ? [email] : [] } };
  await redis([['HSET', 'area:neg:' + slug, g.id, JSON.stringify(g)]]);
  await envia(redis, 'neg', slug, g.id);
}

async function estado(redis) {
  const [e, f, pl] = await redis([['GET', 'area:notion:estado'], ['LLEN', 'area:notion:fila'], ['LLEN', 'area:notion:painel']]);
  return Object.assign({ token: ligado(), fila: f || 0, links: pl || 0 }, json(e) || {});
}

module.exports = { ligado, verifica, plano, aplica, puxa, envia, estado, diagnostico, ehInterno, emailInterno, DB, _t: { deEmp, dePessoa, deLead, propsEmp, propsPessoa, propsLead, juntaEnd, separaEnd } };
