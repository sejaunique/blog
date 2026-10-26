// API da Área do Cliente Unique.
// Usa o mesmo Redis (Upstash) do blog e do diagnóstico.
//
// Cliente (público):
//   POST {a:'cadastro', empresa, nome, email, whatsapp, senha}  -> pedido de acesso (fica pendente até o Carlos aprovar)
//   POST {a:'entrar', empresa, email, senha}                    -> abre a sessão (cookie ua_sess)
//   POST {a:'sair'}
//   GET  ?a=eu                                                  -> quem está logado
//   GET  ?a=conteudo[&e=slug]                                   -> entregas e plano de ações da empresa (admin escolhe a empresa)
//   POST {a:'acao-status', id, status}                          -> cliente atualiza o andamento de uma ação
//   GET  ?a=arquivo&e=slug&id=ID                                -> baixa um arquivo enviado (só para quem é da empresa)
//   GET  ?a=og&e=slug&p=pasta                                   -> título, descrição e capa de uma página (público: é só a prévia do link)
//   GET  ?a=social&e=slug&id=ID                                 -> curtidas, comentários e se a página está pública
//   POST {a:'curtir', slug, id} / {a:'comentar', slug, id, texto} / {a:'comentar-del', slug, id, cid}
//   POST {a:'publico', slug, id, publico:true|false}            -> libera ou fecha uma página sem login (cliente da empresa ou admin)
// Carlos (admin):
//   POST {a:'admin-entrar', senha}  (senha = AREA_ADMIN_SENHA ou, se não existir, DIAG_SENHA)
//   GET  ?a=admin-resumo
//   POST {a:'admin-usuario', slug, email, status}   status: ativo | recusado | bloqueado | pendente
//   POST {a:'admin-senha', slug, email, senha}
//   POST {a:'admin-empresa', nome}
//   POST {a:'admin-item', slug, item} / {a:'admin-item-del', slug, id}
//   POST {a:'admin-acao', slug, acao} / {a:'admin-acao-del', slug, id}
//   POST {a:'admin-crm', slug, etapa?, tags?}       -> Kanban: etapa (lead | qualificado | cliente | finalizado) e etiquetas
//   POST {a:'admin-convite', slug, email}           -> gera o link para a pessoa criar a senha (o Carlos envia quando quiser)
//   POST {a:'admin-modelo', modelo, origem?} / {a:'admin-modelo-del', id}  -> ação compartilhada (todos ou clientes escolhidos)
//   GET  ?a=admin-acoes            -> tabela única: ações da biblioteca (com andamento por cliente) + ações de cada empresa
//   GET  ?a=admin-diagnosticos     -> diagnósticos recebidos (resumo)
//   GET  ?a=admin-propostas  ·  POST {a:'admin-proposta', proposta, contato|slug} / {a:'admin-proposta-del', id}
//   POST {a:'admin-pessoa', slug, nome, email, whatsapp}   -> vincula uma pessoa (sem senha até gerar o link)
//   POST {a:'admin-pessoa-dados', slug, email, nome, whatsapp, dados} -> campos de CRM da pessoa (modelo PESSOA)
//   POST {a:'admin-negocio', slug, id?, dados} / {a:'admin-negocio-del', slug, id} -> negócios da empresa (modelo NEGÓCIO, com histórico)
//   (campos da empresa, pessoa e negócio: api/_area/campos.js)
//   GET  ?a=admin-push-chave / ?a=admin-notif  ·  POST {a:'admin-push', sub} / {a:'admin-push-sair', endpoint} / {a:'admin-push-teste'}
//   POST {a:'admin-lido', k} / {a:'admin-lido-todos'}       -> notificações lidas
// Proposta (pública pelo token): GET ?a=proposta&p=TOKEN
// Convite (público): GET ?a=convite&t=TOKEN  ·  POST {a:'convite-senha', t, senha}
//   POST ?a=admin-upload&e=slug&nome=arquivo.pdf&tipo=application/pdf  (corpo = o arquivo, enviado como application/octet-stream)  -> precisa do Vercel Blob (BLOB_READ_WRITE_TOKEN)
//
// Chaves no Redis:
//   area:emp:<slug>            empresa {slug, nome, criado}
//   area:emps                  conjunto de slugs
//   area:user:<slug>:<email>   usuário {email, nome, whatsapp, slug, status, sal, hash, criado}
//   area:users:<slug>          conjunto de e-mails da empresa
//   area:pendentes             conjunto "slug|email" aguardando aprovação
//   area:sess:<token>          sessão {slug, email, nome} ou {admin:true}, expira em 30 dias
//   area:itens:<slug>          hash id -> entrega
//   area:acoes:<slug>          hash id -> ação
//   area:curt:<slug>:<id>      conjunto de quem curtiu (e-mail ou "unique")
//   area:com:<slug>:<id>       lista de comentários (mais novo primeiro)
//   area:modelos               hash id -> ação compartilhada {.., destino:'todos'|[slugs]}
//   area:mst:<slug>            hash id da ação compartilhada -> andamento nessa empresa
//   area:convite:<token>       {slug, email}, expira em 30 dias
//   area:propostas             hash id -> proposta {.., token, slug, status}
//   area:prop:<token>          id da proposta (link público)
//   area:lidos                 conjunto de notificações já lidas
//   area:diag                  hash slug -> último diagnóstico {id, data, token}
//   area:publico:<slug>        hash pasta -> "1" (páginas de /clientes/<slug>/<pasta>/ abertas sem login)

const crypto = require('crypto');
const CATALOGO = require('./_area/catalogo.js');
const BIBLIOTECA = require('./_area/biblioteca.js');
const { notifica, chaves } = require('./_area/push.js');
const GOOGLE = require('./_area/google.js');
const CAMPOS = require('./_area/campos.js');
const CONSULTA = require('./_area/consulta.js');
const NOTION = require('./_area/notion.js');
const RICO = require('./_area/rico.js');
const CANIVETE = require('./_area/canivete.js');
const CONTRATO = require('./_area/contrato.js');

const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN = process.env.AREA_ADMIN_SENHA || process.env.DIAG_SENHA || '';
const BLOB = process.env.BLOB_READ_WRITE_TOKEN || '';
const COOKIE = 'ua_sess';
const DIAS = 30;
const TIPOS = ['pagina', 'relatorio', 'diagnostico', 'video', 'arquivo', 'link', 'conteudo'];
const STATUS_ACAO = ['a_fazer', 'fazendo', 'feito', 'cancelado', 'arquivado'];
const STATUS_USER = ['ativo', 'recusado', 'bloqueado', 'pendente', 'convite'];
const ETAPAS = ['lead', 'qualificado', 'cliente', 'finalizado'];
const TAGS = ['Textil Club', 'Textil Club Elite', 'Textil Club Advisor', 'Consultoria', 'Mentoria', 'Projeto', 'Aula CRM', 'Palestra', 'Treinamento'];

async function redis(cmds) {
  const r = await fetch(URL_DB.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('db ' + r.status);
  const out = await r.json();
  return out.map(x => x.result);
}

const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const limpo = (s, max) => String(s == null ? '' : s).replace(/\r/g, '').trim().slice(0, max);
const slugify = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120;
const novoId = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');

function igual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function hashSenha(senha, sal) { return crypto.scryptSync(String(senha), sal, 32).toString('hex'); }

function corpo(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}
function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function poeCookie(res, valor, idade) {
  res.setHeader('Set-Cookie', `${COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${idade}`);
}

async function limite(chave, max, seg) {
  const k = 'rl:area:' + chave;
  const [n] = await redis([['INCR', k], ['EXPIRE', k, seg]]);
  return n > max;
}

async function sessao(req) {
  const t = cookies(req)[COOKIE];
  if (!t || !/^[a-f0-9]{48}$/.test(t)) return null;
  const [s] = await redis([['GET', 'area:sess:' + t]]);
  const v = json(s);
  return v ? Object.assign(v, { token: t }) : null;
}
async function abreSessao(res, dados) {
  const t = crypto.randomBytes(24).toString('hex');
  await redis([['SET', 'area:sess:' + t, JSON.stringify(dados), 'EX', DIAS * 86400]]);
  poeCookie(res, t, DIAS * 86400);
}

async function empresa(slug) {
  const [e] = await redis([['GET', 'area:emp:' + slug]]);
  const v = json(e);
  if (v) return v;
  if (CATALOGO[slug]) return { slug, nome: CATALOGO[slug].nome, catalogo: true };
  return null;
}

const SITE = 'https://sejaunique.com';
const ID_OK = /^[a-z0-9-]{2,40}$/;
// pasta da página em /clientes/<slug>/<pasta>/ (só essas podem ficar públicas)
function pastaDe(slug, item) {
  const m = String((item && item.url) || '').match(/^\/clientes\/([a-z0-9]+)\/([a-z0-9-]+)\/?/);
  return m && m[1] === slug ? m[2] : '';
}
function capaDe(slug, item) {
  if (item && item.capa) return /^https?:/.test(item.capa) ? item.capa : SITE + item.capa;
  return SITE + '/assets/og-site.jpg';
}
async function itemPorId(slug, id) {
  const cat = ((CATALOGO[slug] || {}).paginas || []).find(p => p.id === id);
  if (cat) return Object.assign({ publicado: true, fixo: true }, cat);
  const [v] = await redis([['HGET', 'area:itens:' + slug, id]]);
  if (v) return json(v);
  // também aceita a pasta da página (/clientes/<slug>/<pasta>/), que é o que a própria página conhece
  const porPasta = ((CATALOGO[slug] || {}).paginas || []).find(p => pastaDe(slug, p) === id);
  if (porPasta) return Object.assign({ publicado: true, fixo: true }, porPasta);
  const [h] = await redis([['HGETALL', 'area:itens:' + slug]]);
  const vals = Array.isArray(h) ? h.filter((x, i) => i % 2) : Object.values(h || {});
  return vals.map(json).find(x => x && pastaDe(slug, x) === id) || null;
}
function membro(s, slug) { return !!s && (s.admin || s.slug === slug); }
// mural de vitórias (Resultados): area:vit:<slug> hash id -> vitória; foto em area:vitfoto:<slug>:<id>
async function vitoriasDe(slug) {
  const [h] = await redis([['HGETALL', 'area:vit:' + slug]]);
  const L = lerPares(h).map(([, v]) => json(v)).filter(Boolean).sort((a, b) => String(b.data).localeCompare(String(a.data)));
  if (!L.length) return L;
  const r = await redis(L.flatMap(v => [['SCARD', 'area:curt:' + slug + ':v:' + v.id], ['LLEN', 'area:com:' + slug + ':v:' + v.id]]));
  L.forEach((v, i) => { v.curtidas = r[i * 2] || 0; v.comentarios = r[i * 2 + 1] || 0; v.slug = slug; });
  return L;
}
async function vitDe(slug, id) { const [v] = await redis([['HGET', 'area:vit:' + slug, String(id || '')]]); return json(v); }
// assistente com IA do admin (api/_area/chat.js)
let chatInst = null;
const CHAT = () => chatInst || (chatInst = require('./_area/chat.js').cria({ redis, lerPares, conteudo, empresa, pessoasDe, vitoriasDe, CATALOGO, NOTION, SITE }));
// quem é da empresa (nome e foto), para mostrar responsáveis e observadores
async function pessoasDe(slug) {
  const [ems] = await redis([['SMEMBERS', 'area:users:' + slug]]);
  const us = (ems || []).length ? await redis(ems.map(m => ['GET', 'area:user:' + slug + ':' + m])) : [];
  return us.map(json).filter(u => u && !u.arquivada && u.status !== 'recusado').map(u => ({ email: u.email, nome: u.nome, foto: u.foto || '', papel: papelDe(u) }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}
// contratos: área:contratos (id -> contrato), área:ctr:<token> -> id; aparece na área do cliente como entrega quando sai do rascunho
async function contratoPorToken(t) {
  t = String(t || '');
  if (!/^[a-f0-9]{24}$/.test(t)) return null;
  const [id] = await redis([['GET', 'area:ctr:' + t]]);
  const [cv] = id ? await redis([['HGET', 'area:contratos', id]]) : [null];
  return json(cv);
}
const CT_ST = { rascunho: 'Rascunho', enviado: 'Aguardando assinatura', 'assinado-cliente': 'Assinado pelo cliente', assinado: 'Assinado pelas duas partes', cancelado: 'Cancelado' };
async function salvaContrato(c) {
  const cmds = [['HSET', 'area:contratos', c.id, JSON.stringify(c)], ['SET', 'area:ctr:' + c.token, c.id]];
  if (c.status === 'rascunho' || c.status === 'cancelado') cmds.push(['HDEL', 'area:itens:' + c.slug, 'ct' + c.id]);
  else cmds.push(['HSET', 'area:itens:' + c.slug, 'ct' + c.id, JSON.stringify({ id: 'ct' + c.id, tipo: 'pagina', titulo: c.titulo, descricao: CT_ST[c.status] + '. Assinatura pelo Gov.br.', url: '/contrato/?c=' + c.token, publicado: true, criado: c.criado })]);
  await redis(cmds);
}
async function assinaContrato(c, quem, a) {
  c.assinaturas = c.assinaturas || {};
  c.assinaturas[quem] = { em: new Date().toISOString(), nome: a.nome, link: a.link, arquivo: a.arquivo };
  c.status = c.assinaturas.unique && c.assinaturas.cliente ? 'assinado' : c.assinaturas.cliente ? 'assinado-cliente' : c.status;
  c.atualizado = c.assinaturas[quem].em;
  await salvaContrato(c);
  if (quem === 'cliente') {
    // contrato assinado pelo cliente: proposta aceita e empresa vira cliente
    const [pv, ev] = await redis([['HGET', 'area:propostas', String(c.proposta || '')], ['GET', 'area:emp:' + c.slug]]);
    const p = json(pv), e = json(ev), cmds = [];
    if (p && p.status !== 'aceita') { p.status = 'aceita'; cmds.push(['HSET', 'area:propostas', p.id, JSON.stringify(p)]); }
    if (e && e.etapa !== 'cliente' && e.etapa !== 'finalizado') { e.etapa = 'cliente'; cmds.push(['SET', 'area:emp:' + c.slug, JSON.stringify(e)]); }
    if (cmds.length) await redis(cmds);
    await notifica(redis, { titulo: 'Contrato assinado pelo cliente', texto: c.empresa + ' enviou o contrato assinado no Gov.br. Falta a sua assinatura.', url: '/area/admin/#contratos' });
  } else if (c.status === 'assinado') await notifica(redis, { titulo: 'Contrato concluído', texto: 'O contrato da ' + c.empresa + ' está assinado pelas duas partes.', url: '/area/admin/#contratos' });
  return c;
}
// ações do plano também têm curtir, comentar e link público (para quem não tem login)
const ACAO_ID = /^[a-z0-9_-]{3,60}$/i;
async function acaoDe(slug, id) { const c = await conteudo(slug); return (c.acoes || []).find(x => x.id === id) || null; }
const urlAcaoPublica = t => SITE + '/compartilhado/?t=' + t;
// papéis de quem é da empresa: ADM (vê tudo), Gestor (vê reuniões e páginas restritas a gestores) e Usuário (o plano do dia a dia)
const PAPEIS = ['adm', 'gestor', 'usuario'];
const NIVEL = { usuario: 0, gestor: 1, adm: 2 };
const PRECISA = { todos: 0, gestor: 1, adm: 2 };
const papelDe = u => PAPEIS.indexOf((u || {}).papel) >= 0 ? u.papel : 'adm'; // quem já tinha acesso antes dos papéis continua vendo tudo
const visivelOk = v => v === 'gestor' || v === 'adm' ? v : 'todos';
async function papelSessao(s) {
  if (!s) return '';
  if (s.admin) return 'adm';
  const [v] = await redis([['GET', 'area:user:' + s.slug + ':' + s.email]]);
  return papelDe(json(v));
}
// ação com observadores: só veem os responsáveis, os observadores e os ADMs; sem observadores, vale o nível ("quem vê")
const podeVer = (papel, x, email) => {
  if (papel === 'adm') return true;
  const ob = (x && x.observadores) || [];
  if (ob.length) return !!email && (ob.indexOf(email) >= 0 || ((x.responsaveis || []).indexOf(email) >= 0));
  return (NIVEL[papel] || 0) >= (PRECISA[visivelOk((x || {}).visivel)] || 0);
};

function usuarioPublico(u) { return { papel: papelDe(u), semEmail: NOTION.ehInterno(u.email), notion: u.notion || '', email: u.email, nome: u.nome, whatsapp: u.whatsapp, status: u.status, criado: u.criado, ultimo: u.ultimo || '', origem: u.origem || '', crm: u.crm || {}, editado: u.editado || '', foto: u.foto || '', fotoOrigem: u.fotoOrigem || '' }; }

// Ações do catálogo entram no plano da empresa uma única vez (area:acoes-cat:<slug> lembra quais já entraram),
// então o status do cliente e as edições/exclusões do admin valem normalmente depois.
async function semeiaAcoes(slug) {
  const cat = (CATALOGO[slug] || {}).acoes || [];
  if (!cat.length) return;
  const novas = await redis(cat.map(a => ['SADD', 'area:acoes-cat:' + slug, a.id]));
  const cmds = [];
  cat.forEach((a, i) => { if (novas[i] === 1) cmds.push(['HSETNX', 'area:acoes:' + slug, a.id, JSON.stringify(limpaAcao(a))]); });
  if (cmds.length) await redis(cmds);
}
// Ações compartilhadas de api/_area/biblioteca.js entram na biblioteca (area:modelos) uma única vez.
async function semeiaBiblioteca() {
  if (!BIBLIOTECA.length) return;
  const novas = await redis(BIBLIOTECA.map(m => ['SADD', 'area:modelos-cat', m.id]));
  const cmds = [];
  BIBLIOTECA.forEach((m, i) => {
    if (novas[i] !== 1) return;
    const a = limpaAcao(m); delete a.status;
    a.destino = m.destino === 'todos' ? 'todos' : (Array.isArray(m.destino) ? m.destino : []);
    cmds.push(['HSETNX', 'area:modelos', a.id, JSON.stringify(a)]);
  });
  if (cmds.length) await redis(cmds);
}
function lerPares(h) {
  const out = [];
  if (Array.isArray(h)) for (let i = 0; i < h.length; i += 2) out.push([h[i], h[i + 1]]);
  else if (h && typeof h === 'object') Object.keys(h).forEach(k => out.push([k, h[k]]));
  return out;
}
const valePara = (m, slug) => m && (m.destino === 'todos' || (Array.isArray(m.destino) && m.destino.indexOf(slug) >= 0));

async function conteudo(slug) {
  await semeiaAcoes(slug);
  const [itensH, acoesH] = await redis([['HGETALL', 'area:itens:' + slug], ['HGETALL', 'area:acoes:' + slug]]);
  const lerHash = h => {
    const out = [];
    if (Array.isArray(h)) for (let i = 1; i < h.length; i += 2) { const v = json(h[i]); if (v) out.push(v); }
    else if (h && typeof h === 'object') Object.values(h).forEach(x => { const v = json(x); if (v) out.push(v); });
    return out;
  };
  const doCatalogo = ((CATALOGO[slug] || {}).paginas || []).map(p => Object.assign({ publicado: true, fixo: true }, p, { criado: p.data }));
  const itens = doCatalogo.concat(lerHash(itensH)).sort((a, b) => String(b.criado || '').localeCompare(String(a.criado || '')));
  if (itens.length) {
    const cmds = [['HGETALL', 'area:publico:' + slug]];
    itens.forEach(i => { cmds.push(['SCARD', 'area:curt:' + slug + ':' + i.id], ['LLEN', 'area:com:' + slug + ':' + i.id]); });
    const r = await redis(cmds);
    const pub = {};
    const h = r[0];
    if (Array.isArray(h)) for (let k = 0; k < h.length; k += 2) pub[h[k]] = h[k + 1];
    else if (h) Object.assign(pub, h);
    itens.forEach((i, k) => {
      i.curtidas = r[1 + k * 2] || 0;
      i.comentarios = r[2 + k * 2] || 0;
      i.pasta = pastaDe(slug, i);
      i.publico = !!(i.pasta && pub[i.pasta] === '1');
    });
  }
  const [modH, mstH] = await redis([['HGETALL', 'area:modelos'], ['HGETALL', 'area:mst:' + slug]]);
  const mst = {};
  lerPares(mstH).forEach(([k, v]) => { mst[k] = json(v) || {}; });
  const comp = lerHash(modH).filter(m => valePara(m, slug)).map(m => Object.assign({}, m, { compartilhada: true, status: (mst[m.id] || {}).status || 'a_fazer', prazo: (mst[m.id] || {}).prazo || m.prazo || '', dono: (mst[m.id] || {}).dono || m.dono || 'unique', tipo: (mst[m.id] || {}).tipo || m.tipo || 'acao', pessoa: (mst[m.id] || {}).pessoa !== undefined ? mst[m.id].pessoa : (m.pessoa || ''), responsaveis: (mst[m.id] || {}).responsaveis || m.responsaveis, observadores: (mst[m.id] || {}).observadores || m.observadores, por: (mst[m.id] || {}).por, atualizado: (mst[m.id] || {}).atualizado }));
  const ordem = { fazendo: 0, a_fazer: 1, feito: 2, cancelado: 3, arquivado: 4 };
  const acoes = lerHash(acoesH).concat(comp).map(normAcao).sort((a, b) => (ordem[a.status] - ordem[b.status]) || String(a.prazo || '9').localeCompare(String(b.prazo || '9')));
  return { itens, acoes };
}

function limpaItem(i) {
  const tipo = TIPOS.indexOf(i.tipo) >= 0 ? i.tipo : 'link';
  let url = limpo(i.url, 600);
  if (url && !/^https:\/\//i.test(url) && !/^\/[^/]/.test(url)) url = '';
  return {
    id: /^[a-z0-9]{6,24}$/.test(i.id || '') ? i.id : novoId(),
    tipo,
    titulo: limpo(i.titulo, 140),
    descricao: limpo(i.descricao, 600),
    url,
    texto: limpo(i.texto, 20000),
    arquivo: i.arquivo && /^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\//.test(i.arquivo.url || '') ? { url: i.arquivo.url, nome: limpo(i.arquivo.nome, 160), tamanho: +i.arquivo.tamanho || 0 } : undefined,
    publicado: i.publicado !== false,
    visivel: visivelOk(i.visivel),
    criado: limpo(i.criado, 30) || new Date().toISOString()
  };
}
const idc = id => String(id || '').replace(/-/g, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const listaPessoas = (v, comUnique) => Array.from(new Set((Array.isArray(v) ? v : []).map(x => String(x || '').trim().toLowerCase()).filter(x => (comUnique && x === 'unique') || EMAIL_RE.test(x)))).slice(0, 30);
// normaliza a ação (campos novos: responsaveis, observadores, data só com dia); `pessoa` fica como o 1º responsável do cliente
function normAcao(a) {
  if (!a) return a;
  if (!Array.isArray(a.responsaveis)) a.responsaveis = a.pessoa ? [a.pessoa] : [];
  if (!Array.isArray(a.observadores)) a.observadores = [];
  a.pessoa = a.responsaveis.filter(x => x !== 'unique')[0] || '';
  if (a.inicio && a.tipo !== 'reuniao') a.inicio = String(a.inicio).slice(0, 10); // reunião guarda a hora (Google Agenda)
  return a;
}
function limpaAcao(a) {
  const html = a.detalheHtml ? RICO.limpa(a.detalheHtml) : '';
  const resp = a.responsaveis !== undefined ? listaPessoas(a.responsaveis, true) : (EMAIL_RE.test(a.pessoa || '') ? [String(a.pessoa).toLowerCase()] : []);
  return {
    id: /^[a-z0-9]{6,24}$/.test(a.id || '') ? a.id : novoId(),
    titulo: limpo(a.titulo, 200),
    detalhe: html ? RICO.plano(html).slice(0, 20000) : limpo(a.detalhe, 20000),
    detalheHtml: html,
    responsaveis: resp,
    observadores: listaPessoas(a.observadores, false),
    responsavel: limpo(a.responsavel, 80),
    prazo: /^\d{4}-\d{2}-\d{2}$/.test(a.prazo || '') ? a.prazo : '',
    inicio: /^\d{4}-\d{2}-\d{2}/.test(a.inicio || '') ? String(a.inicio).slice(0, a.tipo === 'reuniao' && /T\d{2}:\d{2}/.test(a.inicio) ? 16 : 10) : '',
    dono: a.dono === 'cliente' || a.dono === 'ambos' ? a.dono : 'unique',
    pessoa: resp.filter(x => x !== 'unique')[0] || '',
    tipo: ['acao', 'post', 'video', 'reuniao', 'material', 'tecnica', 'isca'].indexOf(a.tipo) >= 0 ? a.tipo : 'acao',
    prioridade: ['URGENTE', 'P1', 'P2', 'P3'].indexOf(a.prioridade) >= 0 ? a.prioridade : '',
    link: (/^https:\/\//i.test(a.link || '') || /^\/[^/]/.test(a.link || '')) ? limpo(a.link, 600) : '',
    status: STATUS_ACAO.indexOf(a.status) >= 0 ? a.status : 'a_fazer',
    visivel: visivelOk(a.visivel),
    anexos: (Array.isArray(a.anexos) ? a.anexos : []).map(x => ({ nome: limpo((x || {}).nome, 160), link: /^https:\/\//i.test((x || {}).link || '') ? limpo(x.link, 600) : '' })).filter(x => x.link).slice(0, 20),
    criado: limpo(a.criado, 30) || new Date().toISOString()
  };
}

async function lerCorpoBruto(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const partes = [];
  for await (const c of req) partes.push(c);
  return Buffer.concat(partes);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_DB || !TOKEN) return res.status(503).json({ ok: false, erro: 'Banco de dados não configurado.' });

  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const q = req.query || {};

  try {
    // ---------- leituras ----------
    if (req.method === 'GET' && q.a === 'notion-cron') {
      const auth = String(req.headers.authorization || '');
      const okCron = /vercel-cron/i.test(String(req.headers['user-agent'] || '')) || (process.env.CRON_SECRET && auth === 'Bearer ' + process.env.CRON_SECRET);
      if (!okCron) return res.status(403).json({ ok: false });
      try { return res.json(await NOTION.puxa(redis, { tudo: true })); } catch (e) { return res.json({ ok: false, erro: e.message }); }
    }
    if (req.method === 'GET') {
      const s = await sessao(req);

      if (q.a === 'eu') {
        if (!s) return res.json({ ok: true, logado: false });
        if (s.admin) return res.json({ ok: true, logado: true, admin: true });
        const e = await empresa(s.slug);
        return res.json({ ok: true, logado: true, nome: s.nome, email: s.email, empresa: { slug: s.slug, nome: e ? e.nome : s.slug } });
      }

      // prévia do link (WhatsApp, Instagram, LinkedIn): só título, descrição e capa, nunca o conteúdo
      if (q.a === 'og') {
        const slug = slugify(q.e), pasta = String(q.p || '').toLowerCase();
        const e = await empresa(slug);
        if (!e || !ID_OK.test(pasta)) return res.status(404).json({ ok: false });
        const c = await conteudo(slug);
        const it = c.itens.find(i => i.publicado && i.pasta === pasta);
        if (!it) return res.status(404).json({ ok: false });
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.json({ ok: true, titulo: it.titulo, descricao: it.descricao || '', capa: capaDe(slug, it), empresa: e.nome, publico: it.publico, url: SITE + it.url });
      }

      if (q.a === 'social' && q.t === 'vit') {
        const slug = slugify(q.e), id = String(q.id || '');
        if (!membro(s, slug)) return res.status(401).json({ ok: false, erro: 'Entre na sua conta.' });
        const v = await vitDe(slug, id);
        if (!v) return res.status(404).json({ ok: false });
        const quem = s.admin ? 'unique' : s.email, k = slug + ':v:' + id;
        const [n, curti, lst] = await redis([['SCARD', 'area:curt:' + k], ['SISMEMBER', 'area:curt:' + k, quem], ['LRANGE', 'area:com:' + k, 0, 199]]);
        const comentarios = (lst || []).map(json).filter(Boolean).map(c => ({ cid: c.cid, nome: c.nome, texto: c.texto, data: c.data, unique: !!c.unique, meu: s.admin || c.email === s.email }));
        return res.json({ ok: true, logado: true, vit: true, admin: !!s.admin, curtidas: n || 0, curti: !!curti, comentarios, titulo: v.titulo });
      }
      if (q.a === 'social' && q.t === 'acao') {
        const slug = slugify(q.e), id = String(q.id || '');
        if (!ACAO_ID.test(id)) return res.status(400).json({ ok: false });
        if (!membro(s, slug)) return res.status(401).json({ ok: false, erro: 'Entre na sua conta.' });
        const a = await acaoDe(slug, id);
        if (!a || !podeVer(await papelSessao(s), a, s.email)) return res.status(404).json({ ok: false });
        const quem = s.admin ? 'unique' : s.email, k = slug + ':a:' + id;
        const [tok, n, curti, lst] = await redis([['HGET', 'area:acpub:' + slug, id], ['SCARD', 'area:curt:' + k], ['SISMEMBER', 'area:curt:' + k, quem], ['LRANGE', 'area:com:' + k, 0, 199]]);
        const comentarios = (lst || []).map(json).filter(Boolean).map(c => ({ cid: c.cid, nome: c.nome, texto: c.texto, data: c.data, unique: !!c.unique, meu: s.admin || c.email === s.email }));
        return res.json({ ok: true, logado: true, acao: true, admin: !!s.admin, curtidas: n || 0, curti: !!curti, comentarios, publico: !!tok, titulo: a.titulo, url: tok ? urlAcaoPublica(tok) : SITE + '/area/painel/#tarefa-' + id });
      }
      // página de uma ação aberta por link público (sem login, só leitura)
      if (q.a === 'acao-publica') {
        const t = String(q.t || '');
        if (!/^[a-f0-9]{24}$/.test(t)) return res.status(404).json({ ok: false });
        if (await limite('pub:' + ip, 120, 600)) return res.status(429).json({ ok: false });
        const [v] = await redis([['GET', 'area:acpubt:' + t]]);
        const pv = json(v);
        if (!pv) return res.status(404).json({ ok: false, erro: 'Este link foi desativado.' });
        const a = await acaoDe(pv.slug, pv.id);
        if (!a) return res.status(404).json({ ok: false, erro: 'Esta página não existe mais.' });
        const e = await empresa(pv.slug);
        let html = '';
        try {
          const pi = await NOTION.paginaIA(redis, NOTION.chaveIAde(pv.slug, a));
          if (pi) html = pi.html; else if (a.notion && NOTION.ligado()) html = await NOTION.conteudoTarefa(redis, a.notion, a.nEd || '');
        } catch (x) { html = ''; }
        const k = pv.slug + ':a:' + pv.id;
        const [n, nc] = await redis([['SCARD', 'area:curt:' + k], ['LLEN', 'area:com:' + k]]);
        res.setHeader('Cache-Control', 'no-store');
        return res.json({ ok: true, titulo: a.titulo, tipo: a.tipo || 'acao', detalhe: html ? '' : (a.detalhe || ''), detalheHtml: html ? '' : (a.detalheHtml || ''), html, empresa: e ? e.nome : '', status: a.status || 'a_fazer', prazo: a.prazo || '', dono: a.dono || 'unique', link: a.link || '', curtidas: n || 0, comentarios: nc || 0 });
      }

      if (q.a === 'social') {
        const slug = slugify(q.e);
        let id = String(q.id || '');
        if (!ID_OK.test(id)) return res.status(400).json({ ok: false });
        const it = await itemPorId(slug, id);
        if (!it || (!it.publicado && !(s && s.admin))) return res.status(404).json({ ok: false });
        if (s && !s.admin && s.slug === slug && !podeVer(await papelSessao(s), it, s.email)) return res.status(404).json({ ok: false });
        const pasta = pastaDe(slug, it);
        id = it.id;
        const quem = s ? (s.admin ? 'unique' : s.email) : '';
        const [pub, n, curti, lst] = await redis([
          ['HGET', 'area:publico:' + slug, pasta || '-'],
          ['SCARD', 'area:curt:' + slug + ':' + id],
          ['SISMEMBER', 'area:curt:' + slug + ':' + id, quem || '-'],
          ['LRANGE', 'area:com:' + slug + ':' + id, 0, 199]
        ]);
        const publico = pub === '1';
        if (!membro(s, slug)) {
          if (!publico) return res.status(401).json({ ok: false, erro: 'Entre na sua conta.' });
          return res.json({ ok: true, logado: false, curtidas: n || 0, publico: true });
        }
        const comentarios = (lst || []).map(json).filter(Boolean).map(c => ({
          cid: c.cid, nome: c.nome, texto: c.texto, data: c.data, unique: !!c.unique,
          meu: s.admin || c.email === s.email
        }));
        return res.json({ ok: true, logado: true, admin: !!s.admin, curtidas: n || 0, curti: !!curti, comentarios, publico, pasta, titulo: it.titulo, url: it.url ? (it.url.charAt(0) === '/' ? SITE + it.url : it.url) : '' });
      }

      if (q.a === 'convite') {
        const t = String(q.t || '');
        if (!/^[a-f0-9]{40}$/.test(t)) return res.status(404).json({ ok: false });
        const [c] = await redis([['GET', 'area:convite:' + t]]);
        const cv = json(c);
        if (!cv) return res.status(404).json({ ok: false, erro: 'Link expirado ou já usado. Peça um novo para a Unique.' });
        const [uv] = await redis([['GET', 'area:user:' + cv.slug + ':' + cv.email]]);
        const u = json(uv), e = await empresa(cv.slug);
        if (!u || !e) return res.status(404).json({ ok: false });
        return res.json({ ok: true, empresa: e.nome, nome: u.nome, email: u.email });
      }

      if (q.a === 'proposta') {
        const t = String(q.p || '');
        if (!/^[a-f0-9]{24}$/.test(t)) return res.status(404).json({ ok: false });
        const [id] = await redis([['GET', 'area:prop:' + t]]);
        const [pv] = id ? await redis([['HGET', 'area:propostas', id]]) : [null];
        const p = json(pv);
        if (!p) return res.status(404).json({ ok: false });
        if (!(s && s.admin) && p.status === 'rascunho') return res.status(404).json({ ok: false });
        if (!(s && s.admin) && p.status === 'enviada' && !p.vista) { p.vista = new Date().toISOString(); await redis([['HSET', 'area:propostas', p.id, JSON.stringify(p)]]); await notifica(redis, { titulo: 'Proposta aberta', texto: p.empresa + ' abriu a proposta “' + p.titulo + '”.', url: '/area/admin/#propostas' }); }
        const pub = Object.assign({}, p); delete pub.notas;
        return res.json({ ok: true, proposta: pub });
      }

      if (q.a === 'contrato') {
        const c = await contratoPorToken(q.c);
        if (!c || (!(s && s.admin) && c.status === 'rascunho')) return res.status(404).json({ ok: false });
        if (!(s && s.admin) && !c.vista) { c.vista = new Date().toISOString(); await redis([['HSET', 'area:contratos', c.id, JSON.stringify(c)]]); await notifica(redis, { titulo: 'Contrato aberto', texto: c.empresa + ' abriu o contrato.', url: '/area/admin/#contratos' }); }
        const pub = Object.assign({}, c); delete pub.notas;
        return res.json({ ok: true, contrato: pub, admin: !!(s && s.admin) });
      }

      if (!s) return res.status(401).json({ ok: false, erro: 'Entre na sua conta.' });

      if (q.a === 'admin-push-chave' || q.a === 'admin-notif') {
        if (!s.admin) return res.status(403).json({ ok: false });
        if (q.a === 'admin-push-chave') { const k = await chaves(redis); return res.json({ ok: true, publica: k.publica }); }
        const [l, lid] = await redis([['LRANGE', 'area:notif', 0, 39], ['SMEMBERS', 'area:notif-lidos']]);
        return res.json({ ok: true, notif: (l || []).map(json).filter(Boolean).map(n => Object.assign(n, { lido: (lid || []).indexOf(n.id) >= 0 })) });
      }

      if (q.a === 'admin-contratos') {
        if (!s.admin) return res.status(403).json({ ok: false });
        const [h, m, u] = await redis([['HGETALL', 'area:contratos'], ['GET', 'area:contrato:modelo'], ['GET', 'area:contrato:unique']]);
        return res.json({ ok: true, contratos: lerPares(h).map(([, v]) => json(v)).filter(Boolean).sort((a, b) => String(b.criado).localeCompare(String(a.criado))),
          modelo: m || CONTRATO.MODELO_PADRAO, modeloPadrao: CONTRATO.MODELO_PADRAO, unique: Object.assign({}, CONTRATO.UNIQUE_PADRAO, json(u) || {}), variaveis: CONTRATO.VARIAVEIS });
      }

      if (q.a === 'admin-acoes' || q.a === 'admin-diagnosticos' || q.a === 'admin-propostas') {
        if (!s.admin) return res.status(403).json({ ok: false });
        if (q.a === 'admin-propostas') {
          const [h] = await redis([['HGETALL', 'area:propostas']]);
          return res.json({ ok: true, propostas: lerPares(h).map(([, v]) => json(v)).filter(Boolean).sort((a, b) => String(b.criado).localeCompare(String(a.criado))) });
        }
        if (q.a === 'admin-diagnosticos') {
          const [lst] = await redis([['LRANGE', 'diag:lista', 0, 299]]);
          const CAMPOS_D = ['cnpj', 'instagram', 'segmento', 'tempo', 'faturamento', 'colaboradores'];
          const diagnosticos = (lst || []).map(json).filter(Boolean).map(d => { const dd = {}; (d.respostas || []).forEach(r => { if (CAMPOS_D.indexOf(r.id) >= 0 && r.resposta && !dd[r.id]) dd[r.id] = r.resposta; }); return { id: d.id, data: d.data, empresa: d.empresa, nome: d.nome, email: d.email, whatsapp: d.whatsapp, token: d.token, slug: slugify(d.empresa), respostas: (d.respostas || []).length, dados: dd }; });
          return res.json({ ok: true, diagnosticos });
        }
        for (const sl of Object.keys(CATALOGO)) if ((CATALOGO[sl].acoes || []).length) await semeiaAcoes(sl); // ações do catálogo aparecem já no painel do Carlos
        await semeiaBiblioteca(); // ações compartilhadas de api/_area/biblioteca.js
        const [slugsDb, mH] = await redis([['SMEMBERS', 'area:emps'], ['HGETALL', 'area:modelos']]);
        const slugs = Array.from(new Set((slugsDb || []).concat(Object.keys(CATALOGO)))).sort();
        const por = slugs.length ? await redis(slugs.flatMap(sl => [['HGETALL', 'area:acoes:' + sl], ['HGETALL', 'area:mst:' + sl], ['HGETALL', 'area:anot:' + sl]])) : [];
        const modelos = lerPares(mH).map(([, v]) => json(v)).filter(Boolean);
        const andamento = {};
        const proprias = [];
        slugs.forEach((sl, i) => {
          const nt = {}; lerPares(por[i * 3 + 2]).forEach(([id, v]) => { nt[id] = json(v); });
          lerPares(por[i * 3]).forEach(([, v]) => { const a = normAcao(json(v)); if (a) proprias.push(Object.assign(a, { slug: sl }, nt[a.id] ? { nota: nt[a.id] } : {})); });
          lerPares(por[i * 3 + 1]).forEach(([id, v]) => { (andamento[id] = andamento[id] || {})[sl] = json(v) || {}; });
          Object.keys(nt).forEach(id => { if (andamento[id] && andamento[id][sl]) andamento[id][sl].nota = nt[id]; else if (!proprias.some(a => a.id === id && a.slug === sl)) ((andamento[id] = andamento[id] || {})[sl] = { nota: nt[id] }); });
        });
        return res.json({ ok: true, modelos, andamento, proprias });
      }

      // arquivos da empresa no Google Drive (admin com ?e=slug; o cliente vê os da própria empresa)
      if (q.a === 'arquivos') {
        const slug = s.admin ? slugify(q.e) : s.slug;
        if (!(await empresa(slug))) return res.status(404).json({ ok: false });
        const [fixH, ocH] = await redis([['HGETALL', 'area:arq-fix:' + slug], ['SMEMBERS', 'area:arq-oculto:' + slug]]);
        const ocultos = ocH || [];
        // links fixados pelo Carlos (Canva, Notion, Docs...) — todos da empresa veem
        const fixos = lerPares(fixH).map(([id, v]) => Object.assign({ id, origem: 'fixo', quem: [] }, json(v) || {})).filter(x => x.link);
        const DR = require('./_area/drive.js');
        const p = await DR.pronto(redis);
        if (!p.ok) return res.json({ ok: true, drive: false, falta: p.falta, arquivos: fixos });
        const pasta = await DR.pastaEmpresa(redis, slug, (CATALOGO[slug] || {}).nome);
        if (!pasta) return res.json({ ok: true, drive: false, falta: 'erro', arquivos: fixos });
        // pasta da empresa + o que está compartilhado entre o Carlos e cada contato (guardado por 10 min)
        const [cache] = await redis([['GET', 'area:gdrive:' + slug]]);
        let comp = json(cache);
        if (!comp || q.novo) {
          const [ems] = await redis([['SMEMBERS', 'area:users:' + slug]]);
          comp = await DR.compartilhados(redis, (ems || []).filter(m => !NOTION.ehInterno(m)));
          await redis([['SET', 'area:gdrive:' + slug, JSON.stringify(comp), 'EX', 600]]);
        }
        const daPasta = (await DR.lista(redis, pasta.id)) || [];
        const vistos = {};
        let arquivos = daPasta.map(a => { vistos[a.id] = 1; return Object.assign(a, { origem: 'pasta', quem: [] }); });
        Object.keys(comp || {}).forEach(id => { if (vistos[id] || id === pasta.id) return; arquivos.push(Object.assign({}, comp[id].arq, { origem: 'compart', quem: comp[id].emails })); });
        arquivos = arquivos.concat(fixos);
        if (!s.admin) {
          const papel = await papelSessao(s);
          arquivos = arquivos.filter(a => ocultos.indexOf(a.id) < 0 && (a.origem !== 'compart' || papel === 'adm' || a.quem.indexOf(s.email) >= 0));
        } else arquivos.forEach(a => { a.oculto = ocultos.indexOf(a.id) >= 0; });
        arquivos.sort((a, b) => (b.pasta ? 1 : 0) - (a.pasta ? 1 : 0) || String(b.data || '').localeCompare(String(a.data || '')));
        return res.json({ ok: true, drive: true, pasta: { link: pasta.link }, arquivos });
      }
      if (q.a === 'conteudo') {
        const slug = s.admin ? slugify(q.e) : s.slug;
        const e = await empresa(slug);
        if (!e) return res.status(404).json({ ok: false, erro: 'Empresa não encontrada.' });
        const c = await conteudo(slug);
        const papel = await papelSessao(s);
        if (!s.admin) { c.itens = c.itens.filter(i => i.publicado && podeVer(papel, i, s.email)); c.acoes = c.acoes.filter(a => podeVer(papel, a, s.email) && (a.tipo !== 'reuniao' || papel === 'adm')); }
        c.itens.forEach(i => {
          if (!i.arquivo) return;
          i.baixar = '/api/area?a=arquivo&e=' + slug + '&id=' + i.id;
          if (!s.admin) delete i.arquivo; // o cliente baixa pela API, que confere a empresa
        });
        // lista de leitura (posts do blog delegados a cada pessoa): o cliente vê só a dele
        // reuniões vêm do Notion; para o link da reunião aparecer logo, o painel do cliente puxa o que mudou (no máximo a cada 5 min)
        if (!s.admin && NOTION.ligado()) {
          try { const [trava] = await redis([['SET', 'area:notion:trava-cli', '1', 'NX', 'EX', 300]]); if (trava === 'OK') await NOTION.puxa(redis); } catch (e) { /* segue com o que tem */ }
        }
        const [lH, rH, nH] = await redis([['HGETALL', 'area:leit:' + slug], ['HGETALL', 'area:reun:' + slug], ['HGETALL', 'area:anot:' + slug]]);
        const notas = {}; lerPares(nH).forEach(([k, v]) => { notas[k] = json(v); });
        c.acoes.forEach(a => { if (notas[a.id]) a.nota = notas[a.id]; a.rica = !!(a.nIA || a.nConteudo || String(a.detalhe || '').trim().length > 40 || (a.anexos || []).length); });
        const reunioes = papel === 'adm' ? lerPares(rH).map(([, v]) => json(v)).filter(Boolean).sort((a, b) => String(b.data).localeCompare(String(a.data))) : [];
        const leituras = lerPares(lH).map(([, v]) => json(v)).filter(Boolean).filter(l => s.admin || l.pessoa === s.email || l.pessoa === '*')
          .map(l => (!s.admin && l.pessoa === '*') ? Object.assign({}, l, { lido: (l.lidoPor || {})[s.email] || '', todos: true }) : l)
          .sort((a, b) => String(a.criado).localeCompare(String(b.criado)));
        return res.json({ ok: true, empresa: { slug, nome: e.nome }, itens: c.itens, acoes: c.acoes, leituras, reunioes, iaFila: (await redis([['SCARD', 'area:ia:fila']]))[0] || 0, admin: !!s.admin, eu: s.admin ? '' : s.email, nome: s.admin ? 'Carlos' : (s.nome || ''), papel, pessoas: await pessoasDe(slug) });
      }

      if (q.a === 'arquivo') {
        const slug = slugify(q.e);
        if (!s.admin && s.slug !== slug) return res.status(403).json({ ok: false });
        const [v] = await redis([['HGET', 'area:itens:' + slug, String(q.id || '')]]);
        const it = json(v);
        if (!it || !it.arquivo || (!s.admin && (!it.publicado || !podeVer(await papelSessao(s), it, s.email)))) return res.status(404).json({ ok: false });
        res.setHeader('Location', it.arquivo.url);
        return res.status(302).end();
      }

      // preenchimento automático: CNPJ (Receita), CEP e cidades do IBGE
      if (q.a === 'admin-meta') {
        if (!s.admin) return res.status(403).json({ ok: false });
        const c = await require('./_area/meta.js').conf(redis);
        return res.json({ ok: true, conectado: !!(c && c.token), igUser: c ? c.igUser : '', pagina: c ? c.pagina : '', desde: c ? c.conectado : '' });
      }
      // anotações dos contatos de uma empresa (area:notas:<slug>, mais nova primeiro)
      // todas as leituras (para a tela de postagens): post -> [{slug, pessoa, lido, lidoPor}]
      if (q.a === 'admin-leituras') {
        if (!s.admin) return res.status(403).json({ ok: false });
        const [slugsDb] = await redis([['SMEMBERS', 'area:emps']]);
        const sl = slugsDb || [];
        const hs = sl.length ? await redis(sl.map(x => ['HGETALL', 'area:leit:' + x])) : [];
        const out = [];
        sl.forEach((x, i) => lerPares(hs[i]).forEach(([, v]) => { const l = json(v); if (l) out.push(Object.assign(l, { slug: x })); }));
        return res.json({ ok: true, leituras: out });
      }
      if (q.a === 'admin-notas') {
        if (!s.admin) return res.status(403).json({ ok: false });
        const [l] = await redis([['LRANGE', 'area:notas:' + slugify(q.e), 0, 199]]);
        return res.json({ ok: true, notas: (l || []).map(json).filter(Boolean) });
      }
      if (q.a === 'admin-foto-insta') {
        if (!s.admin) return res.status(403).json({ ok: false });
        return res.json(await CONSULTA.fotoInstagram(q.u, redis));
      }
      // foto da empresa (k=emp:<slug>) ou do contato (k=p:<slug>:<email>): admin ou alguém da própria empresa
      if (q.a === 'foto') {
        const k = String(q.k || ''), m = k.match(/^(emp|p):([a-z0-9]{1,40})(?::(.{3,120}))?$/);
        if (!m || !membro(s, m[2])) return res.status(404).end();
        const [v] = await redis([['GET', 'area:foto:' + k]]);
        if (!v) return res.status(404).end();
        const mm = String(v).match(/^data:(image\/[a-z+]+);base64,(.+)$/);
        if (!mm) return res.status(404).end();
        res.setHeader('Content-Type', mm[1]);
        res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
        res.status(200);
        return res.end(Buffer.from(mm[2], 'base64'));
      }
      if (q.a === 'admin-cnpj' || q.a === 'admin-cep' || q.a === 'admin-cidades') {
        if (!s.admin) return res.status(403).json({ ok: false });
        const r = q.a === 'admin-cnpj' ? await CONSULTA.cnpj(redis, q.v) : q.a === 'admin-cep' ? await CONSULTA.cep(redis, q.v) : await CONSULTA.cidades(redis, q.v);
        return res.json(r);
      }

      if (q.a === 'admin-notion' || q.a === 'admin-notion-plano') {
        if (!s.admin) return res.status(403).json({ ok: false });
        if (q.a === 'admin-notion') return res.json(Object.assign({ ok: true }, await NOTION.estado(redis)));
        try { return res.json(await NOTION.plano(redis, CATALOGO)); } catch (e) { return res.json({ ok: false, erro: 'Notion: ' + e.message }); }
      }
      // página da tarefa: a explicação vem do conteúdo da página no Notion
      if (q.a === 'acao-conteudo') {
        const slug = s.admin ? slugify(q.e) : s.slug;
        const c = await conteudo(slug);
        const a = (c.acoes || []).find(x => x.id === String(q.id || ''));
        if (!a || !podeVer(await papelSessao(s), a, s.email)) return res.status(404).json({ ok: false });
        let html = '', erro = '';
        let ia = false;
        try {
          const pi = await NOTION.paginaIA(redis, NOTION.chaveIAde(slug, a));
          if (pi) { html = pi.html; ia = true; }
          else if (a.notion && NOTION.ligado()) html = await NOTION.conteudoTarefa(redis, a.notion, a.nEd || '');
        } catch (e) { erro = 'Não consegui abrir a explicação agora.'; }
        const [nv] = await redis([['HGET', 'area:anot:' + slug, a.id]]);
        return res.json({ ok: true, html, ia, erro, nota: json(nv) });
      }
      // página da reunião: resumo/anotações da página no Notion (só ADM da empresa)
      if (q.a === 'reuniao-conteudo') {
        const slug = s.admin ? slugify(q.e) : s.slug, id = String(q.id || '').replace(/[^a-f0-9]/g, '');
        if ((await papelSessao(s)) !== 'adm') return res.status(403).json({ ok: false });
        const [v] = await redis([['HGET', 'area:reun:' + slug, id]]);
        const r = json(v);
        if (!r) return res.status(404).json({ ok: false });
        let html = '';
        try { if (NOTION.ligado()) html = await NOTION.conteudoTarefa(redis, id, r.ed || ''); } catch (e) { html = ''; }
        return res.json({ ok: true, html });
      }
      if (q.a === 'vitorias') {
        if (s.admin && q.todas) {
          const [sl] = await redis([['SMEMBERS', 'area:emps']]);
          const tudo = [];
          for (const x of (sl || [])) (await vitoriasDe(x)).forEach(v => tudo.push(v));
          tudo.sort((a, b) => String(b.data).localeCompare(String(a.data)));
          return res.json({ ok: true, vitorias: tudo.slice(0, 300) });
        }
        const slug = s.admin ? slugify(q.e) : s.slug;
        return res.json({ ok: true, vitorias: await vitoriasDe(slug), papel: await papelSessao(s), eu: s.admin ? 'unique' : s.email });
      }
      if (q.a === 'vitfoto') {
        const slug = slugify(q.e), id = String(q.id || '').replace(/[^a-z0-9]/g, '');
        if (!membro(s, slug)) return res.status(404).end();
        const [v] = await redis([['GET', 'area:vitfoto:' + slug + ':' + id]]);
        const mm = String(v || '').match(/^data:(image\/[a-z+]+);base64,(.+)$/);
        if (!mm) return res.status(404).end();
        res.setHeader('Content-Type', mm[1]); res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
        return res.end(Buffer.from(mm[2], 'base64'));
      }
      if (q.a === 'canivete') {
        if (s.admin) return res.json({ ok: true, itens: await CANIVETE.lista(redis, SITE, true), nomes: CANIVETE.NOME });
        const L = (await CANIVETE.lista(redis, SITE, false)).filter(i => CANIVETE.liberadoPara(i, s.slug)).map(i => ({ id: i.id, tipo: i.tipo, titulo: i.titulo, link: i.link, descricao: i.descricao, tags: i.tags, capa: i.capa, criado: i.criado }));
        return res.json({ ok: true, itens: L, nomes: CANIVETE.NOME });
      }
      if (q.a === 'admin-chat-lista' || q.a === 'admin-chat-conv') {
        if (!s.admin) return res.status(403).json({ ok: false });
        if (q.a === 'admin-chat-lista') return res.json({ ok: true, conversas: await CHAT().lista(), chave: !!process.env.ANTHROPIC_API_KEY });
        const c = await CHAT().conversa(String(q.id || '').replace(/[^a-f0-9]/g, ''));
        return c ? res.json(Object.assign({ ok: true }, c)) : res.status(404).json({ ok: false });
      }
      if (q.a === 'admin-reunioes') {
        if (!s.admin) return res.status(403).json({ ok: false });
        const [sl] = await redis([['SMEMBERS', 'area:reun:slugs']]);
        const lst = (sl || []).length ? await redis(sl.map(x => ['HGETALL', 'area:reun:' + x])) : [];
        const reunioes = [];
        (sl || []).forEach((x, i) => lerPares(lst[i]).forEach(([, v]) => { const r = json(v); if (r) reunioes.push(Object.assign(r, { slug: x })); }));
        reunioes.sort((a, b) => String(b.data).localeCompare(String(a.data)));
        return res.json({ ok: true, reunioes });
      }
      if (q.a === 'admin-resumo') {
        if (!s.admin) return res.status(403).json({ ok: false });
        const [slugsDb, pend] = await redis([['SMEMBERS', 'area:emps'], ['SMEMBERS', 'area:pendentes']]);
        const slugs = Array.from(new Set((slugsDb || []).concat(Object.keys(CATALOGO)))).sort();
        const empresas = [];
        // tudo em lote (com o Notion são centenas de empresas)
        const base = slugs.length ? await redis(slugs.flatMap(sl => [['GET', 'area:emp:' + sl], ['SMEMBERS', 'area:users:' + sl], ['HGETALL', 'area:neg:' + sl]])) : [];
        const pedU = [];
        slugs.forEach((sl, i) => (base[i * 3 + 1] || []).forEach(m => pedU.push([sl, m])));
        const todosU = pedU.length ? await redis(pedU.map(([sl, m]) => ['GET', 'area:user:' + sl + ':' + m])) : [];
        const porSlug = {};
        pedU.forEach(([sl], i) => { const u = json(todosU[i]); if (u && !u.arquivada) (porSlug[sl] = porSlug[sl] || []).push(usuarioPublico(u)); });
        slugs.forEach((slug, i) => {
          const ev = json(base[i * 3]) || { slug, nome: (CATALOGO[slug] || {}).nome || slug };
          if (ev.arquivada) return;
          const negocios = lerPares(base[i * 3 + 2]).map(([, v]) => json(v)).filter(Boolean).map(n => Object.assign(n, { dados: Object.assign({}, n.dados, CAMPOS.limpa(CAMPOS.negocio, n.dados || {})) })).sort((a, b) => String(b.criado).localeCompare(String(a.criado)));
          empresas.push({ slug, nome: ev.nome, num: ev.num || 0, notion: ev.notion || '', foto: ev.foto || '', fotoOrigem: ev.fotoOrigem || '', dados: ev.dados || {}, editado: ev.editado || '', negocios, etapa: ETAPAS.indexOf(ev.etapa) >= 0 ? ev.etapa : (ev.origem === 'diagnostico' ? 'lead' : 'cliente'), tags: ev.tags || [], origem: ev.origem || '', criado: ev.criado || '', usuarios: porSlug[slug] || [] });
        });
        const [dH, mH] = await redis([['HGETALL', 'area:diag'], ['HGETALL', 'area:modelos']]);
        const dg = {};
        lerPares(dH).forEach(([k, v]) => { dg[k] = json(v); });
        empresas.forEach(e => { if (dg[e.slug]) e.diagnostico = dg[e.slug]; });
        const modelos = lerPares(mH).map(([, v]) => json(v)).filter(Boolean).sort((a, b) => String(b.criado).localeCompare(String(a.criado)));
        const pendentes = [];
        for (const p of (pend || [])) {
          const [slug, email] = p.split('|');
          const [u] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
          const uv = json(u);
          if (uv) pendentes.push(Object.assign(usuarioPublico(uv), { slug, empresaNome: uv.empresaNome || slug }));
        }
        const [av] = await redis([['LRANGE', 'area:avisos', 0, 29]]);
        const [lidos] = await redis([['SMEMBERS', 'area:lidos']]);
        const avisos = (av || []).map(json).filter(Boolean).filter(a => !a.unique).map(a => Object.assign(a, { k: (a.slug + '|' + a.id + '|' + a.data).slice(0, 120) })).map(a => Object.assign(a, { lido: (lidos || []).indexOf(a.k) >= 0 }));
        return res.json({ ok: true, empresas, pendentes, avisos, modelos, etapas: ETAPAS, tags: TAGS, blob: !!BLOB, campos: CAMPOS.defs, etapasNeg: CAMPOS.ETAPAS_NEG });
      }
      return res.status(400).json({ ok: false });
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false });

    // ---------- envio de arquivo para a pasta do Drive da empresa (corpo bruto, até ~4 MB) ----------
    if (q.a === 'arquivo-enviar') {
      const s = await sessao(req);
      if (!s) return res.status(401).json({ ok: false, erro: 'Entre na sua conta.' });
      const slug = s.admin ? slugify(q.e) : s.slug;
      const DR = require('./_area/drive.js');
      const p = await DR.pronto(redis);
      if (!p.ok) return res.status(503).json({ ok: false, erro: 'A pasta de arquivos ainda não está ligada.' });
      const dados = await lerCorpoBruto(req);
      if (!dados.length) return res.status(400).json({ ok: false, erro: 'Arquivo vazio.' });
      const pasta = s.admin && !slug ? { id: await DR.raiz(redis) } : await DR.pastaEmpresa(redis, slug, (CATALOGO[slug] || {}).nome);
      if (pasta && !pasta.id) return res.status(502).json({ ok: false, erro: 'Não consegui abrir a pasta da Unique no Drive.' });
      if (!pasta) return res.status(502).json({ ok: false, erro: 'Não consegui abrir a pasta da empresa.' });
      const nome = limpo(q.nome, 160) || 'arquivo';
      const f = await DR.envia(redis, pasta.id, nome, limpo(q.tipo, 100).replace(/[^\w.+\/-]/g, ''), dados);
      if (!f) return res.status(502).json({ ok: false, erro: 'Falha ao enviar para o Drive.' });
      if (!s.admin) await notifica(redis, { titulo: 'Arquivo recebido', texto: s.nome + ' enviou ' + nome, url: '/area/admin/#empresas/' + slug });
      return res.json({ ok: true, arquivo: { id: f.id, nome: f.name, link: f.webViewLink } });
    }

    // ---------- contrato assinado no Gov.br: cada parte envia o PDF de volta (corpo bruto, até ~4 MB) ----------
    if (q.a === 'contrato-pdf') {
      const s = await sessao(req);
      const c = await contratoPorToken(q.c);
      if (!c || c.status === 'rascunho' || c.status === 'cancelado') return res.status(404).json({ ok: false, erro: 'Contrato não encontrado.' });
      const quem = q.quem === 'unique' ? 'unique' : 'cliente';
      if (quem === 'unique' && !(s && s.admin)) return res.status(403).json({ ok: false });
      if (!(s && s.admin) && await limite('ctr:' + ip, 12, 3600)) return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Tente mais tarde.' });
      const dados = await lerCorpoBruto(req);
      if (dados.length < 100 || dados.slice(0, 5).toString() !== '%PDF-') return res.status(400).json({ ok: false, erro: 'Envie o arquivo PDF que o assinador do Gov.br devolveu.' });
      if (dados.length > 4.4e6) return res.status(413).json({ ok: false, erro: 'O PDF passou de 4 MB.' });
      const nome = 'Contrato ' + c.empresa + ' · assinado ' + (quem === 'unique' ? 'Unique' : 'cliente') + ' · ' + new Date().toISOString().slice(0, 10) + '.pdf';
      let link = '';
      const DR = require('./_area/drive.js');
      const p = await DR.pronto(redis);
      if (p.ok) {
        const pasta = await DR.pastaEmpresa(redis, c.slug, (CATALOGO[c.slug] || {}).nome || c.empresa);
        const f = pasta && pasta.id ? await DR.envia(redis, pasta.id, nome, 'application/pdf', dados) : null;
        if (f) link = f.webViewLink;
      }
      if (!link && BLOB) {
        const r = await fetch('https://blob.vercel-storage.com/contratos/' + c.slug + '/' + encodeURIComponent(nome.replace(/[^\w.\- ]/g, '_')), { method: 'PUT', headers: { authorization: 'Bearer ' + BLOB, 'x-api-version': '7', 'x-add-random-suffix': '1', 'x-content-type': 'application/pdf' }, body: dados });
        const out = await r.json().catch(() => ({}));
        if (r.ok && out.url) link = out.url;
      }
      if (!link) return res.status(503).json({ ok: false, erro: 'Não consegui guardar o PDF agora. Mande o arquivo para a Unique pelo WhatsApp.' });
      const r = await assinaContrato(c, quem, { link, nome: limpo(q.nome, 80) || (quem === 'unique' ? 'Carlos Ribeiro' : (s && s.nome) || c.signatario || ''), arquivo: nome });
      return res.json({ ok: true, contrato: r });
    }

    // ---------- upload (corpo bruto) ----------
    if (q.a === 'admin-upload') {
      const s = await sessao(req);
      if (!s || !s.admin) return res.status(403).json({ ok: false });
      if (!BLOB) return res.status(501).json({ ok: false, erro: 'O armazenamento de arquivos (Vercel Blob) ainda não foi ligado ao projeto. Por enquanto, cole um link do Google Drive.' });
      const slug = slugify(q.e);
      const nome = limpo(q.nome, 160).replace(/[^\w.\- ]/g, '_') || 'arquivo';
      const dados = await lerCorpoBruto(req);
      if (!dados.length) return res.status(400).json({ ok: false, erro: 'Arquivo vazio.' });
      const r = await fetch('https://blob.vercel-storage.com/area/' + slug + '/' + encodeURIComponent(nome), {
        method: 'PUT',
        headers: {
          authorization: 'Bearer ' + BLOB,
          'x-api-version': '7',
          'x-add-random-suffix': '1',
          'x-content-type': limpo(q.tipo, 100).replace(/[^\w.+\/-]/g, '') || 'application/octet-stream'
        },
        body: dados
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.url) return res.status(502).json({ ok: false, erro: 'Falha ao guardar o arquivo.' });
      return res.json({ ok: true, arquivo: { url: out.url, nome, tamanho: dados.length } });
    }

    const b = corpo(req);

    if (b.a === 'cadastro') {
      if (b.site) return res.json({ ok: true }); // campo invisível: robô
      if (await limite('cad:' + ip, 8, 3600)) return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Tente de novo mais tarde.' });
      const empresaNome = limpo(b.empresa, 80), slug = slugify(empresaNome);
      const nome = limpo(b.nome, 80), email = limpo(b.email, 120).toLowerCase(), whatsapp = limpo(b.whatsapp, 30), senha = String(b.senha || '');
      if (slug.length < 2 || !nome || !emailOk(email)) return res.status(400).json({ ok: false, erro: 'Preencha empresa, nome e um e-mail válido.' });
      if (senha.length < 8) return res.status(400).json({ ok: false, erro: 'A senha precisa ter pelo menos 8 caracteres.' });
      const [existe] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
      const ex = json(existe);
      if (ex && ex.status === 'convite') {
        ex.sal = crypto.randomBytes(16).toString('hex'); ex.hash = hashSenha(senha, ex.sal); ex.status = 'pendente';
        if (whatsapp) ex.whatsapp = whatsapp;
        await redis([['SET', 'area:user:' + slug + ':' + email, JSON.stringify(ex)], ['SADD', 'area:pendentes', slug + '|' + email]]);
        await notifica(redis, { titulo: 'Pedido de acesso', texto: nome + ' · ' + empresaNome, url: '/area/admin/#notificacoes' });
        return res.json({ ok: true });
      }
      if (existe) return res.status(409).json({ ok: false, erro: 'Já existe um pedido com esse e-mail nessa empresa. Se esqueceu a senha, fale com a Unique.' });
      const sal = crypto.randomBytes(16).toString('hex');
      const u = { email, nome, whatsapp, slug, empresaNome, papel: 'usuario', status: 'pendente', sal, hash: hashSenha(senha, sal), criado: new Date().toISOString() };
      await redis([
        ['SET', 'area:user:' + slug + ':' + email, JSON.stringify(u)],
        ['SADD', 'area:users:' + slug, email],
        ['SADD', 'area:pendentes', slug + '|' + email]
      ]);
      await notifica(redis, { titulo: 'Pedido de acesso', texto: nome + ' · ' + empresaNome, url: '/area/admin/#notificacoes' });
      return res.json({ ok: true });
    }

    if (b.a === 'entrar') {
      const slug = slugify(b.empresa), email = limpo(b.email, 120).toLowerCase(), senha = String(b.senha || '');
      if (await limite('login:' + ip, 20, 900) || await limite('login:' + slug + ':' + email, 8, 900))
        return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Espere 15 minutos.' });
      const [v] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
      const u = json(v);
      const errado = { ok: false, erro: 'Empresa, e-mail ou senha incorretos.' };
      if (!u || !u.hash) { hashSenha(senha, 'x'); return res.status(401).json(errado); }
      if (!igual(hashSenha(senha, u.sal), u.hash)) return res.status(401).json(errado);
      if (u.status === 'pendente') return res.status(403).json({ ok: false, erro: 'Seu acesso ainda está em análise. Você recebe a liberação da Unique em breve.' });
      if (u.status !== 'ativo') return res.status(403).json({ ok: false, erro: 'Acesso não liberado. Fale com a Unique.' });
      u.ultimo = new Date().toISOString();
      await redis([['SET', 'area:user:' + slug + ':' + email, JSON.stringify(u)]]);
      await abreSessao(res, { slug, email, nome: u.nome });
      return res.json({ ok: true });
    }

    if (b.a === 'convite-senha') {
      const t = String(b.t || ''), senha = String(b.senha || '');
      if (!/^[a-f0-9]{40}$/.test(t)) return res.status(404).json({ ok: false, erro: 'Link inválido.' });
      if (await limite('conv:' + ip, 10, 900)) return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Espere 15 minutos.' });
      if (senha.length < 8) return res.status(400).json({ ok: false, erro: 'A senha precisa ter pelo menos 8 caracteres.' });
      const [c] = await redis([['GET', 'area:convite:' + t]]);
      const cv = json(c);
      if (!cv) return res.status(404).json({ ok: false, erro: 'Link expirado ou já usado. Peça um novo para a Unique.' });
      const [uv] = await redis([['GET', 'area:user:' + cv.slug + ':' + cv.email]]);
      const u = json(uv);
      if (!u) return res.status(404).json({ ok: false });
      u.sal = crypto.randomBytes(16).toString('hex'); u.hash = hashSenha(senha, u.sal); u.status = 'ativo'; u.liberado = u.ultimo = new Date().toISOString();
      await redis([['SET', 'area:user:' + cv.slug + ':' + cv.email, JSON.stringify(u)], ['DEL', 'area:convite:' + t], ['SREM', 'area:pendentes', cv.slug + '|' + cv.email]]);
      await abreSessao(res, { slug: cv.slug, email: cv.email, nome: u.nome });
      await notifica(redis, { titulo: 'Cliente entrou na área', texto: u.nome + ' (' + (u.empresaNome || cv.slug) + ') criou a senha e acessou.', url: '/area/admin/#empresas/' + cv.slug });
      return res.json({ ok: true });
    }

    if (b.a === 'sair') {
      const s = await sessao(req);
      if (s) await redis([['DEL', 'area:sess:' + s.token]]);
      poeCookie(res, '', 0);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-entrar') {
      if (!ADMIN) return res.status(503).json({ ok: false, erro: 'Defina a variável AREA_ADMIN_SENHA (ou DIAG_SENHA) na Vercel.' });
      if (await limite('adm:' + ip, 8, 900)) return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Espere 15 minutos.' });
      if (!igual(String(b.senha || ''), ADMIN)) return res.status(401).json({ ok: false, erro: 'Senha incorreta.' });
      await abreSessao(res, { admin: true });
      return res.json({ ok: true });
    }

    const s = await sessao(req);
    if (!s) return res.status(401).json({ ok: false, erro: 'Entre na sua conta.' });

    // processa a fila de páginas com IA (uma por chamada; qualquer pessoa logada pode disparar)
    if (b.a === 'notion-ia') return res.json(await NOTION.processaIA(redis));
    // admin: pede a página com IA (Golden Circle + fluxograma) para uma ação, várias ou todas
    if (b.a === 'admin-acao-ia') {
      if (!s.admin) return res.status(403).json({ ok: false });
      const ents = [];
      const entrada = (slug, x) => x.notion ? idc(x.notion) : x.compartilhada || !slug ? 'm|' + x.id : 'a|' + slug + '|' + x.id;
      if (b.todas) {
        const [slugsDb, mH] = await redis([['SMEMBERS', 'area:emps'], ['HGETALL', 'area:modelos']]);
        const sl = Array.from(new Set((slugsDb || []).concat(Object.keys(CATALOGO))));
        const hs = sl.length ? await redis(sl.map(x => ['HGETALL', 'area:acoes:' + x])) : [];
        sl.forEach((x, i) => lerPares(hs[i]).forEach(([, v]) => { const a = json(v); if (a && a.status !== 'arquivado' && a.status !== 'cancelado' && (b.refazer || !a.nIA) && (a.detalhe || a.notion)) ents.push(entrada(x, a)); }));
        lerPares(mH).forEach(([, v]) => { const m = json(v); if (m && (b.refazer || !m.nIA) && m.detalhe) ents.push('m|' + m.id); });
      } else (Array.isArray(b.itens) ? b.itens : []).slice(0, 200).forEach(x => { if (x && x.id) ents.push(x.notion ? idc(x.notion) : x.modelo ? 'm|' + String(x.id).replace(/[^a-z0-9_-]/gi, '').slice(0, 60) : 'a|' + slugify(x.slug) + '|' + String(x.id).replace(/[^a-z0-9_-]/gi, '').slice(0, 60)); });
      const uniq = Array.from(new Set(ents));
      if (uniq.length) await redis([['SADD', 'area:ia:fila'].concat(uniq)]);
      const [n] = await redis([['SCARD', 'area:ia:fila']]);
      return res.json({ ok: true, adicionadas: uniq.length, fila: n || 0, chave: !!process.env.ANTHROPIC_API_KEY });
    }

    // Resultados: vitórias postadas pelo cliente (assinadas) ou pela Unique
    if (b.a === 'vitoria') {
      const slug = s.admin ? slugify(b.slug) : s.slug;
      if (!(await empresa(slug))) return res.status(404).json({ ok: false });
      const titulo = limpo(b.titulo, 160);
      if (titulo.length < 3) return res.status(400).json({ ok: false, erro: 'Conte a vitória num título curto.' });
      if (!s.admin && await limite('vit:' + s.email, 30, 3600)) return res.status(429).json({ ok: false, erro: 'Muitas vitórias seguidas. Espere um pouco.' });
      const id = novoId();
      let cargo = '';
      if (!s.admin) { const [uv] = await redis([['GET', 'area:user:' + slug + ':' + s.email]]); cargo = ((json(uv) || {}).crm || {}).cargo || ''; if (Array.isArray(cargo)) cargo = cargo.join(', '); }
      const v = { id, titulo, texto: limpo(b.texto, 3000), numero: limpo(b.numero, 40), acao: String(b.acao || '').slice(0, 60), autor: s.admin ? 'unique' : s.email, nome: s.admin ? 'Carlos · Unique' : (s.nome || s.email), cargo: limpo(cargo, 80), data: new Date().toISOString(), caso: '', foto: '' };
      const cmds = [];
      if (b.foto && /^data:image\/(jpeg|png|webp);base64,/.test(b.foto) && String(b.foto).length < 2400000) { v.foto = String(Date.now()); cmds.push(['SET', 'area:vitfoto:' + slug + ':' + id, b.foto]); }
      cmds.push(['HSET', 'area:vit:' + slug, id, JSON.stringify(v)]);
      await redis(cmds);
      if (!s.admin) await notifica(redis, { titulo: '🏆 Vitória de ' + v.nome, texto: titulo + (v.numero ? ' · ' + v.numero : ''), url: '/area/admin/#resultados' });
      return res.json({ ok: true, vitoria: v });
    }
    if (b.a === 'vitoria-del' || b.a === 'vitoria-case' || b.a === 'vitoria-case-resp') {
      const slug = s.admin ? slugify(b.slug) : s.slug;
      const v = await vitDe(slug, b.id);
      if (!v) return res.status(404).json({ ok: false });
      if (b.a === 'vitoria-del') {
        if (!s.admin && v.autor !== s.email) return res.status(403).json({ ok: false });
        await redis([['HDEL', 'area:vit:' + slug, v.id], ['DEL', 'area:vitfoto:' + slug + ':' + v.id, 'area:curt:' + slug + ':v:' + v.id, 'area:com:' + slug + ':v:' + v.id]]);
        return res.json({ ok: true });
      }
      if (b.a === 'vitoria-case') {
        if (!s.admin) return res.status(403).json({ ok: false });
        v.caso = 'pedido'; v.casoEm = new Date().toISOString();
      } else {
        // quem autoriza: quem escreveu ou um ADM da empresa
        if (s.admin) return res.status(403).json({ ok: false, erro: 'Quem autoriza é o cliente.' });
        if (v.autor !== s.email && (await papelSessao(s)) !== 'adm') return res.status(403).json({ ok: false, erro: 'Só quem escreveu ou um ADM da empresa autoriza.' });
        v.caso = b.autoriza ? 'autorizado' : 'recusado'; v.casoPor = s.nome || s.email; v.casoEm = new Date().toISOString();
        await notifica(redis, { titulo: b.autoriza ? 'Case autorizado ✓' : 'Case não autorizado', texto: v.titulo + ' · ' + v.casoPor, url: '/area/admin/#resultados' });
      }
      await redis([['HSET', 'area:vit:' + slug, v.id, JSON.stringify(v)]]);
      return res.json({ ok: true, vitoria: v });
    }

    // bloco de anotações do cliente em cada tarefa (fica no painel; a Unique vê no admin)
    if (b.a === 'acao-nota') {
      const slug = s.admin ? slugify(b.slug) : s.slug;
      const id = String(b.id || '').slice(0, 40);
      if (!slug || !/^[a-z0-9_-]{3,40}$/i.test(id)) return res.status(400).json({ ok: false });
      if (!s.admin) { const av = await acaoDe(slug, id); if (!av || !podeVer(await papelSessao(s), av, s.email)) return res.status(404).json({ ok: false }); }
      const texto = String(b.texto || '').slice(0, 8000);
      const nota = { texto, por: s.admin ? 'Unique' : (s.nome || s.email), em: new Date().toISOString() };
      await redis([texto.trim() ? ['HSET', 'area:anot:' + slug, id, JSON.stringify(nota)] : ['HDEL', 'area:anot:' + slug, id]]);
      return res.json({ ok: true, nota: texto.trim() ? nota : null });
    }

    if (b.a === 'acao-status') {
      const slug = s.admin ? slugify(b.slug) : s.slug;
      if (!s.admin) { const av = await acaoDe(slug, String(b.id || '')); if (!av || !podeVer(await papelSessao(s), av, s.email)) return res.status(404).json({ ok: false }); }
      if (b.status !== undefined && STATUS_ACAO.indexOf(b.status) < 0) return res.status(400).json({ ok: false });
      const TIPOS_ACAO = ['acao', 'post', 'video', 'reuniao', 'material', 'tecnica', 'isca'];
      const extra = o => { if (b.dono === 'unique' || b.dono === 'cliente' || b.dono === 'ambos') o.dono = b.dono; if (TIPOS_ACAO.indexOf(b.tipo) >= 0) o.tipo = b.tipo; if (b.pessoa !== undefined) { o.pessoa = EMAIL_RE.test(b.pessoa || '') ? String(b.pessoa).toLowerCase().slice(0, 120) : ''; o.responsaveis = o.pessoa ? [o.pessoa] : []; }
        if (s.admin && b.responsaveis !== undefined) { o.responsaveis = listaPessoas(b.responsaveis, true); o.pessoa = o.responsaveis.filter(x => x !== 'unique')[0] || ''; }
        if (s.admin && b.observadores !== undefined) o.observadores = listaPessoas(b.observadores, false);
        if (s.admin && b.inicio !== undefined) o.inicio = /^\d{4}-\d{2}-\d{2}/.test(b.inicio || '') ? String(b.inicio).slice(0, 10) : '';
        return o; };
      const [v, mv] = await redis([['HGET', 'area:acoes:' + slug, String(b.id || '')], ['HGET', 'area:modelos', String(b.id || '')]]);
      const a = json(v), m = json(mv);
      if (!a && valePara(m, slug)) {
        const [ov] = await redis([['HGET', 'area:mst:' + slug, m.id]]);
        const st = extra(Object.assign(json(ov) || {}, { atualizado: new Date().toISOString(), por: s.admin ? 'Unique' : s.nome }));
        if (b.status) st.status = b.status; else if (!st.status) st.status = 'a_fazer';
        if (s.admin && b.prazo !== undefined) st.prazo = /^\d{4}-\d{2}-\d{2}$/.test(b.prazo) ? b.prazo : '';
        await redis([['HSET', 'area:mst:' + slug, m.id, JSON.stringify(st)]]);
        if (!s.admin && b.status === 'feito') await notifica(redis, { titulo: 'Ação concluída', texto: s.nome + ' marcou como feita: ' + m.titulo, url: '/area/admin/#empresas/' + slug });
        return res.json({ ok: true, acao: Object.assign({}, m, st, { compartilhada: true }) });
      }
      if (!a) return res.status(404).json({ ok: false });
      if (s.admin && b.prazo !== undefined) a.prazo = /^\d{4}-\d{2}-\d{2}$/.test(b.prazo) ? b.prazo : '';
      if (b.status) a.status = b.status;
      extra(a);
      a.atualizado = new Date().toISOString();
      a.por = s.admin ? 'Unique' : s.nome;
      await redis([['HSET', 'area:acoes:' + slug, a.id, JSON.stringify(a)]]);
      if (!s.admin && b.status === 'feito') await notifica(redis, { titulo: 'Ação concluída', texto: s.nome + ' marcou como feita: ' + a.titulo, url: '/area/admin/#empresas/' + slug });
      await NOTION.envia(redis, 'acao', slug, a.id);
      return res.json({ ok: true, acao: a });
    }

    // marcar leitura como lida (a própria pessoa ou o admin)
    if (b.a === 'leitura-lido') {
      const slug = s.admin ? slugify(b.slug) : s.slug;
      const [v] = await redis([['HGET', 'area:leit:' + slug, String(b.id || '')]]);
      const l = json(v);
      if (!l || (!s.admin && l.pessoa !== s.email && l.pessoa !== '*')) return res.status(404).json({ ok: false });
      if (l.pessoa === '*') {
        const quem = s.admin ? limpo(b.email, 120).toLowerCase() : s.email;
        if (!quem) return res.status(400).json({ ok: false });
        l.lidoPor = l.lidoPor || {};
        if (b.lido) l.lidoPor[quem] = new Date().toISOString(); else delete l.lidoPor[quem];
      } else l.lido = b.lido ? new Date().toISOString() : '';
      await redis([['HSET', 'area:leit:' + slug, l.id, JSON.stringify(l)]]);
      if (!s.admin && l.lido) await notifica(redis, { titulo: 'Leitura concluída', texto: s.nome + ' leu: ' + l.titulo, url: '/area/admin/#contatos/' + encodeURIComponent(slug + '|' + s.email) });
      return res.json({ ok: true, leitura: l.pessoa === '*' ? Object.assign({}, l, { lido: (l.lidoPor || {})[s.admin ? limpo(b.email, 120).toLowerCase() : s.email] || '' }) : l });
    }

    if (b.a === 'curtir' || b.a === 'comentar' || b.a === 'comentar-del' || b.a === 'publico') {
      const slug = s.admin ? slugify(b.slug) : s.slug, ehAcao = b.t === 'acao', ehVit = b.t === 'vit';
      if (ehVit && b.a === 'publico') return res.status(400).json({ ok: false });
      if (!membro(s, slugify(b.slug)) || !(ehAcao || ehVit ? ACAO_ID : ID_OK).test(String(b.id || ''))) return res.status(403).json({ ok: false });
      const it = ehAcao ? await acaoDe(slug, String(b.id)) : ehVit ? await vitDe(slug, b.id) : await itemPorId(slug, String(b.id));
      if (!it || !podeVer(await papelSessao(s), it, s.email)) return res.status(404).json({ ok: false });
      const id = it.id;
      const quem = s.admin ? 'unique' : s.email;
      const k = slug + ':' + (ehAcao ? 'a:' : ehVit ? 'v:' : '') + id;
      const kc = 'area:curt:' + k, kl = 'area:com:' + k;
      if (ehAcao && b.a === 'publico') {
        const [tok] = await redis([['HGET', 'area:acpub:' + slug, id]]);
        if (b.publico) {
          const t = tok || crypto.randomBytes(12).toString('hex');
          await redis([['SET', 'area:acpubt:' + t, JSON.stringify({ slug, id, por: s.admin ? 'Unique' : (s.nome || s.email), em: new Date().toISOString() })], ['HSET', 'area:acpub:' + slug, id, t]]);
          return res.json({ ok: true, publico: true, url: urlAcaoPublica(t) });
        }
        if (tok) await redis([['DEL', 'area:acpubt:' + tok], ['HDEL', 'area:acpub:' + slug, id]]);
        return res.json({ ok: true, publico: false, url: SITE + '/area/painel/#tarefa-' + id });
      }

      if (b.a === 'curtir') {
        const [tem] = await redis([['SISMEMBER', kc, quem]]);
        const [, n] = await redis([[tem ? 'SREM' : 'SADD', kc, quem], ['SCARD', kc]]);
        return res.json({ ok: true, curti: !tem, curtidas: n });
      }
      if (b.a === 'comentar') {
        const texto = limpo(b.texto, 2000);
        if (!texto) return res.status(400).json({ ok: false, erro: 'Escreva o comentário.' });
        if (await limite('com:' + quem, 40, 3600)) return res.status(429).json({ ok: false, erro: 'Muitos comentários seguidos. Espere um pouco.' });
        const c = { cid: novoId(), nome: s.admin ? 'Carlos · Unique' : s.nome, email: s.admin ? '' : s.email, unique: !!s.admin, texto, data: new Date().toISOString() };
        await redis([['LPUSH', kl, JSON.stringify(c)], ['LTRIM', kl, 0, 499],
          ['LPUSH', 'area:avisos', JSON.stringify({ slug, id, acao: ehAcao, titulo: it.titulo, nome: c.nome, texto: texto.slice(0, 200), data: c.data, unique: c.unique })], ['LTRIM', 'area:avisos', 0, 99]]);
        if (!s.admin) await notifica(redis, { titulo: 'Comentário de ' + c.nome, texto: it.titulo + ': ' + texto.slice(0, 120), url: '/area/admin/#notificacoes' });
        return res.json({ ok: true });
      }
      if (b.a === 'comentar-del') {
        const [lst] = await redis([['LRANGE', kl, 0, 499]]);
        const raw = (lst || []).find(x => { const c = json(x); return c && c.cid === b.cid; });
        const c = json(raw);
        if (!c) return res.status(404).json({ ok: false });
        if (!s.admin && c.email !== s.email) return res.status(403).json({ ok: false });
        await redis([['LREM', kl, 1, raw]]);
        return res.json({ ok: true });
      }
      if (b.a === 'publico') {
        const pasta = pastaDe(slug, it);
        if (!pasta) return res.status(400).json({ ok: false, erro: 'Só páginas do site podem ficar públicas.' });
        await redis([b.publico ? ['HSET', 'area:publico:' + slug, pasta, '1'] : ['HDEL', 'area:publico:' + slug, pasta]]);
        return res.json({ ok: true, publico: !!b.publico });
      }
    }

    // ---------- daqui para baixo só o Carlos ----------
    if (!s.admin) return res.status(403).json({ ok: false });
    const slug = slugify(b.slug);

    // conexão oficial com a Meta (o Carlos cola as credenciais; nada disso volta para a tela)
    if (b.a === 'admin-meta-conecta') return res.json(await require('./_area/meta.js').conecta(redis, b));
    if (b.a === 'admin-meta-sair') { await redis([['DEL', 'area:meta']]); return res.json({ ok: true }); }

    if (b.a === 'admin-notion-aplicar') {
      try { return res.json(await NOTION.aplica(redis, CATALOGO)); } catch (e) { return res.json({ ok: false, erro: 'Notion: ' + e.message }); }
    }
    if (b.a === 'admin-notion-puxar') {
      try { return res.json(await NOTION.puxa(redis, { tudo: !!b.tudo })); } catch (e) { await redis([['SET', 'area:notion:erro', String(e.message).slice(0, 300), 'EX', 86400]]); return res.json({ ok: false, erro: 'Notion: ' + e.message }); }
    }

    if (b.a === 'admin-empresa') {
      const nome = limpo(b.nome, 80), sl = slugify(nome);
      if (sl.length < 2) return res.status(400).json({ ok: false, erro: 'Nome inválido.' });
      await redis([['SET', 'area:emp:' + sl, JSON.stringify({ slug: sl, nome, criado: new Date().toISOString() }), 'NX'], ['SADD', 'area:emps', sl]]);
      await NOTION.envia(redis, 'emp', sl);
      return res.json({ ok: true, slug: sl });
    }

    if (b.a === 'admin-chat') {
      try { return res.json(await CHAT().turno(String(b.conv || ''), String(b.texto || ''), Array.isArray(b.anexos) ? b.anexos : [])); }
      catch (e) { return res.json({ ok: false, erro: String(e.message || e).slice(0, 300) }); }
    }
    if (b.a === 'admin-chat-decide') {
      // executa o cartão confirmado chamando a própria rota do admin (mesmas validações e mesma ida para o Notion)
      const chama = async corpoInterno => {
        let saida = null;
        const falsa = { statusCode: 200, setHeader() { return this; }, status(c) { this.statusCode = c; return this; }, json(o) { saida = o; return this; }, end() { return this; } };
        await module.exports({ method: 'POST', headers: req.headers, query: {}, body: corpoInterno }, falsa);
        return saida || { ok: false };
      };
      return res.json(await CHAT().decide(String(b.id || '').replace(/[^a-f0-9]/g, ''), !!b.ok, chama));
    }
    if (b.a === 'admin-canivete' || b.a === 'admin-canivete-lote' || b.a === 'admin-canivete-del' || b.a === 'admin-canivete-libera') {
      if (b.a === 'admin-canivete-lote') {
        const novos = CANIVETE.lote(b.texto).map(i => Object.assign(i, { destino: b.destino === 'todos' ? 'todos' : [] }));
        if (!novos.length) return res.status(400).json({ ok: false, erro: 'Cole ao menos um link, um por linha.' });
        await redis(novos.map(i => ['HSET', 'area:canivete', i.id, JSON.stringify(i)]));
        return res.json({ ok: true, novos });
      }
      const [v] = b.id ? await redis([['HGET', 'area:canivete', String(b.id)]]) : [null];
      const velho = json(v);
      if (b.a === 'admin-canivete-del') { await redis([['HDEL', 'area:canivete', String(b.id || '')]]); return res.json({ ok: true }); }
      if (b.a === 'admin-canivete-libera') {
        if (!velho) return res.status(404).json({ ok: false });
        velho.destino = b.destino === 'todos' ? 'todos' : (Array.isArray(b.destino) ? b.destino.map(slugify).filter(x => x.length >= 2) : []);
        await redis([['HSET', 'area:canivete', velho.id, JSON.stringify(velho)]]);
        return res.json({ ok: true, item: velho });
      }
      const it = CANIVETE.limpa(Object.assign({}, velho || {}, b.item || {}, { id: (velho || {}).id || (b.item || {}).id, origem: (velho || {}).origem, criado: (velho || {}).criado }));
      if (!it.titulo || (!it.link)) return res.status(400).json({ ok: false, erro: 'Informe o título e o link.' });
      await redis([['HSET', 'area:canivete', it.id, JSON.stringify(it)]]);
      return res.json({ ok: true, item: it });
    }
    if (b.a === 'admin-arq-oculto') {
      const id = String(b.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      if (!id) return res.status(400).json({ ok: false });
      await redis([[b.oculto ? 'SADD' : 'SREM', 'area:arq-oculto:' + slug, id]]);
      return res.json({ ok: true });
    }
    if (b.a === 'admin-arq-fixa') {
      if (b.tira) { await redis([['HDEL', 'area:arq-fix:' + slug, String(b.id || '')]]); return res.json({ ok: true }); }
      let link = limpo(b.link, 600); if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
      if (!/^https:\/\/[^\s"<>]+$/i.test(link)) return res.status(400).json({ ok: false, erro: 'Cole um link válido (https://…).' });
      const id = 'fx' + novoId();
      const nome = limpo(b.nome, 160) || link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60);
      await redis([['HSET', 'area:arq-fix:' + slug, id, JSON.stringify({ nome, link, data: new Date().toISOString(), tipo: 'link', por: 'Carlos · Unique' })]]);
      return res.json({ ok: true, id });
    }
    if (b.a === 'admin-papel') {
      const email = limpo(b.email, 120).toLowerCase();
      if (PAPEIS.indexOf(b.papel) < 0) return res.status(400).json({ ok: false });
      const [v] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
      const u = json(v);
      if (!u) return res.status(404).json({ ok: false });
      u.papel = b.papel;
      await redis([['SET', 'area:user:' + slug + ':' + email, JSON.stringify(u)]]);
      return res.json({ ok: true, pessoa: usuarioPublico(u) });
    }
    if (b.a === 'admin-usuario') {
      const email = limpo(b.email, 120).toLowerCase();
      if (STATUS_USER.indexOf(b.status) < 0) return res.status(400).json({ ok: false });
      const [v] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
      const u = json(v);
      if (!u) return res.status(404).json({ ok: false });
      u.status = b.status;
      const cmds = [['SET', 'area:user:' + slug + ':' + email, JSON.stringify(u)]];
      cmds.push(b.status === 'pendente' ? ['SADD', 'area:pendentes', slug + '|' + email] : ['SREM', 'area:pendentes', slug + '|' + email]);
      if (b.status === 'ativo') {
        cmds.push(['SET', 'area:emp:' + slug, JSON.stringify({ slug, nome: (CATALOGO[slug] || {}).nome || u.empresaNome || slug, criado: new Date().toISOString() }), 'NX']);
        cmds.push(['SADD', 'area:emps', slug]);
      }
      await redis(cmds);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-senha') {
      const email = limpo(b.email, 120).toLowerCase(), senha = String(b.senha || '');
      if (senha.length < 8) return res.status(400).json({ ok: false, erro: 'A senha precisa ter pelo menos 8 caracteres.' });
      const [v] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
      const u = json(v);
      if (!u) return res.status(404).json({ ok: false });
      u.sal = crypto.randomBytes(16).toString('hex');
      u.hash = hashSenha(senha, u.sal);
      await redis([['SET', 'area:user:' + slug + ':' + email, JSON.stringify(u)]]);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-push' || b.a === 'admin-push-sair' || b.a === 'admin-push-teste') {
      if (b.a === 'admin-push-teste') { await notifica(redis, { titulo: 'Notificações ligadas', texto: 'Tudo certo: você vai receber os avisos da Unique aqui.', url: '/area/admin/' }); return res.json({ ok: true }); }
      const ep = String(b.a === 'admin-push' ? ((b.sub || {}).endpoint || '') : (b.endpoint || ''));
      if (!/^https:\/\/[^\s]{10,800}$/.test(ep)) return res.status(400).json({ ok: false });
      await redis([b.a === 'admin-push' ? ['HSET', 'area:push', ep, JSON.stringify({ criado: new Date().toISOString(), ua: limpo(req.headers['user-agent'], 160) })] : ['HDEL', 'area:push', ep]]);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-notif-lido') {
      if (b.todos) {
        const [l] = await redis([['LRANGE', 'area:notif', 0, 199]]);
        const ids = (l || []).map(json).filter(Boolean).map(n => n.id);
        if (ids.length) await redis(ids.map(id => ['SADD', 'area:notif-lidos', id]));
      } else await redis([['SADD', 'area:notif-lidos', limpo(b.id, 40)]]);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-lido' || b.a === 'admin-lido-todos') {
      if (b.a === 'admin-lido') await redis([[b.lido === false ? 'SREM' : 'SADD', 'area:lidos', limpo(b.k, 120)]]);
      else {
        const [av] = await redis([['LRANGE', 'area:avisos', 0, 99]]);
        const ks = (av || []).map(json).filter(Boolean).map(a => (a.slug + '|' + a.id + '|' + a.data).slice(0, 120));
        if (ks.length) await redis(ks.map(k => ['SADD', 'area:lidos', k]));
      }
      return res.json({ ok: true });
    }

    if (b.a === 'admin-proposta') {
      const P = b.proposta || {};
      const agora = new Date().toISOString();
      let sl = slugify(b.slug);
      let novo = false;
      if (!sl) {
        const c = b.contato || {};
        const nomeEmp = limpo(c.empresa, 80), email = limpo(c.email, 120).toLowerCase();
        sl = slugify(nomeEmp);
        if (sl.length < 2) return res.status(400).json({ ok: false, erro: 'Informe a empresa (ou escolha uma já cadastrada).' });
        const [ev] = await redis([['GET', 'area:emp:' + sl]]);
        const cmds = [['SADD', 'area:emps', sl]];
        if (!json(ev) && !CATALOGO[sl]) { novo = true; cmds.push(['SET', 'area:emp:' + sl, JSON.stringify({ slug: sl, nome: nomeEmp, criado: agora, etapa: 'qualificado', tags: [], origem: 'proposta' })]); }
        if (emailOk(email)) {
          cmds.push(['SET', 'area:user:' + sl + ':' + email, JSON.stringify({ email, nome: limpo(c.nome, 80) || email, whatsapp: limpo(c.whatsapp, 30), slug: sl, empresaNome: nomeEmp, status: 'convite', criado: agora, origem: 'proposta' }), 'NX']);
          cmds.push(['SADD', 'area:users:' + sl, email]);
        }
        await redis(cmds);
      }
      const [ev2] = await redis([['GET', 'area:emp:' + sl]]);
      const e = json(ev2) || { slug: sl, nome: (CATALOGO[sl] || {}).nome || sl, criado: agora };
      // quem recebe proposta é, no mínimo, lead qualificado
      if (!e.etapa || e.etapa === 'lead') { e.etapa = 'qualificado'; await redis([['SET', 'area:emp:' + sl, JSON.stringify(e)], ['SADD', 'area:emps', sl]]); }
      const itens = (Array.isArray(P.itens) ? P.itens : []).slice(0, 30).map(i => ({ descricao: limpo(i && i.descricao, 300), valor: Math.max(0, Math.round((+String((i && i.valor) || 0).replace(',', '.') || 0) * 100) / 100) })).filter(i => i.descricao);
      const lista = v => (Array.isArray(v) ? v : String(v || '').split('\n')).map(x => limpo(x, 400)).filter(Boolean).slice(0, 30);
      const [pv] = P.id ? await redis([['HGET', 'area:propostas', String(P.id)]]) : [null];
      const velha = json(pv) || {};
      const prop = {
        id: velha.id || novoId(),
        token: velha.token || crypto.randomBytes(12).toString('hex'),
        criado: velha.criado || agora,
        atualizado: agora,
        slug: sl,
        empresa: e.nome,
        contato: limpo(P.contato, 80) || velha.contato || limpo((b.contato || {}).nome, 80),
        titulo: limpo(P.titulo, 140) || 'Proposta comercial',
        servico: TAGS.indexOf(P.servico) >= 0 ? P.servico : '',
        contexto: limpo(P.contexto, 3000),
        objetivos: lista(P.objetivos),
        escopo: lista(P.escopo),
        etapas: lista(P.etapas),
        itens,
        total: Math.round(itens.reduce((t, i) => t + i.valor, 0) * 100) / 100,
        pagamento: limpo(P.pagamento, 1000),
        validade: /^\d{4}-\d{2}-\d{2}$/.test(P.validade || '') ? P.validade : '',
        observacoes: limpo(P.observacoes, 2000),
        notas: limpo(P.notas, 2000),
        status: ['rascunho', 'enviada', 'aceita', 'recusada'].indexOf(P.status) >= 0 ? P.status : (velha.status || 'rascunho'),
        vista: velha.vista || ''
      };
      const cmds = [['HSET', 'area:propostas', prop.id, JSON.stringify(prop)], ['SET', 'area:prop:' + prop.token, prop.id]];
      // fica também na área do cliente, como entrega
      cmds.push(['HSET', 'area:itens:' + sl, 'pr' + prop.id, JSON.stringify({ id: 'pr' + prop.id, tipo: 'pagina', titulo: prop.titulo, descricao: 'Proposta comercial da Unique para a ' + e.nome + '.', url: '/proposta/?p=' + prop.token, publicado: prop.status !== 'rascunho', criado: prop.criado })]);
      if (prop.status === 'aceita' && e.etapa !== 'cliente' && e.etapa !== 'finalizado') { e.etapa = 'cliente'; cmds.push(['SET', 'area:emp:' + sl, JSON.stringify(e)]); }
      await redis(cmds);
      return res.json({ ok: true, proposta: prop, novo, url: SITE + '/proposta/?p=' + prop.token });
    }
    if (b.a === 'admin-proposta-del') {
      const [pv] = await redis([['HGET', 'area:propostas', String(b.id || '')]]);
      const p = json(pv);
      if (p) await redis([['HDEL', 'area:propostas', p.id], ['DEL', 'area:prop:' + p.token], ['HDEL', 'area:itens:' + p.slug, 'pr' + p.id]]);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-contrato-modelo') {
      const cmds = [];
      if (b.modelo != null) cmds.push(String(b.modelo).trim() ? ['SET', 'area:contrato:modelo', RICO.limpa(String(b.modelo).slice(0, 60000))] : ['DEL', 'area:contrato:modelo']);
      if (b.unique) { const u = {}; Object.keys(CONTRATO.UNIQUE_PADRAO).forEach(k => { u[k] = limpo(b.unique[k], 200); }); cmds.push(['SET', 'area:contrato:unique', JSON.stringify(u)]); }
      if (cmds.length) await redis(cmds);
      return res.json({ ok: true });
    }
    if (b.a === 'admin-contrato-gerar') {
      const [pv] = await redis([['HGET', 'area:propostas', String(b.proposta || '')]]);
      const prop = json(pv);
      if (!prop) return res.status(404).json({ ok: false, erro: 'Proposta não encontrada.' });
      const [h] = await redis([['HGETALL', 'area:contratos']]);
      const ja = lerPares(h).map(([, v]) => json(v)).filter(c => c && c.proposta === prop.id && c.status !== 'cancelado')[0];
      if (ja && !b.refazer) return res.json({ ok: true, contrato: ja, existia: true });
      const [ev, m, u] = await redis([['GET', 'area:emp:' + prop.slug], ['GET', 'area:contrato:modelo'], ['GET', 'area:contrato:unique']]);
      const e = json(ev) || { nome: prop.empresa, dados: {} };
      const ems = (await pessoasDe(prop.slug)).map(x => x.email);
      const em = emailOk(String(b.email || '').toLowerCase()) ? String(b.email).toLowerCase() : (ems[0] || '');
      const [pu] = em ? await redis([['GET', 'area:user:' + prop.slug + ':' + em]]) : [null];
      const pessoa = json(pu);
      const agora = new Date().toISOString();
      const c = ja && b.refazer ? ja : { id: novoId(), token: crypto.randomBytes(12).toString('hex'), criado: agora, status: 'rascunho', assinaturas: {} };
      Object.assign(c, { atualizado: agora, proposta: prop.id, slug: prop.slug, empresa: prop.empresa, titulo: 'Contrato · ' + (prop.servico || prop.titulo), total: prop.total, signatario: prop.contato || (pessoa && pessoa.nome) || '', email: em,
        html: CONTRATO.preenche(m || CONTRATO.MODELO_PADRAO, CONTRATO.variaveis(prop, e, pessoa, json(u))) });
      await salvaContrato(c);
      return res.json({ ok: true, contrato: c });
    }
    if (b.a === 'admin-contrato') {
      const [cv] = await redis([['HGET', 'area:contratos', String(b.id || '')]]);
      const c = json(cv);
      if (!c) return res.status(404).json({ ok: false });
      if (b.html != null) c.html = RICO.limpa(String(b.html).slice(0, 80000));
      if (b.titulo != null) c.titulo = limpo(b.titulo, 140) || c.titulo;
      if (b.signatario != null) c.signatario = limpo(b.signatario, 80);
      if (b.notas != null) c.notas = limpo(b.notas, 2000);
      if (['rascunho', 'enviado', 'cancelado'].indexOf(b.status) >= 0 && ['assinado-cliente', 'assinado'].indexOf(c.status) < 0) c.status = b.status;
      if (b.status === 'cancelado') c.status = 'cancelado';
      if (b.tirar && c.assinaturas && c.assinaturas[b.tirar]) { delete c.assinaturas[b.tirar]; c.status = c.assinaturas.cliente ? 'assinado-cliente' : 'enviado'; }
      c.atualizado = new Date().toISOString();
      await salvaContrato(c);
      return res.json({ ok: true, contrato: c, url: SITE + '/contrato/?c=' + c.token });
    }
    if (b.a === 'admin-contrato-del') {
      const [cv] = await redis([['HGET', 'area:contratos', String(b.id || '')]]);
      const c = json(cv);
      if (c) await redis([['HDEL', 'area:contratos', c.id], ['DEL', 'area:ctr:' + c.token], ['HDEL', 'area:itens:' + c.slug, 'ct' + c.id]]);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-modelo') {
      const m = limpaAcao(b.modelo || {});
      if (!m.titulo) return res.status(400).json({ ok: false, erro: 'Dê um título para a ação.' });
      const d = (b.modelo || {}).destino;
      m.destino = d === 'todos' ? 'todos' : (Array.isArray(d) ? Array.from(new Set(d.map(slugify).filter(x => x.length >= 2))).slice(0, 300) : []);
      delete m.status;
      const cmds = [['HSET', 'area:modelos', m.id, JSON.stringify(m)]];
      // virou compartilhada a partir de uma ação de um cliente: leva o andamento e apaga a original
      const o = b.origem || {};
      if (o.slug && o.id) {
        const os = slugify(o.slug), oid = String(o.id);
        const [ov] = await redis([['HGET', 'area:acoes:' + os, oid]]);
        const oa = json(ov);
        if (oa) {
          cmds.push(['HDEL', 'area:acoes:' + os, oid]);
          cmds.push(['HSET', 'area:mst:' + os, m.id, JSON.stringify({ status: oa.status, atualizado: oa.atualizado || oa.criado, por: oa.por || '' })]);
        }
      }
      await redis(cmds);
      const gg = b.google || {};
      const gEmails = (Array.isArray(gg.emails) ? gg.emails : []).map(e => String(e).trim().toLowerCase()).filter(emailOk).slice(0, 30);
      const ev = await GOOGLE.sincroniza(redis, m, { emails: gEmails, convidar: !!gg.convidar && gEmails.length > 0, meet: !!gg.meet }); // leva para o Google Agenda (se estiver conectado)
      return res.json({ ok: true, modelo: m, google: ev ? { link: ev.htmlLink, meet: ev.hangoutLink || '' } : null });
    }
    if (b.a === 'admin-modelo-del') {
      await GOOGLE.sincroniza(redis, { id: String(b.id || '') }, 'apagar');
      await redis([['HDEL', 'area:modelos', String(b.id || '')]]);
      return res.json({ ok: true });
    }

    if (!(await empresa(slug))) return res.status(404).json({ ok: false, erro: 'Empresa não encontrada.' });

    if (b.a === 'admin-crm') {
      const [ev] = await redis([['GET', 'area:emp:' + slug]]);
      const e = json(ev) || { slug, nome: (CATALOGO[slug] || {}).nome || slug, criado: new Date().toISOString() };
      if (b.etapa !== undefined) { if (ETAPAS.indexOf(b.etapa) < 0) return res.status(400).json({ ok: false }); e.etapa = b.etapa; }
      if (Array.isArray(b.tags)) e.tags = b.tags.filter(t => TAGS.indexOf(t) >= 0);
      e.atualizado = new Date().toISOString();
      await redis([['SET', 'area:emp:' + slug, JSON.stringify(e)], ['SADD', 'area:emps', slug]]);
      if (b.etapa !== undefined) await NOTION.envia(redis, 'etapa', slug);
      return res.json({ ok: true, etapa: e.etapa, tags: e.tags || [] });
    }

    if (b.a === 'admin-pessoa') {
      const email = limpo(b.email, 120).toLowerCase(), nome = limpo(b.nome, 80);
      if (!nome || !emailOk(email)) return res.status(400).json({ ok: false, erro: 'Informe nome e um e-mail válido.' });
      const e = await empresa(slug);
      const [ok] = await redis([['SET', 'area:user:' + slug + ':' + email, JSON.stringify({ email, nome, whatsapp: limpo(b.whatsapp, 30), slug, empresaNome: e.nome, papel: PAPEIS.indexOf(b.papel) >= 0 ? b.papel : 'usuario', status: 'convite', criado: new Date().toISOString(), origem: 'admin', crm: CAMPOS.limpa(CAMPOS.pessoa, b.dados) }), 'NX'], ['SADD', 'area:users:' + slug, email]]);
      if (!ok) return res.status(409).json({ ok: false, erro: 'Essa pessoa já está vinculada à empresa.' });
      await NOTION.envia(redis, 'pessoa', slug, email);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-dados') {
      const [ev] = await redis([['GET', 'area:emp:' + slug]]);
      const e = json(ev) || { slug, nome: (CATALOGO[slug] || {}).nome || slug, criado: new Date().toISOString() };
      const d = CAMPOS.limpa(CAMPOS.empresa, b.dados);
      if (d.__erros) return res.status(400).json({ ok: false, erro: d.__erros.join(' ') });
      e.dados = d;
      e.editado = new Date().toISOString();
      if (!e.num) { const [n] = await redis([['INCR', 'area:seq:emp']]); e.num = n; }
      const nome = limpo(b.nome, 80);
      if (nome) e.nome = nome;
      await redis([['SET', 'area:emp:' + slug, JSON.stringify(e)], ['SADD', 'area:emps', slug]]);
      await NOTION.envia(redis, 'emp', slug);
      return res.json({ ok: true, dados: d, nome: e.nome, num: e.num });
    }

    // conexão oficial com a Meta (o Carlos cola as credenciais; nada disso volta para a tela)
    // lista de leitura: posts do blog delegados a uma pessoa
    if (b.a === 'admin-leitura') {
      const email = b.email === '*' ? '*' : limpo(b.email, 120).toLowerCase();
      const posts = (Array.isArray(b.posts) ? b.posts : []).slice(0, 40);
      if ((email !== '*' && !emailOk(email)) || !posts.length) return res.status(400).json({ ok: false, erro: 'Escolha ao menos um post ou material.' });
      const [lH] = await redis([['HGETALL', 'area:leit:' + slug]]);
      const ja = {}; lerPares(lH).forEach(([, v]) => { const l = json(v); if (l) ja[l.pessoa + '|' + l.post] = 1; });
      const cmds = [], novos = [];
      posts.forEach(p => {
        // post do blog ou material (isca, aula, palestra, ferramenta do site): o material abre sem cadastro para quem está logado
        const mat = p.mat ? String(p.mat).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80) : '';
        const cv = p.cv ? String(p.cv).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80) : '';
        const post = mat ? 'mat-' + mat : cv ? 'cv-' + cv : String(p.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 120);
        if (!post || ja[email + '|' + post]) return;
        const url = mat ? (/^\/[a-z0-9\/_#?=&.-]*$/i.test(p.url || '') ? p.url : '/' + mat + '/') : cv ? (/^(https:\/\/[^\s"<>]+|\/[^\s"<>]*)$/i.test(p.url || '') ? p.url : '') : '/blog/#' + post;
        if (!url) return;
        const l = { id: novoId(), post, tipo: mat || cv ? 'material' : 'post', titulo: limpo(String(p.titulo || '').replace(/==/g, ''), 200), url, pessoa: email, criado: new Date().toISOString(), lido: '' };
        cmds.push(['HSET', 'area:leit:' + slug, l.id, JSON.stringify(l)]); novos.push(l); ja[email + '|' + post] = 1;
      });
      if (cmds.length) await redis(cmds);
      return res.json({ ok: true, novos });
    }
    if (b.a === 'admin-leitura-del') {
      await redis([['HDEL', 'area:leit:' + slug, String(b.id || '')]]);
      return res.json({ ok: true });
    }
    if (b.a === 'admin-nota') {
      const texto = limpo(b.texto, 2000);
      if (!texto) return res.status(400).json({ ok: false, erro: 'Escreva a anotação.' });
      const n = { id: Date.now().toString(36) + crypto.randomBytes(2).toString('hex'), email: limpo(b.email, 120).toLowerCase(), texto, data: new Date().toISOString() };
      await redis([['LPUSH', 'area:notas:' + slug, JSON.stringify(n)], ['LTRIM', 'area:notas:' + slug, 0, 499]]);
      return res.json({ ok: true, nota: n });
    }
    if (b.a === 'admin-nota-del') {
      const [l] = await redis([['LRANGE', 'area:notas:' + slug, 0, 499]]);
      const v = (l || []).find(x => (json(x) || {}).id === b.id);
      if (v) await redis([['LREM', 'area:notas:' + slug, 1, v]]);
      return res.json({ ok: true });
    }
    // foto automática pelo @ (usada quando a Meta está conectada)
    if (b.a === 'admin-foto-auto') { const v = await CONSULTA.fotoAuto(redis, slug, b.email ? limpo(b.email, 120).toLowerCase() : '', b.insta); return res.json({ ok: !!v, foto: v || '' }); }
    // foto da empresa ou do contato (já recortada e reduzida no navegador)
    if (b.a === 'admin-foto') {
      const email = b.email ? limpo(b.email, 120).toLowerCase() : '';
      const kReg = email ? 'area:user:' + slug + ':' + email : 'area:emp:' + slug;
      const [v] = await redis([['GET', kReg]]);
      const reg = json(v) || (email ? null : { slug, nome: (CATALOGO[slug] || {}).nome || slug, criado: new Date().toISOString() });
      if (!reg) return res.status(404).json({ ok: false, erro: 'Contato não encontrado.' });
      const kFoto = 'area:foto:' + (email ? 'p:' + slug + ':' + email : 'emp:' + slug);
      if (b.remover) { delete reg.foto; delete reg.fotoOrigem; await redis([['DEL', kFoto], ['SET', kReg, JSON.stringify(reg)]]); return res.json({ ok: true, foto: '' }); }
      const d = String(b.dados || '');
      if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d) || d.length > 400000) return res.status(400).json({ ok: false, erro: 'Imagem inválida ou grande demais.' });
      reg.foto = Date.now().toString(36);
      reg.fotoOrigem = /^@[a-z0-9._]{1,30}$/.test(b.origem || '') ? b.origem : 'upload';
      await redis([['SET', kFoto, d], ['SET', kReg, JSON.stringify(reg)]].concat(email ? [] : [['SADD', 'area:emps', slug]]));
      return res.json({ ok: true, foto: reg.foto });
    }

    // dados de CRM de uma pessoa (modelo PESSOA)
    if (b.a === 'admin-pessoa-dados') {
      const email = limpo(b.email, 120).toLowerCase();
      const k = 'area:user:' + slug + ':' + email;
      const [v] = await redis([['GET', k]]);
      const u = json(v);
      if (!u) return res.status(404).json({ ok: false, erro: 'Pessoa não encontrada.' });
      const nome = limpo(b.nome, 80), wa = b.whatsapp !== undefined ? limpo(b.whatsapp, 30) : u.whatsapp;
      if (nome) u.nome = nome;
      u.whatsapp = wa;
      if (PAPEIS.indexOf(b.papel) >= 0) u.papel = b.papel;
      const crm = CAMPOS.limpa(CAMPOS.pessoa, b.dados);
      if (crm.__erros) return res.status(400).json({ ok: false, erro: crm.__erros.join(' ') });
      u.crm = crm;
      if (!u.num) { const [n] = await redis([['INCR', 'area:seq:pessoa']]); u.num = n; }
      u.editado = new Date().toISOString();
      await redis([['SET', k, JSON.stringify(u)]]);
      await NOTION.envia(redis, 'pessoa', slug, email);
      return res.json({ ok: true, pessoa: usuarioPublico(u) });
    }

    // negócios da empresa (modelo NEGÓCIO): area:neg:<slug> hash id -> negócio
    if (b.a === 'admin-negocio') {
      const d = CAMPOS.limpa(CAMPOS.negocio, b.dados);
      if (d.__erros) return res.status(400).json({ ok: false, erro: d.__erros.join(' ') });
      if (!d.nome) return res.status(400).json({ ok: false, erro: 'Dê um nome ao negócio.' });
      if (!d.etapa) d.etapa = CAMPOS.ETAPAS_NEG[0];
      const id = /^[a-z0-9]{4,20}$/.test(b.id || '') ? b.id : '';
      const [v] = id ? await redis([['HGET', 'area:neg:' + slug, id]]) : [null];
      const velho = json(v);
      const agora = new Date().toISOString();
      const n = velho ? Object.assign({}, velho) : { id: Date.now().toString(36) + crypto.randomBytes(2).toString('hex'), slug, criado: agora, historico: [] };
      if (!velho) { const [num] = await redis([['INCR', 'area:seq:neg']]); n.num = num; n.historico.push({ data: agora, texto: 'Negócio criado na etapa ' + d.etapa + '.' }); }
      else {
        const nomes = {}; CAMPOS.negocio.forEach(c => { nomes[c.k] = c.r; });
        const fmt = x => Array.isArray(x) ? x.join(', ') : (x === undefined || x === '' ? '—' : String(x));
        const mud = CAMPOS.negocio.filter(c => fmt((velho.dados || {})[c.k]) !== fmt(d[c.k]) && c.t !== 'longo').map(c => c.k === 'etapa' ? 'Etapa: ' + fmt((velho.dados || {}).etapa) + ' → ' + d.etapa : nomes[c.k] + ': ' + fmt(d[c.k]));
        if (mud.length) n.historico = [{ data: agora, texto: mud.join(' · ').slice(0, 600) }].concat(n.historico || []).slice(0, 60);
      }
      n.dados = d; n.atualizado = agora;
      await redis([['HSET', 'area:neg:' + slug, n.id, JSON.stringify(n)], ['SADD', 'area:emps', slug]]);
      await NOTION.envia(redis, 'neg', slug, n.id);
      const [nv] = await redis([['HGET', 'area:neg:' + slug, n.id]]);
      return res.json({ ok: true, negocio: json(nv) || n });
    }
    if (b.a === 'admin-negocio-del') {
      const [gv] = await redis([['HGET', 'area:neg:' + slug, String(b.id || '')]]);
      const g = json(gv);
      if (g) await redis([['HSET', 'area:neg-arq:' + slug, g.id, gv]]);
      await redis([['HDEL', 'area:neg:' + slug, String(b.id || '')]]);
      if (g && g.notion) await NOTION.envia(redis, 'neg-del', slug, g.notion);
      return res.json({ ok: true });
    }

    if (b.a === 'admin-convite') {
      const email = limpo(b.email, 120).toLowerCase();
      if (NOTION.ehInterno(email)) return res.status(400).json({ ok: false, erro: 'Esse contato não tem e-mail. Preencha o e-mail (no painel ou no Notion) para gerar o acesso.' });
      const [v] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
      if (!json(v)) return res.status(404).json({ ok: false, erro: 'Pessoa não encontrada.' });
      const t = crypto.randomBytes(20).toString('hex');
      await redis([['SET', 'area:convite:' + t, JSON.stringify({ slug, email }), 'EX', 30 * 86400]]);
      return res.json({ ok: true, url: SITE + '/area/?convite=' + t });
    }

    if (b.a === 'admin-item') {
      const it = limpaItem(b.item || {});
      if (!it.titulo) return res.status(400).json({ ok: false, erro: 'Dê um título para a entrega.' });
      if (it.tipo !== 'conteudo' && !it.url && !it.arquivo) return res.status(400).json({ ok: false, erro: 'Informe o link ou envie o arquivo.' });
      const pastaR = pastaDe(slug, it);
      await redis([['HSET', 'area:itens:' + slug, it.id, JSON.stringify(it)]].concat(pastaR ? [it.visivel === 'todos' ? ['HDEL', 'area:restrito:' + slug, pastaR] : ['HSET', 'area:restrito:' + slug, pastaR, it.visivel]] : []));
      return res.json({ ok: true, item: it });
    }
    if (b.a === 'admin-item-del') {
      await redis([['HDEL', 'area:itens:' + slug, String(b.id || '')]]);
      return res.json({ ok: true });
    }
    if (b.a === 'admin-acao') {
      const a = limpaAcao(b.acao || {});
      if (!a.titulo) return res.status(400).json({ ok: false, erro: 'Dê um título para a ação.' });
      const [ov] = await redis([['HGET', 'area:acoes:' + slug, a.id]]);
      const velha = json(ov);
      if (velha) ['notion', 'nEd', 'nTemArquivo', 'responsavel', 'nIA', 'nConteudo', 'nResumo'].forEach(k => { if (velha[k] !== undefined && (k !== 'responsavel' || !a.responsavel)) a[k] = velha[k]; });
      // editaram só o texto puro (app do celular): o texto puro vale e a formatação antiga sai
      const bruto = b.acao || {};
      if (velha && velha.detalheHtml && bruto.detalheHtml === velha.detalheHtml && bruto.detalhe !== undefined && bruto.detalhe !== velha.detalhe) { a.detalheHtml = ''; a.detalhe = limpo(bruto.detalhe, 20000); }
      await redis([['HSET', 'area:acoes:' + slug, a.id, JSON.stringify(a)]]);
      await NOTION.envia(redis, 'acao', slug, a.id);
      const [nv] = await redis([['HGET', 'area:acoes:' + slug, a.id]]);
      return res.json({ ok: true, acao: json(nv) || a });
    }
    if (b.a === 'admin-acao-del') {
      const [dv] = await redis([['HGET', 'area:acoes:' + slug, String(b.id || '')]]);
      const del = json(dv);
      await redis([['HDEL', 'area:acoes:' + slug, String(b.id || '')]]);
      if (del && del.notion) await NOTION.envia(redis, 'acao-del', slug, del.notion);
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: 'Erro inesperado. Tente de novo.' });
  }
};
