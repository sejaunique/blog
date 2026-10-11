// Google Agenda do workspace (só o Carlos, com a sessão de admin).
// GET  ?a=status                       -> configurado? conectado? qual conta?
// POST {a:'config', id, segredo}       -> guarda as credenciais do app Google (se não estiverem na Vercel)
// GET  ?a=conectar                     -> manda para a tela de permissão do Google
// GET  ?a=volta&code&state             -> volta do Google, guarda o acesso e abre o workspace
// POST {a:'desconectar'}
// GET  ?a=eventos&de=ISO&ate=ISO       -> eventos da agenda (e traz para o workspace as mudanças feitas no Google)
// POST {a:'evento', titulo, inicio, duracao, detalhe, emails, convidar, meet, unique}  -> cria um compromisso direto no Google
// POST {a:'sync', id}                  -> envia (de novo) uma ação para a agenda

const crypto = require('crypto');
const G = require('./_area/google.js');
const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmds) {
  const r = await fetch(URL_DB.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('db ' + r.status);
  return (await r.json()).map(x => x.result);
}
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
function corpo(req) { if (req.body && typeof req.body === 'object') return req.body; try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } }
async function admin(req) {
  const m = String(req.headers.cookie || '').match(/(?:^|;\s*)ua_sess=([a-f0-9]{48})/);
  if (!m) return false;
  const [s] = await redis([['GET', 'area:sess:' + m[1]]]);
  const v = json(s);
  return !!(v && v.admin);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_DB || !TOKEN) return res.status(503).json({ ok: false });
  const q = req.query || {};
  try {
    if (!(await admin(req))) {
      if (q.a === 'volta' || q.a === 'conectar') { res.setHeader('Location', '/area/admin/'); return res.status(302).end(); }
      return res.status(401).json({ ok: false, erro: 'Entre como admin.' });
    }

    if (req.method === 'GET' && q.a === 'status') {
      const a = await G.app(redis), c = await G.conta(redis);
      return res.json({ ok: true, configurado: !!a, origem: a ? a.origem : '', conectado: !!(c && c.refresh && !c.erro), email: c ? c.email : '', erro: c && c.erro ? c.erro : '', volta: G.VOLTA });
    }
    if (req.method === 'GET' && q.a === 'conectar') {
      const a = await G.app(redis);
      if (!a) { res.setHeader('Location', '/area/admin/#reunioes'); return res.status(302).end(); }
      const est = crypto.randomBytes(16).toString('hex');
      await redis([['SET', 'area:google:estado:' + est, String(q.volta || '/area/admin/#reunioes').slice(0, 120), 'EX', 900]]);
      res.setHeader('Location', G.urlConectar(a, est));
      return res.status(302).end();
    }
    if (req.method === 'GET' && q.a === 'volta') {
      const est = String(q.state || '');
      const [volta] = /^[a-f0-9]{32}$/.test(est) ? await redis([['GET', 'area:google:estado:' + est], ['DEL', 'area:google:estado:' + est]]) : [null];
      let destino = (volta && /^\/area\/admin\//.test(volta)) ? volta : '/area/admin/#reunioes';
      if (!volta || q.error || !q.code) destino += (destino.indexOf('?') < 0 ? '' : '') ;
      const r = volta && q.code ? await G.trocaCodigo(redis, String(q.code)) : { ok: false };
      const sep = destino.indexOf('#'), base = sep < 0 ? destino : destino.slice(0, sep), hash = sep < 0 ? '' : destino.slice(sep);
      res.setHeader('Location', base + (base.indexOf('?') < 0 ? '?' : '&') + 'google=' + (r.ok ? 'ok' : 'erro') + hash);
      return res.status(302).end();
    }
    if (req.method === 'GET' && q.a === 'eventos') {
      const de = /^\d{4}-\d{2}-\d{2}T/.test(q.de || '') ? q.de : new Date(Date.now() - 7 * 864e5).toISOString();
      const ate = /^\d{4}-\d{2}-\d{2}T/.test(q.ate || '') ? q.ate : new Date(Date.now() + 60 * 864e5).toISOString();
      return res.json(await G.eventos(redis, de, ate));
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    const b = corpo(req);
    if (b.a === 'config') {
      const id = String(b.id || '').trim(), segredo = String(b.segredo || '').trim();
      if (!/\.apps\.googleusercontent\.com$/.test(id) || segredo.length < 10) return res.status(400).json({ ok: false, erro: 'Confira o ID do cliente (termina em .apps.googleusercontent.com) e a chave secreta.' });
      await redis([['SET', 'area:google:app', JSON.stringify({ id, segredo })]]);
      return res.json({ ok: true });
    }
    if (b.a === 'desconectar') {
      const c = await G.conta(redis);
      if (c && c.refresh) { try { await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(c.refresh), { method: 'POST' }); } catch (e) { /* segue */ } }
      await redis([['DEL', 'area:google:conta'], ['DEL', 'area:google:token']]);
      return res.json({ ok: true });
    }
    if (b.a === 'evento') {
      const emails = (Array.isArray(b.emails) ? b.emails : []).map(e => String(e).trim().toLowerCase()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).slice(0, 30);
      const r = await G.criaEvento(redis, { titulo: String(b.titulo || 'Reunião Unique').slice(0, 200), inicio: String(b.inicio || ''), duracao: Math.min(600, Math.max(15, +b.duracao || 60)), detalhe: String(b.detalhe || '').slice(0, 3000), local: String(b.local || '').slice(0, 200), emails, convidar: !!b.convidar, meet: !!b.meet, unique: /^[a-z0-9]{6,24}$/.test(b.unique || '') ? b.unique : '' });
      if (r.off) return res.status(409).json({ ok: false, erro: 'Conecte o Google Agenda primeiro.' });
      return res.json({ ok: !!r.ok, link: r.htmlLink, meet: r.hangoutLink || '', erro: r.ok ? '' : (r.error && r.error.message) || 'O Google recusou o evento.' });
    }
    if (b.a === 'sync') {
      const [v] = await redis([['HGET', 'area:modelos', String(b.id || '')]]);
      const m = json(v);
      if (!m) return res.status(404).json({ ok: false });
      const r = await G.sincroniza(redis, m, {});
      return res.json({ ok: !!r, link: r && r.htmlLink });
    }
    return res.status(400).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: 'Erro inesperado.' });
  }
};
