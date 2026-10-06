// API do Diagnóstico de Maturidade Comercial.
// Guarda cada diagnóstico no mesmo banco Redis (Upstash) do blog.
// POST /api/diagnostico            -> salva um diagnóstico (público, com limite por IP)
// GET  /api/diagnostico?a=lista    -> lista os diagnósticos (precisa do header x-senha = DIAG_SENHA)
// GET  /api/diagnostico?a=relatorio&r=TOKEN -> um diagnóstico, para o relatório do cliente (o token é o segredo do link)
// Variáveis: KV_REST_API_URL + KV_REST_API_TOKEN (ou UPSTASH_*) e DIAG_SENHA (senha do painel).

const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SENHA = process.env.DIAG_SENHA || '';
const LISTA = 'diag:lista';
const crypto = require('crypto');
const TOKEN_OK = /^[a-f0-9]{24}$/;
const novoToken = () => crypto.randomBytes(12).toString('hex');
// o relatório não expõe contato nem CNPJ, só o necessário para a análise
const PRIVADOS = ['email', 'whatsapp', 'cnpj', 'instagram'];

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

async function limite(ip, max) {
  const k = 'rl:diag:' + ip;
  const [n] = await redis([['INCR', k], ['EXPIRE', k, 3600]]);
  return n > max;
}

function corpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

function limpo(s, max) {
  return String(s == null ? '' : s).replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

function igual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_DB || !TOKEN) return res.status(503).json({ ok: false, off: true });

  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const q = req.query || {};

  try {
    if (req.method === 'GET' && q.a === 'relatorio') {
      const r = String(q.r || '');
      if (!TOKEN_OK.test(r)) return res.status(404).json({ ok: false });
      const [s] = await redis([['GET', 'diag:r:' + r]]);
      if (!s) return res.status(404).json({ ok: false });
      const d = JSON.parse(s);
      return res.json({ ok: true, diagnostico: { data: d.data, empresa: d.empresa, respostas: (d.respostas || []).filter(x => PRIVADOS.indexOf(x.id) < 0) } });
    }

    if (req.method === 'GET') {
      if (!SENHA) return res.status(503).json({ ok: false, erro: 'Defina a variável DIAG_SENHA na Vercel para abrir o painel.' });
      if (!igual(String(req.headers['x-senha'] || ''), SENHA)) return res.status(401).json({ ok: false, erro: 'Senha incorreta.' });
      if (q.a === 'lista') {
        const [lst] = await redis([['LRANGE', LISTA, 0, 499]]);
        const itens = (lst || []).map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);
        return res.json({ ok: true, diagnosticos: itens });
      }
      return res.status(400).json({ ok: false });
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    const b = corpo(req);

    // painel: cria o link do relatório para um diagnóstico antigo que ainda não tem
    if (b.a === 'gerar_link') {
      if (!SENHA || !igual(String(req.headers['x-senha'] || ''), SENHA)) return res.status(401).json({ ok: false });
      const [lst] = await redis([['LRANGE', LISTA, 0, 499]]);
      const i = (lst || []).findIndex(x => { try { return JSON.parse(x).id === b.id; } catch (e) { return false; } });
      if (i < 0) return res.status(404).json({ ok: false });
      const item = JSON.parse(lst[i]);
      if (!item.token) item.token = novoToken();
      await redis([['LSET', LISTA, i, JSON.stringify(item)], ['SET', 'diag:r:' + item.token, JSON.stringify(item)]]);
      return res.json({ ok: true, token: item.token });
    }

    if (b.site) return res.json({ ok: true }); // campo invisível: robô

    const respostas = (Array.isArray(b.respostas) ? b.respostas : []).slice(0, 80).map(x => ({
      secao: limpo(x && x.secao, 60),
      id: limpo(x && x.id, 40).replace(/[^a-z0-9_]/gi, ''),
      pergunta: limpo(x && x.pergunta, 300),
      resposta: limpo(x && x.resposta, 3000)
    })).filter(x => x.id);

    const pega = id => (respostas.find(x => x.id === id) || {}).resposta || '';
    if (!pega('empresa') || !pega('whatsapp')) return res.status(400).json({ ok: false, erro: 'Respostas incompletas.' });
    if (await limite(ip, 10)) return res.status(429).json({ ok: false, erro: 'Muitos envios seguidos. Tente de novo mais tarde.' });

    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      token: novoToken(),
      data: new Date().toISOString(),
      empresa: pega('empresa'),
      nome: pega('nome'),
      whatsapp: pega('whatsapp'),
      email: pega('email'),
      respostas
    };
    await redis([['LPUSH', LISTA, JSON.stringify(item)], ['SET', 'diag:r:' + item.token, JSON.stringify(item)]]);
    return res.json({ ok: true, id: item.id });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
};
