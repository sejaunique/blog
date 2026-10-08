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
// Carlos (admin):
//   POST {a:'admin-entrar', senha}  (senha = AREA_ADMIN_SENHA ou, se não existir, DIAG_SENHA)
//   GET  ?a=admin-resumo
//   POST {a:'admin-usuario', slug, email, status}   status: ativo | recusado | bloqueado | pendente
//   POST {a:'admin-senha', slug, email, senha}
//   POST {a:'admin-empresa', nome}
//   POST {a:'admin-item', slug, item} / {a:'admin-item-del', slug, id}
//   POST {a:'admin-acao', slug, acao} / {a:'admin-acao-del', slug, id}
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

const crypto = require('crypto');
const CATALOGO = require('./_area/catalogo.js');

const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN = process.env.AREA_ADMIN_SENHA || process.env.DIAG_SENHA || '';
const BLOB = process.env.BLOB_READ_WRITE_TOKEN || '';
const COOKIE = 'ua_sess';
const DIAS = 30;
const TIPOS = ['pagina', 'relatorio', 'diagnostico', 'video', 'arquivo', 'link', 'conteudo'];
const STATUS_ACAO = ['a_fazer', 'fazendo', 'feito'];
const STATUS_USER = ['ativo', 'recusado', 'bloqueado', 'pendente'];

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
const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
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

function usuarioPublico(u) { return { email: u.email, nome: u.nome, whatsapp: u.whatsapp, status: u.status, criado: u.criado }; }

async function conteudo(slug) {
  const [itensH, acoesH] = await redis([['HGETALL', 'area:itens:' + slug], ['HGETALL', 'area:acoes:' + slug]]);
  const lerHash = h => {
    const out = [];
    if (Array.isArray(h)) for (let i = 1; i < h.length; i += 2) { const v = json(h[i]); if (v) out.push(v); }
    else if (h && typeof h === 'object') Object.values(h).forEach(x => { const v = json(x); if (v) out.push(v); });
    return out;
  };
  const doCatalogo = ((CATALOGO[slug] || {}).paginas || []).map(p => Object.assign({ publicado: true, fixo: true }, p, { criado: p.data }));
  const itens = doCatalogo.concat(lerHash(itensH)).sort((a, b) => String(b.criado || '').localeCompare(String(a.criado || '')));
  const ordem = { fazendo: 0, a_fazer: 1, feito: 2 };
  const acoes = lerHash(acoesH).sort((a, b) => (ordem[a.status] - ordem[b.status]) || String(a.prazo || '9').localeCompare(String(b.prazo || '9')));
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
    criado: limpo(i.criado, 30) || new Date().toISOString()
  };
}
function limpaAcao(a) {
  return {
    id: /^[a-z0-9]{6,24}$/.test(a.id || '') ? a.id : novoId(),
    titulo: limpo(a.titulo, 200),
    detalhe: limpo(a.detalhe, 1500),
    responsavel: limpo(a.responsavel, 80),
    prazo: /^\d{4}-\d{2}-\d{2}$/.test(a.prazo || '') ? a.prazo : '',
    status: STATUS_ACAO.indexOf(a.status) >= 0 ? a.status : 'a_fazer',
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
    if (req.method === 'GET') {
      const s = await sessao(req);

      if (q.a === 'eu') {
        if (!s) return res.json({ ok: true, logado: false });
        if (s.admin) return res.json({ ok: true, logado: true, admin: true });
        const e = await empresa(s.slug);
        return res.json({ ok: true, logado: true, nome: s.nome, email: s.email, empresa: { slug: s.slug, nome: e ? e.nome : s.slug } });
      }

      if (!s) return res.status(401).json({ ok: false, erro: 'Entre na sua conta.' });

      if (q.a === 'conteudo') {
        const slug = s.admin ? slugify(q.e) : s.slug;
        const e = await empresa(slug);
        if (!e) return res.status(404).json({ ok: false, erro: 'Empresa não encontrada.' });
        const c = await conteudo(slug);
        if (!s.admin) c.itens = c.itens.filter(i => i.publicado);
        c.itens.forEach(i => {
          if (!i.arquivo) return;
          i.baixar = '/api/area?a=arquivo&e=' + slug + '&id=' + i.id;
          if (!s.admin) delete i.arquivo; // o cliente baixa pela API, que confere a empresa
        });
        return res.json({ ok: true, empresa: { slug, nome: e.nome }, itens: c.itens, acoes: c.acoes, admin: !!s.admin });
      }

      if (q.a === 'arquivo') {
        const slug = slugify(q.e);
        if (!s.admin && s.slug !== slug) return res.status(403).json({ ok: false });
        const [v] = await redis([['HGET', 'area:itens:' + slug, String(q.id || '')]]);
        const it = json(v);
        if (!it || !it.arquivo || (!s.admin && !it.publicado)) return res.status(404).json({ ok: false });
        res.setHeader('Location', it.arquivo.url);
        return res.status(302).end();
      }

      if (q.a === 'admin-resumo') {
        if (!s.admin) return res.status(403).json({ ok: false });
        const [slugsDb, pend] = await redis([['SMEMBERS', 'area:emps'], ['SMEMBERS', 'area:pendentes']]);
        const slugs = Array.from(new Set((slugsDb || []).concat(Object.keys(CATALOGO)))).sort();
        const empresas = [];
        for (const slug of slugs) {
          const [e, emails] = await redis([['GET', 'area:emp:' + slug], ['SMEMBERS', 'area:users:' + slug]]);
          const users = emails && emails.length ? await redis(emails.map(m => ['GET', 'area:user:' + slug + ':' + m])) : [];
          const ev = json(e) || { slug, nome: (CATALOGO[slug] || {}).nome || slug };
          empresas.push({ slug, nome: ev.nome, usuarios: users.map(json).filter(Boolean).map(usuarioPublico) });
        }
        const pendentes = [];
        for (const p of (pend || [])) {
          const [slug, email] = p.split('|');
          const [u] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
          const uv = json(u);
          if (uv) pendentes.push(Object.assign(usuarioPublico(uv), { slug, empresaNome: uv.empresaNome || slug }));
        }
        return res.json({ ok: true, empresas, pendentes, blob: !!BLOB });
      }
      return res.status(400).json({ ok: false });
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false });

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
      if (existe) return res.status(409).json({ ok: false, erro: 'Já existe um pedido com esse e-mail nessa empresa. Se esqueceu a senha, fale com a Unique.' });
      const sal = crypto.randomBytes(16).toString('hex');
      const u = { email, nome, whatsapp, slug, empresaNome, status: 'pendente', sal, hash: hashSenha(senha, sal), criado: new Date().toISOString() };
      await redis([
        ['SET', 'area:user:' + slug + ':' + email, JSON.stringify(u)],
        ['SADD', 'area:users:' + slug, email],
        ['SADD', 'area:pendentes', slug + '|' + email]
      ]);
      return res.json({ ok: true });
    }

    if (b.a === 'entrar') {
      const slug = slugify(b.empresa), email = limpo(b.email, 120).toLowerCase(), senha = String(b.senha || '');
      if (await limite('login:' + ip, 20, 900) || await limite('login:' + slug + ':' + email, 8, 900))
        return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Espere 15 minutos.' });
      const [v] = await redis([['GET', 'area:user:' + slug + ':' + email]]);
      const u = json(v);
      const errado = { ok: false, erro: 'Empresa, e-mail ou senha incorretos.' };
      if (!u) { hashSenha(senha, 'x'); return res.status(401).json(errado); }
      if (!igual(hashSenha(senha, u.sal), u.hash)) return res.status(401).json(errado);
      if (u.status === 'pendente') return res.status(403).json({ ok: false, erro: 'Seu acesso ainda está em análise. Você recebe a liberação da Unique em breve.' });
      if (u.status !== 'ativo') return res.status(403).json({ ok: false, erro: 'Acesso não liberado. Fale com a Unique.' });
      await abreSessao(res, { slug, email, nome: u.nome });
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

    if (b.a === 'acao-status') {
      const slug = s.admin ? slugify(b.slug) : s.slug;
      if (STATUS_ACAO.indexOf(b.status) < 0) return res.status(400).json({ ok: false });
      const [v] = await redis([['HGET', 'area:acoes:' + slug, String(b.id || '')]]);
      const a = json(v);
      if (!a) return res.status(404).json({ ok: false });
      a.status = b.status;
      a.atualizado = new Date().toISOString();
      a.por = s.admin ? 'Unique' : s.nome;
      await redis([['HSET', 'area:acoes:' + slug, a.id, JSON.stringify(a)]]);
      return res.json({ ok: true, acao: a });
    }

    // ---------- daqui para baixo só o Carlos ----------
    if (!s.admin) return res.status(403).json({ ok: false });
    const slug = slugify(b.slug);

    if (b.a === 'admin-empresa') {
      const nome = limpo(b.nome, 80), sl = slugify(nome);
      if (sl.length < 2) return res.status(400).json({ ok: false, erro: 'Nome inválido.' });
      await redis([['SET', 'area:emp:' + sl, JSON.stringify({ slug: sl, nome, criado: new Date().toISOString() }), 'NX'], ['SADD', 'area:emps', sl]]);
      return res.json({ ok: true, slug: sl });
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

    if (!(await empresa(slug))) return res.status(404).json({ ok: false, erro: 'Empresa não encontrada.' });

    if (b.a === 'admin-item') {
      const it = limpaItem(b.item || {});
      if (!it.titulo) return res.status(400).json({ ok: false, erro: 'Dê um título para a entrega.' });
      if (it.tipo !== 'conteudo' && !it.url && !it.arquivo) return res.status(400).json({ ok: false, erro: 'Informe o link ou envie o arquivo.' });
      await redis([['HSET', 'area:itens:' + slug, it.id, JSON.stringify(it)]]);
      return res.json({ ok: true, item: it });
    }
    if (b.a === 'admin-item-del') {
      await redis([['HDEL', 'area:itens:' + slug, String(b.id || '')]]);
      return res.json({ ok: true });
    }
    if (b.a === 'admin-acao') {
      const a = limpaAcao(b.acao || {});
      if (!a.titulo) return res.status(400).json({ ok: false, erro: 'Dê um título para a ação.' });
      await redis([['HSET', 'area:acoes:' + slug, a.id, JSON.stringify(a)]]);
      return res.json({ ok: true, acao: a });
    }
    if (b.a === 'admin-acao-del') {
      await redis([['HDEL', 'area:acoes:' + slug, String(b.id || '')]]);
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: 'Erro inesperado. Tente de novo.' });
  }
};
