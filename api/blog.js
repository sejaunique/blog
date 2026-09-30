// API do blog: visualizações, curtidas e comentários.
// Guarda os dados num banco Redis (Upstash) conectado ao projeto na Vercel.
// Variáveis usadas: KV_REST_API_URL + KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).

const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SLUG = /^[a-z0-9-]{1,80}$/;

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

function obj(arr) {
  const o = {};
  for (let i = 0; arr && i < arr.length; i += 2) o[arr[i]] = +arr[i + 1] || 0;
  return o;
}

async function limite(ip, acao, max) {
  const k = 'rl:' + acao + ':' + ip;
  const [n] = await redis([['INCR', k], ['EXPIRE', k, 3600]]);
  return n > max;
}

function corpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if ((req.query || {}).a === 'ping') return res.json({ ok: true, db: !!(URL_DB && TOKEN), chaves: Object.keys(process.env).filter(k => /KV|REDIS|UPSTASH/.test(k)) });
  if (!URL_DB || !TOKEN) return res.status(503).json({ ok: false, off: true });

  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const q = req.query || {};

  try {
    if (req.method === 'GET') {
      if (q.a === 'stats') {
        const [v, l, c] = await redis([['HGETALL', 'views'], ['HGETALL', 'likes'], ['HGETALL', 'ccount']]);
        return res.json({ ok: true, views: obj(v), likes: obj(l), comentarios: obj(c) });
      }
      if (q.a === 'comments' && SLUG.test(q.slug || '')) {
        const [lst] = await redis([['LRANGE', 'c:' + q.slug, 0, 199]]);
        const itens = (lst || []).map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);
        return res.json({ ok: true, comentarios: itens });
      }
      return res.status(400).json({ ok: false });
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    const b = corpo(req);
    const slug = String(b.slug || '');
    if (!SLUG.test(slug)) return res.status(400).json({ ok: false });

    if (b.a === 'view') {
      if (await limite(ip, 'v', 300)) return res.json({ ok: true });
      const [n] = await redis([['HINCRBY', 'views', slug, 1]]);
      return res.json({ ok: true, views: n });
    }

    if (b.a === 'like') {
      if (await limite(ip, 'l', 60)) return res.status(429).json({ ok: false });
      const d = b.d === -1 ? -1 : 1;
      let [n] = await redis([['HINCRBY', 'likes', slug, d]]);
      if (n < 0) { await redis([['HSET', 'likes', slug, 0]]); n = 0; }
      return res.json({ ok: true, likes: n });
    }

    if (b.a === 'comment') {
      if (b.site) return res.json({ ok: true }); // campo invisível: robô
      const nome = String(b.nome || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const texto = String(b.texto || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1500);
      if (nome.length < 2 || texto.length < 2) return res.status(400).json({ ok: false, erro: 'Preencha seu nome e o comentário.' });
      if (await limite(ip, 'c', 8)) return res.status(429).json({ ok: false, erro: 'Muitos comentários seguidos. Tente de novo mais tarde.' });
      const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nome, texto, data: new Date().toISOString() };
      await redis([['LPUSH', 'c:' + slug, JSON.stringify(item)], ['HINCRBY', 'ccount', slug, 1]]);
      return res.json({ ok: true, comentario: item });
    }

    return res.status(400).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
};
