// Robô das iscas do Instagram (substitui o ManyChat).
// Alguém comenta ou manda no direct uma palavra-chave da planilha "Iscas · Palavras-chave do Instagram"
// e recebe: resposta pública no comentário + direct com botão para a página da isca (cadastro em /api/material).
//
// App da Meta: "Unique Iscas" (1158093800159860), produto Instagram com login do Instagram.
// Variáveis no Vercel:
//   IG_TOKEN         token da conta do Instagram (gerado no painel do app, em "Configuração da API com login do Instagram")
//   IG_VERIFY_TOKEN  texto combinado com a Meta na assinatura do webhook
//   IG_APP_SECRET    (opcional) chave secreta do app do Instagram, para conferir a assinatura de cada aviso
//
// Rotas:
//   GET  /api/instagram?hub.mode=subscribe...   verificação do webhook pela Meta
//   GET  /api/instagram?a=assinar&k=<IG_VERIFY_TOKEN>  liga a conta do Instagram ao app (comments e messages)
//   POST /api/instagram                          avisos da Meta (comentários e mensagens)
//
// Iscas: lidas da planilha publicada (CSV), com cópia de segurança do PRESSÃO abaixo.
// Redis: ig:feito:<id> (não responder duas vezes), ig:log (últimos 200 disparos).

const crypto = require('crypto');
const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_DB = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const TK = () => String(process.env.IG_TOKEN || '').trim().replace(/^["']|["']$/g, '');
// token do login do Instagram (IGAA...) usa graph.instagram.com; token do login do Facebook/usuário do sistema (EAA...) usa graph.facebook.com
const IG = () => (/^IG/.test(TK()) ? 'https://graph.instagram.com' : 'https://graph.facebook.com') + '/v24.0';
const CONTA = () => process.env.IG_ID || '17841400491820160'; // @soucarlosribeiro
const PLANILHA = 'https://docs.google.com/spreadsheets/d/1CIt8HtjW8oTE1cxJTTsbDilYH3Zj5StF4uYSBc419Hs/gviz/tq?tqx=out:csv&sheet=Iscas';

const RESERVA = [{
  palavras: ['pressão', 'pressao'],
  link: 'https://sejaunique.com/pressao/',
  direct: 'Aqui estão as 13 mecânicas para nunca mais deixar venda frouxa 👇 Mensagens prontas, gerador de follow-up com data e a cadência até o prazo.',
  botao: 'Quero as 13 mecânicas',
  publica: 'Te mandei no direct! 📩',
  tag: 'Pressão'
}];

async function redis(cmds) {
  if (!URL_DB || !TOKEN_DB) return [];
  const r = await fetch(URL_DB.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN_DB, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('db ' + r.status);
  return (await r.json()).map(x => x.result);
}

// tira acento e caixa: "Pressão!" -> "pressao!"
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function csv(txt) {
  const linhas = []; let lin = [], cel = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { cel += '"'; i++; } else q = false; } else cel += c; }
    else if (c === '"') q = true;
    else if (c === ',') { lin.push(cel); cel = ''; }
    else if (c === '\n') { lin.push(cel); linhas.push(lin); lin = []; cel = ''; }
    else if (c !== '\r') cel += c;
  }
  if (cel || lin.length) { lin.push(cel); linhas.push(lin); }
  return linhas;
}

let cache = { em: 0, iscas: null };
async function iscas() {
  if (cache.iscas && Date.now() - cache.em < 120000) return cache.iscas;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(PLANILHA, { signal: ctl.signal }); clearTimeout(t);
    const txt = r.ok ? await r.text() : '';
    const [cab, ...linhas] = csv(txt);
    if (!cab || !/ativa/i.test(cab[0] || '')) throw new Error('planilha fechada');
    const col = n => cab.findIndex(h => norm(h).startsWith(norm(n)));
    const C = { ativa: col('Ativa'), chave: col('Palavra-chave'), var: col('Varia'), link: col('Link'), direct: col('Mensagem'), botao: col('Texto do bot'), publica: col('Resposta p'), tag: col('Etiqueta') };
    const lista = linhas.filter(l => norm(l[C.ativa]) === 'sim' && l[C.link]).map(l => ({
      palavras: [...new Set([l[C.chave], ...String(l[C.var] || '').split(',')].map(norm).filter(Boolean))],
      link: l[C.link].trim(), direct: (l[C.direct] || '').trim(), botao: (l[C.botao] || 'Quero').trim().slice(0, 20),
      publica: (l[C.publica] || '').trim(), tag: (l[C.tag] || '').trim()
    }));
    cache = { em: Date.now(), iscas: lista.length ? lista : RESERVA };
  } catch (e) { cache = { em: Date.now(), iscas: cache.iscas || RESERVA }; }
  return cache.iscas;
}

// a palavra-chave precisa aparecer como palavra inteira no texto
function acha(lista, texto) {
  const t = ' ' + norm(texto).replace(/[^a-z0-9]+/g, ' ') + ' ';
  return lista.find(i => i.palavras.some(p => t.includes(' ' + p.replace(/[^a-z0-9]+/g, ' ').trim() + ' ')));
}

async function ig(caminho, corpo) {
  const r = await fetch(IG() + caminho, { method: 'POST', headers: { Authorization: 'Bearer ' + TK(), 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  const j = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, j } : { ok: false, erro: (j.error && j.error.message) || ('http ' + r.status) };
}

// direct com botão; se a Meta recusar o botão, manda texto com o link
async function manda(conta, recipient, isca) {
  const texto = (isca.direct || 'Aqui está 👇').slice(0, 600);
  const b = await ig('/' + conta + '/messages', { recipient, message: { attachment: { type: 'template', payload: { template_type: 'button', text: texto, buttons: [{ type: 'web_url', url: isca.link, title: isca.botao }] } } } });
  if (b.ok) return b;
  const t = await ig('/' + conta + '/messages', { recipient, message: { text: texto + '\n\n' + isca.link } });
  return t.ok ? { ok: true, aviso: 'sem botão: ' + b.erro } : { ok: false, erro: b.erro + ' | ' + t.erro };
}

async function registra(x) {
  console.log('[ig]', JSON.stringify(x));
  try { await redis([['LPUSH', 'ig:log', JSON.stringify({ ...x, em: new Date().toISOString() })], ['LTRIM', 'ig:log', 0, 199], ['EXPIRE', 'ig:log', 60 * 60 * 24 * 30]]); } catch (e) {}
}

async function primeiraVez(id) {
  if (!URL_DB || !TOKEN_DB) return true;
  try { const [r] = await redis([['SET', 'ig:feito:' + id, '1', 'NX', 'EX', 60 * 60 * 24 * 30]]); return r === 'OK'; }
  catch (e) { return true; }
}

async function comentario(contaId, v) {
  if (!v || !v.id || !v.text) return;
  if (v.from && String(v.from.id) === String(contaId)) return; // a própria conta
  if (v.parent_id) return; // resposta dentro de outro comentário
  const isca = acha(await iscas(), v.text);
  if (!isca) return;
  if (!(await primeiraVez('c:' + v.id))) return;
  const d = await manda(contaId || CONTA(), { comment_id: v.id }, isca);
  let p = { ok: false, erro: 'sem resposta pública' };
  if (isca.publica) p = await ig('/' + v.id + '/replies', { message: isca.publica });
  await registra({ tipo: 'comentario', usuario: v.from && v.from.username, post: v.media && v.media.id, isca: isca.tag, direct: d.ok ? (d.aviso || 'ok') : d.erro, publica: p.ok ? 'ok' : p.erro });
}

async function mensagem(contaId, m) {
  const msg = m && m.message;
  if (!msg || msg.is_echo || !msg.text || !m.sender) return;
  if (String(m.sender.id) === String(contaId)) return;
  const isca = acha(await iscas(), msg.text);
  if (!isca) return;
  if (!(await primeiraVez('m:' + (msg.mid || m.timestamp)))) return;
  const d = await manda(contaId || CONTA(), { id: m.sender.id }, isca);
  await registra({ tipo: 'direct', isca: isca.tag, direct: d.ok ? (d.aviso || 'ok') : d.erro });
}

function bruto(req) {
  return new Promise(ok => { let s = ''; req.on('data', c => { s += c; }); req.on('end', () => ok(s)); req.on('error', () => ok(s)); });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = req.query || {};
  const verify = process.env.IG_VERIFY_TOKEN || '';

  if (req.method === 'GET') {
    if (q['hub.mode'] === 'subscribe') {
      if (verify && q['hub.verify_token'] === verify) return res.status(200).send(q['hub.challenge']);
      return res.status(403).send('no');
    }
    if (q.a === 'assinar') {
      if (!verify || q.k !== verify) return res.status(403).json({ ok: false });
      if (!TK()) return res.status(400).json({ ok: false, erro: 'Falta IG_TOKEN no Vercel.' });
      const t = TK();
      const me = await fetch(IG() + '/' + CONTA() + '?fields=username,name&access_token=' + encodeURIComponent(t)).then(r => r.json()).catch(e => ({ error: { message: String(e) } }));
      const s = await fetch(IG() + '/' + CONTA() + '/subscribed_apps?subscribed_fields=comments,messages&access_token=' + encodeURIComponent(t), { method: 'POST' }).then(r => r.json()).catch(e => ({ error: { message: String(e) } }));
      const lista = await iscas();
      return res.status(200).json({ ok: !!me.username, tipo: t.slice(0, 3) + '…(' + t.length + ')', api: IG(), conta: me.username || null, erroConta: me.error && me.error.message, assinatura: s, iscas: lista.map(i => i.palavras.join('/') + ' -> ' + i.link) });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).end();
  let raw = await Promise.race([bruto(req), new Promise(ok => setTimeout(() => ok(''), 3000))]);
  if (!raw) { const x = req.body; raw = typeof x === 'string' ? x : Buffer.isBuffer(x) ? x.toString() : JSON.stringify(x || {}); }
  const seg = process.env.IG_APP_SECRET;
  if (seg) {
    const ass = String(req.headers['x-hub-signature-256'] || '');
    const esp = 'sha256=' + crypto.createHmac('sha256', seg).update(raw).digest('hex');
    if (ass.length !== esp.length || !crypto.timingSafeEqual(Buffer.from(ass), Buffer.from(esp))) { console.log('[ig] assinatura inválida'); return res.status(401).end(); }
  }
  let b = {}; try { b = JSON.parse(raw || '{}'); } catch (e) {}
  try {
    for (const e of b.entry || []) {
      for (const c of e.changes || []) if (c.field === 'comments') await comentario(e.id, c.value);
      for (const m of e.messaging || []) await mensagem(e.id, m);
    }
  } catch (err) { console.log('[ig] erro', err && err.message); }
  return res.status(200).send('EVENT_RECEIVED');
};

module.exports.config = { api: { bodyParser: false } };
