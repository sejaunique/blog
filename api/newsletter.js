// Newsletter do Blog Seja Unique.
// Público:
//   POST {a:'assinar', nome, email, origem}     -> entra na lista (sem e-mail de boas-vindas: só recebe quando sai post novo)
//   GET  ?a=sair&e=EMAIL&t=TOKEN                -> cancela a inscrição (link que vai em todo e-mail)
//   GET  ?a=verificar                           -> confere se há post novo no blog e envia (chamado pelo blog e pelo cron diário)
// Admin (sessão do workspace):
//   GET  ?a=lista                               -> assinantes, envios e status do Gmail
//   POST {a:'enviar-agora'}                     -> mesma verificação, na hora
//   POST {a:'remover', email}
//   POST {a:'teste', slug}                      -> manda o e-mail de um post só para a conta conectada
// Dados (Redis): news:assinantes (hash email -> json), news:enviados (set de slugs já enviados),
// news:env:<slug> (set de e-mails que já receberam aquele post), news:log (lista dos últimos envios).

const crypto = require('crypto');
const vm = require('vm');
const G = require('./_area/google.js');
const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SITE = 'https://sejaunique.vercel.app';
const POR_VEZ = 25;           // e-mails por chamada (cada chamada continua de onde parou)
const JANELA_DIAS = 10;       // só envia posts com data recente (segurança contra reenvio de posts antigos)

async function redis(cmds) {
  const r = await fetch(URL_DB.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('db ' + r.status);
  return (await r.json()).map(x => x.result);
}
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const pares = h => { const o = {}; if (Array.isArray(h)) for (let i = 0; i < h.length; i += 2) o[h[i]] = h[i + 1]; else Object.assign(o, h || {}); return o; };
function corpo(req) { if (req.body && typeof req.body === 'object') return req.body; try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } }
const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tit = s => String(s || '').replace(/==/g, '').replace(/\*\*/g, '');

async function admin(req) {
  const m = String(req.headers.cookie || '').match(/(?:^|;\s*)ua_sess=([a-f0-9]{48})/);
  if (!m) return false;
  const [s] = await redis([['GET', 'area:sess:' + m[1]]]);
  const v = json(s);
  return !!(v && v.admin);
}

async function posts() {
  const r = await fetch(SITE + '/blog/posts.js?x=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('posts ' + r.status);
  const ctx = { window: {} };
  vm.runInNewContext(await r.text(), ctx, { timeout: 1000 });
  return (ctx.window.POSTS || []).filter(p => p && p.slug && p.titulo);
}

function capa(p) {
  let c = p.capa || '';
  if (!c && p.video) { const m = String(p.video).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); if (m) c = 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg'; }
  if (c && !/^https?:/.test(c)) c = SITE + '/blog/' + c.replace(/^\/?(blog\/)?/, '');
  return c;
}

function linkSair(email, t) { return SITE + '/api/newsletter?a=sair&e=' + encodeURIComponent(email) + '&t=' + t; }

function montaEmail(p, a) {
  const url = SITE + '/blog/' + p.slug + '/?utm_source=newsletter&utm_medium=email&utm_campaign=' + p.slug;
  const img = capa(p), sair = linkSair(a.email, a.token), nome = (a.nome || '').split(' ')[0];
  const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(tit(p.titulo)) + '</title></head>' +
    '<body style="margin:0;padding:0;background:#f2f2f0;font-family:Montserrat,Arial,Helvetica,sans-serif;color:#0b0b0c">' +
    '<div style="display:none;max-height:0;overflow:hidden">' + esc(p.resumo || '') + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f0"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:22px;overflow:hidden">' +
    '<tr><td style="background:#0b0b0c;padding:22px 30px"><table role="presentation" width="100%"><tr><td style="color:#ffffff;font-weight:800;font-size:20px;letter-spacing:.12em">UN1QUE</td><td align="right" style="color:#00e676;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Blog Seja Unique · Post novo</td></tr></table></td></tr>' +
    (img ? '<tr><td><a href="' + esc(url) + '"><img src="' + esc(img) + '" width="600" alt="" style="display:block;width:100%;height:auto;border:0"></a></td></tr>' : '') +
    '<tr><td style="padding:34px 30px 8px">' +
    (nome ? '<p style="margin:0 0 14px;font-size:15px;color:#55555c">Fala, ' + esc(nome) + '! Saiu post novo no blog:</p>' : '<p style="margin:0 0 14px;font-size:15px;color:#55555c">Saiu post novo no blog:</p>') +
    (p.categoria ? '<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#0a7d42">' + esc(p.categoria) + '</p>' : '') +
    '<h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-.02em">' + esc(tit(p.titulo)) + '</h1>' +
    (p.resumo ? '<p style="margin:0 0 26px;font-size:17px;line-height:1.55;color:#2a2a2e">' + esc(p.resumo) + '</p>' : '') +
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#00e676;border-radius:999px"><a href="' + esc(url) + '" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:800;color:#0b0b0c;text-decoration:none">Ler o post completo →</a></td></tr></table>' +
    '</td></tr>' +
    '<tr><td style="padding:30px 30px 34px"><table role="presentation" width="100%" style="border-top:1px solid #e6e6e3"><tr><td style="padding-top:22px;font-size:14px;line-height:1.5;color:#2a2a2e"><b>Carlos Ribeiro</b><br><span style="color:#6b6b72">Unique Consultoria Comercial</span></td></tr></table></td></tr>' +
    '</table>' +
    '<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#8a8a90">Você recebe este e-mail porque se inscreveu na newsletter do Blog Seja Unique.<br>' +
    '<a href="' + esc(sair) + '" style="color:#8a8a90">Cancelar inscrição</a> · <a href="' + SITE + '/blog/" style="color:#8a8a90">Ver todos os posts</a></p>' +
    '</td></tr></table></body></html>';
  const texto = (nome ? 'Fala, ' + nome + '! ' : '') + 'Saiu post novo no Blog Seja Unique:\n\n' + tit(p.titulo) + '\n\n' + (p.resumo || '') + '\n\nLer o post: ' + url + '\n\n--\nCarlos Ribeiro · Unique Consultoria Comercial\nCancelar inscrição: ' + sair;
  return {
    para: a.email, nomeDe: 'Carlos Ribeiro | Unique', assunto: tit(p.titulo), html, texto,
    cabecalhos: { 'List-Unsubscribe': '<' + sair + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
  };
}

// confere posts novos e envia um lote. Na primeira vez, só marca os posts que já existem (ninguém recebe post antigo).
async function verificar() {
  const [lock] = await redis([['SET', 'news:lock', '1', 'NX', 'EX', 50]]);
  if (lock !== 'OK') return { ok: true, ocupado: true };
  try {
    const lista = await posts();
    const [ini, enviadosArr] = await redis([['GET', 'news:iniciado'], ['SMEMBERS', 'news:enviados']]);
    if (!ini) {
      const cmds = [['SET', 'news:iniciado', new Date().toISOString()]];
      if (lista.length) cmds.push(['SADD', 'news:enviados'].concat(lista.map(p => p.slug)));
      await redis(cmds);
      return { ok: true, iniciado: true, marcados: lista.length };
    }
    const enviados = new Set(enviadosArr || []);
    const limite = new Date(Date.now() - JANELA_DIAS * 864e5).toISOString().slice(0, 10);
    const novos = lista.filter(p => !enviados.has(p.slug)).sort((a, b) => (a.data < b.data ? -1 : 1));
    if (!novos.length) return { ok: true, novos: 0 };
    const c = await G.conta(redis);
    const podeGmail = !!(c && c.refresh && !c.erro && /gmail\.send/.test(c.escopos || ''));
    const [assH] = await redis([['HGETALL', 'news:assinantes']]);
    const ass = Object.values(pares(assH)).map(json).filter(a => a && a.email);
    let restante = POR_VEZ;
    const feito = [];
    for (const p of novos) {
      if (!p.data || p.data < limite) { await redis([['SADD', 'news:enviados', p.slug]]); feito.push({ slug: p.slug, pulado: 'antigo' }); continue; }
      if (!podeGmail) return { ok: false, semGmail: true, pendente: p.slug };
      const [ja] = await redis([['SMEMBERS', 'news:env:' + p.slug]]);
      const jaSet = new Set(ja || []);
      const falta = ass.filter(a => !jaSet.has(a.email));
      const lote = falta.slice(0, restante);
      let ok = 0, marc = 0, erro = '';
      for (let i = 0; i < lote.length; i += 5) {
        const parte = lote.slice(i, i + 5);
        const rs = await Promise.all(parte.map(a => G.enviaEmail(redis, montaEmail(p, a)).catch(e => ({ ok: false, erro: String(e) }))));
        const cmds = [];
        rs.forEach((r, k) => { if (r.ok) { ok++; marc++; cmds.push(['SADD', 'news:env:' + p.slug, parte[k].email]); } else if (/invalid|address/i.test(r.erro || '') && r.status === 400) { marc++; cmds.push(['SADD', 'news:env:' + p.slug, parte[k].email]); } else erro = r.erro || 'erro'; });
        if (cmds.length) await redis(cmds);
        if (rs.some(r => r.status === 401 || r.status === 403 || r.status === 429)) { erro = rs.find(r => !r.ok).erro; break; }
      }
      restante -= lote.length;
      const faltam = falta.length - marc;
      if (faltam <= 0) {
        await redis([['SADD', 'news:enviados', p.slug], ['LPUSH', 'news:log', JSON.stringify({ slug: p.slug, titulo: tit(p.titulo), quando: new Date().toISOString(), total: jaSet.size + ok })], ['LTRIM', 'news:log', 0, 49]]);
      }
      feito.push({ slug: p.slug, enviados: ok, faltam: Math.max(0, faltam), erro });
      if (restante <= 0 || erro) break;
    }
    return { ok: true, feito };
  } finally {
    await redis([['DEL', 'news:lock']]);
  }
}

function pagina(titulo, texto) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titulo) + ' · Seja Unique</title>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap"></head>' +
    '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0c;color:#f5f5f5;font-family:Montserrat,Arial,sans-serif;padding:24px;box-sizing:border-box">' +
    '<div style="max-width:460px;text-align:center"><div style="font-weight:800;letter-spacing:.14em;margin-bottom:30px">UN1QUE</div><h1 style="font-size:28px;margin:0 0 14px">' + esc(titulo) + '</h1><p style="opacity:.8;line-height:1.6;margin:0 0 28px">' + texto + '</p>' +
    '<a href="/blog/" style="display:inline-block;background:#00e676;color:#0b0b0c;font-weight:800;text-decoration:none;padding:14px 26px;border-radius:999px">Ir para o blog</a></div></body></html>';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_DB || !TOKEN) return res.status(503).json({ ok: false, off: true });
  const q = req.query || {};
  try {
    // cancelar inscrição (GET pelo link, POST pelo botão de 1 clique do Gmail)
    if (q.a === 'sair') {
      const email = String(q.e || '').toLowerCase().trim(), t = String(q.t || '');
      const [v] = EMAIL.test(email) ? await redis([['HGET', 'news:assinantes', email]]) : [null];
      const a = json(v);
      if (a && a.token && t.length === a.token.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(a.token))) await redis([['HDEL', 'news:assinantes', email], ['SADD', 'news:saiu', email]]);
      if (req.method === 'POST') return res.json({ ok: true });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(pagina('Inscrição cancelada', 'Você não vai mais receber os e-mails do Blog Seja Unique. Se mudar de ideia, é só se inscrever de novo no site.'));
    }
    if (q.a === 'verificar') {
      const r = await verificar();
      return res.json({ ok: r.ok !== false });
    }
    if (req.method === 'POST') {
      const b = corpo(req);
      if (b.a === 'assinar') {
        if (b.site) return res.json({ ok: true }); // campo isca contra robôs
        const email = String(b.email || '').toLowerCase().trim().slice(0, 120), nome = String(b.nome || '').trim().replace(/\s+/g, ' ').slice(0, 80);
        if (!EMAIL.test(email)) return res.status(400).json({ ok: false, erro: 'Confira o seu e-mail.' });
        const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
        const [n] = await redis([['INCR', 'rl:news:' + ip], ['EXPIRE', 'rl:news:' + ip, 3600]]);
        if (n > 20) return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Tente mais tarde.' });
        const [v] = await redis([['HGET', 'news:assinantes', email]]);
        const atual = json(v);
        const a = atual || { email, token: crypto.randomBytes(16).toString('hex'), data: new Date().toISOString() };
        if (nome) a.nome = nome;
        a.origem = atual ? atual.origem : String(b.origem || 'site').replace(/[^a-z0-9-]/gi, '').slice(0, 30);
        await redis([['HSET', 'news:assinantes', email, JSON.stringify(a)], ['SREM', 'news:saiu', email]]);
        return res.json({ ok: true, ja: !!atual });
      }
    }

    // daqui para baixo, só o Carlos
    if (!(await admin(req))) return res.status(401).json({ ok: false, erro: 'Entre como admin.' });
    if (req.method === 'GET' && q.a === 'lista') {
      const [assH, log, enviados, saiu, ini] = await redis([['HGETALL', 'news:assinantes'], ['LRANGE', 'news:log', 0, 19], ['SMEMBERS', 'news:enviados'], ['SCARD', 'news:saiu'], ['GET', 'news:iniciado']]);
      const c = await G.conta(redis);
      const ass = Object.values(pares(assH)).map(json).filter(Boolean).map(a => ({ email: a.email, nome: a.nome || '', data: a.data, origem: a.origem || '' })).sort((x, y) => (x.data < y.data ? 1 : -1));
      let pendentes = [];
      try { const set = new Set(enviados || []); pendentes = ini ? (await posts()).filter(p => !set.has(p.slug)).map(p => ({ slug: p.slug, titulo: tit(p.titulo), data: p.data })) : []; } catch (e) { /* segue */ }
      return res.json({ ok: true, assinantes: ass, log: (log || []).map(json).filter(Boolean), saiu: saiu || 0, iniciado: !!ini, pendentes,
        gmail: { conectado: !!(c && c.refresh && !c.erro), envio: !!(c && /gmail\.send/.test(c.escopos || '')), email: c ? c.email : '' } });
    }
    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    const b = corpo(req);
    if (b.a === 'enviar-agora') return res.json(await verificar());
    if (b.a === 'remover') { await redis([['HDEL', 'news:assinantes', String(b.email || '').toLowerCase()]]); return res.json({ ok: true }); }
    if (b.a === 'teste') {
      const lista = await posts();
      const p = lista.find(x => x.slug === b.slug) || lista.slice().sort((x, y) => (x.data < y.data ? 1 : -1))[0];
      const c = await G.conta(redis);
      if (!c || !c.email) return res.status(409).json({ ok: false, erro: 'Conecte o Google primeiro.' });
      const r = await G.enviaEmail(redis, montaEmail(p, { email: c.email, nome: 'Carlos', token: 'teste' }));
      return res.json({ ok: r.ok, erro: r.erro, para: c.email });
    }
    return res.status(400).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: 'Erro inesperado.' });
  }
};
