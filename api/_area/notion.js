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
const IA = require('./ia.js');
const RICO = require('./rico.js');
const DB_REUN = '25394b57fed881328544ce6e755832a4'; // (EMP) Reuniões e Compromissos: só leitura, Notion -> painel
const DB = { emp: '20e94b57fed881a08c1eeb85fbb99700', pessoa: '25394b57fed88154bb5df25b63ac14e5', lead: '25394b57fed881e09ac8ef513a9a4e3f', tarefa: '25394b57fed8813ba22fe58b9619f4ac' };
const SITE = 'https://sejaunique.com';
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
    if (!r.ok) {
      let msg = j.message || ('Notion ' + r.status);
      if (j.code === 'restricted_resource' || r.status === 403) {
        const falta = metodo === 'PATCH' ? 'Atualizar conteúdo' : (metodo === 'POST' && caminho === 'pages') ? 'Inserir conteúdo' : /^users/.test(caminho) ? 'Ler informações do usuário' : 'Ler conteúdo';
        msg = 'a integração "Painel Unique" está sem a permissão "' + falta + '". Em notion.so/profile/integrations → Painel Unique → Recursos, marque Ler, Atualizar e Inserir conteúdo e salve.';
      }
      const e = new Error(msg); e.status = r.status; e.code = j.code; throw e;
    }
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

// ---------- Tarefas (EMP) <-> ações do plano ----------
const ST_DE = { 'Planejada': 'a_fazer', 'A fazer': 'a_fazer', 'Em Andamento': 'fazendo', 'Entregue': 'feito', 'Publicada': 'feito', 'Bloqueada': 'cancelado', 'Cancelada': 'cancelado' };
const ST_PARA = { a_fazer: 'A fazer', fazendo: 'Em Andamento', feito: 'Entregue', cancelado: 'Cancelada', arquivado: 'Cancelada' };
const DONO_DE = { 'Unique': 'unique', 'Cliente': 'cliente', 'Ambos': 'ambos' }, DONO_PARA = { unique: 'Unique', cliente: 'Cliente', ambos: 'Ambos' };
const TIPO_DE = { 'Ação': 'acao', 'Técnica': 'tecnica', 'Isca': 'isca', 'Reunião': 'reuniao', 'Vídeo': 'video', 'Material': 'material', 'Post': 'post' };
const TIPO_PARA = { acao: 'Ação', tecnica: 'Técnica', isca: 'Isca', reuniao: 'Reunião', video: 'Vídeo', material: 'Material', post: 'Post' };
const PARA_CLIENTE = ['Cliente', 'Lead'];
const CAMPOS_ACAO = ['titulo', 'detalhe', 'prioridade', 'link', 'status', 'dono', 'tipo', 'inicio', 'prazo', 'anexos'];
function deTarefa(p) {
  const pr = p.properties, dt = (pr['Data de Execução'] || {}).date;
  const arqs = ((pr['Arquivos e mídia'] || {}).files || []);
  const ini = dt && dt.start ? (dt.start.length > 10 ? dt.start.slice(0, 16) : dt.start.slice(0, 10)) : '';
  const a = {
    titulo: ler(pr, 'Atividade') || 'Sem título', detalhe: ler(pr, 'Descrição') || '',
    prioridade: ler(pr, 'Prioridade') || '', link: ler(pr, 'Link') || '',
    status: ST_DE[ler(pr, 'Status ')] || 'a_fazer', dono: DONO_DE[ler(pr, 'Quem faz')] || 'unique', tipo: TIPO_DE[ler(pr, 'Tipo')] || 'acao',
    inicio: dt && dt.end ? ini : '', prazo: dt ? String(dt.end || dt.start).slice(0, 10) : '', criado: String(p.created_time || '').slice(0, 10),
    anexos: arqs.filter(f => f.type === 'external' && f.external && /^https:/.test(f.external.url)).map(f => ({ nome: f.name || 'Anexo', link: f.external.url }))
  };
  const resp = ler(pr, 'Responsável') || [];
  const respIds = (((pr['Responsável'] || {}).people) || []).map(x => x.id).filter(Boolean);
  return { rt: (pr['Descrição'] || {}).rich_text || [], observadores: ler(pr, 'Observadores (cliente)') || [], respIds, id: idc(p.id), ed: p.last_edited_time, ia: ler(pr, 'Página com IA') || '', para: ler(pr, 'Tarefa para') || '', empresas: ler(pr, 'Empresa') || [], lead: (ler(pr, 'Lead') || [])[0] || '', pessoas: ler(pr, 'Responsável (cliente)') || [], responsavel: resp[0] || '', temArquivo: arqs.some(f => f.type !== 'external'), a };
}
const absUrl = u => !u ? '' : /^https?:\/\//.test(u) ? u : SITE + (u.charAt(0) === '/' ? '' : '/') + u;
function propsTarefa(a, slug, op) {
  op = op || {};
  const ini = String(a.inicio || '').slice(0, 10), pz = a.prazo || '';
  const data = pz && ini && ini < pz ? { start: ini, end: pz } : (pz || a.inicio) ? { start: pz || a.inicio } : null;
  const o = {
    Atividade: W.title(a.titulo), 'Descrição': a.detalheHtml ? { rich_text: RICO.paraNotion(a.detalheHtml) } : W.text(a.detalhe), Prioridade: W.sel(a.prioridade), Link: W.url(absUrl(a.link)),
    'Status ': { status: { name: ST_PARA[a.status] || 'A fazer' } }, 'Quem faz': W.sel(DONO_PARA[a.dono] || 'Unique'), Tipo: W.sel(TIPO_PARA[a.tipo] || 'Ação'),
    'Data de Execução': { date: data }, Painel: W.url(SITE + '/area/admin/#acoes'),
    'Responsável (cliente)': W.rel(op.pessoaIds || (op.pessoaId ? [op.pessoaId] : []))
  };
  if (op.obsIds) o['Observadores (cliente)'] = W.rel(op.obsIds);
  if (op.carlos && (a.responsaveis || []).indexOf('unique') >= 0) o['Responsável'] = { people: [{ id: op.carlos }] };
  if (!a.nTemArquivo) o['Arquivos e mídia'] = { files: (a.anexos || []).filter(x => /^https:/.test(x.link || '')).map(x => ({ name: String(x.nome || 'Anexo').slice(0, 100), type: 'external', external: { url: x.link } })) };
  if (op.empId) o.Empresa = W.rel([op.empId]);
  if (op.novo) { o['Tarefa para'] = W.sel('Cliente'); if (op.leadId) o.Lead = W.rel([op.leadId]); }
  return o;
}
const recorteAcao = a => { const o = {}; CAMPOS_ACAO.forEach(k => { o[k] = a[k] === undefined ? '' : a[k]; }); return o; };

// ---------- explicação da tarefa: o conteúdo (blocos) da página no Notion ----------
const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const urlOk = u => /^https:\/\//i.test(u || '') ? u : '';
function rt(arr) {
  return (arr || []).map(t => {
    let h = escH(t.plain_text).replace(/\n/g, '<br>');
    const a = t.annotations || {};
    if (a.code) h = '<code>' + h + '</code>';
    if (a.bold) h = '<b>' + h + '</b>';
    if (a.italic) h = '<i>' + h + '</i>';
    if (a.strikethrough) h = '<s>' + h + '</s>';
    if (a.underline) h = '<u>' + h + '</u>';
    if (a.color && a.color !== 'default') h = '<span class="nc-' + escH(a.color.replace('_background', '-bg')) + '">' + h + '</span>';
    const href = urlOk(t.href);
    if (href) h = '<a href="' + escH(href) + '" target="_blank" rel="noopener">' + h + '</a>';
    return h;
  }).join('');
}
const txtRt = arr => (arr || []).map(t => t.plain_text).join('');
async function filhos(id) {
  let out = [], cursor;
  do {
    const j = await api('GET', 'blocks/' + id + '/children?page_size=100' + (cursor ? '&start_cursor=' + cursor : ''));
    out = out.concat(j.results || []);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor && out.length < 400);
  return out;
}
async function resumoPagina(id) {
  const j = await api('GET', 'blocks/' + id + '/children?page_size=12');
  const B = (j.results || []).filter(b => !b.archived);
  const tem = B.some(b => { const v = b[b.type] || {}; return b.type === 'image' || b.type === 'video' || b.type === 'divider' ? true : txtRt(v.rich_text).trim(); });
  // resumo do cartão: os primeiros parágrafos de texto (sem títulos nem itens de lista)
  const p = B.filter(b => ['paragraph', 'callout', 'quote'].indexOf(b.type) >= 0).map(b => txtRt((b[b.type] || {}).rich_text).trim()).filter(Boolean).slice(0, 2).join(' ');
  return { tem: !!tem, resumo: p.slice(0, 240) };
}
const ytId = u => { const m = String(u || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; };
async function htmlBlocos(B, nivel) {
  let h = '', lista = '';
  const fecha = () => { if (lista) { h += '</' + lista + '>'; lista = ''; } };
  for (const b of B) {
    if (b.archived) continue;
    const t = b.type, v = b[t] || {};
    const sub = b.has_children && nivel < 3 ? await htmlBlocos(await filhos(b.id), nivel + 1) : '';
    if (t === 'bulleted_list_item' || t === 'numbered_list_item') {
      const tag = t === 'bulleted_list_item' ? 'ul' : 'ol';
      if (lista !== tag) { fecha(); h += '<' + tag + '>'; lista = tag; }
      h += '<li>' + rt(v.rich_text) + sub + '</li>'; continue;
    }
    fecha();
    if (t === 'paragraph') h += txtRt(v.rich_text).trim() ? '<p>' + rt(v.rich_text) + '</p>' + sub : sub;
    else if (t === 'heading_1' || t === 'heading_2' || t === 'heading_3') {
      const tag = { heading_1: 'h3', heading_2: 'h4', heading_3: 'h5' }[t];
      h += v.is_toggleable ? '<details><summary class="' + tag + '">' + rt(v.rich_text) + '</summary>' + sub + '</details>' : '<' + tag + '>' + rt(v.rich_text) + '</' + tag + '>' + sub;
    }
    else if (t === 'to_do') h += '<p class="nc-todo' + (v.checked ? ' ok' : '') + '"><span>' + (v.checked ? '✓' : '') + '</span>' + rt(v.rich_text) + '</p>' + sub;
    else if (t === 'quote') h += '<blockquote>' + rt(v.rich_text) + sub + '</blockquote>';
    else if (t === 'callout') h += '<div class="nc-callout">' + (v.icon && v.icon.emoji ? '<span class="nc-ic">' + escH(v.icon.emoji) + '</span>' : '') + '<div>' + rt(v.rich_text) + sub + '</div></div>';
    else if (t === 'toggle') h += '<details><summary>' + rt(v.rich_text) + '</summary>' + sub + '</details>';
    else if (t === 'divider') h += '<hr>';
    else if (t === 'code') h += '<pre><code>' + escH(txtRt(v.rich_text)) + '</code></pre>';
    else if (t === 'image') { const u = urlOk(v.type === 'file' ? (v.file || {}).url : (v.external || {}).url); if (u) h += '<figure><img src="' + escH(u) + '" alt="" loading="lazy">' + (txtRt(v.caption) ? '<figcaption>' + rt(v.caption) + '</figcaption>' : '') + '</figure>'; }
    else if (t === 'video' || t === 'embed') { const u = urlOk(v.type === 'file' ? (v.file || {}).url : (v.external || {}).url || v.url); const y = ytId(u);
      if (y) h += '<div class="nc-video"><iframe src="https://www.youtube-nocookie.com/embed/' + y + '" allowfullscreen loading="lazy" title="Vídeo"></iframe></div>';
      else if (u && t === 'video' && v.type === 'file') h += '<video src="' + escH(u) + '" controls preload="metadata"></video>';
      else if (u) h += '<p><a class="nc-link" href="' + escH(u) + '" target="_blank" rel="noopener">' + escH(u.replace(/^https:\/\/(www\.)?/, '').slice(0, 60)) + ' ↗</a></p>'; }
    else if (t === 'bookmark' || t === 'link_preview') { const u = urlOk(v.url); if (u) h += '<p><a class="nc-link" href="' + escH(u) + '" target="_blank" rel="noopener">' + (txtRt(v.caption) ? rt(v.caption) : escH(u.replace(/^https:\/\/(www\.)?/, '').slice(0, 60))) + ' ↗</a></p>'; }
    else if (t === 'file' || t === 'pdf') { const u = urlOk(v.type === 'file' ? (v.file || {}).url : (v.external || {}).url); if (u) h += '<p><a class="nc-link" href="' + escH(u) + '" target="_blank" rel="noopener">📎 ' + escH(v.name || txtRt(v.caption) || 'Arquivo') + ' ↗</a></p>'; }
    else if (t === 'column_list' || t === 'column' || t === 'synced_block') h += sub;
    else if (t === 'table' && sub) h += '<div class="nc-tab"><table>' + sub + '</table></div>';
    else if (t === 'table_row') h += '<tr>' + (v.cells || []).map(c => '<td>' + rt(c) + '</td>').join('') + '</tr>';
  }
  fecha();
  return h;
}
// conteúdo pronto para a página da tarefa; guarda em cache (links de arquivos do Notion expiram em 1h)
async function conteudoTarefa(redis, pageId, ed) {
  const k = 'area:ncont:' + pageId;
  const [c] = await redis([['GET', k]]);
  const o = json(c);
  if (o && o.ed === ed && o.ate > Date.now()) return o.html;
  const html = await htmlBlocos(await filhos(pageId), 1);
  await redis([['SET', k, JSON.stringify({ ed, html, ate: Date.now() + 45 * 60000 }), 'EX', 86400]]);
  return html;
}

// ---------- página da tarefa feita pela IA ("Página com IA" = Gerar no Notion) ----------
const propIA = (pageId, v) => api('PATCH', 'pages/' + pageId, { properties: { 'Página com IA': { select: { name: v } } } }).catch(() => null);
// fila de páginas com IA: id da página no Notion (32 hex) ou ação do painel ('a|slug|id' / 'm|idDaBiblioteca')
const chaveIA = (entrada) => /^[a-f0-9]{32}$/.test(entrada) ? 'area:nhtml:' + entrada : 'area:ahtml:' + entrada.replace(/^a\|/, '').replace(/\|/g, ':');
const chaveIAde = (slug, a) => a.notion ? 'area:nhtml:' + a.notion : a.compartilhada || !slug ? 'area:ahtml:m:' + a.id : 'area:ahtml:' + slug + ':' + a.id;
async function processaIA(redis) {
  const [ids] = await redis([['SMEMBERS', 'area:ia:fila']]);
  if (!ids || !ids.length) return { ok: true, fila: 0 };
  if (!IA.ligada()) { await redis([['SET', 'area:ia:estado', JSON.stringify({ erro: 'Falta a chave da IA (ANTHROPIC_API_KEY) na Vercel.', em: agora() })]]); return { ok: false, fila: ids.length, erro: 'sem chave' }; }
  const [trava] = await redis([['SET', 'area:ia:trava', '1', 'NX', 'EX', 290]]);
  if (trava !== 'OK') return { ok: true, fila: ids.length, ocupado: true };
  const ent = ids[0];
  let titulo = '', pageId = '';
  try {
    let a = null, sl = '', aid = '', ondeH = '', ondeK = '', modelo = false;
    if (/^[a-f0-9]{32}$/.test(ent)) {
      pageId = ent;
      const [v] = await redis([['HGET', 'area:nmap', ent]]);
      if (!v || v.indexOf('a|') !== 0) { await redis([['SREM', 'area:ia:fila', ent]]); return { ok: true, fila: ids.length - 1 }; }
      [, sl, aid] = v.split('|');
    } else if (ent.indexOf('a|') === 0) { [, sl, aid] = ent.split('|'); }
    else { aid = ent.split('|')[1]; modelo = true; }
    ondeH = modelo ? 'area:modelos' : 'area:acoes:' + sl; ondeK = aid;
    const [av, ev] = await redis([['HGET', ondeH, ondeK], ['GET', 'area:emp:' + (sl || '_')]]);
    a = json(av);
    if (!a) { await redis([['SREM', 'area:ia:fila', ent]]); return { ok: true, fila: ids.length - 1 }; }
    if (!pageId && a.notion) pageId = a.notion;
    titulo = a.titulo;
    if (pageId) await propIA(pageId, 'Gerando');
    const midia = [];
    const linhas = pageId ? await IA.paraTexto(filhos, await filhos(pageId), 1, midia) : [];
    const texto = [a.detalhe ? 'Descrição: ' + a.detalhe : '', a.link ? 'Link de apoio: ' + a.link : '', a.dono ? 'Quem faz: ' + ({ unique: 'Unique', cliente: 'o cliente', ambos: 'Unique e cliente juntos' }[a.dono] || a.dono) : ''].concat(linhas).filter(Boolean).join('\n').trim();
    if (!a.detalhe && !linhas.length) throw new Error('A tarefa "' + a.titulo + '" ainda não tem descrição nem conteúdo para a IA trabalhar.');
    const html = await IA.gera({ titulo: a.titulo, tipo: TIPO_PARA[a.tipo], empresa: modelo ? '' : (json(ev) || {}).nome, texto });
    const em = agora();
    const [av2] = await redis([['HGET', ondeH, ondeK]]);
    const a2 = json(av2) || a; a2.nIA = em;
    await redis([['SET', chaveIA(pageId || ent), JSON.stringify({ html, midia, em, modelo: IA.MODELO() })], ['HSET', ondeH, ondeK, JSON.stringify(a2)], ['SREM', 'area:ia:fila', ent],
      ['SET', 'area:ia:estado', JSON.stringify({ erro: '', ultima: a.titulo, em })]]);
    if (pageId) await propIA(pageId, 'Pronta');
    return { ok: true, fila: ids.length - 1, feita: a.titulo };
  } catch (e) {
    await redis([['SREM', 'area:ia:fila', ent], ['SET', 'area:ia:estado', JSON.stringify({ erro: (titulo ? titulo + ': ' : '') + String(e.message || e).slice(0, 300), em: agora() })]]);
    if (pageId) await propIA(pageId, 'Erro');
    return { ok: false, fila: ids.length - 1, erro: String(e.message || e) };
  } finally { await redis([['DEL', 'area:ia:trava']]); }
}
function midiaHtml(m, url) {
  if (!url) return '';
  const leg = m.legenda ? '<figcaption>' + escH(m.legenda) + '</figcaption>' : '';
  if (m.tipo === 'image') return '<figure><img src="' + escH(url) + '" alt="" loading="lazy">' + leg + '</figure>';
  const y = ytId(url);
  if (y) return '<div class="nc-video"><iframe src="https://www.youtube-nocookie.com/embed/' + y + '" allowfullscreen loading="lazy" title="Vídeo"></iframe></div>';
  if (m.tipo === 'video' && !m.externo) return '<video src="' + escH(url) + '" controls preload="metadata"></video>';
  return '<p><a class="nc-link" href="' + escH(url) + '" target="_blank" rel="noopener">' + (m.tipo === 'file' || m.tipo === 'pdf' ? '📎 ' : '') + escH(m.legenda || url.replace(/^https:\/\/(www\.)?/, '').slice(0, 60)) + ' ↗</a></p>';
}
async function paginaIA(redis, chave) {
  const [v] = await redis([['GET', /^area:/.test(chave) ? chave : 'area:nhtml:' + chave]]);
  const o = json(v);
  if (!o) return null;
  let html = o.html, sobra = '';
  const M = o.midia || [];
  for (let i = 0; i < M.length; i++) {
    const m = M[i];
    let url = m.url;
    if (!m.externo) {
      const k = 'area:nmid:' + m.bloco;
      const [c] = await redis([['GET', k]]);
      const cc = json(c);
      if (cc && cc.ate > Date.now()) url = cc.url;
      else { try { const b = await api('GET', 'blocks/' + m.bloco); url = ((b[b.type] || {}).file || {}).url || ''; await redis([['SET', k, JSON.stringify({ url, ate: Date.now() + 45 * 60000 }), 'EX', 3600]]); } catch (e) { url = ''; } }
    }
    const tag = '<div data-midia="' + (i + 1) + '"></div>';
    if (html.indexOf(tag) >= 0) html = html.split(tag).join(midiaHtml(m, url)); else sobra += midiaHtml(m, url);
  }
  return { html: html.replace(/<div data-midia="\d+"><\/div>/g, '') + sobra, em: o.em };
}

// ---------- Reuniões (EMP) -> página de reuniões do cliente (só leitura) ----------
function deReuniao(p) {
  const pr = p.properties, dt = (pr['Data'] || {}).date;
  const u = k => { const v = ler(pr, k); return /^https?:\/\//.test(v || '') ? v : ''; };
  return {
    id: idc(p.id), ed: p.last_edited_time, leads: ler(pr, 'Lead ou Cliente') || [], interna: ler(pr, 'Tipo') === 'Interna',
    r: {
      id: idc(p.id), nome: ler(pr, 'Nome') || 'Reunião', data: dt && dt.start ? String(dt.start).slice(0, 16) : '', fim: dt && dt.end ? String(dt.end).slice(0, 16) : '',
      tipo: ler(pr, 'Tipo') || '', tema: ler(pr, 'Tema') || '', status: ler(pr, 'Status') || '', realizado: !!(pr['Realizado'] || {}).checkbox,
      gravacao: u('Link da Gravação '), drive: u('Link dos arquivos no Drive'), transcricao: u('Transcrição'), link: u('URL'),
      descricao: ler(pr, 'Descrição') || '', participantes: ler(pr, 'Participantes') || '', notion: p.url || '', ed: p.last_edited_time
    }
  };
}
async function puxaReunioes(redis, filtro, nmap, tudo) {
  const R = await todas(DB_REUN, filtro);
  const cmds = [], mapa = [], tirar = [];
  let n = 0;
  R.map(deReuniao).forEach(x => {
    const lig = nmap[x.id], vs = lig && lig.indexOf('r|') === 0 ? lig.slice(2) : '';
    const sl = x.interna ? '' : x.leads.map(id => nmap[id]).filter(v => v && v.indexOf('n|') === 0).map(v => v.split('|')[1])[0] || '';
    if (vs && vs !== sl) { cmds.push(['HDEL', 'area:reun:' + vs, x.id]); if (!sl) tirar.push(x.id); n++; }
    if (!sl) return;
    cmds.push(['HSET', 'area:reun:' + sl, x.id, JSON.stringify(x.r)], ['SADD', 'area:reun:slugs', sl]);
    if (vs !== sl) mapa.push(x.id, 'r|' + sl);
    n++;
  });
  if (tudo) { // o que foi arquivado/apagado no Notion sai do painel
    const vivos = {}; R.forEach(p => { vivos[idc(p.id)] = 1; });
    Object.keys(nmap).forEach(id => { const v = nmap[id]; if (v && v.indexOf('r|') === 0 && !vivos[id]) { cmds.push(['HDEL', 'area:reun:' + v.slice(2), id]); tirar.push(id); n++; } });
  }
  if (tirar.length) cmds.push(['HDEL', 'area:nmap'].concat(tirar));
  if (mapa.length) cmds.push(['HSET', 'area:nmap'].concat(mapa));
  if (cmds.length) await redis(cmds);
  return n;
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
  const r = slugs.length ? await redis(slugs.flatMap(s => [['GET', 'area:emp:' + s], ['SMEMBERS', 'area:users:' + s], ['HGETALL', 'area:neg:' + s], ['HGETALL', 'area:acoes:' + s]])) : [];
  const emps = {};
  const pedU = [];
  const valores = h => { const hp = Array.isArray(h) ? h : Object.keys(h || {}).flatMap(k => [k, h[k]]); const o = []; for (let j = 0; j < hp.length; j += 2) { const n = json(hp[j + 1]); if (n) o.push(n); } return o; };
  slugs.forEach((s, i) => {
    const e = json(r[i * 4]) || null;
    emps[s] = { slug: s, e, emails: r[i * 4 + 1] || [], negs: valores(r[i * 4 + 2]), acoes: valores(r[i * 4 + 3]), users: [] };
    (r[i * 4 + 1] || []).forEach(m => pedU.push([s, m]));
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
  const [E, P, L, T] = await Promise.all([todas(DB.emp), todas(DB.pessoa), todas(DB.lead), todas(DB.tarefa)]);
  const { emps, nmap } = await painel(redis, Object.keys(catalogo || {}));
  Object.keys(catalogo || {}).forEach(s => { if (!emps[s].e) emps[s].e = { slug: s, nome: catalogo[s].nome, catalogo: true }; });
  const ne = E.map(deEmp), np = P.map(dePessoa), nl = L.map(deLead);
  const ocupados = {}; Object.keys(emps).forEach(s => { if (emps[s].e) ocupados[s] = 1; });
  const ligSlug = {};        // idNotion empresa -> slug
  const usado = {};          // slug já ligado
  Object.keys(nmap).forEach(id => { const v = nmap[id]; if (v.indexOf('e|') === 0) { ligSlug[id] = v.slice(2); usado[v.slice(2)] = 1; } });
  const plano = { empresas: [], pessoas: [], negocios: [], tarefas: [], semEmpresa: [] };
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
  // 4) tarefas do plano de ação (só "Tarefa para" Cliente ou Lead)
  const leadSlug = {}; plano.negocios.forEach(x => { if (x.id) leadSlug[x.id] = x.slug; });
  const usadoA = {};
  T.map(deTarefa).filter(n => PARA_CLIENTE.indexOf(n.para) >= 0).forEach(n => {
    const sl = n.empresas.map(id => ligSlug[id]).filter(Boolean)[0] || leadSlug[n.lead];
    if (!sl) { plano.semEmpresa.push({ tipo: 'tarefa', nome: n.a.titulo }); return; }
    const acs = (emps[sl] || { acoes: [] }).acoes;
    let x = acs.find(a => a.notion === n.id), como = x ? 'ligada' : '';
    if (!x) { const nm = slugify(n.a.titulo); x = acs.find(a => !usadoA[a.id] && !a.notion && slugify(a.titulo) === nm); if (x) como = 'nome'; }
    if (x) usadoA[x.id] = 1;
    plano.tarefas.push({ id: n.id, nome: n.a.titulo, slug: sl, acaoId: x ? x.id : '', como: como || 'nova', n });
  });
  Object.keys(emps).forEach(s => (emps[s].acoes || []).forEach(a => { if (!(emps[s].e || {}).arquivada && !usadoA[a.id] && !a.notion && a.status !== 'arquivado') plano.tarefas.push({ id: '', nome: a.titulo, slug: s, acaoId: a.id, como: 'paraNotion' }); }));
  return { plano, emps, nmap };
}

function resumo(plano) {
  const conta = (lista, c) => lista.filter(x => x.como === c).length;
  const nomes = (lista, cs) => lista.filter(x => cs.indexOf(x.como) >= 0).map(x => x.nome + (x.como === 'cnpj' ? ' (pelo CNPJ)' : x.como === 'nome' ? ' → ' + x.slug : '')).slice(0, 400);
  return {
    empresas: { juntar: conta(plano.empresas, 'cnpj') + conta(plano.empresas, 'nome'), jaLigadas: conta(plano.empresas, 'ligada'), novasNoPainel: conta(plano.empresas, 'nova'), novasNoNotion: conta(plano.empresas, 'paraNotion'), listaJuntar: nomes(plano.empresas, ['cnpj', 'nome']), listaParaNotion: nomes(plano.empresas, ['paraNotion']) },
    pessoas: { juntar: conta(plano.pessoas, 'email') + conta(plano.pessoas, 'nome'), jaLigadas: conta(plano.pessoas, 'ligada'), novasNoPainel: conta(plano.pessoas, 'nova'), semEmail: plano.pessoas.filter(x => x.semEmail).length, novasNoNotion: conta(plano.pessoas, 'paraNotion'), listaParaNotion: nomes(plano.pessoas, ['paraNotion']) },
    negocios: { juntar: conta(plano.negocios, 'nome'), jaLigados: conta(plano.negocios, 'ligada'), novosNoPainel: conta(plano.negocios, 'nova'), novosNoNotion: conta(plano.negocios, 'paraNotion'), listaParaNotion: nomes(plano.negocios, ['paraNotion']) },
    tarefas: { juntar: conta(plano.tarefas, 'nome'), jaLigadas: conta(plano.tarefas, 'ligada'), novasNoPainel: conta(plano.tarefas, 'nova'), novasNoNotion: conta(plano.tarefas, 'paraNotion'), listaParaNotion: nomes(plano.tarefas, ['paraNotion']), listaJuntar: nomes(plano.tarefas, ['nome']) },
    semEmpresa: plano.semEmpresa.slice(0, 200)
  };
}

async function verifica() {
  if (!ligado()) return { ok: false, erro: 'Falta a variável NOTION_TOKEN na Vercel.' };
  const falta = [];
  for (const [k, id] of Object.entries(DB)) {
    try { await api('GET', 'databases/' + id); } catch (e) { falta.push({ emp: '(EMP) Empresa', pessoa: '(EMP) Contato', lead: '(EMP) Leads', tarefa: '(EMP) Tarefas' }[k]); }
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
  const leadDe = {};
  for (const it of pl.negocios) {
    const negs = (emps[it.slug] || {}).negs || [];
    const atual = negs.find(g => g.id === it.negId);
    if (it.como === 'paraNotion') {
      if (!empId[it.slug]) continue;
      const cids = ((atual.dados || {}).contatos || []).map(m => pesId[it.slug + '|' + m]).filter(Boolean);
      const p = await cria(DB.lead, propsLead(Object.assign({ slug: it.slug }, atual), empId[it.slug], cids)); cont.notion++;
      cmds.push(['HSET', 'area:neg:' + it.slug, atual.id, JSON.stringify(Object.assign({}, atual, { notion: idc(p.id), nEd: p.last_edited_time, nContatos: cids }))]); mapa.push(idc(p.id), 'n|' + it.slug + '|' + atual.id);
      leadDe[it.slug] = idc(p.id);
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
    if (!leadDe[it.slug]) leadDe[it.slug] = n.id;
    cont.negocios++;
    if (cmds.length > 200) await flush();
    if (Date.now() - t0 > 54000) { await flush(); return { ok: true, parcial: true, cont }; }
  }
  await flush();
  // 4) tarefas <-> ações
  const pesPorNotion = {}; Object.keys(pesId).forEach(k => { pesPorNotion[pesId[k]] = k; });
  cont.tarefas = 0;
  for (const it of pl.tarefas) {
    const atual = ((emps[it.slug] || {}).acoes || []).find(a => a.id === it.acaoId);
    if (it.como === 'paraNotion') {
      if (!empId[it.slug] || !atual) continue;
      const p = await cria(DB.tarefa, propsTarefa(atual, it.slug, { novo: true, empId: empId[it.slug], leadId: leadDe[it.slug], pessoaId: atual.pessoa ? pesId[it.slug + '|' + atual.pessoa] : '' })); cont.notion++;
      cmds.push(['HSET', 'area:acoes:' + it.slug, atual.id, JSON.stringify(Object.assign({}, atual, { notion: idc(p.id), nEd: p.last_edited_time }))]); mapa.push(idc(p.id), 'a|' + it.slug + '|' + atual.id);
      continue;
    }
    const n = it.n;
    const pk = n.pessoas.map(id => pesPorNotion[id]).filter(k => k && k.indexOf(it.slug + '|') === 0)[0];
    const daNotion = Object.assign({}, n.a, { pessoa: pk ? pk.split('|')[1] : '' });
    const junto = mescla(atual ? recorteAcao(atual) : {}, daNotion);
    if (atual && atual.pessoa && !junto.pessoa) junto.pessoa = atual.pessoa;
    const a = Object.assign({ id: novoId(), criado: agora(), responsavel: n.responsavel }, atual || {}, junto, { notion: n.id, nEd: n.ed, nTemArquivo: n.temArquivo });
    if (atual && atual.status === 'arquivado' && a.status === 'cancelado') a.status = 'arquivado';
    if (!mesmo(recorteAcao(junto), recorteAcao(daNotion)) || (junto.pessoa || '') !== (daNotion.pessoa || '')) {
      const p = await atualiza(n.id, propsTarefa(a, it.slug, { empId: n.empresas.length ? '' : empId[it.slug], pessoaId: a.pessoa ? pesId[it.slug + '|' + a.pessoa] : '' })); a.nEd = p.last_edited_time; cont.notion++;
    }
    cmds.push(['HSET', 'area:acoes:' + it.slug, a.id, JSON.stringify(a)]); mapa.push(n.id, 'a|' + it.slug + '|' + a.id);
    cont.tarefas++;
    if (cmds.length > 200) await flush();
    if (Date.now() - t0 > 55000) { await flush(); return { ok: true, parcial: true, cont }; }
  }
  await flush();
  await etapasDasEmpresas(redis);
  const [estV] = await redis([['GET', 'area:notion:estado']]);
  const estA = json(estV) || {};
  await redis([['SET', 'area:notion:estado', JSON.stringify(Object.assign(estA, { carga: estA.carga || agora(), cargaTarefas: agora(), ultimo: agora(), erro: '' }))]]);
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
  const [E, P, L, T] = await Promise.all([todas(DB.emp, filtro), todas(DB.pessoa, filtro), todas(DB.lead, filtro), est.cargaTarefas ? todas(DB.tarefa, filtro) : Promise.resolve([])]);
  const { emps, nmap } = await painel(redis);
  const ocupados = {}; Object.keys(emps).forEach(s => { if (emps[s].e) ocupados[s] = 1; });
  const cmds = [], mapa = [], mud = { empresas: 0, pessoas: 0, negocios: 0, acoes: 0 };
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
  // tarefas -> ações do plano
  const tiradas = [], escrever = [], filaIA = [];
  let [carlosNotion] = await redis([['GET', 'area:notion:carlos']]);
  T.map(deTarefa).forEach(n => {
    const lig = nmap[n.id];
    let velho = null, vs = '';
    if (lig && lig.indexOf('a|') === 0) { const pz = lig.split('|'); vs = pz[1]; velho = ((emps[vs] || {}).acoes || []).find(a => a.id === pz[2]) || null; }
    if (PARA_CLIENTE.indexOf(n.para) < 0) { if (velho) { cmds.push(['HSET', 'area:acoes:' + vs, velho.id, JSON.stringify(Object.assign({}, velho, { status: 'arquivado', notion: '' }))]); tiradas.push(n.id); mud.acoes++; } return; }
    const leadV = nmap[n.lead];
    const sl = n.empresas.map(slugDe).filter(Boolean)[0] || (leadV && leadV.indexOf('n|') === 0 ? leadV.split('|')[1] : '');
    if (!sl) return;
    if (n.ia === 'Gerar') filaIA.push(n.id);
    if (velho && velho.nEd && n.ed < velho.nEd) return;
    const daEmp = ids => ids.map(id => nmap[id]).filter(v => v && v.indexOf('p|' + sl + '|') === 0).map(v => v.split('|')[2]);
    const respE = daEmp(n.pessoas), obsE = daEmp(n.observadores || []);
    if ((n.respIds || []).length && !carlosNotion) { carlosNotion = n.respIds[0]; cmds.push(['SET', 'area:notion:carlos', carlosNotion]); }
    const comUnique = (n.respIds || []).length || ((velho && (velho.responsaveis || []).indexOf('unique') >= 0) && !carlosNotion);
    const novo = Object.assign({}, n.a, { pessoa: respE[0] || '', responsaveis: (comUnique ? ['unique'] : []).concat(respE), observadores: obsE });
    // texto formatado: se o texto não mudou no Notion, fica a formatação do painel; se mudou, vem a formatação do Notion
    novo.detalheHtml = velho && velho.detalheHtml && velho.detalhe === novo.detalhe ? velho.detalheHtml : ((n.rt || []).some(r => { const x = r.annotations || {}; return x.bold || x.italic || x.underline || x.strikethrough || (x.color && x.color !== 'default') || r.href; }) || /\n[•\d☐☑]/.test(novo.detalhe) ? RICO.deNotion(n.rt) : '');
    if (velho && velho.status === 'arquivado' && novo.status === 'cancelado') novo.status = 'arquivado';
    if (velho && velho.nEd === n.ed && vs === sl && mesmo(recorteAcao(velho), recorteAcao(novo)) && (velho.pessoa || '') === novo.pessoa && mesmo(velho.responsaveis || [], novo.responsaveis) && mesmo(velho.observadores || [], novo.observadores)) {
      if (velho.nConteudo === undefined) escrever.push({ sl, a: velho, id: n.id }); // ainda não sabemos se a página tem explicação
      return;
    }
    const a = Object.assign({ id: novoId(), criado: agora() }, velho || {}, novo, { responsavel: n.responsavel || (velho || {}).responsavel || '', notion: n.id, nEd: n.ed, nTemArquivo: n.temArquivo, atualizado: agora(), por: 'Notion' });
    if (velho && vs !== sl) cmds.push(['HDEL', 'area:acoes:' + vs, velho.id]);
    if (!velho || velho.nEd !== n.ed) delete a.nConteudo; // página mudou: confere a explicação de novo
    escrever.push({ sl, a, id: n.id });
    mapa.push(n.id, 'a|' + sl + '|' + a.id); mud.acoes++;
  });
  // explicação de cada tarefa = o conteúdo da página no Notion (confere até 30 por vez; o resto na próxima)
  let checadas = 0;
  for (let i = 0; i < escrever.length; i += 3) {
    await Promise.all(escrever.slice(i, i + 3).map(async x => {
      if (x.a.nConteudo !== undefined || checadas >= 30) return;
      checadas++;
      try { const r = await resumoPagina(x.id); x.a.nConteudo = r.tem; x.a.nResumo = r.resumo; } catch (e) { /* tenta na próxima */ }
    }));
  }
  escrever.forEach(x => cmds.push(['HSET', 'area:acoes:' + x.sl, x.a.id, JSON.stringify(x.a)]));
  if (tiradas.length) cmds.push(['HDEL', 'area:nmap'].concat(tiradas));
  if (filaIA.length) cmds.push(['SADD', 'area:ia:fila'].concat(filaIA));
  if (cmds.length || mapa.length) await redis(cmds.splice(0).concat(mapa.length ? [['HSET', 'area:nmap'].concat(mapa.splice(0))] : []));
  if (Object.keys(tocadas).length) await etapasDasEmpresas(redis, Object.keys(tocadas));
  if (op.tudo) await arquivados(redis, E, P, L, est.cargaTarefas ? T : null);
  mud.reunioes = 0;
  try {
    const [mH2] = await redis([['HGETALL', 'area:nmap']]);
    const nm2 = {}; const pr2 = Array.isArray(mH2) ? mH2 : Object.keys(mH2 || {}).flatMap(k => [k, mH2[k]]);
    for (let i = 0; i < pr2.length; i += 2) nm2[pr2[i]] = pr2[i + 1];
    mud.reunioes = await puxaReunioes(redis, filtro, nm2, op.tudo);
    est.erroReunioes = '';
  } catch (e) { est.erroReunioes = String(e.message || e).slice(0, 300); }
  await redis([['SET', 'area:notion:estado', JSON.stringify(Object.assign(est, { ultimo: inicio, erro: '' }))]]);
  await pendencias(redis);
  const [nIa] = await redis([['SCARD', 'area:ia:fila']]);
  return { ok: true, mud, total: mud.empresas + mud.pessoas + mud.negocios + mud.acoes + mud.reunioes, ia: nIa || 0 };
}

// sincronização completa: o que sumiu do Notion (arquivado/apagado) some do painel
async function arquivados(redis, E, P, L, T) {
  const vivos = {}; E.concat(P, L, T || []).forEach(p => { vivos[idc(p.id)] = 1; });
  const [mapH] = await redis([['HGETALL', 'area:nmap']]);
  const pares = Array.isArray(mapH) ? mapH : Object.keys(mapH || {}).flatMap(k => [k, mapH[k]]);
  const cmds = [];
  for (let i = 0; i < pares.length; i += 2) {
    const id = pares[i], v = pares[i + 1];
    if (vivos[id]) continue;
    const pz = v.split('|');
    if (pz[0] === 'r' || (pz[0] === 'a' && !T)) continue; // reuniões têm conferência própria
    if (pz[0] === 'a') {
      const [x] = await redis([['HGET', 'area:acoes:' + pz[1], pz[2]]]);
      const o = json(x); if (o) { o.status = 'arquivado'; o.notion = ''; cmds.push(['HSET', 'area:acoes:' + pz[1], pz[2], JSON.stringify(o)]); }
    }
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
    const url = SITE + '/area/admin/#' + (pz[0] === 'p' ? 'contatos/' : pz[0] === 'a' ? 'acoes' : 'empresas/') + (pz[0] === 'a' ? '' : pz[1]);
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
  if (pz[0] === 'a') { const [x] = await redis([['HGET', 'area:acoes:' + pz[1], pz[2]]]); const o = json(x); if (o) { o.nEd = ed; await redis([['HSET', 'area:acoes:' + pz[1], pz[2], JSON.stringify(o)]]); } }
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
    if (tipo === 'acao' || tipo === 'acao-del') {
      if (!(json(est0) || {}).cargaTarefas) return null;
      if (tipo === 'acao-del') { if (chave) { await api('PATCH', 'pages/' + chave, { archived: true }); await redis([['HDEL', 'area:nmap', chave]]); } return true; }
      const [av, hN] = await redis([['HGET', 'area:acoes:' + slug, chave], ['HGETALL', 'area:neg:' + slug]]);
      const a = json(av); if (!a) return null;
      const resp = Array.isArray(a.responsaveis) ? a.responsaveis : (a.pessoa ? [a.pessoa] : []);
      const emails = resp.filter(x => x !== 'unique'), obs = a.observadores || [];
      const todos = Array.from(new Set(emails.concat(obs)));
      const us = todos.length ? await redis(todos.map(m => ['GET', 'area:user:' + slug + ':' + m])) : [];
      const nid = {}; todos.forEach((m, i) => { const n = (json(us[i]) || {}).notion; if (n) nid[m] = n; });
      const [carlos] = await redis([['GET', 'area:notion:carlos']]);
      const pessoaIds = emails.map(m => nid[m]).filter(Boolean), obsIds = obs.map(m => nid[m]).filter(Boolean), pessoaId = pessoaIds[0] || '';
      let leadId = '';
      if (!a.notion) { const pares = Array.isArray(hN) ? hN : Object.keys(hN || {}).flatMap(k => [k, hN[k]]); const negs = []; for (let i = 0; i < pares.length; i += 2) { const g = json(pares[i + 1]); if (g && g.notion) negs.push(g); } const g = negs.sort((x, y) => String(y.nEd || '').localeCompare(String(x.nEd || '')))[0]; leadId = g ? g.notion : ''; }
      const p = a.notion ? await atualiza(a.notion, propsTarefa(a, slug, { pessoaId, pessoaIds, obsIds, carlos })) : await cria(DB.tarefa, propsTarefa(a, slug, { novo: true, empId: e.notion, leadId, pessoaId, pessoaIds, obsIds, carlos }));
      const novo = !a.notion;
      a.notion = idc(p.id); a.nEd = p.last_edited_time;
      await redis([['HSET', 'area:acoes:' + slug, a.id, JSON.stringify(a)]].concat(novo ? [['HSET', 'area:nmap', a.notion, 'a|' + slug + '|' + a.id]] : []));
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
  const [e, f, pl, ie, ifl] = await redis([['GET', 'area:notion:estado'], ['LLEN', 'area:notion:fila'], ['LLEN', 'area:notion:painel'], ['GET', 'area:ia:estado'], ['SCARD', 'area:ia:fila']]);
  return Object.assign({ token: ligado(), fila: f || 0, links: pl || 0, ia: Object.assign({ chave: IA.ligada(), fila: ifl || 0 }, json(ie) || {}) }, json(e) || {});
}

module.exports = { chaveIAde, processaIA, paginaIA, conteudoTarefa, ligado, verifica, plano, aplica, puxa, envia, estado, diagnostico, ehInterno, emailInterno, DB, DB_REUN, _t: { deReuniao, deEmp, dePessoa, deLead, deTarefa, propsEmp, propsPessoa, propsLead, propsTarefa, juntaEnd, separaEnd } };
